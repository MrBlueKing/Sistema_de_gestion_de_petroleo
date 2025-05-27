<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProduccionController extends Controller
{
    /**
     * Dashboard principal de producción
     */
    public function dashboard(Request $request)
    {
        try {
            $fechaHoy = Carbon::today();
            $fechaAyer = Carbon::yesterday();
            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();

            // Resumen general
            $resumen = [
                'toneladas_hoy' => $this->getTonelajesPorFecha($fechaHoy),
                'toneladas_ayer' => $this->getTonelajesPorFecha($fechaAyer),
                'toneladas_mes' => $this->getTonelajesPorRango($inicioMes, $finMes),
                'metas_cumplimiento' => $this->getMetasCumplimiento(),
                'plantas_activas' => $this->getPlantasActivas(),
                'faenas_produciendo' => $this->getFaenasProduciendo()
            ];

            // Producción por faena (últimos 7 días)
            $produccionPorFaena = $this->getProduccionPorFaena(7);

            // Producción por planta (mes actual)
            $produccionPorPlanta = $this->getProduccionPorPlanta($inicioMes, $finMes);

            // Top padrones productores
            $topPadrones = $this->getTopPadronesProductores(10);

            // Tendencias semanales
            $tendenciaSemanal = $this->getTendenciaProduccion(30);

            return response()->json([
                'success' => true,
                'data' => [
                    'resumen' => $resumen,
                    'produccion_por_faena' => $produccionPorFaena,
                    'produccion_por_planta' => $produccionPorPlanta,
                    'top_padrones' => $topPadrones,
                    'tendencia_semanal' => $tendenciaSemanal,
                    'alertas' => $this->getAlertasProduccion()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener datos de producción',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener lista de faenas para el filtro
     */
    public function getFaenas()
    {
        try {
            $faenas = DB::table('faenas')
                ->select('id_faena', 'ubicacion', 'detalle')
                ->orderBy('ubicacion')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $faenas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener faenas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener producción filtrada por faenas y rango de fechas
     */
    public function getProduccionFiltrada(Request $request)
    {
        try {
            // Validar parámetros
            $request->validate([
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
                'faenas' => 'nullable|array',
                'faenas.*' => 'exists:faenas,id_faena'
            ]);

            $fechaInicio = Carbon::parse($request->fecha_inicio);
            $fechaFin = Carbon::parse($request->fecha_fin);
            $faenas = $request->get('faenas', []);

            // Query base para tonelajes
            $queryBase = DB::table('tonelajes as t')
                ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
                ->join('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
                ->join('faenas as f', 'p.id_faena', '=', 'f.id_faena')
                ->whereBetween('t.fecha_produccion', [$fechaInicio->format('Y-m-d'), $fechaFin->format('Y-m-d')]);

            // Aplicar filtro de faenas si se especifica
            if (!empty($faenas)) {
                $queryBase->whereIn('f.id_faena', $faenas);
            }

            // Datos de padrones agrupados por fecha
            $produccionDiaria = $queryBase
                ->select(
                    't.fecha_produccion',
                    'f.ubicacion as faena',
                    'f.id_faena',
                    'p.capacidad',
                    DB::raw("CONCAT(p.empresa, ' ', p.nombre) as padron"),
                    'pl.nombre as planta',
                    'pl.id_planta',
                    DB::raw('SUM(t.tonelaje) as tonelaje'),
                    DB::raw('AVG(t.ley) as ley_ponderada'),
                    DB::raw('SUM(t.viajes) as viajes')
                )
                ->groupBy('t.fecha_produccion', 'f.id_faena', 'f.ubicacion', 'p.id_padron', 'p.capacidad', 'p.empresa', 'p.nombre', 'pl.id_planta', 'pl.nombre')
                ->orderBy('t.fecha_produccion', 'desc')
                ->orderBy('f.ubicacion')
                ->orderBy('pl.nombre')
                ->get()
                ->groupBy('fecha_produccion');

            // Totales por planta y fecha
            $totalesPorPlanta = $queryBase
                ->select(
                    't.fecha_produccion',
                    'pl.nombre as planta',
                    'pl.id_planta',
                    DB::raw('SUM(t.tonelaje) as tonelaje'),
                    DB::raw('AVG(t.ley) as ley_promedio'),
                    DB::raw('SUM(t.viajes) as viajes')
                )
                ->groupBy('t.fecha_produccion', 'pl.id_planta', 'pl.nombre')
                ->orderBy('t.fecha_produccion', 'desc')
                ->orderBy('pl.nombre')
                ->get()
                ->groupBy('fecha_produccion');

            // Total general por fecha
            $totalesGenerales = $queryBase
                ->select(
                    't.fecha_produccion',
                    DB::raw('SUM(t.tonelaje) as tonelaje'),
                    DB::raw('AVG(t.ley) as ley_promedio'),
                    DB::raw('SUM(t.viajes) as viajes'),
                    DB::raw('COUNT(DISTINCT p.id_padron) as padrones_activos')
                )
                ->groupBy('t.fecha_produccion')
                ->orderBy('t.fecha_produccion', 'desc')
                ->get()
                ->keyBy('fecha_produccion');

            // Resumen del período
            $resumenPeriodo = $queryBase
                ->select(
                    DB::raw('SUM(t.tonelaje) as tonelaje_total'),
                    DB::raw('AVG(t.ley) as ley_promedio_periodo'),
                    DB::raw('SUM(t.viajes) as viajes_total'),
                    DB::raw('COUNT(DISTINCT t.fecha_produccion) as dias_con_produccion'),
                    DB::raw('COUNT(DISTINCT p.id_padron) as padrones_distintos'),
                    DB::raw('COUNT(DISTINCT f.id_faena) as faenas_activas')
                )
                ->first();

            // Formatear datos para el frontend
            $datosPorFecha = [];
            foreach ($produccionDiaria as $fecha => $registros) {
                $datosPorFecha[$fecha] = [
                    'fecha_mostrar' => $fecha,
                    'padrones' => $registros->map(function ($item) {
                        return [
                            'faena' => $item->faena,
                            'capacidad' => $item->capacidad ? $item->capacidad . ' Ton' : 'N/a',
                            'padron' => $item->padron,
                            'planta' => $item->planta,
                            'tonelaje' => (float) $item->tonelaje,
                            'ley_ponderada' => $item->ley_ponderada ? (float) $item->ley_ponderada : null,
                            'viajes' => (int) $item->viajes
                        ];
                    })->toArray(),
                    'totales_planta' => $totalesPorPlanta->get($fecha, collect())->toArray(),
                    'total_general' => $totalesGenerales->get($fecha, (object)[
                        'tonelaje' => 0,
                        'ley_promedio' => 0,
                        'viajes' => 0,
                        'padrones_activos' => 0
                    ])
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'produccion_por_fecha' => $datosPorFecha,
                    'resumen_periodo' => $resumenPeriodo,
                    'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                    'fecha_fin' => $fechaFin->format('Y-m-d'),
                    'faenas_filtradas' => $faenas
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener producción filtrada',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Producción por faenas - últimos N días
     */
    public function getProduccionPorFaena($dias = 7)
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        return DB::table('tonelajes as t')
            ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
            ->join('faenas as f', 'p.id_faena', '=', 'f.id_faena')
            ->select(
                'f.ubicacion as faena',
                'f.id_faena',
                DB::raw('SUM(t.tonelaje) as total_toneladas'),
                DB::raw('SUM(t.viajes) as total_viajes'),
                DB::raw('AVG(t.ley) as ley_promedio'),
                DB::raw('COUNT(DISTINCT t.fecha_produccion) as dias_produccion'),
                DB::raw('SUM(t.tonelaje) / COUNT(DISTINCT t.fecha_produccion) as promedio_diario')
            )
            ->where('t.fecha_produccion', '>=', $fechaInicio)
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->orderBy('total_toneladas', 'desc')
            ->get();
    }

    /**
     * Producción por plantas - rango de fechas
     */
    public function getProduccionPorPlanta($fechaInicio, $fechaFin)
    {
        return DB::table('tonelajes as t')
            ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
            ->join('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
            ->select(
                'pl.nombre as planta',
                'pl.descripcion',
                'pl.id_planta',
                DB::raw('SUM(t.tonelaje) as total_toneladas'),
                DB::raw('SUM(t.viajes) as total_viajes'),
                DB::raw('COUNT(DISTINCT p.id_padron) as padrones_activos'),
                DB::raw('AVG(t.ley) as ley_promedio'),
                DB::raw('SUM(t.tonelaje) / COUNT(DISTINCT t.fecha_produccion) as promedio_diario')
            )
            ->whereBetween('t.fecha_produccion', [$fechaInicio, $fechaFin])
            ->groupBy('pl.id_planta', 'pl.nombre', 'pl.descripcion')
            ->orderBy('total_toneladas', 'desc')
            ->get();
    }

    /**
     * Top padrones productores
     */
    public function getTopPadronesProductores($limite = 10)
    {
        $fechaInicio = Carbon::now()->subDays(30); // Último mes

        return DB::table('tonelajes as t')
            ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
            ->join('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
            ->join('faenas as f', 'p.id_faena', '=', 'f.id_faena')
            ->select(
                'p.nombre as padron',
                'p.empresa',
                'p.capacidad',
                'pl.nombre as planta',
                'f.ubicacion as faena',
                DB::raw('SUM(t.tonelaje) as total_toneladas'),
                DB::raw('SUM(t.viajes) as total_viajes'),
                DB::raw('AVG(t.ley) as ley_promedio'),
                DB::raw('(SUM(t.tonelaje) / p.capacidad * 100) as porcentaje_capacidad'),
                DB::raw('COUNT(DISTINCT t.fecha_produccion) as dias_activos')
            )
            ->where('t.fecha_produccion', '>=', $fechaInicio)
            ->groupBy('p.id_padron', 'p.nombre', 'p.empresa', 'p.capacidad', 'pl.nombre', 'f.ubicacion')
            ->orderBy('total_toneladas', 'desc')
            ->limit($limite)
            ->get();
    }

    /**
     * Tendencia de producción - últimos N días
     */
    public function getTendenciaProduccion($dias = 30)
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        return DB::table('tonelajes as t')
            ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
            ->join('faenas as f', 'p.id_faena', '=', 'f.id_faena')
            ->select(
                't.fecha_produccion',
                'f.ubicacion as faena',
                DB::raw('SUM(t.tonelaje) as toneladas_dia'),
                DB::raw('SUM(t.viajes) as viajes_dia'),
                DB::raw('AVG(t.ley) as ley_promedio')
            )
            ->where('t.fecha_produccion', '>=', $fechaInicio)
            ->groupBy('t.fecha_produccion', 'f.ubicacion')
            ->orderBy('t.fecha_produccion', 'asc')
            ->get()
            ->groupBy('fecha_produccion');
    }

    /**
     * Estadísticas específicas por faena
     */
    public function getEstadisticasFaena($idFaena, Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio', Carbon::now()->subDays(30));
        $fechaFin = $request->get('fecha_fin', Carbon::now());

        // Información básica de la faena
        $faena = DB::table('faenas')->where('id_faena', $idFaena)->first();

        if (!$faena) {
            return response()->json(['success' => false, 'message' => 'Faena no encontrada'], 404);
        }

        // Estadísticas de producción
        $estadisticas = DB::table('tonelajes as t')
            ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
            ->select(
                DB::raw('SUM(t.tonelaje) as total_toneladas'),
                DB::raw('SUM(t.viajes) as total_viajes'),
                DB::raw('AVG(t.ley) as ley_promedio'),
                DB::raw('COUNT(DISTINCT t.fecha_produccion) as dias_produccion'),
                DB::raw('COUNT(DISTINCT p.id_padron) as padrones_activos'),
                DB::raw('MAX(t.fecha_produccion) as ultima_produccion'),
                DB::raw('SUM(t.tonelaje) / COUNT(DISTINCT t.fecha_produccion) as promedio_diario')
            )
            ->where('p.id_faena', $idFaena)
            ->whereBetween('t.fecha_produccion', [$fechaInicio, $fechaFin])
            ->first();

        // Padrones de la faena - CONSULTA SIMPLIFICADA
        $padrones = DB::table('padrones as p')
            ->join('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
            ->select(
                'p.id_padron',
                'p.nombre',
                'p.empresa',
                'p.capacidad',
                'pl.nombre as planta'
            )
            ->where('p.id_faena', $idFaena)
            ->get();

        // Agregar estadísticas de tonelajes por separado
        foreach ($padrones as $padron) {
            $stats = DB::table('tonelajes')
                ->where('id_padron', $padron->id_padron)
                ->whereBetween('fecha_produccion', [$fechaInicio, $fechaFin])
                ->select(
                    DB::raw('COALESCE(SUM(tonelaje), 0) as toneladas_periodo'),
                    DB::raw('COALESCE(SUM(viajes), 0) as viajes_periodo'),
                    DB::raw('COALESCE(AVG(ley), 0) as ley_promedio')
                )
                ->first();

            $padron->toneladas_periodo = $stats->toneladas_periodo ?? 0;
            $padron->viajes_periodo = $stats->viajes_periodo ?? 0;
            $padron->ley_promedio = $stats->ley_promedio ?? 0;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'faena' => $faena,
                'estadisticas' => $estadisticas,
                'padrones' => $padrones
            ]
        ]);
    }

    // Métodos auxiliares privados
    private function getTonelajesPorFecha($fecha)
    {
        return DB::table('tonelajes')
            ->where('fecha_produccion', $fecha->format('Y-m-d'))
            ->sum('tonelaje') ?? 0;
    }

    private function getTonelajesPorRango($fechaInicio, $fechaFin)
    {
        return DB::table('tonelajes')
            ->whereBetween('fecha_produccion', [$fechaInicio, $fechaFin])
            ->sum('tonelaje') ?? 0;
    }

    private function getMetasCumplimiento()
    {
        // Implementar lógica de metas (podrías agregar una tabla de metas)
        // Por ahora retornamos datos simulados
        return [
            'meta_diaria' => 1500,
            'meta_mensual' => 45000,
            'cumplimiento_diario' => 83.2,
            'cumplimiento_mensual' => 76.8
        ];
    }

    private function getPlantasActivas()
    {
        // Consulta simplificada para evitar problemas de GROUP BY
        $plantas = DB::table('plantas')->get();

        foreach ($plantas as $planta) {
            // Obtener estadísticas por separado
            $stats = DB::table('padrones as p')
                ->leftJoin('tonelajes as t', function ($join) {
                    $join->on('p.id_padron', '=', 't.id_padron')
                        ->where('t.fecha_produccion', Carbon::today());
                })
                ->where('p.id_planta', $planta->id_planta)
                ->select(
                    DB::raw('COUNT(DISTINCT p.id_padron) as padrones_total'),
                    DB::raw('COUNT(DISTINCT CASE WHEN t.id_tonelaje IS NOT NULL THEN p.id_padron END) as padrones_activos_hoy')
                )
                ->first();

            $planta->padrones_total = $stats->padrones_total ?? 0;
            $planta->padrones_activos_hoy = $stats->padrones_activos_hoy ?? 0;
        }

        return $plantas;
    }

    private function getFaenasProduciendo()
    {
        // Consulta simplificada para evitar problemas de GROUP BY
        $faenas = DB::table('faenas')->get();

        foreach ($faenas as $faena) {
            // Obtener estadísticas por separado
            $stats = DB::table('padrones as p')
                ->leftJoin('tonelajes as t', function ($join) {
                    $join->on('p.id_padron', '=', 't.id_padron')
                        ->where('t.fecha_produccion', Carbon::today());
                })
                ->where('p.id_faena', $faena->id_faena)
                ->select(
                    DB::raw('COUNT(DISTINCT p.id_padron) as padrones_total'),
                    DB::raw('COUNT(DISTINCT CASE WHEN t.id_tonelaje IS NOT NULL THEN p.id_padron END) as padrones_activos_hoy'),
                    DB::raw('COALESCE(SUM(t.tonelaje), 0) as toneladas_hoy')
                )
                ->first();

            $faena->padrones_total = $stats->padrones_total ?? 0;
            $faena->padrones_activos_hoy = $stats->padrones_activos_hoy ?? 0;
            $faena->toneladas_hoy = $stats->toneladas_hoy ?? 0;
        }

        return $faenas;
    }

    private function getAlertasProduccion()
    {
        $alertas = [];

        // Obtener faenas que no han producido hoy
        $faenasSinProduccion = DB::table('faenas as f')
            ->leftJoin('padrones as p', 'f.id_faena', '=', 'p.id_faena')
            ->leftJoin('tonelajes as t', function ($join) {
                $join->on('p.id_padron', '=', 't.id_padron')
                    ->where('t.fecha_produccion', Carbon::today());
            })
            ->whereNull('t.id_tonelaje')
            ->where('p.id_padron', '>', 0) // Solo faenas que tienen padrones
            ->select('f.ubicacion')
            ->distinct()
            ->pluck('ubicacion');

        foreach ($faenasSinProduccion as $faena) {
            $alertas[] = [
                'tipo' => 'warning',
                'mensaje' => "Faena {$faena} sin producción registrada hoy",
                'timestamp' => Carbon::now()
            ];
        }

        return $alertas;
    }

    /**
     * Obtener producción del último día registrado
     */
    public function getProduccionDiariaUltima()
    {
        try {
            // Obtener la fecha más reciente con registros
            $ultimaFecha = DB::table('tonelajes')
                ->select('fecha_produccion')
                ->orderBy('fecha_produccion', 'desc')
                ->first();

            if (!$ultimaFecha) {
                return response()->json(['success' => false, 'message' => 'No hay registros de producción']);
            }

            return $this->getProduccionDiariaPorFecha($ultimaFecha->fecha_produccion);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtener producción de una fecha específica
     */
    public function getProduccionDiariaPorFecha($fecha)
    {
        try {
            // Datos de padrones para la fecha específica
            $padrones = DB::table('tonelajes as t')
                ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
                ->join('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
                ->join('faenas as f', 'p.id_faena', '=', 'f.id_faena')
                ->select(
                    'f.ubicacion as faena',
                    'p.capacidad',
                    DB::raw("CONCAT(p.empresa, ' ', p.nombre) as padron"),
                    'pl.nombre as planta',
                    't.tonelaje',
                    't.ley as ley_ponderada',
                    't.viajes'
                )
                ->where('t.fecha_produccion', $fecha)
                ->orderBy('f.ubicacion')
                ->orderBy('pl.nombre')
                ->orderBy('p.empresa')
                ->get();

            // Totales por planta
            $totalesPlanta = DB::table('tonelajes as t')
                ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
                ->join('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
                ->select(
                    'pl.nombre as planta',
                    DB::raw('SUM(t.tonelaje) as tonelaje'),
                    DB::raw('AVG(t.ley) as ley_promedio'),
                    DB::raw('SUM(t.viajes) as viajes')
                )
                ->where('t.fecha_produccion', $fecha)
                ->groupBy('pl.id_planta', 'pl.nombre')
                ->get();

            // Total general
            $totalGeneral = DB::table('tonelajes')
                ->select(
                    DB::raw('SUM(tonelaje) as tonelaje'),
                    DB::raw('AVG(ley) as ley_promedio'),
                    DB::raw('SUM(viajes) as viajes')
                )
                ->where('fecha_produccion', $fecha)
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'fecha_mostrar' => $fecha,
                    'padrones' => $padrones->map(function ($item) {
                        return [
                            'faena' => $item->faena,
                            'capacidad' => $item->capacidad ? $item->capacidad . ' Ton' : 'N/a',
                            'padron' => $item->padron,
                            'planta' => $item->planta,
                            'tonelaje' => (float) $item->tonelaje,
                            'ley_ponderada' => $item->ley_ponderada ? (float) $item->ley_ponderada : null,
                            'viajes' => (int) $item->viajes
                        ];
                    }),
                    'totales_planta' => $totalesPlanta,
                    'total_general' => [
                        'tonelaje' => (float) $totalGeneral->tonelaje,
                        'ley_promedio' => (float) $totalGeneral->ley_promedio,
                        'viajes' => (int) $totalGeneral->viajes
                    ],
                    'metas' => [
                        'enami' => ['target' => 0, 'real' => 1], // Placeholder
                        'cenizas' => ['target' => 0, 'real' => 6] // Placeholder
                    ],
                    'camionadas' => [
                        'enami' => ['cantidad' => (int) $totalesPlanta->where('planta', 'ENAMI')->first()?->viajes ?? 0],
                        'cenizas' => ['cantidad' => (int) $totalesPlanta->where('planta', 'CENIZAS')->first()?->viajes ?? 0]
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}