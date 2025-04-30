<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estanque;
use App\Models\IngresoPetroleo;
use App\Models\StockPetroleo;
use App\Models\VerificacionAltura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        Log::info('Llegó solicitud a /api/ingresos-petroleo', $request->all());
    
        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'numero_guia' => 'required|string',
            'litros_documentados' => 'required|numeric|min:0',
            'litros_recibidos' => 'required|numeric|min:0',
            'precio' => 'required|numeric|min:0',
            'precio_total' => 'required|numeric|min:0',
            'recibo_conforme' => 'required|boolean',
            'observacion' => 'nullable|string|max:255',
            'id_faena' => 'required|exists:faenas,id_faena',
            'diferencia' => 'required|numeric',
            'alturas_estanques' => 'required|array',
            'alturas_estanques.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas_estanques.*.altura' => 'required|numeric|min:0'
        ]);
    
        try {
            // Iniciar transacción para garantizar consistencia
            DB::beginTransaction();
    
            // Crear el registro de ingreso con los campos según tu estructura de BD
            $ingreso = new IngresoPetroleo();
            $ingreso->id_usuario = $request->id_usuario;
            $ingreso->id_faena = $request->id_faena;
            $ingreso->numero_guia = $request->numero_guia;
            $ingreso->litros_documentados = $request->litros_documentados;
            $ingreso->litros_recibidos = $request->litros_recibidos;
            $ingreso->precio = $request->precio;
            $ingreso->precio_total = $request->precio_total;
            $ingreso->recibo_conforme = $request->recibo_conforme;
            $ingreso->observacion = $request->observacion;
            $ingreso->diferencia = $request->diferencia;
            $ingreso->save();
    
            // Guardar las verificaciones de altura
            if ($request->has('alturas_estanques') && is_array($request->alturas_estanques)) {
                foreach ($request->alturas_estanques as $altura) {
                    $verificacion = new VerificacionAltura();
                    $verificacion->id_estanque = $altura['id_estanque'];
                    $verificacion->id_ingreso = $ingreso->id_ingreso;
                    $verificacion->altura_medicion = $altura['altura'];
    
                    // Obtener información del estanque
                    $estanque = Estanque::find($altura['id_estanque']);
    
                    // Calcular volumen
                    $volumenCalculado = ($altura['altura'] / $estanque->altura_nominal) * $estanque->capacidad * 1000;
                    $verificacion->volumen_calculado = $volumenCalculado;
                    $verificacion->verificado = true;
                    $verificacion->save();
    
                    // Actualizar estanque si tiene el campo litros_disponibles
                    if (isset($estanque->litros_disponibles)) {
                        $estanque->litros_disponibles += $volumenCalculado;
                        $estanque->save();
                    }
                }
            }
    
            // Actualizar stock global si existe
            $stockGlobal = StockPetroleo::where('id_faena', $request->id_faena)->first();
            if ($stockGlobal) {
                // Usar litros_documentados (los calculados) para actualizar el stock
                $stockGlobal->stock_actual += $request->litros_documentados;
                $stockGlobal->ultima_actualizacion = now();
                $stockGlobal->save();
            }
    
            DB::commit();
    
            return response()->json([
                'success' => true,
                'data' => $ingreso,
                'message' => 'Ingreso registrado correctamente.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar ingreso de petróleo', ['error' => $e->getMessage()]);
    
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el ingreso: ' . $e->getMessage()
            ], 500);
        }
    }
}
