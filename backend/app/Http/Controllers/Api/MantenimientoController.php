<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MantenimientoController extends Controller
{
    /**
     * Obtener estado de mantenimiento de todas las máquinas
     */
    public function index(Request $request)
    {
        try {
            $faena = $request->get('faena', 'todas');

            // Subquery para obtener la última mantención por máquina
            $latestMantenciones = DB::table('mantenciones')
                ->select('id_maquina', DB::raw('MAX(fecha_mantencion) as latest_fecha_mantencion'))
                ->groupBy('id_maquina');

            // Subquery para obtener el último consumo por equipo
            $latestConsumos = DB::table('consumos')
                ->select('id_equipo', DB::raw('MAX(fecha_consumo) as latest_fecha_consumo'))
                ->groupBy('id_equipo');

            $query = DB::table('maquinas as m')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')

                // Unir con la subquery de la última mantención
                ->leftJoinSub($latestMantenciones, 'lm', function ($join) {
                    $join->on('m.id_maquina', '=', 'lm.id_maquina');
                })
                ->leftJoin('mantenciones as mt', function ($join) {
                    $join->on('m.id_maquina', '=', 'mt.id_maquina')
                        ->on('mt.fecha_mantencion', '=', 'lm.latest_fecha_mantencion');
                })

                // Unir con la subquery del último consumo
                ->leftJoinSub($latestConsumos, 'lc', function ($join) {
                    $join->on('m.id_maquina', '=', 'lc.id_equipo');
                })
                ->leftJoin('consumos as c', function ($join) {
                    $join->on('m.id_maquina', '=', 'c.id_equipo')
                        ->on('c.fecha_consumo', '=', 'lc.latest_fecha_consumo');
                })

                ->select([
                    'm.id_maquina',
                    'm.nombre_maquina as equipo',
                    'm.patente',
                    'cm.nombre_categoria as categoria',
                    'cm.tipo_medicion',
                    'cm.horas_mantencion as intervalo_mantenimiento',
                    'm.estado as estado_operativo',

                    // Último mantenimiento
                    'mt.fecha_mantencion as ultimo_mantenimiento_fecha',
                    'mt.horas_kilometros_actuales as medicion_ultimo_mantenimiento',
                    'mt.proxima_mantencion as proximo_mantenimiento_configurado',
                    'mt.tipo_mantenimiento as tipo_mantenimiento',
                    'mt.observaciones as ultimo_mantenimiento_obs',
                    'mt.realizado_por as id_usuario_realizo',

                    // Último consumo
                    'c.medicion as medicion_actual',
                    'c.fecha_consumo as fecha_ultima_medicion'
                ]);

            if ($faena !== 'todas') {
                $query->where('pmf.id_faena', $faena);
            }

            $maquinas = $query->get();

            $maquinasConEstado = $maquinas->map(function ($maquina) {
                return $this->calcularEstadoMaquina($maquina);
            })->sortByDesc('porcentaje_uso');

            return response()->json([
                'status' => 'success',
                'data' => $maquinasConEstado->values()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos de mantenimiento: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Registrar nuevo mantenimiento
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'descripcion' => 'required|string|min:10',
            'tipo_mantenimiento' => 'required|in:preventivo,correctivo,mayor',
            'observaciones' => 'nullable|string',
            'proximo_mantenimiento' => 'nullable|numeric|min:1',
            'realizado_por' => 'required|exists:users,id'
        ]);

        try {
            DB::beginTransaction();

            // Obtener datos actuales de la máquina
            $maquina = DB::table('maquinas as m')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('consumos as c', function ($join) {
                    $join->on('m.id_maquina', '=', 'c.id_equipo')
                        ->whereRaw('c.fecha_consumo = (SELECT MAX(fecha_consumo) FROM consumos WHERE id_equipo = m.id_maquina)');
                })
                ->where('m.id_maquina', $request->id_maquina)
                ->select('m.*', 'cm.horas_mantencion as intervalo_default', 'cm.tipo_medicion', 'c.medicion as medicion_actual')
                ->first();

            if (!$maquina) {
                throw new \Exception('Máquina no encontrada');
            }

            $medicionActual = $maquina->medicion_actual ?? 0;
            $intervaloProximoMantenimiento = $request->proximo_mantenimiento ?? $maquina->intervalo_default;

            $fullObservaciones = $request->descripcion;
            if ($request->observaciones) {
                $fullObservaciones .= ' | ' . $request->observaciones;
            }

            // Registrar mantenimiento
            $mantenimientoId = DB::table('mantenciones')->insertGetId([
                'id_maquina' => $request->id_maquina,
                'fecha_mantencion' => now(),
                'horas_kilometros_actuales' => $medicionActual,
                'proxima_mantencion' => $intervaloProximoMantenimiento,
                'tipo_mantenimiento' => $request->tipo_mantenimiento,
                'realizado_por' => $request->realizado_por,
                'observaciones' => $fullObservaciones,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::table('maquinas')
                ->where('id_maquina', $request->id_maquina)
                ->update([
                    'estado' => 'operativo',
                    'updated_at' => now()
                ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Mantenimiento registrado correctamente',
                'data' => ['id_mantenimiento' => $mantenimientoId]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar mantenimiento: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Marcar máquina como operativa
     */
    public function marcarOperativa($id)
    {
        try {
            $updated = DB::table('maquinas')
                ->where('id_maquina', $id)
                ->update([
                    'estado' => 'operativo',
                    'updated_at' => now()
                ]);

            if (!$updated) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Máquina no encontrada'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Máquina marcada como operativa'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener historial de mantenimiento
     */
    public function historial($id)
    {
        try {
            $historial = DB::table('mantenciones as mt')
                ->where('mt.id_maquina', $id)
                ->select([
                    'mt.id_mantencion', // Asegúrate de seleccionar el ID de la mantención
                    'mt.id_maquina',
                    'mt.fecha_mantencion', // Fecha original para Carbon
                    'mt.horas_kilometros_actuales',
                    'mt.proxima_mantencion',
                    'mt.observaciones',
                    DB::raw('DATE_FORMAT(mt.fecha_mantencion, "%d/%m/%Y") as fecha_mantencion_formateada'),
                    DB::raw('DATEDIFF(NOW(), mt.fecha_mantencion) as dias_desde_mantenimiento'),
                    // Simular tipo de mantenimiento basado en observaciones (mantengo la lógica actual)
                    DB::raw('CASE
                        WHEN mt.observaciones LIKE "%preventivo%" THEN "preventivo"
                        WHEN mt.observaciones LIKE "%correctivo%" THEN "correctivo"
                        WHEN mt.observaciones LIKE "%mayor%" THEN "mayor"
                        ELSE "preventivo"
                    END as tipo_mantenimiento')
                    // La descripción limpia ya no necesita extraer el costo, solo las observaciones si el costo se mueve a una columna separada
                    // Si aún necesitas una 'descripción limpia' que no incluya el 'costo: $' que quizás se seguía agregando,
                    // esta CASE statement aún es útil.
                    // Pero si el costo se guarda solo en la columna 'costo', 'mt.observaciones' sería la descripción limpia.
                ])
                ->orderBy('mt.fecha_mantencion', 'desc')
                ->get()
                ->map(function ($item) {
                    // Formatear la fecha después de obtener los datos para cálculos de Carbon
                    $item->fecha_mantencion = Carbon::parse($item->fecha_mantencion)->format('d/m/Y H:i:s');
                    return $item;
                });

            return response()->json([
                'status' => 'success',
                'data' => $historial
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener historial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de mantenimiento
     */
    public function estadisticas(Request $request)
    {
        try {
            $faena = $request->get('faena', 'todas');
            $periodo = $request->get('periodo', 30);

            $fechaInicio = Carbon::now()->subDays($periodo);

            $query = DB::table('mantenciones as mt')
                ->join('maquinas as m', 'mt.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->where('mt.fecha_mantencion', '>=', $fechaInicio);

            if ($faena !== 'todas') {
                $query->where('pmf.id_faena', $faena);
            }

            return response()->json([
                'status' => 'success',
                'data' => $estadisticas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Programar mantenimiento futuro
     */
    public function programarMantenimiento(Request $request)
    {
        $request->validate([
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'fecha_programada' => 'required|date|after_or_equal:today', // Cambiado a after_or_equal para permitir hoy
            'tipo_mantenimiento' => 'required|in:preventivo,correctivo,mayor',
            'descripcion' => 'required|string|min:10',
            'costo_estimado' => 'nullable|numeric|min:0'
        ]);

        try {
            $programacionId = DB::table('programacion_mantenimientos')->insertGetId([
                'id_maquina' => $request->id_maquina,
                'fecha_programada' => $request->fecha_programada,
                'tipo_mantenimiento' => $request->tipo_mantenimiento,
                'descripcion' => $request->descripcion,
                'costo_estimado' => $request->costo_estimado ?? 0,
                'estado' => 'programado',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Mantenimiento programado correctamente',
                'data' => ['id_programacion' => $programacionId]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al programar mantenimiento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener alertas de mantenimiento
     */
    public function obtenerAlertas(Request $request)
    {
        try {
            $faena = $request->get('faena', 'todas');

            // Obtener máquinas que necesitan mantenimiento usando el método privado
            $maquinas = $this->getProcessedMachines($request);

            $alertas = [];

            foreach ($maquinas as $maquina) {
                if ($maquina['estado'] === 'critico') {
                    $alertas[] = [
                        'tipo' => 'critico',
                        'titulo' => 'Mantenimiento Crítico Requerido',
                        'mensaje' => "La máquina {$maquina['equipo']} requiere mantenimiento inmediato (uso: {$maquina['porcentaje_uso']}%)",
                        'maquina' => $maquina,
                        'fecha_creacion' => now()->toISOString()
                    ];
                } elseif ($maquina['estado'] === 'advertencia') {
                    $alertas[] = [
                        'tipo' => 'advertencia',
                        'titulo' => 'Mantenimiento Próximo',
                        'mensaje' => "La máquina {$maquina['equipo']} necesitará mantenimiento pronto (uso: {$maquina['porcentaje_uso']}%)",
                        'maquina' => $maquina,
                        'fecha_creacion' => now()->toISOString()
                    ];
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $alertas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener alertas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exportar reporte de mantenimiento
     */
    public function exportarReporte(Request $request)
    {
        try {
            $faena = $request->get('faena', 'todas');
            $formato = $request->get('formato', 'pdf'); // pdf, excel, csv

            // Obtener datos para el reporte usando el método privado
            $dataMaquinas = $this->getProcessedMachines($request);

            // Simular generación de reporte
            // Aquí podrías integrar librerías para generar PDF/Excel reales
            $reporte = [
                'titulo' => 'Reporte de Mantenimiento',
                'fecha_generacion' => now()->format('d/m/Y H:i:s'),
                'faena' => $faena !== 'todas' ? $faena : 'Todas las faenas',
                'total_maquinas' => count($dataMaquinas),
                'maquinas_criticas' => count(array_filter($dataMaquinas->toArray(), fn($m) => $m['estado'] === 'critico')),
                'maquinas_advertencia' => count(array_filter($dataMaquinas->toArray(), fn($m) => $m['estado'] === 'advertencia')),
                'maquinas_normales' => count(array_filter($dataMaquinas->toArray(), fn($m) => $m['estado'] === 'normal')),
                'detalle_maquinas' => $dataMaquinas->values()
            ];

            // En un caso real, aquí se generaría el archivo y se devolvería un enlace de descarga o el archivo directamente
            return response()->json([
                'status' => 'success',
                'message' => 'Reporte generado correctamente',
                'data' => $reporte,
                'download_url' => url("/api/mantenimiento/reporte/download/{$formato}/" . time())
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al generar reporte: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener costos de mantenimiento por período
     */
    public function obtenerCostos(Request $request)
    {
        try {
            $faena = $request->get('faena', 'todas');
            $fechaInicio = $request->get('fecha_inicio', Carbon::now()->subDays(30)->format('Y-m-d'));
            $fechaFin = $request->get('fecha_fin', Carbon::now()->format('Y-m-d'));

            $query = DB::table('mantenciones as mt')
                ->join('maquinas as m', 'mt.id_maquina', '=', 'm.id_maquina')
                ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->whereBetween('mt.fecha_mantencion', [$fechaInicio, $fechaFin]);

            if ($faena !== 'todas') {
                $query->where('pmf.id_faena', $faena);
            }

            $mantenimientos = $query->select([
                'm.nombre_maquina as equipo',
                'm.patente'
            ])->get();

            $totalCostos = $mantenimientos->sum('costo');

            $costos = [
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ],
                'total_mantenimientos' => $mantenimientos->count(),
                'costo_total' => $totalCostos,
                'costo_promedio' => $mantenimientos->count() > 0 ? $totalCostos / $mantenimientos->count() : 0,
                'detalle_por_maquina' => $mantenimientos->groupBy('equipo')->map(function ($group) {
                    return [
                        'equipo' => $group->first()->equipo,
                        'patente' => $group->first()->patente,
                        'cantidad_mantenimientos' => $group->count(),
                        'costo_total' => $group->sum('costo')
                    ];
                })->values()
            ];

            return response()->json([
                'status' => 'success',
                'data' => $costos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener costos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dashboard de mantenimiento
     */
    public function dashboard(Request $request)
    {
        try {
            $faena = $request->get('faena', 'todas');

            // Obtener datos de máquinas (usando el método privado para reutilización)
            $maquinasData = $this->getProcessedMachines($request);

            // Obtener estadísticas (reutilizando el método público)
            $estadisticasResponse = $this->estadisticas($request);
            $estadisticasData = json_decode($estadisticasResponse->getContent(), true);

            // Obtener alertas (reutilizando el método público)
            $alertasResponse = $this->obtenerAlertas($request);
            $alertasData = json_decode($alertasResponse->getContent(), true);

            $dashboard = [
                'resumen' => [
                    'total_maquinas' => count($maquinasData ?? []),
                    'maquinas_criticas' => count(array_filter($maquinasData->toArray() ?? [], fn($m) => $m['estado'] === 'critico')),
                    'maquinas_advertencia' => count(array_filter($maquinasData->toArray() ?? [], fn($m) => $m['estado'] === 'advertencia')),
                    'maquinas_normales' => count(array_filter($maquinasData->toArray() ?? [], fn($m) => $m['estado'] === 'normal')),
                    'disponibilidad' => $this->calcularDisponibilidad($maquinasData->toArray() ?? [])
                ],
                'estadisticas' => $estadisticasData['data'] ?? [],
                'alertas_recientes' => array_slice($alertasData['data'] ?? [], 0, 5),
                'maquinas_detalle' => $maquinasData->values() ?? [],
                'fecha_actualizacion' => now()->toISOString()
            ];

            return response()->json([
                'status' => 'success',
                'data' => $dashboard
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las máquinas con su estado
     */
    public function obtenerMaquinas(Request $request)
    {
        // Reutiliza el método index directamente
        return $this->index($request);
    }

    /**
     * Obtener detalles de una máquina específica
     */
    public function obtenerMaquina($id)
    {
        try {
            // Subquery para obtener la última mantención por máquina
            $latestMantenciones = DB::table('mantenciones')
                ->select('id_maquina', DB::raw('MAX(fecha_mantencion) as latest_fecha_mantencion'))
                ->groupBy('id_maquina');

            // Subquery para obtener el último consumo por equipo
            $latestConsumos = DB::table('consumos')
                ->select('id_equipo', DB::raw('MAX(fecha_consumo) as latest_fecha_consumo'))
                ->groupBy('id_equipo');

            $maquina = DB::table('maquinas as m')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                // Unir con la subquery de la última mantención
                ->leftJoinSub($latestMantenciones, 'lm', function ($join) {
                    $join->on('m.id_maquina', '=', 'lm.id_maquina');
                })
                // Ahora unir a la tabla de mantenciones usando la fecha máxima
                ->leftJoin('mantenciones as mt', function ($join) {
                    $join->on('m.id_maquina', '=', 'mt.id_maquina')
                        ->on('lm.latest_fecha_mantencion', '=', 'mt.fecha_mantencion');
                })
                // Unir con la subquery del último consumo
                ->leftJoinSub($latestConsumos, 'lc', function ($join) {
                    $join->on('m.id_maquina', '=', 'lc.id_equipo');
                })
                // Ahora unir a la tabla de consumos usando la fecha máxima
                ->leftJoin('consumos as c', function ($join) {
                    $join->on('m.id_maquina', '=', 'c.id_equipo')
                        ->on('lc.latest_fecha_consumo', '=', 'c.fecha_consumo');
                })
                ->where('m.id_maquina', $id)
                ->select([
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.patente',
                    'm.estado', // Estado operativo de la máquina
                    'cm.nombre_categoria as categoria',
                    'cm.tipo_medicion',
                    'cm.horas_mantencion as intervalo_mantenimiento',
                    'c.medicion as medicion_actual',
                    'c.fecha_consumo as fecha_ultima_medicion',
                    'mt.fecha_mantencion as ultimo_mantenimiento_fecha',
                    'mt.horas_kilometros_actuales as medicion_ultimo_mantenimiento',
                    'mt.proxima_mantencion as proximo_mantenimiento_configurado',
                    'mt.observaciones as ultimo_mantenimiento_obs',
                ])
                ->first();

            if (!$maquina) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Máquina no encontrada'
                ], 404);
            }

            // Usar calcularEstadoMaquina para enriquecer los datos
            $maquinaDetalle = $this->calcularEstadoMaquina($maquina);

            return response()->json([
                'status' => 'success',
                'data' => $maquinaDetalle
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener máquina: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar configuración de mantenimiento de una máquina
     * Nota: Esta función actualiza la configuración de la categoría, no de la máquina individualmente.
     * Si necesitas actualizar la configuración específica de una máquina, deberías tener columnas en 'maquinas'
     * o una tabla intermedia para sobrescribir los valores de la categoría.
     * Asumiendo que 'intervalo_mantenimiento' y 'tipo_medicion' son de la tabla 'categorias_maquinas'.
     */
    public function actualizarConfiguracion(Request $request, $id_categoria) // Cambiado a $id_categoria
    {
        $request->validate([
            'intervalo_mantenimiento' => 'required|numeric|min:1',
            'tipo_medicion' => 'required|in:Horometro,Kilometraje'
        ]);

        try {
            $updated = DB::table('categorias_maquinas') // Actualizar en categorias_maquinas
                ->where('id_categoria', $id_categoria)
                ->update([
                    'horas_mantencion' => $request->intervalo_mantenimiento,
                    'tipo_medicion' => $request->tipo_medicion,
                    'updated_at' => now()
                ]);

            if (!$updated) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Configuración de categoría actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar configuración: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Obtener métricas de rendimiento de una máquina
     */
    public function obtenerMetricas(Request $request, $id)
    {
        try {
            $dias = $request->get('dias', 30);

            $metricas = [
                'uso_promedio_diario' => $this->calcularUsoPromedioDiario($id),
                'mantenimientos_periodo' => DB::table('mantenciones')
                    ->where('id_maquina', $id)
                    ->where('fecha_mantencion', '>=', Carbon::now()->subDays($dias))
                    ->count(),
                'costo_mantenimiento_periodo' => DB::table('mantenciones')
                    ->where('id_maquina', $id)
                    ->where('fecha_mantencion', '>=', Carbon::now()->subDays($dias))
                    ->sum('costo'), // Sumar la nueva columna de costo
                'tiempo_operativo' => $this->calcularTiempoOperativo($id, $dias), // Asumiendo implementación
                'eficiencia' => $this->calcularEficienciaMaquina($id, $dias) // Asumiendo implementación
            ];

            return response()->json([
                'status' => 'success',
                'data' => $metricas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener métricas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las categorías
     */
    public function obtenerCategorias()
    {
        try {
            $categorias = DB::table('categorias_maquinas')->get();

            return response()->json([
                'status' => 'success',
                'data' => $categorias
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva categoría
     */
    public function crearCategoria(Request $request)
    {
        $request->validate([
            'nombre_categoria' => 'required|string|max:100|unique:categorias_maquinas',
            'tipo_medicion' => 'required|in:Horometro,Kilometraje',
            'horas_mantencion' => 'required|numeric|min:1'
        ]);

        try {
            $categoriaId = DB::table('categorias_maquinas')->insertGetId([
                'nombre_categoria' => $request->nombre_categoria,
                'tipo_medicion' => $request->tipo_medicion,
                'horas_mantencion' => $request->horas_mantencion,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Categoría creada correctamente',
                'data' => ['id_categoria' => $categoriaId]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar categoría
     */
    public function actualizarCategoria(Request $request, $id)
    {
        $request->validate([
            'nombre_categoria' => 'required|string|max:100',
            'tipo_medicion' => 'required|in:Horometro,Kilometraje',
            'horas_mantencion' => 'required|numeric|min:1'
        ]);

        try {
            $updated = DB::table('categorias_maquinas')
                ->where('id_categoria', $id)
                ->update([
                    'nombre_categoria' => $request->nombre_categoria,
                    'tipo_medicion' => $request->tipo_medicion,
                    'horas_mantencion' => $request->horas_mantencion,
                    'updated_at' => now()
                ]);

            if (!$updated) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Categoría actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar categoría
     */
    public function eliminarCategoria($id)
    {
        try {
            // Verificar si hay máquinas usando esta categoría
            $maquinasUsandoCategoria = DB::table('maquinas')
                ->where('id_categoria', $id)
                ->count();

            if ($maquinasUsandoCategoria > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede eliminar la categoría porque hay máquinas que la utilizan'
                ], 400);
            }

            $deleted = DB::table('categorias_maquinas')
                ->where('id_categoria', $id)
                ->delete();

            if (!$deleted) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Categoría eliminada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============= MÉTODOS PRIVADOS DE APOYO =============

    /**
     * Método privado para obtener y procesar datos de máquinas.
     * Esto evita la duplicación de código y la codificación/decodificación JSON innecesaria.
     */
    private function getProcessedMachines(Request $request)
    {
        $faena = $request->get('faena', 'todas');

        // Subquery para obtener la última mantención por máquina
        $latestMantenciones = DB::table('mantenciones')
            ->select('id_maquina', DB::raw('MAX(fecha_mantencion) as latest_fecha_mantencion'))
            ->groupBy('id_maquina');

        // Subquery para obtener el último consumo por equipo
        $latestConsumos = DB::table('consumos')
            ->select('id_equipo', DB::raw('MAX(fecha_consumo) as latest_fecha_consumo'))
            ->groupBy('id_equipo');

        $query = DB::table('maquinas as m')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')

            // Unir con la subquery de la última mantención
            ->leftJoinSub($latestMantenciones, 'lm', function ($join) {
                $join->on('m.id_maquina', '=', 'lm.id_maquina');
            })
            // Ahora unir a la tabla de mantenciones usando la fecha máxima
            ->leftJoin('mantenciones as mt', function ($join) {
                $join->on('m.id_maquina', '=', 'mt.id_maquina')
                    ->on('lm.latest_fecha_mantencion', '=', 'mt.fecha_mantencion');
            })

            // Unir con la subquery del último consumo
            ->leftJoinSub($latestConsumos, 'lc', function ($join) {
                $join->on('m.id_maquina', '=', 'lc.id_equipo');
            })
            // Ahora unir a la tabla de consumos usando la fecha máxima
            ->leftJoin('consumos as c', function ($join) {
                $join->on('m.id_maquina', '=', 'c.id_equipo')
                    ->on('lc.latest_fecha_consumo', '=', 'c.fecha_consumo');
            })
            ->select([
                'm.id_maquina',
                'm.nombre_maquina as equipo',
                'm.patente',
                'cm.nombre_categoria as categoria',
                'cm.tipo_medicion',
                'cm.horas_mantencion as intervalo_mantenimiento',
                'm.estado as estado_operativo',
                // Datos del último mantenimiento
                'mt.fecha_mantencion as ultimo_mantenimiento_fecha',
                'mt.horas_kilometros_actuales as medicion_ultimo_mantenimiento',
                'mt.proxima_mantencion as proximo_mantenimiento_configurado',
                'mt.observaciones as ultimo_mantenimiento_obs',
                // Medición actual desde consumos
                'c.medicion as medicion_actual',
                'c.fecha_consumo as fecha_ultima_medicion'
            ]);

        if ($faena !== 'todas') {
            $query->where('pmf.id_faena', $faena);
        }

        $maquinas = $query->get();

        return $maquinas->map(function ($maquina) {
            return $this->calcularEstadoMaquina($maquina);
        })->sortByDesc('porcentaje_uso');
    }


    /**
     * Calcular estado de una máquina basado en BD existente
     */
    private function calcularEstadoMaquina($maquina)
    {
        $medicionActual = floatval($maquina->medicion_actual ?? 0);
        $intervalo = floatval($maquina->intervalo_mantenimiento ?? 1); // Intervalo por defecto de la categoría
        $medicionUltimoManten = floatval($maquina->medicion_ultimo_mantenimiento ?? 0);
        // 'proximo_mantenimiento_configurado' de la tabla mantenciones es el intervalo que se configuró en ese mantenimiento,
        // si no existe, usa el intervalo por defecto de la categoría.
        $intervaloProximoMantenimiento = floatval($maquina->proximo_mantenimiento_configurado ?? $intervalo);

        // Calcular medición acumulada desde último mantenimiento
        $medicionAcumulada = max(0, $medicionActual - $medicionUltimoManten);

        // Calcular porcentaje de uso
        $porcentajeUso = $intervaloProximoMantenimiento > 0 ? ($medicionAcumulada / $intervaloProximoMantenimiento) * 100 : 0;
        $porcentajeUso = min($porcentajeUso, 100); // Limitar al 100%

        // Horas/km hasta próximo mantenimiento
        $hastaProximo = max(0, $intervaloProximoMantenimiento - $medicionAcumulada);

        // Determinar estado
        $estado = 'normal';
        if ($maquina->estado_operativo === 'en_mantenimiento') {
            $estado = 'en_mantenimiento'; // Priorizar el estado operativo de la máquina
        } elseif ($porcentajeUso >= 100) {
            $estado = 'critico';
        } elseif ($porcentajeUso >= 90) { // Umbral de advertencia
            $estado = 'advertencia';
        }

        // Calcular uso promedio diario (últimos 30 días)
        $usoPromedioDiario = $this->calcularUsoPromedioDiario($maquina->id_maquina);

        // Fecha estimada de mantenimiento
        $fechaEstimada = null;
        if ($usoPromedioDiario > 0 && $hastaProximo > 0) {
            $diasHastaMantenimiento = ceil($hastaProximo / $usoPromedioDiario);
            $fechaEstimada = Carbon::now()->addDays($diasHastaMantenimiento)->format('Y-m-d');
        }

        // Información del último mantenimiento
        $ultimoMantenimiento = null;
        if ($maquina->ultimo_mantenimiento_fecha) {
            $fecha = Carbon::parse($maquina->ultimo_mantenimiento_fecha);
            $ultimoMantenimiento = [
                'fecha' => $fecha->format('d/m/Y H:i:s'), // Añadir hora para más precisión
                'medicion' => $maquina->medicion_ultimo_mantenimiento,
                'intervalo_configurado' => $maquina->proximo_mantenimiento_configurado,
                'observaciones' => $maquina->ultimo_mantenimiento_obs,
                'costo' => $maquina->ultimo_mantenimiento_costo,
                'dias_transcurridos' => $fecha->diffInDays(now())
            ];
            // Inferir tipo de mantenimiento de las observaciones o asignar 'preventivo' por defecto
            if (stripos($maquina->ultimo_mantenimiento_obs, 'correctivo') !== false) {
                $ultimoMantenimiento['tipo'] = 'correctivo';
            } elseif (stripos($maquina->ultimo_mantenimiento_obs, 'mayor') !== false) {
                $ultimoMantenimiento['tipo'] = 'mayor';
            } else {
                $ultimoMantenimiento['tipo'] = 'preventivo';
            }
        }

        return [
            'id_maquina' => $maquina->id_maquina,
            'equipo' => $maquina->equipo ?? $maquina->nombre_maquina,
            'patente' => $maquina->patente,
            'categoria' => $maquina->categoria ?? $maquina->nombre_categoria,
            'tipo_medicion' => $maquina->tipo_medicion,
            'unidad' => $maquina->tipo_medicion === 'Horometro' ? 'h' : 'km',
            'medicion_actual' => $medicionActual,
            'intervalo_mantenimiento' => $intervalo, // Intervalo predeterminado de la categoría
            'porcentaje_uso' => round($porcentajeUso, 1),
            'horas_hasta_proximo' => round($hastaProximo, 1),
            'estado' => $estado,
            'estado_operativo' => $maquina->estado_operativo ?? $maquina->estado,
            'fecha_estimada_mantenimiento' => $fechaEstimada,
            'ultimo_mantenimiento' => $ultimoMantenimiento,
            'puede_realizar_mantenimiento' => ($maquina->estado_operativo ?? $maquina->estado) !== 'en_mantenimiento',

            // Campos adicionales para compatibilidad con HorasTrabajoChart o similar
            'horasProgramadas' => $intervaloProximoMantenimiento, // Cantidad del intervalo
            'horasActuales' => $medicionAcumulada, // Medición acumulada desde el último mant.
            'diferencia' => $hastaProximo
        ];
    }

    /**
     * Calcular uso promedio diario basado en consumos.
     * Implementación básica, puedes expandirla.
     */
    private function calcularUsoPromedioDiario($idMaquina, $dias = 30)
    {
        $consumos = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->where('fecha_consumo', '>=', Carbon::now()->subDays($dias))
            ->orderBy('fecha_consumo', 'asc')
            ->get();

        if ($consumos->isEmpty() || $consumos->count() < 2) {
            return 0; // No hay suficientes datos para calcular el promedio
        }

        $primerConsumo = $consumos->first();
        $ultimoConsumo = $consumos->last();

        $diferenciaMedicion = $ultimoConsumo->medicion - $primerConsumo->medicion;
        $diferenciaDias = Carbon::parse($ultimoConsumo->fecha_consumo)->diffInDays(Carbon::parse($primerConsumo->fecha_consumo));

        return $diferenciaDias > 0 ? $diferenciaMedicion / $diferenciaDias : 0;
    }

    /**
     * Calcula la eficiencia general del mantenimiento.
     * Esto es un ejemplo, puedes definir la métrica de eficiencia de acuerdo a tus necesidades.
     * Por ejemplo: (Tiempo Operativo Total / Tiempo Total Disponible) * 100
     */
    private function calcularEficiencia($faena = 'todas', $periodo = 30)
    {
        // Para simplificar, aquí se podría calcular basándose en la cantidad de mantenimientos preventivos vs correctivos,
        // o la reducción de fallas, o el cumplimiento de la programación.
        // Por ahora, devolverá un valor de ejemplo.

        // Simplemente como ejemplo, podrías sumar los costos y dividir por el número de mantenimientos,
        // o considerar el porcentaje de máquinas 'normales'.
        $totalMaquinas = DB::table('maquinas');
        if ($faena !== 'todas') {
            $totalMaquinas->leftJoin('permisos_maquinas_faenas as pmf', 'maquinas.id_maquina', '=', 'pmf.id_maquina')
                ->where('pmf.id_faena', $faena);
        }
        $totalMaquinas = $totalMaquinas->count();

        $maquinasNormales = DB::table('maquinas');
        if ($faena !== 'todas') {
            $maquinasNormales->leftJoin('permisos_maquinas_faenas as pmf', 'maquinas.id_maquina', '=', 'pmf.id_maquina')
                ->where('pmf.id_faena', $faena);
        }
        $maquinasNormales = $maquinasNormales->where('estado', 'operativo')->count(); // Usar estado operativo

        return $totalMaquinas > 0 ? round(($maquinasNormales / $totalMaquinas) * 100, 2) : 0;
    }


    /**
     * Calcula la eficiencia de una máquina específica.
     * Ejemplo: (Tiempo operativo / Tiempo total en el periodo) * 100
     * Requiere un registro más detallado de los estados de la máquina.
     */
    private function calcularEficienciaMaquina($idMaquina, $dias = 30)
    {
        // Este cálculo es complejo y requiere un historial de estados de la máquina (operativo, en_mantenimiento, detenido).
        // Por simplicidad, aquí se devuelve un valor fijo.
        // En una implementación real, podrías tener una tabla de log de estados.
        return 95.5; // Ejemplo: 95.5% de eficiencia
    }


    /**
     * Calcula el tiempo operativo de una máquina en un período.
     * Requiere un sistema de logging de cambios de estado o un cálculo más complejo.
     */
    private function calcularTiempoOperativo($idMaquina, $dias = 30)
    {
        // Implementación de ejemplo, asumiendo un log de cambios de estado.
        // Esto sería un cálculo más avanzado en una BD real.
        // Por ahora, simula que la máquina estuvo operativa la mayoría del tiempo.
        $totalHorasPeriodo = $dias * 24; // Horas totales en el periodo
        $horasEnMantenimiento = DB::table('mantenciones')
            ->where('id_maquina', $idMaquina)
            ->where('fecha_mantencion', '>=', Carbon::now()->subDays($dias))
            ->count() * 8; // Suponiendo 8 horas por mantenimiento

        return max(0, $totalHorasPeriodo - $horasEnMantenimiento);
    }

    /**
     * Calcula la disponibilidad general del parque de máquinas.
     * Disponibilidad = (Máquinas Operativas / Total de Máquinas) * 100
     */
    private function calcularDisponibilidad($maquinasData)
    {
        if (empty($maquinasData)) {
            return 0;
        }

        $totalMaquinas = count($maquinasData);
        $maquinasOperativas = count(array_filter($maquinasData, fn($m) => $m['estado_operativo'] === 'operativo'));

        return round(($maquinasOperativas / $totalMaquinas) * 100, 2);
    }
}
