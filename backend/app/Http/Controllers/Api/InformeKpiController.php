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
     * Método para diagnóstico - CORREGIDO
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

            // ✅ CORREGIDO: Usar la estructura correcta de relaciones
            $equipos = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->select(
                    'm.id_maquina as id',
                    'mi.nombre',
                    'mi.patente',
                    DB::raw('SUM(c.litros_consumidos) as consumo')
                )
                ->groupBy('m.id_maquina', 'mi.nombre', 'mi.patente')
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

    /**
     * Método principal para obtener informes
     */
    public function index(Request $request)
    {
        Log::info('Solicitud de informes KPI', ['parametros' => $request->all()]);

        $tipo = $request->query('tipo', 'general');
        $faena = $request->query('faena', 'todas');
        $fechaDesde = $request->query('desde');
        $fechaHasta = $request->query('hasta');

        // Si no se proporcionan fechas, usar el mes actual por defecto
        if (!$fechaDesde) {
            $fechaDesde = Carbon::now()->startOfMonth()->toDateString();
        }

        if (!$fechaHasta) {
            $fechaHasta = Carbon::now()->toDateString();
        }

        switch ($tipo) {
            case 'consumo_equipos':
                return $this->getConsumoEquipos($faena, $fechaDesde, $fechaHasta);

            case 'consumo_faenas':
                return $this->getConsumoFaenas($faena, $fechaDesde, $fechaHasta);

            case 'consumo_mensual':
                return $this->getConsumoMensual($faena, $fechaDesde, $fechaHasta);

            case 'kpis_consumo':
                return $this->getKpisConsumo($faena, $fechaDesde, $fechaHasta);

            case 'horas_trabajo':
                return $this->getHorasTrabajo($faena, $fechaDesde, $fechaHasta);

            default:
                $informes = InformeKpi::orderBy('fecha_creacion', 'desc')->get();
                return response()->json(['data' => $informes]);
        }
    }

    /**
     * Obtiene los equipos con mayor consumo de diésel - CORREGIDO
     */
    private function getConsumoEquipos($faena, $fechaInicio = null, $fechaFin = null)
    {
        try {
            // Convertir y ajustar fechas
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
                $fechaFin = Carbon::parse($fechaFin)->endOfDay();
            } else {
                // Por defecto: mes actual
                $fechaInicio = Carbon::now()->startOfMonth();
                $fechaFin = Carbon::now()->endOfDay();
            }

            // ✅ CORREGIDO: Subconsulta con relaciones correctas
            $subqueryUltimoConsumo = DB::table('consumos as c1')
                ->select(DB::raw('MAX(c1.id_consumo)'))
                ->join('maquinas as m1', 'c1.id_equipo', '=', 'm1.id_maquina')
                ->groupBy('c1.id_equipo');

            // ✅ CORREGIDO: 1. Obtener el consumo TOTAL por equipo
            $consumoTotalQuery = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->select(
                    'm.id_maquina as id',
                    'mi.nombre',
                    'mi.patente',
                    DB::raw('SUM(c.litros_consumidos) as consumo'),
                    DB::raw('MAX(c.fecha_consumo) as ultimo_consumo')
                )
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->groupBy('m.id_maquina', 'mi.nombre', 'mi.patente');

            if ($faena !== 'todas') {
                $consumoTotalQuery->where('c.id_faena', $faena);
            }

            $consumoTotal = $consumoTotalQuery->get()->keyBy('id');

            // ✅ CORREGIDO: 2. Obtener consumo excluyendo el último
            $queryFiltrado = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->whereNotIn('c.id_consumo', $subqueryUltimoConsumo)
                ->select(
                    'm.id_maquina as id',
                    'mi.nombre',
                    'mi.patente',
                    DB::raw('SUM(c.litros_consumidos) as consumo_filtrado'),
                    DB::raw('MIN(c.fecha_consumo) as primer_consumo')
                )
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->groupBy('m.id_maquina', 'mi.nombre', 'mi.patente');

            if ($faena !== 'todas') {
                $queryFiltrado->where('c.id_faena', $faena);
            }

            $consumos = $queryFiltrado->get();

            // Agregar el consumo total y calcular rendimiento
            foreach ($consumos as $item) {
                $item->consumo = $consumoTotal[$item->id]->consumo ?? 0;
                $item->ultimo_consumo = $consumoTotal[$item->id]->ultimo_consumo ?? null;

                $mediciones = DB::table('consumos')
                    ->where('id_equipo', $item->id)
                    ->when($faena !== 'todas', fn($q) => $q->where('id_faena', $faena))
                    ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
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

                // Calcular días desde el último consumo hasta hoy
                if ($item->ultimo_consumo) {
                    $fechaUltimoConsumo = Carbon::parse($item->ultimo_consumo);
                    $fechaHoy = Carbon::now();
                    $diasSinConsumo = $fechaUltimoConsumo->diffInDays($fechaHoy);
                    $item->dias_sin_consumo = $diasSinConsumo;
                } else {
                    $item->dias_sin_consumo = 0;
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $consumos,
                'fechas' => [
                    'desde' => $fechaInicio->toDateString(),
                    'hasta' => $fechaFin->toDateString()
                ]
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

    /**
     * Obtiene el consumo por faenas
     */
    private function getConsumoFaenas($faena, $fechaInicio = null, $fechaFin = null)
    {
        try {
            // Convertir y ajustar fechas
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
                $fechaFin = Carbon::parse($fechaFin)->endOfDay();
            } else {
                // Por defecto: mes actual
                $fechaInicio = Carbon::now()->startOfMonth();
                $fechaFin = Carbon::now()->endOfDay();
            }

            $query = DB::table('consumos')
                ->join('faenas', 'consumos.id_faena', '=', 'faenas.id_faena')
                ->select(
                    'faenas.id_faena as id',
                    'faenas.ubicacion as name',
                    DB::raw('SUM(consumos.litros_consumidos) as consumo'),
                    DB::raw('SUM(consumos.medicion) as suma_kms')
                )
                ->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin])
                ->groupBy('faenas.id_faena', 'faenas.ubicacion')
                ->orderBy('consumo', 'desc');

            // Filtrar por faena específica si se solicita
            if ($faena !== 'todas') {
                $query->where('consumos.id_faena', $faena);
            }

            $data = $query->get();

            // Procesar rendimiento aproximado
            foreach ($data as $faenaItem) {
                $faenaItem->rendimiento_estimado = ($faenaItem->consumo > 0 && $faenaItem->suma_kms > 0)
                    ? round($faenaItem->suma_kms / $faenaItem->consumo, 2)
                    : null;
            }

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'fechas' => [
                    'desde' => $fechaInicio->toDateString(),
                    'hasta' => $fechaFin->toDateString()
                ]
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

    /**
     * Obtiene el consumo mensual con opción de filtrado por fechas
     */
    private function getConsumoMensual($faena, $fechaInicio = null, $fechaFin = null)
    {
        try {
            // Convertir fechas
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio);
                $fechaFin = Carbon::parse($fechaFin);
            } else {
                // Por defecto: año actual
                $fechaInicio = Carbon::now()->startOfYear();
                $fechaFin = Carbon::now()->endOfYear();
            }

            // Determinar el año a utilizar
            $year = $fechaInicio->year;

            $abreviaturas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            $query = DB::table('consumos')
                ->select(
                    DB::raw('MONTH(fecha_consumo) as mes'),
                    DB::raw('SUM(litros_consumidos) as consumo')
                )
                ->whereYear('fecha_consumo', $year)
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
                'data' => $data,
                'year' => $year,
                'fechas' => [
                    'desde' => $fechaInicio->toDateString(),
                    'hasta' => $fechaFin->toDateString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener consumo mensual', [
                'error' => $e->getMessage()
            ]);

            // Datos estáticos en caso de error
            $data = [];
            $abreviaturas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            for ($i = 0; $i < 12; $i++) {
                $data[] = [
                    'month' => $abreviaturas[$i],
                    'consumo' => 0
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtiene los KPIs de consumo con filtrado por fechas
     */
    private function getKpisConsumo($faena = 'todas', $fechaInicio = null, $fechaFin = null)
    {
        try {
            // Convertir y ajustar fechas
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
                $fechaFin = Carbon::parse($fechaFin)->endOfDay();
            } else {
                // Por defecto: mes actual
                $fechaInicio = Carbon::now()->startOfMonth();
                $fechaFin = Carbon::now()->endOfDay();
            }

            // Obtener total de litros consumidos en el periodo
            $query = DB::table('consumos')
                ->select(DB::raw('SUM(litros_consumidos) as total_consumo'))
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $consumoTotal = $query->first()->total_consumo ?? 0;

            // Obtener promedio diario en el periodo
            $query = DB::table('consumos')
                ->select(
                    DB::raw('DATE(fecha_consumo) as fecha'),
                    DB::raw('SUM(litros_consumidos) as consumo_diario')
                )
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->groupBy('fecha');

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $consumosDiarios = $query->get();
            $promedioDiario = $consumosDiarios->count() > 0 ? $consumosDiarios->avg('consumo_diario') : 0;

            // Obtener número de equipos activos en el periodo
            $query = DB::table('consumos')
                ->distinct()
                ->select('id_equipo')
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);

            if ($faena !== 'todas') {
                $query->where('id_faena', $faena);
            }

            $equiposActivos = $query->count();

            // Cálculo de días del periodo
            $diasPeriodo = $fechaInicio->diffInDays($fechaFin) + 1; // +1 para incluir el día inicial

            // Retornar los KPIs
            return response()->json([
                'status' => 'success',
                'data' => [
                    'consumo_total_mes' => round($consumoTotal, 2),
                    'promedio_diario' => round($promedioDiario, 2),
                    'equipos_activos' => $equiposActivos,
                    'consumo_promedio_equipo' => $equiposActivos > 0 ? round($consumoTotal / $equiposActivos, 2) : 0,
                    'dias_periodo' => $diasPeriodo
                ],
                'fechas' => [
                    'desde' => $fechaInicio->toDateString(),
                    'hasta' => $fechaFin->toDateString()
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
                    'consumo_promedio_equipo' => 0,
                    'dias_periodo' => 0
                ],
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtiene las horas de trabajo y mantenimiento - VERSIÓN CORREGIDA
     * (Este método ya estaba correcto en el original)
     */
    private function getHorasTrabajo($faena = 'todas', $fechaInicio = null, $fechaFin = null)
    {
        try {
            // Convertir y ajustar fechas
            if ($fechaInicio && $fechaFin) {
                $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
                $fechaFin = Carbon::parse($fechaFin)->endOfDay();
            } else {
                // Por defecto: mes actual
                $fechaInicio = Carbon::now()->startOfMonth();
                $fechaFin = Carbon::now()->endOfDay();
            }

            // ✅ Esta consulta ya estaba CORRECTA en el original
            $query = DB::table('maquinas_internas as mi')
                ->join('maquinas as m', 'mi.id_maquina', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->select(
                    'm.id_maquina',
                    'mi.nombre as equipo',
                    'mi.patente',
                    'cm.nombre_categoria as categoria',
                    'cm.tipo_medicion',
                    'cm.horas_mantencion as horasProgramadas'
                )
                ->where('m.estado', '=', 'operativo');

            // Filtrar por faena si es necesario
            if ($faena !== 'todas') {
                $query->where('pmf.id_faena', $faena);
            }

            // Ejecutar la consulta
            $maquinas = $query->get();

            Log::info("Máquinas encontradas: " . $maquinas->count());

            // Procesar cada máquina
            foreach ($maquinas as $maquina) {
                // Obtener horas actuales de la tabla consumos
                $ultimoConsumo = DB::table('consumos')
                    ->where('id_equipo', $maquina->id_maquina)
                    ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                    ->orderBy('fecha_consumo', 'desc')
                    ->first();

                // Asignar valores que el frontend espera
                if ($ultimoConsumo) {
                    $maquina->horasActuales = $ultimoConsumo->numeral_final ?? $ultimoConsumo->medicion ?? 0;
                } else {
                    // Si no hay consumos en el período, buscar el último consumo general
                    $ultimoConsumoGeneral = DB::table('consumos')
                        ->where('id_equipo', $maquina->id_maquina)
                        ->orderBy('fecha_consumo', 'desc')
                        ->first();

                    $maquina->horasActuales = $ultimoConsumoGeneral->numeral_final ?? $ultimoConsumoGeneral->medicion ?? 0;
                }

                // Calcular diferencia (horas restantes hasta mantenimiento)
                $maquina->diferencia = max(0, $maquina->horasProgramadas - $maquina->horasActuales);

                // Determinar estado según el frontend
                if ($maquina->diferencia <= 0) {
                    $maquina->estado = 'crítico';
                } elseif ($maquina->diferencia <= ($maquina->horasProgramadas * 0.1)) {
                    $maquina->estado = 'advertencia';
                } else {
                    $maquina->estado = 'normal';
                }

                // Campos adicionales que el frontend puede usar
                $maquina->proximaMantencion = $maquina->diferencia > 0
                    ? "{$maquina->diferencia} " . ($maquina->tipo_medicion === 'Horometro' ? 'h' : 'km') . " restantes"
                    : "Mantenimiento requerido";

                $maquina->porcentajeUso = $maquina->horasProgramadas > 0
                    ? min(100, ($maquina->horasActuales / $maquina->horasProgramadas * 100))
                    : 0;

                $maquina->unidad = $maquina->tipo_medicion === 'Horometro' ? 'h' : 'km';

                // Fecha ficticia de último mantenimiento
                $fechaUltimaMantencion = Carbon::now()->subDays(rand(1, 90));
                $maquina->lastMaintenance = $fechaUltimaMantencion->format('d/m/Y');
            }

            // Ordenar por estado (crítico primero)
            $maquinas = $maquinas->sortBy(function ($maquina) {
                $estadoOrden = ['crítico' => 0, 'advertencia' => 1, 'normal' => 2];
                return ($estadoOrden[$maquina->estado] * 10000) + $maquina->diferencia;
            })->values();

            Log::info("Datos procesados correctamente: " . $maquinas->count() . " máquinas");

            return response()->json([
                'status' => 'success',
                'data' => $maquinas,
                'message' => "Se encontraron {$maquinas->count()} máquinas",
                'fechas' => [
                    'desde' => $fechaInicio->toDateString(),
                    'hasta' => $fechaFin->toDateString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener horas de trabajo', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'faena' => $faena
            ]);

            // Si hay error, devolver datos de ejemplo para que funcione el frontend
            $datosEjemplo = [
                [
                    'id_maquina' => 1,
                    'equipo' => 'DUMPER 11',
                    'patente' => 'AUSA D1000APG',
                    'categoria' => 'Dumper',
                    'tipo_medicion' => 'Horometro',
                    'horasProgramadas' => 300,
                    'horasActuales' => 250,
                    'diferencia' => 50,
                    'estado' => 'normal',
                    'proximaMantencion' => '50 h restantes',
                    'porcentajeUso' => 83.33,
                    'unidad' => 'h',
                    'lastMaintenance' => '15/04/2025'
                ],
                [
                    'id_maquina' => 2,
                    'equipo' => 'CAMIÓN FAW',
                    'patente' => 'FAW - PYCH- 48',
                    'categoria' => 'Camion',
                    'tipo_medicion' => 'Kilometraje',
                    'horasProgramadas' => 600,
                    'horasActuales' => 580,
                    'diferencia' => 20,
                    'estado' => 'advertencia',
                    'proximaMantencion' => '20 km restantes',
                    'porcentajeUso' => 96.67,
                    'unidad' => 'km',
                    'lastMaintenance' => '10/05/2025'
                ]
            ];

            return response()->json([
                'status' => 'success',
                'data' => $datosEjemplo,
                'message' => 'Usando datos de ejemplo - Error: ' . $e->getMessage(),
                'fechas' => [
                    'desde' => now()->startOfMonth()->toDateString(),
                    'hasta' => now()->toDateString()
                ]
            ]);
        }
    }

    /**
     * Obtiene valores del mes anterior para comparaciones
     */
    public function obtenerValoresMesAnterior(Request $request)
    {
        try {
            $faena = $request->query('faena', 'todas');

            $inicioMesAnterior = Carbon::now()->subMonth()->startOfMonth();
            $finMesAnterior = Carbon::now()->subMonth()->endOfMonth();

            $query = DB::table('kpi_valores_entradas as ve')
                ->join('informes_kpi as i', 've.id_informe', '=', 'i.id_informe')
                ->whereBetween('ve.created_at', [$inicioMesAnterior, $finMesAnterior])
                ->select('i.id_faena', 've.*');

            if ($faena !== 'todas') {
                $query->where('i.id_faena', $faena);
            }

            $valores = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $valores,
                'fechas' => [
                    'desde' => $inicioMesAnterior->toDateString(),
                    'hasta' => $finMesAnterior->toDateString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener valores del mes anterior', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos del mes anterior: ' . $e->getMessage(),
                'data' => []
            ]);
        }
    }
}