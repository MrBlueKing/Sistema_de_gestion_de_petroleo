<?php

namespace App\Http\Controllers\Api\OperadorVehiculo;

use App\Http\Controllers\Controller;
// ✅ Cambio aquí - quitar AsignacionPersonalMaquina que no se usa
use App\Models\OperadorVehiculo\CargaExterna;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CargaExternaController extends Controller
{
    /**
     * Crear carga externa - VERSIÓN SIMPLE PARA TESTING
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validaciones básicas
            $validated = $request->validate([
                'numero_boleta' => 'required|string|max:50',
                'litros' => 'required|numeric|min:0.01',
                'costo' => 'required|numeric|min:0.01',
                'precio_por_litro' => 'nullable|numeric|min:0', // ✅ Agregado
                'fecha_carga' => 'required|date',
                'ubicacion' => 'required|string|max:100',
                'id_user' => 'required|integer', // Por ahora manual
                'id_maquina' => 'required|integer', // Por ahora manual
                'tipo_combustible' => 'nullable|string|max:30',
                'observaciones' => 'nullable|string'
            ]);

            // Crear la carga
            $carga = CargaExterna::create([
                'id_user' => $validated['id_user'],
                'id_maquina' => $validated['id_maquina'],
                'numero_boleta' => $validated['numero_boleta'],
                'litros' => $validated['litros'],
                'costo' => $validated['costo'],
                'precio_por_litro' => $validated['precio_por_litro'] ?? round($validated['costo'] / $validated['litros'], 2), // ✅ Agregado con cálculo automático
                'fecha_carga' => $validated['fecha_carga'],
                'ubicacion' => $validated['ubicacion'],
                'tipo_combustible' => $validated['tipo_combustible'] ?? 'Diesel',
                'observaciones' => $validated['observaciones'],
                'estado' => 'pendiente'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Carga externa creada exitosamente',
                'data' => $carga
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
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

            // Obtener cargas del usuario
            $cargas = CargaExterna::where('id_user', $user->id)
                ->orderBy('fecha_carga', 'desc')
                ->get();

            // Calcular resumen del mes actual
            $mesActual = Carbon::now()->format('Y-m');
            $cargasMes = $cargas->filter(function ($carga) use ($mesActual) {
                return Carbon::parse($carga->fecha_carga)->format('Y-m') === $mesActual;
            });

            $resumen = [
                'pendientes' => $cargasMes->where('estado', 'pendiente')->count(),
                'aprobadas' => $cargasMes->where('estado', 'aprobado')->count(),
                'rechazadas' => $cargasMes->where('estado', 'rechazado')->count(),
                'total_mes' => $cargasMes->count(),
                'litros_mes' => $cargasMes->sum('litros'),
                'costo_mes' => $cargasMes->sum('costo')
            ];

            // Obtener las 5 cargas más recientes
            $cargasRecientes = $cargas->take(5)->map(function ($carga) {
                return [
                    'id' => $carga->id,
                    'numero_boleta' => $carga->numero_boleta,
                    'fecha' => $carga->fecha_carga,
                    'fecha_legible' => Carbon::parse($carga->fecha_carga)->format('d M Y'),
                    'litros' => $carga->litros,
                    'costo' => $carga->costo,
                    'precio_por_litro' => $carga->precio_por_litro,
                    'ubicacion' => $carga->ubicacion,
                    'estado' => $carga->estado,
                    'tipo_combustible' => $carga->tipo_combustible,
                    'observaciones' => $carga->observaciones
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'resumen' => $resumen,
                    'cargas_recientes' => $cargasRecientes,
                    'total_cargas' => $cargas->count()
                ],
                'message' => "Datos del usuario obtenidos correctamente"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener cargas del usuario: ' . $e->getMessage()
            ], 500);
        }
    }
}
