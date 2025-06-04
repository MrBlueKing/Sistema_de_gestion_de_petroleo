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
        // ===== CORREGIR FORMATO DE FECHAS =====
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));

        // ✅ CORREGIR: Asegurar formato correcto de fecha fin
        $fechaFinInput = $request->input('fecha_fin', Carbon::now()->format('Y-m-d'));
        $fechaFin = Carbon::parse($fechaFinInput)->format('Y-m-d') . ' 23:59:59';

        // 📝 LOG para verificar fechas
        Log::info("Fechas procesadas - Inicio: {$fechaInicio}, Fin: {$fechaFin}");

        $faena = $request->input('faena', null);
        $toneladas = $request->input('toneladas', 0); // Parámetro para las toneladas en el período

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

        // 1. Consumo por máquina - MODIFICADO: Quitar cálculos de medición del SELECT
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
            DB::raw('SUM(c.litros_consumidos) as litros_consumidos')
            // ❌ REMOVIDO: MIN/MAX de medición porque era incorrecto
        )
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.tipo_medicion', 'f.id_faena', 'f.ubicacion')
            ->orderBy('f.ubicacion')
            ->orderBy('m.nombre_maquina')
            ->get();

        // Calcular el costo y rendimiento para cada máquina
        foreach ($consumoPorMaquina as $maquina) {
            // ===== 1. CALCULAR RENDIMIENTO PRIMERO =====
            Log::info("Procesando máquina: {$maquina->nombre_maquina} (ID: {$maquina->id_maquina})");

            $rendimientoData = $this->calcularRendimientoMaquina(
                $maquina->id_maquina,
                $fechaInicio,
                $fechaFin,
                $maquina->tipo_medicion
            );

            // ===== 2. OBTENER CONSUMOS PARA COSTOS =====
            $consumos = DB::table('consumos')
                ->where('id_equipo', $maquina->id_maquina)
                ->where('id_faena', $maquina->id_faena)
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->get();

            $costoTotal = 0;
            $preciosDetalle = [];

            foreach ($consumos as $consumo) {
                // Obtener el precio más cercano a la fecha de consumo
                $precio = DB::table('ingresos_petroleo')
                    ->where('id_faena', $consumo->id_faena)
                    ->where('created_at', '<=', $consumo->fecha_consumo)
                    ->orderBy('created_at', 'desc')
                    ->value('precio') ?? 0;

                // Calcular el costo para este consumo específico
                $costoConsumo = $consumo->litros_consumidos * $precio;
                $costoTotal += $costoConsumo;

                // Guardar detalle de precios para referencia
                $preciosDetalle[] = [
                    'fecha' => $consumo->fecha_consumo,
                    'litros' => $consumo->litros_consumidos,
                    'precio_unitario' => $precio,
                    'costo' => $costoConsumo
                ];
            }

            // ===== 3. ASIGNAR TODOS LOS CAMPOS =====

            // Campos financieros
            $maquina->detalle_consumos = $preciosDetalle;
            $maquina->valor_consumo = $costoTotal;
            $maquina->precio_promedio = $maquina->litros_consumidos > 0 ? ($costoTotal / $maquina->litros_consumidos) : 0;

            // Campos de rendimiento
            $maquina->medicion_inicial = $rendimientoData['medicion_inicial'];
            $maquina->medicion_final = $rendimientoData['medicion_final'];
            $maquina->diferencia_medicion = $rendimientoData['diferencia_medicion'];
            $maquina->litros_por_unidad = $rendimientoData['litros_por_unidad'];
            $maquina->costo_por_unidad = $rendimientoData['costo_por_unidad'];
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

            // Log final para verificar
            Log::info("Rendimiento asignado a {$maquina->nombre_maquina}: {$maquina->litros_por_unidad} lts/{$maquina->unidad}");

            // Si hay toneladas, calcular valores por tonelada
            if ($toneladas > 0) {
                $maquina->litros_por_tonelada = $maquina->litros_consumidos / $toneladas;
                $maquina->costo_por_tonelada = $maquina->valor_consumo / $toneladas;
            }
        }

        // 2. Totales por faena con costos detallados (SIN CAMBIOS)
        $consumoPorFaena = DB::table('consumos as c')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->select(
                'f.id_faena',
                'f.ubicacion as nombre_faena',
                DB::raw('SUM(c.litros_consumidos) as litros_consumidos'),
                DB::raw('COUNT(DISTINCT c.id_equipo) as total_maquinas')
            )
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->orderBy('f.ubicacion')
            ->get();

        // Calcular el costo total para cada faena
        foreach ($consumoPorFaena as $faenaData) {
            // Obtener los consumos individuales para esta faena
            $consumos = DB::table('consumos')
                ->where('id_faena', $faenaData->id_faena)
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->get();

            $costoTotal = 0;

            foreach ($consumos as $consumo) {
                // Obtener el precio más cercano a la fecha de consumo
                $precio = DB::table('ingresos_petroleo')
                    ->where('id_faena', $consumo->id_faena)
                    ->where('created_at', '<=', $consumo->fecha_consumo)
                    ->orderBy('created_at', 'desc')
                    ->value('precio') ?? 0;

                // Calcular el costo para este consumo específico
                $costoTotal += $consumo->litros_consumidos * $precio;
            }

            // Añadir datos financieros detallados a la faena
            $faenaData->valor_consumo = $costoTotal;
            $faenaData->precio_promedio_consumo = $faenaData->litros_consumidos > 0 ? ($costoTotal / $faenaData->litros_consumidos) : 0;

            // Si hay toneladas, calcular valores por tonelada
            if ($toneladas > 0) {
                $faenaData->litros_por_tonelada = $faenaData->litros_consumidos / $toneladas;
                $faenaData->costo_por_tonelada = $faenaData->valor_consumo / $toneladas;
            }
        }

        // 3. Ingresos por faena con detalles financieros (SIN CAMBIOS)
        $ingresosPorFaena = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->whereBetween('ip.created_at', [$fechaInicio, $fechaFin])
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
            // Buscar el consumo correspondiente a esta faena
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

        // 4. Precios promedios por fecha para cada faena (SIN CAMBIOS)
        $preciosTendencia = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->whereBetween('ip.created_at', [$fechaInicio, $fechaFin])
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

        // 5. Datos de resumen general (SIN CAMBIOS)
        $totalConsumo = DB::table('consumos')
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->sum('litros_consumidos');

        $totalIngreso = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->sum('litros_recibidos');

        $valorIngreso = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->sum('precio_total');

        $precioPromedioIngreso = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->avg('precio');

        $valorConsumoTotal = 0;
        $consumosTotales = DB::table('consumos')
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->get();

        foreach ($consumosTotales as $consumo) {
            $precio = DB::table('ingresos_petroleo')
                ->where('id_faena', $consumo->id_faena)
                ->where('created_at', '<=', $consumo->fecha_consumo)
                ->orderBy('created_at', 'desc')
                ->value('precio') ?? 0;

            $valorConsumoTotal += $consumo->litros_consumidos * $precio;
        }

        $varianzaPrecios = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->select(DB::raw('STDDEV(precio) as varianza'))
            ->first();

        $resumenFinanciero = [
            'litros_ingresados' => $totalIngreso,
            'valor_ingresos' => $valorIngreso,
            'precio_promedio_compra' => $precioPromedioIngreso,
            'litros_consumidos' => $totalConsumo,
            'valor_consumos' => $valorConsumoTotal,
            'precio_promedio_consumo' => $totalConsumo > 0 ? ($valorConsumoTotal / $totalConsumo) : 0,
            'balance_litros' => $totalIngreso - $totalConsumo,
            'balance_financiero' => $valorIngreso - $valorConsumoTotal,
            'porcentaje_utilizado' => $totalIngreso > 0 ? ($totalConsumo / $totalIngreso) * 100 : 0,
            'varianza_precios' => $varianzaPrecios ? $varianzaPrecios->varianza : 0
        ];

        if ($toneladas > 0) {
            $resumenFinanciero['toneladas'] = $toneladas;
            $resumenFinanciero['litros_por_tonelada'] = $totalConsumo / $toneladas;
            $resumenFinanciero['costo_por_tonelada'] = $valorConsumoTotal / $toneladas;
            $resumenFinanciero['ingreso_por_tonelada'] = 0;
        }

        // 6. Calcular rendimiento por tipo de máquina - MODIFICADO
        $rendimientoTipos = [];
        $tiposMaquinas = DB::table('categorias_maquinas')->get();

        foreach ($tiposMaquinas as $tipo) {
            $rendimiento = [
                'tipo' => $tipo->nombre_categoria,
                'tipo_medicion' => $tipo->tipo_medicion,
                'litros_consumidos' => 0,
                'total_unidades' => 0,
                'valor_consumo' => 0
            ];

            // Consumo total para este tipo de máquina
            $consumoCategoria = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->where('m.id_categoria', $tipo->id_categoria)
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->sum('c.litros_consumidos');

            // ===== MODIFICADO: Usar tu método para calcular total de unidades =====
            $totalUnidades = 0;
            $costoCategoria = 0;
            $maquinasCategoria = DB::table('maquinas')
                ->where('id_categoria', $tipo->id_categoria)
                ->get();

            foreach ($maquinasCategoria as $maqCat) {
                // ===== USAR TU MÉTODO en lugar de MIN/MAX =====
                $rendimientoMaq = $this->calcularRendimientoMaquina(
                    $maqCat->id_maquina,
                    $fechaInicio,
                    $fechaFin,
                    $tipo->tipo_medicion
                );

                $totalUnidades += $rendimientoMaq['diferencia_medicion'];

                // Costo de consumo para esta máquina (SIN CAMBIOS)
                $consumosMaquina = DB::table('consumos')
                    ->where('id_equipo', $maqCat->id_maquina)
                    ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                    ->get();

                foreach ($consumosMaquina as $consumo) {
                    $precio = DB::table('ingresos_petroleo')
                        ->where('id_faena', $consumo->id_faena)
                        ->where('created_at', '<=', $consumo->fecha_consumo)
                        ->orderBy('created_at', 'desc')
                        ->value('precio') ?? 0;

                    $costoCategoria += $consumo->litros_consumidos * $precio;
                }
            }

            $rendimiento['litros_consumidos'] = $consumoCategoria;
            $rendimiento['total_unidades'] = $totalUnidades;
            $rendimiento['valor_consumo'] = $costoCategoria;

            if ($totalUnidades > 0) {
                $rendimiento['litros_por_unidad'] = $consumoCategoria / $totalUnidades;
                $rendimiento['costo_por_unidad'] = $costoCategoria / $totalUnidades;
                $rendimiento['unidad'] = $tipo->tipo_medicion === 'Horometro' ? 'hr' : 'km';
            } else {
                $rendimiento['litros_por_unidad'] = 0;
                $rendimiento['costo_por_unidad'] = 0;
                $rendimiento['unidad'] = $tipo->tipo_medicion === 'Horometro' ? 'hr' : 'km';
            }

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
    // Al final de la clase, agregar:
    private function interpretarRendimiento($rendimiento, $tipoMedicion)
    {
        if ($rendimiento <= 0) {
            return 'Sin datos suficientes';
        }

        if ($tipoMedicion === 'Kilometraje') {
            // Para camiones - litros por kilómetro
            if ($rendimiento > 3) {
                return 'Consumo alto - revisar eficiencia';
            } elseif ($rendimiento > 1.5) {
                return 'Consumo moderado - dentro del rango normal';
            } else {
                return 'Consumo eficiente';
            }
        } else {
            // Para maquinaria - litros por hora
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
     * ===== MÉTODO PRINCIPAL: Calcular rendimiento según tu especificación =====
     */
    private function calcularRendimientoMaquina($idMaquina, $fechaInicio, $fechaFin, $tipoMedicion)
    {
        Log::info("=== INICIANDO CÁLCULO RENDIMIENTO MÁQUINA {$idMaquina} ===");

        // Buscar PRIMER consumo del rango con medición
        $primerConsumo = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('medicion')
            ->where('medicion', '>', 0)
            ->orderBy('fecha_consumo', 'asc')
            ->first();

        // Buscar ÚLTIMO consumo del rango con medición
        $ultimoConsumo = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('medicion')
            ->where('medicion', '>', 0)
            ->orderBy('fecha_consumo', 'desc')
            ->first();

        Log::info("Primer consumo encontrado: " . ($primerConsumo ? json_encode($primerConsumo) : 'NULL'));
        Log::info("Último consumo encontrado: " . ($ultimoConsumo ? json_encode($ultimoConsumo) : 'NULL'));

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

        // ===== TU FÓRMULA: Última medición - Primera medición =====
        $medicionInicial = (float) $primerConsumo->medicion;
        $medicionFinal = (float) $ultimoConsumo->medicion;
        $diferenciaMedicion = $medicionFinal - $medicionInicial;

        Log::info("Medición inicial: {$medicionInicial}, Medición final: {$medicionFinal}, Diferencia: {$diferenciaMedicion}");

        // Validar que la diferencia sea lógica
        if ($diferenciaMedicion <= 0) {
            Log::warning("Diferencia inválida para máquina {$idMaquina}: {$diferenciaMedicion}");
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

        // Calcular total de litros consumidos por esta máquina en el rango
        $totalLitros = (float) DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->sum('litros_consumidos');

        // Calcular total de costo
        $totalCosto = 0;
        $consumos = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->get();

        foreach ($consumos as $consumo) {
            $precio = DB::table('ingresos_petroleo')
                ->where('id_faena', $consumo->id_faena)
                ->where('created_at', '<=', $consumo->fecha_consumo)
                ->orderBy('created_at', 'desc')
                ->value('precio') ?? 0;

            $totalCosto += $consumo->litros_consumidos * $precio;
        }

        // ===== CALCULAR RENDIMIENTO =====
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

        // Consulta base para faenas
        $queryFaenas = DB::table('faenas');

        // Filtrar por faena si se especifica
        if ($faena && $faena !== 'todas') {
            $queryFaenas->where('id_faena', $faena);
        }

        $faenas = $queryFaenas->get();

        $balances = [];

        foreach ($faenas as $faena) {
            // Stock inicial al comienzo del período
            $stockInicial = DB::table('stock_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->where('ultima_actualizacion', '<', $fechaInicio)
                ->orderBy('ultima_actualizacion', 'desc')
                ->value('stock_actual') ?? 0;

            // Total ingresos en el período
            $totalIngresos = DB::table('ingresos_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->sum('litros_recibidos');

            // Total consumos en el período
            $totalConsumos = DB::table('consumos')
                ->where('id_faena', $faena->id_faena)
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->sum('litros_consumidos');

            // Stock final teorico
            $stockFinalTeorico = $stockInicial + $totalIngresos - $totalConsumos;

            // Stock actual según la tabla stock_petroleo
            $stockActual = DB::table('stock_petroleo')
                ->where('id_faena', $faena->id_faena)
                ->orderBy('ultima_actualizacion', 'desc')
                ->value('stock_actual') ?? 0;

            // Diferencia (pérdidas o ganancias no registradas)
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
}
