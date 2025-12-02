<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Faena;

class UserFaenaController extends Controller
{
    /**
     * Obtener todas las faenas asignadas al usuario autenticado
     * O de un usuario específico si se pasa user_id (solo admin)
     */
    public function getFaenas(Request $request)
    {
        try {
            // Si se pasa user_id, obtener ese usuario (requiere permisos de admin)
            if ($request->has('user_id')) {
                $user = User::find($request->user_id);

                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Usuario no encontrado'
                    ], 404);
                }
            } else {
                // Si no, usar el usuario autenticado
                $user = Auth::user();

                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Usuario no autenticado'
                    ], 401);
                }
            }

            // Obtener faenas asignadas desde la tabla pivote
            $faenasAsignadas = $user->faenas()->where('activo', true)->get();

            // Si no tiene faenas asignadas, usar su faena principal
            if ($faenasAsignadas->isEmpty() && $user->id_faena) {
                $faenasPrincipales = Faena::where('id_faena', $user->id_faena)->get();

                return response()->json([
                    'success' => true,
                    'faenas' => $faenasPrincipales,
                    'faena_activa_id' => $user->faena_activa_id ?? $user->id_faena,
                    'usando_faena_principal' => true
                ]);
            }

            return response()->json([
                'success' => true,
                'faenas' => $faenasAsignadas,
                'faena_activa_id' => $user->faena_activa_id ?? $user->id_faena,
                'usando_faena_principal' => false
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener faenas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar la faena activa del usuario
     */
    public function cambiarFaenaActiva(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $request->validate([
                'faena_id' => 'required|integer|exists:faenas,id_faena'
            ]);

            $faenaId = $request->faena_id;

            // Verificar que el usuario tiene acceso a esta faena
            $tieneFaenaPrincipal = $user->id_faena == $faenaId;
            $tieneFaenaAsignada = $user->faenas()->where('faena_id', $faenaId)->exists();

            if (!$tieneFaenaPrincipal && !$tieneFaenaAsignada) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene acceso a esta faena'
                ], 403);
            }

            // Actualizar faena activa
            $user->faena_activa_id = $faenaId;
            $user->save();

            // Obtener datos de la nueva faena
            $faena = Faena::find($faenaId);

            return response()->json([
                'success' => true,
                'message' => 'Faena activa cambiada exitosamente',
                'faena_activa_id' => $faenaId,
                'faena' => $faena
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar faena: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar una faena adicional a un usuario (solo admin)
     */
    public function asignarFaena(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'faena_id' => 'required|integer|exists:faenas,id_faena'
            ]);

            $userId = $request->user_id;
            $faenaId = $request->faena_id;

            // Verificar si ya existe
            $existe = DB::table('user_faena')
                ->where('user_id', $userId)
                ->where('faena_id', $faenaId)
                ->exists();

            if ($existe) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta faena ya está asignada al usuario'
                ], 400);
            }

            // Insertar en tabla pivote
            DB::table('user_faena')->insert([
                'user_id' => $userId,
                'faena_id' => $faenaId,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Faena asignada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar faena: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remover una faena asignada a un usuario (solo admin)
     */
    public function removerFaena(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'faena_id' => 'required|integer|exists:faenas,id_faena'
            ]);

            $userId = $request->user_id;
            $faenaId = $request->faena_id;

            DB::table('user_faena')
                ->where('user_id', $userId)
                ->where('faena_id', $faenaId)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Faena removida exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al remover faena: ' . $e->getMessage()
            ], 500);
        }
    }
}
