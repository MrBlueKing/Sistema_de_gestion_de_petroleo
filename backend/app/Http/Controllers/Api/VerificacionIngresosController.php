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
     * Obtener ingresos con cálculo de errores
     */
    public function index(Request $request)
    {
        try {
            // Obtener parámetros de filtro
            $fechaDesde = $request->input('fecha_desde');
            $fechaHasta = $request->input('fecha_hasta');
            $idFaena = $request->input('id_faena');

            // Query base
            $query = IngresoPetroleo::with(['faena', 'usuario', 'verificacionesAltura.estanque']);

            // Aplicar filtros
            if ($fechaDesde) {
                $query->whereDate('created_at', '>=', $fechaDesde);
            }

            if ($fechaHasta) {
                $query->whereDate('created_at', '<=', $fechaHasta);
            }

            if ($idFaena && $idFaena !== 'todas') {
                $query->where('id_faena', $idFaena);
            }

            $ingresos = $query->orderBy('created_at', 'desc')->get();

            // Procesar cada ingreso para calcular errores
            $ingresosConErrores = $ingresos->map(function ($ingreso) {
                return $this->calcularErroresIngreso($ingreso);
            });

            return response()->json([
                'success' => true,
                'data' => $ingresosConErrores
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener verificaciones de ingresos', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los datos de verificación'
            ], 500);
        }
    }

    /**
     * Calcular errores para un ingreso específico
     */
    private function calcularErroresIngreso($ingreso)
    {
        $errorInicialTotal = 0;
        $erroresPorEstanque = [];

        // Agrupar verificaciones por estanque
        $verificacionesPorEstanque = $ingreso->verificacionesAltura->groupBy('id_estanque');

        foreach ($verificacionesPorEstanque as $idEstanque => $verificaciones) {
            if ($verificaciones->count() >= 2) {
                // Ordenar por id para asegurar que tenemos inicial y final en orden
                $verificacionesOrdenadas = $verificaciones->sortBy('id_verificacion')->values();
                
                $verificacionInicial = $verificacionesOrdenadas[0];
                $verificacionFinal = $verificacionesOrdenadas[1];

                // Calcular error inicial: diferencia entre stock sistema y medición inicial
                $stockSistema = $verificacionInicial->stock_inicial;
                $stockMedicionInicial = $verificacionInicial->volumen_calculado;
                $errorInicial = $stockMedicionInicial - $stockSistema;

                // Calcular litros agregados
                $litrosAgregados = $verificacionFinal->volumen_calculado - $stockMedicionInicial;

                $errorInicialTotal += $errorInicial;

                $erroresPorEstanque[] = [
                    'id_estanque' => $idEstanque,
                    'nombre_estanque' => $verificacionInicial->estanque->nombre,
                    'stock_sistema' => round($stockSistema, 2),
                    'stock_medicion_inicial' => round($stockMedicionInicial, 2),
                    'stock_medicion_final' => round($verificacionFinal->volumen_calculado, 2),
                    'error_inicial' => round($errorInicial, 2),
                    'litros_agregados' => round($litrosAgregados, 2),
                    'altura_inicial' => $verificacionInicial->altura_medicion,
                    'altura_final' => $verificacionFinal->altura_medicion
                ];
            }
        }

        // Error final: diferencia entre litros recibidos y documentados
        $errorFinal = $ingreso->litros_recibidos - $ingreso->litros_documentados;

        return [
            'id_ingreso' => $ingreso->id_ingreso,
            'numero_guia' => $ingreso->numero_guia,
            'litros_documentados' => $ingreso->litros_documentados,
            'litros_recibidos' => $ingreso->litros_recibidos,
            'fecha_ingreso' => $ingreso->created_at->format('Y-m-d'),
            'hora_ingreso' => $ingreso->created_at->format('H:i'),
            'faena' => $ingreso->faena->nombre,
            'id_faena' => $ingreso->id_faena,
            'usuario' => $ingreso->usuario->name,
            'stock_inicial_total' => $ingreso->stock_inicial,
            'diferencia_guia' => $ingreso->diferencia, // Diferencia registrada en el ingreso
            'error_final' => round($errorFinal, 2),
            'error_inicial_total' => round($errorInicialTotal, 2),
            'errores_por_estanque' => $erroresPorEstanque,
            'observacion' => $ingreso->observacion,
            'recibo_conforme' => $ingreso->recibo_conforme
        ];
    }

    /**
     * Obtener detalle de un ingreso específico
     */
    public function show($id)
    {
        try {
            $ingreso = IngresoPetroleo::with(['faena', 'usuario', 'verificacionesAltura.estanque'])
                ->findOrFail($id);

            $ingresoConErrores = $this->calcularErroresIngreso($ingreso);

            return response()->json([
                'success' => true,
                'data' => $ingresoConErrores
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener detalle de ingreso', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el detalle del ingreso'
            ], 500);
        }
    }

    /**
     * Obtener resumen de errores por período
     */
    public function resumen(Request $request)
    {
        try {
            $fechaDesde = $request->input('fecha_desde');
            $fechaHasta = $request->input('fecha_hasta');
            $idFaena = $request->input('id_faena');

            $query = IngresoPetroleo::with(['verificacionesAltura']);

            if ($fechaDesde) {
                $query->whereDate('created_at', '>=', $fechaDesde);
            }

            if ($fechaHasta) {
                $query->whereDate('created_at', '<=', $fechaHasta);
            }

            if ($idFaena && $idFaena !== 'todas') {
                $query->where('id_faena', $idFaena);
            }

            $ingresos = $query->get();

            // Calcular estadísticas
            $totalIngresos = $ingresos->count();
            $totalLitrosDocumentados = $ingresos->sum('litros_documentados');
            $totalLitrosRecibidos = $ingresos->sum('litros_recibidos');
            $errorFinalTotal = $totalLitrosRecibidos - $totalLitrosDocumentados;

            // Calcular errores iniciales
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

            return response()->json([
                'success' => true,
                'data' => [
                    'total_ingresos' => $totalIngresos,
                    'total_litros_documentados' => round($totalLitrosDocumentados, 2),
                    'total_litros_recibidos' => round($totalLitrosRecibidos, 2),
                    'error_final_acumulado' => round($errorFinalTotal, 2),
                    'error_inicial_acumulado' => round($errorInicialAcumulado, 2),
                    'ingresos_con_error' => $ingresosConError,
                    'ingresos_sin_error' => $ingresosSinError,
                    'porcentaje_precision' => $totalIngresos > 0 
                        ? round(($ingresosSinError / $totalIngresos) * 100, 2) 
                        : 0
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener resumen de verificaciones', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el resumen'
            ], 500);
        }
    }
}