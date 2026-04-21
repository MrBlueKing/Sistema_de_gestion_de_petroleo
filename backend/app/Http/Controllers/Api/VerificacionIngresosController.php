<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consumo;
use App\Models\Maquinas;
use App\Models\IngresoPetroleo;
use App\Models\VerificacionAltura;
use App\Models\Estanque;
use App\Models\StockPetroleo;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VerificacionIngresosController extends Controller
{
    /**
     * 🔧 COMBINADO FINAL: Paginación + Filtros + Lógica correcta SIN campo 'nombre'
     */
    public function index(Request $request)
    {
        try {
            Log::info('🔍 VerificacionIngresos::index iniciado', $request->all());

            // Parámetros de paginación y filtros
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);
            $fechaDesde = $request->input('fecha_desde');
            $fechaHasta = $request->input('fecha_hasta');
            $idFaena = $request->input('id_faena');
            $numeroGuia = $request->input('numero_guia');

            // Query base con relaciones CORRECTAS (sin 'nombre' en faenas)
            $query = IngresoPetroleo::with([
                'faena:id_faena,ubicacion',
                'usuario:id,nombre',
                'verificacionesAltura.estanque:id_estanque,nombre'
            ]);

            // Aplicar filtros
            if ($fechaDesde) {
                $query->whereDate('created_at', '>=', $fechaDesde);
                Log::info('✅ Filtro fecha_desde aplicado', ['fecha_desde' => $fechaDesde]);
            }

            if ($fechaHasta) {
                $query->whereDate('created_at', '<=', $fechaHasta);
                Log::info('✅ Filtro fecha_hasta aplicado', ['fecha_hasta' => $fechaHasta]);
            }

            if ($idFaena && $idFaena !== 'todas' && $idFaena !== 'null') {
                $query->where('id_faena', $idFaena);
                Log::info('✅ Filtro id_faena aplicado', ['id_faena' => $idFaena]);
            }

            if ($numeroGuia) {
                $query->where('numero_guia', 'like', '%' . $numeroGuia . '%');
                Log::info('✅ Filtro numero_guia aplicado', ['numero_guia' => $numeroGuia]);
            }

            // Obtener total para paginación
            $total = $query->count();
            Log::info('📊 Total de registros encontrados', ['total' => $total]);

            // Aplicar paginación
            $ingresos = $query
                ->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            Log::info('📦 Registros obtenidos', ['count' => $ingresos->count()]);

            // Procesar cada ingreso con lógica correcta
            $ingresosConErrores = $ingresos->map(function ($ingreso) {
                return $this->calcularErroresIngreso($ingreso);
            });

            // Calcular metadatos de paginación
            $totalPages = ceil($total / $perPage);
            $hasNextPage = $page < $totalPages;
            $hasPrevPage = $page > 1;

            $response = [
                'success' => true,
                'data' => $ingresosConErrores,
                'pagination' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'total_pages' => $totalPages,
                    'has_next_page' => $hasNextPage,
                    'has_prev_page' => $hasPrevPage,
                    'from' => ($page - 1) * $perPage + 1,
                    'to' => min($page * $perPage, $total)
                ]
            ];

            Log::info('✅ Respuesta preparada exitosamente', [
                'total_registros' => $total,
                'pagina_actual' => $page,
                'total_paginas' => $totalPages
            ]);

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('❌ Error en VerificacionIngresos::index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_params' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los datos de verificación'
            ], 500);
        }
    }

    /**
     * Calcular errores para un ingreso específico - LÓGICA QUE FUNCIONA
     */
    private function calcularErroresIngreso($ingreso)
    {
        try {
            Log::info('🔍 Procesando ingreso', [
                'id_ingreso' => $ingreso->id_ingreso,
                'numero_guia' => $ingreso->numero_guia
            ]);

            $errorInicialTotal = 0;
            $erroresPorEstanque = [];

            // Agrupar verificaciones por estanque (LÓGICA QUE FUNCIONA)
            $verificacionesPorEstanque = $ingreso->verificacionesAltura->groupBy('id_estanque');

            Log::info('🔍 Verificaciones encontradas', [
                'total_verificaciones' => $ingreso->verificacionesAltura->count(),
                'estanques_con_verificaciones' => $verificacionesPorEstanque->count()
            ]);

            foreach ($verificacionesPorEstanque as $idEstanque => $verificaciones) {
                if ($verificaciones->count() >= 2) {
                    // Ordenar por id para asegurar que tenemos inicial y final en orden
                    $verificacionesOrdenadas = $verificaciones->sortBy('id_verificacion')->values();

                    $verificacionInicial = $verificacionesOrdenadas[0];
                    $verificacionFinal = $verificacionesOrdenadas[1];

                    // Calcular usando los campos CORRECTOS
                    $stockSistema = $verificacionInicial->stock_inicial;
                    $stockMedicionInicial = $verificacionInicial->volumen_calculado;
                    $stockMedicionFinal = $verificacionFinal->volumen_calculado;

                    // Calcular error inicial: diferencia entre stock sistema y medición inicial
                    $errorInicial = $stockMedicionInicial - $stockSistema;

                    // Calcular litros agregados
                    $litrosAgregados = $stockMedicionFinal - $stockMedicionInicial;

                    $errorInicialTotal += $errorInicial;

                    $erroresPorEstanque[] = [
                        'id_estanque' => $idEstanque,
                        'nombre_estanque' => $verificacionInicial->estanque->nombre,
                        'stock_sistema' => round($stockSistema, 2),
                        'medicion_inicial' => round($stockMedicionInicial, 2),
                        'medicion_final' => round($stockMedicionFinal, 2),
                        'error_inicial' => round($errorInicial, 2),
                        'litros_agregados' => round($litrosAgregados, 2),
                        'altura_inicial' => $verificacionInicial->altura_medicion,
                        'altura_final' => $verificacionFinal->altura_medicion,
                        'altura_texto' => $verificacionInicial->altura_medicion && $verificacionFinal->altura_medicion
                            ? "{$verificacionInicial->altura_medicion} → {$verificacionFinal->altura_medicion}"
                            : 'N/A'
                    ];

                    Log::info('✅ Estanque procesado', [
                        'estanque' => $verificacionInicial->estanque->nombre,
                        'error_inicial' => $errorInicial,
                        'litros_agregados' => $litrosAgregados
                    ]);
                } else {
                    Log::warning('⚠️ Estanque con verificaciones insuficientes', [
                        'id_estanque' => $idEstanque,
                        'verificaciones_count' => $verificaciones->count()
                    ]);
                }
            }

            // Error final: diferencia entre litros recibidos y documentados
            $errorFinal = ($ingreso->litros_recibidos ?? 0) - ($ingreso->litros_documentados ?? 0);

            // Mapear información de faena (solo ubicacion, NO nombre)
            $nombreFaena = $ingreso->faena->ubicacion ?? 'Faena ' . $ingreso->id_faena;
            $faenaInfo = [
                'id' => $ingreso->id_faena,
                'nombre' => $nombreFaena,
                'ubicacion' => $ingreso->faena->ubicacion ?? null
            ];

            // Stock inicial del sistema
            $stockInicialTotal = floatval($ingreso->stock_inicial ?? 0);

            // Error inicial total (acumulado de estanques)
            $errorInicialTotal = round($errorInicialTotal, 2);

            // 👉 Stock real inicial = stock sistema + error inicial total
            $stockRealInicial = $stockInicialTotal + $errorInicialTotal;

            // Litros recibidos
            $litrosRecibidos = floatval($ingreso->litros_recibidos ?? 0);

            // 👉 Stock final total = stock real inicial + litros recibidos
            $stockFinalTotal = $stockRealInicial + $litrosRecibidos;



            $resultado = [
                'id_ingreso' => $ingreso->id_ingreso,
                'numero_guia' => $ingreso->numero_guia,
                'litros_documentados' => floatval($ingreso->litros_documentados ?? 0),
                'litros_recibidos' => floatval($ingreso->litros_recibidos ?? 0),
                'fecha_ingreso' => $ingreso->created_at->format('Y-m-d'),
                'hora_ingreso' => $ingreso->created_at->format('H:i'),
                'faena' => $faenaInfo,
                'id_faena' => $ingreso->id_faena,
                'usuario' => $ingreso->usuario->nombre ?? 'Sin asignar',
                'stock_inicial_total' => $stockRealInicial,
                'stock_final_total' => $stockFinalTotal,
                'diferencia_guia' => floatval($ingreso->diferencia ?? 0),
                'error_final' => round($errorFinal, 2),
                'error_inicial_total' => round($errorInicialTotal, 2),
                'errores_por_estanque' => $erroresPorEstanque,
                'observacion' => $ingreso->observacion,
                'recibo_conforme' => $ingreso->recibo_conforme ?? true
            ];

            Log::info('✅ Ingreso procesado completamente', [
                'id_ingreso' => $ingreso->id_ingreso,
                'estanques_procesados' => count($erroresPorEstanque),
                'error_inicial_total' => $errorInicialTotal,
                'error_final' => $errorFinal
            ]);

            return $resultado;
        } catch (\Exception $e) {
            Log::error('❌ Error al calcular errores para ingreso', [
                'id_ingreso' => $ingreso->id_ingreso ?? 'N/A',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Retornar datos básicos en caso de error
            return [
                'id_ingreso' => $ingreso->id_ingreso,
                'numero_guia' => $ingreso->numero_guia,
                'litros_documentados' => floatval($ingreso->litros_documentados ?? 0),
                'litros_recibidos' => floatval($ingreso->litros_recibidos ?? 0),
                'fecha_ingreso' => $ingreso->created_at->format('Y-m-d'),
                'hora_ingreso' => $ingreso->created_at->format('H:i'),
                'faena' => [
                    'id' => $ingreso->id_faena,
                    'nombre' => 'Faena ' . $ingreso->id_faena,
                    'ubicacion' => null
                ],
                'id_faena' => $ingreso->id_faena,
                'usuario' => 'Sin asignar',
                'stock_inicial_total' => 0,
                'diferencia_guia' => 0,
                'error_final' => 0,
                'error_inicial_total' => 0,
                'errores_por_estanque' => [],
                'observacion' => $ingreso->observacion,
                'recibo_conforme' => true
            ];
        }
    }

    /**
     * Resumen con filtro de número de guía
     */
    public function resumen(Request $request)
    {
        try {
            Log::info('📊 VerificacionIngresos::resumen iniciado', $request->all());

            $fechaDesde = $request->input('fecha_desde');
            $fechaHasta = $request->input('fecha_hasta');
            $idFaena = $request->input('id_faena');
            $numeroGuia = $request->input('numero_guia');

            $query = IngresoPetroleo::with(['verificacionesAltura']);

            // Aplicar filtros
            if ($fechaDesde) {
                $query->whereDate('created_at', '>=', $fechaDesde);
            }

            if ($fechaHasta) {
                $query->whereDate('created_at', '<=', $fechaHasta);
            }

            if ($idFaena && $idFaena !== 'todas' && $idFaena !== 'null') {
                $query->where('id_faena', $idFaena);
            }

            if ($numeroGuia) {
                $query->where('numero_guia', 'like', '%' . $numeroGuia . '%');
                Log::info('✅ Filtro numero_guia aplicado en resumen', ['numero_guia' => $numeroGuia]);
            }

            $ingresos = $query->get();

            // Calcular estadísticas
            $totalIngresos = $ingresos->count();
            $totalLitrosDocumentados = $ingresos->sum('litros_documentados');
            $totalLitrosRecibidos = $ingresos->sum('litros_recibidos');
            $errorFinalTotal = $totalLitrosRecibidos - $totalLitrosDocumentados;

            // Calcular errores iniciales usando la misma lógica
            $errorInicialAcumulado = 0;
            $ingresosConError = 0;
            $ingresosSinError = 0;

            foreach ($ingresos as $ingreso) {
                $errorData = $this->calcularErroresIngreso($ingreso);
                $errorInicialAcumulado += $errorData['error_inicial_total'];

                if (abs($errorData['error_inicial_total']) > 0.01 || abs($errorData['error_final']) > 0.01) {
                    $ingresosConError++;
                } else {
                    $ingresosSinError++;
                }
            }

            $porcentajePrecision = $totalIngresos > 0
                ? round(($errorFinalTotal / $totalLitrosDocumentados) * 100, 2)
                : 100;

            $response = [
                'success' => true,
                'data' => [
                    'total_ingresos' => $totalIngresos,
                    'total_litros_documentados' => round($totalLitrosDocumentados, 2),
                    'total_litros_recibidos' => round($totalLitrosRecibidos, 2),
                    'error_final_acumulado' => round($errorFinalTotal, 2),
                    'error_inicial_acumulado' => round($errorInicialAcumulado, 2),
                    'ingresos_con_error' => $ingresosConError,
                    'ingresos_sin_error' => $ingresosSinError,
                    'porcentaje_precision' => $porcentajePrecision
                ],
                'message' => 'Resumen calculado exitosamente'
            ];

            Log::info('✅ Resumen calculado exitosamente', $response['data']);
            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('❌ Error al calcular resumen de verificaciones', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al calcular el resumen'
            ], 500);
        }
    }

    /**
     * Obtener detalle de un ingreso específico
     */
    public function show($id)
    {
        try {
            $ingreso = IngresoPetroleo::with([
                'faena:id_faena,ubicacion',
                'usuario:id,nombre',
                'verificacionesAltura.estanque'
            ])->findOrFail($id);

            $ingresoConErrores = $this->calcularErroresIngreso($ingreso);

            return response()->json([
                'success' => true,
                'data' => $ingresoConErrores
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener detalle de ingreso', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el detalle del ingreso'
            ], 500);
        }
    }


    // 🆕 AGREGAR ESTE MÉTODO AL VerificacionIngresosController.php

    /**
     * Calcula el stock disponible en una fecha específica considerando:
     * - Stock inicial del período anterior
     * - Recepciones del período (+ errores iniciales como ajustes)
     * - Consumos del período
     * - Orden cronológico de movimientos
     */

    /**
     * 🆕 MÉTODO PRINCIPAL ACTUALIZADO
     * Integra la nueva lógica de stock inicial mejorado
     */
    public function calcularStockEnFecha(Request $request)
    {
        try {
            $idFaena = $request->input('id_faena');
            $fechaObjetivo = Carbon::parse($request->input('fecha_objetivo'));
            $fechaInicioPeriodo = Carbon::parse($request->input('fecha_inicio_periodo'));

            Log::info('🚀 Iniciando cálculo de stock con lógica mejorada', [
                'id_faena' => $idFaena,
                'fecha_objetivo' => $fechaObjetivo->format('Y-m-d H:i:s'),
                'fecha_inicio_periodo' => $fechaInicioPeriodo->format('Y-m-d H:i:s')
            ]);

            // 1. 📈 OBTENER STOCK INICIAL CON LÓGICA MEJORADA
            $stockInicial = $this->obtenerStockInicial($idFaena, $fechaInicioPeriodo, $fechaObjetivo);

            Log::info('📊 Stock inicial calculado', [
                'stock_inicial' => $stockInicial,
                'metodo' => 'mejorado_con_dos_escenarios'
            ]);

            // 2. 🛢️ OBTENER RECEPCIONES HASTA LA FECHA OBJETIVO
            $recepcionesDatos = $this->obtenerRecepcionesHastaFecha($idFaena, $fechaInicioPeriodo, $fechaObjetivo);

            // 3. ⛽ OBTENER CONSUMOS HASTA LA FECHA OBJETIVO
            $consumosDatos = $this->obtenerConsumosHastaFecha($idFaena, $fechaInicioPeriodo, $fechaObjetivo);

            // 4. 🔄 PROCESAR CRONOLÓGICAMENTE Y CALCULAR STOCK FINAL
            $stockCalculado = $this->procesarMovimientosCronologicos(
                $stockInicial,
                $recepcionesDatos,
                $consumosDatos,
                $fechaObjetivo
            );

            // 5. 📊 USAR ERRORES AJUSTADOS
            $erroresAjustados = $stockCalculado['total_errores_iniciales_ajustados'];

            // 6. 📋 PREPARAR RESUMEN DETALLADO
            $resumen = [
                'stock_inicial_periodo' => $stockInicial, // 🆕 Ahora calculado con lógica mejorada
                'recepciones' => $recepcionesDatos,
                'consumos' => $consumosDatos,
                'stock_final_calculado' => $stockCalculado['stock_final'],
                'fecha_objetivo' => $fechaObjetivo->format('Y-m-d H:i:s'),
                'fecha_inicio_periodo' => $fechaInicioPeriodo->format('Y-m-d H:i:s'),
                'id_faena' => $idFaena,
                'resumen_movimientos' => $stockCalculado['movimientos_procesados'],
                'totales' => [
                    'total_recepciones' => $recepcionesDatos['total_litros_recibidos'],
                    'total_errores_iniciales' => $erroresAjustados,
                    'total_consumos' => $consumosDatos['total_litros_consumidos'],
                    'diferencia_neta' => $stockCalculado['stock_final'] - $stockInicial,
                    'carga_actual' => [
                        'identificada' => $stockCalculado['metadata']['es_carga_actual'],
                        'hay_consumos_antes' => $stockCalculado['metadata']['hay_consumos_antes_primera_recepcion']
                    ]
                ],
                // 🆕 METADATA ADICIONAL PARA DEBUGGING
                'debug_stock_inicial' => [
                    'metodo_calculo' => $stockCalculado['metadata']['es_carga_actual'] ? 'escenario_1_carga_actual' : 'escenario_2_reconstruccion_historica',
                    'stock_inicial_calculado' => $stockInicial,
                    'es_carga_actual_en_periodo' => $stockCalculado['metadata']['es_carga_actual']
                ]
            ];

            Log::info('✅ Stock calculado exitosamente con método mejorado', [
                'stock_inicial' => $stockInicial,
                'stock_final' => $stockCalculado['stock_final'],
                'movimientos_procesados' => count($stockCalculado['movimientos_procesados']),
                'metodo_stock_inicial' => $stockCalculado['metadata']['es_carga_actual'] ? 'Escenario 1' : 'Escenario 2'
            ]);

            return response()->json([
                'success' => true,
                'data' => $resumen,
                'message' => 'Stock calculado correctamente con lógica mejorada'
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error calculando stock con método mejorado', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al calcular stock: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Verifica si existe una "carga actual" en el período consultado
     */
    private function verificarCargaActualEnPeriodo($idFaena, $fechaInicioPeriodo, $fechaObjetivo)
    {
        // Obtener todos los movimientos del período
        $recepciones = IngresoPetroleo::where('id_faena', $idFaena)
            ->where('created_at', '>=', $fechaInicioPeriodo)
            ->where('created_at', '<=', $fechaObjetivo)
            ->orderBy('created_at', 'asc')
            ->get();

        $consumos = Consumo::where('id_faena', $idFaena)
            ->where('fecha_consumo', '>=', $fechaInicioPeriodo)
            ->where('fecha_consumo', '<=', $fechaObjetivo)
            ->orderBy('fecha_consumo', 'asc')
            ->get();

        // Combinar y ordenar cronológicamente
        $todosMovimientos = [];

        foreach ($recepciones as $recepcion) {
            $todosMovimientos[] = [
                'tipo' => 'recepcion',
                'fecha_hora' => $recepcion->created_at,
                'datos' => $this->calcularErroresIngreso($recepcion)
            ];
        }

        foreach ($consumos as $consumo) {
            $todosMovimientos[] = [
                'tipo' => 'consumo',
                'fecha_hora' => $consumo->fecha_consumo
            ];
        }

        // Ordenar cronológicamente
        usort($todosMovimientos, function ($a, $b) {
            return $a['fecha_hora']->timestamp <=> $b['fecha_hora']->timestamp;
        });

        // Verificar si la primera recepción es "carga actual"
        $primeraRecepcionIndex = null;
        foreach ($todosMovimientos as $index => $movimiento) {
            if ($movimiento['tipo'] === 'recepcion') {
                $primeraRecepcionIndex = $index;
                break;
            }
        }

        if ($primeraRecepcionIndex === null) {
            return ['es_carga_actual' => false, 'primera_recepcion' => null];
        }

        // Verificar si hay consumos antes de la primera recepción
        $hayConsumosAntes = false;
        for ($i = 0; $i < $primeraRecepcionIndex; $i++) {
            if ($todosMovimientos[$i]['tipo'] === 'consumo') {
                $hayConsumosAntes = true;
                break;
            }
        }

        $esCargaActual = !$hayConsumosAntes;

        return [
            'es_carga_actual' => $esCargaActual,
            'primera_recepcion' => $esCargaActual ? $todosMovimientos[$primeraRecepcionIndex]['datos'] : null
        ];
    }

    /**
     * 🆕 RECONSTRUYE el stock inicial cuando NO hay carga actual en el período
     * Implementa la lógica compleja solicitada
     */
    private function reconstruirStockInicialHistorico($idFaena, $fechaInicioPeriodo)
    {
        Log::info('🔧 Iniciando reconstrucción histórica de stock inicial');

        // PASO 1: Buscar la última "carga actual" ANTES del período
        $ultimaCargaAnterior = $this->buscarUltimaCargaActualAnterior($idFaena, $fechaInicioPeriodo);

        if (!$ultimaCargaAnterior) {
            Log::warning('⚠️ No se encontró carga anterior, usando stock general de faena');
            $stockGeneral = StockPetroleo::where('id_faena', $idFaena)->first();
            return $stockGeneral ? $stockGeneral->stock_inicial : 0;
        }

        Log::info('📍 Carga anterior encontrada', [
            'id_ingreso' => $ultimaCargaAnterior['id_ingreso'],
            'fecha_carga' => $ultimaCargaAnterior['fecha_ingreso'],
            'numero_guia' => $ultimaCargaAnterior['numero_guia']
        ]);

        // PASO 2: Calcular stock inicial de esa carga previa
        $stockInicialCargaPrevia = $ultimaCargaAnterior['error_inicial_total'] + $ultimaCargaAnterior['stock_inicial_sistema'];

        // PASO 3: Obtener TODAS las recepciones desde esa fecha hasta inicio del período
        $recepcionesIntermedias = IngresoPetroleo::where('id_faena', $idFaena)
            ->where('created_at', '>', Carbon::parse($ultimaCargaAnterior['fecha_ingreso']))
            ->where('created_at', '<', $fechaInicioPeriodo)
            ->get();

        $totalLitrosRecibidosIntermedios = 0;
        foreach ($recepcionesIntermedias as $recepcion) {
            $datosRecepcion = $this->calcularErroresIngreso($recepcion);
            $totalLitrosRecibidosIntermedios += $datosRecepcion['litros_recibidos'];
        }

        // PASO 4: Obtener TODOS los consumos desde esa fecha hasta inicio del período
        $consumosIntermedios = Consumo::where('id_faena', $idFaena)
            ->where('fecha_consumo', '>', Carbon::parse($ultimaCargaAnterior['fecha_ingreso']))
            ->where('fecha_consumo', '<', $fechaInicioPeriodo)
            ->sum('litros_consumidos');

        // PASO 5: Calcular stock inicial del período
        $stockInicialCalculado = $stockInicialCargaPrevia + $totalLitrosRecibidosIntermedios - $consumosIntermedios;

        Log::info('✅ Stock inicial reconstruido', [
            'stock_inicial_carga_previa' => $stockInicialCargaPrevia,
            'litros_recibidos_intermedios' => $totalLitrosRecibidosIntermedios,
            'litros_consumidos_intermedios' => $consumosIntermedios,
            'stock_inicial_calculado' => $stockInicialCalculado,
            'formula' => "({$stockInicialCargaPrevia} + {$totalLitrosRecibidosIntermedios} - {$consumosIntermedios}) = {$stockInicialCalculado}"
        ]);

        return $stockInicialCalculado;
    }

    /**
     * Busca la última "carga actual" antes del período consultado
     */
    private function buscarUltimaCargaActualAnterior($idFaena, $fechaInicioPeriodo)
    {
        // Buscar recepciones anteriores al período, en orden descendente
        $recepcionesAnteriores = IngresoPetroleo::where('id_faena', $idFaena)
            ->where('created_at', '<', $fechaInicioPeriodo)
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($recepcionesAnteriores as $recepcion) {
            // Para cada recepción, verificar si fue una "carga actual"
            $fechaRecepcion = $recepcion->created_at;

            // Buscar si hubo consumos ANTES de esta recepción el mismo día o periodo cercano
            $consumosAntesDeEstaRecepcion = Consumo::where('id_faena', $idFaena)
                ->where('fecha_consumo', '<', $fechaRecepcion)
                ->where('fecha_consumo', '>=', $fechaRecepcion->copy()->subDays(1)) // Buscar en un día anterior
                ->count();

            // Si no hubo consumos inmediatamente antes, considerarla como "carga actual"
            if ($consumosAntesDeEstaRecepcion == 0) {
                $datosRecepcion = $this->calcularErroresIngreso($recepcion);

                Log::info('✅ Última carga actual encontrada', [
                    'id_ingreso' => $recepcion->id_ingreso,
                    'fecha' => $fechaRecepcion->format('Y-m-d H:i:s'),
                    'numero_guia' => $recepcion->numero_guia,
                    'consumos_antes' => $consumosAntesDeEstaRecepcion
                ]);

                return $datosRecepcion;
            }
        }

        Log::warning('⚠️ No se encontró ninguna carga actual anterior');
        return null;
    }



    /**
     * Obtiene todas las recepciones hasta la fecha objetivo
     */
    private function obtenerRecepcionesHastaFecha($idFaena, $fechaInicioPeriodo, $fechaObjetivo)
    {
        $recepciones = IngresoPetroleo::where('id_faena', $idFaena)
            ->where('created_at', '>=', $fechaInicioPeriodo)
            ->where('created_at', '<=', $fechaObjetivo)
            ->with('verificacionesAltura', 'Faena')
            ->orderBy('created_at', 'asc')
            ->get();

        $recepcionesProcesadas = [];
        $totalLitrosRecibidos = 0;
        $totalErroresIniciales = 0;
        $totalLitrosDocumentados = 0;

        foreach ($recepciones as $recepcion) {
            $datosRecepcion = $this->calcularErroresIngreso($recepcion);

            $recepcionesProcesadas[] = [
                'id_ingreso' => $recepcion->id_ingreso,
                'fecha_hora' => $recepcion->created_at,
                'id_faena' => $recepcion->Faena->ubicacion,
                'numero_guia' => $recepcion->numero_guia,
                'litros_documentados' => $datosRecepcion['litros_documentados'],
                'litros_recibidos' => $datosRecepcion['litros_recibidos'],
                'error_inicial_total' => $datosRecepcion['error_inicial_total'],
                'stock_inicial_sistema' => $datosRecepcion['stock_inicial_total'] - $datosRecepcion['error_inicial_total'],
                'stock_final_total' => $datosRecepcion['stock_final_total'],
            ];

            $totalLitrosRecibidos += $datosRecepcion['litros_recibidos'];
            $totalErroresIniciales += $datosRecepcion['error_inicial_total'];
            $totalLitrosDocumentados += $datosRecepcion['litros_documentados'];
        }

        return [
            'recepciones' => $recepcionesProcesadas,
            'total_recepciones' => count($recepcionesProcesadas),
            'total_litros_recibidos' => round($totalLitrosRecibidos, 2),
            'total_errores_iniciales' => round($totalErroresIniciales, 2),
            'total_litros_documentados' => round($totalLitrosDocumentados, 2),
        ];
    }

    /**
     * Obtiene todos los consumos hasta la fecha objetivo
     */
    private function obtenerConsumosHastaFecha($idFaena, $fechaInicioPeriodo, $fechaObjetivo)
    {
        $consumos = Consumo::where('id_faena', $idFaena)
            ->where('fecha_consumo', '>=', $fechaInicioPeriodo)
            ->where('fecha_consumo', '<=', $fechaObjetivo)
            ->with(['equipo', 'solicitante', 'usuario', 'Faena'])
            ->orderBy('fecha_consumo', 'asc')
            ->get();

        $consumosProcesados = [];
        $totalLitrosConsumidos = 0;

        foreach ($consumos as $consumo) {
            $consumosProcesados[] = [
                'id_consumo' => $consumo->id_consumo,
                'id_faena' => $consumo->Faena->ubicacion,
                'fecha_hora' => $consumo->fecha_consumo,
                'litros_consumidos' => $consumo->litros_consumidos,
                'maquina' => $consumo->equipo->nombre_maquina ?? 'N/A',
                'solicitante' => $consumo->solicitante->nombre ?? 'N/A',
                'usuario' => ($consumo->usuario->nombre ?? '') . ' ' . ($consumo->usuario->apellido ?? ''),
            ];

            $totalLitrosConsumidos += $consumo->litros_consumidos;
        }

        return [
            'consumos' => $consumosProcesados,
            'total_consumos' => count($consumosProcesados),
            'total_litros_consumidos' => round($totalLitrosConsumidos, 2),
        ];
    }


    /**
     * 🆕 FUNCIÓN CORREGIDA BASADA EN LA EXISTENTE
     * Procesa los movimientos cronológicamente para calcular el stock final
     * AÑADE: Lógica de "carga actual" y retorna errores ajustados
     */
    private function procesarMovimientosCronologicos($stockInicial, $recepcionesDatos, $consumosDatos, $fechaObjetivo)
    {
        $stockActual = $stockInicial;
        $movimientosProcesados = [];

        // Combinar todos los movimientos y ordenarlos cronológicamente
        $todosLosMovimientos = [];

        // Agregar recepciones
        foreach ($recepcionesDatos['recepciones'] as $recepcion) {
            $todosLosMovimientos[] = [
                'tipo' => 'recepcion',
                'fecha_hora' => Carbon::parse($recepcion['fecha_hora']),
                'datos' => $recepcion
            ];
        }

        // Agregar consumos
        foreach ($consumosDatos['consumos'] as $consumo) {
            $todosLosMovimientos[] = [
                'tipo' => 'consumo',
                'fecha_hora' => Carbon::parse($consumo['fecha_hora']),
                'datos' => $consumo
            ];
        }

        // ordenar cronológicamente antes de cualquier análisis
        usort($todosLosMovimientos, fn($a, $b) => $a['fecha_hora']->timestamp <=> $b['fecha_hora']->timestamp);


        // 🆕 NUEVA LÓGICA: Identificar "carga actual" dentro del período
        $primeraRecepcionIndex = null;
        $hayConsumosAntesDePrimeraRecepcion = false;

        // Encontrar la primera recepción en el período
        foreach ($todosLosMovimientos as $index => $movimiento) {
            if ($movimiento['tipo'] === 'recepcion') {
                $primeraRecepcionIndex = $index;
                break;
            }
        }

        // Verificar si hay consumos ANTES de la primera recepción en el período
        if ($primeraRecepcionIndex !== null) {
            for ($i = 0; $i < $primeraRecepcionIndex; $i++) {
                if ($todosLosMovimientos[$i]['tipo'] === 'consumo') {
                    $hayConsumosAntesDePrimeraRecepcion = true;
                    break;
                }
            }
        }

        // 🎯 DETERMINACIÓN DE "CARGA ACTUAL"
        $esCargaActual = ($primeraRecepcionIndex !== null && !$hayConsumosAntesDePrimeraRecepcion);

        Log::info('🔍 Análisis de carga actual en período', [
            'total_movimientos' => count($todosLosMovimientos),
            'primera_recepcion_index' => $primeraRecepcionIndex,
            'hay_consumos_antes_primera_recepcion' => $hayConsumosAntesDePrimeraRecepcion,
            'es_carga_actual' => $esCargaActual
        ]);

        // 🆕 Variable para tracking de errores ajustados
        $totalErroresAjustados = 0;

        // Procesar cada movimiento en orden cronológico
        foreach ($todosLosMovimientos as $index => $movimiento) {
            // Solo procesar si está dentro del período objetivo
            if ($movimiento['fecha_hora']->lte($fechaObjetivo)) {
                $stockAnterior = $stockActual;

                if ($movimiento['tipo'] === 'recepcion') {
                    $datos = $movimiento['datos'];

                    // 🆕 LÓGICA DE AJUSTE DE ERROR INICIAL
                    $errorInicialAjustado = $datos['error_inicial_total'];

                    // Si es "carga actual", ajustar error inicial a 0
                    if ($index === $primeraRecepcionIndex && $esCargaActual) {
                        $errorInicialAjustado = 0;

                        Log::info('🎯 CARGA ACTUAL identificada - Error inicial ajustado', [
                            'id_ingreso' => $datos['id_ingreso'],
                            'numero_guia' => $datos['numero_guia'],
                            'error_inicial_original' => $datos['error_inicial_total'],
                            'error_inicial_ajustado' => $errorInicialAjustado,
                            'razon' => 'Primera recepción del período sin consumos previos'
                        ]);
                    }

                    // Actualizar stock con error ajustado
                    $stockActual += $datos['litros_recibidos'] + $errorInicialAjustado;

                    // Acumular errores ajustados
                    $totalErroresAjustados += $errorInicialAjustado;

                    $movimientosProcesados[] = [
                        'fecha_hora' => $movimiento['fecha_hora']->format('Y-m-d H:i:s'),
                        'tipo' => 'Recepción',
                        'descripcion' => "Guía #{$datos['numero_guia']} - Faena: {$datos['id_faena']} ",
                        'litros_recibidos' => $datos['litros_recibidos'],
                        'error_inicial' => $errorInicialAjustado,  // Solo el valor ajustado
                        'stock_anterior' => round($stockAnterior, 2),
                        'stock_posterior' => round($stockActual, 2),
                        'diferencia' => round(($datos['litros_recibidos'] + $errorInicialAjustado), 2),
                        'es_carga_actual' => $index === $primeraRecepcionIndex && $esCargaActual
                    ];
                } elseif ($movimiento['tipo'] === 'consumo') {
                    $datos = $movimiento['datos'];
                    // Stock = Stock anterior - Litros consumidos
                    $stockActual -= $datos['litros_consumidos'];

                    $movimientosProcesados[] = [
                        'fecha_hora' => $movimiento['fecha_hora']->format('Y-m-d H:i:s'),
                        'tipo' => 'Consumo',
                        'descripcion' => "Máquina: {$datos['maquina']} - Faena: {$datos['id_faena']}",

                        'litros_consumidos' => $datos['litros_consumidos'],
                        'stock_anterior' => round($stockAnterior, 2),
                        'stock_posterior' => round($stockActual, 2),
                        'diferencia' => round(-$datos['litros_consumidos'], 2)
                    ];
                }
            }
        }

        Log::info('✅ Procesamiento cronológico completado', [
            'stock_inicial' => $stockInicial,
            'stock_final' => round($stockActual, 2),
            'movimientos_procesados' => count($movimientosProcesados),
            'carga_actual_identificada' => $esCargaActual,
            'total_errores_ajustados' => $totalErroresAjustados
        ]);

        // 🆕 RETORNO EXTENDIDO con errores ajustados
        return [
            'stock_final' => round($stockActual, 2),
            'movimientos_procesados' => $movimientosProcesados,
            'total_errores_iniciales_ajustados' => $totalErroresAjustados, // 🆕 Para las tarjetas
            'metadata' => [
                'es_carga_actual' => $esCargaActual,
                'primera_recepcion_index' => $primeraRecepcionIndex,
                'hay_consumos_antes_primera_recepcion' => $hayConsumosAntesDePrimeraRecepcion
            ]
        ];
    }

    public function resumenDetalladoPeriodo(Request $request)
    {
        try {
            $fechaDesde = $request->input('fecha_desde');
            $fechaHasta = $request->input('fecha_hasta');
            $idFaena = $request->input('id_faena');

            Log::info('📊 resumenDetalladoPeriodo iniciado', [
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                'id_faena' => $idFaena
            ]);

            if (!$fechaDesde || !$fechaHasta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Se requieren fecha_desde y fecha_hasta'
                ], 400);
            }

            if (!$idFaena) {
                return response()->json([
                    'success' => false,
                    'message' => 'Se requiere id_faena'
                ], 400);
            }

            // 🆕 AJUSTAR FECHAS: Desde 00:00 hasta 23:59
            $fechaInicioPeriodo = Carbon::parse($fechaDesde)->startOfDay(); // 00:00:00
            $fechaObjetivo = Carbon::parse($fechaHasta)->endOfDay(); // 23:59:59

            Log::info('⏰ Fechas ajustadas con horas completas', [
                'fecha_inicio_ajustada' => $fechaInicioPeriodo->format('Y-m-d H:i:s'),
                'fecha_objetivo_ajustada' => $fechaObjetivo->format('Y-m-d H:i:s')
            ]);

            // 🆕 MANEJAR OPCIÓN 'TODAS' LAS FAENAS
            if ($idFaena === 'todas') {
                return $this->procesarTodasLasFaenas($fechaInicioPeriodo, $fechaObjetivo, $fechaDesde, $fechaHasta);
            }

            // PROCESAMIENTO INDIVIDUAL (lógica original)
            return $this->procesarFaenaIndividual($idFaena, $fechaInicioPeriodo, $fechaObjetivo, $fechaDesde, $fechaHasta);
        } catch (\Exception $e) {
            Log::error('❌ Error en resumenDetalladoPeriodo', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen detallado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 NUEVO MÉTODO: Procesar todas las faenas y sumar resultados
     */
    private function procesarTodasLasFaenas($fechaInicioPeriodo, $fechaObjetivo, $fechaDesde, $fechaHasta)
    {
        try {
            Log::info('🏭 Procesando TODAS las faenas');

            // 1. OBTENER TODAS LAS FAENAS DISPONIBLES
            $faenas = \App\Models\Faena::all();

            if ($faenas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron faenas disponibles'
                ], 404);
            }

            // 2. INICIALIZAR TOTALES ACUMULADOS
            $totalesAcumulados = [
                'stock_inicial_total' => 0,
                'stock_final_total' => 0,
                'total_recepciones' => 0,
                'total_consumos' => 0,
                'total_errores_iniciales' => 0,
                'diferencia_neta_total' => 0
            ];

            $recepcionesAcumuladas = [];
            $consumosAcumulados = [];
            $resumenPorFaena = [];
            $movimientosAcumulados = [];

            // 3. PROCESAR CADA FAENA INDIVIDUALMENTE
            foreach ($faenas as $faena) {
                Log::info("🔄 Procesando faena individual: {$faena->id_faena}");

                try {
                    // Usar la MISMA LÓGICA exacta para cada faena
                    $resultadoFaena = $this->procesarFaenaConLogicaOriginal(
                        $faena->id_faena,
                        $fechaInicioPeriodo,
                        $fechaObjetivo
                    );

                    // 4. ACUMULAR RESULTADOS
                    $totalesAcumulados['stock_inicial_total'] += $resultadoFaena['stock_inicial_periodo'];
                    $totalesAcumulados['stock_final_total'] += $resultadoFaena['stock_final_calculado'];
                    $totalesAcumulados['total_recepciones'] += $resultadoFaena['totales']['total_recepciones'];
                    $totalesAcumulados['total_consumos'] += $resultadoFaena['totales']['total_consumos'];
                    $totalesAcumulados['total_errores_iniciales'] += $resultadoFaena['totales']['total_errores_iniciales'];
                    $totalesAcumulados['diferencia_neta_total'] += $resultadoFaena['totales']['diferencia_neta'];

                    // 5. ACUMULAR RECEPCIONES Y CONSUMOS DETALLADOS
                    if (!empty($resultadoFaena['recepciones']['recepciones_detalladas'])) {
                        $recepcionesAcumuladas = array_merge($recepcionesAcumuladas, $resultadoFaena['recepciones']['recepciones_detalladas']);
                    }

                    if (!empty($resultadoFaena['consumos']['consumos_detallados'])) {
                        $consumosAcumulados = array_merge($consumosAcumulados, $resultadoFaena['consumos']['consumos_detallados']);
                    }

                    if (!empty($resultadoFaena['resumen_movimientos'])) {
                        $movimientosAcumulados = array_merge($movimientosAcumulados, $resultadoFaena['resumen_movimientos']);
                    }

                    // 6. GUARDAR RESUMEN POR FAENA
                    $resumenPorFaena[] = [
                        'id_faena' => $faena->id_faena,
                        'nombre_faena' => $faena->ubicacion ?? "Faena {$faena->id_faena}",
                        'stock_inicial' => $resultadoFaena['stock_inicial_periodo'],
                        'stock_final' => $resultadoFaena['stock_final_calculado'],
                        'total_recepciones' => $resultadoFaena['totales']['total_recepciones'],
                        'total_errores_iniciales' => $resultadoFaena['totales']['total_errores_iniciales'], // 🆕 AGREGAR ESTA LÍNEA
                        'total_consumos' => $resultadoFaena['totales']['total_consumos'],
                        'diferencia_neta' => $resultadoFaena['totales']['diferencia_neta']
                    ];

                    Log::info("✅ Faena {$faena->id_faena} procesada exitosamente", [
                        'stock_inicial' => $resultadoFaena['stock_inicial_periodo'],
                        'stock_final' => $resultadoFaena['stock_final_calculado']
                    ]);
                } catch (\Exception $e) {
                    Log::error("❌ Error procesando faena {$faena->id_faena}", [
                        'error' => $e->getMessage()
                    ]);

                    // Continuar con la siguiente faena sin fallar todo el proceso
                    continue;
                }
            }

            // 7. PREPARAR RESPUESTA CONSOLIDADA
            $resumenConsolidado = [
                'stock_inicial_periodo' => $totalesAcumulados['stock_inicial_total'],
                'recepciones' => [
                    'total_recepciones' => count($recepcionesAcumuladas),
                    'total_litros_recibidos' => $totalesAcumulados['total_recepciones'],
                    'recepciones_detalladas' => $recepcionesAcumuladas
                ],
                'consumos' => [
                    'total_consumos' => count($consumosAcumulados),
                    'total_litros_consumidos' => $totalesAcumulados['total_consumos'],
                    'consumos_detallados' => $consumosAcumulados
                ],
                'stock_final_calculado' => $totalesAcumulados['stock_final_total'],
                'fecha_objetivo' => $fechaObjetivo->format('Y-m-d H:i:s'),
                'fecha_inicio_periodo' => $fechaInicioPeriodo->format('Y-m-d H:i:s'),
                'id_faena' => 'todas',
                'resumen_movimientos' => $movimientosAcumulados,
                'totales' => [
                    'total_recepciones' => $totalesAcumulados['total_recepciones'],
                    'total_errores_iniciales' => $totalesAcumulados['total_errores_iniciales'],
                    'total_consumos' => $totalesAcumulados['total_consumos'],
                    'diferencia_neta' => $totalesAcumulados['diferencia_neta_total'],
                    'carga_actual' => [
                        'identificada' => false, // Para "todas" no aplica este concepto
                        'hay_consumos_antes' => false
                    ]
                ],
                // 🆕 INFORMACIÓN ADICIONAL PARA "TODAS"
                'consolidacion_todas_faenas' => [
                    'total_faenas_procesadas' => count($resumenPorFaena),
                    'resumen_por_faena' => $resumenPorFaena
                ]
            ];

            Log::info('🎉 Todas las faenas procesadas exitosamente', [
                'faenas_procesadas' => count($resumenPorFaena),
                'stock_inicial_total' => $totalesAcumulados['stock_inicial_total'],
                'stock_final_total' => $totalesAcumulados['stock_final_total']
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'calculo_stock_detallado' => $resumenConsolidado,
                    'resumen_tradicional' => null // Para "todas" podrías omitir o consolidar también
                ],
                'message' => 'Resumen consolidado de todas las faenas obtenido correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error en procesarTodasLasFaenas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar todas las faenas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 NUEVO MÉTODO: Procesar faena individual (extrae la lógica original)
     */
    private function procesarFaenaIndividual($idFaena, $fechaInicioPeriodo, $fechaObjetivo, $fechaDesde, $fechaHasta)
    {
        $resultadoFaena = $this->procesarFaenaConLogicaOriginal($idFaena, $fechaInicioPeriodo, $fechaObjetivo);

        // Obtener el resumen tradicional
        $request = new \Illuminate\Http\Request([
            'fecha_desde' => $fechaDesde,
            'fecha_hasta' => $fechaHasta,
            'id_faena' => $idFaena
        ]);

        $resumenTradicional = $this->resumen($request);
        $datosResumenTradicional = $resumenTradicional->getData(true);

        // Combinar resultados
        $resumenCompleto = [
            'calculo_stock_detallado' => $resultadoFaena,
            'resumen_tradicional' => $datosResumenTradicional['data'] ?? null
        ];

        Log::info('✅ resumenDetalladoPeriodo completado para faena individual', [
            'id_faena' => $idFaena,
            'stock_inicial' => $resultadoFaena['stock_inicial_periodo'],
            'stock_final' => $resultadoFaena['stock_final_calculado']
        ]);

        return response()->json([
            'success' => true,
            'data' => $resumenCompleto,
            'message' => 'Resumen detallado del período obtenido correctamente'
        ]);
    }

    /**
     * 🆕 NUEVO MÉTODO: Aplicar la lógica original para una faena específica
     */
    private function procesarFaenaConLogicaOriginal($idFaena, $fechaInicioPeriodo, $fechaObjetivo)
    {
        // 1. OBTENER STOCK INICIAL (usando la lógica original)
        $stockInicial = $this->obtenerStockInicial($idFaena, $fechaInicioPeriodo);

        // 2. OBTENER RECEPCIONES (usando la lógica original)
        $recepcionesDatos = $this->obtenerRecepcionesHastaFecha($idFaena, $fechaInicioPeriodo, $fechaObjetivo);

        // 3. OBTENER CONSUMOS (usando la lógica original)
        $consumosDatos = $this->obtenerConsumosHastaFecha($idFaena, $fechaInicioPeriodo, $fechaObjetivo);

        // 4. PROCESAR CRONOLÓGICAMENTE (usando la lógica original)
        $stockCalculado = $this->procesarMovimientosCronologicos(
            $stockInicial,
            $recepcionesDatos,
            $consumosDatos,
            $fechaObjetivo
        );

        // 5. USAR ERRORES AJUSTADOS (usando la lógica original)
        $erroresAjustados = $stockCalculado['total_errores_iniciales_ajustados'];

        // 6. PREPARAR RESUMEN (usando la estructura original)
        return [
            'stock_inicial_periodo' => $stockInicial,
            'recepciones' => $recepcionesDatos,
            'consumos' => $consumosDatos,
            'stock_final_calculado' => $stockCalculado['stock_final'],
            'fecha_objetivo' => $fechaObjetivo->format('Y-m-d H:i:s'),
            'fecha_inicio_periodo' => $fechaInicioPeriodo->format('Y-m-d H:i:s'),
            'id_faena' => $idFaena,
            'resumen_movimientos' => $stockCalculado['movimientos_procesados'],
            'totales' => [
                'total_recepciones' => $recepcionesDatos['total_litros_recibidos'],
                'total_errores_iniciales' => $erroresAjustados,
                'total_consumos' => $consumosDatos['total_litros_consumidos'],
                'diferencia_neta' => $stockCalculado['stock_final'] - $stockInicial,
                'carga_actual' => [
                    'identificada' => $stockCalculado['metadata']['es_carga_actual'],
                    'hay_consumos_antes' => $stockCalculado['metadata']['hay_consumos_antes_primera_recepcion']
                ]
            ],
            'debug_stock_inicial' => [
                'metodo_calculo' => $stockCalculado['metadata']['es_carga_actual'] ? 'escenario_1_carga_actual' : 'escenario_2_reconstruccion_historica',
                'stock_inicial_calculado' => $stockInicial,
                'es_carga_actual_en_periodo' => $stockCalculado['metadata']['es_carga_actual']
            ]
        ];
    }

    private function obtenerStockInicial($idFaena, $fechaInicioPeriodo)
    {
        try {
            $fechaInicioPeriodo = Carbon::parse($fechaInicioPeriodo);

            // 1) Primera recepción dentro del periodo (si existe)
            $primeraRecepcionPeriodo = IngresoPetroleo::where('id_faena', $idFaena)
                ->where('created_at', '>=', $fechaInicioPeriodo)
                ->orderBy('created_at', 'asc')
                ->first();

            // 2) Si existe primera recepción, evaluar si es "carga actual"
            if ($primeraRecepcionPeriodo) {
                $hayConsumosAntes = Consumo::where('id_faena', $idFaena)
                    ->where('fecha_consumo', '>=', $fechaInicioPeriodo)
                    ->where('fecha_consumo', '<', $primeraRecepcionPeriodo->created_at)
                    ->exists();

                $esCargaActual = !$hayConsumosAntes;

                Log::info('🔍 obtenerStockInicial - análisis carga actual', [
                    'id_faena' => $idFaena,
                    'primera_recepcion_id' => $primeraRecepcionPeriodo->id ?? null,
                    'fecha_primera_recepcion' => $primeraRecepcionPeriodo->created_at,
                    'hay_consumos_antes' => $hayConsumosAntes,
                    'es_carga_actual' => $esCargaActual
                ]);

                // CASO A: es carga actual -> devolver lo que ya te funcionaba (stock_inicial de la recepción)
                if ($esCargaActual) {
                    $datosRecepcion = $this->calcularErroresIngreso($primeraRecepcionPeriodo);
                    // stock_inicial_total es la semántica que tenías; si no existe usar stock_final como fallback
                    $stockRecepcion = (float)($datosRecepcion['stock_inicial_total'] ?? $datosRecepcion['stock_final_total'] ?? 0);
                    Log::info('✅ obtenerStockInicial - caso CARGA ACTUAL, devolviendo stock de la recepcion', [
                        'stockRecepcion' => $stockRecepcion
                    ]);
                    return round($stockRecepcion, 2);
                }
            }

            // CASO B: NO es carga actual -> reconstruir stock hasta inicio del periodo
            Log::info('🔄 obtenerStockInicial - no es carga actual, reconstruyendo desde ultimo ingreso o stock general');

            // Buscar ultimo ingreso anterior al inicio del periodo
            // Preferir estanques_fijos porque su stock_inicial refleja el total de la faena.
            // Los ingresos de estanque_movil tienen stock_inicial del móvil (puede ser 0 si era nuevo),
            // lo que haría perder el stock del estanque fijo al calcular el punto de partida.
            $ultimoIngresoAnterior = IngresoPetroleo::where('id_faena', $idFaena)
                ->where('created_at', '<', $fechaInicioPeriodo)
                ->where('tipo_recepcion', 'estanques_fijos')
                ->orderBy('created_at', 'desc')
                ->first();

            // Fallback: si no hay ingresos fijos previos, usar cualquier ingreso anterior
            if (!$ultimoIngresoAnterior) {
                $ultimoIngresoAnterior = IngresoPetroleo::where('id_faena', $idFaena)
                    ->where('created_at', '<', $fechaInicioPeriodo)
                    ->orderBy('created_at', 'desc')
                    ->first();
            }

            if ($ultimoIngresoAnterior) {
                $datosIngresoAnterior = $this->calcularErroresIngreso($ultimoIngresoAnterior);
                $stock = (float)($datosIngresoAnterior['stock_final_total'] ?? 0.0);
                $cursorTime = Carbon::parse($ultimoIngresoAnterior->created_at);
                Log::info('📦 usar ultimoIngresoAnterior como partida', [
                    'ultimo_ingreso_id' => $ultimoIngresoAnterior->id,
                    'cursorTime' => $cursorTime->toDateTimeString(),
                    'stock_partida' => $stock
                ]);
            } else {
                // No hay ingreso anterior: partir desde stock general (o cero)
                $stockGeneral = StockPetroleo::where('id_faena', $idFaena)->first();
                $stock = $stockGeneral ? (float)$stockGeneral->stock_inicial : 0.0;
                $cursorTime = Carbon::createFromTimestamp(0);
                Log::info('📦 sin ingreso anterior, usar stock general', ['stock_partida' => $stock]);
            }

            // Obtener recepciones y consumos ENTRE cursorTime y fechaInicioPeriodo
            $recepcionesPrevias = IngresoPetroleo::where('id_faena', $idFaena)
                ->where('created_at', '>', $cursorTime)
                ->where('created_at', '<', $fechaInicioPeriodo)
                ->orderBy('created_at', 'asc')
                ->get();

            $consumosPrevios = Consumo::where('id_faena', $idFaena)
                ->where('fecha_consumo', '>', $cursorTime)
                ->where('fecha_consumo', '<', $fechaInicioPeriodo)
                ->orderBy('fecha_consumo', 'asc')
                ->get();

            Log::info('🔎 eventos previos encontrados', [
                'recepcionesPrevias' => $recepcionesPrevias->count(),
                'consumosPrevios' => $consumosPrevios->count()
            ]);

            // Mezclar y ordenar los eventos por fecha
            $eventos = [];
            foreach ($recepcionesPrevias as $r) {
                $eventos[] = [
                    'tipo' => 'recepcion',
                    'fecha' => Carbon::parse($r->fecha_hora ?? $r->created_at),
                    'obj' => $r
                ];
            }
            foreach ($consumosPrevios as $c) {
                $eventos[] = [
                    'tipo' => 'consumo',
                    'fecha' => Carbon::parse($c->fecha_consumo ?? $c->created_at),
                    'obj' => $c
                ];
            }
            usort($eventos, fn($a, $b) => $a['fecha']->timestamp <=> $b['fecha']->timestamp);

            // Aplicar cada evento para llegar al stock justo al inicio del periodo
            foreach ($eventos as $ev) {
                if ($ev['tipo'] === 'recepcion') {
                    $datosRec = $this->calcularErroresIngreso($ev['obj']);
                    $litros = (float)($datosRec['litros_recibidos'] ?? $ev['obj']->litros_recibidos ?? $ev['obj']->litros_documentados ?? 0);
                    $errorInicial = (float)($datosRec['error_inicial_total'] ?? 0);
                    $stock += ($litros + $errorInicial);
                    Log::debug('aplicar recepcion previa', ['fecha' => $ev['fecha']->toDateTimeString(), 'litros' => $litros, 'errorInicial' => $errorInicial, 'stock' => $stock]);
                } else { // consumo
                    $litrosCons = (float)($ev['obj']->litros_consumidos ?? 0);
                    $stock -= $litrosCons;
                    Log::debug('aplicar consumo previo', ['fecha' => $ev['fecha']->toDateTimeString(), 'litrosCons' => $litrosCons, 'stock' => $stock]);
                }
            }

            if ($stock < 0) {
                Log::warning('obtenerStockInicial - stock calculado negativo', ['id_faena' => $idFaena, 'stock' => $stock]);
            }

            return round($stock, 2);
        } catch (\Exception $e) {
            Log::warning('⚠️ Error obteniendo stock inicial (fallback)', ['error' => $e->getMessage()]);

            // Intentar fallback clásico
            try {
                $ultimoIngresoAnterior = IngresoPetroleo::where('id_faena', $idFaena)
                    ->where('created_at', '<', $fechaInicioPeriodo)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($ultimoIngresoAnterior) {
                    $datosIngresoAnterior = $this->calcularErroresIngreso($ultimoIngresoAnterior);
                    return $datosIngresoAnterior['stock_final_total'] ?? 0;
                }

                $stockGeneral = StockPetroleo::where('id_faena', $idFaena)->first();
                return $stockGeneral ? $stockGeneral->stock_inicial : 0;
            } catch (\Exception $inner) {
                Log::error('Fallback interno falló', ['error' => $inner->getMessage()]);
                return 0;
            }
        }
    }
}
