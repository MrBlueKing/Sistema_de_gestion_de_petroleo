<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consumo;
use App\Models\Estanque;
use App\Models\StockPetroleo;
use App\Models\EstanqueStock;
use App\Models\IngresoPetroleo;
use App\Models\MovimientoPetroleo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ConsumoController extends Controller
{
    public function store(Request $request)
    {
        Log::info('Iniciando store de Consumo', ['data_recibida' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'id_dotacion' => 'required|exists:solicitantes,id',
            'id_equipo' => 'required|exists:maquinas,id_maquina',
            'id_usuario' => 'required|exists:users,id',
            'fecha_consumo' => 'nullable|date',
            'litros_consumidos' => 'required|numeric|min:0',
            'id_faena' => 'required|exists:faenas,id_faena',
            'id_estanque' => 'nullable|exists:estanques,id_estanque',
            'medicion' => 'nullable|numeric',
            'numeral_inicial' => 'nullable|numeric',
            'numeral_final' => 'nullable|numeric',
            'observacion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            Log::warning('Validación fallida en Consumo::store', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $idFaena = $request->id_faena;
            $litrosConsumidos = $request->litros_consumidos;
        
            // Obtener el último ingreso de petróleo por faena
            $ultimoIngreso = IngresoPetroleo::where('id_faena', $idFaena)
                ->orderBy('created_at', 'desc')
                ->first();
        
            DB::beginTransaction();
        
            $estanques = Estanque::where('id_faena', $idFaena)
                ->where('activo', true)
                ->with('stock')
                ->get()
                ->sortByDesc(fn($e) => $e->stock->stock_actual ?? 0);
        
            $stockTotal = $estanques->sum(fn($e) => $e->stock->stock_actual ?? 0);
        
            if ($stockTotal < $litrosConsumidos) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuficiente',
                    'data' => [
                        'stock_actual' => $stockTotal,
                        'litros_solicitados' => $litrosConsumidos
                    ]
                ], 400);
            }
        
            $litrosRestantes = $litrosConsumidos;
            $consumosPorEstanque = [];
        
            foreach ($estanques as $estanque) {
                $stock = $estanque->stock;
                if (!$stock || $stock->stock_actual <= 0) continue;
        
                $litrosDeEste = min($stock->stock_actual, $litrosRestantes);
                $stockAnterior = $stock->stock_actual;
                $stock->stock_actual -= $litrosDeEste;
        
                if ($estanque->altura_nominal && $estanque->capacidad) {
                    $stock->altura_actual = ($stock->stock_actual / $estanque->capacidad) * $estanque->altura_nominal;
                }
        
                $stock->ultima_medicion = now();
                $stock->save();
        
                $datosConsumo = $request->all();
                $datosConsumo['id_estanque'] = $estanque->id_estanque;
                $datosConsumo['litros_consumidos'] = $litrosDeEste;
                $datosConsumo['precio_litro'] = $ultimoIngreso ? $ultimoIngreso->precio : null;
        
                $consumo = Consumo::create($datosConsumo);
        
                MovimientoPetroleo::create([
                    'id_faena' => $idFaena,
                    'tipo_movimiento' => 'consumo',
                    'id_referencia' => $consumo->id_consumo,
                    'cantidad' => -$litrosDeEste,
                    'stock_anterior' => $stockAnterior,
                    'stock_actual' => $stock->stock_actual,
                    'id_usuario' => $request->id_usuario
                ]);
        
                $consumosPorEstanque[] = [
                    'id_estanque' => $estanque->id_estanque,
                    'litros_consumidos' => $litrosDeEste,
                    'stock_anterior' => $stockAnterior,
                    'stock_actual' => $stock->stock_actual
                ];
        
                $litrosRestantes -= $litrosDeEste;
                if ($litrosRestantes <= 0) break;
            }
        
            $totalFaena = EstanqueStock::whereHas('estanque', fn($q) => $q->where('id_faena', $idFaena))
                ->sum('stock_actual');
        
            $stockPetroleo = StockPetroleo::firstOrNew(['id_faena' => $idFaena]);
            $stockPetroleo->stock_actual = $totalFaena;
            $stockPetroleo->ultima_actualizacion = now();
            $stockPetroleo->save();
        
            DB::commit();
        
            return response()->json([
                'success' => true,
                'message' => 'Consumo registrado correctamente desde múltiples estanques',
                'data' => $consumosPorEstanque
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en Consumo::store', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el consumo',
                'error' => $e->getMessage()
            ], 500);
        }        
    }
}
