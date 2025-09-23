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
                'factor_aplicado' => 0.5,
                'valor_original' => $totalCamionetas
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
                $valorFinal += $faena['consumo_total'] * 0.5;
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
     * 🔧 MÉTODO AUXILIAR: Crear distribución cuando no hay viajes
     */
    private function crearDistribucionSinViajes($consumosPorCamion)
    {
        $distribucionPorFaena = [];
        $consumoTotalOriginal = 0;
        $faenaDefecto = 1;

        foreach ($consumosPorCamion as $consumoCamion) {
            $consumoTotalOriginal += $consumoCamion['consumo_litros'];

            if (!isset($distribucionPorFaena[$faenaDefecto])) {
                $distribucionPorFaena[$faenaDefecto] = [
                    'faena_id' => $faenaDefecto,
                    'faena_nombre' => "Sin datos de viajes",
                    'consumo_asignado' => 0,
                    'total_viajes' => 0,
                    'total_kilometros' => 0,
                    'maquinas_operando' => [],
                    'camiones_detalle' => []
                ];
            }

            $distribucionPorFaena[$faenaDefecto]['consumo_asignado'] += $consumoCamion['consumo_litros'];
            $distribucionPorFaena[$faenaDefecto]['camiones_detalle'][] = [
                'id_camion' => $consumoCamion['id_maquina'],
                'nombre_camion' => $consumoCamion['nombre_maquina'],
                'patente' => $consumoCamion['patente'],
                'consumo_asignado' => $consumoCamion['consumo_litros'],
                'viajes' => 0,
                'kilometros' => 0,
                'porcentaje' => 100,
                'motivo' => 'Sin datos de viajes - asignación completa'
            ];

            $distribucionPorFaena[$faenaDefecto]['maquinas_operando'][] = $consumoCamion['id_maquina'];
        }

        $distribucionPorFaena[$faenaDefecto]['maquinas_operando'] = count($distribucionPorFaena[$faenaDefecto]['maquinas_operando']);
        // 🔹 Calcular consumo total redistribuido (suma de consumo_asignado en todas las faenas)
        $consumoTotalRedistribuido = array_sum(array_column($distribucionPorFaena, 'consumo_asignado'));

        return [
            'tiene_distribucion' => true,
            'categorias_redistribuidas' => [[
                'id' => 7,
                'name' => 'Camion Tolva',
                'nombre' => 'Camion Tolva',
                'value' => round($consumoTotalRedistribuido, 2),
                'redistribucion_camion_tolva' => [
                    'tiene_redistribucion' => false,
                    'motivo_redistribucion' => 'No hay datos de viajes en el período',
                    'distribucion_por_faena' => array_values($distribucionPorFaena)
                ]
            ]],
            'info' => [
                'tiene_redistribucion' => false,
                'motivo' => 'No hay datos de viajes para redistribución'
            ]
        ];
    }

    /**
     * 🎨 MÉTODO AUXILIAR: Crear tabla estilo camiones (como tu ejemplo)
     */
    private function crearTablaEstiloCamiones($detallesCamiones, $distribucionPorFaena)
    {
        $tablaCamiones = [];

        foreach ($detallesCamiones as $camion) {
            if ($camion['total_km_camion'] <= 0) continue; // Saltar camiones sin viajes

            $idCamion = $camion['id_camion'];
            $rutasDelCamion = [];

            // Buscar todas las rutas de este camión
            foreach ($distribucionPorFaena as $faena) {
                foreach ($faena['camiones_detalle'] as $detalle) {
                    if ($detalle['id_camion'] == $idCamion) {
                        $rutasDelCamion[] = [
                            'ruta' => $detalle['ruta'],
                            'viajes' => $detalle['viajes'],
                            'kilometros' => $detalle['kilometros'],
                            'porcentaje' => $detalle['porcentaje'],
                            'litros' => $detalle['consumo_asignado']
                        ];
                    }
                }
            }

            $tablaCamiones[] = [
                'nombre_camion' => $camion['nombre_camion'],
                'patente' => $camion['patente'],
                'consumo_total' => $camion['consumo_original'] . ' ltrs',
                'total_km' => $camion['total_km_camion'],
                'rutas' => $rutasDelCamion
            ];
        }

        return $tablaCamiones;
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
     * 🔧 MÉTODO ACTUALIZADO: obtenerDistribucionViajesCamionTolva
     * Ahora usa kilómetros totales del período filtrado (no históricos)
     */
   private function obtenerDistribucionViajesCamionTolva($fechaInicio, $fechaFin, $idFaena, $request)
{
    try {
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

        // 3️⃣ Obtener datos de viajes del período (para el desglose por ruta)
        $requestViajes = new Request([
            'fecha_inicio' => $fechaInicio->format('Y-m-d'),
            'fecha_fin' => $fechaFin->format('Y-m-d'),
            'id_faena' => $idFaena
        ]);

        $responseViajes = $this->obtenerViajesDistanciasCamionesTolva($requestViajes);
        $datosViajes = json_decode($responseViajes->getContent(), true);

        if (!$datosViajes['success'] || empty($datosViajes['data']['resumen_por_maquina'])) {
            return $this->crearDistribucionSinViajes($consumosPorCamion);
        }

        // 4️⃣ Procesar datos con KM TOTALES DEL PERÍODO CORRECTOS
        $resumenPorMaquina = $datosViajes['data']['resumen_por_maquina'];

        $distribucionPorFaena = [];
        $consumoTotalOriginal = 0;
        $detalleRedistribucionPorCamion = [];

        foreach ($consumosPorCamion as $consumoCamion) {
            $idCamion = $consumoCamion['id_maquina'];
            $consumoCamionLitros = $consumoCamion['consumo_litros'];
            $consumoTotalOriginal += $consumoCamionLitros;

            // 🎯 OBTENER KM TOTALES DEL PERÍODO (desde nuestra nueva query)
            $kmTotalesPeriodo = $kmPeriodoPorCamion[$idCamion]['km_totales_periodo'] ?? 0;

            // Buscar datos de viajes del período (para desglose por rutas)
            $datosViajeCamion = collect($resumenPorMaquina)->firstWhere('id_maquina', $idCamion);

            if (!$datosViajeCamion || $datosViajeCamion['total_kilometros'] <= 0) {
                // 🚫 Sin viajes en el período → no redistribuir nada
                Log::info("⏭ Camión {$idCamion} sin viajes en el período, se omite redistribución", [
                    'consumo_litros' => $consumoCamionLitros,
                    'km_totales_periodo' => $kmTotalesPeriodo
                ]);
                continue; // 🔥 Pasamos al siguiente camión
            }

            $desgloseFaenas = $datosViajeCamion['desglose_faenas'];

            // ✅ Verificar que coincidan los KM totales
            $totalKmDesglose = collect($desgloseFaenas)->sum('kilometros');

            Log::info("🚛 DEBUG KM Totales vs Desglose - Camión {$idCamion}", [
                'km_totales_query_directa' => $kmTotalesPeriodo,
                'km_totales_desglose_rutas' => $totalKmDesglose,
                'coinciden' => $kmTotalesPeriodo == $totalKmDesglose,
                'consumo_litros' => $consumoCamionLitros,
                'rutas_periodo' => collect($desgloseFaenas)->map(function ($f) {
                    return [
                        'faena' => $f['faena'],
                        'planta' => $f['planta'],
                        'viajes' => $f['viajes'],
                        'km' => $f['kilometros']
                    ];
                })
            ]);

            foreach ($desgloseFaenas as $faenaData) {
                $faenaId = $faenaData['id_planta'];
                $faenaNombre = $faenaData['faena'] . ' → ' . $faenaData['planta'];

                // 🧮 CALCULAR PORCENTAJE basado en KM totales del período
                $kilometrosPadron = $faenaData['kilometros'];
                $porcentajePadron = $kmTotalesPeriodo > 0
                    ? round(($kilometrosPadron / $kmTotalesPeriodo) * 100, 2)
                    : 0;

                // 💰 CALCULAR CONSUMO ASIGNADO
                $consumoAsignado = $kmTotalesPeriodo > 0
                    ? round(($kilometrosPadron / $kmTotalesPeriodo) * $consumoCamionLitros, 2)
                    : round($consumoCamionLitros / count($desgloseFaenas), 2);

                Log::info("📊 Cálculo padrón CORREGIDO", [
                    'camion' => $idCamion,
                    'ruta' => $faenaNombre,
                    'km_padron' => $kilometrosPadron,
                    'km_totales_periodo' => $kmTotalesPeriodo,
                    'porcentaje' => $porcentajePadron,
                    'consumo_camion' => $consumoCamionLitros,
                    'consumo_asignado' => $consumoAsignado
                ]);

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

                // Acumular totales
                $distribucionPorFaena[$faenaId]['consumo_asignado'] += $consumoAsignado;
                $distribucionPorFaena[$faenaId]['total_viajes'] += $faenaData['viajes'];
                $distribucionPorFaena[$faenaId]['total_kilometros'] += $faenaData['kilometros'];

                // ✅ DETALLE CON KM TOTALES CORRECTOS DEL PERÍODO
                $distribucionPorFaena[$faenaId]['camiones_detalle'][] = [
                    'id_camion' => $idCamion,
                    'nombre_camion' => $consumoCamion['nombre_maquina'],
                    'patente' => $consumoCamion['patente'],
                    'id_padron' => $faenaData['id_planta'],
                    'consumo_asignado' => $consumoAsignado,
                    'viajes' => $faenaData['viajes'],
                    'kilometros' => $kilometrosPadron,
                    'porcentaje' => $porcentajePadron,
                    'ruta' => $faenaNombre,
                    'consumo_total_camion' => $consumoCamionLitros,
                    'km_totales_camion' => $kmTotalesPeriodo,
                    'motivo' => 'Redistribución proporcional por kilómetros totales del período'
                ];

                if (!in_array($idCamion, $distribucionPorFaena[$faenaId]['maquinas_operando'])) {
                    $distribucionPorFaena[$faenaId]['maquinas_operando'][] = $idCamion;
                }
            }

            // Detalle del camión para resumen
            $detalleRedistribucionPorCamion[] = [
                'id_camion' => $idCamion,
                'nombre_camion' => $consumoCamion['nombre_maquina'],
                'patente' => $consumoCamion['patente'],
                'consumo_original' => $consumoCamionLitros,
                'km_totales_periodo' => $kmTotalesPeriodo,
                'numero_rutas' => count($datosViajeCamion['desglose_faenas']),
                'faenas_operacion' => collect($datosViajeCamion['desglose_faenas'])->pluck('id_planta')->unique()->toArray()
            ];
        }

        // Convertir maquinas_operando a count
        foreach ($distribucionPorFaena as &$faena) {
            $faena['maquinas_operando'] = count($faena['maquinas_operando']);
        }

        $consumoTotalRedistribuido = array_sum(array_column($distribucionPorFaena, 'consumo_asignado'));

        return [
            'tiene_distribucion' => true,
            'categorias_redistribuidas' => [[
                'id' => 7,
                'name' => 'Camion Tolva',
                'nombre' => 'Camion Tolva',
                'value' => round($consumoTotalRedistribuido, 2),
                'maquinas_count' => count($consumosPorCamion),
                'tipo_medicion' => 'Kilometraje',
                'promedio_consumo' => count($consumosPorCamion) > 0
                    ? round($consumoTotalOriginal / count($consumosPorCamion), 2)
                    : 0,
                'total_registros' => array_sum(array_column($consumosPorCamion, 'total_registros')),
                'redistribucion_camion_tolva' => [
                    'tiene_redistribucion' => true,
                    'metodo_redistribucion' => 'km_totales_periodo_filtrado',
                    'consumo_total_original' => $consumoTotalOriginal,
                    'total_camiones_unicos' => count($consumosPorCamion),
                    'distribucion_por_faena' => array_values($distribucionPorFaena),
                    'detalle_por_camion' => $detalleRedistribucionPorCamion
                ]
            ]],
            'info' => [
                'tiene_redistribucion' => true,
                'metodo_redistribucion' => 'km_totales_periodo_filtrado',
                'consumo_total_original' => $consumoTotalOriginal,
                'total_camiones' => count($consumosPorCamion)
            ]
        ];
    } catch (\Exception $e) {
        Log::error('Error en obtenerDistribucionViajesCamionTolva con KM período', [
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
