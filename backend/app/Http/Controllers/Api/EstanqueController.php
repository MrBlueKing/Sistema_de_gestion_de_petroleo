<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Estanque;
use App\Models\EstanqueStock;
use App\Models\MovimientoPetroleo;
use App\Models\StockPetroleo;
use App\Models\VerificacionAltura;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EstanqueController extends Controller
{
public function estanquesPorFaena($id_faena)
{
    try {
        // Obtenemos los estanques con la relación stock incluida
        $estanques = Estanque::where('id_faena', $id_faena)
            ->with('stock')  // Usamos la relación 'stock' que ya tienes definida
            ->get();
        
        Log::info("estanquini", ['estanques' => $estanques->toArray()]);
        
        if ($estanques->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontraron estanques para esta faena.'
            ], 404);
        }
        
        // Transformamos los datos para incluir el stock_actual directamente
        $estanquesConStock = $estanques->map(function ($estanque) {
            $estanqueArray = $estanque->toArray();
            
            // Como la relación es hasOne, podemos acceder directamente al stock
            $estanqueArray['stock_actual'] = $estanque->stock ? $estanque->stock->stock_actual : 0;
            
            return $estanqueArray;
        });
        
        return response()->json([
            'success' => true,
            'data' => $estanquesConStock
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error al obtener estanques de faena', ['error' => $e->getMessage()]);
        
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener los estanques.'
        ], 500);
    }
}

    public function calcularLitrosPetroleo(Request $request)
    {
        Log::info('Datos recibidos en calcularLitrosPetroleo', ['request' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'id_faena' => 'required|exists:faenas,id_faena',
            'tipo_movimiento' => 'required|in:ingreso,consumo',
            'alturas' => 'required|array',
            'alturas.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas.*.altura' => 'required|numeric|min:0',
            'id_usuario' => 'required|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $alturas = $request->alturas;
            $idFaena = $request->id_faena;
            $tipoMovimiento = $request->tipo_movimiento;

            // Obtener todos los estanques para la faena seleccionada
            $estanques = Estanque::whereIn('id_estanque', array_column($alturas, 'id_estanque'))
                ->get()->keyBy('id_estanque');

            // Verificar que todos los estanques pertenezcan a la faena indicada
            foreach ($alturas as $item) {
                $estanque = $estanques[$item['id_estanque']] ?? null;
                if (!$estanque || $estanque->id_faena != $idFaena) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El estanque #' . $item['id_estanque'] . ' no pertenece a la faena seleccionada'
                    ], 400);
                }
            }

            $litrosTotales = 0;
            $stockAnteriorTotal = 0;
            $resultadosPorEstanque = [];

            // Calcular litros para cada estanque sin guardar datos
            foreach ($alturas as $item) {
                $idEstanque = $item['id_estanque'];
                $alturaMedida = $item['altura'];
                $estanque = $estanques[$idEstanque];

                // Verificar que el estanque tiene altura_nominal y capacidad definidas
                if (!$estanque->altura_nominal || !$estanque->capacidad) {
                    return response()->json([
                        'success' => false,
                        'message' => "El estanque '{$estanque->nombre}' no tiene definida su altura nominal o capacidad"
                    ], 400);
                }

                // Calcular volumen en litros según la fórmula
                $volumenCalculado = ($alturaMedida / $estanque->altura_nominal) * $estanque->capacidad;

                // Obtener el stock actual del estanque
                $ultimaMedicion = EstanqueStock::where('id_estanque', $idEstanque)->first();
                $stockActual = $ultimaMedicion ? $ultimaMedicion->stock_actual : 0;
                $alturaActual = $ultimaMedicion ? $ultimaMedicion->altura_actual : 0;
                $stockAnteriorTotal += $stockActual;

                // Si es un ingreso, verificamos que no exceda la capacidad
                if ($tipoMovimiento === 'ingreso') {
                    // Para ingresos, la altura nueva debe ser mayor que la altura actual
                    if ($alturaMedida < $alturaActual) {
                        return response()->json([
                            'success' => false,
                            'message' => "Para registrar un ingreso, la altura del estanque '{$estanque->nombre}' debe ser mayor que la altura actual ({$alturaActual} cm)"
                        ], 400);
                    }

                    // Verificar si el volumen calculado excede la capacidad
                    if ($volumenCalculado > $estanque->capacidad) {
                        return response()->json([
                            'success' => false,
                            'message' => "El estanque '{$estanque->nombre}' excedería su capacidad máxima con esta altura"
                        ], 400);
                    }
                }

                // AQUÍ añadimos la validación de capacidad excedida, después de calcular el volumen
                if ($volumenCalculado > $estanque->capacidad) {
                    return response()->json([
                        'success' => false,
                        'message' => "El estanque '{$estanque->nombre}' excedería su capacidad máxima con esta altura"
                    ], 400);
                }

                // Log detallado del cálculo
                Log::info('Cálculo de volumen para estanque', [
                    'id_estanque' => $idEstanque,
                    'nombre_estanque' => $estanque->nombre,
                    'altura_medida' => $alturaMedida,
                    'altura_nominal' => $estanque->altura_nominal,
                    'capacidad' => $estanque->capacidad,
                    'formula' => "($alturaMedida / {$estanque->altura_nominal}) * {$estanque->capacidad}",
                    'volumen_calculado' => $volumenCalculado
                ]);

                $litrosTotales += $volumenCalculado;

                // Obtener la última medición para este estanque (solo para referencia)
                $ultimaMedicion = EstanqueStock::where('id_estanque', $idEstanque)
                    ->first();

                $alturaAnterior = $ultimaMedicion ? $ultimaMedicion->altura_actual : 0;
                $diferenciaAltura = $alturaMedida - $alturaAnterior;

                $resultadosPorEstanque[] = [
                    'id_estanque' => $idEstanque,
                    'nombre_estanque' => $estanque->nombre,
                    'altura_anterior' => $alturaAnterior,
                    'altura_nueva' => $alturaMedida,
                    'diferencia_altura' => $diferenciaAltura,
                    'litros_calculados' => $volumenCalculado,
                    'stock_anterior' => $stockActual,
                    'diferencia_litros' => $volumenCalculado - $stockActual,
                    'capacidad' => $estanque->capacidad // Añadimos la capacidad para validar en el frontend
                ];
            }

            // CAMBIO IMPORTANTE: Calcular la diferencia respecto al stock anterior
            $litrosIngresados = $litrosTotales - $stockAnteriorTotal;

            // Obtener stock actual (solo para referencia)
            $stockActual = StockPetroleo::where('id_faena', $idFaena)
                ->value('stock_actual') ?? 0;

            return response()->json([
                'success' => true,
                'tipo_movimiento' => $tipoMovimiento,
                'litros_totales' => $litrosTotales,
                'stock_anterior_total' => $stockAnteriorTotal,
                'litros_ingresados' => $litrosIngresados,
                'stock_actual' => $stockActual,
                'stock_estimado' => $tipoMovimiento === 'ingreso' ? $stockActual + $litrosIngresados : $stockActual - $litrosIngresados,
                'detalle_estanques' => $resultadosPorEstanque
            ]);
        } catch (\Exception $e) {
            Log::error('Error en calcularLitrosPetroleo: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular los litros de petróleo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function capacidadDisponible($idFaena)
    {
        try {
            // Obtener todos los estanques de la faena
            $estanques = Estanque::where('id_faena', $idFaena)->get();

            if ($estanques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron estanques para esta faena.'
                ], 404);
            }

            $capacidadTotal = 0;
            $stockActual = 0;

            foreach ($estanques as $estanque) {
                $capacidadTotal += $estanque->capacidad;

                // Obtener el stock actual de este estanque
                $estanqueStock = EstanqueStock::where('id_estanque', $estanque->id_estanque)->first();
                if ($estanqueStock) {
                    $stockActual += $estanqueStock->stock_actual;
                }
            }

            $capacidadDisponible = $capacidadTotal - $stockActual;

            return response()->json([
                'success' => true,
                'capacidad_total' => $capacidadTotal,
                'stock_actual' => $stockActual,
                'capacidad_disponible' => $capacidadDisponible
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener capacidad disponible', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al calcular la capacidad disponible: ' . $e->getMessage()
            ], 500);
        }
    }
}
