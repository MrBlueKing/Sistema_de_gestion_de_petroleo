<?php

namespace App\Http\Controllers\Api\AdminOperador;

use App\Http\Controllers\Controller;
use App\Models\Faena;
use App\Models\Maquinas;
use App\Models\OperadorVehiculo\AsignacionPersonalMaquina;
use App\Models\OperadorVehiculo\CargaExterna;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminOperadorController extends Controller
{
     /**
     * 📋 LISTAR TODAS LAS CARGAS EXTERNAS
     * Solo para consulta del admin
     */
    public function index(Request $request)
    {
        try {
            // Obtener todas las cargas con sus relaciones
            $cargas = CargaExterna::with([
                'user:id,nombre,apellido,email,rut',
                'maquina:id_maquina,nombre_maquina,patente',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $cargas,
                'total' => $cargas->count(),
                'resumen' => [
                    'pendientes' => $cargas->where('estado', 'pendiente')->count(),
                    'aprobadas' => $cargas->where('estado', 'aprobado')->count(),
                    'rechazadas' => $cargas->where('estado', 'rechazado')->count(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las cargas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 👁️ VER UNA CARGA ESPECÍFICA
     * Detalles completos para el admin
     */
    public function show($id)
    {
        try {
            $carga = CargaExterna::with([
                'user:id,nombre,apellido,email,rut',
                'maquina:id_maquina,nombre_maquina,patente,modelo,marca',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido,email'
            ])->find($id);

            if (!$carga) {
                return response()->json([
                    'success' => false,
                    'message' => 'Carga no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $carga
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la carga',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ APROBAR CARGA
     * Solo el admin puede aprobar
     */
    public function aprobar(Request $request, $id)
    {
        try {
            $carga = CargaExterna::find($id);

            if (!$carga) {
                return response()->json([
                    'success' => false,
                    'message' => 'Carga no encontrada'
                ], 404);
            }

            // Verificar que esté pendiente
            if ($carga->estado !== 'pendiente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden aprobar cargas pendientes'
                ], 400);
            }

            // Aprobar la carga
            $carga->update([
                'estado' => 'aprobado',
                'aprobado_por' => $request->user()->id,
                'fecha_aprobacion' => now(),
                'motivo_rechazo' => null // Limpiar motivo si existía
            ]);

            // Cargar relaciones para la respuesta
            $carga->load([
                'user:id,nombre,apellido,email',
                'maquina:id_maquina,nombre_maquina,patente',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Carga aprobada exitosamente',
                'data' => $carga
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar la carga',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ❌ RECHAZAR CARGA
     * Solo el admin puede rechazar (con motivo obligatorio)
     */
    public function rechazar(Request $request, $id)
    {
        try {
            // Validar que venga el motivo
            $request->validate([
                'motivo_rechazo' => 'required|string|max:500'
            ]);

            $carga = CargaExterna::find($id);

            if (!$carga) {
                return response()->json([
                    'success' => false,
                    'message' => 'Carga no encontrada'
                ], 404);
            }

            // Verificar que esté pendiente
            if ($carga->estado !== 'pendiente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden rechazar cargas pendientes'
                ], 400);
            }

            // Rechazar la carga
            $carga->update([
                'estado' => 'rechazado',
                'aprobado_por' => $request->user()->id,
                'fecha_aprobacion' => now(),
                'motivo_rechazo' => $request->motivo_rechazo
            ]);

            // Cargar relaciones para la respuesta
            $carga->load([
                'user:id,nombre,apellido,email',
                'maquina:id_maquina,nombre_maquina,patente',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Carga rechazada exitosamente',
                'data' => $carga
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al rechazar la carga',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
