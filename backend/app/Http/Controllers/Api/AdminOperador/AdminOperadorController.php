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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
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
            // Obtener cargas con relaciones (igual que antes)
            $cargas = CargaExterna::with([
                'user:id,nombre,apellido',
                'maquina:id_maquina,nombre_maquina,patente',
                'maquina.categoria:id_categoria,nombre_categoria',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido' // Mantenemos el nombre original por ahora
            ])
                ->orderBy('created_at', 'desc')
                ->get();

            // 🔄 MAPEAR estados viejos a nuevos automáticamente
            $cargasFormateadas = $cargas->map(function ($carga) {
                // Convertir estados viejos a nuevos
                $estadoNuevo = $this->convertirEstadoViejo($carga->estado);

                return [
                    'id' => $carga->id,
                    'numero_boleta' => $carga->numero_boleta,
                    'litros' => $carga->litros,
                    'medicion' => $carga->medicion,
                    'costo' => $carga->costo,
                    'precio_por_litro' => $carga->precio_por_litro,
                    'ubicacion' => $carga->ubicacion,
                    'tipo_combustible' => $carga->tipo_combustible,
                    'observaciones' => $carga->observaciones,

                    // 🆕 NUEVO: Estado convertido al nuevo sistema
                    'estado' => $estadoNuevo,

                    'fecha_rendicion' => $carga->fecha_aprobacion, // Mismo campo, nuevo nombre
                    'created_at' => $carga->created_at,
                    'updated_at' => $carga->updated_at,

                    // Usuario
                    'user' => [
                        'id' => $carga->user->id ?? null,
                        'nombre' => $carga->user->nombre ?? 'N/A',
                        'apellido' => $carga->user->apellido ?? '',
                        'nombre_completo' => ($carga->user->nombre ?? 'N/A') . ' ' . ($carga->user->apellido ?? '')
                    ],

                    // Máquina
                    'maquina' => [
                        'id' => $carga->maquina->id_maquina ?? null,
                        'nombre_maquina' => $carga->maquina->nombre_maquina ?? 'N/A',
                        'patente' => $carga->maquina->patente ?? 'Sin patente',
                        'categoria' => [
                            'id' => $carga->maquina->categoria->id_categoria ?? null,
                            'nombre' => $carga->maquina->categoria->nombre_categoria ?? 'Sin categoría'
                        ]
                    ],

                    // Faena
                    'faena' => [
                        'id' => $carga->faena->id_faena ?? 6,
                        'ubicacion' => $carga->faena->ubicacion ?? 'Cargas Externas'
                    ],

                    // Quien procesó (mantenemos compatibilidad)
                    'aprobadoPor' => $carga->aprobadoPor ? [
                        'id' => $carga->aprobadoPor->id,
                        'nombre' => $carga->aprobadoPor->nombre,
                        'apellido' => $carga->aprobadoPor->apellido,
                        'nombre_completo' => $carga->aprobadoPor->nombre . ' ' . $carga->aprobadoPor->apellido
                    ] : null
                ];
            });

            // 🆕 NUEVAS ESTADÍSTICAS con comparación mensual
            $estadisticas = $this->calcularEstadisticasNuevas($cargas);

            return response()->json([
                'status' => 'success',
                'message' => 'Cargas externas obtenidas correctamente',
                'data' => $cargasFormateadas,
                'estadisticas' => $estadisticas,
                'meta' => [
                    'total_registros' => $cargas->count(),
                    'fecha_consulta' => now()->toISOString(),
                    'sistema' => 'nuevo' // Indicador de que usamos el nuevo sistema
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener cargas externas:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener cargas externas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 CALCULAR estadísticas con comparación mensual
     */
    private function calcularEstadisticasNuevas($cargas): array
    {
        // Mes actual
        $mesActual = Carbon::now();
        $mesAnterior = Carbon::now()->subMonth();

        // Filtrar cargas por mes
        $cargasMesActual = $cargas->filter(function ($carga) use ($mesActual) {
            return Carbon::parse($carga->created_at)->format('Y-m') === $mesActual->format('Y-m');
        });

        $cargasMesAnterior = $cargas->filter(function ($carga) use ($mesAnterior) {
            return Carbon::parse($carga->created_at)->format('Y-m') === $mesAnterior->format('Y-m');
        });

        // Estadísticas generales (convertir estados al vuelo)
        $cargasConEstadoNuevo = $cargas->map(function ($carga) {
            $carga->estado_nuevo = $this->convertirEstadoViejo($carga->estado);
            return $carga;
        });

        // Estadísticas básicas
        $estadisticas = [
            'total' => $cargas->count(),
            'por_rendir' => $cargasConEstadoNuevo->where('estado_nuevo', 'Por Rendir')->count(),
            'rendidas' => $cargasConEstadoNuevo->where('estado_nuevo', 'Rendido')->count(),
            'total_litros' => $cargas->sum('litros'),
            'total_costo' => $cargas->sum('costo'),
            'promedio_precio_litro' => $cargas->where('precio_por_litro', '>', 0)->avg('precio_por_litro') ?: 0
        ];

        // 🆕 COMPARACIÓN MENSUAL
        $litrosMesActual = $cargasMesActual->sum('litros');
        $litrosMesAnterior = $cargasMesAnterior->sum('litros');

        $costoMesActual = $cargasMesActual->sum('costo');
        $costoMesAnterior = $cargasMesAnterior->sum('costo');

        // Calcular porcentajes de cambio
        $cambioLitros = $litrosMesActual > 0
            ? (($litrosMesActual - $litrosMesAnterior) / $litrosMesActual) * 100
            : 0;


        $cambioCosto = $costoMesAnterior > 0
            ? (($costoMesActual - $costoMesAnterior) / $costoMesAnterior) * 100
            : 0;

        // Añadir comparación mensual
        $estadisticas['comparacion_mensual'] = [
            'mes_actual' => [
                'total_cargas' => $cargasMesActual->count(),
                'por_rendir' => $cargasMesActual->filter(function ($c) {
                    return $this->convertirEstadoViejo($c->estado) === 'Por Rendir';
                })->count(),
                'rendidas' => $cargasMesActual->filter(function ($c) {
                    return $this->convertirEstadoViejo($c->estado) === 'Rendido';
                })->count(),
                'litros' => $litrosMesActual,
                'costo' => $costoMesActual,
                'periodo' => $mesActual->format('Y-m')
            ],
            'mes_anterior' => [
                'total_cargas' => $cargasMesAnterior->count(),
                'litros' => $litrosMesAnterior,
                'costo' => $costoMesAnterior,
                'periodo' => $mesAnterior->format('Y-m')
            ],
            'diferencias' => [
                'litros_diferencia' => $litrosMesActual - $litrosMesAnterior,
                'litros_porcentaje' => round($cambioLitros, 2),
                'costo_diferencia' => $costoMesActual - $costoMesAnterior,
                'costo_porcentaje' => round($cambioCosto, 2),
                'tendencia_litros' => $cambioLitros > 0 ? 'subida' : ($cambioLitros < 0 ? 'bajada' : 'igual'),
                'tendencia_costo' => $cambioCosto > 0 ? 'subida' : ($cambioCosto < 0 ? 'bajada' : 'igual')
            ]
        ];

        return $estadisticas;
    }

    /**
     * 🔍 Mostrar detalle de una carga específica
     * Endpoint: GET /api/adminOperador/cargas/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $carga = CargaExterna::with([
                'user:id,nombre,apellido',
                'maquina:id_maquina,nombre_maquina,patente',
                'maquina.categoria:id_categoria,nombre_categoria',
                'faena:id_faena,ubicacion',
                'aprobadoPor:id,nombre,apellido'
            ])->findOrFail($id);

            // Convertir estado al nuevo sistema
            $estadoNuevo = $this->convertirEstadoViejo($carga->estado);

            $cargaFormateada = [
                'id' => $carga->id,
                'numero_boleta' => $carga->numero_boleta,
                'litros' => $carga->litros,
                'medicion' => $carga->medicion,
                'costo' => $carga->costo,
                'precio_por_litro' => $carga->precio_por_litro,
                'ubicacion' => $carga->ubicacion,
                'tipo_combustible' => $carga->tipo_combustible,
                'observaciones' => $carga->observaciones,

                // 🆕 Estado convertido
                'estado' => $estadoNuevo,
                'estado_original' => $carga->estado, // Por si necesitas debug

                'fecha_rendicion' => $carga->fecha_aprobacion,
                'created_at' => $carga->created_at,
                'updated_at' => $carga->updated_at,

                // Relaciones (igual que antes)
                'user' => [
                    'id' => $carga->user->id ?? null,
                    'nombre' => $carga->user->nombre ?? 'N/A',
                    'apellido' => $carga->user->apellido ?? '',
                    'nombre_completo' => ($carga->user->nombre ?? 'N/A') . ' ' . ($carga->user->apellido ?? '')
                ],

                'maquina' => [
                    'id' => $carga->maquina->id_maquina ?? null,
                    'nombre_maquina' => $carga->maquina->nombre_maquina ?? 'N/A',
                    'patente' => $carga->maquina->patente ?? 'Sin patente',
                    'categoria' => [
                        'id' => $carga->maquina->categoria->id_categoria ?? null,
                        'nombre' => $carga->maquina->categoria->nombre_categoria ?? 'Sin categoría'
                    ]
                ],

                'faena' => [
                    'id' => $carga->faena->id_faena ?? 6,
                    'ubicacion' => $carga->faena->ubicacion ?? 'Cargas Externas'
                ],

                'aprobadoPor' => $carga->aprobadoPor ? [
                    'id' => $carga->aprobadoPor->id,
                    'nombre' => $carga->aprobadoPor->nombre,
                    'apellido' => $carga->aprobadoPor->apellido,
                    'nombre_completo' => $carga->aprobadoPor->nombre . ' ' . $carga->aprobadoPor->apellido
                ] : null
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Detalle obtenido correctamente',
                'data' => $cargaFormateada
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener detalle:', [
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
     * 🆕 NUEVO MÉTODO: Rendir una carga (reemplaza aprobar/rechazar)
     */
    public function rendir(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $carga = CargaExterna::findOrFail($id);

            // Verificar que se pueda rendir
            if (!$this->puedeRendirse($carga->estado)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Esta carga no se puede rendir. Estado actual: ' . $carga->estado
                ], 400);
            }

            // Actualizar a estado rendido
            $carga->update([
                'estado' => 'Rendido',
                'aprobado_por' => $user->id,
                'fecha_aprobacion' => now(),
                'motivo_rechazo' => null
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Carga rendida correctamente',
                'data' => $carga->fresh(['user', 'maquina', 'faena', 'aprobadoPor'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error al rendir carga:', [
                'carga_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al rendir carga: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔧 HELPER: Verificar si una carga se puede rendir
     */
    private function puedeRendirse($estado): bool
    {
        $estadosPermitidos = [
            'pendiente',    // Sistema viejo
            'rechazado',    // Sistema viejo
            'Por Rendir'    // Sistema nuevo
        ];

        return in_array($estado, $estadosPermitidos);
    }

    /**
     * 🔧 HELPER: Convertir estados del sistema viejo al nuevo
     */
    private function convertirEstadoViejo($estadoViejo): string
    {
        $conversion = [
            'pendiente' => 'Por Rendir',
            'aprobado' => 'Rendido',
            'rechazado' => 'Por Rendir', // Los rechazados vuelven a "Por Rendir"

            // Si ya están en el nuevo sistema, mantener
            'Por Rendir' => 'Por Rendir',
            'Rendido' => 'Rendido'
        ];

        return $conversion[$estadoViejo] ?? 'Por Rendir';
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
                ->with('faena:id_faena,ubicacion') // Cargar relación con faena si existe
                ->where('estado', 1) // Solo usuarios activos
                ->where('id_rol', 6) // Solo rol operador (id_rol = 6)
                ->whereNotIn('id', function ($query) {
                    // Excluir usuarios que ya tienen asignación activa
                    $query->select('id_user')
                        ->from('asignaciones_user_maquinas')
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
                    ];
                });

            // 🚛 Obtener máquinas disponibles
            $maquinasDisponibles = Maquinas::select('id_maquina', 'nombre_maquina', 'tipo_maquina', 'patente', 'estado', 'id_categoria', 'chc_maquina')
                ->with('categoria:id_categoria,nombre_categoria') // Cargar relación con categoría si existe
                ->where('estado', 1) // Solo máquinas activas
                ->whereIn('id_categoria', [11, 2]) // Solo rol operador (id_rol = 6)
                ->whereNotIn('id_maquina', function ($query) {
                    // Excluir máquinas que ya tienen asignación activa
                    $query->select('id_maquina')
                        ->from('asignaciones_user_maquinas')
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
                        'chc_maquina' => $maquina->chc_maquina, // Consumo por Hora de Combustible
                        'categoria' => [
                            'id' => $maquina->categoria->id_categoria ?? null,
                            'nombre' => $maquina->categoria->nombre_categoria ?? 'Sin categoría'
                        ],
                    ];
                });

            // 📊 Obtener asignaciones activas
            $asignacionesActivas = DB::table('asignaciones_user_maquinas as a')
                ->join('users as u', 'a.id_user', '=', 'u.id')
                ->join('maquinas as m', 'a.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('categorias_maquinas as c', 'm.id_categoria', '=', 'c.id_categoria')
                ->where('a.activo', 1)
                ->select([
                    'a.id',
                    'a.fecha_asignacion',
                    'a.observaciones',
                    'a.created_at',
                    'a.updated_at',
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
                    'm.chc_maquina',
                    // Datos adicionales
                    'f.ubicacion as faena_ubicacion',
                    'c.nombre_categoria'
                ])
                ->orderBy('a.created_at', 'desc')
                ->get()
                ->map(function ($asignacion) {
                    $created = Carbon::parse($asignacion->created_at);
                    $now = now();
                    $diff = $created->diff($now); // objeto DateInterval

                    return [
                        'id' => $asignacion->id,
                        'maquina' => [
                            'id' => $asignacion->id_maquina,
                            'nombre' => $asignacion->nombre_maquina,
                            'patente' => $asignacion->patente,
                            'tipo' => $asignacion->tipo_maquina,
                            'chc_maquina' => $asignacion->chc_maquina,
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
                        // Aquí diasActiva será legible directamente
                        'diasActiva' => "{$diff->d} días, {$diff->h} horas, {$diff->i} minutos",
                        'created_at' => $asignacion->created_at,
                        'updated_at' => $asignacion->updated_at
                    ];
                });

            // 📈 Calcular estadísticas
            $estadisticas = [
                'usuarios_disponibles' => $usuariosDisponibles->count(),
                'maquinas_disponibles' => $maquinasDisponibles->count(),
                'asignaciones_activas' => $asignacionesActivas->count(),
                'total_usuarios' => User::where('estado', 1)
                    ->where('id_rol', 6)
                    ->count(),
                'total_maquinas' => Maquinas::where('estado', 1)
                    ->whereIn('id_categoria', [2, 11])
                    ->count(),
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
                'data' => [
                    'usuarios_disponibles' => [],
                    'maquinas_disponibles' => [],
                    'asignaciones_activas' => [],
                    'estadisticas' => [
                        'usuarios_disponibles' => 0,
                        'maquinas_disponibles' => 0,
                        'asignaciones_activas' => 0,
                        'total_usuarios' => 0,
                        'total_maquinas' => 0,
                        'porcentaje_asignacion' => [
                            'usuarios' => 0,
                            'maquinas' => 0
                        ]
                    ]
                ]
            ], 500);
        }
    }

    /**
     * 🆕 Crear nueva asignación máquina-operador
     * Endpoint: POST /api/adminOperador/asignaciones
     */
    public function crearAsignacion(Request $request): JsonResponse
    {
        try {
            // 🔍 Validar datos de entrada
            $validator = Validator::make($request->all(), [
                'id_maquina' => 'required|integer|exists:maquinas,id_maquina',
                'id_operador' => 'required|integer|exists:users,id',
                'fecha_asignacion' => 'nullable|date',
                'observaciones' => 'nullable|string|max:500'
            ], [
                'id_maquina.required' => 'La máquina es obligatoria',
                'id_maquina.exists' => 'La máquina seleccionada no existe',
                'id_operador.required' => 'El operador es obligatorio',
                'id_operador.exists' => 'El operador seleccionado no existe',
                'fecha_asignacion.date' => 'La fecha de asignación debe ser una fecha válida',
                'observaciones.max' => 'Las observaciones no pueden exceder 500 caracteres'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $idMaquina = $request->id_maquina;
            $idOperador = $request->id_operador;
            $fechaAsignacion = $request->fecha_asignacion ?? now();
            $observaciones = $request->observaciones;

            $existe = DB::table('asignaciones_user_maquinas')
                ->where('id_user', $idOperador)
                ->where('id_maquina', $idMaquina)
                ->where('activo', 1)
                ->exists();

            if ($existe) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ya existe una asignación activa para este operador y máquina'
                ], 422);
            }

            // 🔒 Verificar que la máquina esté disponible
            $maquinaDisponible = !DB::table('asignaciones_user_maquinas')
                ->where('id_maquina', $idMaquina)
                ->where('activo', 1)
                ->exists();

            if (!$maquinaDisponible) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La máquina seleccionada ya está asignada a otro operador'
                ], 422);
            }

            // 🔒 Verificar que el operador esté disponible
            $operadorDisponible = !DB::table('asignaciones_user_maquinas')
                ->where('id_user', $idOperador)
                ->where('activo', 1)
                ->exists();

            if (!$operadorDisponible) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El operador seleccionado ya tiene una máquina asignada'
                ], 422);
            }

            // 🔍 Verificar que la máquina y operador existan
            $maquina = Maquinas::find($idMaquina);
            $operador = User::find($idOperador);

            if (!$maquina) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La máquina seleccionada no existe'
                ], 404);
            }

            if (!$operador) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El operador seleccionado no existe'
                ], 404);
            }

            // ✅ Crear la asignación
            DB::beginTransaction();

            $asignacionId = DB::table('asignaciones_user_maquinas')->insertGetId([
                'id_user' => $idOperador,
                'id_maquina' => $idMaquina,
                'fecha_asignacion' => $fechaAsignacion,
                'activo' => 1,
                'observaciones' => $observaciones,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            // 📄 Obtener datos completos de la asignación creada
            $asignacionCompleta = DB::table('asignaciones_user_maquinas as a')
                ->join('users as u', 'a.id_user', '=', 'u.id')
                ->join('maquinas as m', 'a.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('categorias_maquinas as c', 'm.id_categoria', '=', 'c.id_categoria')
                ->where('a.id', $asignacionId)
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
                    'm.chc_maquina',
                    // Datos adicionales
                    'f.ubicacion as faena_ubicacion',
                    'c.nombre_categoria'
                ])
                ->first();

            $resultado = [
                'id' => $asignacionCompleta->id,
                'maquina' => [
                    'id' => $asignacionCompleta->id_maquina,
                    'nombre' => $asignacionCompleta->nombre_maquina,
                    'patente' => $asignacionCompleta->patente,
                    'tipo' => $asignacionCompleta->tipo_maquina,
                    'chc_maquina' => $asignacionCompleta->chc_maquina,
                    'categoria' => $asignacionCompleta->nombre_categoria
                ],
                'operador' => [
                    'id' => $asignacionCompleta->user_id,
                    'nombre' => $asignacionCompleta->nombre,
                    'apellido' => $asignacionCompleta->apellido,
                    'rut' => $asignacionCompleta->rut,
                    'email' => $asignacionCompleta->email,
                    'nombre_completo' => $asignacionCompleta->nombre . ' ' . $asignacionCompleta->apellido
                ],
                'fechaAsignacion' => Carbon::parse($asignacionCompleta->fecha_asignacion)->format('Y-m-d'),
                'fechaVencimiento' => Carbon::parse($asignacionCompleta->fecha_asignacion)->addDays(30)->format('Y-m-d'),
                'estado' => 'activa',
                'ubicacion' => $asignacionCompleta->faena_ubicacion ?? 'Sin ubicación',
                'observaciones' => $asignacionCompleta->observaciones,
                'diasActiva' => 0,
                'created_at' => $asignacionCompleta->created_at
            ];

            Log::info('Asignación creada exitosamente:', [
                'asignacion_id' => $asignacionId,
                'maquina' => $maquina->nombre_maquina,
                'operador' => $operador->nombre . ' ' . $operador->apellido
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Asignación creada exitosamente',
                'data' => $resultado
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error al crear asignación:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear la asignación: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * 🔚 Finalizar asignación activa
     * Endpoint: POST /api/adminOperador/asignaciones/{id}/finalizar
     */
    public function finalizarAsignacion($id, Request $request): JsonResponse
    {
        try {
            // 🔍 Validar datos opcionales
            $validator = Validator::make($request->all(), [
                'motivo_finalizacion' => 'nullable|string|max:500',
                'fecha_finalizacion' => 'nullable|date'
            ], [
                'motivo_finalizacion.max' => 'El motivo no puede exceder 500 caracteres',
                'fecha_finalizacion.date' => 'La fecha de finalización debe ser una fecha válida'
            ]);

            Log::info(
                'Motivo de finalizacion recibido:',
                ['motivo_finalizacion' => $request->motivo_finalizacion ?? 'No proporcionado']
            );

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // 🔍 Verificar que la asignación existe y está activa
            $asignacion = DB::table('asignaciones_user_maquinas as a')
                ->join('users as u', 'a.id_user', '=', 'u.id')
                ->join('maquinas as m', 'a.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->where('a.id', $id)
                ->where('a.activo', 1)
                ->select([
                    'a.id',
                    'a.fecha_asignacion',
                    'a.observaciones',
                    'u.nombre',
                    'u.apellido',
                    'm.nombre_maquina',
                    'm.patente',
                    'f.ubicacion as faena_ubicacion'
                ])
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'La asignación no existe o ya ha sido finalizada'
                ], 404);
            }

            $motivoFinalizacion = $request->motivo_finalizacion ?? 'Finalizada por administrador';
            $fechaFinalizacion = $request->fecha_finalizacion ?? now();

            // ✅ Finalizar la asignación (marcar como inactiva)
            DB::beginTransaction();

            $updated = DB::table('asignaciones_user_maquinas')
                ->where('id', $id)
                ->where('activo', 1)
                ->update([
                    'activo' => 0,
                    'observaciones' => $asignacion->observaciones
                        . "\n[FINALIZADO el " . now()->format('d/m/Y H:i') . "] Motivo: " . $motivoFinalizacion,
                    'updated_at' => now()
                ]);

            if ($updated === 0) {
                DB::rollback();
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se pudo finalizar la asignación. Puede que ya esté finalizada.'
                ], 422);
            }

            DB::commit();

            Log::info('Asignación finalizada exitosamente:', [
                'asignacion_id' => $id,
                'maquina' => $asignacion->nombre_maquina,
                'operador' => $asignacion->nombre . ' ' . $asignacion->apellido,
                'motivo' => $motivoFinalizacion
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Asignación finalizada exitosamente',
                'data' => [
                    'id' => $id,
                    'fecha_finalizacion' => Carbon::parse($fechaFinalizacion)->format('Y-m-d H:i:s'),
                    'motivo_finalizacion' => $motivoFinalizacion,
                    'maquina_liberada' => $asignacion->nombre_maquina,
                    'operador_liberado' => $asignacion->nombre . ' ' . $asignacion->apellido
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error al finalizar asignación:', [
                'asignacion_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al finalizar la asignación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📋 Obtener datos necesarios para el formulario de máquinas
     * Endpoint: GET /api/adminOperador/maquinas/datos
     */
    public function obtenerDatosMaquinas(): JsonResponse
    {
        try {
            // Obtener categorías
            $categorias = DB::table('categorias_maquinas')
                ->select('id_categoria', 'nombre_categoria', 'tipo_medicion', 'chc', 'hrc')
                ->orderBy('nombre_categoria')
                ->whereIn('id_categoria', [2, 11])
                ->get();

            // Obtener faenas disponibles
            $faenas = DB::table('faenas')
                ->select('id_faena', 'ubicacion', 'detalle')
                ->orderBy('ubicacion')
                ->get();

            // Obtener máquinas existentes
            $maquinas = $this->obtenerMaquinasCompletas();

            return response()->json([
                'status' => 'success',
                'message' => 'Datos de máquinas obtenidos correctamente',
                'data' => [
                    'categorias' => $categorias,
                    'faenas' => $faenas,
                    'maquinas' => $maquinas
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener datos de máquinas:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos de máquinas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📋 Listar todas las máquinas registradas
     * Endpoint: GET /api/adminOperador/maquinas/lista
     */
    public function listarMaquinas(): JsonResponse
    {
        try {
            $maquinas = $this->obtenerMaquinasCompletas();

            return response()->json([
                'status' => 'success',
                'message' => 'Máquinas obtenidas correctamente',
                'data' => $maquinas,
                'meta' => [
                    'total_maquinas' => $maquinas->count(),
                    'maquinas_internas' => $maquinas->where('tipo_maquina', 'Interno')->count(),
                    'maquinas_externas' => $maquinas->where('tipo_maquina', 'Externo')->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al listar máquinas:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al listar máquinas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 Registrar nueva máquina (MEJORADO)
     * Endpoint: POST /api/adminOperador/maquinas
     */
    public function registrarMaquina(Request $request): JsonResponse
    {
        // Validaciones solo para los campos del formulario
        $request->validate([
            'nombre_maquina' => 'required|string|max:255',
            'tipo_maquina' => 'required|in:Interno,Externo',
            'patente' => 'required|string|max:20|unique:maquinas,patente',
            'id_categoria' => 'required|exists:categorias_maquinas,id_categoria'
        ]);

        try {
            DB::beginTransaction();

            Log::info('Iniciando registro de máquina:', [
                'nombre' => $request->nombre_maquina,
                'tipo' => $request->tipo_maquina,
                'patente' => $request->patente,
                'categoria' => $request->id_categoria
            ]);

            // ✅ VALORES AUTOMÁTICOS (sin formulario)
            $datosBasicos = [
                'nombre_maquina' => $request->nombre_maquina,
                'tipo_maquina' => $request->tipo_maquina,
                'patente' => $request->patente,
                'id_categoria' => $request->id_categoria,
                // 🚀 VALORES POR DEFECTO AUTOMÁTICOS
                'estado' => 'operativo',           // Siempre operativo
                'chc_maquina' => null,            // Sin CHC individual
                'created_at' => now(),
                'updated_at' => now()
            ];

            // Insertar en tabla maquinas
            $idMaquina = DB::table('maquinas')->insertGetId($datosBasicos);

            // Si es máquina interna, agregar registros adicionales
            if ($request->tipo_maquina === 'Interno') {
                // Insertar en maquinas_internas
                DB::table('maquinas_internas')->insert([
                    'id_maquina' => $idMaquina,
                    'patente' => $request->patente,
                    'nombre' => $request->nombre_maquina,
                    'categoria' => $request->id_categoria,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::commit();

            // Obtener datos completos de la máquina recién creada
            $maquinaCompleta = $this->obtenerMaquinaCompleta($idMaquina);

            Log::info('Máquina registrada exitosamente:', [
                'id_maquina' => $idMaquina,
                'nombre' => $request->nombre_maquina,
                'tipo' => $request->tipo_maquina
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Máquina registrada exitosamente',
                'data' => [
                    'id_maquina' => $idMaquina,
                    'nombre_maquina' => $request->nombre_maquina,
                    'patente' => $request->patente,
                    'tipo_maquina' => $request->tipo_maquina,
                    'estado' => 'operativo',
                    'chc_maquina' => null,
                    'faena_asignada' => $request->tipo_maquina === 'Interno' ? 6 : null,
                    'maquina_completa' => $maquinaCompleta
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error al registrar máquina:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar máquina: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🗑️ Eliminar máquina
     * Endpoint: DELETE /api/adminOperador/maquinas/{id}
     */
    public function eliminarMaquina($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Verificar que la máquina existe
            $maquina = DB::table('maquinas')->where('id_maquina', $id)->first();
            if (!$maquina) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Máquina no encontrada'
                ], 404);
            }

            // Verificar si tiene asignaciones activas
            $tieneAsignacionesActivas = DB::table('asignaciones_user_maquinas')
                ->where('id_maquina', $id)
                ->where('activo', 1)
                ->exists();

            if ($tieneAsignacionesActivas) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede eliminar la máquina porque tiene asignaciones activas'
                ], 422);
            }

            // Verificar si tiene consumos registrados
            $tieneConsumos = DB::table('consumos')
                ->where('id_equipo', $id)
                ->exists();

            if ($tieneConsumos) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede eliminar la máquina porque tiene registros de consumo asociados'
                ], 422);
            }

            // Log antes de eliminar
            Log::warning('Eliminando máquina:', [
                'id_maquina' => $id,
                'datos_maquina' => $maquina
            ]);

            // Eliminar registros relacionados
            if ($maquina->tipo_maquina === 'Interno') {
                // Eliminar permisos de faenas
                DB::table('permisos_maquinas_faenas')->where('id_maquina', $id)->delete();

                // Eliminar de maquinas_internas
                DB::table('maquinas_internas')->where('id_maquina', $id)->delete();
            }

            // Eliminar asignaciones históricas (inactivas)
            DB::table('asignaciones_user_maquinas')->where('id_maquina', $id)->delete();

            // Eliminar la máquina principal
            DB::table('maquinas')->where('id_maquina', $id)->delete();

            DB::commit();

            Log::info('Máquina eliminada exitosamente:', [
                'id_maquina' => $id,
                'nombre' => $maquina->nombre_maquina,
                'patente' => $maquina->patente
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Máquina eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error al eliminar máquina:', [
                'id_maquina' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar máquina: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 👁️ Ver detalle de una máquina específica
     * Endpoint: GET /api/adminOperador/maquinas/{id}
     */
    public function verMaquina($id): JsonResponse
    {
        try {
            $maquina = DB::table('maquinas as m')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->leftJoin('faenas as f', 'pmf.id_faena', '=', 'f.id_faena')
                ->where('m.id_maquina', $id)
                ->select([
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.tipo_maquina',
                    'm.estado',
                    'm.chc_maquina',
                    'm.patente',
                    'm.created_at',
                    'cm.nombre_categoria',
                    'cm.chc as chc_categoria',
                    'mi.id_maquina_interna',
                    'f.ubicacion as faena_ubicacion',
                    'f.id_faena'
                ])
                ->first();

            if (!$maquina) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Máquina no encontrada'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $maquina
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener máquina: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔧 Método auxiliar para obtener máquinas completas
     */
    private function obtenerMaquinasCompletas()
    {
        $maquinas = DB::table('maquinas as m')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
            ->leftJoin('faenas as f', 'pmf.id_faena', '=', 'f.id_faena')
            ->whereIn('m.id_categoria', [2, 11])
            ->select([
                'm.id_maquina',
                'm.nombre_maquina',
                'm.tipo_maquina',
                'm.estado',
                'm.chc_maquina',
                'm.patente',
                'm.created_at',
                'cm.nombre_categoria as categoria',
                'mi.id_maquina_interna',
                'mi.nombre as nombre_interno',
                'f.ubicacion as faena_ubicacion'
            ])
            ->orderBy('m.created_at', 'desc')
            ->get()
            ->groupBy('id_maquina')  // Agrupa por máquina
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'id_maquina' => $first->id_maquina,
                    'nombre_maquina' => $first->nombre_maquina,
                    'tipo_maquina' => $first->tipo_maquina,
                    'estado' => $first->estado,
                    'chc_maquina' => $first->chc_maquina,
                    'patente' => $first->patente,
                    'created_at' => $first->created_at,
                    'categoria' => $first->categoria,
                    'id_maquina_interna' => $first->id_maquina_interna,
                    'nombre_interno' => $first->nombre_interno,
                    'faenas' => $items->pluck('faena_ubicacion')->filter()->values()  // Array de faenas
                ];
            })
            ->values();  // Reindexa el array

        return $maquinas;
    }

    /**
     * ✏️ Actualizar máquina existente
     * Endpoint: PUT /api/adminOperador/maquinas/{id}
     */
    public function actualizarMaquina(Request $request, $id): JsonResponse
    {
        // Validaciones solo para los campos que se pueden editar
        $request->validate([
            'nombre_maquina' => 'required|string|max:255',
            'tipo_maquina' => 'required|in:Interno,Externo',
            'patente' => 'required|string|max:20|unique:maquinas,patente,' . $id . ',id_maquina',
            'id_categoria' => 'required|exists:categorias_maquinas,id_categoria'
        ]);

        try {
            DB::beginTransaction();

            // Verificar que la máquina existe
            $maquinaExistente = DB::table('maquinas')->where('id_maquina', $id)->first();
            if (!$maquinaExistente) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Máquina no encontrada'
                ], 404);
            }

            // Log de la actualización
            Log::info('Actualizando máquina:', [
                'id_maquina' => $id,
                'valores_anteriores' => [
                    'nombre_maquina' => $maquinaExistente->nombre_maquina,
                    'tipo_maquina' => $maquinaExistente->tipo_maquina,
                    'patente' => $maquinaExistente->patente,
                    'id_categoria' => $maquinaExistente->id_categoria
                ],
                'valores_nuevos' => [
                    'nombre_maquina' => $request->nombre_maquina,
                    'tipo_maquina' => $request->tipo_maquina,
                    'patente' => $request->patente,
                    'id_categoria' => $request->id_categoria
                ]
            ]);

            // Actualizar la máquina principal
            $updated = DB::table('maquinas')
                ->where('id_maquina', $id)
                ->update([
                    'nombre_maquina' => $request->nombre_maquina,
                    'tipo_maquina' => $request->tipo_maquina,
                    'patente' => $request->patente,
                    'id_categoria' => $request->id_categoria,
                    'updated_at' => now()
                ]);

            if ($updated === 0) {
                DB::rollback();
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se pudieron actualizar los datos de la máquina'
                ], 500);
            }

            // Si cambió de Externo a Interno, crear registro en maquinas_internas
            if ($maquinaExistente->tipo_maquina === 'Externo' && $request->tipo_maquina === 'Interno') {
                // Verificar si ya existe en maquinas_internas
                $existeInterno = DB::table('maquinas_internas')->where('id_maquina', $id)->exists();

                if (!$existeInterno) {
                    DB::table('maquinas_internas')->insert([
                        'id_maquina' => $id,
                        'patente' => $request->patente,
                        'nombre' => $request->nombre_maquina,
                        'categoria' => $request->id_categoria,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    // Agregar permiso para la faena por defecto (ID: 6)
                    $existePermiso = DB::table('permisos_maquinas_faenas')
                        ->where('id_maquina', $id)
                        ->where('id_faena', 6)
                        ->exists();

                    if (!$existePermiso) {
                        DB::table('permisos_maquinas_faenas')->insert([
                            'id_maquina' => $id,
                            'id_faena' => 6, // Faena por defecto
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }

                    Log::info('Máquina convertida de Externa a Interna:', [
                        'id_maquina' => $id,
                        'faena_asignada' => 6
                    ]);
                }
            }

            // Si cambió de Interno a Externo, eliminar de maquinas_internas
            if ($maquinaExistente->tipo_maquina === 'Interno' && $request->tipo_maquina === 'Externo') {
                // Eliminar de maquinas_internas
                DB::table('maquinas_internas')->where('id_maquina', $id)->delete();

                // Eliminar permisos de faenas
                DB::table('permisos_maquinas_faenas')->where('id_maquina', $id)->delete();

                Log::info('Máquina convertida de Interna a Externa:', [
                    'id_maquina' => $id,
                    'permisos_eliminados' => true
                ]);
            }

            // Si sigue siendo Interno, actualizar datos en maquinas_internas
            if ($maquinaExistente->tipo_maquina === 'Interno' && $request->tipo_maquina === 'Interno') {
                DB::table('maquinas_internas')
                    ->where('id_maquina', $id)
                    ->update([
                        'patente' => $request->patente,
                        'nombre' => $request->nombre_maquina,
                        'categoria' => $request->id_categoria,
                        'updated_at' => now()
                    ]);
            }

            DB::commit();

            // Obtener la máquina actualizada con sus relaciones
            $maquinaActualizada = $this->obtenerMaquinaCompleta($id);

            Log::info('Máquina actualizada exitosamente:', [
                'id_maquina' => $id,
                'nombre' => $request->nombre_maquina,
                'patente' => $request->patente,
                'tipo' => $request->tipo_maquina
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Máquina actualizada exitosamente',
                'data' => $maquinaActualizada
            ]);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error al actualizar máquina:', [
                'id_maquina' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar máquina: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔍 Método auxiliar para obtener una máquina específica con sus relaciones
     */
    private function obtenerMaquinaCompleta($idMaquina)
    {
        return DB::table('maquinas as m')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
            ->leftJoin('faenas as f', 'pmf.id_faena', '=', 'f.id_faena')
            ->where('m.id_maquina', $idMaquina)
            ->select([
                'm.id_maquina',
                'm.nombre_maquina',
                'm.tipo_maquina',
                'm.estado',
                'm.chc_maquina',
                'm.patente',
                'm.id_categoria',
                'm.created_at',
                'm.updated_at',
                'cm.nombre_categoria as categoria',
                'cm.chc as chc_categoria',
                'mi.id_maquina_interna',
                'f.ubicacion as faena_ubicacion',
                'f.id_faena'
            ])
            ->first();
    }

    // 👥 MÉTODOS PARA GESTIONAR USUARIOS - AdminOperadorController.php
    // Agregar estos métodos a tu AdminOperadorController existente

    /**
     * 📋 Obtener todos los datos necesarios para gestión de usuarios
     * Endpoint: GET /api/adminOperador/usuarios/datos
     */
    public function obtenerDatosUsuarios(): JsonResponse
    {
        try {
            Log::info('📋 Obteniendo datos completos para gestión de usuarios');

            // 👥 Obtener todos los usuarios con relaciones
            $usuarios = DB::table('users as u')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('roles as r', 'u.id_rol', '=', 'r.id_rol')
                ->select([
                    'u.id',
                    'u.rut',
                    'u.nombre',
                    'u.apellido',
                    'u.email',
                    'u.id_rol',
                    'u.id_faena',
                    'u.estado', // 🔥 CORREGIR: estado es tinyInteger (1/0)
                    'u.created_at',
                    'u.updated_at',
                    'f.ubicacion as faena_nombre',
                    'r.rol as rol_nombre', // 🔥 CORREGIR: campo correcto es 'rol'
                    'r.id_rol as rol_codigo'
                ])
                ->where('u.id_rol', 6) // 🔥 Solo usuarios con rol 6
                ->orderBy('u.created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    // Calcular asignaciones activas
                    $asignacionesActivas = DB::table('asignaciones_user_maquinas')
                        ->where('id_user', $user->id)
                        ->where('activo', 1)
                        ->count();

                    // Obtener último login (si tienes tabla de logs o campo last_login)
                    $ultimoLogin = null; // Puedes implementar esto si tienes tracking de logins

                    return [
                        'id' => $user->id,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'nombre_completo' => $user->nombre . ' ' . $user->apellido,
                        'rut' => $user->rut,
                        'email' => $user->email,
                        'telefono' => null, // Si tienes campo teléfono en tu tabla
                        'rol' => $user->rol_nombre ?: 'operador',
                        'rol_nombre' => $user->rol_nombre ?: 'Operador',
                        'id_faena' => $user->id_faena,
                        'faena' => $user->faena_nombre ?: 'Sin faena',
                        'faena_nombre' => $user->faena_nombre ?: 'Sin faena',
                        // 🔥 CRÍTICO: Corregir la comparación del estado
                        'activo' => $user->estado == 1, // En lugar de === 'activo'
                        'fecha_creacion' => Carbon::parse($user->created_at)->format('Y-m-d'),
                        'ultimo_login' => $ultimoLogin,
                        'asignaciones_activas' => $asignacionesActivas
                    ];
                });

            // 🏢 Obtener faenas disponibles
            $faenas = DB::table('faenas')
                ->select(['id_faena', 'ubicacion', 'detalle'])
                ->orderBy('ubicacion')
                ->get()
                ->map(function ($faena) {
                    return [
                        'id' => $faena->id_faena,
                        'id_faena' => $faena->id_faena,
                        'nombre' => $faena->ubicacion,
                        'ubicacion' => $faena->ubicacion,
                        'detalle' => $faena->detalle
                    ];
                });

            // 🛡️ Obtener roles disponibles (aunque solo uses rol 6)
            $roles = DB::table('roles')
                ->select(['id_rol', 'rol'])
                ->get()
                ->map(function ($rol) {
                    return [
                        'id' => $rol->id_rol,
                        'nombre' => $rol->rol,
                        'codigo' => $rol->rol
                    ];
                });

            // Si no hay roles en la BD, usar datos por defecto
            if ($roles->isEmpty()) {
                $roles = collect([
                    ['id' => 1, 'nombre' => 'Admin General', 'codigo' => 'admin'],
                    ['id' => 2, 'nombre' => 'Admin Operador', 'codigo' => 'admin_operador'],
                    ['id' => 3, 'nombre' => 'Operador', 'codigo' => 'operador'],
                    ['id' => 4, 'nombre' => 'Bombero', 'codigo' => 'bombero'],
                    ['id' => 5, 'nombre' => 'Gerente', 'codigo' => 'gerente'],
                    ['id' => 6, 'nombre' => 'Operador Vehiculo', 'codigo' => 'OperadorVehiculo'],
                ]);
            }

            // 📊 Calcular estadísticas CORREGIDAS
            $totalUsuarios = $usuarios->count();
            $usuariosActivos = $usuarios->where('activo', true)->count(); // Ya corregido arriba
            $usuariosInactivos = $totalUsuarios - $usuariosActivos;
            $operadores = $usuarios->count(); // Todos son operadores ya que filtraste por rol 6
            $administradores = 0; // No hay admins si solo traes rol 6

            // Estadísticas por faena
            $porFaena = $usuarios->groupBy('faena_nombre')
                ->map(function ($grupo) {
                    return $grupo->count();
                })
                ->toArray();

            $estadisticas = [
                'total_usuarios' => $totalUsuarios,
                'usuarios_activos' => $usuariosActivos,
                'usuarios_inactivos' => $usuariosInactivos,
                'operadores' => $operadores,
                'administradores' => $administradores,
                'por_faena' => $porFaena
            ];

            Log::info('✅ Datos de usuarios obtenidos exitosamente', [
                'total_usuarios' => $totalUsuarios,
                'usuarios_activos' => $usuariosActivos,
                'usuarios_inactivos' => $usuariosInactivos,
                'faenas_disponibles' => $faenas->count(),
                'roles_disponibles' => $roles->count()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Datos obtenidos correctamente',
                'data' => [
                    'usuarios' => $usuarios,
                    'faenas' => $faenas,
                    'roles' => $roles,
                    'estadisticas' => $estadisticas
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener datos de usuarios:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al cargar datos de usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 👤 Crear nuevo usuario
     * Endpoint: POST /api/adminOperador/usuarios
     */
    public function crearUsuario(Request $request): JsonResponse
    {
        try {
            // 🔍 Validar datos de entrada
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:100',
                'apellido' => 'required|string|max:100',
                'rut' => 'required|string|max:12|unique:users,rut',
                'email' => 'nullable|email|max:150|unique:users,email',
                'password' => 'required|string|min:6',
                // 🔥 ACTUALIZAR: Roles según tu base de datos real
                'rol' => 'required|string|in:OperadorVehiculo',
                'id_faena' => 'required|integer|exists:faenas,id_faena',
                'activo' => 'boolean'
            ], [
                'nombre.required' => 'El nombre es requerido',
                'apellido.required' => 'El apellido es requerido',
                'rut.required' => 'El RUT es requerido',
                'rut.unique' => 'Este RUT ya está registrado',
                'email.unique' => 'Este email ya está registrado',
                'password.required' => 'La contraseña es requerida',
                'password.min' => 'La contraseña debe tener al menos 6 caracteres',
                'id_faena.exists' => 'La faena seleccionada no existe',
                'rol.in' => 'El rol seleccionado no es válido',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // 🔐 Obtener ID del rol basado en el código
            $rolId = 6;

            // 🔥 VERIFICAR: Si no se encontró el rol, devolver error
            if (!$rolId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Rol no encontrado: ' . $request->rol
                ], 400);
            }

            // 👤 Crear usuario
            DB::beginTransaction();

            $usuarioId = DB::table('users')->insertGetId([
                'rut' => $request->rut,
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'id_rol' => $rolId,
                'id_faena' => $request->id_faena,
                // 🔥 CORREGIR: Estado como tinyInteger (1 = activo, 0 = inactivo)
                'estado' => $request->boolean('activo', true) ? 1 : 0,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            // 📋 Obtener el usuario creado con sus relaciones
            $usuario = DB::table('users as u')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('roles as r', 'u.id_rol', '=', 'r.id_rol')
                ->where('u.id', $usuarioId)
                ->select([
                    'u.id',
                    'u.rut',
                    'u.nombre',
                    'u.apellido',
                    'u.email',
                    'u.estado',
                    'u.created_at',
                    'f.ubicacion as faena_nombre',
                    'r.rol as rol_codigo'
                ])
                ->first();

            Log::info('✅ Usuario creado exitosamente', [
                'usuario_id' => $usuarioId,
                'nombre_completo' => $request->nombre . ' ' . $request->apellido,
                'email' => $request->email,
                'rol' => $request->rol,
                'faena' => $request->id_faena
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario creado exitosamente',
                'data' => [
                    'id' => $usuario->id,
                    'nombre_completo' => $usuario->nombre . ' ' . $usuario->apellido,
                    'email' => $usuario->email,
                    'rol' => $usuario->rol_codigo,
                    'faena' => $usuario->faena_nombre,
                    'activo' => $usuario->estado == 1
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('❌ Error al crear usuario:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✏️ Actualizar usuario existente
     * Endpoint: PUT /api/adminOperador/usuarios/{id}
     */
    public function actualizarUsuario($id, Request $request): JsonResponse
    {
        try {
            // 🔍 Verificar que el usuario existe
            $usuario = DB::table('users')->where('id', $id)->first();

            if (!$usuario) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // 🔍 Validar datos de entrada (excluyendo el usuario actual de unique)
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:100',
                'apellido' => 'required|string|max:100',
                'rut' => 'required|string|max:12|unique:users,rut,' . $id,
                'email' => 'nullable|email|max:150|unique:users,email,' . $id,
                'rol' => 'required|string|in:admin,admin_operador,operador,bombero,gerente,toneladas,planificador,OperadorVehiculo,asistente_bombero',
                'id_faena' => 'required|integer|exists:faenas,id_faena',
                'password' => 'nullable|string|min:6', // Opcional en edición
                'activo' => 'boolean'
            ], [
                'nombre.required' => 'El nombre es requerido',
                'apellido.required' => 'El apellido es requerido',
                'rut.required' => 'El RUT es requerido',
                'rut.unique' => 'Este RUT ya está registrado',
                'email.unique' => 'Este email ya está registrado',
                'password.min' => 'La contraseña debe tener al menos 6 caracteres',
                'id_faena.exists' => 'La faena seleccionada no existe',
                'rol.in' => 'El rol seleccionado no es válido',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // 🔐 Obtener ID del rol
            $rolId = $this->obtenerIdRolPorCodigo($request->rol);

            if (!$rolId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Rol no encontrado: ' . $request->rol
                ], 400);
            }

            // 📝 Preparar datos para actualizar
            $datosActualizacion = [
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'rut' => $request->rut,
                'email' => $request->email,
                'id_rol' => $rolId,
                'id_faena' => $request->id_faena,
                // 🔥 CORREGIR: Estado como tinyInteger
                'estado' => $request->boolean('activo', true) ? 1 : 0,
                'updated_at' => now()
            ];

            // Solo actualizar contraseña si se proporcionó una nueva
            if ($request->filled('password')) {
                $datosActualizacion['password'] = Hash::make($request->password);
            }

            // 👤 Actualizar usuario
            DB::beginTransaction();

            DB::table('users')
                ->where('id', $id)
                ->update($datosActualizacion);

            DB::commit();

            // 📋 Obtener el usuario actualizado
            $usuarioActualizado = DB::table('users as u')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('roles as r', 'u.id_rol', '=', 'r.id_rol')
                ->where('u.id', $id)
                ->select([
                    'u.id',
                    'u.nombre',
                    'u.apellido',
                    'u.email',
                    'u.estado',
                    'f.ubicacion as faena_nombre',
                    'r.rol as rol_codigo'
                ])
                ->first();

            Log::info('✅ Usuario actualizado exitosamente', [
                'usuario_id' => $id,
                'nombre_completo' => $request->nombre . ' ' . $request->apellido,
                'cambios_realizados' => array_keys($datosActualizacion)
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario actualizado exitosamente',
                'data' => [
                    'id' => $usuarioActualizado->id,
                    'nombre_completo' => $usuarioActualizado->nombre . ' ' . $usuarioActualizado->apellido,
                    'email' => $usuarioActualizado->email,
                    'rol' => $usuarioActualizado->rol_codigo,
                    'faena' => $usuarioActualizado->faena_nombre,
                    'activo' => $usuarioActualizado->estado == 1
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('❌ Error al actualizar usuario:', [
                'usuario_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔄 Toggle estado del usuario (activar/desactivar)
     * Endpoint: PATCH /api/adminOperador/usuarios/{id}/toggle-estado
     */
    public function toggleEstadoUsuario($id): JsonResponse
    {
        try {
            // 🔍 Verificar que el usuario existe
            $usuario = DB::table('users')->where('id', $id)->first();

            if (!$usuario) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // 🔒 Verificar si el usuario tiene asignaciones activas
            $asignacionesActivas = DB::table('asignaciones_user_maquinas')
                ->where('id_user', $id)
                ->where('activo', 1)
                ->count();

            if ($asignacionesActivas > 0 && $usuario->estado == 1) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El usuario no puede ser desactivado porque tiene ' .
                        $asignacionesActivas . ' asignación(es) activa(s). Primero debe desasignar el vehículo correspondiente.'
                ], 422);
            }

            // 🔄 Cambiar estado (toggle entre 1 y 0)
            $nuevoEstado = $usuario->estado == 1 ? 0 : 1;

            DB::table('users')
                ->where('id', $id)
                ->update([
                    'estado' => $nuevoEstado,
                    'updated_at' => now()
                ]);

            $accion = $nuevoEstado == 1 ? 'activado' : 'desactivado';

            Log::info("✅ Usuario {$accion} exitosamente", [
                'usuario_id' => $id,
                'nombre_completo' => $usuario->nombre . ' ' . $usuario->apellido,
                'estado_anterior' => $usuario->estado,
                'estado_nuevo' => $nuevoEstado
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Usuario {$accion} exitosamente",
                'data' => [
                    'id' => $id,
                    'nombre_completo' => $usuario->nombre . ' ' . $usuario->apellido,
                    'estado_anterior' => $usuario->estado == 1,
                    'estado_nuevo' => $nuevoEstado == 1,
                    'activo' => $nuevoEstado == 1
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al cambiar estado del usuario:', [
                'usuario_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al cambiar estado del usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 👁️ Obtener detalles específicos de un usuario
     * Endpoint: GET /api/adminOperador/usuarios/{id}
     */
    public function obtenerDetalleUsuario($id): JsonResponse
    {
        try {
            // 📋 Obtener usuario con todas sus relaciones
            $usuario = DB::table('users as u')
                ->leftJoin('faenas as f', 'u.id_faena', '=', 'f.id_faena')
                ->leftJoin('roles as r', 'u.id_rol', '=', 'r.id_rol')
                ->where('u.id', $id)
                ->select([
                    'u.id',
                    'u.rut',
                    'u.nombre',
                    'u.apellido',
                    'u.email',
                    'u.id_rol',
                    'u.id_faena',
                    'u.estado',
                    'u.created_at',
                    'u.updated_at',
                    'f.ubicacion as faena_nombre',
                    'r.rol as rol_codigo'
                ])
                ->first();

            if (!$usuario) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // 📊 Obtener estadísticas adicionales del usuario
            $asignacionesActivas = DB::table('asignaciones_user_maquinas as a')
                ->join('maquinas as m', 'a.id_maquina', '=', 'm.id_maquina')
                ->where('a.id_user', $id)
                ->where('a.activo', 1)
                ->select(['m.nombre_maquina', 'm.patente', 'a.fecha_asignacion'])
                ->get();

            $totalAsignacionesHistoricas = DB::table('asignaciones_user_maquinas')
                ->where('id_user', $id)
                ->count();

            // Último login (si tienes esta funcionalidad implementada)
            $ultimoLogin = null;

            $datosCompletos = [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'apellido' => $usuario->apellido,
                'rut' => $usuario->rut,
                'email' => $usuario->email,
                'rol' => $usuario->rol_codigo ?: 'operador',
                'id_faena' => $usuario->id_faena,
                'faena_nombre' => $usuario->faena_nombre ?: 'Sin faena',
                'activo' => $usuario->estado == 1,
                'fecha_creacion' => Carbon::parse($usuario->created_at)->format('Y-m-d'),
                'fecha_actualizacion' => Carbon::parse($usuario->updated_at)->format('Y-m-d H:i:s'),
                'ultimo_login' => $ultimoLogin,
                'asignaciones_activas' => $asignacionesActivas->count(),
                'total_asignaciones_historicas' => $totalAsignacionesHistoricas,
                'maquinas_asignadas' => $asignacionesActivas->map(function ($asignacion) {
                    return [
                        'maquina' => $asignacion->nombre_maquina,
                        'patente' => $asignacion->patente,
                        'fecha_asignacion' => Carbon::parse($asignacion->fecha_asignacion)->format('d/m/Y')
                    ];
                })
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Detalles del usuario obtenidos correctamente',
                'data' => $datosCompletos
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener detalles del usuario:', [
                'usuario_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener detalles del usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔐 Función auxiliar para obtener ID de rol por código
     */
    private function obtenerIdRolPorCodigo(string $codigo)
    {
        Log::info("🔍 Buscando rol con código: " . $codigo);

        $rolId = DB::table('roles')
            ->where('rol', $codigo)
            ->value('id_rol');

        if (!$rolId) {
            Log::error("❌ No se encontró rol con código: " . $codigo);
            // Listar roles disponibles para debug
            $rolesDisponibles = DB::table('roles')->pluck('rol')->toArray();
            Log::info("📋 Roles disponibles: " . implode(', ', $rolesDisponibles));
        }

        return $rolId;
    }

    /**
     * 🗑️ Eliminar usuario (soft delete o hard delete)
     * Endpoint: DELETE /api/adminOperador/usuarios/{id}
     */
    public function eliminarUsuario($id): JsonResponse
    {
        try {
            // 🔍 Verificar que el usuario existe
            $usuario = DB::table('users')->where('id', $id)->first();

            if (!$usuario) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // 🔒 Verificar si el usuario tiene asignaciones (históricas o activas)
            $asignacionesTotales = DB::table('asignaciones_user_maquinas')
                ->where('id_user', $id)
                ->count();

            if ($asignacionesTotales > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede eliminar el usuario porque tiene asignaciones registradas. Considere desactivarlo en lugar de eliminarlo.'
                ], 422);
            }

            // 🗑️ Eliminar usuario
            DB::beginTransaction();

            DB::table('users')->where('id', $id)->delete();

            DB::commit();

            Log::info('✅ Usuario eliminado exitosamente', [
                'usuario_id' => $id,
                'nombre_completo' => $usuario->nombre . ' ' . $usuario->apellido
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario eliminado exitosamente',
                'data' => [
                    'id' => $id,
                    'nombre_completo' => $usuario->nombre . ' ' . $usuario->apellido
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('❌ Error al eliminar usuario:', [
                'usuario_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar usuario: ' . $e->getMessage()
            ], 500);
        }
    }
}
