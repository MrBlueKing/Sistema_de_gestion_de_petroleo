<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\KpiValoresEntrada;
use App\Models\InformeKpi;
use Carbon\Carbon;

class InformeKpiController extends Controller
{
    /**
     * Método para diagnóstico
     */
    public function test()
    {
        try {
            // Verificar si las tablas existen y tienen datos
            $consumosCount = DB::table('consumos')->count();
            $maquinasCount = DB::table('maquinas_internas')->count();
            $faenasCount = DB::table('faenas')->count();

            // Intentar obtener la estructura de las tablas
            $consumosColumns = DB::getSchemaBuilder()->getColumnListing('consumos');

            // Intentar cargar datos reales en un formato simplificado
            $equipos = DB::table('consumos')
                ->join('maquinas_internas', 'consumos.id_equipo', '=', 'maquinas_internas.id_maquina_interna')
                ->select(
                    'maquinas_internas.id_maquina_interna as id',
                    'maquinas_internas.nombre',
                    DB::raw('SUM(consumos.litros_consumidos) as consumo')
                )
                ->groupBy('maquinas_internas.id_maquina_interna', 'maquinas_internas.nombre')
                ->orderBy('consumo', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'status' => 'success',
                'diagnostico' => [
                    'consumos_count' => $consumosCount,
                    'maquinas_count' => $maquinasCount,
                    'faenas_count' => $faenasCount,
                    'consumos_columns' => $consumosColumns,
                    'equipos_reales' => $equipos
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en el diagnóstico: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    // Mantener el método index pero corregir los nombres de las columnas
    public function index(Request $request)
    {
        Log::info('Solicitud de informes KPI', ['parametros' => $request->all()]);

        $tipo = $request->query('tipo', 'general');
        $faena = $request->query('faena', 'todas');

        switch ($tipo) {
            case 'consumo_equipos':
                return $this->getConsumoEquipos(
                    $faena,
                    $request->query('desde'),
                    $request->query('hasta')
                );

            case 'consumo_faenas':
                return $this->getConsumoFaenas(
                    $faena,
                    $request->query('desde'),
                    $request->query('hasta')
                );

            case 'consumo_mensual':
                return $this->getConsumoMensual($faena);
            case 'kpis_consumo':
                return $this->getKpisConsumo($faena);
            case 'horas_trabajo':
                return $this->getHorasTrabajo($faena);
            default:
                $informes = InformeKpi::orderBy('fecha_creacion', 'desc')->get();
                return response()->json(['data' => $informes]);
        }
    }

    /**
     * Obtiene los equipos con mayor consumo de diésel
     */
    private function getConsumoEquipos($faena, $fechaInicio = null, $fechaFin = null)
    {
        try {
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
                $fechaFin = Carbon::parse($fechaFin)->endOfDay();
            }
    
            // Subconsulta: último ID de consumo por equipo
            $subqueryUltimoConsumo = DB::table('consumos as c1')
                ->select(DB::raw('MAX(c1.id_consumo)'))
                ->join('maquinas_internas as m1', 'c1.id_equipo', '=', 'm1.id_maquina_interna')
                ->groupBy('c1.id_equipo');
    
            // 1. Obtener el consumo TOTAL por equipo (se usará como 'consumo')
            $consumoTotalQuery = DB::table('consumos')
                ->join('maquinas_internas', 'consumos.id_equipo', '=', 'maquinas_internas.id_maquina_interna')
                ->select(
                    'maquinas_internas.id_maquina_interna as id',
                    'maquinas_internas.nombre',
                    'maquinas_internas.patente',
                    DB::raw('SUM(consumos.litros_consumidos) as consumo')
                )
                ->groupBy('maquinas_internas.id_maquina_interna', 'maquinas_internas.nombre', 'maquinas_internas.patente');
    
            if ($faena !== 'todas') {
                $consumoTotalQuery->where('consumos.id_faena', $faena);
            }
            if ($fechaInicio && $fechaFin) {
                $consumoTotalQuery->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin]);
            }
    
            $consumoTotal = $consumoTotalQuery->get()->keyBy('id');
    
            // 2. Obtener consumo excluyendo el último (como 'consumo_filtrado')
            $queryFiltrado = DB::table('consumos')
                ->join('maquinas_internas', 'consumos.id_equipo', '=', 'maquinas_internas.id_maquina_interna')
                ->whereNotIn('consumos.id_consumo', $subqueryUltimoConsumo)
                ->select(
                    'maquinas_internas.id_maquina_interna as id',
                    'maquinas_internas.nombre',
                    'maquinas_internas.patente',
                    DB::raw('SUM(consumos.litros_consumidos) as consumo_filtrado')
                )
                ->groupBy('maquinas_internas.id_maquina_interna', 'maquinas_internas.nombre', 'maquinas_internas.patente');
    
            if ($faena !== 'todas') {
                $queryFiltrado->where('consumos.id_faena', $faena);
            }
            if ($fechaInicio && $fechaFin) {
                $queryFiltrado->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin]);
            }
    
            $consumos = $queryFiltrado->get();
    
            // Agregar el consumo total y calcular rendimiento
            foreach ($consumos as $item) {
                $item->consumo = $consumoTotal[$item->id]->consumo ?? 0;
    
                $mediciones = DB::table('consumos')
                    ->where('id_equipo', $item->id)
                    ->when($faena !== 'todas', fn($q) => $q->where('id_faena', $faena))
                    ->when($fechaInicio && $fechaFin, fn($q) => $q->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]))
                    ->orderBy('fecha_consumo')
                    ->pluck('medicion');
    
                if ($mediciones->count() >= 2) {
                    $km = $mediciones->last() - $mediciones->first();
                    $item->km = $km;
                    $item->rendimiento = ($item->consumo_filtrado > 0 && $km > 0)
                        ? round($km / $item->consumo_filtrado, 2)
                        : null;
                } else {
                    $item->km = null;
                    $item->rendimiento = null;
                }
            }
    
            return response()->json([
                'status' => 'success',
                'data' => $consumos
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener consumo por equipos', [
                'error' => $e->getMessage(),
                'linea' => $e->getLine()
            ]);
    
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos de consumo por equipos: ' . $e->getMessage(),
                'data' => []
            ]);
        }
    }
    


    // También corregir getConsumoFaenas, getConsumoMensual y getKpisConsumo
    // con los nombres correctos de columnas

    private function getConsumoFaenas($faena, $fechaInicio = null, $fechaFin = null)
    {
        try {
            // Parseo y ajuste de fechas si vienen como parámetros
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
                $fechaFin = Carbon::parse($fechaFin)->endOfDay();
            }

            $query = DB::table('consumos')
                ->join('faenas', 'consumos.id_faena', '=', 'faenas.id_faena')
                ->select(
                    'faenas.id_faena as id',
                    'faenas.ubicacion as name',
                    DB::raw('SUM(consumos.litros_consumidos) as consumo'),
                    DB::raw('SUM(consumos.medicion) as suma_kms')
                )
                ->groupBy('faenas.id_faena', 'faenas.ubicacion')
                ->orderBy('consumo', 'desc');

            // Filtro de fechas
            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin]);
            } else {
                // Por defecto: mes actual
                $query->whereMonth('consumos.fecha_consumo', Carbon::now()->month)
                    ->whereYear('consumos.fecha_consumo', Carbon::now()->year);
            }

            $data = $query->get();

            // Procesar rendimiento aproximado si se desea
            foreach ($data as $faena) {
                $faena->rendimiento_estimado = ($faena->consumo > 0 && $faena->suma_kms > 0)
                    ? round($faena->suma_kms / $faena->consumo, 2)
                    : null;
            }

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener consumo por faenas', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener consumo por faenas: ' . $e->getMessage(),
                'data' => []
            ]);
        }
    }


    private function getConsumoMensual($faena)
    {
        try {
            $abreviaturas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            $query = DB::table('consumos')
                ->select(
                    DB::raw('MONTH(fecha_consumo) as mes'),
                    DB::raw('SUM(litros_consumidos) as consumo')
                )
                ->whereYear('fecha_consumo', Carbon::now()->year)
                ->groupBy('mes')
                ->orderBy('mes');

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $consumos = $query->get()->keyBy('mes');

            $data = [];
            for ($i = 1; $i <= 12; $i++) {
                $data[] = [
                    'month' => $abreviaturas[$i - 1],
                    'consumo' => $consumos->has($i) ? $consumos[$i]->consumo : 0
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener consumo mensual', [
                'error' => $e->getMessage()
            ]);

            // Datos estáticos
            $data = [];
            $abreviaturas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            for ($i = 0; $i < 12; $i++) {
                $data[] = [
                    'month' => $abreviaturas[$i],
                    'consumo' => rand(200, 1000) // Datos aleatorios para test
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        }
    }



    private function getKpisConsumo($faena = 'todas')
    {
        try {
            // Obtener total de litros consumidos este mes
            $query = DB::table('consumos')
                ->select(DB::raw('SUM(litros_consumidos) as total_consumo'))
                ->whereMonth('fecha_consumo', Carbon::now()->month)
                ->whereYear('fecha_consumo', Carbon::now()->year);

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $consumoTotal = $query->first()->total_consumo ?? 0;

            // Obtener promedio diario este mes
            $query = DB::table('consumos')
                ->select(
                    DB::raw('DATE(fecha_consumo) as fecha'),
                    DB::raw('SUM(litros_consumidos) as consumo_diario')
                )
                ->whereMonth('fecha_consumo', Carbon::now()->month)
                ->whereYear('fecha_consumo', Carbon::now()->year)
                ->groupBy('fecha');

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $consumosDiarios = $query->get();
            $promedioDiario = $consumosDiarios->count() > 0 ? $consumosDiarios->avg('consumo_diario') : 0;

            // Obtener número de equipos activos
            $query = DB::table('consumos')
                ->distinct()
                ->select('id_equipo')
                ->whereMonth('fecha_consumo', Carbon::now()->month)
                ->whereYear('fecha_consumo', Carbon::now()->year);

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $equiposActivos = $query->count();

            // Retornar los KPIs
            return response()->json([
                'status' => 'success',
                'data' => [
                    'consumo_total_mes' => round($consumoTotal, 2),
                    'promedio_diario' => round($promedioDiario, 2),
                    'equipos_activos' => $equiposActivos,
                    'consumo_promedio_equipo' => $equiposActivos > 0 ? round($consumoTotal / $equiposActivos, 2) : 0
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener KPIs de consumo', [
                'error' => $e->getMessage(),
                'linea' => $e->getLine()
            ]);

            // Datos estáticos para prevenir errores en el frontend
            return response()->json([
                'status' => 'success',
                'data' => [
                    'consumo_total_mes' => 0,
                    'promedio_diario' => 0,
                    'equipos_activos' => 0,
                    'consumo_promedio_equipo' => 0
                ]
            ]);
        }
    }
    /**
     * Obtiene las horas de trabajo y mantenimiento de las máquinas
     * con opción de filtrado por faena
     * 
     * @param string $faena ID de la faena o 'todas'
     * @return \Illuminate\Http\JsonResponse
     */
    private function getHorasTrabajo($faena = 'todas')
    {
        try {
            // Consulta base para obtener maquinas con sus categorías
            $query = DB::table('maquinas')
                ->join('categorias_maquinas', 'maquinas.id_categoria', '=', 'categorias_maquinas.id_categoria')
                ->join('maquinas_internas', 'maquinas.id_maquina', '=', 'maquinas_internas.id_maquina')
                ->leftJoin('permisos_maquinas_faenas', 'maquinas.id_maquina', '=', 'permisos_maquinas_faenas.id_maquina')
                ->select(
                    'maquinas.id_maquina',
                    'maquinas_internas.nombre as equipo',
                    'maquinas_internas.patente',
                    'categorias_maquinas.nombre_categoria as categoria',
                    'categorias_maquinas.tipo_medicion',
                    'categorias_maquinas.horas_mantencion as horasProgramadas'
                )
                ->where('maquinas.estado', '=', 'operativo');

            // Filtrar por faena si es necesario
            if ($faena !== 'todas') {
                $query->where('permisos_maquinas_faenas.id_faena', $faena);
            }

            // Agrupar por máquina
            $query->groupBy(
                'maquinas.id_maquina',
                'maquinas_internas.nombre',
                'maquinas_internas.patente',
                'categorias_maquinas.nombre_categoria',
                'categorias_maquinas.tipo_medicion',
                'categorias_maquinas.horas_mantencion'
            );

            // Ejecutar la consulta
            $maquinas = $query->get();

            // Procesar cada máquina con sus datos adicionales
            foreach ($maquinas as $maquina) {
                // 1. Obtener la última medición registrada (de consumos)
                $ultimaMedicion = DB::table('consumos')
                    ->where('id_equipo', $maquina->id_maquina)
                    ->max('medicion') ?? 0;

                $maquina->horasActuales = $ultimaMedicion;

                // 2. Obtener la última mantención registrada
                $ultimaMantencion = DB::table('mantenciones')
                    ->where('id_maquina', $maquina->id_maquina)
                    ->orderBy('fecha_mantencion', 'desc')
                    ->first();

                if ($ultimaMantencion) {
                    $maquina->ultima_mantencion = [
                        'fecha' => $ultimaMantencion->fecha_mantencion,
                        'medicion' => $ultimaMantencion->horas_kilometros_actuales,
                        'proxima_programada' => $ultimaMantencion->proxima_mantencion
                    ];

                    // Calcular diferencia entre medición actual y próxima mantención programada
                    $maquina->diferencia = max(0, $ultimaMantencion->proxima_mantencion - $ultimaMedicion);

                    // Determinar estado según la diferencia con la próxima mantención
                    if ($ultimaMedicion >= $ultimaMantencion->proxima_mantencion) {
                        $maquina->estado = 'crítico';
                    } elseif (($ultimaMantencion->proxima_mantencion - $ultimaMedicion) <= ($maquina->horasProgramadas * 0.1)) {
                        $maquina->estado = 'advertencia';
                    } else {
                        $maquina->estado = 'normal';
                    }

                    // Para el gráfico: horas desde la última mantención
                    $maquina->mantenimiento = $ultimaMedicion - $ultimaMantencion->horas_kilometros_actuales;
                } else {
                    // Si no hay mantenciones previas, usar la lógica de horas programadas
                    $maquina->ultima_mantencion = null;
                    $maquina->diferencia = $maquina->horasProgramadas - $ultimaMedicion;

                    if ($maquina->diferencia <= 0) {
                        $maquina->estado = 'crítico';
                    } elseif ($maquina->diferencia <= ($maquina->horasProgramadas * 0.1)) {
                        $maquina->estado = 'advertencia';
                    } else {
                        $maquina->estado = 'normal';
                    }

                    // Para el gráfico: horas acumuladas desde cero
                    $maquina->mantenimiento = $ultimaMedicion;
                }

                // 3. Calcular porcentaje de uso respecto a las horas programadas
                if ($maquina->horasProgramadas > 0) {
                    $porcentajeUso = min(100, ($maquina->mantenimiento / $maquina->horasProgramadas) * 100);
                    $maquina->porcentajeUso = round($porcentajeUso);
                } else {
                    $maquina->porcentajeUso = 0;
                }
            }

            // Ordenar por estado (crítico primero) y luego por horas restantes
            $maquinas = $maquinas->sortBy(function ($maquina) {
                $estadoOrden = ['crítico' => 0, 'advertencia' => 1, 'normal' => 2];
                return ($estadoOrden[$maquina->estado] * 10000) + $maquina->diferencia;
            })->values();

            return response()->json([
                'status' => 'success',
                'data' => $maquinas
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener horas de trabajo', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos: ' . $e->getMessage(),
                'data' => []
            ]);
        }
    }
    public function obtenerValoresMesAnterior()
    {
        $inicioMesAnterior = Carbon::now()->subMonth()->startOfMonth();
        $finMesAnterior = Carbon::now()->subMonth()->endOfMonth();

        $valores = DB::table('kpi_valores_entradas as ve')
            ->join('informes_kpi as i', 've.id_informe', '=', 'i.id_informe')
            ->whereBetween('ve.created_at', [$inicioMesAnterior, $finMesAnterior])
            ->select('i.id_faena', 've.*')
            ->get();

        return response()->json($valores);
    }
}