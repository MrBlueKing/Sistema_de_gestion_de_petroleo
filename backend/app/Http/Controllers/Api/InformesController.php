<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class InformesController extends Controller
{
    public function getConsumoMaquinas(Request $request)
    {
        // Asegurar que fecha_fin incluya todo el día
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFinInput = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));
        $fechaFin = Carbon::parse($fechaFinInput)->format('Y-m-d') . ' 23:59:59';

        Log::info("Fechas procesadas - Inicio: {$fechaInicio}, Fin: {$fechaFin}");

        $faena = $request->input('faena', null);
        $toneladas = $request->input('toneladas', 0);

        // Consulta base
        $query = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin]);

        // Filtrar por faena si se especifica
        if ($faena && $faena !== 'todas') {
            $query->where('c.id_faena', $faena);
        }

        // 1. Consumo por máquina - CORREGIDO: Usar precio_litro de consumos
        $consumoPorMaquina = clone $query;
        $consumoPorMaquina = $consumoPorMaquina->select(
            'm.id_maquina',
            'm.nombre_maquina',
            'm.patente',
            'cm.tipo_medicion',
            'f.id_faena',
            'f.ubicacion as nombre_faena',
            DB::raw('MIN(c.fecha_consumo) as primera_fecha'),
            DB::raw('MAX(c.fecha_consumo) as ultima_fecha'),
            DB::raw('SUM(c.litros_consumidos) as litros_consumidos'),
            // ✅ AGREGAR: Cálculos de costo usando precio_litro de consumos
            DB::raw('SUM(c.litros_consumidos * COALESCE(c.precio_litro, 0)) as valor_consumo'),
            DB::raw('AVG(COALESCE(c.precio_litro, 0)) as precio_promedio')
        )
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.tipo_medicion', 'f.id_faena', 'f.ubicacion')
            ->orderBy('f.ubicacion')
            ->orderBy('m.nombre_maquina')
            ->get();

        // Procesar cada máquina
        foreach ($consumoPorMaquina as $maquina) {
            Log::info("Procesando máquina: {$maquina->nombre_maquina} (ID: {$maquina->id_maquina})");

            // ===== 1. CALCULAR RENDIMIENTO =====
            $rendimientoData = $this->calcularRendimientoMaquina(
                $maquina->id_maquina,
                $fechaInicio,
                $fechaFin,
                $maquina->tipo_medicion
            );

            // ===== 2. OBTENER DETALLE DE CONSUMOS CON PRECIOS CORREGIDOS =====
            $consumos = DB::table('consumos')
                ->where('id_equipo', $maquina->id_maquina)
                ->where('id_faena', $maquina->id_faena)
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->select([
                    'fecha_consumo',
                    'litros_consumidos',
                    'precio_litro', // ✅ USAR DIRECTAMENTE el precio almacenado
                    DB::raw('litros_consumidos * COALESCE(precio_litro, 0) as costo_consumo')
                ])
                ->get();

            $preciosDetalle = [];
            foreach ($consumos as $consumo) {
                $preciosDetalle[] = [
                    'fecha' => $consumo->fecha_consumo,
                    'litros' => (float) $consumo->litros_consumidos,
                    'precio_unitario' => (float) ($consumo->precio_litro ?? 0),
                    'costo' => (float) $consumo->costo_consumo
                ];
            }

            // ===== 3. ASIGNAR CAMPOS CALCULADOS =====

            // Campos financieros (ya calculados en la consulta SQL)
            $maquina->detalle_consumos = $preciosDetalle;
            $maquina->valor_consumo = (float) $maquina->valor_consumo;
            $maquina->precio_promedio = (float) $maquina->precio_promedio;

            // Campos de rendimiento
            $maquina->medicion_inicial = $rendimientoData['medicion_inicial'];
            $maquina->medicion_final = $rendimientoData['medicion_final'];
            $maquina->diferencia_medicion = $rendimientoData['diferencia_medicion'];
            $maquina->litros_por_unidad = $rendimientoData['litros_por_unidad'];

            // ✅ CORREGIR: Cálculo de costo por unidad usando el valor ya calculado
            $maquina->costo_por_unidad = $rendimientoData['diferencia_medicion'] > 0
                ? round($maquina->valor_consumo / $rendimientoData['diferencia_medicion'], 2)
                : 0;

            $maquina->unidad = $rendimientoData['unidad'];
            $maquina->metodo_calculo = $rendimientoData['metodo'];
            $maquina->detalle_mediciones = $rendimientoData['detalle'];

            // Campo específico para el rendimiento
            $maquina->rendimiento = [
                'valor' => $rendimientoData['litros_por_unidad'],
                'unidad' => $rendimientoData['unidad'],
                'texto' => $rendimientoData['litros_por_unidad'] . ' lts/' . $rendimientoData['unidad'],
                'interpretacion' => $this->interpretarRendimiento($rendimientoData['litros_por_unidad'], $maquina->tipo_medicion)
            ];

            // Si hay toneladas, calcular valores por tonelada
            if ($toneladas > 0) {
                $maquina->litros_por_tonelada = (float) $maquina->litros_consumidos / $toneladas;
                $maquina->costo_por_tonelada = $maquina->valor_consumo / $toneladas;
            }

            Log::info("Valores calculados para {$maquina->nombre_maquina}: Valor consumo: {$maquina->valor_consumo}, Precio promedio: {$maquina->precio_promedio}");
        }

        // 2. Totales por faena - CORREGIDO: Usar precio_litro de consumos
        $consumoPorFaena = DB::table('consumos as c')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->when($faena && $faena !== 'todas', function ($query) use ($faena) {
                return $query->where('c.id_faena', $faena);
            })
            ->select(
                'f.id_faena',
                'f.ubicacion as nombre_faena',
                DB::raw('SUM(c.litros_consumidos) as litros_consumidos'),
                DB::raw('COUNT(DISTINCT c.id_equipo) as total_maquinas'),
                // ✅ AGREGAR: Cálculos usando precio_litro
                DB::raw('SUM(c.litros_consumidos * COALESCE(c.precio_litro, 0)) as valor_consumo'),
                DB::raw('AVG(COALESCE(c.precio_litro, 0)) as precio_promedio_consumo')
            )
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->orderBy('f.ubicacion')
            ->get();

        // Procesar datos adicionales para faenas
        foreach ($consumoPorFaena as $faenaData) {
            $faenaData->valor_consumo = (float) $faenaData->valor_consumo;
            $faenaData->precio_promedio_consumo = (float) $faenaData->precio_promedio_consumo;

            // Si hay toneladas, calcular valores por tonelada
            if ($toneladas > 0) {
                $faenaData->litros_por_tonelada = (float) $faenaData->litros_consumidos / $toneladas;
                $faenaData->costo_por_tonelada = $faenaData->valor_consumo / $toneladas;
            }
        }

        // 3. Ingresos por faena (SIN CAMBIOS - esta sí viene de ingresos_petroleo)
        $ingresosPorFaena = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->whereBetween('ip.created_at', [$fechaInicio, $fechaFin])
            ->when($faena && $faena !== 'todas', function ($query) use ($faena) {
                return $query->where('ip.id_faena', $faena);
            })
            ->select(
                'f.id_faena',
                'f.ubicacion as nombre_faena',
                DB::raw('SUM(ip.litros_recibidos) as litros_recibidos'),
                DB::raw('SUM(ip.litros_documentados) as litros_documentados'),
                DB::raw('SUM(ip.precio_total) as valor_ingreso'),
                DB::raw('AVG(ip.precio) as precio_promedio')
            )
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->orderBy('f.ubicacion')
            ->get();

        // Añadir datos de balance por faena
        foreach ($ingresosPorFaena as $ingreso) {
            $consumoFaena = $consumoPorFaena->where('id_faena', $ingreso->id_faena)->first();

            if ($consumoFaena) {
                $ingreso->balance_litros = $ingreso->litros_recibidos - $consumoFaena->litros_consumidos;
                $ingreso->balance_valor = $ingreso->valor_ingreso - $consumoFaena->valor_consumo;
                $ingreso->porcentaje_utilizado = $ingreso->litros_recibidos > 0 ?
                    ($consumoFaena->litros_consumidos / $ingreso->litros_recibidos) * 100 : 0;
            } else {
                $ingreso->balance_litros = $ingreso->litros_recibidos;
                $ingreso->balance_valor = $ingreso->valor_ingreso;
                $ingreso->porcentaje_utilizado = 0;
            }
        }

        // 4. Precios tendencia (SIN CAMBIOS)
        $preciosTendencia = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->whereBetween('ip.created_at', [$fechaInicio, $fechaFin])
            ->when($faena && $faena !== 'todas', function ($query) use ($faena) {
                return $query->where('ip.id_faena', $faena);
            })
            ->select(
                'f.id_faena',
                'f.ubicacion as nombre_faena',
                DB::raw('DATE(ip.created_at) as fecha'),
                DB::raw('AVG(ip.precio) as precio_promedio'),
                DB::raw('SUM(ip.litros_recibidos) as litros_dia'),
                DB::raw('SUM(ip.precio_total) as valor_dia')
            )
            ->groupBy('f.id_faena', 'f.ubicacion', DB::raw('DATE(ip.created_at)'))
            ->orderBy('f.ubicacion')
            ->orderBy('fecha')
            ->get();

        // 5. Datos de resumen general - CORREGIDO
        $resumenConsumos = DB::table('consumos')
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->when($faena && $faena !== 'todas', function ($query) use ($faena) {
                return $query->where('id_faena', $faena);
            })
            ->select(
                DB::raw('SUM(litros_consumidos) as total_consumo'),
                DB::raw('SUM(litros_consumidos * COALESCE(precio_litro, 0)) as valor_consumo_total'),
                DB::raw('AVG(COALESCE(precio_litro, 0)) as precio_promedio_consumo')
            )
            ->first();

        $resumenIngresos = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->when($faena && $faena !== 'todas', function ($query) use ($faena) {
                return $query->where('id_faena', $faena);
            })
            ->select(
                DB::raw('SUM(litros_recibidos) as total_ingreso'),
                DB::raw('SUM(precio_total) as valor_ingreso'),
                DB::raw('AVG(precio) as precio_promedio_ingreso'),
                DB::raw('STDDEV(precio) as varianza_precios')
            )
            ->first();

        $resumenFinanciero = [
            'litros_ingresados' => (float) ($resumenIngresos->total_ingreso ?? 0),
            'valor_ingresos' => (float) ($resumenIngresos->valor_ingreso ?? 0),
            'precio_promedio_compra' => (float) ($resumenIngresos->precio_promedio_ingreso ?? 0),
            'litros_consumidos' => (float) ($resumenConsumos->total_consumo ?? 0),
            'valor_consumos' => (float) ($resumenConsumos->valor_consumo_total ?? 0),
            'precio_promedio_consumo' => (float) ($resumenConsumos->precio_promedio_consumo ?? 0),
            'balance_litros' => (float) (($resumenIngresos->total_ingreso ?? 0) - ($resumenConsumos->total_consumo ?? 0)),
            'balance_financiero' => (float) (($resumenIngresos->valor_ingreso ?? 0) - ($resumenConsumos->valor_consumo_total ?? 0)),
            'porcentaje_utilizado' => ($resumenIngresos->total_ingreso ?? 0) > 0 ?
                (($resumenConsumos->total_consumo ?? 0) / ($resumenIngresos->total_ingreso ?? 0)) * 100 : 0,
            'varianza_precios' => (float) ($resumenIngresos->varianza_precios ?? 0)
        ];

        if ($toneladas > 0) {
            $resumenFinanciero['toneladas'] = $toneladas;
            $resumenFinanciero['litros_por_tonelada'] = ($resumenConsumos->total_consumo ?? 0) / $toneladas;
            $resumenFinanciero['costo_por_tonelada'] = ($resumenConsumos->valor_consumo_total ?? 0) / $toneladas;
        }

        // 6. Calcular rendimiento por tipo de máquina - CORREGIDO
        $rendimientoTipos = [];
        $tiposMaquinas = DB::table('categorias_maquinas')->get();

        foreach ($tiposMaquinas as $tipo) {
            // ✅ CONSULTA CORREGIDA: Usar precio_litro de consumos
            $consumoCategoria = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->where('m.id_categoria', $tipo->id_categoria)
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->when($faena && $faena !== 'todas', function ($query) use ($faena) {
                    return $query->where('c.id_faena', $faena);
                })
                ->select(
                    DB::raw('SUM(c.litros_consumidos) as total_litros'),
                    DB::raw('SUM(c.litros_consumidos * COALESCE(c.precio_litro, 0)) as total_costo')
                )
                ->first();

            $totalUnidades = 0;
            $maquinasCategoria = DB::table('maquinas')
                ->where('id_categoria', $tipo->id_categoria)
                ->get();

            foreach ($maquinasCategoria as $maqCat) {
                $rendimientoMaq = $this->calcularRendimientoMaquina(
                    $maqCat->id_maquina,
                    $fechaInicio,
                    $fechaFin,
                    $tipo->tipo_medicion
                );
                $totalUnidades += $rendimientoMaq['diferencia_medicion'];
            }

            $rendimiento = [
                'tipo' => $tipo->nombre_categoria,
                'tipo_medicion' => $tipo->tipo_medicion,
                'litros_consumidos' => (float) ($consumoCategoria->total_litros ?? 0),
                'total_unidades' => $totalUnidades,
                'valor_consumo' => (float) ($consumoCategoria->total_costo ?? 0),
                'litros_por_unidad' => $totalUnidades > 0 ?
                    ($consumoCategoria->total_litros ?? 0) / $totalUnidades : 0,
                'costo_por_unidad' => $totalUnidades > 0 ?
                    ($consumoCategoria->total_costo ?? 0) / $totalUnidades : 0,
                'unidad' => $tipo->tipo_medicion === 'Horometro' ? 'hr' : 'km'
            ];

            $rendimientoTipos[] = $rendimiento;
        }

        return response()->json([
            'status' => 'success',
            'periodo' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin
            ],
            'data' => [
                'consumo_por_maquina' => $consumoPorMaquina,
                'consumo_por_faena' => $consumoPorFaena,
                'ingresos_por_faena' => $ingresosPorFaena,
                'precios_tendencia' => $preciosTendencia,
                'rendimiento_por_tipo' => $rendimientoTipos,
                'resumen_financiero' => $resumenFinanciero
            ]
        ]);
    }

    /**
     * MÉTODO AUXILIAR: Interpretar rendimiento
     */
    private function interpretarRendimiento($rendimiento, $tipoMedicion)
    {
        if ($rendimiento <= 0) {
            return 'Sin datos suficientes';
        }

        if ($tipoMedicion === 'Kilometraje') {
            if ($rendimiento > 3) {
                return 'Consumo alto - revisar eficiencia';
            } elseif ($rendimiento > 1.5) {
                return 'Consumo moderado - dentro del rango normal';
            } else {
                return 'Consumo eficiente';
            }
        } else {
            if ($rendimiento > 20) {
                return 'Consumo alto - revisar condiciones operativas';
            } elseif ($rendimiento > 10) {
                return 'Consumo moderado - rango operativo normal';
            } else {
                return 'Consumo bajo - operación eficiente';
            }
        }
    }

    /**
     * MÉTODO DE PRUEBA: Endpoint específico para verificar rendimientos
     */
    public function testRendimientoMaquinas(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio', '2025-03-01');
        $fechaFin = $request->input('fecha_fin', '2025-03-08');

        $maquinas = DB::table('maquinas as m')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->select('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.tipo_medicion')
            ->get();

        $rendimientos = [];

        foreach ($maquinas as $maquina) {
            $rendimiento = $this->calcularRendimientoMaquina(
                $maquina->id_maquina,
                $fechaInicio,
                $fechaFin,
                $maquina->tipo_medicion
            );

            $rendimientos[] = [
                'maquina' => $maquina->nombre_maquina,
                'patente' => $maquina->patente,
                'tipo_medicion' => $maquina->tipo_medicion,
                'rendimiento_calculado' => $rendimiento
            ];
        }

        return response()->json([
            'success' => true,
            'rendimientos_por_maquina' => $rendimientos,
            'mensaje' => 'Test específico de rendimientos - revisar logs para detalles'
        ]);
    }

    /**
     * ===== MÉTODO PRINCIPAL: Calcular rendimiento =====
     */
    private function calcularRendimientoMaquina($idMaquina, $fechaInicio, $fechaFin, $tipoMedicion)
    {
        Log::info("=== INICIANDO CÁLCULO RENDIMIENTO MÁQUINA {$idMaquina} ===");

        $primerConsumo = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('medicion')
            ->where('medicion', '>', 0)
            ->orderBy('fecha_consumo', 'asc')
            ->first();

        $ultimoConsumo = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('medicion')
            ->where('medicion', '>', 0)
            ->orderBy('fecha_consumo', 'desc')
            ->first();

        if (!$primerConsumo || !$ultimoConsumo) {
            Log::warning("Sin mediciones válidas para máquina {$idMaquina}");
            return [
                'medicion_inicial' => 0,
                'medicion_final' => 0,
                'diferencia_medicion' => 0,
                'litros_por_unidad' => 0,
                'costo_por_unidad' => 0,
                'unidad' => $tipoMedicion === 'Horometro' ? 'hr' : 'km',
                'metodo' => 'sin_mediciones',
                'detalle' => 'No se encontraron mediciones válidas en el rango'
            ];
        }

        $medicionInicial = (float) $primerConsumo->medicion;
        $medicionFinal = (float) $ultimoConsumo->medicion;
        $diferenciaMedicion = $medicionFinal - $medicionInicial;

        if ($diferenciaMedicion <= 0) {
            return [
                'medicion_inicial' => $medicionInicial,
                'medicion_final' => $medicionFinal,
                'diferencia_medicion' => 0,
                'litros_por_unidad' => 0,
                'costo_por_unidad' => 0,
                'unidad' => $tipoMedicion === 'Horometro' ? 'hr' : 'km',
                'metodo' => 'diferencia_invalida',
                'detalle' => "Diferencia inválida: {$medicionFinal} - {$medicionInicial} = {$diferenciaMedicion}"
            ];
        }

        // ✅ CORREGIDO: Calcular total usando precio_litro de consumos
        $resumenConsumo = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->select(
                DB::raw('SUM(litros_consumidos) as total_litros'),
                DB::raw('SUM(litros_consumidos * COALESCE(precio_litro, 0)) as total_costo')
            )
            ->first();

        $totalLitros = (float) ($resumenConsumo->total_litros ?? 0);
        $totalCosto = (float) ($resumenConsumo->total_costo ?? 0);

        $litrosPorUnidad = $diferenciaMedicion > 0 ? ($totalLitros / $diferenciaMedicion) : 0;
        $costoPorUnidad = $diferenciaMedicion > 0 ? ($totalCosto / $diferenciaMedicion) : 0;

        Log::info("RESULTADO - Litros por unidad: {$litrosPorUnidad}, Costo por unidad: {$costoPorUnidad}");

        return [
            'medicion_inicial' => $medicionInicial,
            'medicion_final' => $medicionFinal,
            'diferencia_medicion' => $diferenciaMedicion,
            'litros_por_unidad' => round($litrosPorUnidad, 2),
            'costo_por_unidad' => round($costoPorUnidad, 2),
            'unidad' => $tipoMedicion === 'Horometro' ? 'hr' : 'km',
            'metodo' => 'primera_menos_ultima_medicion',
            'detalle' => [
                'primer_consumo' => [
                    'fecha' => $primerConsumo->fecha_consumo,
                    'medicion' => $medicionInicial
                ],
                'ultimo_consumo' => [
                    'fecha' => $ultimoConsumo->fecha_consumo,
                    'medicion' => $medicionFinal
                ],
                'total_litros_periodo' => $totalLitros,
                'total_costo_periodo' => $totalCosto,
                'formula' => "{$totalLitros}L ÷ {$diferenciaMedicion}" . ($tipoMedicion === 'Horometro' ? 'h' : 'km') . " = " . round($litrosPorUnidad, 2)
            ]
        ];
    }

    // Mantener el método getBalanceCombustible sin cambios
    public function getBalanceCombustible(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));
        $faena = $request->input('faena', null);

        $queryFaenas = DB::table('faenas');

        if ($faena && $faena !== 'todas') {
            $queryFaenas->where('id_faena', $faena);
        }

        $faenas = $queryFaenas->get();
        $balances = [];

        foreach ($faenas as $faena) {
            $stockInicial = DB::table('stock_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->where('ultima_actualizacion', '<', $fechaInicio)
                ->orderBy('ultima_actualizacion', 'desc')
                ->value('stock_actual') ?? 0;

            $totalIngresos = DB::table('ingresos_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->sum('litros_recibidos');

            $totalConsumos = DB::table('consumos')
                ->where('id_faena', $faena->id_faena)
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->sum('litros_consumidos');

            $stockFinalTeorico = $stockInicial + $totalIngresos - $totalConsumos;

            $stockActual = DB::table('stock_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->orderBy('ultima_actualizacion', 'desc')
                ->value('stock_actual') ?? 0;

            $diferencia = $stockActual - $stockFinalTeorico;

            $balances[] = [
                'id_faena' => $faena->id_faena,
                'nombre_faena' => $faena->ubicacion,
                'stock_inicial' => $stockInicial,
                'total_ingresos' => $totalIngresos,
                'total_consumos' => $totalConsumos,
                'stock_final_teorico' => $stockFinalTeorico,
                'stock_actual' => $stockActual,
                'diferencia' => $diferencia
            ];
        }

        return response()->json([
            'status' => 'success',
            'periodo' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin
            ],
            'data' => $balances
        ]);
    }

    /**
     * ✅ NUEVO: Endpoint para verificar precios en consumos
     */
    public function verificarPreciosConsumos(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio', '2025-03-01');
        $fechaFin = $request->input('fecha_fin', '2025-03-08');
        $faena = $request->input('faena', null);

        // Agregar filtro de faena si se especifica
        $queryBase = DB::table('consumos')
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);

        if ($faena && $faena !== 'todas') {
            $queryBase->where('id_faena', $faena);
        }

        // Verificar consumos con y sin precios
        $estadisticasPrecios = $queryBase->select([
            DB::raw('COUNT(*) as total_consumos'),
            DB::raw('COUNT(precio_litro) as consumos_con_precio'),
            DB::raw('SUM(CASE WHEN precio_litro IS NULL OR precio_litro = 0 THEN 1 ELSE 0 END) as consumos_sin_precio'),
            DB::raw('MIN(precio_litro) as precio_minimo'),
            DB::raw('MAX(precio_litro) as precio_maximo'),
            DB::raw('AVG(precio_litro) as precio_promedio'),
            DB::raw('SUM(litros_consumidos) as total_litros'),
            DB::raw('SUM(litros_consumidos * COALESCE(precio_litro, 0)) as valor_total')
        ])
            ->first();

        // Consumos detallados para verificación
        $queryDetalle = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin]);

        if ($faena && $faena !== 'todas') {
            $queryDetalle->where('c.id_faena', $faena);
        }

        $consumosDetalle = $queryDetalle->select([
            'c.id_consumo',
            'c.fecha_consumo',
            'm.nombre_maquina',
            'f.ubicacion as faena',
            'c.litros_consumidos',
            'c.precio_litro',
            DB::raw('c.litros_consumidos * COALESCE(c.precio_litro, 0) as costo_calculado')
        ])
            ->orderBy('c.fecha_consumo')
            ->get();

        return response()->json([
            'status' => 'success',
            'success' => true, // ✅ AGREGAR para compatibilidad
            'periodo' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin
            ],
            'estadisticas_precios' => $estadisticasPrecios,
            'consumos_detalle' => $consumosDetalle,
            'mensaje' => 'Verificación de precios en tabla consumos'
        ]);
    }

    /**
     * ✅ NUEVO: Endpoint para verificar último ingreso por faena
     */
   public function verificarUltimoIngreso(Request $request)
    {
        $faenas = DB::table('faenas')->get();
        $ultimosIngresos = [];

        foreach ($faenas as $faena) {
            $ultimoIngreso = DB::table('ingresos_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->orderBy('created_at', 'desc')
                ->first();

            $ultimosIngresos[] = [
                'faena' => $faena->ubicacion,
                'ultimo_ingreso' => $ultimoIngreso ? [
                    'fecha' => $ultimoIngreso->created_at,
                    'precio' => $ultimoIngreso->precio,
                    'litros' => $ultimoIngreso->litros_recibidos
                ] : null
            ];
        }

        return response()->json([
            'status' => 'success',
            'ultimos_ingresos_por_faena' => $ultimosIngresos,
            'mensaje' => 'Últimos ingresos registrados por faena'
        ]);
    }
}
