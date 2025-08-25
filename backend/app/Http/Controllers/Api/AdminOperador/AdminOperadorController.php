<?php

namespace App\Http\Controllers\Api\AdminOperador;

use App\Http\Controllers\Controller;
use App\Models\Maquinas;
use App\Models\OperadorVehiculo\CargaExterna;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminOperadorController extends Controller
{
    /**
     * 📋 Listar todas las cargas externas con información completa
     * Endpoint: GET /api/adminOperador/cargas
     */
    public function index(): JsonResponse
    {
        try {
            // Obtener cargas externas con relaciones cargadas
            $cargas = CargaExterna::with([
                'user:id,nombre,apellido,rut,id_faena',
                'user.faena:id_faena,ubicacion', // ✅ NUEVO: Traer también la faena del usuario
                'maquina:id_maquina,nombre_maquina,patente,id_categoria',
                'maquina.categoria:id_categoria,nombre_categoria',
                'faena:id_faena,ubicacion'
            ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Formatear los datos para el frontend
            $cargasFormateadas = $cargas->map(function ($carga) {
                return [
                    'id' => $carga->id,
                    'numero_boleta' => $carga->numero_boleta,
                    'litros' => (float) $carga->litros,
                    'costo' => (float) $carga->costo,
                    'precio_por_litro' => (float) $carga->precio_por_litro,
                    'medicion' => $carga->medicion,
                    'ubicacion' => $carga->ubicacion,
                    'tipo_combustible' => $carga->tipo_combustible,
                    'observaciones' => $carga->observaciones,
                    'estado' => $carga->estado,
                    'created_at' => $carga->created_at,
                    'fecha_aprobacion' => $carga->fecha_aprobacion,
                    'motivo_rechazo' => $carga->motivo_rechazo,
                    'id_faena' => $carga->id_faena, // ✅ AGREGAR ESTA LÍNEA


                    // Información del usuario
                    'user' => [
                        'id' => $carga->user->id ?? null,
                        'nombre' => $carga->user->nombre ?? 'Usuario no encontrado',
                        'apellido' => $carga->user->apellido ?? '',
                        'rut' => $carga->user->rut ?? 'Sin RUT',
                        'id_faena' => $carga->user->id_faena ?? null, // ✅ NUEVO: ID de faena del usuario
                        'faena_usuario' => $carga->user->faena->ubicacion ?? 'Sin faena asignada', // ✅ NUEVO: Nombre de la faena del usuario
                        'nombre_completo' => ($carga->user->nombre ?? 'Usuario') . ' ' . ($carga->user->apellido ?? 'no encontrado')
                    ],

                    // Información de la máquina
                    'maquina' => [
                        'id' => $carga->maquina->id_maquina ?? null,
                        'nombre_maquina' => $carga->maquina->nombre_maquina ?? 'Máquina no encontrada',
                        'patente' => $carga->maquina->patente ?? 'Sin patente',
                        'categoria' => [
                            'id' => $carga->maquina->categoria->id_categoria ?? null,
                            'nombre' => $carga->maquina->categoria->nombre_categoria ?? 'Sin categoría'
                        ]
                    ],

                    // Información de la faena
                    'faena' => [
                        'id' => $carga->faena->id_faena ?? 6, // Default para cargas externas
                        'ubicacion' => $carga->faena->ubicacion ?? 'Cargas Externas'
                    ]
                ];
            });

            // Calcular estadísticas
            $estadisticas = [
                'total' => $cargas->count(),
                'pendientes' => $cargas->where('estado', 'pendiente')->count(),
                'aprobadas' => $cargas->where('estado', 'aprobado')->count(),
                'rechazadas' => $cargas->where('estado', 'rechazado')->count(),
                'total_litros' => $cargas->sum('litros'),
                'total_costo' => $cargas->sum('costo'),
                'promedio_precio_litro' => $cargas->count() > 0 ? $cargas->avg('precio_por_litro') : 0
            ];

            // Estadísticas del mes actual
            $mesActual = Carbon::now()->format('Y-m');
            $cargasMes = $cargas->filter(function ($carga) use ($mesActual) {
                return Carbon::parse($carga->created_at)->format('Y-m') === $mesActual;
            });

            $estadisticasMes = [
                'total_mes' => $cargasMes->count(),
                'pendientes_mes' => $cargasMes->where('estado', 'pendiente')->count(),
                'aprobadas_mes' => $cargasMes->where('estado', 'aprobado')->count(),
                'rechazadas_mes' => $cargasMes->where('estado', 'rechazado')->count(),
                'litros_mes' => $cargasMes->sum('litros'),
                'costo_mes' => $cargasMes->sum('costo')
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Cargas externas obtenidas correctamente',
                'data' => $cargasFormateadas,
                'estadisticas' => array_merge($estadisticas, $estadisticasMes),
                'meta' => [
                    'total_registros' => $cargas->count(),
                    'fecha_consulta' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener cargas externas para admin:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener cargas externas: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * 🔍 Mostrar detalle de una carga específica
     * Endpoint: GET /api/adminOperador/cargas/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $carga = CargaExterna::with([
                'user:id,nombre,apellido,rut,email,id_faena',
                'user.faena:id_faena,ubicacion', // ✅ NUEVO: Traer también la faena del usuario
                'maquina:id_maquina,nombre_maquina,patente,id_categoria',
                'maquina.categoria:id_categoria,nombre_categoria',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido' // Usuario que aprobó/rechazó
            ])->findOrFail($id);

            // Formatear los datos igual que en index() pero con más detalles
            $cargaFormateada = [
                'id' => $carga->id,
                'numero_boleta' => $carga->numero_boleta,
                'litros' => (float) $carga->litros,
                'costo' => (float) $carga->costo,
                'precio_por_litro' => (float) $carga->precio_por_litro,
                'medicion' => $carga->medicion,
                'ubicacion' => $carga->ubicacion,
                'tipo_combustible' => $carga->tipo_combustible,
                'observaciones' => $carga->observaciones,
                'estado' => $carga->estado,
                'created_at' => $carga->created_at,
                'fecha_aprobacion' => $carga->fecha_aprobacion,
                'motivo_rechazo' => $carga->motivo_rechazo,

                // Información del usuario (más completa)
                'user' => [
                    'id' => $carga->user->id ?? null,
                    'nombre' => $carga->user->nombre ?? 'Usuario no encontrado',
                    'apellido' => $carga->user->apellido ?? '',
                    'rut' => $carga->user->rut ?? 'Sin RUT',
                    'email' => $carga->user->email ?? 'Sin email',
                    'nombre_completo' => ($carga->user->nombre ?? 'Usuario') . ' ' . ($carga->user->apellido ?? 'no encontrado')
                ],

                // Información de la máquina (más completa)
                'maquina' => [
                    'id' => $carga->maquina->id_maquina ?? null,
                    'nombre_maquina' => $carga->maquina->nombre_maquina ?? 'Máquina no encontrada',
                    'patente' => $carga->maquina->patente ?? 'Sin patente',
                    'categoria' => [
                        'id' => $carga->maquina->categoria->id_categoria ?? null,
                        'nombre' => $carga->maquina->categoria->nombre_categoria ?? 'Sin categoría'
                    ]
                ],

                // Información de la faena
                'faena' => [
                    'id' => $carga->faena->id_faena ?? 6,
                    'ubicacion' => $carga->faena->ubicacion ?? 'Cargas Externas'
                ],

                // Información de quien aprobó/rechazó
                'aprobadoPor' => $carga->aprobadoPor ? [
                    'id' => $carga->aprobadoPor->id,
                    'nombre' => $carga->aprobadoPor->nombre,
                    'apellido' => $carga->aprobadoPor->apellido,
                    'nombre_completo' => $carga->aprobadoPor->nombre . ' ' . $carga->aprobadoPor->apellido
                ] : null
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Detalle de carga obtenido correctamente',
                'data' => $cargaFormateada
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener detalle de carga:', [
                'carga_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Carga no encontrada'
            ], 404);
        }
    }

    /**
     * ✅ Aprobar una carga externa
     * Endpoint: POST /api/adminOperador/cargas/{id}/aprobar
     */
    public function aprobar(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $carga = CargaExterna::findOrFail($id);

            // Verificar que la carga esté pendiente
            if ($carga->estado !== 'pendiente') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Solo se pueden aprobar cargas pendientes. Estado actual: ' . $carga->estado
                ], 400);
            }

            // Actualizar el estado de la carga
            $carga->update([
                'estado' => 'aprobado',
                'aprobado_por' => $user->id,
                'fecha_aprobacion' => now(),
                'motivo_rechazo' => null // Limpiar motivo de rechazo si existía
            ]);

            // Crear registro en consumos_unificados
            $this->crearConsumoUnificado($carga);

            Log::info('Carga externa aprobada', [
                'carga_id' => $carga->id,
                'numero_boleta' => $carga->numero_boleta,
                'aprobado_por' => $user->id,
                'fecha_aprobacion' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Carga aprobada correctamente',
                'data' => $carga->fresh(['user', 'maquina', 'faena'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error al aprobar carga:', [
                'carga_id' => $id,
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? null
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al aprobar carga: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ❌ Rechazar una carga externa
     * Endpoint: POST /api/adminOperador/cargas/{id}/rechazar
     */
    public function rechazar(Request $request, $id): JsonResponse
    {
        try {
            // Validar que se proporcione un motivo
            $validated = $request->validate([
                'motivo_rechazo' => 'required|string|max:500|min:10'
            ], [
                'motivo_rechazo.required' => 'El motivo del rechazo es obligatorio',
                'motivo_rechazo.min' => 'El motivo debe tener al menos 10 caracteres',
                'motivo_rechazo.max' => 'El motivo no puede exceder 500 caracteres'
            ]);

            $user = $request->user();
            $carga = CargaExterna::findOrFail($id);

            // Verificar que la carga esté pendiente
            if ($carga->estado !== 'pendiente') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Solo se pueden rechazar cargas pendientes. Estado actual: ' . $carga->estado
                ], 400);
            }

            // Actualizar el estado de la carga
            $carga->update([
                'estado' => 'rechazado',
                'aprobado_por' => $user->id,
                'fecha_aprobacion' => now(),
                'motivo_rechazo' => $validated['motivo_rechazo']
            ]);

            Log::info('Carga externa rechazada', [
                'carga_id' => $carga->id,
                'numero_boleta' => $carga->numero_boleta,
                'rechazado_por' => $user->id,
                'motivo' => $validated['motivo_rechazo'],
                'fecha_rechazo' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Carga rechazada correctamente',
                'data' => $carga->fresh(['user', 'maquina', 'faena'])
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Errores de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error al rechazar carga:', [
                'carga_id' => $id,
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? null
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al rechazar carga: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📊 Obtener estadísticas del dashboard (opcional)
     * Endpoint: GET /api/adminOperador/estadisticas
     */
    public function estadisticas(Request $request): JsonResponse
    {
        try {
            $fechaDesde = $request->get('fecha_desde', now()->startOfMonth());
            $fechaHasta = $request->get('fecha_hasta', now()->endOfMonth());

            $cargas = CargaExterna::whereBetween('created_at', [$fechaDesde, $fechaHasta])->get();

            $resumen = [
                'periodo' => [
                    'desde' => $fechaDesde,
                    'hasta' => $fechaHasta
                ],
                'totales' => [
                    'cargas' => $cargas->count(),
                    'litros' => $cargas->sum('litros'),
                    'costo' => $cargas->sum('costo'),
                    'precio_promedio_litro' => $cargas->count() > 0 ? $cargas->avg('precio_por_litro') : 0
                ],
                'por_estado' => [
                    'pendientes' => $cargas->where('estado', 'pendiente')->count(),
                    'aprobadas' => $cargas->where('estado', 'aprobado')->count(),
                    'rechazadas' => $cargas->where('estado', 'rechazado')->count()
                ],
                'top_operadores' => $cargas->groupBy('id_user')->map(function ($grupo) {
                    $usuario = $grupo->first()->user ?? null;
                    return [
                        'usuario' => $usuario ? $usuario->nombre . ' ' . $usuario->apellido : 'Usuario desconocido',
                        'cargas' => $grupo->count(),
                        'litros' => $grupo->sum('litros'),
                        'costo' => $grupo->sum('costo')
                    ];
                })->sortByDesc('cargas')->take(5)->values()
            ];

            return response()->json([
                'status' => 'success',
                'data' => $resumen
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔄 Crear registro en consumos_unificados cuando se aprueba una carga
     * (Método privado para integrar con el sistema de consumos unificados)
     */
    private function crearConsumoUnificado(CargaExterna $carga): void
    {
        try {
            DB::table('consumos_unificados')->insert([
                'id_dotacion' => null, // No aplica para cargas externas
                'id_equipo' => $carga->id_maquina,
                'id_usuario' => $carga->id_user,
                'fecha_consumo' => $carga->created_at,
                'litros_consumidos' => $carga->litros,
                'medicion' => $carga->medicion,
                'numeral_inicial' => null, // No aplica para cargas externas
                'numeral_final' => null, // No aplica para cargas externas
                'precio_litro' => $carga->precio_por_litro,
                'id_faena' => $carga->id_faena ?? 6, // Default: Cargas Externas
                'id_estanque' => null, // No aplica para cargas externas
                'observacion' => $carga->observaciones,
                'created_at' => now(),
                'updated_at' => now(),
                'tipo_consumo' => 'externa', // ✅ Distinguir de consumos internos
                'tipo_operacion' => 'carga_externa',
                'tipo_consumo_origen' => 'cargas_externas'
            ]);

            Log::info('✅ Consumo unificado creado para carga externa aprobada', [
                'carga_id' => $carga->id,
                'numero_boleta' => $carga->numero_boleta,
                'litros' => $carga->litros,
                'costo' => $carga->costo,
                'id_maquina' => $carga->id_maquina,
                'id_user' => $carga->id_user
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al crear consumo unificado para carga externa', [
                'carga_id' => $carga->id,
                'numero_boleta' => $carga->numero_boleta,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // No lanzar excepción para no afectar la aprobación
            // Solo registrar el error para revisión posterior
        }
    }

    /**
     * 📄 Obtener cargas paginadas con filtros (opcional - para uso futuro)
     * Endpoint: GET /api/adminOperador/cargas/paginadas
     */
    public function paginadas(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $estado = $request->get('estado'); // pendiente, aprobado, rechazado
            $fechaDesde = $request->get('fecha_desde');
            $fechaHasta = $request->get('fecha_hasta');
            $busqueda = $request->get('busqueda');

            $query = CargaExterna::with([
                'user:id,nombre,apellido,rut',
                'maquina:id_maquina,nombre_maquina,patente',
                'faena:id_faena,ubicacion'
            ]);

            // Aplicar filtros
            if ($estado) {
                $query->where('estado', $estado);
            }

            if ($fechaDesde) {
                $query->whereDate('created_at', '>=', $fechaDesde);
            }

            if ($fechaHasta) {
                $query->whereDate('created_at', '<=', $fechaHasta);
            }

            if ($busqueda) {
                $query->where(function ($q) use ($busqueda) {
                    $q->where('numero_boleta', 'like', "%{$busqueda}%")
                        ->orWhere('ubicacion', 'like', "%{$busqueda}%")
                        ->orWhere('observaciones', 'like', "%{$busqueda}%")
                        ->orWhereHas('user', function ($userQuery) use ($busqueda) {
                            $userQuery->where('nombre', 'like', "%{$busqueda}%")
                                ->orWhere('apellido', 'like', "%{$busqueda}%")
                                ->orWhere('rut', 'like', "%{$busqueda}%");
                        })
                        ->orWhereHas('maquina', function ($maquinaQuery) use ($busqueda) {
                            $maquinaQuery->where('nombre_maquina', 'like', "%{$busqueda}%")
                                ->orWhere('patente', 'like', "%{$busqueda}%");
                        });
                });
            }

            $cargas = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $cargas->items(),
                'pagination' => [
                    'current_page' => $cargas->currentPage(),
                    'last_page' => $cargas->lastPage(),
                    'per_page' => $cargas->perPage(),
                    'total' => $cargas->total(),
                    'from' => $cargas->firstItem(),
                    'to' => $cargas->lastItem()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener cargas paginadas: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * 📋 Obtener datos necesarios para el drag & drop
     * Endpoint: GET /api/adminOperador/asignaciones/datos
     */
    public function obtenerDatos(): JsonResponse
    {
        try {
            // 🔄 Obtener usuarios disponibles (operadores activos)
            $usuariosDisponibles = User::select('id', 'rut', 'nombre', 'apellido', 'email', 'id_faena', 'estado')
                ->with('faena:id_faena,ubicacion')
                ->where('estado', 1) // Solo usuarios activos
                ->whereNotIn('id', function ($query) {
                    // Excluir usuarios que ya tienen asignación activa
                    $query->select('id_user')
                        ->from('asignaciones_user_maquina')
                        ->where('activo', 1);
                })
                ->orderBy('nombre')
                ->get()
                ->map(function ($usuario) {
                    return [
                        'id' => $usuario->id,
                        'nombre' => $usuario->nombre,
                        'apellido' => $usuario->apellido,
                        'rut' => $usuario->rut,
                        'email' => $usuario->email,
                        'nombre_completo' => $usuario->nombre . ' ' . $usuario->apellido,
                        'estado' => 'disponible',
                        'faena' => [
                            'id' => $usuario->faena->id_faena ?? null,
                            'ubicacion' => $usuario->faena->ubicacion ?? 'Sin faena'
                        ],
                        // Determinar especialidad basada en algún criterio
                        'especialidad' => $this->determinarEspecialidad($usuario),
                        'experiencia' => $this->calcularExperiencia($usuario)
                    ];
                });

            // 🚛 Obtener máquinas disponibles
            $maquinasDisponibles = Maquinas::select('id_maquina', 'nombre_maquina', 'tipo_maquina', 'patente', 'estado', 'id_categoria')
                ->with('categoria:id_categoria,nombre_categoria')
                ->where('estado', 1) // Solo máquinas activas
                ->whereNotIn('id_maquina', function ($query) {
                    // Excluir máquinas que ya tienen asignación activa
                    $query->select('id_maquina')
                        ->from('asignaciones_user_maquina')
                        ->where('activo', 1);
                })
                ->orderBy('nombre_maquina')
                ->get()
                ->map(function ($maquina) {
                    return [
                        'id' => $maquina->id_maquina,
                        'nombre' => $maquina->nombre_maquina,
                        'patente' => $maquina->patente,
                        'tipo' => $maquina->tipo_maquina,
                        'estado' => 'disponible',
                        'categoria' => [
                            'id' => $maquina->categoria->id_categoria ?? null,
                            'nombre' => $maquina->categoria->nombre_categoria ?? 'Sin categoría'
                        ],
                        'ubicacion' => $this->determinarUbicacionMaquina($maquina)
                    ];
                });

            // 📊 Obtener asignaciones activas
            $asignacionesActivas = DB::table('asignaciones_user_maquina as a')
                ->join('users as u', 'a.id_user', '=', 'u.id')
                ->join('maquinas as m', 'a.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('categorias_maquina as c', 'm.id_categoria', '=', 'c.id_categoria')
                ->where('a.activo', 1)
                ->select([
                    'a.id',
                    'a.fecha_asignacion',
                    'a.observaciones',
                    'a.created_at',
                    // Datos del usuario
                    'u.id as user_id',
                    'u.nombre',
                    'u.apellido',
                    'u.rut',
                    'u.email',
                    // Datos de la máquina
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.patente',
                    'm.tipo_maquina',
                    // Datos adicionales
                    'f.ubicacion as faena_ubicacion',
                    'c.nombre_categoria'
                ])
                ->orderBy('a.created_at', 'desc')
                ->get()
                ->map(function ($asignacion) {
                    return [
                        'id' => $asignacion->id,
                        'maquina' => [
                            'id' => $asignacion->id_maquina,
                            'nombre' => $asignacion->nombre_maquina,
                            'patente' => $asignacion->patente,
                            'tipo' => $asignacion->tipo_maquina,
                            'categoria' => $asignacion->nombre_categoria
                        ],
                        'operador' => [
                            'id' => $asignacion->user_id,
                            'nombre' => $asignacion->nombre,
                            'apellido' => $asignacion->apellido,
                            'rut' => $asignacion->rut,
                            'email' => $asignacion->email,
                            'nombre_completo' => $asignacion->nombre . ' ' . $asignacion->apellido
                        ],
                        'fechaAsignacion' => Carbon::parse($asignacion->fecha_asignacion)->format('Y-m-d'),
                        'fechaVencimiento' => Carbon::parse($asignacion->fecha_asignacion)->addDays(30)->format('Y-m-d'),
                        'estado' => 'activa',
                        'ubicacion' => $asignacion->faena_ubicacion ?? 'Sin ubicación',
                        'observaciones' => $asignacion->observaciones,
                        'diasActiva' => Carbon::parse($asignacion->fecha_asignacion)->diffInDays(now()),
                        'created_at' => $asignacion->created_at
                    ];
                });

            // 📈 Calcular estadísticas
            $estadisticas = [
                'usuarios_disponibles' => $usuariosDisponibles->count(),
                'maquinas_disponibles' => $maquinasDisponibles->count(),
                'asignaciones_activas' => $asignacionesActivas->count(),
                'total_usuarios' => User::where('estado', 1)->count(),
                'total_maquinas' => Maquinas::where('estado', 1)->count(),
                'porcentaje_asignacion' => [
                    'usuarios' => User::where('estado', 1)->count() > 0
                        ? round(($asignacionesActivas->count() / User::where('estado', 1)->count()) * 100, 1)
                        : 0,
                    'maquinas' => Maquinas::where('estado', 1)->count() > 0
                        ? round(($asignacionesActivas->count() / Maquinas::where('estado', 1)->count()) * 100, 1)
                        : 0
                ]
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Datos de asignaciones obtenidos correctamente',
                'data' => [
                    'usuarios_disponibles' => $usuariosDisponibles,
                    'maquinas_disponibles' => $maquinasDisponibles,
                    'asignaciones_activas' => $asignacionesActivas,
                    'estadisticas' => $estadisticas
                ],
                'meta' => [
                    'fecha_consulta' => now()->toISOString(),
                    'total_items' => $usuariosDisponibles->count() + $maquinasDisponibles->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener datos de asignaciones:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos de asignaciones: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Determinar ubicación de la máquina
     */
    private function determinarUbicacionMaquina($maquina): string
    {
        $ubicaciones = ['Depósito Norte', 'Depósito Sur', 'Depósito Este', 'Depósito Central', 'Faena Principal'];
        return $ubicaciones[array_rand($ubicaciones)];
    }
}
