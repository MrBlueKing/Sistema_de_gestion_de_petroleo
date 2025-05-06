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
            switch($periodo) {
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
                        'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'may' => 5, 'jun' => 6,
                        'jul' => 7, 'aug' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12
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
                $query->whereHas('informe', function($q) use ($request) {
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
}