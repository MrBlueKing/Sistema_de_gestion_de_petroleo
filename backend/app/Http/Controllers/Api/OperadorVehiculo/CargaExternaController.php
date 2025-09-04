<?php

namespace App\Http\Controllers\Api\OperadorVehiculo;

use App\Http\Controllers\Controller;
// ✅ Cambio aquí - quitar AsignacionPersonalMaquina que no se usa
use App\Models\OperadorVehiculo\CargaExterna;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CargaExternaController extends Controller
{
    /**
     * Crear carga externa - VERSIÓN SIMPLE PARA TESTING
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // ✅ VALIDACIONES ACTUALIZADAS
            $validated = $request->validate([
                'numero_boleta' => 'required|string|max:50',
                'litros' => 'required|numeric|min:0.01',
                'costo' => 'required|numeric|min:0.01',
                'precio_por_litro' => 'nullable|numeric|min:0',
                'id_user' => 'required|integer|exists:users,id',
                'id_maquina' => 'required|integer|exists:maquinas,id_maquina',
                'id_faena' => 'required|integer|exists:faenas,id_faena', // ✅ NUEVA VALIDACIÓN
                'ubicacion' => 'nullable|string|max:255', // ✅ TEXTO LIBRE
                'tipo_combustible' => 'nullable|string|max:30',
                'observaciones' => 'nullable|string',
                'medicion' => 'nullable|numeric'
            ]);

            Log::info('Datos validados para carga externa:', $validated);

            // ✅ CREAR LA CARGA CON NUEVOS CAMPOS
            $carga = CargaExterna::create([
                'id_user' => $validated['id_user'],
                'id_maquina' => $validated['id_maquina'],
                'numero_boleta' => $validated['numero_boleta'],
                'litros' => $validated['litros'],
                'costo' => $validated['costo'],
                'precio_por_litro' => $validated['precio_por_litro'] ?? round($validated['costo'] / $validated['litros'], 2),
                'id_faena' => $validated['id_faena'],     // ✅ NUEVA
                'ubicacion' => $validated['ubicacion'],   // ✅ TEXTO LIBRE
                'tipo_combustible' => $validated['tipo_combustible'],
                'observaciones' => $validated['observaciones'] ?? null,
                'medicion' => $validated['medicion'],
                'estado' => 'Por Rendir'
            ]);

            // Cargar las relaciones para la respuesta
            $carga->load(['user', 'maquina', 'faena']);

            return response()->json([
                'status' => 'success',
                'message' => 'Carga externa creada exitosamente',
                'data' => $carga
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Errores de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear carga: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar cargas - SOLO PARA VER QUE SE GUARDÓ
     */
    public function index(): JsonResponse
    {
        try {
            $cargas = CargaExterna::orderBy('created_at', 'desc')->get();

            return response()->json([
                'status' => 'success',
                'total' => $cargas->count(),
                'data' => $cargas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Obtener cargas del usuario autenticado con resumen
     */
    public function misCargas(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            Log::info("Obteniendo cargas para usuario ID: {$user->id}");

            // 🆕 PARÁMETRO PARA LÍMITE DINÁMICO
            $limite = $request->get('limite', 50); // Default 50 en lugar de 5

            $now = Carbon::now();

            // Cargas del mes actual directamente desde DB
            $cargasMes = CargaExterna::where('id_user', $user->id)
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->orderBy('created_at', 'desc')
                ->get();

            // Resumen del mes actual (se mantiene igual)
            $resumen = [
                'pendientes'  => $cargasMes->where('estado', 'pendiente')->count(),
                'aprobadas'   => $cargasMes->where('estado', 'aprobado')->count(),
                'rechazadas'  => $cargasMes->where('estado', 'rechazado')->count(),
                'total_mes'   => $cargasMes->count(),
                'litros_mes'  => $cargasMes->sum('litros'),
                'costo_mes'   => $cargasMes->sum('costo'),
            ];

            // 🚀 CAMBIO PRINCIPAL: Respetar el límite solicitado
            $cargasRecientes = $cargasMes->take($limite)->map(function ($carga) {
                return [
                    'id'              => $carga->id,
                    'numero_boleta'   => $carga->numero_boleta,
                    'fecha'           => $carga->created_at,
                    'fecha_legible'   => Carbon::parse($carga->created_at)->format('d M Y'),
                    'litros'          => $carga->litros,
                    'costo'           => $carga->costo,
                    'precio_por_litro' => $carga->precio_por_litro,
                    'ubicacion'       => $carga->ubicacion,
                    'estado'          => $carga->estado,
                    'tipo_combustible' => $carga->tipo_combustible,
                    'observaciones'   => $carga->observaciones,
                ];
            });

            Log::info("Cargas devueltas: {$cargasRecientes->count()} de {$cargasMes->count()} totales");

            return response()->json([
                'status'  => 'success',
                // 🔄 ESTRUCTURA SIMPLIFICADA - directamente en el root
                'resumen'        => $resumen,
                'cargas_recientes' => $cargasRecientes,
                'total_cargas'   => $cargasMes->count(),
                'message' => "Datos del usuario obtenidos correctamente"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al obtener cargas del usuario: ' . $e->getMessage()
            ], 500);
        }
    }


    public function cargasMesActual(Request $request)
    {
        try {
            // ✅ Obtener ID de la máquina (parámetro en query o body)
            $idMaquina = $request->input('id_maquina');

            if (!$idMaquina) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Debe proporcionar un id_maquina'
                ], 400);
            }

            // ✅ Fechas de referencia
            $inicioMesActual = Carbon::now()->startOfMonth();
            $finMesActual = Carbon::now()->endOfMonth();

            $inicioMesAnterior = Carbon::now()->subMonth()->startOfMonth();
            $finMesAnterior = Carbon::now()->subMonth()->endOfMonth();

            Log::info("Obteniendo datos de consumos para maquina ID: $idMaquina");
            Log::info("Fechas de referencias MES ACTUAl: $inicioMesActual - $finMesActual");
            Log::info("Fechas de referencias MES ANTERIOR: $inicioMesAnterior - $finMesAnterior");

            // ✅ Consultar en la vista `consumos_unificados`
            $consumos = DB::table('consumos_unificados')
                ->where('id_equipo', $idMaquina)
                ->whereBetween('fecha_consumo', [$inicioMesAnterior, $finMesActual]) // incluye mes actual + anterior
                ->orderBy('fecha_consumo', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Consumos del mes actual y anterior',
                'data' => $consumos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener consumos: ' . $e->getMessage()
            ], 500);
        }
    }
}
