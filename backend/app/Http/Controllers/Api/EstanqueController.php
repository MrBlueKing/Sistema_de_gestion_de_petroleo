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
            $estanques = Estanque::where('id_faena', $id_faena)->get(); // Modelo Estanque

            if ($estanques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron estanques para esta faena.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $estanques
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
                'litros_calculados' => $volumenCalculado
            ];
        }

        // Obtener stock actual (solo para referencia)
        $stockActual = StockPetroleo::where('id_faena', $idFaena)
            ->value('stock_actual') ?? 0;

        return response()->json([
            'success' => true,
            'tipo_movimiento' => $tipoMovimiento,
            'litros_totales' => $litrosTotales,
            'stock_actual' => $stockActual,
            'stock_estimado' => $tipoMovimiento === 'ingreso' ? $stockActual + $litrosTotales : $stockActual - $litrosTotales,
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
}
