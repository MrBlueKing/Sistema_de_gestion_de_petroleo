<?php

namespace App\Http\Controllers\Api\AdminOperador;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MostrarDatosCargasController extends Controller
{
    /**
     * 📊 Listar cargas externas con paginación y filtros avanzados
     * ✅ CORREGIDO: Basado en tabla cargas_externas real
     * ✅ GLOBAL: Filtros buscan en TODOS los registros (no solo en página actual)
     * ✅ DINÁMICO: Paginación se adapta a filtros aplicados
     * 
     * Endpoint: GET /api/adminOperador/cargas/paginadas
     */
    public function listarCargasPaginadas(Request $request): JsonResponse
    {
        try {
            Log::info('📊 Iniciando listado paginado de cargas externas', [
                'parametros' => $request->all(),
                'usuario_id' => auth()->id()
            ]);

            // ✅ VALIDAR PARÁMETROS DE ENTRADA
            $validator = Validator::make($request->all(), [
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:5|max:100',
                'search' => 'string|max:255',
                'estado' => 'string|in:Por Rendir,Rendido',
                'faena' => 'integer|exists:faenas,id_faena',
                'tipo_combustible' => 'string|max:50',
                'fecha_inicio' => 'date',
                'fecha_fin' => 'date|after_or_equal:fecha_inicio',
                'sort' => 'string|in:fecha,numero_boleta,operador,maquina,litros,estado,faena,costo,created_at',
                //                                                                                    ↑ agregar
                'direction' => 'string|in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ OBTENER PARÁMETROS CON VALORES POR DEFECTO
            $page = (int) $request->get('page', 1);
            $perPage = (int) $request->get('per_page', 25);
            $search = $request->get('search');
            $estado = $request->get('estado');
            $faena = $request->get('faena');
            $tipoCombustible = $request->get('tipo_combustible');
            $fechaInicio = $request->get('fecha_inicio');
            $fechaFin = $request->get('fecha_fin');
            $sort = $request->get('sort', 'created_at');
            $direction = $request->get('direction', 'desc');

            Log::info('📊 Parámetros procesados:', compact(
                'page',
                'perPage',
                'search',
                'estado',
                'faena',
                'tipoCombustible',
                'fechaInicio',
                'fechaFin',
                'sort',
                'direction'
            ));

            // ✅ CONSTRUIR QUERY BASE PARA CARGAS_EXTERNAS (TABLAS REALES CORREGIDAS)
            $queryBase = DB::table('cargas_externas as ce')
                ->leftJoin('users as u', 'ce.id_user', '=', 'u.id')
                ->leftJoin('maquinas as m', 'ce.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria') // ✅ CORREGIDO
                ->leftJoin('faenas as f', 'ce.id_faena', '=', 'f.id_faena')
                ->leftJoin('users as aprobador', 'ce.aprobado_por', '=', 'aprobador.id')
                ->select([
                    'ce.id',
                    'ce.id_user',
                    'ce.id_maquina',
                    'ce.numero_boleta',
                    'ce.litros',
                    'ce.medicion',
                    'ce.id_faena',
                    'ce.costo',
                    'ce.precio_por_litro',
                    'ce.ubicacion',
                    'ce.tipo_combustible',
                    'ce.observaciones',
                    'ce.estado',
                    'ce.aprobado_por',
                    'ce.fecha_aprobacion',
                    'ce.motivo_rechazo',
                    'ce.created_at',
                    'ce.updated_at',

                    // Datos del operador (users)
                    'u.id as operador_id',
                    'u.rut as operador_rut',
                    'u.nombre as operador_nombre',
                    'u.apellido as operador_apellido',
                    'u.email as operador_email',

                    // Datos de la máquina (maquinas) - SIN numero_interno
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.tipo_maquina',
                    'm.estado as maquina_estado',
                    'm.patente',

                    // Datos de la categoría (categoria_maquinas) - CORREGIDO
                    'cm.id_categoria',
                    'cm.nombre_categoria',
                    'cm.tipo_medicion',

                    // Datos de la faena (faenas)
                    'f.id_faena',
                    'f.ubicacion as faena_ubicacion',
                    'f.detalle as faena_detalle',

                    // Datos del aprobador (users)
                    'aprobador.nombre as aprobador_nombre',
                    'aprobador.apellido as aprobador_apellido'
                ]);

            // ✅ OBTENER TOTAL SIN FILTROS (para estadísticas)
            $totalSinFiltros = (clone $queryBase)->count();

            // ✅ APLICAR FILTROS DINÁMICAMENTE
            $queryFiltrado = clone $queryBase;

            // 🔍 Filtro de búsqueda global (busca en TODOS los registros)
            if ($search) {
                $queryFiltrado->where(function ($q) use ($search) {
                    $q->where('ce.numero_boleta', 'LIKE', "%{$search}%")
                        ->orWhere('ce.ubicacion', 'LIKE', "%{$search}%")
                        ->orWhere('ce.observaciones', 'LIKE', "%{$search}%")
                        ->orWhere('ce.tipo_combustible', 'LIKE', "%{$search}%")
                        ->orWhere('u.nombre', 'LIKE', "%{$search}%")
                        ->orWhere('u.apellido', 'LIKE', "%{$search}%")
                        ->orWhere('u.rut', 'LIKE', "%{$search}%")
                        ->orWhere('m.nombre_maquina', 'LIKE', "%{$search}%")
                        ->orWhere('m.patente', 'LIKE', "%{$search}%")
                        ->orWhere('m.tipo_maquina', 'LIKE', "%{$search}%")
                        ->orWhere('cm.nombre_categoria', 'LIKE', "%{$search}%") // ✅ CORREGIDO
                        ->orWhere('f.ubicacion', 'LIKE', "%{$search}%");
                });
            }

            // 📊 Filtro por estado (Por Rendir / Rendido)
            if ($estado) {
                $queryFiltrado->where('ce.estado', $estado);
            }

            // 🏭 Filtro por faena
            if ($faena) {
                $queryFiltrado->where('ce.id_faena', $faena);
            }

            // ⛽ Filtro por tipo de combustible
            if ($tipoCombustible) {
                $queryFiltrado->where('ce.tipo_combustible', 'LIKE', "%{$tipoCombustible}%");
            }

            // 📅 Filtros por rango de fecha (usando created_at)
            if ($fechaInicio) {
                $queryFiltrado->whereDate('ce.created_at', '>=', $fechaInicio);
            }
            if ($fechaFin) {
                $queryFiltrado->whereDate('ce.created_at', '<=', $fechaFin);
            }

            // ✅ OBTENER TOTAL CON FILTROS (IMPORTANTE: esto es lo que resuelve el problema)
            $totalConFiltros = (clone $queryFiltrado)->count();

            // ✅ APLICAR ORDENAMIENTO
            $sortColumn = match ($sort) {
                'fecha' => 'ce.created_at',
                'numero_boleta' => 'ce.numero_boleta',
                'operador' => 'u.nombre',
                'maquina' => 'm.nombre_maquina',
                'litros' => 'ce.litros',
                'estado' => 'ce.estado',
                'faena' => 'f.ubicacion',
                'costo' => 'ce.costo',
                default => 'ce.created_at'
            };

            $queryFiltrado->orderBy($sortColumn, $direction);

            // ✅ APLICAR PAGINACIÓN (sobre los datos ya filtrados)
            $offset = ($page - 1) * $perPage;
            $datos = $queryFiltrado->skip($offset)->take($perPage)->get();

            // ✅ FORMATEAR DATOS PARA EL FRONTEND
            $cargasFormateadas = $datos->map(function ($carga) {
                return [
                    'id' => $carga->id,
                    'numero_boleta' => $carga->numero_boleta,
                    'litros' => (float) $carga->litros,
                    'litros_formateados' => number_format($carga->litros, 1) . ' L',
                    'medicion' => (float) $carga->medicion,
                    'costo' => (float) $carga->costo,
                    'costo_formateado' => '$' . number_format($carga->costo, 0, ',', '.'),
                    'precio_por_litro' => (float) $carga->precio_por_litro,
                    'precio_formateado' => '$' . number_format($carga->precio_por_litro, 0),
                    'ubicacion' => $carga->ubicacion,
                    'tipo_combustible' => $carga->tipo_combustible,
                    'observaciones' => $carga->observaciones ?: '-',
                    'estado' => $carga->estado,
                    'estado_badge' => $this->formatearEstadoBadgeCarga($carga->estado),
                    'fecha_aprobacion' => $carga->fecha_aprobacion ? Carbon::parse($carga->fecha_aprobacion)->format('d/m/Y H:i') : null,
                    'motivo_rechazo' => $carga->motivo_rechazo,
                    'created_at' => Carbon::parse($carga->created_at)->format('d/m/Y H:i'),
                    'fecha_creacion' => Carbon::parse($carga->created_at)->format('d/m/Y'),

                    // Datos del operador
                    'operador' => [
                        'id' => $carga->operador_id,
                        'nombre_completo' => trim($carga->operador_nombre . ' ' . $carga->operador_apellido),
                        'nombre' => $carga->operador_nombre,
                        'apellido' => $carga->operador_apellido,
                        'rut' => $carga->operador_rut,
                        'email' => $carga->operador_email
                    ],

                    // Datos de la máquina (SIN numero_interno)
                    'maquina' => [
                        'id' => $carga->id_maquina,
                        'nombre' => $carga->nombre_maquina,
                        'patente' => $carga->patente,
                        'tipo_maquina' => $carga->tipo_maquina,
                        'estado' => $carga->maquina_estado,
                        'display' => $carga->nombre_maquina . ($carga->patente ? " ({$carga->patente})" : ''),
                        'categoria' => $carga->nombre_categoria
                    ],

                    // Datos de la categoría
                    'categoria' => [
                        'id' => $carga->id_categoria,
                        'nombre' => $carga->nombre_categoria,
                        'tipo_medicion' => $carga->tipo_medicion
                    ],

                    // Datos de la faena
                    'faena' => [
                        'id' => $carga->id_faena,
                        'nombre' => $carga->faena_ubicacion,
                        'detalle' => $carga->faena_detalle
                    ],

                    // Datos del aprobador
                    'aprobador' => $carga->aprobador_nombre ? [
                        'nombre_completo' => trim($carga->aprobador_nombre . ' ' . $carga->aprobador_apellido)
                    ] : null
                ];
            });

            // ✅ CALCULAR INFORMACIÓN DE PAGINACIÓN
            $lastPage = (int) ceil($totalConFiltros / $perPage);
            $from = $totalConFiltros > 0 ? $offset + 1 : 0;
            $to = min($offset + $perPage, $totalConFiltros);

            // ✅ OBTENER OPCIONES PARA FILTROS
            $opcionesFiltros = $this->obtenerOpcionesFiltrosCargas();

            // ✅ ESTADÍSTICAS ADICIONALES
            $estadisticas = $this->calcularEstadisticasCargas($totalSinFiltros, $totalConFiltros);

            // ✅ PREPARAR RESPUESTA FINAL
            $response = [
                'success' => true,
                'data' => $cargasFormateadas,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $totalConFiltros, // ✅ ESTE ES EL TOTAL FILTRADO
                    'last_page' => $lastPage,
                    'from' => $from,
                    'to' => $to,
                    'has_more_pages' => $page < $lastPage,
                    'prev_page_url' => $page > 1 ? $page - 1 : null,
                    'next_page_url' => $page < $lastPage ? $page + 1 : null
                ],
                'filters' => [
                    'applied' => [
                        'search' => $search,
                        'estado' => $estado,
                        'faena' => $faena,
                        'tipo_combustible' => $tipoCombustible,
                        'fecha_inicio' => $fechaInicio,
                        'fecha_fin' => $fechaFin,
                        'sort' => $sort,
                        'direction' => $direction
                    ],
                    'available' => $opcionesFiltros
                ],
                'meta' => [
                    'total_sin_filtros' => $totalSinFiltros,
                    'total_con_filtros' => $totalConFiltros,
                    'filtros_activos' => $this->contarFiltrosActivos($request),
                    'tiempo_consulta' => round(microtime(true) - LARAVEL_START, 3),
                    'registros_por_pagina' => $perPage,
                    'estadisticas' => $estadisticas
                ]
            ];

            Log::info('✅ Consulta completada exitosamente', [
                'total_sin_filtros' => $totalSinFiltros,
                'total_con_filtros' => $totalConFiltros,
                'pagina' => $page,
                'registros_devueltos' => $cargasFormateadas->count(),
                'tiempo_consulta' => $response['meta']['tiempo_consulta']
            ]);

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('❌ Error en listarCargasPaginadas:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'parametros' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Ha ocurrido un error inesperado'
            ], 500);
        }
    }

    // ✅ MÉTODOS AUXILIARES CORREGIDOS

    /**
     * 🎨 Formatear estado para mostrar badge en frontend
     */
    private function formatearEstadoBadgeCarga(string $estado): array
    {
        return match ($estado) {
            'Por Rendir' => [
                'label' => 'Por Rendir',
                'color' => 'warning',
                'icon' => 'clock',
                'class' => 'badge-warning'
            ],
            'Rendido' => [
                'label' => 'Rendido',
                'color' => 'success',
                'icon' => 'check-circle',
                'class' => 'badge-success'
            ],
            default => [
                'label' => $estado,
                'color' => 'secondary',
                'icon' => 'help-circle',
                'class' => 'badge-secondary'
            ]
        };
    }

    /**
     * 📊 Obtener opciones disponibles para filtros de cargas
     */
    private function obtenerOpcionesFiltrosCargas(): array
    {
        try {
            // Obtener faenas (TABLA REAL: faenas)
            $faenas = DB::table('faenas')
                ->select('id_faena as id', 'ubicacion as nombre')
                ->orderBy('ubicacion')
                ->get();

            // Obtener categorías de máquinas (TABLA REAL: categoria_maquinas)
            $categorias = DB::table('categoria_maquinas')
                ->select('id_categoria as id', 'nombre_categoria as nombre')
                ->orderBy('nombre_categoria')
                ->get();

            // Obtener tipos de combustible únicos
            $tiposCombustible = DB::table('cargas_externas')
                ->select('tipo_combustible')
                ->whereNotNull('tipo_combustible')
                ->where('tipo_combustible', '!=', '')
                ->groupBy('tipo_combustible')
                ->orderBy('tipo_combustible')
                ->pluck('tipo_combustible')
                ->map(function ($tipo) {
                    return ['id' => $tipo, 'nombre' => $tipo];
                });

            // Estados disponibles
            $estados = [
                ['id' => 'Por Rendir', 'nombre' => 'Por Rendir'],
                ['id' => 'Rendido', 'nombre' => 'Rendido']
            ];

            // Opciones de ordenamiento
            $opcionesOrden = [
                ['id' => 'fecha', 'nombre' => 'Fecha'],
                ['id' => 'numero_boleta', 'nombre' => 'Número Boleta'],
                ['id' => 'operador', 'nombre' => 'Operador'],
                ['id' => 'maquina', 'nombre' => 'Máquina'],
                ['id' => 'litros', 'nombre' => 'Litros'],
                ['id' => 'estado', 'nombre' => 'Estado'],
                ['id' => 'faena', 'nombre' => 'Faena'],
                ['id' => 'costo', 'nombre' => 'Costo']
            ];

            return [
                'faenas' => $faenas,
                'categorias' => $categorias,
                'tipos_combustible' => $tiposCombustible->values(),
                'estados' => $estados,
                'orden' => $opcionesOrden,
                'direcciones' => [
                    ['id' => 'asc', 'nombre' => 'Ascendente'],
                    ['id' => 'desc', 'nombre' => 'Descendente']
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Error obteniendo opciones de filtros:', ['error' => $e->getMessage()]);
            return [
                'faenas' => [],
                'categorias' => [],
                'tipos_combustible' => [],
                'estados' => [],
                'orden' => [],
                'direcciones' => []
            ];
        }
    }

    /**
     * 📈 Calcular estadísticas de cargas
     */
    private function calcularEstadisticasCargas(int $totalSinFiltros, int $totalConFiltros): array
    {
        try {
            // Contar por estado
            $estadoPorRendir = DB::table('cargas_externas')->where('estado', 'Por Rendir')->count();
            $estadoRendido = DB::table('cargas_externas')->where('estado', 'Rendido')->count();

            // Totales de litros y costos
            $stats = DB::table('cargas_externas')->selectRaw('
            SUM(litros) as total_litros,
            SUM(costo) as total_costo,
            AVG(precio_por_litro) as precio_promedio
        ')->first();

            return [
                'por_estado' => [
                    'por_rendir' => $estadoPorRendir,
                    'rendido' => $estadoRendido
                ],
                'totales' => [
                    'litros' => (float) ($stats->total_litros ?? 0),
                    'costo' => (float) ($stats->total_costo ?? 0),
                    'precio_promedio' => (float) ($stats->precio_promedio ?? 0)
                ],
                'porcentaje_filtrado' => $totalSinFiltros > 0 ? round(($totalConFiltros / $totalSinFiltros) * 100, 1) : 0
            ];
        } catch (\Exception $e) {
            Log::error('Error calculando estadísticas:', ['error' => $e->getMessage()]);
            return [
                'por_estado' => ['por_rendir' => 0, 'rendido' => 0],
                'totales' => ['litros' => 0, 'costo' => 0, 'precio_promedio' => 0],
                'porcentaje_filtrado' => 0
            ];
        }
    }

    /**
     * 🔢 Contar filtros activos
     */
    private function contarFiltrosActivos(Request $request): int
    {
        $filtros = ['search', 'estado', 'faena', 'tipo_combustible', 'fecha_inicio', 'fecha_fin'];
        return collect($filtros)->filter(fn($filtro) => $request->filled($filtro))->count();
    }
}
