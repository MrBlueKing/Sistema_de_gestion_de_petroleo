<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IngresoPetroleo;
use App\Models\VerificacionAltura;
use App\Models\Estanque;
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
                'stock_inicial_total' => floatval($ingreso->stock_inicial ?? 0),
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
                ]
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
}