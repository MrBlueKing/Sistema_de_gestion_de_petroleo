<?php

namespace App\Http\Controllers\ApiPdf;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Consumo; // Ajusta según tu modelo
use Illuminate\Support\Facades\Log;

class ConsumosPdfController extends Controller
{
    private $fastApiUrl = 'http://127.0.0.1:8001';
    
    public function generarPdfConsumos(Request $request)
    {
        try {
            // 1. Obtener los mismos datos que muestras en tu ConsumosView
            $consumos = $this->obtenerConsumosFiltrados($request);
            
            // 2. Formatear datos para FastAPI
            $dataForPDF = [
                'titulo' => 'Reporte de Consumos M3H',
                'faena' => $request->faena ?? 'Todas las faenas',
                'fecha_filtro' => ($request->fecha_inicio ?? 'N/A') . ' - ' . ($request->fecha_fin ?? 'N/A'),
                'consumos' => $consumos->map(function($consumo) {
                    return [
                        'fecha' => $consumo->fecha_consumo,
                        'maquina' => $consumo->maquina ?? 'N/A', // Ajusta según tu relación
                        'operador' => $consumo->operador ?? 'N/A', // Ajusta según tu relación
                        'litros' => (float) $consumo->litros_consumidos,
                        'costo' => (float) $consumo->costo_total
                    ];
                })->toArray()
            ];
            
            // 3. Enviar a FastAPI
            $response = Http::timeout(30)->post($this->fastApiUrl . '/generar-pdf-consumos', $dataForPDF);
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'PDF generado correctamente',
                    'data' => $response->json()
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Error al generar PDF',
                'error' => $response->body()
            ], 500);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Obtener consumos filtrados - usa la misma lógica de tu ConsumosView
     */
    private function obtenerConsumosFiltrados(Request $request)
    {
        $query = Consumo::query();
        
        // Aplicar los mismos filtros que usas en tu vista actual
        if ($request->filled('faena')) {
            $query->where('id_faena', $request->faena);
        }
        
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_consumo', '>=', $request->fecha_inicio);
        }
        
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_consumo', '<=', $request->fecha_fin);
        }
        
        if ($request->filled('maquina')) {
            $query->where('id_equipo', $request->maquina);
        }
        
        if ($request->filled('operador')) {
            $query->where('id_dotacion', $request->operador);
        }
        
        // Cargar relaciones si las tienes
        $query->with(['maquina', 'operador', 'faena']); // Ajusta según tus relaciones
        
        return $query->get();
    }
    
    /**
     * Método para probar la conexión con FastAPI
     */
     public function testConexion()
    {
        Log::info('Probando conexión con FastAPI');

        try {
            $response = Http::timeout(5)->get($this->fastApiUrl . '/ping');

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Conexión con FastAPI exitosa',
                    'fastapi_response' => $response->json()
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'FastAPI no responde correctamente'
            ], 503);

        } catch (\Exception $e) {
            Log::error('Error al conectar con FastAPI: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'No se pudo conectar con FastAPI',
                'error' => $e->getMessage()
            ], 503);
        }
    }
}