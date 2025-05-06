<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KpiCalculadoraController extends Controller
{
    public function calcular(Request $request)
    {
        try {
            Log::info('Calculando KPIs', ['datos_recibidos' => $request->all()]);
            
            // Validar datos de entrada
            $validated = $request->validate([
                'valores_entrada.toneladas' => 'required|numeric|min:0',
                'valores_entrada.litros_petroleo' => 'required|numeric|min:0',
                'valores_entrada.horas' => 'required|numeric|min:0',
                'valores_entrada.kilometros' => 'required|numeric|min:0',
                'valores_entrada.concentracion' => 'required|numeric|min:0',
                'valores_entrada.camionadas' => 'required|numeric|min:0',
                'valores_entrada.costo_litro' => 'required|numeric|min:0',
                'periodo' => 'required|string',
                'faena' => 'required|string',
            ]);
            
            $valores = $request->valores_entrada;
            
            // Calcular KPIs
            $costoTotal = $valores['litros_petroleo'] * $valores['costo_litro'];
            
            $kpisCalculados = [
                'toneladas' => $valores['toneladas'],
                'concentracion' => $valores['concentracion'],
                'camionadas' => $valores['camionadas'],
                'costoTotal' => $costoTotal,
                'costoTonelada' => $valores['toneladas'] > 0 ? $costoTotal / $valores['toneladas'] : 0,
                'costoHora' => $valores['horas'] > 0 ? $costoTotal / $valores['horas'] : 0,
                'costoKm' => $valores['kilometros'] > 0 ? $costoTotal / $valores['kilometros'] : 0,
                'periodo' => $request->periodo,
                'faena' => $request->faena,
            ];
            
            // Opcional: guardar estos cálculos en la base de datos si lo necesitas
            
            return response()->json([
                'status' => 'success',
                'data' => $kpisCalculados
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al calcular KPIs', [
                'error' => $e->getMessage(),
                'linea' => $e->getLine()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al calcular KPIs: ' . $e->getMessage()
            ], 500);
        }
    }
}
