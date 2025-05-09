<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KpiValoresEntrada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon; // Añadido el import correcto para Carbon
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
     * Obtener historial de valores KPI para un mes específico
     */
    public function obtenerHistorial(Request $request)
    {
        try {
            // Obtener parámetros de la solicitud
            $idFaena = $request->input('faena');
            $mes = $request->input('mes'); // Formato YYYY-MM

            // Si no se especifica mes, usar el mes anterior por defecto
            if (!$mes) {
                $mes = Carbon::now()->subMonth()->format('Y-m');
            }

            // Convertir a Carbon para manipulación de fechas
            $fecha = Carbon::createFromFormat('Y-m', $mes);
            $inicioMes = $fecha->copy()->startOfMonth();
            $finMes = $fecha->copy()->endOfMonth();

            Log::info("Buscando KPI valores entrada para: {$mes}, faena: {$idFaena}");

            // Filtro de faena
            $whereFaena = $idFaena && $idFaena !== 'todas' ?
                function ($query) use ($idFaena) {
                    $query->where('informes_kpi.id_faena', $idFaena);
                } : function ($query) {};

            // Búsqueda en kpi_valores_entrada para el período especificado
            $valores = DB::table('informes_kpi')
                ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
                ->whereBetween('informes_kpi.fecha_inicio_periodo', [$inicioMes, $finMes])
                ->tap($whereFaena)
                ->select(
                    'kpi_valores_entrada.*',
                    'informes_kpi.id_faena',
                    'informes_kpi.periodo',
                    'informes_kpi.fecha_inicio_periodo',
                    'informes_kpi.fecha_creacion'
                )
                ->orderBy('informes_kpi.fecha_creacion', 'desc')
                ->get();

            // Si no hay datos en kpi_valores_entrada, buscar en consumos para estimar valores
            if ($valores->isEmpty()) {
                Log::info("No se encontraron valores en kpi_valores_entrada, buscando datos en consumos");

                // Obtener datos de consumo para el período
                $datosConsumo = $this->getDatosConsumoEstimados($idFaena, $inicioMes, $finMes);

                if ($datosConsumo) {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Datos estimados desde consumos',
                        'data' => [$datosConsumo],
                        'es_estimado' => true
                    ]);
                }

                // Si no hay datos en ninguna tabla
                return response()->json([
                    'status' => 'warning',
                    'message' => 'No se encontraron datos para el período y faena seleccionados',
                    'data' => []
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data' => $valores,
                'es_estimado' => false
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener historial KPI: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos históricos: ' . $e->getMessage()
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
