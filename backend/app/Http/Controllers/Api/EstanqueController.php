<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Estanque;
use App\Models\EstanqueStock;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EstanqueController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
    /**
     * Obtener todos los estanques de una faena específica
     */
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

    /**
     * Calcular la cantidad de litros según las alturas de los estanques
     */
    public function calcularLitrosPetroleo(Request $request)
    {
        Log::info('Datos recibidos en calcularLitrosPetroleo', ['request' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'id_faena' => 'required|exists:faenas,id_faena',
            'alturas' => 'required|array',
            'alturas.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas.*.altura' => 'required|numeric|min:0'
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

            // Obtener todos los estanques para la faena seleccionada
            $estanques = Estanque::whereIn('id_estanque', array_column($alturas, 'id_estanque'))->get()->keyBy('id_estanque');

            // Verificar que todos los estanques pertenezcan a la faena indicada
            foreach ($alturas as $item) {
                $estanque = $estanques[$item['id_estanque']] ?? null;
                Log::info('Estanque seleccionado:', ['estanque' => $estanque ? $estanque->toArray() : 'Estanque no encontrado']);
                if (!$estanque || $estanque->id_faena != $idFaena) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El estanque #' . $item['id_estanque'] . ' no pertenece a la faena seleccionada'
                    ], 400);
                }
            }

            $litrosTotales = 0;
            $resultadosPorEstanque = [];

            // Calcular litros para cada estanque
            foreach ($alturas as $item) {
                $idEstanque = $item['id_estanque'];
                $altura = $item['altura'];

                $estanque = $estanques[$idEstanque];
                $estanqueStock = EstanqueStock::where('id_estanque', $idEstanque)->first();
                $alturaAnterior = $estanqueStock ? $estanqueStock->altura_actual : 0;

                $diferenciaAltura = $altura - $alturaAnterior;

                // Si la altura disminuyó o es igual, no calculamos litros (es 0)
                $litros = $diferenciaAltura <= 0 ? 0 : ($estanque->capacidad * ($diferenciaAltura / $estanque->altura_nominal)) * 1000;

                $litrosTotales += $litros;

                $resultadosPorEstanque[] = [
                    'id_estanque' => $idEstanque,
                    'nombre_estanque' => $estanque->nombre,
                    'altura_anterior' => $alturaAnterior,
                    'altura_nueva' => $altura,
                    'diferencia_altura' => $diferenciaAltura,
                    'litros_calculados' => $litros
                ];
            }

            return response()->json([
                'success' => true,
                'litros_totales' => $litrosTotales,
                'detalle_estanques' => $resultadosPorEstanque
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular los litros de petróleo: ' . $e->getMessage()
            ], 500);
        }
    }
}
