<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InformeKpi;
use App\Models\KpiValoresEntrada;
use App\Models\KpiResultado;
use App\Models\KpiHistorico;
use App\Models\KpiResultados;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class KpiCalculoController extends Controller
{
    public function guardarKpis(Request $request)
    {
        DB::beginTransaction();
        try {
            // 1. Crear registro en informes_kpi
            $informe = new InformeKpi();
            $informe->id_usuario = auth()->id();
            $informe->id_faena = $request->faena;
            $informe->periodo = $request->periodo;
            $informe->fecha_inicio_periodo = $this->determinarFechaInicio($request->periodo);
            $informe->fecha_fin_periodo = $this->determinarFechaFin($request->periodo);
            $informe->titulo = "Informe KPI " . ucfirst($request->periodo) . " - " . date('d/m/Y');
            $informe->save();
            
            // 2. Guardar valores de entrada
            $valoresEntrada = new KpiValoresEntrada();
            $valoresEntrada->id_informe = $informe->id_informe;
            $valoresEntrada->ley_mineral = $request->input('valores_entrada.concentracion', 1.23); // Valor por defecto
            $valoresEntrada->toneladas_extraidas = $request->input('valores_entrada.toneladas');
            $valoresEntrada->horas_trabajadas = $request->input('valores_entrada.horas', 720);
            $valoresEntrada->combustible_consumido = $request->input('valores_entrada.litros_petroleo', 12500);
            $valoresEntrada->kilometros_recorridos = $request->input('valores_entrada.kilometros', 8500);
            $valoresEntrada->numero_viajes = $request->input('valores_entrada.camionadas');
            $valoresEntrada->precio_combustible = $request->input('valores_entrada.costo_litro', 850);
            $valoresEntrada->save();
            
            // 3. Calcular y guardar los KPIs resultantes
            $kpisCalculados = $this->calcularKpis($valoresEntrada);
            foreach ($kpisCalculados as $kpi) {
                $resultado = new KpiResultados();
                $resultado->id_informe = $informe->id_informe;
                $resultado->codigo_kpi = $kpi['codigo'];
                $resultado->titulo = $kpi['titulo'];
                $resultado->valor = $kpi['valor'];
                $resultado->unidad = $kpi['unidad'];
                $resultado->cambio = $kpi['cambio'] ?? '+0%';
                $resultado->es_positivo = $kpi['es_positivo'] ?? true;
                $resultado->color = $kpi['color'] ?? 'blue';
                $resultado->save();
                
                // 4. Actualizar tabla histórica para análisis de tendencias
                $historico = new KpiHistorico();
                $historico->id_faena = $request->faena;
                $historico->codigo_kpi = $kpi['codigo'];
                $historico->valor = $kpi['valor_numerico']; // Valor sin formato para cálculos
                $historico->fecha = now();
                $historico->periodo = $request->periodo;
                $historico->save();
            }
            
            DB::commit();
            
            // 5. Devolver respuesta al cliente
            return response()->json([
                'status' => 'success',
                'message' => 'KPIs registrados correctamente',
                'data' => $kpisCalculados,
                'proximaActualizacion' => now()->addHours(12), // Restringir actualización por 12 horas
                'actualizacion' => [
                    'fecha' => now(),
                    'faena' => $request->faena,
                    'toneladas' => $valoresEntrada->toneladas_extraidas,
                    'camionadas' => $valoresEntrada->numero_viajes
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al guardar KPIs: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar KPIs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determina la fecha de inicio según el período
     */
    private function determinarFechaInicio($periodo)
    {
        $ahora = Carbon::now();
        
        switch ($periodo) {
            case 'diario':
                return $ahora->startOfDay();
            case 'semanal':
                return $ahora->startOfWeek();
            case 'mensual':
                return $ahora->startOfMonth();
            case 'trimestral':
                return $ahora->startOfQuarter();
            case 'anual':
                return $ahora->startOfYear();
            default:
                return $ahora->startOfMonth(); // Default a mensual
        }
    }

    /**
     * Determina la fecha de fin según el período
     */
    private function determinarFechaFin($periodo)
    {
        $ahora = Carbon::now();
        
        switch ($periodo) {
            case 'diario':
                return $ahora->endOfDay();
            case 'semanal':
                return $ahora->endOfWeek();
            case 'mensual':
                return $ahora->endOfMonth();
            case 'trimestral':
                return $ahora->endOfQuarter();
            case 'anual':
                return $ahora->endOfYear();
            default:
                return $ahora->endOfMonth(); // Default a mensual
        }
    }

    /**
     * Calcula los KPIs basados en los valores de entrada
     */
    private function calcularKpis($valoresEntrada)
    {
        // Cálculo del costo total
        $costoTotal = $valoresEntrada->combustible_consumido * $valoresEntrada->precio_combustible;
        
        // Lista de KPIs a calcular
        $kpis = [];
        
        // Producción Total (toneladas)
        $kpis[] = [
            'codigo' => 'PROD_TOTAL',
            'titulo' => 'Producción Total',
            'valor' => number_format($valoresEntrada->toneladas_extraidas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->toneladas_extraidas,
            'unidad' => 'ton',
            'cambio' => '+0%', // Aquí deberíamos calcular con datos históricos
            'es_positivo' => true,
            'color' => 'blue'
        ];
        
        // Ley Promedio
        $kpis[] = [
            'codigo' => 'LEY_PROM',
            'titulo' => 'Ley Promedio',
            'valor' => number_format($valoresEntrada->ley_mineral, 2, ',', '.'),
            'valor_numerico' => $valoresEntrada->ley_mineral,
            'unidad' => '%',
            'cambio' => '+0%',
            'es_positivo' => true,
            'color' => 'amber'
        ];
        
        // Camionadas
        $kpis[] = [
            'codigo' => 'CAMIONADAS',
            'titulo' => 'Camionadas',
            'valor' => number_format($valoresEntrada->numero_viajes, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->numero_viajes,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => true,
            'color' => 'indigo'
        ];
        
        // Costo Petróleo / Ton
        $costoTonelada = $valoresEntrada->toneladas_extraidas > 0 
            ? $costoTotal / $valoresEntrada->toneladas_extraidas 
            : 0;
            
        $kpis[] = [
            'codigo' => 'COSTO_TON',
            'titulo' => 'Costo Petróleo / Ton',
            'valor' => '$' . number_format($costoTonelada, 0, ',', '.'),
            'valor_numerico' => $costoTonelada,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => false, // Menor costo es mejor
            'color' => 'red'
        ];
        
        // Costo Petróleo / Hora
        $costoHora = $valoresEntrada->horas_trabajadas > 0 
            ? $costoTotal / $valoresEntrada->horas_trabajadas 
            : 0;
            
        $kpis[] = [
            'codigo' => 'COSTO_HORA',
            'titulo' => 'Costo Petróleo / Hora',
            'valor' => '$' . number_format($costoHora, 0, ',', '.'),
            'valor_numerico' => $costoHora,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => false,
            'color' => 'teal'
        ];
        
        // Costo Petróleo / Km
        $costoKm = $valoresEntrada->kilometros_recorridos > 0 
            ? $costoTotal / $valoresEntrada->kilometros_recorridos 
            : 0;
            
        $kpis[] = [
            'codigo' => 'COSTO_KM',
            'titulo' => 'Costo Petróleo / Km',
            'valor' => '$' . number_format($costoKm, 2, ',', '.'),
            'valor_numerico' => $costoKm,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => false,
            'color' => 'purple'
        ];
        
        return $kpis;
    }
    
    /**
     * Endpoint para calcular KPIs sin guardar
     */
    public function calcularKpisEndpoint(Request $request)
    {
        try {
            // Validación básica
            $request->validate([
                'valores_entrada' => 'required|array',
                'valores_entrada.toneladas' => 'nullable|numeric',
                'valores_entrada.camionadas' => 'nullable|numeric',
                'periodo' => 'required|string',
                'faena' => 'required|string'
            ]);
            
            // Crear un objeto temporal con los valores de entrada
            $valoresEntrada = new \stdClass();
            $valoresEntrada->ley_mineral = $request->input('valores_entrada.concentracion', 1.23);
            $valoresEntrada->toneladas_extraidas = $request->input('valores_entrada.toneladas', 0);
            $valoresEntrada->horas_trabajadas = $request->input('valores_entrada.horas', 720);
            $valoresEntrada->combustible_consumido = $request->input('valores_entrada.litros_petroleo', 12500);
            $valoresEntrada->kilometros_recorridos = $request->input('valores_entrada.kilometros', 8500);
            $valoresEntrada->numero_viajes = $request->input('valores_entrada.camionadas', 0);
            $valoresEntrada->precio_combustible = $request->input('valores_entrada.costo_litro', 850);
            
            // Calcular KPIs sin guardar
            $kpisCalculados = $this->calcularKpis($valoresEntrada);
            
            return response()->json([
                'status' => 'success',
                'data' => $kpisCalculados
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al calcular KPIs sin guardar: ' . $e->getMessage(), [
                'request' => $request->all()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error en cálculo de KPIs: ' . $e->getMessage()
            ], 500);
        }
    }
}