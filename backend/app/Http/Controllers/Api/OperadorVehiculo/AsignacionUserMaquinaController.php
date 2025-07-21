<?php

namespace App\Http\Controllers\Api\OperadorVehiculo;

use App\Http\Controllers\Controller;
use App\Models\Maquinas;
use App\Models\OperadorVehiculo\AsignacionPersonalMaquina;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AsignacionUserMaquinaController extends Controller
{
    /**
     * Obtener todas las asignaciones activas
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AsignacionPersonalMaquina::with(['user', 'maquina.maquinaInterna'])
                ->activas()
                ->orderBy('fecha_asignacion', 'desc');

            // Filtros opcionales
            if ($request->has('id_user')) {
                $query->porUsuario($request->id_user);
            }

            if ($request->has('id_maquina')) {
                $query->porMaquina($request->id_maquina);
            }

            $asignaciones = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $asignaciones,
                'message' => "Se encontraron {$asignaciones->count()} asignaciones activas"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener asignaciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva asignación
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'id_user' => 'required|exists:users,id',
                'id_maquina' => 'required|exists:maquinas,id_maquina',
                'observaciones' => 'nullable|string|max:500'
            ]);

            // Verificar que el usuario no tenga ya una máquina asignada
            $asignacionExistente = AsignacionPersonalMaquina::where('id_user', $validated['id_user'])
                ->where('activo', true)
                ->first();

            if ($asignacionExistente) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El usuario ya tiene una máquina asignada',
                    'data' => $asignacionExistente->load(['maquina.maquinaInterna'])
                ], 400);
            }

            // Verificar que la máquina no esté ya asignada
            $maquinaAsignada = AsignacionPersonalMaquina::where('id_maquina', $validated['id_maquina'])
                ->where('activo', true)
                ->first();

            if ($maquinaAsignada) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La máquina ya está asignada a otro usuario',
                    'data' => $maquinaAsignada->load(['user'])
                ], 400);
            }

            // Crear la asignación
            $asignacion = AsignacionPersonalMaquina::create([
                'id_user' => $validated['id_user'],
                'id_maquina' => $validated['id_maquina'],
                'fecha_asignacion' => now()->toDateString(),
                'activo' => true,
                'observaciones' => $validated['observaciones'] ?? null
            ]);

            return response()->json([
                'status' => 'success',
                'data' => $asignacion->load(['user', 'maquina.maquinaInterna']),
                'message' => 'Asignación creada exitosamente'
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Datos de validación incorrectos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear asignación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar asignación específica
     */
    public function show($id): JsonResponse
    {
        try {
            $asignacion = AsignacionPersonalMaquina::with(['user', 'maquina.maquinaInterna'])
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $asignacion
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Asignación no encontrada'
            ], 404);
        }
    }

    /**
     * Reasignar máquina (desactiva la anterior y crea nueva)
     */
    public function reasignar(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'id_user' => 'required|exists:users,id',
                'id_maquina_nueva' => 'required|exists:maquinas,id_maquina',
                'observaciones' => 'nullable|string|max:500'
            ]);

            // Verificar que la nueva máquina no esté asignada
            $maquinaAsignada = AsignacionPersonalMaquina::where('id_maquina', $validated['id_maquina_nueva'])
                ->where('activo', true)
                ->first();

            if ($maquinaAsignada) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La máquina ya está asignada a otro usuario',
                    'data' => $maquinaAsignada->load(['user'])
                ], 400);
            }

            $nuevaAsignacion = AsignacionPersonalMaquina::reasignar(
                $validated['id_user'],
                $validated['id_maquina_nueva'],
                $validated['observaciones'] ?? null
            );

            return response()->json([
                'status' => 'success',
                'data' => $nuevaAsignacion->load(['user', 'maquina.maquinaInterna']),
                'message' => 'Reasignación realizada exitosamente'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Datos de validación incorrectos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al reasignar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Desactivar asignación
     */
    public function desactivar($id): JsonResponse
    {
        try {
            $asignacion = AsignacionPersonalMaquina::findOrFail($id);

            $asignacion->update([
                'activo' => false,
                'observaciones' => ($asignacion->observaciones ?? '') . ' | Desactivada el ' . now()->format('d/m/Y H:i')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Asignación desactivada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al desactivar asignación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener máquina asignada al usuario autenticado CON ÚLTIMA MEDICIÓN
     * ✅ VERSIÓN MEJORADA - Incluye último consumo/medición
     */
    public function getMaquinaUsuario(Request $request): JsonResponse
    {
        try {
            // 🎯 Obtener el ID del usuario autenticado
            $userId = $request->user()->id;

            // 🔍 Buscar la asignación activa del usuario autenticado
            $asignacion = AsignacionPersonalMaquina::with([
                'user:id,rut,nombre,apellido,email,id_rol,id_faena,estado',
                'maquina.maquinaInterna'
            ])
                ->where('id_user', $userId)
                ->where('activo', true)
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No tienes una máquina asignada actualmente',
                    'data' => null
                ], 404);
            }

            // ✅ NUEVO: Obtener la última medición de consumos
            $ultimamedicion = DB::table('consumos')
                ->where('id_equipo', $asignacion->id_maquina)
                ->orderBy('created_at', 'desc') // O el campo de fecha que uses
                ->first();

            // ✅ NUEVO: Agregar la última medición a los datos de la máquina
            $asignacionData = $asignacion->toArray();

            if ($ultimamedicion) {
                $asignacionData['maquina']['ultima_medicion'] = [
                    'medicion' => $ultimamedicion->medicion,
                    'fecha_medicion' => $ultimamedicion->created_at,
                ];
            } else {
                $asignacionData['maquina']['ultima_medicion'] = null;
            }

            return response()->json([
                'status' => 'success',
                'data' => $asignacionData,
                'message' => 'Máquina asignada obtenida exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener máquina asignada: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Alternativa: Obtener solo información del usuario autenticado
     */
    public function miInformacion(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Cargar relaciones adicionales si las necesitas
            $user->load(['faena', 'rol']);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'rut' => $user->rut,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido, // ✅ Apellido incluido
                    'nombreCompleto' => $user->nombre . ' ' . $user->apellido,
                    'email' => $user->email,
                    'rol' => $user->rol->nombre ?? 'Sin rol',
                    'faena' => $user->faena->nombre ?? 'Sin faena',
                    'id_faena' => $user->id_faena,
                    'estado' => $user->estado
                ],
                'message' => 'Información del usuario obtenida exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener información del usuario: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Obtener usuario asignado a una máquina específica
     */
    public function getUsuarioMaquina($idMaquina): JsonResponse
    {
        try {
            $asignacion = AsignacionPersonalMaquina::getUserAsignado($idMaquina);

            if (!$asignacion) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La máquina no tiene un usuario asignado'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $asignacion
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener usuario asignado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener usuarios sin asignar
     */
    public function usuariosSinAsignar(): JsonResponse
    {
        try {
            $usuariosAsignados = AsignacionPersonalMaquina::where('activo', true)
                ->pluck('id_user')
                ->toArray();

            $usuariosSinAsignar = User::whereNotIn('id', $usuariosAsignados)
                ->with(['rol', 'faena'])
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $usuariosSinAsignar,
                'message' => "Se encontraron {$usuariosSinAsignar->count()} usuarios sin asignar"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener usuarios sin asignar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener máquinas sin asignar
     */
    public function maquinasSinAsignar(): JsonResponse
    {
        try {
            $maquinasAsignadas = AsignacionPersonalMaquina::where('activo', true)
                ->pluck('id_maquina')
                ->toArray();

            $maquinasSinAsignar = Maquinas::whereNotIn('id_maquina', $maquinasAsignadas)
                ->with(['maquinaInterna', 'categoria'])
                ->operativas()
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $maquinasSinAsignar,
                'message' => "Se encontraron {$maquinasSinAsignar->count()} máquinas sin asignar"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener máquinas sin asignar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
