<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CategoriasChartController extends Controller
{

    /**
     * 🔧 MÉTODO PRINCIPAL: Obtener categorías RESUMIDAS (sin redistribución extra aquí)
     */
    public function obtenerCategoriasResumen(Request $request)
    {
        try {
            // 🔄 PARÁMETROS DE ENTRADA
            $fechaInicio = $request->input('fecha_inicio', $request->input('fecha_desde', Carbon::now()->startOfMonth()->format('Y-m-d')));
            $fechaFin = $request->input('fecha_fin', $request->input('fecha_hasta', Carbon::now()->format('Y-m-d')));
            $idFaena = $request->input('id_faena', $request->input('faena_id'));

            $incluirRedistribuciones = filter_var($request->input('incluir_redistribucion', true), FILTER_VALIDATE_BOOLEAN);
            $tipoChart = $request->input('tipo_chart', 'default');

            // 🔑 Convertir fechas
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            // 📊 LOG DEBUG
            Log::info('📊 obtenerCategoriasResumen', [
                'incluir_redistribuciones' => $incluirRedistribuciones,
                'tipo_chart' => $tipoChart,
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaFin->format('Y-m-d'),
                'id_faena' => $idFaena
            ]);

            // 🔧 DESCRIPCIÓN DEL PERÍODO ACTUAL
            $descripcionPeriodoActual = $fechaInicio->format('d-m-Y') . ' al ' . $fechaFin->format('d-m-Y');

            // 🆕 PERÍODO ANTERIOR
            $periodoAnterior = $this->calcularPeriodoAnteriorFormatoDDMMYYYY(
                $fechaInicio->format('Y-m-d'),
                $fechaFin->format('Y-m-d')
            );

            $fechaInicioAnterior = Carbon::parse($periodoAnterior['fechaDesde'])->startOfDay();
            $fechaFinAnterior = Carbon::parse($periodoAnterior['fechaHasta'])->endOfDay();

            // 📊 OBTENER DATOS (YA VIENEN CON O SIN REDISTRIBUCIÓN)
            $resultadoActual = $this->obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena, $incluirRedistribuciones);
            $resultadoAnterior = $this->obtenerDatosCategorias($fechaInicioAnterior, $fechaFinAnterior, $idFaena, $incluirRedistribuciones);

            // 🔧 RESPUESTA FINAL
            return response()->json([
                'success' => true,
                'data' => [
                    'categoriasIniciales' => $resultadoActual['data']['categoriasIniciales'],
                    'categoriasFinales'   => $resultadoActual['data']['categoriasFinales'],
                    'descripcionPeriodoActual' => $descripcionPeriodoActual,
                    'periodoAnterior' => [
                        'categoriasIniciales' => $resultadoAnterior['data']['categoriasIniciales'],
                        'categoriasFinales'   => $resultadoAnterior['data']['categoriasFinales'],
                        'fechas' => [
                            'desde' => $periodoAnterior['fechaDesde'],
                            'hasta' => $periodoAnterior['fechaHasta']
                        ],
                        'descripcion' => $periodoAnterior['descripcionDDMMYYYY'],
                        'metadatos'   => $periodoAnterior['metadatos'] ?? []
                    ]
                ],
                'resumen' => array_merge($resultadoActual['metadata'], [
                    'periodo_actual' => [
                        'descripcion' => $descripcionPeriodoActual,
                        'fechas'      => $descripcionPeriodoActual
                    ],
                    'periodo_anterior' => [
                        'descripcion' => $periodoAnterior['descripcionDDMMYYYY'],
                        'fechas'      => $periodoAnterior['descripcionDDMMYYYY']
                    ],
                    'control_redistribuciones' => [
                        'activas'     => $incluirRedistribuciones,
                        'tipo_chart'  => $tipoChart,
                        'metodo_usado' => $incluirRedistribuciones ? 'con_redistribucion' : 'sin_redistribucion'
                    ]
                ]),
                'categorias' => [
                    'categoriasIniciales' => $resultadoActual['data']['categoriasIniciales'],
                    'categoriasFinales'   => $resultadoActual['data']['categoriasFinales']
                ],
                'method_used' => $request->method(),
                'processing_applied' => true,
                'periods_calculated' => true,
                'date_format' => 'DD-MM-YYYY',
                'parameters_received' => [
                    'fecha_inicio' => $fechaInicio->toDateString(),
                    'fecha_fin'    => $fechaFin->toDateString(),
                    'id_faena'     => $idFaena,
                    'incluir_redistribuciones' => $incluirRedistribuciones,
                    'tipo_chart'   => $tipoChart,
                    'periodo_actual' => $descripcionPeriodoActual,
                    'periodo_anterior_calculado' => $periodoAnterior['descripcionDDMMYYYY']
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error en obtenerCategoriasResumen', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías: ' . $e->getMessage(),
                'method_used' => $request->method()
            ], 500);
        }
    }


    private function obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena = null, $incluirRedistribucion = true)
    {
        // ===============================================
        // 🎯 PASO 1: OBTENER DATOS BASE
        // ===============================================
        $query = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0);

        if ($idFaena) {
            $query->where('c.id_faena', $idFaena);
        }

        $resultados = $query->select([
            'cm.id_categoria as id',
            'cm.nombre_categoria as name',
            'cm.nombre_categoria as nombre',
            'cm.tipo_medicion',
            DB::raw('SUM(c.litros_consumidos) as value'),
            DB::raw('COUNT(DISTINCT m.id_maquina) as maquinas_count'),
            DB::raw('COUNT(DISTINCT CASE WHEN mi.id_maquina IS NOT NULL THEN m.id_maquina END) as maquinas_internas'),
            DB::raw('COUNT(DISTINCT CASE WHEN mi.id_maquina IS NULL THEN m.id_maquina END) as maquinas_externas'),
            DB::raw('COUNT(c.id_consumo) as total_registros')
        ])
            ->groupBy('cm.id_categoria', 'cm.nombre_categoria', 'cm.tipo_medicion')
            ->get();

        $categoriasBase = collect($resultados)->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name ?? 'Sin categoría',
                'nombre' => $item->nombre ?? 'Sin categoría',
                'value' => round(($item->value ?? 0), 2),
                'maquinas_count' => $item->maquinas_count ?? 0,
                'maquinas_internas' => $item->maquinas_internas ?? 0,
                'maquinas_externas' => $item->maquinas_externas ?? 0,
                'tipo_medicion' => $item->tipo_medicion ?? null,
                'promedio_consumo' => ($item->maquinas_count ?? 0) > 0
                    ? round(($item->value ?? 0) / ($item->maquinas_count ?? 1), 2)
                    : 0,
                'total_registros' => $item->total_registros ?? 0,
                'originalData' => (array) $item
            ];
        });

        // ===============================================
        // 🎯 PASO 2: APLICAR REDISTRIBUCIÓN SEGÚN PARÁMETRO
        // ===============================================
        if ($incluirRedistribucion) {
            Log::info('📊 Generando categorías CON redistribución (camionetas + camiones)', [
                'incluir_redistribucion' => true,
                'total_categorias_base' => $categoriasBase->count()
            ]);

            // 🚙 Camionetas iniciales (todas)
            $categoriasIniciales = $this->aplicarRedistribucionCamionetas($categoriasBase, $fechaInicio, $fechaFin, $idFaena, false);

            // 🚛 Camiones iniciales
            $categoriasIniciales = $this->aplicarRedistribucionCamionTolva(collect($categoriasIniciales), $fechaInicio, $fechaFin, $idFaena, false);

            // ===== FINALES: aplicar exclusión de Microbus y Camion Tolva =====
            $categoriasFiltradas = collect($categoriasBase)->filter(function ($categoria) {
                $excluir = ['Microbus', 'Camion Tolva'];
                foreach ($excluir as $nombre) {
                    if (stripos($categoria['name'], $nombre) !== false) {
                        return false;
                    }
                }
                return true;
            });

            // 🚙 Camionetas finales (solo categorías filtradas)
            $categoriasFinales = $this->aplicarRedistribucionCamionetas($categoriasFiltradas, $fechaInicio, $fechaFin, $idFaena, true);

            // 🚛 Camiones finales
            $categoriasFinales = $this->aplicarRedistribucionCamionTolva(collect($categoriasFinales), $fechaInicio, $fechaFin, $idFaena, true);
        } else {
            $categoriasBaseProcesadas = $categoriasBase
                ->filter(fn($item) => $item['value'] > 0)
                ->sortByDesc('value')
                ->values()
                ->toArray();

            $categoriasIniciales = $categoriasBaseProcesadas;
            $categoriasFinales = $categoriasBaseProcesadas;
        }

        // ===============================================
        // 🎯 RESPUESTA
        // ===============================================
        return [
            'data' => [
                'categoriasIniciales' => $categoriasIniciales,
                'categoriasFinales'   => $categoriasFinales
            ],
            'metadata' => [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaFin->format('Y-m-d'),
                'total_categorias_iniciales' => count($categoriasIniciales),
                'total_categorias_finales' => count($categoriasFinales),
                'redistribucion_aplicada' => $incluirRedistribucion,
                'tipo_procesamiento' => $incluirRedistribucion
                    ? 'con_redistribucion_camionetas_y_camiones'
                    : 'datos_directos',
                'faena_filtro' => $idFaena
            ]
        ];
    }



    private function aplicarRedistribucionCamionetas($categorias, $fechaInicio, $fechaFin, $idFaena, $aplicarExclusiones = false)
    {

        // 2.2 - OBTENER REDISTRIBUCIÓN DE CAMIONETAS (lógica existente)
        $consumoCamionetasPorFaena = $this->obtenerConsumoCamionetasTodasFaenas($fechaInicio, $fechaFin);
        $camionetasRedistribuidas = $this->calcularRedistribucionCamionetasConConfiguracion($consumoCamionetasPorFaena, $idFaena);

        // 2.3 - AGRUPAR CAMIONETAS (lógica existente)
        $categoriasAgrupadas = [];
        $camionetasEncontradas = [];

        foreach ($categorias as $categoria) {
            $nombreLimpio = strtolower(trim($categoria['name']));
            $esCamioneta = strpos($nombreLimpio, 'camioneta') !== false ||
                strpos($nombreLimpio, 'camionetas') !== false ||
                $nombreLimpio === 'camioneta';

            if ($esCamioneta) {
                $camionetasEncontradas[] = $categoria;
            } else {
                $categoriasAgrupadas[] = $categoria;
            }
        }

        // 2.4 - CREAR CATEGORÍA CAMIONETAS REDISTRIBUIDA (lógica existente)
        $valorFinalCamionetas = $camionetasRedistribuidas['valor_final'];
        $infoRedistribucion = $camionetasRedistribuidas['info_redistribucion'];

        if (!empty($camionetasEncontradas)) {
            $totalCamionetas = collect($camionetasEncontradas)->sum('value');
            $totalMaquinas = collect($camionetasEncontradas)->sum('maquinas_count');
            $totalInternas = collect($camionetasEncontradas)->sum('maquinas_internas');
            $totalExternas = collect($camionetasEncontradas)->sum('maquinas_externas');
            $totalRegistros = collect($camionetasEncontradas)->sum('total_registros');
            $categoriasOriginales = collect($camionetasEncontradas)->pluck('name')->toArray();
        } else {
            $totalCamionetas = 0;
            $totalMaquinas = 0;
            $totalInternas = 0;
            $totalExternas = 0;
            $totalRegistros = 0;
            $categoriasOriginales = [];
        }

        // 2.5 - CREAR Y AGREGAR CAMIONETAS REDISTRIBUIDAS
        if ($valorFinalCamionetas > 0 || $infoRedistribucion['tiene_redistribucion']) {
            $camionetasAgrupadas = [
                'id' => 999,
                'name' => 'Camionetas',
                'nombre' => 'Camionetas',
                'value' => round($valorFinalCamionetas, 2),
                'maquinas_count' => $totalMaquinas,
                'maquinas_internas' => $totalInternas,
                'maquinas_externas' => $totalExternas,
                'tipo_medicion' => 'Kilometraje',
                'promedio_consumo' => $totalMaquinas > 0 ? round($valorFinalCamionetas / $totalMaquinas, 2) : 0,
                'total_registros' => $totalRegistros,
                'categorias_originales' => $categoriasOriginales,
                'redistribucion_camionetas' => $infoRedistribucion,
    'factor_aplicado' => $infoRedistribucion['factor_aplicado'] ?? 0.5,
    'valor_original' => ($infoRedistribucion['tipo'] ?? '') === 'total_sistema' ? $valorFinalCamionetas : $totalCamionetas
            ];

            $categoriasAgrupadas[] = $camionetasAgrupadas;
        }

        // 2.6 - FILTRAR Y ORDENAR RESULTADO FINAL
        return collect($categoriasAgrupadas)
            ->filter(function ($item) {
                return $item['value'] > 0;
            })
            ->sortByDesc('value')
            ->values()
            ->toArray();
    }


    /**
     * 🏭 MÉTODO AUXILIAR: Configuración de faenas y porcentajes de participación
     * Centraliza la configuración para fácil mantenimiento
     */
    /**
     * 🔧 MÉTODO CORREGIDO: Configuración de faenas con debug
     */
    private function obtenerConfiguracionFaenas()
    {
        $configuracion = [
            1 => ['nombre' => 'Cabildo', 'porcentaje' => 30],
            7 => ['nombre' => 'La Cruz', 'porcentaje' => 15],
            3 => ['nombre' => 'Catemu', 'porcentaje' => 15],
            4 => ['nombre' => 'Til Til', 'porcentaje' => 20],
            8 => ['nombre' => 'Rungue', 'porcentaje' => 20]
        ];

        // Debug: Log para verificar la configuración
        Log::info('🏭 CONFIGURACIÓN FAENAS:', $configuracion);

        return $configuracion;
    }

    /**
     * 🔧 MÉTODO AUXILIAR MEJORADO: Obtener nombre de faena con configuración
     */
    private function obtenerNombreFaenaConConfiguracion($idFaena)
    {
        $configuracion = $this->obtenerConfiguracionFaenas();

        if (isset($configuracion[$idFaena])) {
            return $configuracion[$idFaena]['nombre'];
        }

        // Fallback a base de datos si no está en configuración
        $faena = DB::table('faenas')->where('id_faena', $idFaena)->first();
        return $faena ? $faena->ubicacion : "Faena ID: $idFaena";
    }


    /**
     * 🚛 MÉTODO MODIFICADO: Redistribución independiente del consumo propio de la faena
     */
    private function calcularRedistribucionCamionetasConConfiguracion($consumoCamionetasPorFaena, $idFaenaFiltro)
    {
        // Obtener configuración centralizada
        $configuracionFaenas = $this->obtenerConfiguracionFaenas();

        // 🔧 CREAR ARRAY DE PORCENTAJES CON KEYS CORRECTOS
        $porcentajesParticipacion = [];
        foreach ($configuracionFaenas as $idFaena => $config) {
            $porcentajesParticipacion[$idFaena] = $config['porcentaje'];
        }

        $valorFinal = 0;
        $detalleRedistribucion = [];

        // 🎯 CASO 1: Sin filtro de faena - mostrar total redistribuido
        if (!$idFaenaFiltro || $idFaenaFiltro === 'todas') {
            // Si no hay consumo de camionetas en ninguna faena, devolver 0
            if (empty($consumoCamionetasPorFaena)) {
                return [
                    'valor_final' => 0,
                    'info_redistribucion' => [
                        'tiene_redistribucion' => false,
                        'motivo' => 'No hay datos de consumo de camionetas en el sistema',
                        'configuracion_faenas' => $configuracionFaenas
                    ]
                ];
            }

            foreach ($consumoCamionetasPorFaena as $faena) {
                // 50% se queda en la faena original
                $valorFinal += $faena['consumo_total'];
            }

            return [
                'valor_final' => $valorFinal,
                'info_redistribucion' => [
                    'tiene_redistribucion' => true,
                    'tipo' => 'total_sistema',
                    'factor_aplicado' => 0.5,
                    'faenas_procesadas' => count($consumoCamionetasPorFaena),
                    'configuracion_faenas' => $configuracionFaenas
                ]
            ];
        }

        // 🎯 CASO 2: Con filtro de faena específica
        $idFaenaFiltroNum = (int) $idFaenaFiltro;

        // Verificar si la faena filtrada tiene porcentaje definido en configuración
        if (!isset($configuracionFaenas[$idFaenaFiltroNum])) {
            return [
                'valor_final' => 0,
                'info_redistribucion' => [
                    'tiene_redistribucion' => false,
                    'motivo' => "Faena {$idFaenaFiltroNum} no está configurada en el sistema de redistribución",
                    'faenas_configuradas' => array_keys($configuracionFaenas),
                    'configuracion_faenas' => $configuracionFaenas
                ]
            ];
        }

        // 🔧 OBTENER PORCENTAJE DE LA FAENA FILTRADA
        $porcentajeFaenaFiltrada = $porcentajesParticipacion[$idFaenaFiltroNum];

        // 1. 🆕 VALOR PROPIO: Puede ser 0 si la faena no tiene consumo de camionetas
        $valorPropio = 0;
        if (isset($consumoCamionetasPorFaena[$idFaenaFiltroNum])) {
            $valorPropio = $consumoCamionetasPorFaena[$idFaenaFiltroNum]['consumo_total'] * 0.5;
            $valorFinal += $valorPropio;

            $detalleRedistribucion['valor_propio'] = [
                'faena' => $consumoCamionetasPorFaena[$idFaenaFiltroNum]['nombre_faena'],
                'consumo_original' => $consumoCamionetasPorFaena[$idFaenaFiltroNum]['consumo_total'],
                'valor_50_porciento' => $valorPropio
            ];
        } else {
            // 🆕 CASO NUEVO: La faena filtrada no tiene consumo propio de camionetas
            $detalleRedistribucion['valor_propio'] = [
                'faena' => $configuracionFaenas[$idFaenaFiltroNum]['nombre'],
                'consumo_original' => 0,
                'valor_50_porciento' => 0,
                'motivo' => 'La faena no tiene consumo propio de camionetas en este período'
            ];
        }

        // 2. 🆕 REDISTRIBUCIONES: SIEMPRE calcular, independiente del consumo propio
        $redistribucionesRecibidas = [];

        // 🆕 VALIDAR: Si no hay consumo de camionetas en NINGUNA faena, no hay nada que redistribuir
        if (empty($consumoCamionetasPorFaena)) {
            return [
                'valor_final' => $valorPropio, // Solo el valor propio (que será 0)
                'info_redistribucion' => [
                    'tiene_redistribucion' => true,
                    'tipo' => 'faena_especifica_sin_sistema',
                    'faena_filtrada' => [
                        'id' => $idFaenaFiltroNum,
                        'nombre' => $configuracionFaenas[$idFaenaFiltroNum]['nombre'],
                        'porcentaje_participacion' => $porcentajeFaenaFiltrada
                    ],
                    'detalle_calculo' => $detalleRedistribucion,
                    'redistribuciones_recibidas' => [],
                    'configuracion_faenas' => $configuracionFaenas,
                    'motivo_sin_redistribuciones' => 'No hay consumo de camionetas en ninguna faena del sistema'
                ]
            ];
        }

        // 🔧 CALCULAR REDISTRIBUCIONES DE OTRAS FAENAS
        foreach ($consumoCamionetasPorFaena as $idFaenaOrigen => $faenaOrigen) {
            // Procesar todas las faenas EXCEPTO la faena filtrada
            if ($idFaenaOrigen != $idFaenaFiltroNum) {

                // 🔧 CALCULAR TOTAL DE PORCENTAJES SIN la faena origen (que redistribuye)
                $porcentajesSinFaenaOrigen = $porcentajesParticipacion;
                unset($porcentajesSinFaenaOrigen[$idFaenaOrigen]); // Quitar la faena que redistribuye
                $totalPorcentajeParaDistribuir = array_sum($porcentajesSinFaenaOrigen);

                // 50% de la faena origen se redistribuye
                $montoARedistribuir = $faenaOrigen['consumo_total'] * 0.5;

                if ($totalPorcentajeParaDistribuir > 0) {
                    // ✅ LA FAENA FILTRADA SIEMPRE RECIBE SU PORCENTAJE CORRESPONDIENTE
                    $valorRecibido = $montoARedistribuir * ($porcentajeFaenaFiltrada / $totalPorcentajeParaDistribuir);
                    $valorFinal += $valorRecibido;

                    $redistribucionesRecibidas[] = [
                        'faena_origen' => $faenaOrigen['nombre_faena'],
                        'faena_origen_id' => $idFaenaOrigen,
                        'consumo_origen' => $faenaOrigen['consumo_total'],
                        'monto_redistribuido' => $montoARedistribuir,
                        'porcentaje_faena_filtrada' => $porcentajeFaenaFiltrada,
                        'porcentaje_faena_origen' => $porcentajesParticipacion[$idFaenaOrigen] ?? 0,
                        'total_porcentaje_distribucion' => $totalPorcentajeParaDistribuir,
                        'porcentaje_recibido' => round($porcentajeFaenaFiltrada / $totalPorcentajeParaDistribuir * 100, 4),
                        'valor_recibido' => round($valorRecibido, 4),
                        'calculo_detallado' => [
                            'formula' => "{$porcentajeFaenaFiltrada} / {$totalPorcentajeParaDistribuir} = " . round($porcentajeFaenaFiltrada / $totalPorcentajeParaDistribuir, 4),
                            'explicacion' => "Faena filtrada ({$configuracionFaenas[$idFaenaFiltroNum]['nombre']}) recibe {$porcentajeFaenaFiltrada}% del 50% redistribuido por {$faenaOrigen['nombre_faena']}",
                            'porcentajes_sin_origen' => $porcentajesSinFaenaOrigen
                        ]
                    ];
                }
            }
        }

        return [
            'valor_final' => $valorFinal,
            'info_redistribucion' => [
                'tiene_redistribucion' => true,
                'tipo' => 'faena_especifica',
                'faena_filtrada' => [
                    'id' => $idFaenaFiltroNum,
                    'nombre' => $configuracionFaenas[$idFaenaFiltroNum]['nombre'],
                    'porcentaje_participacion' => $porcentajeFaenaFiltrada
                ],
                'detalle_calculo' => $detalleRedistribucion,
                'redistribuciones_recibidas' => $redistribucionesRecibidas,
                'configuracion_faenas' => $configuracionFaenas,
                'formula_aplicada' => '50% propio (puede ser 0) + redistribuciones de otras faenas según porcentaje',
                'faenas_que_redistribuyen' => count($redistribucionesRecibidas),
                'consumo_propio_faena' => isset($consumoCamionetasPorFaena[$idFaenaFiltroNum])
                    ? $consumoCamionetasPorFaena[$idFaenaFiltroNum]['consumo_total']
                    : 0
            ]
        ];
    }

    /**
     * 🚛 MÉTODO CORREGIDO: Aplicar redistribución SOLO a Camion Tolva
     */
    private function aplicarRedistribucionCamionTolva($data, $fechaInicio, $fechaFin, $idFaena, $request, $esPeriodoAnterior = false)
    {
        try {
            // Convertir a collection si no lo es
            $dataCollection = collect($data);

            // Buscar si existe la categoría Camion Tolva (ID: 7)
            $indiceCamionTolva = $dataCollection->search(function ($item) {
                return ($item['id'] ?? null) == 7; // ID de Camion Tolva
            });

            if ($indiceCamionTolva === false) {
                // No hay Camion Tolva, devolver data original sin cambios
                $infoRedistribucion = [
                    'tiene_redistribucion' => false,
                    'motivo' => 'No se encontró categoría Camion Tolva en los datos'
                ];

                // Guardar info según el período
                if ($esPeriodoAnterior) {
                    $this->redistribucionAnteriorInfo = $infoRedistribucion;
                } else {
                    $this->ultimaRedistribucionInfo = $infoRedistribucion;
                }

                return $data;
            }

            // Obtener datos originales de Camion Tolva
            $camionTolvaOriginal = $dataCollection[$indiceCamionTolva];

            // Obtener distribución de viajes
            $datosDistribucion = $this->obtenerDistribucionViajesCamionTolva($fechaInicio, $fechaFin, $idFaena, $request);

            if (!$datosDistribucion['tiene_distribucion']) {
                // No hay distribución, mantener original
                $infoRedistribucion = $datosDistribucion['info'];

                // Guardar info según el período
                if ($esPeriodoAnterior) {
                    $this->redistribucionAnteriorInfo = $infoRedistribucion;
                } else {
                    $this->ultimaRedistribucionInfo = $infoRedistribucion;
                }

                return $data;
            }

            // Remover Camion Tolva original de los datos
            $dataSinCamionTolva = $dataCollection->reject(function ($item) {
                return ($item['id'] ?? null) == 7;
            });

            // Agregar las categorías redistribuidas
            foreach ($datosDistribucion['categorias_redistribuidas'] as $categoriaRedistribuida) {
                $dataSinCamionTolva->push($categoriaRedistribuida);
            }

            // Guardar info de redistribución según el período
            $infoRedistribucion = array_merge($datosDistribucion['info'], [
                'periodo' => $esPeriodoAnterior ? 'anterior' : 'actual',
                'fechas' => [
                    'inicio' => $fechaInicio->format('Y-m-d'),
                    'fin' => $fechaFin->format('Y-m-d')
                ]
            ]);

            if ($esPeriodoAnterior) {
                $this->redistribucionAnteriorInfo = $infoRedistribucion;
            } else {
                $this->ultimaRedistribucionInfo = $infoRedistribucion;
            }

            return $dataSinCamionTolva->values()->toArray();
        } catch (\Exception $e) {
            // En caso de error, devolver data original
            $infoRedistribucion = [
                'tiene_redistribucion' => false,
                'motivo' => 'Error en redistribución: ' . $e->getMessage(),
                'periodo' => $esPeriodoAnterior ? 'anterior' : 'actual'
            ];

            // Guardar info según el período
            if ($esPeriodoAnterior) {
                $this->redistribucionAnteriorInfo = $infoRedistribucion;
            } else {
                $this->ultimaRedistribucionInfo = $infoRedistribucion;
            }

            return $data;
        }
    }

/**
 * 🔧 MÉTODO CORREGIDO: Crear distribución basada en consumos reales por faena
 * cuando no hay datos de viajes - CON LÓGICA PARA FAENAS_OPERADAS = 1
 */
private function crearDistribucionSinViajes($consumosPorCamion, $fechaInicio, $fechaFin, $idFaena = null)
{
    Log::info('🚫 Creando distribución SIN datos de viajes - Método FINAL', [
        'faena_filtro' => $idFaena,
        'faena_filtro_tipo' => gettype($idFaena),
        'camiones_input' => count($consumosPorCamion)
    ]);

    // 🎯 VERIFICAR SI HAY FILTRO ACTIVO
    $tieneFiltroPorFaena = $idFaena && $idFaena !== 'todas' && $idFaena !== null && $idFaena !== '';
    
    Log::info('🔍 Verificación de filtro:', [
        'id_faena_filtro' => $idFaena,
        'tiene_filtro_por_faena' => $tieneFiltroPorFaena,
        'condiciones' => [
            'no_null' => $idFaena !== null,
            'no_empty' => $idFaena !== '',
            'no_todas' => $idFaena !== 'todas'
        ]
    ]);

    // 1️⃣ PRIMERA CONSULTA: Obtener TODOS los consumos por faena (sin filtro) 
    $todosLosConsumosPorFaena = $this->obtenerConsumosRealesPorFaenaYCamion($fechaInicio, $fechaFin, $consumosPorCamion, null);
    
    if (empty($todosLosConsumosPorFaena)) {
        Log::warning('⚠️ No se encontraron consumos reales por faena, usando distribución por defecto');
        return $this->crearDistribucionSinViajesFallback($consumosPorCamion);
    }

    // 2️⃣ SEGUNDA CONSULTA: Solo si hay filtro activo
    $consumosParaMostrar = $tieneFiltroPorFaena 
        ? $this->obtenerConsumosRealesPorFaenaYCamion($fechaInicio, $fechaFin, $consumosPorCamion, $idFaena)
        : $todosLosConsumosPorFaena;

    // 3️⃣ Crear mapas para acceso rápido
    $consumosOriginalesPorCamion = collect($consumosPorCamion)->keyBy('id_maquina');
    
    // Mapas de TODOS los datos (sin filtro)
    $todosConsumosAgrupados = collect($todosLosConsumosPorFaena)->groupBy('id_maquina');
    $totalRealPorCamion = $todosConsumosAgrupados->mapWithKeys(function($consumos, $idCamion) use ($consumosOriginalesPorCamion) {
        $datosOriginales = $consumosOriginalesPorCamion->get($idCamion);
        $totalRealCalculado = $consumos->sum('litros_consumidos');
        $faenasOperadas = $consumos->count();
        $consumoTotalOriginal = $datosOriginales ? $datosOriginales['consumo_litros'] : $totalRealCalculado;
        
        // 🎯 LÓGICA ESPECIAL: Si solo opera en 1 faena, usar el consumo total original
        $totalParaCalculo = $faenasOperadas == 1 ? $consumoTotalOriginal : $totalRealCalculado;
        
        return [$idCamion => [
            'total_real_calculado' => $totalRealCalculado,
            'total_para_calculo' => $totalParaCalculo, // ← ESTE es el que se usa para porcentajes
            'consumo_total_original' => $consumoTotalOriginal,
            'faenas_operadas' => $faenasOperadas,
            'faenas_ids' => $consumos->pluck('id_faena')->unique()->values()->toArray(),
            'usa_total_original' => $faenasOperadas == 1
        ]];
    });

    // Datos para mostrar (con filtro si aplica)
    $consumosParaMostrarAgrupados = collect($consumosParaMostrar)->groupBy('id_maquina');

    $distribucionPorFaena = [];
    $consumoTotalRedistribuido = 0;

    Log::info('📊 Resumen de datos obtenidos FINAL:', [
        'total_camiones_con_datos' => $totalRealPorCamion->count(),
        'camiones_para_mostrar' => $consumosParaMostrarAgrupados->count(),
        'faena_filtro' => $idFaena,
        'tiene_filtro_activo' => $tieneFiltroPorFaena,
        'consultas_realizadas' => $tieneFiltroPorFaena ? 2 : 1,
        'detalle_por_camion' => $totalRealPorCamion->map(function($data, $idCamion) {
            return [
                'total_real_calculado' => $data['total_real_calculado'],
                'total_para_calculo' => $data['total_para_calculo'],
                'consumo_total_original' => $data['consumo_total_original'],
                'faenas_operadas' => $data['faenas_operadas'],
                'usa_total_original' => $data['usa_total_original'],
                'faenas' => $data['faenas_ids']
            ];
        })
    ]);

    // 4️⃣ Procesar cada camión usando datos filtrados pero con información completa
    foreach ($consumosParaMostrarAgrupados as $idCamion => $consumosCamionParaMostrar) {
        // 🎯 OBTENER DATOS ORIGINALES DEL CAMIÓN
        $datosOriginales = $consumosOriginalesPorCamion->get($idCamion);
        if (!$datosOriginales) {
            Log::warning("⚠️ No se encontraron datos originales para camión {$idCamion}");
            continue;
        }

        $consumoTotalOriginalCamion = $datosOriginales['consumo_litros'];
        $nombreCamion = $datosOriginales['nombre_maquina'];
        $patenteCamion = $datosOriginales['patente'];
        
        // 🎯 OBTENER INFORMACIÓN COMPLETA del camión (sin filtrar)
        $infoCompletaCamion = $totalRealPorCamion->get($idCamion, [
            'total_real_calculado' => 0,
            'total_para_calculo' => 0,
            'consumo_total_original' => 0, 
            'faenas_operadas' => 0,
            'faenas_ids' => [],
            'usa_total_original' => false
        ]);
        
        Log::info("🚛 Procesando camión {$idCamion} FINAL", [
            'nombre' => $nombreCamion,
            'patente' => $patenteCamion,
            'consumo_total_original' => $consumoTotalOriginalCamion,
            'total_real_calculado' => $infoCompletaCamion['total_real_calculado'],
            'total_para_calculo' => $infoCompletaCamion['total_para_calculo'],
            'faenas_operadas_reales' => $infoCompletaCamion['faenas_operadas'],
            'usa_total_original' => $infoCompletaCamion['usa_total_original'],
            'faenas_ids' => $infoCompletaCamion['faenas_ids'],
            'faenas_para_mostrar' => $consumosCamionParaMostrar->count()
        ]);

        // 5️⃣ Distribuir por cada faena que se va a mostrar (filtrada o todas)
        foreach ($consumosCamionParaMostrar as $consumoFaena) {
            $idFaena = $consumoFaena->id_faena;
            $nombreFaena = $consumoFaena->nombre_faena;
            $consumoRealFaena = $consumoFaena->litros_consumidos;
            
            // 🎯 CÁLCULO CORREGIDO DEL PORCENTAJE Y CONSUMO ASIGNADO
            $porcentajeDistribucion = $infoCompletaCamion['faenas_operadas'] == 1 ? 100 : 
                ($infoCompletaCamion['total_para_calculo'] > 0 ? 
                    ($consumoRealFaena / $infoCompletaCamion['total_para_calculo']) * 100 : 0);
            
            // 🎯 CONSUMO ASIGNADO CORREGIDO:
            // Si solo opera en 1 faena → usar total_para_calculo completo
            // Si opera en múltiples faenas → usar consumo real de la faena
            $consumoAsignado = $infoCompletaCamion['faenas_operadas'] == 1 
                ? $infoCompletaCamion['total_para_calculo']  // ← 772L para camión 8
                : $consumoRealFaena;                         // ← 470L y 1020L para camión 9
            
            // Inicializar faena si no existe
            if (!isset($distribucionPorFaena[$idFaena])) {
                $distribucionPorFaena[$idFaena] = [
                    'faena_id' => $idFaena,
                    'faena_nombre' => $nombreFaena,
                    'consumo_asignado' => 0,
                    'total_viajes' => 0,
                    'total_kilometros' => 0,
                    'maquinas_operando' => [],
                    'camiones_detalle' => []
                ];
            }

            // Acumular datos
            $distribucionPorFaena[$idFaena]['consumo_asignado'] += $consumoAsignado;
            $consumoTotalRedistribuido += $consumoAsignado;

            // Agregar detalle del camión
            $distribucionPorFaena[$idFaena]['camiones_detalle'][] = [
                'id_camion' => $idCamion,
                'nombre_camion' => $nombreCamion,
                'patente' => $patenteCamion,
                'consumo_asignado' => round($consumoAsignado, 2),
                'viajes' => 0, // Sin datos de viajes
                'kilometros' => 0, // Sin datos de viajes
                'porcentaje' => round($porcentajeDistribucion, 2),
                'motivo' => 'Distribución basada en consumo real por faena (sin datos de viajes)',
                'consumo_real_faena' => round($consumoRealFaena, 2),
                'consumo_total_camion' => $consumoTotalOriginalCamion,
                'total_real_calculado' => $infoCompletaCamion['total_real_calculado'],
                'total_para_calculo' => $infoCompletaCamion['total_para_calculo'], // ← Para debugging
                'faenas_operadas' => $infoCompletaCamion['faenas_operadas'],
                'todas_faenas_ids' => $infoCompletaCamion['faenas_ids'],
                'usa_total_original' => $infoCompletaCamion['usa_total_original'] // ← Para debugging
            ];

            // Agregar camión a lista de operando
            if (!in_array($idCamion, $distribucionPorFaena[$idFaena]['maquinas_operando'])) {
                $distribucionPorFaena[$idFaena]['maquinas_operando'][] = $idCamion;
            }

            Log::info("✅ Camión {$idCamion} distribuido en faena {$idFaena} FINAL", [
                'consumo_real_faena' => $consumoRealFaena,
                'total_para_calculo' => $infoCompletaCamion['total_para_calculo'],
                'porcentaje' => $porcentajeDistribucion,
                'faenas_operadas_reales' => $infoCompletaCamion['faenas_operadas'],
                'usa_total_original' => $infoCompletaCamion['usa_total_original']
            ]);
        }
    }

    // 6️⃣ Convertir maquinas_operando a count
    foreach ($distribucionPorFaena as &$faena) {
        $faena['maquinas_operando'] = count($faena['maquinas_operando']);
    }

    Log::info('✅ Distribución SIN viajes completada FINAL', [
        'faenas_con_distribucion' => count($distribucionPorFaena),
        'consumo_total_redistribuido' => $consumoTotalRedistribuido,
        'metodo' => 'consumo_real_por_faena_v3',
        'faena_filtrada' => $idFaena,
        'tiene_filtro_activo' => $tieneFiltroPorFaena,
        'faenas_mostradas' => array_keys($distribucionPorFaena)
    ]);

    // 🎯 VALOR FINAL: Si hay filtro, usar solo el consumo de esa faena
    $valorFinalCategoria = $tieneFiltroPorFaena && count($distribucionPorFaena) == 1 
        ? array_values($distribucionPorFaena)[0]['consumo_asignado']  // ← Solo la faena filtrada
        : $consumoTotalRedistribuido;                                // ← Suma total sin filtro

    Log::info('🎯 Valor final calculado para categoría', [
        'tiene_filtro_activo' => $tieneFiltroPorFaena,
        'faenas_en_resultado' => count($distribucionPorFaena),
        'consumo_total_redistribuido' => $consumoTotalRedistribuido,
        'valor_final_categoria' => $valorFinalCategoria,
        'logica_aplicada' => $tieneFiltroPorFaena && count($distribucionPorFaena) == 1 
            ? 'faena_especifica' : 'suma_total'
    ]);

    return [
        'tiene_distribucion' => true,
        'categorias_redistribuidas' => [[
            'id' => 7,
            'name' => 'Camion Tolva',
            'nombre' => 'Camion Tolva',
            'value' => round($valorFinalCategoria, 2), // ← AHORA usa el valor correcto
            'redistribucion_camion_tolva' => [
                'tiene_redistribucion' => true,
                'metodo_redistribucion' => 'consumo_real_por_faena_sin_viajes_v3',
                'motivo_redistribucion' => 'Distribución basada en consumos reales por faena (sin datos de viajes)',
                'distribucion_por_faena' => array_values($distribucionPorFaena),
                'faena_filtrada' => $idFaena, // ← Pasar el valor original
                'info_debug' => [
                    'consultas_realizadas' => $tieneFiltroPorFaena ? 2 : 1,
                    'filtro_aplicado' => $tieneFiltroPorFaena,
                    'filtro_valor' => $idFaena,
                    'filtro_tipo' => gettype($idFaena),
                    'camiones_procesados' => $totalRealPorCamion->count(),
                    'consumo_total_todas_faenas' => $consumoTotalRedistribuido,
                    'valor_final_usado' => $valorFinalCategoria
                ]
            ]
        ]],
        'info' => [
            'tiene_redistribucion' => true,
            'metodo' => 'consumo_real_por_faena_sin_viajes_v3',
            'motivo' => 'Distribución proporcional basada en consumos reales por faena',
            'faena_filtrada' => $idFaena
        ]
    ];
}

/**
 * 🔍 MÉTODO CORREGIDO: Obtener consumos reales por faena y camión desde tabla consumos
 * Usado para camiones SIN viajes en la nueva lógica mixta
 */
private function obtenerConsumosRealesPorFaenaYCamion($fechaInicio, $fechaFin, $consumosPorCamion, $idFaena = null)
{
    $idsCamiones = collect($consumosPorCamion)->pluck('id_maquina')->toArray();
    
    if (empty($idsCamiones)) {
        return [];
    }

    Log::info('🔍 Obteniendo consumos reales por faena y camión desde tabla consumos', [
        'fecha_inicio' => $fechaInicio->format('Y-m-d'),
        'fecha_fin' => $fechaFin->format('Y-m-d'),
        'camiones' => $idsCamiones,
        'faena_filtro' => $idFaena
    ]);

    try {
        // 🎯 CONSULTA CORREGIDA: Usar tabla consumos con estructura correcta
        $query = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->where('m.id_categoria', 7) // Solo categoria Camión Tolva
            ->whereBetween('c.fecha_consumo', [
                $fechaInicio->format('Y-m-d'), 
                $fechaFin->format('Y-m-d')
            ])
            ->whereIn('m.id_maquina', $idsCamiones)
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0);

        // 🎯 FILTRO POR FAENA si se especifica (pero para lógica mixta normalmente será null)
        if ($idFaena && $idFaena !== 'todas') {
            $query->where('c.id_faena', $idFaena);
            Log::info("🎯 Aplicando filtro por faena: {$idFaena}");
        }

        $consumosReales = $query
            ->select([
                'm.id_maquina',
                'c.id_faena',
                'f.ubicacion as nombre_faena',
                DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_camion'),
                DB::raw('COALESCE(mi.patente, m.patente) as patente_camion'),
                DB::raw('SUM(c.litros_consumidos) as litros_consumidos'),
                DB::raw('COUNT(c.id_consumo) as total_registros_faena')
            ])
            ->groupBy([
                'm.id_maquina', 
                'c.id_faena', 
                'f.ubicacion',
                'mi.nombre',
                'm.nombre_maquina',
                'mi.patente',
                'm.patente'
            ])
            ->orderBy('m.id_maquina')
            ->orderBy('c.id_faena')
            ->get();

        $resultadosArray = $consumosReales->toArray();

        Log::info('✅ Consumos reales obtenidos', [
            'total_registros' => count($resultadosArray),
            'camiones_encontrados' => collect($resultadosArray)->pluck('id_maquina')->unique()->count(),
            'faenas_encontradas' => collect($resultadosArray)->pluck('id_faena')->unique()->count(),
            'detalle_por_camion' => collect($resultadosArray)->groupBy('id_maquina')->map(function ($items, $idCamion) {
                return [
                    'camion' => $idCamion,
                    'faenas' => $items->pluck('id_faena')->toArray(),
                    'total_litros' => $items->sum('litros_consumidos')
                ];
            })->toArray()
        ]);

        return $resultadosArray;

    } catch (\Exception $e) {
        Log::error("❌ Error obteniendo consumos reales por faena y camión", [
            'camiones' => $idsCamiones,
            'faena_filtro' => $idFaena,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return [];
    }
}

/**
 * 🔄 MÉTODO FALLBACK: Distribución original (solo como respaldo)
 */
private function crearDistribucionSinViajesFallback($consumosPorCamion)
{
    Log::warning('🔄 Usando método FALLBACK - distribución por faena defecto');
    
    $faenaDefecto = 1; // ID de faena defecto
    $nombreFaenaDefecto = $this->obtenerNombreFaena($faenaDefecto);
    
    $distribucionPorFaena = [
        $faenaDefecto => [
            'faena_id' => $faenaDefecto,
            'faena_nombre' => $nombreFaenaDefecto,
            'consumo_asignado' => 0,
            'total_viajes' => 0,
            'total_kilometros' => 0,
            'maquinas_operando' => [],
            'camiones_detalle' => []
        ]
    ];

    foreach ($consumosPorCamion as $consumoCamion) {
        $distribucionPorFaena[$faenaDefecto]['consumo_asignado'] += $consumoCamion['consumo_litros'];
        
        $distribucionPorFaena[$faenaDefecto]['camiones_detalle'][] = [
            'id_camion' => $consumoCamion['id_maquina'],
            'nombre_camion' => $consumoCamion['nombre_maquina'],
            'patente' => $consumoCamion['patente'],
            'consumo_asignado' => $consumoCamion['consumo_litros'],
            'viajes' => 0,
            'kilometros' => 0,
            'porcentaje' => 100,
            'motivo' => 'Sin datos de viajes - asignación completa (método fallback)'
        ];

        $distribucionPorFaena[$faenaDefecto]['maquinas_operando'][] = $consumoCamion['id_maquina'];
    }

    $distribucionPorFaena[$faenaDefecto]['maquinas_operando'] = count($distribucionPorFaena[$faenaDefecto]['maquinas_operando']);
    $consumoTotalRedistribuido = $distribucionPorFaena[$faenaDefecto]['consumo_asignado'];

    return [
        'tiene_distribucion' => true,
        'categorias_redistribuidas' => [[
            'id' => 7,
            'name' => 'Camion Tolva',
            'nombre' => 'Camion Tolva',
            'value' => round($consumoTotalRedistribuido, 2),
            'redistribucion_camion_tolva' => [
                'tiene_redistribucion' => false,
                'motivo_redistribucion' => 'No hay datos de viajes ni consumos reales por faena',
                'distribucion_por_faena' => array_values($distribucionPorFaena)
            ]
        ]],
        'info' => [
            'tiene_redistribucion' => false,
            'motivo' => 'No hay datos de viajes ni consumos reales para redistribución'
        ]
    ];
}


    /**
     * 🔧 MÉTODO CORREGIDO COMPLETO: obtenerConsumosCamionesTolvaIndividuales
     */
    private function obtenerConsumosCamionesTolvaIndividuales($fechaInicio, $fechaFin)
    {
        $queryConsumos = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->where('cm.id_categoria', 7) // Camion Tolva
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0)
            ->select([
                'm.id_maquina',
                DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina'),
                DB::raw('SUM(c.litros_consumidos) as consumo_litros'),
                DB::raw('COUNT(c.id_consumo) as total_registros')
            ])
            ->groupBy([
                'm.id_maquina',
                'mi.nombre',
                'm.nombre_maquina',
                'mi.patente',
                'm.patente',
                'mi.id_maquina'
            ])
            ->get()
            ->toArray();

        return array_map(function ($item) {
            return [
                'id_maquina' => $item->id_maquina,
                'nombre_maquina' => $item->nombre_maquina,
                'patente' => $item->patente,
                'tipo_maquina' => $item->tipo_maquina,
                'consumo_litros' => (float) $item->consumo_litros,
                'total_registros' => (int) $item->total_registros
            ];
        }, $queryConsumos);
    }



    /**
     * 🆕 CORREGIDO: Obtener datos de máquinas para una categoría específica
     */
    private function obtenerDatosMaquinasCategoria($idCategoria, $fechaInicio, $fechaFin, $idFaena = null)
    {
        // Obtener información de la categoría
        $categoria = DB::table('categorias_maquinas')
            ->where('id_categoria', $idCategoria)
            ->first();

        if (!$categoria) {
            throw new \Exception('Categoría no encontrada');
        }

        // 🆕 QUERY CORREGIDA: Una sola consulta con LEFT JOIN
        $resultados = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->where('m.id_categoria', $idCategoria)
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0)
            ->when($idFaena && $idFaena !== 'todas', function ($q) use ($idFaena) {
                return $q->where('c.id_faena', $idFaena);
            })
            ->select([
                'm.id_maquina',
                // 🔑 CORREGIDO: Usar nombre apropiado según tipo
                DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                'm.estado',
                DB::raw('SUM(c.litros_consumidos) as total_consumo'),
                DB::raw('COUNT(c.id_consumo) as total_registros'),
                DB::raw('AVG(c.litros_consumidos) as promedio_consumo'),
                DB::raw('MAX(c.fecha_consumo) as ultimo_consumo'),
                DB::raw('MIN(c.fecha_consumo) as primer_consumo'),
                // 🔑 DETERMINAR TIPO: Si existe en maquinas_internas es interna
                DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina')
            ])
            ->groupBy('m.id_maquina', 'mi.nombre', 'm.nombre_maquina', 'mi.patente', 'm.patente', 'm.estado', 'mi.id_maquina')
            ->orderBy('total_consumo', 'desc')
            ->get();

        // Formatear datos para el PieChart
        $data = $resultados->map(function ($item) {
            return [
                'id' => $item->id_maquina,
                'name' => $item->nombre_maquina,
                'value' => round($item->total_consumo, 2),
                'patente' => $item->patente ?? 'N/A',
                'estado' => $item->estado,
                'tipo_maquina' => $item->tipo_maquina,
                'promedio_consumo' => round($item->promedio_consumo, 2),
                'total_registros' => $item->total_registros,
                'periodo_actividad' => [
                    'inicio' => $item->primer_consumo,
                    'fin' => $item->ultimo_consumo
                ]
            ];
        });

        // Calcular metadata
        $totalConsumo = $data->sum('value');
        $maquinasInternas = $data->where('tipo_maquina', 'Interna')->count();
        $maquinasExternas = $data->where('tipo_maquina', 'Externa')->count();

        $metadata = [
            'categoria' => [
                'id' => $categoria->id_categoria,
                'nombre' => $categoria->nombre_categoria,
                'tipo_medicion' => $categoria->tipo_medicion
            ],
            'periodo' => [
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin' => $fechaFin->toDateString(),
                'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
            ],
            'resumen' => [
                'total_maquinas' => $data->count(),
                'maquinas_internas' => $maquinasInternas,
                'maquinas_externas' => $maquinasExternas,
                'total_consumo_litros' => round($totalConsumo, 2),
                'promedio_por_maquina' => $data->count() > 0 ? round($totalConsumo / $data->count(), 2) : 0,
                'maquina_mayor_consumo' => $data->first() ? $data->first()['name'] : null,
                'maquinas_activas' => $data->where('estado', 'operativo')->count()
            ],
            'filtros_aplicados' => [
                'faena_especifica' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas'
            ]
        ];

        return [
            'data' => $data->values(),
            'metadata' => $metadata
        ];
    }


    /**
     * 🔧 CALCULAR PERÍODO ANTERIOR con descripción en formato DD-MM-YYYY
     */
    private function calcularPeriodoAnteriorFormatoDDMMYYYY($fechaDesde, $fechaHasta)
    {
        // Función auxiliar para obtener días en un mes
        $getDiasEnMes = function ($year, $month) {
            return Carbon::create($year, $month, 1)->daysInMonth;
        };

        // Parsear fechas de entrada
        [$yearDesde, $monthDesde, $dayDesde] = explode('-', $fechaDesde);
        [$yearHasta, $monthHasta, $dayHasta] = explode('-', $fechaHasta);

        $yearDesde = (int) $yearDesde;
        $monthDesde = (int) $monthDesde;
        $dayDesde = (int) $dayDesde;
        $yearHasta = (int) $yearHasta;
        $monthHasta = (int) $monthHasta;
        $dayHasta = (int) $dayHasta;

        // Calcular mes anterior para fecha inicio
        $yearAnteriorDesde = $yearDesde;
        $monthAnteriorDesde = $monthDesde - 1;
        if ($monthAnteriorDesde < 1) {
            $monthAnteriorDesde = 12;
            $yearAnteriorDesde -= 1;
        }

        // Calcular mes anterior para fecha fin
        $yearAnteriorHasta = $yearHasta;
        $monthAnteriorHasta = $monthHasta - 1;
        if ($monthAnteriorHasta < 1) {
            $monthAnteriorHasta = 12;
            $yearAnteriorHasta -= 1;
        }

        // 🔧 CORRECCIÓN CRÍTICA: Ajustar días si el mes anterior tiene menos días
        $dayAnteriorDesde = $dayDesde;
        $dayAnteriorHasta = $dayHasta;

        // Verificar días máximos para el mes anterior de la fecha inicio
        $maxDiasAnteriorDesde = $getDiasEnMes($yearAnteriorDesde, $monthAnteriorDesde);
        if ($dayAnteriorDesde > $maxDiasAnteriorDesde) {
            $dayAnteriorDesde = $maxDiasAnteriorDesde;
        }

        // Verificar días máximos para el mes anterior de la fecha fin
        $maxDiasAnteriorHasta = $getDiasEnMes($yearAnteriorHasta, $monthAnteriorHasta);
        if ($dayAnteriorHasta > $maxDiasAnteriorHasta) {
            $dayAnteriorHasta = $maxDiasAnteriorHasta;
        }

        // Formatear fechas como YYYY-MM-DD (para uso interno)
        $fechaInicioAnterior = sprintf(
            '%04d-%02d-%02d',
            $yearAnteriorDesde,
            $monthAnteriorDesde,
            $dayAnteriorDesde
        );

        $fechaFinAnterior = sprintf(
            '%04d-%02d-%02d',
            $yearAnteriorHasta,
            $monthAnteriorHasta,
            $dayAnteriorHasta
        );

        // 🎨 DESCRIPCIÓN EN FORMATO DD-MM-YYYY (para mostrar al usuario)
        $fechaInicioDDMMYYYY = sprintf(
            '%02d-%02d-%04d',
            $dayAnteriorDesde,
            $monthAnteriorDesde,
            $yearAnteriorDesde
        );

        $fechaFinDDMMYYYY = sprintf(
            '%02d-%02d-%04d',
            $dayAnteriorHasta,
            $monthAnteriorHasta,
            $yearAnteriorHasta
        );

        $descripcionDDMMYYYY = $fechaInicioDDMMYYYY . ' al ' . $fechaFinDDMMYYYY;

        return [
            'fechaDesde' => $fechaInicioAnterior,     // YYYY-MM-DD (uso interno)
            'fechaHasta' => $fechaFinAnterior,       // YYYY-MM-DD (uso interno)
            'descripcionDDMMYYYY' => $descripcionDDMMYYYY, // 🎨 DD-MM-YYYY (presentación)
            'metadatos' => [
                'ajusteDiaInicio' => $dayDesde !== $dayAnteriorDesde,
                'ajusteDiaFin' => $dayHasta !== $dayAnteriorHasta,
                'diasOriginales' => ['inicio' => $dayDesde, 'fin' => $dayHasta],
                'diasAjustados' => ['inicio' => $dayAnteriorDesde, 'fin' => $dayAnteriorHasta],
                'maxDiasEnMeses' => [
                    'inicio' => $maxDiasAnteriorDesde,
                    'fin' => $maxDiasAnteriorHasta
                ],
                'formatoPresentacion' => 'DD-MM-YYYY'
            ]
        ];
    }



    /**
     * 🚛 MÉTODO AUXILIAR: Obtener consumo de camionetas de todas las faenas
     */
    private function obtenerConsumoCamionetasTodasFaenas($fechaInicio, $fechaFin)
    {
        if (!$fechaInicio || !$fechaFin) {
            return [];
        }

        // Obtener consumo de camionetas por faena (sin filtro de faena)
        $queryConsumos = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0)
            ->where(function ($query) {
                $query->where('cm.nombre_categoria', 'LIKE', '%camioneta%')
                    ->orWhere('cm.nombre_categoria', 'LIKE', '%camionetas%')
                    ->orWhere('cm.nombre_categoria', '=', 'Camioneta');
            })
            ->select([
                'c.id_faena',
                DB::raw('SUM(c.litros_consumidos) as total_litros')
            ])
            ->groupBy('c.id_faena')
            ->get();

        // Mapear con nombres de faenas
        $resultado = [];
        foreach ($queryConsumos as $consumo) {
            $nombreFaena = $this->obtenerNombreFaenaConConfiguracion($consumo->id_faena);
            $resultado[$consumo->id_faena] = [
                'id_faena' => $consumo->id_faena,
                'nombre_faena' => $nombreFaena,
                'consumo_total' => (float) $consumo->total_litros
            ];
        }

        return $resultado;
    }


    /**
     * Endpoint específico para obtener máquinas de una categoría
     * 🔑 CORREGIDO
     */
    public function obtenerMaquinasCategoria(Request $request, $idCategoria)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena;

            // 🔑 Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            $resultado = $this->obtenerDatosMaquinasCategoria($idCategoria, $fechaInicio, $fechaFin, $idFaena);

            return response()->json([
                'success' => true,
                'maquinas' => $resultado['data'],
                'categoria_info' => $resultado['metadata']['categoria'],
                'resumen' => $resultado['metadata']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener máquinas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 CORREGIDO: Obtener lista de categorías
     */
    public function obtenerListaCategorias()
    {
        try {
            $categorias = DB::table('categorias_maquinas')
                ->select([
                    'id_categoria',
                    'nombre_categoria',
                    'tipo_medicion',
                    'chc'
                ])
                ->orderBy('nombre_categoria')
                ->get();

            // 🆕 CORREGIDO: Conteo usando la estructura correcta
            $categoriasConConteo = $categorias->map(function ($categoria) {
                // Contar todas las máquinas de la categoría
                $conteoTotal = DB::table('maquinas')
                    ->where('id_categoria', $categoria->id_categoria)
                    ->count();

                // Contar máquinas internas (las que están en maquinas_internas)
                $conteoInternas = DB::table('maquinas as m')
                    ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                    ->where('m.id_categoria', $categoria->id_categoria)
                    ->count();

                // Las externas son el total menos las internas
                $conteoExternas = $conteoTotal - $conteoInternas;

                return [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria,
                    'tipo_medicion' => $categoria->tipo_medicion,
                    'chc' => $categoria->chc,
                    'cantidad_maquinas' => $conteoTotal,
                    'maquinas_internas' => $conteoInternas,
                    'maquinas_externas' => $conteoExternas,
                ];
            });

            return response()->json([
                'success' => true,
                'categorias' => $categoriasConConteo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lista de categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Métodos auxiliares
     */
    private function validarFechas($fechaInicio, $fechaFin)
    {
        try {
            return $fechaInicio->lte($fechaFin);
        } catch (\Exception $e) {
            return false;
        }
    }

    private function obtenerNombreFaena($idFaena)
    {
        $faena = DB::table('faenas')->where('id_faena', $idFaena)->first();
        return $faena ? $faena->ubicacion : "Faena ID: $idFaena";
    }

    public function obtenerConsumosIndividualesCategoria(Request $request, $idCategoria)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena;
            $limit = $request->limit ?? 1000; // Límite para evitar sobrecarga
            $page = $request->page ?? 1;
            $perPage = $request->per_page ?? 100;

            // 🔑 Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            // Validar fechas
            if (!$this->validarFechas($fechaInicio, $fechaFin)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fechas inválidas. La fecha de inicio debe ser menor o igual a la fecha fin.'
                ], 400);
            }

            // Obtener información de la categoría
            $categoria = DB::table('categorias_maquinas')
                ->where('id_categoria', $idCategoria)
                ->first();

            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 400);
            }

            // 🆕 QUERY PARA CONSUMOS INDIVIDUALES (NO AGRUPADOS)
            $query = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('faenas as f', 'c.id_faena', '=', 'f.id_faena')
                ->leftJoin('users as u', 'c.id_usuario', '=', 'u.id')
                ->leftJoin('solicitantes as s', 'c.id_dotacion', '=', 's.rut')
                ->leftJoin('personal_interno as pi', function ($join) {
                    $join->on('s.rut', '=', 'pi.rut')
                        ->where('s.tipo_personal', '=', 'Interno');
                })
                ->leftJoin('personal_externo as pe', function ($join) {
                    $join->on('s.rut', '=', 'pe.rut')
                        ->where('s.tipo_personal', '=', 'Externo');
                })
                ->leftJoin('empresas_externas as ee', 'pe.id_empresa', '=', 'ee.id_empresa')
                ->where('m.id_categoria', $idCategoria)
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->whereNotNull('c.litros_consumidos')
                ->where('c.litros_consumidos', '>', 0)
                ->when($idFaena && $idFaena !== 'todas', function ($q) use ($idFaena) {
                    return $q->where('c.id_faena', $idFaena);
                })
                ->select([
                    // Información del consumo
                    'c.id_consumo',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.medicion',
                    'c.numeral_inicial',
                    'c.numeral_final',
                    'c.precio_litro',
                    'c.observacion',
                    'c.tipo_consumo',

                    // Información de la máquina
                    'm.id_maquina',
                    DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                    DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                    'm.estado',
                    DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina'),

                    // Información de la faena
                    'f.ubicacion as faena_nombre',
                    'c.id_faena',

                    // Información del solicitante
                    'c.id_dotacion',
                    's.tipo_personal',
                    'pi.nombre as interno_nombre',
                    'pi.apellido as interno_apellido',
                    'pe.nombre as externo_nombre',
                    'ee.nombre as empresa_nombre',

                    // Información del usuario
                    'u.nombre as usuario_nombre',
                    'u.apellido as usuario_apellido'
                ])
                ->orderBy('c.fecha_consumo', 'desc')
                ->orderBy('c.id_consumo', 'desc');

            // Contar total de registros para paginación
            $totalRecords = $query->count();
            $totalPages = ceil($totalRecords / $perPage);

            // Aplicar paginación
            $consumos = $query
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            // 🔄 TRANSFORMAR DATOS para compatibilidad con frontend
            $data = $consumos->map(function ($item) {
                // Determinar nombre del solicitante
                $solicitanteNombre = 'N/A';
                if ($item->tipo_personal === 'Interno' && $item->interno_nombre) {
                    $solicitanteNombre = trim($item->interno_nombre . ' ' . ($item->interno_apellido ?? ''));
                } elseif ($item->tipo_personal === 'Externo' && $item->externo_nombre) {
                    $empresaNombre = $item->empresa_nombre ? ' (' . $item->empresa_nombre . ')' : '';
                    $solicitanteNombre = $item->externo_nombre . $empresaNombre;
                }

                return [
                    'id_consumo' => $item->id_consumo,
                    'fecha_consumo' => $item->fecha_consumo,
                    'litros_consumidos' => round($item->litros_consumidos, 2),
                    'nombre_maquina' => $item->nombre_maquina,
                    'patente' => $item->patente ?? 'S/P',
                    'tipo_maquina' => $item->tipo_maquina,
                    'estado' => $item->estado,
                    'id_faena' => $item->id_faena,
                    'faena_nombre' => $item->faena_nombre,
                    'solicitante_nombre' => $solicitanteNombre,
                    'id_dotacion' => $item->id_dotacion,
                    'observacion' => $item->observacion,
                    'medicion' => $item->medicion,
                    'numeral_inicial' => $item->numeral_inicial,
                    'numeral_final' => $item->numeral_final,
                    'precio_litro' => $item->precio_litro,
                    'tipo_consumo' => $item->tipo_consumo,
                    'usuario' => trim(($item->usuario_nombre ?? '') . ' ' . ($item->usuario_apellido ?? ''))
                ];
            });

            // 📊 CALCULAR ESTADÍSTICAS
            $totalConsumo = $data->sum('litros_consumidos');
            $equiposUnicos = $data->unique('nombre_maquina')->count();
            $promedioConsumo = $data->count() > 0 ? $totalConsumo / $data->count() : 0;

            $metadata = [
                'categoria' => [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria,
                    'tipo_medicion' => $categoria->tipo_medicion
                ],
                'periodo' => [
                    'fecha_inicio' => $fechaInicio->toDateString(),
                    'fecha_fin' => $fechaFin->toDateString(),
                    'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
                ],
                'resumen' => [
                    'total_consumos_individuales' => $data->count(),
                    'total_registros_bd' => $totalRecords,
                    'equipos_unicos' => $equiposUnicos,
                    'total_consumo_litros' => round($totalConsumo, 2),
                    'promedio_por_consumo' => round($promedioConsumo, 2),
                    'consumos_internos' => $data->where('tipo_maquina', 'Interna')->count(),
                    'consumos_externos' => $data->where('tipo_maquina', 'Externa')->count()
                ],
                'paginacion' => [
                    'pagina_actual' => $page,
                    'por_pagina' => $perPage,
                    'total_registros' => $totalRecords,
                    'total_paginas' => $totalPages,
                    'desde' => ($page - 1) * $perPage + 1,
                    'hasta' => min($page * $perPage, $totalRecords)
                ],
                'filtros_aplicados' => [
                    'faena_especifica' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $data->values(),
                'metadata' => $metadata,
                'consumos_individuales' => $data->values(), // Alias para claridad
                'categoria_info' => $metadata['categoria'],
                'message' => "Consumos individuales de la categoría '{$categoria->nombre_categoria}' obtenidos exitosamente"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener consumos individuales: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🚛 MÉTODO ACTUALIZADO: Obtener viajes y distancias de camiones tolva
     * Incluye información de plantas (id_planta y nombre)
     */
    public function obtenerViajesDistanciasCamionesTolva(Request $request)
    {
        try {
            $fechaInicio = $request->input('fecha_inicio', $request->input('fecha_desde', Carbon::now()->startOfMonth()->format('Y-m-d')));
            $fechaFin = $request->input('fecha_fin', $request->input('fecha_hasta', Carbon::now()->format('Y-m-d')));
            $idFaena = $request->input('id_faena', $request->input('faena_id')); // Opcional

            // 🔑 Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            // 🚛 CONSULTA PRINCIPAL: Obtener viajes y distancias de camiones tolva + información de plantas
            $queryViajesDistancias = DB::table('tonelajes as t')
                ->join('maquinas as m', 't.id_maquina', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('faenas as f', 'p.id_faena', '=', 'f.id_faena')
                // 🆕 NUEVO JOIN: Agregar tabla plantas para obtener el nombre
                ->leftJoin('plantas as pl', 'p.id_planta', '=', 'pl.id_planta')
                ->where('cm.id_categoria', 7) // Camion Tolva = 7
                ->whereBetween('t.fecha_produccion', [$fechaInicio, $fechaFin])
                ->when($idFaena && $idFaena !== 'todas', function ($q) use ($idFaena) {
                    return $q->where('p.id_faena', $idFaena);
                })
                ->select([
                    // Información de la máquina
                    'm.id_maquina',
                    'cm.nombre_categoria',
                    DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                    DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                    DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina'),

                    // Información de la faena
                    'p.id_faena',
                    'f.ubicacion as nombre_faena',

                    // 🆕 NUEVO: Información de la planta
                    'p.id_planta',
                    'pl.nombre as nombre_planta',

                    // Información del padrón (distancia)
                    't.id_padron',
                    'p.distancia',

                    // 📊 DATOS CLAVE: Viajes y cálculos
                    DB::raw('SUM(t.viajes) as total_viajes'),
                    DB::raw('p.distancia as distancia_por_viaje'),
                    DB::raw('SUM(t.viajes) * p.distancia as total_kilometros'),

                    // Información adicional
                    DB::raw('COUNT(t.id_tonelaje) as total_registros_tonelaje'),
                    DB::raw('MIN(t.fecha_produccion) as primera_fecha'),
                    DB::raw('MAX(t.fecha_produccion) as ultima_fecha')
                ])
                ->groupBy([
                    'm.id_maquina',
                    'cm.nombre_categoria',
                    'mi.nombre',
                    'm.nombre_maquina',
                    'mi.patente',
                    'm.patente',
                    'mi.id_maquina',
                    'p.id_faena',
                    'f.ubicacion',
                    // 🆕 NUEVO: Agregar campos de planta al GROUP BY
                    'p.id_planta',
                    'pl.nombre',
                    't.id_padron',
                    'p.distancia'
                ])
                ->orderBy('total_kilometros', 'desc')
                ->get();

            // 🔄 PROCESAR Y FORMATEAR DATOS
            $viajesDistanciasFormateados = $queryViajesDistancias->map(function ($item) {
                return [
                    // Información de máquina
                    'id_maquina' => $item->id_maquina,
                    'nombre_maquina' => $item->nombre_maquina ?? 'Sin nombre',
                    'patente' => $item->patente ?? 'S/P',
                    'tipo_maquina' => $item->tipo_maquina,
                    'categoria' => $item->nombre_categoria,

                    // Información de faena/destino
                    'id_faena' => $item->id_faena,
                    'nombre_faena' => $item->nombre_faena ?? 'Sin faena',
                    'id_padron' => $item->id_padron,

                    // 🆕 NUEVO: Información de planta
                    'id_planta' => $item->id_planta,
                    'nombre_planta' => $item->nombre_planta ?? 'Sin planta',

                    // 📊 DATOS PRINCIPALES
                    'total_viajes' => (int) $item->total_viajes,
                    'distancia_por_viaje' => (float) $item->distancia_por_viaje,
                    'total_kilometros' => round((float) $item->total_kilometros, 2),

                    // Metadatos
                    'total_registros_tonelaje' => (int) $item->total_registros_tonelaje,
                    'periodo_actividad' => [
                        'desde' => $item->primera_fecha,
                        'hasta' => $item->ultima_fecha
                    ]
                ];
            });

            // 📈 CALCULAR RESUMEN POR MÁQUINA (actualizado con información de plantas)
            $resumenPorMaquina = $viajesDistanciasFormateados
                ->groupBy('id_maquina')
                ->map(function ($registrosMaquina, $idMaquina) {
                    $primerRegistro = $registrosMaquina->first();

                    return [
                        'id_maquina' => $idMaquina,
                        'nombre_maquina' => $primerRegistro['nombre_maquina'],
                        'patente' => $primerRegistro['patente'],
                        'tipo_maquina' => $primerRegistro['tipo_maquina'],

                        // Totales por máquina
                        'total_viajes' => $registrosMaquina->sum('total_viajes'),
                        'total_kilometros' => round($registrosMaquina->sum('total_kilometros'), 2),
                        'faenas_visitadas' => $registrosMaquina->pluck('id_faena')->unique()->count(),
                        'plantas_visitadas' => $registrosMaquina->pluck('id_planta')->unique()->count(),
                        'rutas_diferentes' => $registrosMaquina->pluck('id_padron')->unique()->count(),

                        // Desglose por faena (actualizado con plantas)
                        'desglose_faenas' => $registrosMaquina->map(function ($registro) {
                            return [
                                'faena' => $registro['nombre_faena'],
                                'id_faena' => $registro['id_faena'], // ← agregado
                                'planta' => $registro['nombre_planta'],
                                'id_planta' => $registro['id_planta'],
                                'viajes' => $registro['total_viajes'],
                                'kilometros' => $registro['total_kilometros'],
                                'distancia_unitaria' => $registro['distancia_por_viaje']
                            ];
                        })->values()
                    ];
                })->values();

            // 📊 CALCULAR RESUMEN POR FAENA (actualizado con plantas)
            $resumenPorFaena = $viajesDistanciasFormateados
                ->groupBy('id_faena')
                ->map(function ($registrosFaena, $idFaena) {
                    $primerRegistro = $registrosFaena->first();

                    return [
                        'id_faena' => $idFaena,
                        'nombre_faena' => $primerRegistro['nombre_faena'],

                        // Totales por faena
                        'total_viajes' => $registrosFaena->sum('total_viajes'),
                        'total_kilometros' => round($registrosFaena->sum('total_kilometros'), 2),
                        'maquinas_operando' => $registrosFaena->pluck('id_maquina')->unique()->count(),
                        'plantas_destino' => $registrosFaena->pluck('id_planta')->unique()->count(),
                        'rutas_utilizadas' => $registrosFaena->pluck('id_padron')->unique()->count(),

                        // Desglose por máquina (con plantas)
                        'desglose_maquinas' => $registrosFaena->map(function ($registro) {
                            return [
                                'maquina' => $registro['nombre_maquina'],
                                'patente' => $registro['patente'],
                                'planta_destino' => $registro['nombre_planta'],
                                'viajes' => $registro['total_viajes'],
                                'kilometros' => $registro['total_kilometros']
                            ];
                        })->values()
                    ];
                })->values();

            // 🆕 NUEVO: RESUMEN POR PLANTA
            $resumenPorPlanta = $viajesDistanciasFormateados
                ->groupBy('id_planta')
                ->map(function ($registrosPlanta, $idPlanta) {
                    $primerRegistro = $registrosPlanta->first();

                    return [
                        'id_planta' => $idPlanta,
                        'nombre_planta' => $primerRegistro['nombre_planta'],

                        // Totales por planta
                        'total_viajes' => $registrosPlanta->sum('total_viajes'),
                        'total_kilometros' => round($registrosPlanta->sum('total_kilometros'), 2),
                        'maquinas_que_transportan' => $registrosPlanta->pluck('id_maquina')->unique()->count(),
                        'faenas_origen' => $registrosPlanta->pluck('id_faena')->unique()->count(),

                        // Desglose por máquina
                        'desglose_maquinas' => $registrosPlanta->map(function ($registro) {
                            return [
                                'maquina' => $registro['nombre_maquina'],
                                'patente' => $registro['patente'],
                                'faena_origen' => $registro['nombre_faena'],
                                'viajes' => $registro['total_viajes'],
                                'kilometros' => $registro['total_kilometros']
                            ];
                        })->values()
                    ];
                })->values();

            // 📊 RESUMEN GENERAL (actualizado)
            $resumenGeneral = [
                'periodo' => [
                    'fecha_inicio' => $fechaInicio->toDateString(),
                    'fecha_fin' => $fechaFin->toDateString(),
                    'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
                ],
                'totales' => [
                    'maquinas_activas' => $viajesDistanciasFormateados->pluck('id_maquina')->unique()->count(),
                    'faenas_con_actividad' => $viajesDistanciasFormateados->pluck('id_faena')->unique()->count(),
                    'plantas_destino' => $viajesDistanciasFormateados->pluck('id_planta')->unique()->count(),
                    'total_viajes_sistema' => $viajesDistanciasFormateados->sum('total_viajes'),
                    'total_kilometros_sistema' => round($viajesDistanciasFormateados->sum('total_kilometros'), 2),
                    'promedio_km_por_viaje' => $viajesDistanciasFormateados->sum('total_viajes') > 0
                        ? round($viajesDistanciasFormateados->sum('total_kilometros') / $viajesDistanciasFormateados->sum('total_viajes'), 2)
                        : 0
                ],
                'filtros_aplicados' => [
                    'categoria' => 'Camion Tolva (ID: 7)',
                    'faena_especifica' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'viajes_detallados' => $viajesDistanciasFormateados,
                    'resumen_por_maquina' => $resumenPorMaquina,
                    'resumen_por_faena' => $resumenPorFaena,
                    // 🆕 NUEVO: Agregar resumen por planta
                    'resumen_por_planta' => $resumenPorPlanta
                ],
                'resumen_general' => $resumenGeneral,
                'method_used' => $request->method(),
                'query_type' => 'viajes_distancias_camiones_tolva',
                'total_registros' => $viajesDistanciasFormateados->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener viajes y distancias: ' . $e->getMessage(),
                'query_type' => 'viajes_distancias_camiones_tolva'
            ], 500);
        }
    }


    /**
     * 🚛 MÉTODO NUEVO: Obtener kilómetros totales de un camión EN EL PERÍODO FILTRADO
     * Suma TODOS los kilómetros del camión en todas sus rutas durante el período especificado
     */
    private function obtenerKilometrosTotalesCamionPeriodo($idCamion, $fechaInicio, $fechaFin)
    {
        try {
            // 📊 Query para obtener TODOS los kilómetros del camión EN EL PERÍODO
            $kilometrosTotales = DB::table('tonelajes as t')
                ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
                ->where('t.id_maquina', $idCamion)
                ->whereBetween('t.fecha_produccion', [$fechaInicio, $fechaFin])
                ->select([
                    't.id_maquina',
                    't.id_padron',
                    't.viajes',
                    'p.distancia',
                    DB::raw('t.viajes * p.distancia as kilometros_registro'),
                    't.fecha_produccion'
                ])
                ->get();

            // 🧮 Calcular el total de kilómetros del período
            $totalKilometros = $kilometrosTotales->sum('kilometros_registro');

            // 📈 Información adicional útil
            $estadisticas = [
                'id_maquina' => $idCamion,
                'km_totales_periodo' => round($totalKilometros, 2),
                'total_registros' => $kilometrosTotales->count(),
                'total_viajes' => $kilometrosTotales->sum('viajes'),
                'padrones_utilizados' => $kilometrosTotales->pluck('id_padron')->unique()->count(),
                'primer_registro' => $kilometrosTotales->min('fecha_produccion'),
                'ultimo_registro' => $kilometrosTotales->max('fecha_produccion'),
                'promedio_km_por_viaje' => $kilometrosTotales->sum('viajes') > 0
                    ? round($totalKilometros / $kilometrosTotales->sum('viajes'), 2)
                    : 0
            ];

            Log::info("🚛 KM Totales Período Camión {$idCamion}", $estadisticas);

            return $estadisticas;
        } catch (\Exception $e) {
            Log::error("❌ Error obteniendo KM período camión {$idCamion}", [
                'error' => $e->getMessage()
            ]);

            return [
                'id_maquina' => $idCamion,
                'km_totales_periodo' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 🚛 MÉTODO OPTIMIZADO: Obtener KM totales del período de múltiples camiones de una vez
     * Para casos donde necesitas varios camiones, evita múltiples queries
     */
    private function obtenerKilometrosTotalesMultiplesCamiones($idsCamiones, $fechaInicio, $fechaFin)
    {
        try {
            // 📊 Query optimizada para múltiples camiones EN EL PERÍODO
            $kilometrosPorCamion = DB::table('tonelajes as t')
                ->join('padrones as p', 't.id_padron', '=', 'p.id_padron')
                ->whereIn('t.id_maquina', $idsCamiones)
                ->whereBetween('t.fecha_produccion', [$fechaInicio, $fechaFin])
                ->select([
                    't.id_maquina',
                    DB::raw('SUM(t.viajes * p.distancia) as km_totales_periodo'),
                    DB::raw('COUNT(*) as total_registros'),
                    DB::raw('SUM(t.viajes) as total_viajes'),
                    DB::raw('COUNT(DISTINCT t.id_padron) as padrones_utilizados'),
                    DB::raw('MIN(t.fecha_produccion) as primer_registro'),
                    DB::raw('MAX(t.fecha_produccion) as ultimo_registro')
                ])
                ->groupBy('t.id_maquina')
                ->get()
                ->keyBy('id_maquina');

            // 🔄 Formatear resultados
            $resultados = [];
            foreach ($idsCamiones as $idCamion) {
                if (isset($kilometrosPorCamion[$idCamion])) {
                    $data = $kilometrosPorCamion[$idCamion];
                    $resultados[$idCamion] = [
                        'id_maquina' => $idCamion,
                        'km_totales_periodo' => round((float)$data->km_totales_periodo, 2),
                        'total_registros' => (int)$data->total_registros,
                        'total_viajes' => (int)$data->total_viajes,
                        'padrones_utilizados' => (int)$data->padrones_utilizados,
                        'primer_registro' => $data->primer_registro,
                        'ultimo_registro' => $data->ultimo_registro,
                        'promedio_km_por_viaje' => $data->total_viajes > 0
                            ? round($data->km_totales_periodo / $data->total_viajes, 2)
                            : 0
                    ];
                } else {
                    // Camión sin registros en el período
                    $resultados[$idCamion] = [
                        'id_maquina' => $idCamion,
                        'km_totales_periodo' => 0,
                        'total_registros' => 0,
                        'total_viajes' => 0,
                        'padrones_utilizados' => 0,
                        'primer_registro' => null,
                        'ultimo_registro' => null,
                        'promedio_km_por_viaje' => 0
                    ];
                }
            }

            return $resultados;
        } catch (\Exception $e) {
            Log::error("❌ Error obteniendo KM período múltiples camiones", [
                'camiones' => $idsCamiones,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

/**
 * 🔧 MÉTODO CORREGIDO: obtenerDistribucionViajesCamionTolva - LÓGICA MIXTA POR CAMIÓN
 * Analiza cada camión individualmente: 
 * - Si tiene viajes → distribuir según destino de viajes
 * - Si NO tiene viajes → asignar a faena donde carga
 */
private function obtenerDistribucionViajesCamionTolva($fechaInicio, $fechaFin, $idFaena, $request)
{
    try {
        // 🚨 EXCEPCIÓN: Si filtro es "todas las faenas", no aplicar distribución
        if (!$idFaena || $idFaena === 'todas') {
            Log::info('🚫 Filtro "todas las faenas" - sin distribución');
            return [
                'tiene_distribucion' => false,
                'info' => [
                    'tiene_redistribucion' => false,
                    'motivo' => 'Filtro "todas las faenas" - se muestran datos directos sin distribución'
                ]
            ];
        }

        // 1️⃣ Obtener consumos por camión
        $consumosPorCamion = $this->obtenerConsumosCamionesTolvaIndividuales($fechaInicio, $fechaFin);

        if (empty($consumosPorCamion)) {
            return [
                'tiene_distribucion' => false,
                'info' => [
                    'tiene_redistribucion' => false,
                    'motivo' => 'No hay consumo de Camion Tolva en el período'
                ]
            ];
        }

        // 2️⃣ Obtener KM TOTALES DEL PERÍODO de todos los camiones DE UNA VEZ
        $idsCamiones = collect($consumosPorCamion)->pluck('id_maquina')->toArray();
        $kmPeriodoPorCamion = $this->obtenerKilometrosTotalesMultiplesCamiones($idsCamiones, $fechaInicio, $fechaFin);

        // 3️⃣ Obtener datos de viajes del período (SIN FILTRO para verificar si camiones tienen viajes)
        $requestViajes = new Request([
            'fecha_inicio' => $fechaInicio->format('Y-m-d'),
            'fecha_fin' => $fechaFin->format('Y-m-d')
            // 🎯 SIN id_faena: necesitamos TODOS los viajes para determinar correctamente qué camiones tienen viajes
        ]);

        $responseViajes = $this->obtenerViajesDistanciasCamionesTolva($requestViajes);
        $datosViajes = json_decode($responseViajes->getContent(), true);

        // 4️⃣ Obtener consumos reales por faena para camiones SIN viajes
        // 🎯 IMPORTANTE: Si hay filtro por faena, solo obtener consumos de ESA faena
        $consumosRealesPorFaena = $this->obtenerConsumosRealesPorFaenaYCamion($fechaInicio, $fechaFin, $consumosPorCamion, $idFaena);

        // 5️⃣ LÓGICA MIXTA: Procesar cada camión individualmente
        $distribucionPorFaena = [];
        $consumoTotalOriginal = 0;
        $detalleRedistribucionPorCamion = [];
        $camionesConViajes = [];
        $camionesSinViajes = [];

        // Mapear datos de viajes por camión (si existen)
        $viajesPorCamion = [];
        if ($datosViajes['success'] && !empty($datosViajes['data']['resumen_por_maquina'])) {
            foreach ($datosViajes['data']['resumen_por_maquina'] as $resumenCamion) {
                $viajesPorCamion[$resumenCamion['id_maquina']] = $resumenCamion;
            }
        }

        // Mapear consumos reales por faena y camión
        $consumosRealesMap = collect($consumosRealesPorFaena)->groupBy('id_maquina');

        foreach ($consumosPorCamion as $consumoCamion) {
            $idCamion = $consumoCamion['id_maquina'];
            $consumoCamionLitros = $consumoCamion['consumo_litros'];
            $consumoTotalOriginal += $consumoCamionLitros;

            // 🎯 OBTENER KM TOTALES DEL PERÍODO (desde nuestra query directa)
            $kmTotalesPeriodo = $kmPeriodoPorCamion[$idCamion]['km_totales_periodo'] ?? 0;

            // 🔍 VERIFICAR SI EL CAMIÓN TIENE VIAJES EN EL PERÍODO (lógica mejorada)
            $tieneViajes = ($kmTotalesPeriodo > 0) && isset($viajesPorCamion[$idCamion]) && 
                          $viajesPorCamion[$idCamion]['total_kilometros'] > 0;

            Log::info("🔍 Análisis individual camión {$idCamion}", [
                'km_totales_periodo' => $kmTotalesPeriodo,
                'datos_viajes_disponibles' => isset($viajesPorCamion[$idCamion]),
                'km_desde_datos_viajes' => isset($viajesPorCamion[$idCamion]) ? $viajesPorCamion[$idCamion]['total_kilometros'] : 0,
                'tiene_viajes_determinado' => $tieneViajes,
                'consumo_total' => $consumoCamionLitros
            ]);

            if ($tieneViajes) {
                // ✅ CASO 1: CAMIÓN CON VIAJES - Redistribuir TODO su consumo según destino de viajes
                $datosViajeCamion = $viajesPorCamion[$idCamion];
                 Log::info("🚛 datiños", $datosViajeCamion);
                $desgloseFaenas = $datosViajeCamion['desglose_faenas'];
                
                $camionesConViajes[] = $idCamion;

                Log::info("🚛 Camión {$idCamion} CON VIAJES - redistribuyendo TODO el consumo según destinos", [
                    'consumo_total' => $consumoCamionLitros,
                    'km_totales' => $kmTotalesPeriodo,
                    'destinos' => collect($desgloseFaenas)->pluck('faena')->join(', ')
                ]);

                foreach ($desgloseFaenas as $faenaData) {
                    $faenaId = $faenaData['id_faena'];
                    $faenaNombre = $faenaData['faena'];
                    $kilometrosPadron = $faenaData['kilometros'];
                    
                    // Calcular porcentaje basado en KM del padrón vs KM totales del camión
                    $porcentajePadron = $kmTotalesPeriodo > 0 ? 
                        ($kilometrosPadron / $kmTotalesPeriodo) * 100 : 0;
                    $consumoAsignado = ($porcentajePadron / 100) * $consumoCamionLitros;

                    // Inicializar faena si no existe
                    if (!isset($distribucionPorFaena[$faenaId])) {
                        $distribucionPorFaena[$faenaId] = [
                            'faena_id' => $faenaId,
                            'faena_nombre' => $faenaNombre,
                            'consumo_asignado' => 0,
                            'total_viajes' => 0,
                            'total_kilometros' => 0,
                            'maquinas_operando' => [],
                            'camiones_detalle' => []
                        ];
                    }

                    $distribucionPorFaena[$faenaId]['consumo_asignado'] += $consumoAsignado;
                    $distribucionPorFaena[$faenaId]['total_viajes'] += $faenaData['viajes'];
                    $distribucionPorFaena[$faenaId]['total_kilometros'] += $kilometrosPadron;

                    $distribucionPorFaena[$faenaId]['camiones_detalle'][] = [
                        'id_camion' => $idCamion,
                        'nombre_camion' => $consumoCamion['nombre_maquina'],
                        'patente' => $consumoCamion['patente'],
                        'id_padron' => $faenaData['id_planta'],
                        'consumo_asignado' => round($consumoAsignado, 2),
                        'viajes' => $faenaData['viajes'],
                        'kilometros' => $kilometrosPadron,
                        'porcentaje' => round($porcentajePadron, 2),
                        'ruta' => $faenaNombre,
                        'consumo_total_camion' => $consumoCamionLitros,
                        'km_totales_camion' => $kmTotalesPeriodo,
                        'motivo' => 'REDISTRIBUIDO POR VIAJES - Todo el consumo redistribuido según destinos de viajes',
                        'tipo_distribucion' => 'CON_VIAJES',
                        'observacion' => 'Camión con viajes: consumo redistribuido independiente de dónde carga'
                    ];

                    if (!in_array($idCamion, $distribucionPorFaena[$faenaId]['maquinas_operando'])) {
                        $distribucionPorFaena[$faenaId]['maquinas_operando'][] = $idCamion;
                    }

                    Log::info("📍 Redistribuyendo a {$faenaNombre}: {$consumoAsignado}L ({$porcentajePadron}%)", [
                        'camion' => $idCamion,
                        'km_ruta' => $kilometrosPadron,
                        'km_totales' => $kmTotalesPeriodo
                    ]);
                }

            } else {
                // ✅ CASO 2: CAMIÓN SIN VIAJES - Asignar a faena(s) donde carga
                $consumosRealesCamion = $consumosRealesMap->get($idCamion, collect());

                Log::info("🏭 Camión {$idCamion} SIN VIAJES - analizando consumos en faena filtrada", [
                    'consumo_litros' => $consumoCamionLitros,
                    'faenas_carga_encontradas' => $consumosRealesCamion->pluck('nombre_faena')->join(', '),
                    'total_faenas_encontradas' => $consumosRealesCamion->count(),
                    'faena_filtro' => $idFaena
                ]);

                if ($consumosRealesCamion->isEmpty()) {
                    // Sin datos de consumo real EN LA FAENA FILTRADA, omitir camión
                    Log::info("⏭ Camión {$idCamion} sin consumos en faena filtrada ({$idFaena}), se omite de la distribución", [
                        'consumo_total_camion' => $consumoCamionLitros
                    ]);
                    continue;
                }

                // Agregar a la lista de camiones sin viajes solo si tiene consumos en la faena filtrada
                $camionesSinViajes[] = $idCamion;

                foreach ($consumosRealesCamion as $consumoRealFaena) {
                    $faenaId = $consumoRealFaena->id_faena;
                    $faenaNombre = $consumoRealFaena->nombre_faena;
                    $litrosConsumidos = $consumoRealFaena->litros_consumidos;

                    // Inicializar faena si no existe
                    if (!isset($distribucionPorFaena[$faenaId])) {
                        $distribucionPorFaena[$faenaId] = [
                            'faena_id' => $faenaId,
                            'faena_nombre' => $faenaNombre,
                            'consumo_asignado' => 0,
                            'total_viajes' => 0,
                            'total_kilometros' => 0,
                            'maquinas_operando' => [],
                            'camiones_detalle' => []
                        ];
                    }

                    $distribucionPorFaena[$faenaId]['consumo_asignado'] += $litrosConsumidos;

                    $distribucionPorFaena[$faenaId]['camiones_detalle'][] = [
                        'id_camion' => $idCamion,
                        'nombre_camion' => $consumoCamion['nombre_maquina'],
                        'patente' => $consumoCamion['patente'],
                        'consumo_asignado' => round($litrosConsumidos, 2),
                        'viajes' => 0, // Sin viajes
                        'kilometros' => 0, // Sin viajes
                        'porcentaje' => 100, // Todo el consumo de esa faena
                        'motivo' => 'ASIGNADO POR FAENA DE CARGA - Sin datos de viajes, asignación según consumo real por faena',
                        'consumo_real_faena' => round($litrosConsumidos, 2),
                        'tipo_distribucion' => 'SIN_VIAJES'
                    ];

                    if (!in_array($idCamion, $distribucionPorFaena[$faenaId]['maquinas_operando'])) {
                        $distribucionPorFaena[$faenaId]['maquinas_operando'][] = $idCamion;
                    }
                }
            }

            // Detalle del camión para resumen (solo si no fue omitido por filtro)
            if (($tieneViajes && in_array($idCamion, $camionesConViajes)) || 
                (!$tieneViajes && in_array($idCamion, $camionesSinViajes))) {
                
                $detalleRedistribucionPorCamion[] = [
                    'id_camion' => $idCamion,
                    'nombre_camion' => $consumoCamion['nombre_maquina'],
                    'patente' => $consumoCamion['patente'],
                    'consumo_original' => $consumoCamionLitros,
                    'km_totales_periodo' => $kmTotalesPeriodo,
                    'tiene_viajes' => $tieneViajes,
                    'tipo_distribucion' => $tieneViajes ? 'CON_VIAJES' : 'SIN_VIAJES',
                    'numero_rutas' => $tieneViajes ? count($viajesPorCamion[$idCamion]['desglose_faenas']) : 0,
                    'faenas_operacion' => $tieneViajes ? 
                        collect($viajesPorCamion[$idCamion]['desglose_faenas'])->pluck('id_planta')->unique()->toArray() :
                        $consumosRealesMap->get($idCamion, collect())->pluck('id_faena')->unique()->toArray()
                ];
            }
        }

        // Convertir maquinas_operando a count
        foreach ($distribucionPorFaena as &$faena) {
            $faena['maquinas_operando'] = count($faena['maquinas_operando']);
        }

        $value = array_sum(array_map(function($faena) use ($idFaena) {
    return $faena['faena_id'] == $idFaena ? $faena['consumo_asignado'] : 0;
}, $distribucionPorFaena));


        Log::info('🎉 DISTRIBUCIÓN MIXTA COMPLETADA', [
            'camiones_con_viajes' => count($camionesConViajes),
            'camiones_sin_viajes' => count($camionesSinViajes),
            'total_camiones' => count($consumosPorCamion),
            'faenas_involucradas' => count($distribucionPorFaena),
            'consumo_total_original' => $consumoTotalOriginal,
            
            'detalle_camiones' => [
                'con_viajes' => $camionesConViajes,
                'sin_viajes' => $camionesSinViajes
            ]
        ]);

        return [
            'tiene_distribucion' => true,
            'categorias_redistribuidas' => [[
                'id' => 7,
                'name' => 'Camion Tolva',
                'nombre' => 'Camion Tolva',
                'value' => round($value, 2),
                'maquinas_count' => count($consumosPorCamion),
                'tipo_medicion' => 'Kilometraje',
                'promedio_consumo' => count($consumosPorCamion) > 0
                    ? round($consumoTotalOriginal / count($consumosPorCamion), 2)
                    : 0,
                'total_registros' => array_sum(array_column($consumosPorCamion, 'total_registros')),
                'redistribucion_camion_tolva' => [
                    'tiene_redistribucion' => true,
                    'metodo_redistribucion' => 'logica_mixta_por_camion_individual',
                    'consumo_total_original' => $consumoTotalOriginal,
                    'total_camiones_unicos' => count($consumosPorCamion),
                    'camiones_con_viajes' => count($camionesConViajes),
                    'camiones_sin_viajes' => count($camionesSinViajes),
                    'distribucion_por_faena' => array_values($distribucionPorFaena),
                    'detalle_por_camion' => $detalleRedistribucionPorCamion,
                    'logica_aplicada' => [
                        'descripcion' => 'Lógica mixta: camiones con viajes → distribución por destinos; camiones sin viajes → asignación por faena de carga',
                        'camiones_detalle' => [
                            'con_viajes' => $camionesConViajes,
                            'sin_viajes' => $camionesSinViajes
                        ]
                    ]
                ]
            ]],
            'info' => [
                'tiene_redistribucion' => true,
                'metodo_redistribucion' => 'logica_mixta_por_camion_individual',
                'consumo_total_original' => $consumoTotalOriginal,
                'total_camiones' => count($consumosPorCamion),
                'distribucion_mixta' => [
                    'camiones_con_viajes' => count($camionesConViajes),
                    'camiones_sin_viajes' => count($camionesSinViajes)
                ]
            ]
        ];

    } catch (\Exception $e) {
        Log::error('Error en obtenerDistribucionViajesCamionTolva con lógica mixta', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return [
            'tiene_distribucion' => false,
            'info' => [
                'tiene_redistribucion' => false,
                'motivo' => 'Error obteniendo distribución: ' . $e->getMessage()
            ]
        ];
    }
}

}
