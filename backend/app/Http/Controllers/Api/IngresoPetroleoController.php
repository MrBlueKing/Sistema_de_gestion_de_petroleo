<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estanque;
use App\Models\IngresoPetroleo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IngresoPetroleoController extends Controller
{
    public function index()
    {
        try {
            $ingresos = IngresoPetroleo::all();

            return response()->json([
                'success' => true,
                'data' => $ingresos
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener ingresos de petróleo', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los ingresos.'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        Log::info('Llegó solicitud a /api/ingresopetroleo', $request->all());
        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'numero_guia' => 'required|string',
            'litros_recibidos' => 'required|numeric|min:0',
            'precio' => 'required|numeric|min:0', // ← nuevo campo validado
            'recibo_conforme' => 'required|boolean',
            'observacion' => 'nullable|string|max:255',
            'id_faena' => 'required|exists:faenas,id_faena', // obligatorio ahora
        ]);

        $estanque = Estanque::where('id_faena', $request->id_faena)->first();

        if (!$estanque) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró un estanque para la faena especificada.'
            ], 404);
        }

        $capacidadRestante = $estanque->capacidad_litros - $estanque->litros_disponibles;

        if ($request->litros_recibidos > $capacidadRestante) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible ingresar esa cantidad de litros. Solo se pueden ingresar ' . $capacidadRestante . ' litros.'
            ], 422);
        }

        try {
            // Crear ingreso
            $ingreso = IngresoPetroleo::create($request->all());

            // Actualizar los litros disponibles en el estanque
            $estanque->litros_disponibles += $request->litros_recibidos;
            $estanque->save();

            return response()->json([
                'success' => true,
                'data' => $ingreso,
                'message' => 'Ingreso registrado correctamente.'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al registrar ingreso de petróleo', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el ingreso.'
            ], 500);
        }
    }
}
