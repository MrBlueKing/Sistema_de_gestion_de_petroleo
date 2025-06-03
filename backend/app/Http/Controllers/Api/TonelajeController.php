<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tonelaje;
use App\Models\Faena;
use App\Models\Padron;
use App\Models\TonelajeHistorial; // Nuevo modelo para el historial
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class TonelajeController extends Controller
{
    /**
     * Obtener faenas disponibles
     * GET /api/faenas?fecha=2025-05-21
     */
    public function getFaenas(Request $request)
    {
        try {
            $fecha = $request->input('fecha', Carbon::yesterday()->format('Y-m-d'));
            
            Log::info('Obteniendo faenas para fecha: ' . $fecha);

            // Obtener todas las faenas con sus padrones
            $faenas = Faena::with('padrones.planta')->get();

            $resultado = $faenas->map(function ($faena) use ($fecha) {
                // Filtrar padrones sin registros para la fecha
                $padronesDisponibles = $faena->padrones->filter(function ($padron) use ($fecha) {
                    return !Tonelaje::where('id_padron', $padron->id_padron)
                        ->where('fecha_produccion', $fecha)
                        ->exists();
                });

                return [
                    'id_faena' => $faena->id_faena,
                    'nombre' => $faena->ubicacion,
                    'padrones' => $padronesDisponibles->map(function ($padron) {
                        return [
                            'id_padron' => $padron->id_padron,
                            'nombre' => $padron->nombre,
                            'empresa' => $padron->empresa,
                            'capacidad' => $padron->capacidad,
                            'planta' => [
                                'id_planta' => $padron->planta->id_planta,
                                'nombre' => $padron->planta->nombre
                            ]
                        ];
                    })->values()
                ];
            })->filter(function ($faena) {
                return count($faena['padrones']) > 0;
            })->values();

            return response()->json([
                'status' => 'success',
                'data' => $resultado
            ]);

        } catch (\Exception $e) {
            Log::error('Error en getFaenas: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener faenas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener padrones de una faena
     * GET /api/faenas/{id}/padrones?fecha=2025-05-21
     */
    public function getPadrones(Request $request, $faenaId)
{
    try {
        $fecha = $request->input('fecha', Carbon::yesterday()->format('Y-m-d'));
        
        Log::info("Obteniendo TODOS los padrones para faena $faenaId, fecha: $fecha");
        
        // CAMBIO PRINCIPAL: Obtener TODOS los padrones y combinar con registros existentes
        $padrones = Padron::with('planta')
            ->where('id_faena', $faenaId)
            ->get()
            ->map(function ($padron) use ($fecha) {
                // Buscar si existe un registro para esta fecha
                $registroExistente = Tonelaje::where('id_padron', $padron->id_padron)
                    ->where('fecha_produccion', $fecha)
                    ->first();
                
                return [
                    'id_padron' => $padron->id_padron,
                    'nombre' => $padron->nombre,
                    'empresa' => $padron->empresa,
                    'capacidad' => $padron->capacidad,
                    'planta' => [
                        'nombre' => $padron->planta->nombre
                    ],
                    // NUEVOS CAMPOS: Estado del registro
                    'registro_actual' => $registroExistente ? [
                        'id' => $registroExistente->id,
                        'tonelaje' => $registroExistente->tonelaje,
                        'viajes' => $registroExistente->viajes,
                        'ley' => $registroExistente->ley,
                        'fecha_produccion' => $registroExistente->fecha_produccion,
                        'fue_modificado' => $registroExistente->fue_modificado,
                        'puede_editar' => !$registroExistente->fue_modificado
                    ] : null,
                    'tiene_registro' => !is_null($registroExistente),
                    'fecha_consulta' => $fecha
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $padrones,
            'message' => count($padrones) . ' padrones obtenidos para fecha ' . $fecha,
            'fecha' => $fecha
        ]);

    } catch (\Exception $e) {
        Log::error('Error en getPadrones: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Error al obtener padrones: ' . $e->getMessage(),
            'data' => []
        ], 500);
    }
}

    /**
     * Obtener registros del día
     * GET /api/registros?fecha=2025-05-21
     */
    public function getRegistros(Request $request)
    {
        try {
            $fecha = $request->input('fecha', Carbon::yesterday()->format('Y-m-d'));
            
            Log::info('Obteniendo registros para fecha: ' . $fecha);

            $registros = Tonelaje::with(['padron.faena', 'padron.planta'])
                ->where('fecha_produccion', $fecha)
                ->get();

            // Agrupar por faena
            $agrupados = $registros->groupBy(function ($registro) {
                return $registro->padron->faena->ubicacion;
            })->map(function ($registrosFaena, $nombreFaena) {
                return [
                    'faena' => [
                        'id_faena' => $registrosFaena->first()->padron->faena->id_faena,
                        'nombre' => $nombreFaena
                    ],
                    'registros' => $registrosFaena->map(function ($registro) {
                        return [
                            'id_tonelaje' => $registro->id_tonelaje,
                            'tonelaje' => $registro->tonelaje,
                            'ley' => $registro->ley,
                            'viajes' => $registro->viajes,
                            'fue_editado' => $registro->fue_editado ?? false,
                            'puede_editar' => !($registro->fue_editado ?? false), // Solo puede editar si no ha sido editado
                            'fecha_edicion' => $registro->fecha_edicion,
                            'usuario_edicion' => $registro->usuario_edicion,
                            'motivo_edicion' => $registro->motivo_edicion,
                            'padron' => [
                                'id_padron' => $registro->padron->id_padron,
                                'nombre' => $registro->padron->nombre,
                                'empresa' => $registro->padron->empresa,
                                'capacidad' => $registro->padron->capacidad
                            ],
                            'planta' => [
                                'nombre' => $registro->padron->planta->nombre
                            ]
                        ];
                    })->values()
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $agrupados->values(),
                'resumen_general' => [
                    'total_registros' => $registros->count(),
                    'total_tonelaje' => $registros->sum('tonelaje'),
                    'total_viajes' => $registros->sum('viajes'),
                    'editados' => $registros->where('fue_editado', true)->count(),
                    'sin_editar' => $registros->where('fue_editado', false)->count()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error en getRegistros: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener registros: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo tonelaje
     * POST /api/tonelajes
     */
    public function store(Request $request)
    {
        try {
            Log::info('Datos recibidos para crear tonelaje:', $request->all());

            $validated = $request->validate([
                'id_padron' => 'required|exists:padrones,id_padron',
                'fecha_produccion' => 'required|date',
                'tonelaje' => 'required|numeric|min:0.01',
                'ley' => 'nullable|numeric|min:0|max:100',
                'viajes' => 'nullable|integer|min:0'
            ]);

            // Verificar duplicados
            $existe = Tonelaje::where('id_padron', $validated['id_padron'])
                ->where('fecha_produccion', $validated['fecha_produccion'])
                ->exists();

            if ($existe) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ya existe un registro para este padrón en esta fecha'
                ], 422);
            }

            // Crear registro con campos de control de edición
            $tonelaje = Tonelaje::create([
                'id_padron' => $validated['id_padron'],
                'fecha_produccion' => $validated['fecha_produccion'],
                'tonelaje' => $validated['tonelaje'],
                'ley' => $validated['ley'],
                'viajes' => $validated['viajes'] ?? 0,
                'fue_editado' => false, // Inicializar como no editado
                'fecha_edicion' => null,
                'usuario_edicion' => null,
                'motivo_edicion' => null,
            ]);

            Log::info('Tonelaje creado exitosamente:', ['id' => $tonelaje->id_tonelaje]);

            return response()->json([
                'status' => 'success',
                'message' => 'Tonelaje registrado correctamente',
                'data' => $tonelaje
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Errores de validación:', $e->errors());
            return response()->json([
                'status' => 'error',
                'message' => 'Errores de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error al crear tonelaje: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar tonelaje: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar tonelaje (SOLO UNA VEZ)
     * PUT /api/tonelajes/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $tonelaje = Tonelaje::findOrFail($id);

            // VALIDAR QUE NO HA SIDO EDITADO ANTES
            if ($tonelaje->fue_editado) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Este registro ya fue editado anteriormente y no puede modificarse nuevamente.',
                    'detalles' => [
                        'fecha_edicion' => $tonelaje->fecha_edicion,
                        'usuario_edicion' => $tonelaje->usuario_edicion,
                        'motivo_edicion' => $tonelaje->motivo_edicion
                    ]
                ], 422);
            }

            $validated = $request->validate([
                'tonelaje' => 'required|numeric|min:0.01',
                'ley' => 'nullable|numeric|min:0|max:100',
                'viajes' => 'required|integer|min:0',
                'motivo' => 'required|string|min:10|max:500'
            ]);

            // Guardar valores originales para el historial
            $valoresOriginales = [
                'tonelaje_original' => $tonelaje->tonelaje,
                'ley_original' => $tonelaje->ley,
                'viajes_original' => $tonelaje->viajes
            ];

            // Usar transacción para asegurar consistencia
            DB::beginTransaction();

            try {
                // Crear registro en historial ANTES de actualizar
                TonelajeHistorial::create([
                    'id_tonelaje' => $tonelaje->id_tonelaje,
                    'accion' => 'edicion',
                    'tonelaje_anterior' => $tonelaje->tonelaje,
                    'ley_anterior' => $tonelaje->ley,
                    'viajes_anterior' => $tonelaje->viajes,
                    'tonelaje_nuevo' => $validated['tonelaje'],
                    'ley_nuevo' => $validated['ley'],
                    'viajes_nuevo' => $validated['viajes'],
                    'motivo' => $validated['motivo'],
                    'usuario_id' => Auth::id() ?? 1, // ID del usuario autenticado
                    'fecha_cambio' => now()
                ]);

                // Actualizar el registro y marcar como editado
                $tonelaje->update([
                    'tonelaje' => $validated['tonelaje'],
                    'ley' => $validated['ley'],
                    'viajes' => $validated['viajes'],
                    'fue_editado' => true, // Marcar como editado
                    'fecha_edicion' => now(),
                    'usuario_edicion' => Auth::user()->name ?? 'Sistema',
                    'motivo_edicion' => $validated['motivo']
                ]);

                DB::commit();

                Log::info("Tonelaje {$id} editado por única vez", [
                    'usuario' => Auth::user()->name ?? 'Sistema',
                    'valores_anteriores' => $valoresOriginales,
                    'valores_nuevos' => $validated
                ]);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Registro actualizado correctamente. Esta fue su única edición permitida.',
                    'data' => $tonelaje->fresh()
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error al actualizar: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar si un registro puede editarse
     * GET /api/tonelajes/{id}/puede-editar
     */
    public function puedeEditar($id)
    {
        try {
            $tonelaje = Tonelaje::findOrFail($id);

            return response()->json([
                'status' => 'success',
                'puede_editar' => !$tonelaje->fue_editado,
                'fue_editado' => $tonelaje->fue_editado,
                'detalles_edicion' => $tonelaje->fue_editado ? [
                    'fecha_edicion' => $tonelaje->fecha_edicion,
                    'usuario_edicion' => $tonelaje->usuario_edicion,
                    'motivo_edicion' => $tonelaje->motivo_edicion
                ] : null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al verificar permisos de edición'
            ], 500);
        }
    }

    /**
     * Ver historial completo de un tonelaje
     * GET /api/tonelajes/{id}/historial
     */
    public function getHistorial($id)
    {
        try {
            $tonelaje = Tonelaje::findOrFail($id);
            
            $historial = TonelajeHistorial::where('id_tonelaje', $id)
                ->orderBy('fecha_cambio', 'desc')
                ->get()
                ->map(function ($registro) {
                    return [
                        'id' => $registro->id,
                        'accion' => $registro->accion,
                        'fecha_cambio' => $registro->fecha_cambio,
                        'usuario' => $registro->usuario->name ?? 'Sistema',
                        'motivo' => $registro->motivo,
                        'cambios' => [
                            'tonelaje' => [
                                'anterior' => $registro->tonelaje_anterior,
                                'nuevo' => $registro->tonelaje_nuevo
                            ],
                            'ley' => [
                                'anterior' => $registro->ley_anterior,
                                'nuevo' => $registro->ley_nuevo
                            ],
                            'viajes' => [
                                'anterior' => $registro->viajes_anterior,
                                'nuevo' => $registro->viajes_nuevo
                            ]
                        ]
                    ];
                });

            // Agregar registro de creación si no existe
            if ($historial->where('accion', 'creacion')->isEmpty()) {
                $historial->push([
                    'accion' => 'creacion',
                    'fecha_cambio' => $tonelaje->created_at,
                    'usuario' => 'Sistema',
                    'motivo' => 'Creación inicial del registro',
                    'cambios' => null
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data' => $historial->sortByDesc('fecha_cambio')->values(),
                'resumen' => [
                    'total_cambios' => $historial->count(),
                    'fue_editado' => $tonelaje->fue_editado,
                    'puede_editar' => !$tonelaje->fue_editado
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener historial: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener historial'
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de ediciones
     * GET /api/tonelajes/estadisticas-ediciones
     */
    public function getEstadisticasEdiciones(Request $request)
    {
        try {
            $fecha = $request->input('fecha', Carbon::today()->format('Y-m-d'));

            $estadisticas = Tonelaje::where('fecha_produccion', $fecha)
                ->selectRaw('
                    COUNT(*) as total_registros,
                    SUM(CASE WHEN fue_editado = 1 THEN 1 ELSE 0 END) as registros_editados,
                    SUM(CASE WHEN fue_editado = 0 THEN 1 ELSE 0 END) as registros_sin_editar
                ')
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'fecha' => $fecha,
                    'total_registros' => $estadisticas->total_registros,
                    'registros_editados' => $estadisticas->registros_editados,
                    'registros_sin_editar' => $estadisticas->registros_sin_editar,
                    'porcentaje_editados' => $estadisticas->total_registros > 0 
                        ? round(($estadisticas->registros_editados / $estadisticas->total_registros) * 100, 2)
                        : 0
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener estadísticas'
            ], 500);
        }
    }

    /**
     * Métodos básicos del CRUD
     */
    public function sindex(Request $request)
    {
        $tonelajes = Tonelaje::with(['padron.faena', 'padron.planta'])->get();
        return response()->json(['status' => 'success', 'data' => $tonelajes]);
    }

    public function show($id)
    {
        try {
            $tonelaje = Tonelaje::with(['padron.faena', 'padron.planta'])->findOrFail($id);
            return response()->json(['status' => 'success', 'data' => $tonelaje]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'No encontrado'], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $tonelaje = Tonelaje::findOrFail($id);
            
            // No permitir eliminar si fue editado
            if ($tonelaje->fue_editado) {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'No se puede eliminar un registro que ya fue editado'
                ], 422);
            }
            
            $tonelaje->delete();
            return response()->json(['status' => 'success', 'message' => 'Eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al eliminar'], 500);
        }
    }
}