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
        Log::info('Iniciando consulta de consumo de máquinas', ['data_recibida' => $request->all()]);
        // Asegurar que fecha_fin incluya todo el día
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin = $request->input('fecha_fin', Carbon::now()->format('Y-m-d') . ' 23:59:59');
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

        // 1. Consumo por máquina
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
            DB::raw('MIN(c.medicion) as medicion_inicial'),
            DB::raw('MAX(c.medicion) as medicion_final'),
            DB::raw('(MAX(c.medicion) - MIN(c.medicion)) as diferencia_medicion'),
            DB::raw('SUM(c.litros_consumidos) as litros_consumidos')
        )
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.tipo_medicion', 'f.id_faena', 'f.ubicacion')
            ->orderBy('f.ubicacion')
            ->orderBy('m.nombre_maquina')
            ->get();

        // Calcular el costo para cada máquina
        foreach ($consumoPorMaquina as $maquina) {
            // Obtener los consumos individuales para esta máquina
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

            // Añadir campos financieros detallados a la máquina
            $maquina->detalle_consumos = $preciosDetalle;
            $maquina->valor_consumo = $costoTotal;
            $maquina->precio_promedio = $maquina->litros_consumidos > 0 ? ($costoTotal / $maquina->litros_consumidos) : 0;

            // Calcular eficiencia según tipo de medición
            if ($maquina->diferencia_medicion > 0) {
                $maquina->litros_por_unidad = $maquina->litros_consumidos / $maquina->diferencia_medicion;
                $maquina->costo_por_unidad = $maquina->valor_consumo / $maquina->diferencia_medicion;
                $maquina->unidad = $maquina->tipo_medicion === 'Horometro' ? 'hr' : 'km';
            } else {
                $maquina->litros_por_unidad = 0;
                $maquina->costo_por_unidad = 0;
                $maquina->unidad = $maquina->tipo_medicion === 'Horometro' ? 'hr' : 'km';
            }

            // Si hay toneladas, calcular valores por tonelada
            if ($toneladas > 0) {
                $maquina->litros_por_tonelada = $maquina->litros_consumidos / $toneladas;
                $maquina->costo_por_tonelada = $maquina->valor_consumo / $toneladas;
            }
        }

        // 2. Totales por faena con costos detallados
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

        // 3. Ingresos por faena con detalles financieros
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

        // 4. Precios promedios por fecha para cada faena (para tendencias)
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

        // 5. Datos de resumen general con detalles financieros
        // Consumo total
        $totalConsumo = DB::table('consumos')
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->sum('litros_consumidos');

        // Ingresos totales
        $totalIngreso = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->sum('litros_recibidos');

        // Valor de ingresos
        $valorIngreso = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->sum('precio_total');

        // Precio promedio de ingresos
        $precioPromedioIngreso = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->avg('precio');

        // Calcular valor total de consumos
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

        // Calcular varianza de precios
        $varianzaPrecios = DB::table('ingresos_petroleo')
            ->whereBetween('created_at', [$fechaInicio, $fechaFin])
            ->select(DB::raw('STDDEV(precio) as varianza'))
            ->first();

        // Crear resumen financiero detallado
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

        // Añadir KPIs por tonelada si se proporciona el parámetro
        if ($toneladas > 0) {
            $resumenFinanciero['toneladas'] = $toneladas;
            $resumenFinanciero['litros_por_tonelada'] = $totalConsumo / $toneladas;
            $resumenFinanciero['costo_por_tonelada'] = $valorConsumoTotal / $toneladas;
            $resumenFinanciero['ingreso_por_tonelada'] = 0; // Necesitas un valor de ingreso por tonelada si lo tienes
        }

        // 6. Calcular rendimiento por tipo de máquina
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

            // Total de unidades (km u horas) para este tipo de máquina
            $totalUnidades = 0;
            $costoCategoria = 0;
            $maquinasCategoria = DB::table('maquinas')
                ->where('id_categoria', $tipo->id_categoria)
                ->get();

            foreach ($maquinasCategoria as $maqCat) {
                // Mediciones inicial y final
                $primeraLectura = DB::table('consumos')
                    ->where('id_equipo', $maqCat->id_maquina)
                    ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                    ->orderBy('fecha_consumo', 'asc')
                    ->value('medicion');

                $ultimaLectura = DB::table('consumos')
                    ->where('id_equipo', $maqCat->id_maquina)
                    ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                    ->orderBy('fecha_consumo', 'desc')
                    ->value('medicion');

                if ($primeraLectura && $ultimaLectura) {
                    $totalUnidades += ($ultimaLectura - $primeraLectura);
                }

                // Costo de consumo para esta máquina
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
