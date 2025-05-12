<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faena;
use App\Models\InformeKpi;
use App\Models\KpiValoresEntrada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon; // Añadido el import correcto para Carbon
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class KpiValoresEntradaController extends Controller
{
    // GET /api/kpi-valores-entrada
    public function index(Request $request)
    {
        $query = KpiValoresEntrada::query();

        // Filtrar por periodo si se proporciona
        if ($request->has('periodo')) {
            $periodo = $request->input('periodo');

            // Manejar diferentes tipos de periodos
            switch ($periodo) {
                case 'diario':
                    $query->whereDate('created_at', Carbon::today());
                    break;
                case 'semanal':
                    $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'mensual':
                    $query->whereMonth('created_at', Carbon::now()->month)
                        ->whereYear('created_at', Carbon::now()->year);
                    break;
                case 'trimestral':
                    $query->whereBetween('created_at', [Carbon::now()->startOfQuarter(), Carbon::now()->endOfQuarter()]);
                    break;
                case 'anual':
                    $query->whereYear('created_at', Carbon::now()->year);
                    break;
                default:
                    // Si es una abreviatura de mes (jan, feb, etc.)
                    $meses = [
                        'jan' => 1,
                        'feb' => 2,
                        'mar' => 3,
                        'apr' => 4,
                        'may' => 5,
                        'jun' => 6,
                        'jul' => 7,
                        'aug' => 8,
                        'sep' => 9,
                        'oct' => 10,
                        'nov' => 11,
                        'dec' => 12
                    ];

                    if (array_key_exists(strtolower($periodo), $meses)) {
                        $numeroMes = $meses[strtolower($periodo)];
                        $query->whereMonth('created_at', $numeroMes)
                            ->whereYear('created_at', Carbon::now()->year);
                    }
                    break;
            }
        }

        // Filtrar por faena si se proporciona y la columna existe
        if ($request->has('faena') && $request->input('faena') !== 'todas') {
            // Verificar si la columna id_faena existe en la tabla
            if (Schema::hasColumn('kpi_valores_entrada', 'id_faena')) {
                $query->where('id_faena', $request->input('faena'));
            } else {
                // La columna no existe, buscar por la relación con informes
                $query->whereHas('informe', function ($q) use ($request) {
                    $q->where('faena_id', $request->input('faena'));
                });
            }
        }

        // Ordenar por fecha de creación descendente
        $query->orderBy('created_at', 'desc');

        $resultados = $query->get();

        return response()->json($resultados);
    }

    // POST /api/kpi-valores-entrada
    public function store(Request $request)
    {
        Log::info('Iniciando VALO ENTRADA', ['data_recibida' => $request->all()]);

        $validated = $request->validate([
            'id_informe' => 'required|integer|exists:informes_kpi,id_informe',
            'ley_mineral' => 'required|numeric',
            'toneladas_extraidas' => 'required|numeric',
            'horas_trabajadas' => 'required|numeric',
            'combustible_consumido' => 'required|numeric',
            'kilometros_recorridos' => 'required|numeric',
            'numero_viajes' => 'required|integer',
            'rendimiento_base' => 'required|numeric',
            'precio_combustible' => 'required|numeric',
        ]);

        // Añadir user_id si está autenticado
        if ($request->user()) {
            $validated['user_id'] = $request->user()->id;
        }

        $valoresEntrada = KpiValoresEntrada::create($validated);

        return response()->json($valoresEntrada, 201);
    }

    // GET /api/kpi-valores-entrada/{id}
    public function show($id)
    {
        $valoresEntrada = KpiValoresEntrada::findOrFail($id);
        return response()->json($valoresEntrada);
    }

    // PUT/PATCH /api/kpi-valores-entrada/{id}
    public function update(Request $request, $id)
    {
        $valoresEntrada = KpiValoresEntrada::findOrFail($id);

        $validated = $request->validate([
            'ley_mineral' => 'sometimes|numeric',
            'toneladas_extraidas' => 'sometimes|numeric',
            'horas_trabajadas' => 'sometimes|numeric',
            'combustible_consumido' => 'sometimes|numeric',
            'kilometros_recorridos' => 'sometimes|numeric',
            'numero_viajes' => 'sometimes|integer',
            'rendimiento_base' => 'sometimes|numeric',
            'precio_combustible' => 'sometimes|numeric',
        ]);

        $valoresEntrada->update($validated);

        return response()->json($valoresEntrada);
    }

    // DELETE /api/kpi-valores-entrada/{id}
    public function destroy($id)
    {
        $valoresEntrada = KpiValoresEntrada::findOrFail($id);
        $valoresEntrada->delete();

        return response()->json(['message' => 'Registro eliminado correctamente']);
    }

    // Verificar si el usuario puede realizar actualizaciones
    public function verificarPermiso(Request $request)
    {
        // Verificamos si el usuario está autenticado
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'puedeActualizar' => false,
                'mensaje' => 'Usuario no autenticado'
            ], 401);
        }

        // Verificamos si la tabla tiene la columna user_id
        if (!Schema::hasColumn('kpi_valores_entrada', 'user_id')) {
            return response()->json([
                'puedeActualizar' => true,
                'mensaje' => 'No hay restricciones de actualización configuradas'
            ]);
        }

        $hoy = Carbon::today();

        // Buscar la última actualización del usuario
        $ultimaActualizacion = KpiValoresEntrada::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$ultimaActualizacion) {
            return response()->json([
                'puedeActualizar' => true,
                'ultimaActualizacion' => null,
                'proximaActualizacion' => null,
                'tiempoRestante' => 0
            ]);
        }

        // Convertir a Carbon si no lo es
        $fechaUltimaActualizacion = $ultimaActualizacion->created_at;
        if (!($fechaUltimaActualizacion instanceof Carbon)) {
            $fechaUltimaActualizacion = Carbon::parse($fechaUltimaActualizacion);
        }

        // Verificar si han pasado menos de 12 horas
        $horasTranscurridas = $fechaUltimaActualizacion->diffInHours(Carbon::now());
        $puedeActualizar = $horasTranscurridas >= 12;

        // Calcular tiempo restante y próxima actualización
        $proximaActualizacion = null;
        $tiempoRestante = 0;

        if (!$puedeActualizar) {
            $proximaActualizacion = $fechaUltimaActualizacion->copy()->addHours(12);
            $tiempoRestante = Carbon::now()->diffInSeconds($proximaActualizacion, false);
            $tiempoRestante = max(0, $tiempoRestante); // Asegurar que no sea negativo
        }

        return response()->json([
            'puedeActualizar' => $puedeActualizar,
            'ultimaActualizacion' => $fechaUltimaActualizacion->toDateTimeString(),
            'proximaActualizacion' => $proximaActualizacion ? $proximaActualizacion->toDateTimeString() : null,
            'tiempoRestante' => $tiempoRestante
        ]);
    }

    /**
     * Obtiene el historial general de valores de entrada
     */
    public function getHistorialGeneral()
    {
        try {
            $historial = InformeKpi::with(['valoresEntrada', 'faena:id_faena,ubicacion', 'usuario:id,nombre'])
                ->select('informes_kpi.*')
                ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
                ->orderBy('informes_kpi.fecha_fin_periodo', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $historial,
                'message' => 'Historial de valores KPI recuperado con éxito'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al recuperar el historial: ' . $e->getMessage()
            ], 500);
        }
    }

    // Método para obtener historial filtrado por año/mes
    public function getHistorialFiltrado(Request $request)
    {
        try {
            // Validar parámetros
            $request->validate([
                'periodo' => 'nullable|string',
                'fecha_inicio' => 'nullable|date',
                'fecha_fin' => 'nullable|date',
                'faena' => 'nullable'
            ]);

            $query = InformeKpi::with(['valoresEntrada', 'faena:id_faena,ubicacion', 'usuario:id,nombre'])
                ->select('informes_kpi.*')
                ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe');

            // Filtrar por fechas si se proporcionan
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $fechaInicio = Carbon::parse($request->input('fecha_inicio'))->startOfDay();
                $fechaFin = Carbon::parse($request->input('fecha_fin'))->endOfDay();

                $query->whereBetween('informes_kpi.fecha_fin_periodo', [$fechaInicio, $fechaFin]);
            }
            // Filtrar por periodo si no hay fechas específicas
            else if ($request->has('periodo')) {
                $periodo = $request->input('periodo');

                switch ($periodo) {
                    case 'diario':
                        $query->whereDate('informes_kpi.fecha_fin_periodo', Carbon::today());
                        break;
                    case 'semanal':
                        $query->whereBetween('informes_kpi.fecha_fin_periodo', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                        break;
                    case 'mensual':
                        $query->whereMonth('informes_kpi.fecha_fin_periodo', Carbon::now()->month)
                            ->whereYear('informes_kpi.fecha_fin_periodo', Carbon::now()->year);
                        break;
                    case 'trimestral':
                        $query->whereBetween('informes_kpi.fecha_fin_periodo', [Carbon::now()->startOfQuarter(), Carbon::now()->endOfQuarter()]);
                        break;
                    case 'anual':
                        $query->whereYear('informes_kpi.fecha_fin_periodo', Carbon::now()->year);
                        break;
                }
            }

            // Filtrar por faena si se especifica
            if ($request->has('faena') && $request->input('faena') !== 'todas' && $request->input('faena') !== null) {
                $query->where('informes_kpi.id_faena', $request->input('faena'));
            }

            // Ordenar por fecha más reciente primero
            $query->orderBy('informes_kpi.fecha_fin_periodo', 'desc');

            $historial = $query->get();

            return response()->json([
                'success' => true,
                'data' => $historial,
                'message' => 'Historial de valores KPI recuperado con éxito',
                'filtros' => [
                    'periodo' => $request->input('periodo'),
                    'fecha_inicio' => $request->input('fecha_inicio'),
                    'fecha_fin' => $request->input('fecha_fin'),
                    'faena' => $request->input('faena')
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al recuperar historial filtrado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al recuperar el historial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene el historial de valores de entrada por faena
     */
    public function getHistorialPorFaena($idFaena)
    {
        try {
            // Verificar que la faena existe
            $faena = Faena::find($idFaena);

            if (!$faena) {
                return response()->json([
                    'success' => false,
                    'message' => 'La faena especificada no existe'
                ], 404);
            }

            $historial = InformeKpi::with(['valoresEntrada', 'usuario:id,nombre'])
                ->select('informes_kpi.*')
                ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
                ->where('informes_kpi.id_faena', $idFaena)
                ->orderBy('informes_kpi.fecha_fin_periodo', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $historial,
                'faena' => $faena->nombre,
                'message' => 'Historial de KPI para la faena recuperado con éxito'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al recuperar el historial por faena: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene estadísticas resumidas de valores KPI por faena
     */
    public function getEstadisticasPorFaena()
    {
        try {
            $estadisticas = DB::table('faenas')
                ->leftJoin('informes_kpi', 'faenas.id_faena', '=', 'informes_kpi.id_faena')
                ->leftJoin('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
                ->select(
                    'faenas.id_faena',
                    'faenas.ubicacion',
                    DB::raw('COUNT(DISTINCT informes_kpi.id_informe) as total_informes'),
                    DB::raw('SUM(kpi_valores_entrada.toneladas_extraidas) as total_toneladas'),
                    DB::raw('SUM(kpi_valores_entrada.camionadas) as total_camionadas'),
                    DB::raw('SUM(kpi_valores_entrada.petroleo_toneladas) as total_petroleo_toneladas'),
                    DB::raw('AVG(kpi_valores_entrada.petroleo_horas) as promedio_petroleo_horas'),
                    DB::raw('AVG(kpi_valores_entrada.petroleo_kilometros) as promedio_petroleo_kilometros'),
                    DB::raw('MAX(informes_kpi.fecha_fin_periodo) as ultima_actualizacion')
                )
                ->groupBy('faenas.id_faena', 'faenas.ubicacion')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $estadisticas,
                'message' => 'Estadísticas de KPI por faena recuperadas con éxito'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al recuperar estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene totales acumulados de todos los valores KPI
     */
    public function getTotalesAcumulados()
    {
        try {
            $totales = DB::table('kpi_valores_entrada')
                ->select(
                    DB::raw('SUM(toneladas_extraidas) as total_toneladas_extraidas'),
                    DB::raw('SUM(camionadas) as total_camionadas'),
                    DB::raw('SUM(petroleo_toneladas) as total_petroleo_toneladas'),
                    DB::raw('AVG(petroleo_horas) as promedio_petroleo_horas'),
                    DB::raw('AVG(petroleo_kilometros) as promedio_petroleo_kilometros'),
                    DB::raw('COUNT(*) as total_registros')
                )
                ->first();

            // Obtener el último período actualizado
            $ultimoInforme = InformeKpi::orderBy('fecha_fin_periodo', 'desc')->first();
            $ultimaActualizacion = $ultimoInforme ? $ultimoInforme->fecha_fin_periodo : null;

            return response()->json([
                'success' => true,
                'data' => $totales,
                'ultima_actualizacion' => $ultimaActualizacion,
                'message' => 'Totales acumulados de KPI recuperados con éxito'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al recuperar totales: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener datos estimados desde la tabla de consumos
     */
    private function getDatosConsumoEstimados($idFaena, $fechaInicio, $fechaFin)
    {
        try {
            // Filtro de faena
            $whereFaena = $idFaena && $idFaena !== 'todas' ?
                function ($query) use ($idFaena) {
                    $query->where('c.id_faena', $idFaena);
                } : function ($query) {};

            // Obtener datos agregados de consumo
            $consumoData = DB::table('consumos as c')
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->tap($whereFaena)
                ->select(
                    DB::raw('SUM(c.litros_consumidos) as combustible_consumido'),
                    DB::raw('AVG(c.precio_litro) as precio_combustible'),
                    DB::raw('COUNT(DISTINCT c.id_dotacion) as numero_viajes')
                )
                ->first();

            if (!$consumoData || !$consumoData->combustible_consumido) {
                return null;
            }

            // Crear objeto con datos estimados
            return (object)[
                'toneladas_extraidas' => 0, // No podemos estimar esto desde consumos
                'camionadas' => $consumoData->numero_viajes,
                'combustible_consumido' => $consumoData->combustible_consumido,
                'precio_combustible' => $consumoData->precio_combustible,
                'periodo' => 'mensual',
                'id_faena' => $idFaena,
                'fecha_inicio_periodo' => $fechaInicio,
                'es_estimado' => true
            ];
        } catch (\Exception $e) {
            Log::error('Error al estimar datos desde consumos: ' . $e->getMessage());
            return null;
        }
    }
}
