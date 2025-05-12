<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InformeKpi;
use App\Models\KpiValoresEntrada;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class KpiCalculoController extends Controller
{
   /**
     * Calcula y guarda los KPIs basados en los datos de entrada
     */
    public function calcular(Request $request)
    {
        Log::info('Iniciando cálculo de KPIs', ['request' => $request->all()]);
        // Actualizar la validación con los nuevos campos
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|numeric|exists:users,id',
            'faena' => 'required|numeric|exists:faenas,id_faena',
            'periodo' => 'required|string|in:diario,semanal,mensual,trimestral,anual',
            'valores_entrada.toneladas_extraidas' => 'required|numeric|min:0',
            'valores_entrada.camionadas' => 'required|numeric|min:0',
            'valores_entrada.petroleo_toneladas' => 'required|numeric|min:0',
            'valores_entrada.petroleo_horas' => 'required|numeric|min:0',
            'valores_entrada.petroleo_kilometros' => 'required|numeric|min:0',
            'valores_entrada.horas_trabajadas' => 'nullable|numeric|min:0',
            'valores_entrada.rendimiento' => 'nullable|numeric|min:0',
            'mes_registro' => 'nullable|integer|min:1|max:12', // Nuevo campo para mes de registro
            'ano_registro' => 'nullable|integer|min:2000|max:2100' // Nuevo campo para año de registro
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Usar el user_id del request o por defecto el ID 3 (para pruebas)
            $userId = $request->input('user_id', 3);

            // Si se especificó un mes y año para el registro, usarlos
            // Si no, usar el mes anterior al actual por defecto
            $periodoDate = Carbon::now();
            
            // Obtener el mes y año de registro (si se especificaron)
            $mesRegistro = $request->input('mes_registro');
            $anoRegistro = $request->input('ano_registro');
            
            // Si no se especifican mes/año en la petición, usar el mes anterior al actual
            if (!$mesRegistro || !$anoRegistro) {
                $periodoDate = Carbon::now()->subMonth();
                $mesRegistro = $periodoDate->month;
                $anoRegistro = $periodoDate->year;
            } else {
                // Si se especificaron mes/año, crear una fecha con esos valores
                $periodoDate = Carbon::createFromDate($anoRegistro, $mesRegistro, 1);
            }

            // 1. Crear registro en informes_kpi
            $informe = new InformeKpi();
            $informe->id_usuario = $userId;
            $informe->id_faena = $request->faena;
            $informe->periodo = $request->periodo;
            
            // Determinar fechas de inicio y fin basadas en el período y el mes/año especificados
            $fechasPeriodo = $this->determinarFechasPeriodo($request->periodo, $periodoDate);
            $informe->fecha_inicio_periodo = $fechasPeriodo['inicio'];
            $informe->fecha_fin_periodo = $fechasPeriodo['fin'];
            
            // Generar un título descriptivo incluyendo el período y la fecha actual de creación
            $nombreMes = $periodoDate->locale('es')->monthName;
            $informe->titulo = "Informe KPI " . ucfirst($request->periodo) . " - $nombreMes $anoRegistro";
            $informe->save();

            // 2. Guardar valores de entrada con los nuevos campos
            $valoresEntrada = new KpiValoresEntrada();
            $valoresEntrada->id_informe = $informe->id_informe;
            $valoresEntrada->toneladas_extraidas = $request->input('valores_entrada.toneladas_extraidas');
            $valoresEntrada->camionadas = $request->input('valores_entrada.camionadas');
            $valoresEntrada->petroleo_toneladas = $request->input('valores_entrada.petroleo_toneladas');
            $valoresEntrada->petroleo_horas = $request->input('valores_entrada.petroleo_horas');
            $valoresEntrada->petroleo_kilometros = $request->input('valores_entrada.petroleo_kilometros');

            // Añadir nuevos campos
            $valoresEntrada->horas_trabajadas = $request->input('valores_entrada.horas_trabajadas', 0);

            // Calcular rendimiento si no viene en el request
            $rendimiento = $request->input('valores_entrada.rendimiento');
            if (!$rendimiento && $valoresEntrada->camionadas > 0) {
                $rendimiento = $valoresEntrada->toneladas_extraidas / $valoresEntrada->camionadas;
            }
            $valoresEntrada->rendimiento = $rendimiento;

            $valoresEntrada->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Datos registrados correctamente para ' . ucfirst($nombreMes) . ' ' . $anoRegistro,
                'periodo_registrado' => [
                    'mes' => $mesRegistro,
                    'ano' => $anoRegistro,
                    'nombre_mes' => $nombreMes,
                    'fecha_inicio' => $informe->fecha_inicio_periodo->format('Y-m-d'),
                    'fecha_fin' => $informe->fecha_fin_periodo->format('Y-m-d'),
                ],
                'data' => $this->calcularKpis($valoresEntrada)
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
     * Determina las fechas de inicio y fin según el período y la fecha base
     */
    private function determinarFechasPeriodo($periodo, Carbon $fechaBase)
    {
        // Clonar las fechas para evitar modificar la original
        $fechaInicio = clone $fechaBase;
        $fechaFin = clone $fechaBase;
        
        switch ($periodo) {
            case 'diario':
                $fechaInicio = $fechaInicio->startOfDay();
                $fechaFin = $fechaFin->endOfDay();
                break;
            case 'semanal':
                $fechaInicio = $fechaInicio->startOfWeek();
                $fechaFin = $fechaFin->endOfWeek();
                break;
            case 'mensual':
                $fechaInicio = $fechaInicio->startOfMonth();
                $fechaFin = $fechaFin->endOfMonth();
                break;
            case 'trimestral':
                $fechaInicio = $fechaInicio->startOfQuarter();
                $fechaFin = $fechaFin->endOfQuarter();
                break;
            case 'anual':
                $fechaInicio = $fechaInicio->startOfYear();
                $fechaFin = $fechaFin->endOfYear();
                break;
            default:
                // Por defecto usar mensual
                $fechaInicio = $fechaInicio->startOfMonth();
                $fechaFin = $fechaFin->endOfMonth();
                break;
        }
        
        return [
            'inicio' => $fechaInicio,
            'fin' => $fechaFin
        ];
    }

    /**
     * Calcula los KPIs basados en los valores de entrada
     */
    private function calcularKpis($valoresEntrada)
    {
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

        // Camionadas
        $kpis[] = [
            'codigo' => 'CAMIONADAS',
            'titulo' => 'Camionadas',
            'valor' => number_format($valoresEntrada->camionadas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->camionadas,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => true,
            'color' => 'indigo'
        ];

        // Horas Trabajadas (nuevo KPI)
        $kpis[] = [
            'codigo' => 'HORAS_TRABAJADAS',
            'titulo' => 'Horas Trabajadas',
            'valor' => number_format($valoresEntrada->horas_trabajadas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->horas_trabajadas,
            'unidad' => 'hrs',
            'cambio' => '+0%',
            'es_positivo' => true,
            'color' => 'green',
            'subtext' => 'Total de horas registradas'
        ];

        // Petróleo por Tonelada
        $kpis[] = [
            'codigo' => 'PETROLEO_TON',
            'titulo' => 'Petróleo por Tonelada',
            'valor' => '$' . number_format($valoresEntrada->petroleo_toneladas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->petroleo_toneladas,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => false, // Menor costo es mejor
            'color' => 'red'
        ];

        // Petróleo por Hora
        $kpis[] = [
            'codigo' => 'PETROLEO_HORA',
            'titulo' => 'Petróleo por Hora',
            'valor' => '$' . number_format($valoresEntrada->petroleo_horas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->petroleo_horas,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => false,
            'color' => 'teal'
        ];

        // Petróleo por Kilómetro
        $kpis[] = [
            'codigo' => 'PETROLEO_KM',
            'titulo' => 'Petróleo por Kilómetro',
            'valor' => '$' . number_format($valoresEntrada->petroleo_kilometros, 2, ',', '.'),
            'valor_numerico' => $valoresEntrada->petroleo_kilometros,
            'unidad' => '',
            'cambio' => '+0%',
            'es_positivo' => false,
            'color' => 'purple'
        ];

        // Rendimiento (Ton/Camionada)
        $rendimiento = $valoresEntrada->rendimiento;
        if ($rendimiento == 0 && $valoresEntrada->camionadas > 0) {
            $rendimiento = $valoresEntrada->toneladas_extraidas / $valoresEntrada->camionadas;
        }

        $kpis[] = [
            'codigo' => 'RENDIMIENTO',
            'titulo' => 'Rendimiento',
            'valor' => number_format($rendimiento, 2, ',', '.'),
            'valor_numerico' => $rendimiento,
            'unidad' => 'ton/viaje',
            'cambio' => '+0%',
            'es_positivo' => true,
            'color' => 'green'
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
            $validator = Validator::make($request->all(), [
                'valores_entrada' => 'required|array',
                'valores_entrada.toneladas_extraidas' => 'required|numeric|min:0',
                'valores_entrada.camionadas' => 'required|numeric|min:0',
                'valores_entrada.petroleo_toneladas' => 'required|numeric|min:0',
                'valores_entrada.petroleo_horas' => 'required|numeric|min:0',
                'valores_entrada.petroleo_kilometros' => 'required|numeric|min:0',
                'periodo' => 'required|string|in:diario,semanal,mensual,trimestral,anual',
                'faena' => 'required|numeric|exists:faenas,id_faena'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Crear un objeto temporal con los valores de entrada
            $valoresEntrada = new \stdClass();
            $valoresEntrada->toneladas_extraidas = $request->input('valores_entrada.toneladas_extraidas');
            $valoresEntrada->camionadas = $request->input('valores_entrada.camionadas');
            $valoresEntrada->petroleo_toneladas = $request->input('valores_entrada.petroleo_toneladas');
            $valoresEntrada->petroleo_horas = $request->input('valores_entrada.petroleo_horas');
            $valoresEntrada->petroleo_kilometros = $request->input('valores_entrada.petroleo_kilometros');

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
    /**
     * Obtiene las faenas que aún no tienen datos ingresados en el mes actual
     */
    public function getFaenasDisponibles(Request $request)
    {
        try {
            // Obtener el primer día del mes actual
            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();

            // Obtener todas las faenas
            $todasFaenas = DB::table('faenas')
                ->select('id_faena', 'ubicacion as nombre')
                ->where('id_faena', '>', 0)
                ->get();

            // Obtener las faenas con registros en el mes actual
            $faenasConRegistros = DB::table('informes_kpi')
                ->select('id_faena')
                ->whereBetween('fecha_creacion', [$inicioMes, $finMes])
                ->where('periodo', 'mensual')
                ->distinct()
                ->pluck('id_faena')
                ->toArray();

            // Filtrar las faenas disponibles (las que no tienen registros)
            $faenasDisponibles = $todasFaenas->filter(function ($faena) use ($faenasConRegistros) {
                return !in_array($faena->id_faena, $faenasConRegistros);
            })->values();

            // Retornar las faenas disponibles
            return response()->json([
                'status' => 'success',
                'data' => $faenasDisponibles,
                'mes_actual' => Carbon::now()->format('Y-m')
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener faenas disponibles: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener faenas disponibles: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Calcula los KPIs basados en los valores de entrada y datos históricos
     */
    private function calcularKpisAvanzados($valoresEntrada, $idFaena, $periodo)
    {

        Log::info('Calculando KPIs avanzados', [
            'valores_entrada' => $valoresEntrada,
            'id_faena' => $idFaena,
            'periodo' => $periodo
        ]);
        // Array para almacenar resultados
        $kpis = [];

        // Obtener fecha de inicio y fin del periodo actual
        $fechaInicio = $this->determinarFechaInicio($periodo);
        $fechaFin = $this->determinarFechaFin($periodo);

        // Obtener fecha de inicio y fin del periodo anterior (para comparación)
        $fechaInicioAnterior = clone $fechaInicio;
        $fechaFinAnterior = clone $fechaFin;

        // Retroceder un periodo para comparación
        switch ($periodo) {
            case 'diario':
                $fechaInicioAnterior->subDay();
                $fechaFinAnterior->subDay();
                break;
            case 'semanal':
                $fechaInicioAnterior->subWeek();
                $fechaFinAnterior->subWeek();
                break;
            case 'mensual':
                $fechaInicioAnterior->subMonth();
                $fechaFinAnterior->subMonth();
                break;
            case 'trimestral':
                $fechaInicioAnterior->subMonths(3);
                $fechaFinAnterior->subMonths(3);
                break;
            case 'anual':
                $fechaInicioAnterior->subYear();
                $fechaFinAnterior->subYear();
                break;
        }

        // Consultar consumo total de combustible para el periodo actual
        $consumoActual = DB::table('consumos')
            ->select(DB::raw('SUM(litros_consumidos) as total_litros, AVG(precio_litro) as precio_promedio'))
            ->where('id_faena', $idFaena)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->first();

        // Consultar consumo del periodo anterior para comparación
        $consumoAnterior = DB::table('consumos')
            ->select(DB::raw('SUM(litros_consumidos) as total_litros'))
            ->where('id_faena', $idFaena)
            ->whereBetween('fecha_consumo', [$fechaInicioAnterior, $fechaFinAnterior])
            ->first();

        // Obtener el último consumo por máquina para restarlo (no ha sido consumido totalmente)
        $ultimosConsumos = DB::table('consumos')
            ->select('id_equipo', DB::raw('MAX(id_consumo) as ultimo_id'))
            ->where('id_faena', $idFaena)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->groupBy('id_equipo')
            ->get();

        $litrosADescontar = 0;
        $idsUltimosConsumos = [];

        foreach ($ultimosConsumos as $ultimo) {
            $idsUltimosConsumos[] = $ultimo->ultimo_id;
        }

        if (!empty($idsUltimosConsumos)) {
            $litrosADescontar = DB::table('consumos')
                ->whereIn('id_consumo', $idsUltimosConsumos)
                ->sum('litros_consumidos');
        }

        // Calcular consumo real (descontando los últimos registros)
        $litrosReales = ($consumoActual->total_litros ?? 0) - $litrosADescontar;
        if ($litrosReales < 0) $litrosReales = 0;

        // Calcular costo total del combustible
        $precioPromedio = $consumoActual->precio_promedio ?? 1500; // Precio por defecto si no hay datos
        $costoTotal = $litrosReales * $precioPromedio;

        // Calcular métricas de rendimiento
        $rendimiento = $valoresEntrada->camionadas > 0
            ? $valoresEntrada->toneladas_extraidas / $valoresEntrada->camionadas
            : 0;

        // CAMBIO: Obtener datos del periodo anterior usando la misma tabla kpi_valores_entrada
        $valorEntradaAnterior = DB::table('informes_kpi')
            ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
            ->where('informes_kpi.id_faena', $idFaena)
            ->where('informes_kpi.periodo', $periodo)
            ->whereBetween('informes_kpi.fecha_creacion', [$fechaInicioAnterior, $fechaFinAnterior])
            ->select('kpi_valores_entrada.*')
            ->orderBy('informes_kpi.fecha_creacion', 'desc')
            ->first();

        // Calcular cambios porcentuales
        $cambioProd = 0;
        $cambioViajes = 0;
        $cambioConsumo = 0;

        if ($valorEntradaAnterior) {
            // Si hay datos anteriores, calcular los cambios porcentuales
            if ($valorEntradaAnterior->toneladas_extraidas > 0) {
                $cambioProd = (($valoresEntrada->toneladas_extraidas - $valorEntradaAnterior->toneladas_extraidas) / $valorEntradaAnterior->toneladas_extraidas) * 100;
            }

            if ($valorEntradaAnterior->camionadas > 0) {
                $cambioViajes = (($valoresEntrada->camionadas - $valorEntradaAnterior->camionadas) / $valorEntradaAnterior->camionadas) * 100;
            }

            // Si hay datos de consumo anterior, calcular cambio
            $consumoAnteriorVal = $consumoAnterior->total_litros ?? 0;
            if ($consumoAnteriorVal > 0) {
                $cambioConsumo = (($litrosReales - $consumoAnteriorVal) / $consumoAnteriorVal) * 100;
            }
        }

        // Formatear cambios como cadenas con signo
        $formatoCambioProd = ($cambioProd >= 0 ? '+' : '') . number_format($cambioProd, 1, ',', '.') . '%';
        $formatoCambioViajes = ($cambioViajes >= 0 ? '+' : '') . number_format($cambioViajes, 1, ',', '.') . '%';
        $formatoCambioConsumo = ($cambioConsumo >= 0 ? '+' : '') . number_format($cambioConsumo, 1, ',', '.') . '%';

        // Calcular costo por tonelada, hora y kilómetro, considerando tanto los valores calculados como los de entrada
        $costoPorTonelada = $valoresEntrada->petroleo_toneladas > 0
            ? $valoresEntrada->petroleo_toneladas
            : ($valoresEntrada->toneladas_extraidas > 0 ? $costoTotal / $valoresEntrada->toneladas_extraidas : 0);

        $costoPorHora = $valoresEntrada->petroleo_horas > 0
            ? $valoresEntrada->petroleo_horas
            : 0; // Si no tenemos horas_trabajadas, dejamos en 0 o calculamos con otro método

        $costoPorKm = $valoresEntrada->petroleo_kilometros > 0
            ? $valoresEntrada->petroleo_kilometros
            : 0; // Si no tenemos kilometros_recorridos, dejamos en 0

        // Calcular cambios en costos si hay datos anteriores
        $cambioCostoTon = 0;
        $cambioCostoHora = 0;
        $cambioCostoKm = 0;

        if ($valorEntradaAnterior) {
            if ($valorEntradaAnterior->petroleo_toneladas > 0) {
                $cambioCostoTon = (($costoPorTonelada - $valorEntradaAnterior->petroleo_toneladas) / $valorEntradaAnterior->petroleo_toneladas) * 100;
            }

            if ($valorEntradaAnterior->petroleo_horas > 0) {
                $cambioCostoHora = (($costoPorHora - $valorEntradaAnterior->petroleo_horas) / $valorEntradaAnterior->petroleo_horas) * 100;
            }

            if ($valorEntradaAnterior->petroleo_kilometros > 0) {
                $cambioCostoKm = (($costoPorKm - $valorEntradaAnterior->petroleo_kilometros) / $valorEntradaAnterior->petroleo_kilometros) * 100;
            }
        }

        // Formatear cambios de costos
        $formatoCambioCostoTon = ($cambioCostoTon >= 0 ? '+' : '') . number_format($cambioCostoTon, 1, ',', '.') . '%';
        $formatoCambioCostoHora = ($cambioCostoHora >= 0 ? '+' : '') . number_format($cambioCostoHora, 1, ',', '.') . '%';
        $formatoCambioCostoKm = ($cambioCostoKm >= 0 ? '+' : '') . number_format($cambioCostoKm, 1, ',', '.') . '%';

        // Rendimiento anterior y su cambio
        $rendimientoAnterior = 0;
        $cambioRendimiento = 0;

        if ($valorEntradaAnterior && $valorEntradaAnterior->camionadas > 0) {
            $rendimientoAnterior = $valorEntradaAnterior->toneladas_extraidas / $valorEntradaAnterior->camionadas;

            if ($rendimientoAnterior > 0) {
                $cambioRendimiento = (($rendimiento - $rendimientoAnterior) / $rendimientoAnterior) * 100;
            }
        }

        $formatoCambioRendimiento = ($cambioRendimiento >= 0 ? '+' : '') . number_format($cambioRendimiento, 1, ',', '.') . '%';

        // Constructores de los KPIs (igual pero con los cambios precisos)

        // Producción Total (toneladas)
        $kpis[] = [
            'codigo' => 'PROD_TOTAL',
            'titulo' => 'Producción Total',
            'valor' => number_format($valoresEntrada->toneladas_extraidas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->toneladas_extraidas,
            'unidad' => 'ton',
            'cambio' => $formatoCambioProd,
            'es_positivo' => $cambioProd >= 0,
            'color' => 'blue',
            'subtext' => 'Toneladas extraídas'
        ];

        // Camionadas
        $kpis[] = [
            'codigo' => 'CAMIONADAS',
            'titulo' => 'Camionadas',
            'valor' => number_format($valoresEntrada->camionadas, 0, ',', '.'),
            'valor_numerico' => $valoresEntrada->camionadas,
            'unidad' => '',
            'cambio' => $formatoCambioViajes,
            'es_positivo' => $cambioViajes >= 0,
            'color' => 'indigo',
            'subtext' => 'Número de viajes realizados'
        ];

        // Petróleo por Tonelada
        $kpis[] = [
            'codigo' => 'PETROLEO_TON',
            'titulo' => 'Costo Petróleo / Ton',
            'valor' => '$' . number_format($costoPorTonelada, 0, ',', '.'),
            'valor_numerico' => $costoPorTonelada,
            'unidad' => '',
            'cambio' => $formatoCambioCostoTon,
            'es_positivo' => $cambioCostoTon <= 0, // Negativo es mejor (menos gasto)
            'color' => 'red',
            'subtext' => 'Costo por tonelada producida'
        ];

        // Petróleo por Hora
        $kpis[] = [
            'codigo' => 'PETROLEO_HORA',
            'titulo' => 'Costo Petróleo / Hora',
            'valor' => '$' . number_format($costoPorHora, 0, ',', '.'),
            'valor_numerico' => $costoPorHora,
            'unidad' => '',
            'cambio' => $formatoCambioCostoHora,
            'es_positivo' => $cambioCostoHora <= 0,
            'color' => 'teal',
            'subtext' => 'Costo por hora de operación'
        ];

        // Petróleo por Kilómetro
        $kpis[] = [
            'codigo' => 'PETROLEO_KM',
            'titulo' => 'Costo Petróleo / Km',
            'valor' => '$' . number_format($costoPorKm, 2, ',', '.'),
            'valor_numerico' => $costoPorKm,
            'unidad' => '',
            'cambio' => $formatoCambioCostoKm,
            'es_positivo' => $cambioCostoKm <= 0,
            'color' => 'purple',
            'subtext' => 'Costo por kilómetro recorrido'
        ];

        // Rendimiento (Ton/Camionada)
        $kpis[] = [
            'codigo' => 'RENDIMIENTO',
            'titulo' => 'Rendimiento',
            'valor' => number_format($rendimiento, 2, ',', '.'),
            'valor_numerico' => $rendimiento,
            'unidad' => 'ton/viaje',
            'cambio' => $formatoCambioRendimiento,
            'es_positivo' => $cambioRendimiento >= 0,
            'color' => 'green',
            'subtext' => 'Toneladas por viaje'
        ];

        // Consumo de Combustible
        $kpis[] = [
            'codigo' => 'CONSUMO_COMBUSTIBLE',
            'titulo' => 'Consumo Combustible',
            'valor' => number_format($litrosReales, 0, ',', '.'),
            'valor_numerico' => $litrosReales,
            'unidad' => 'lts',
            'cambio' => $formatoCambioConsumo,
            'es_positivo' => $cambioConsumo <= 0, // Menor consumo es mejor
            'color' => 'amber',
            'subtext' => 'Litros consumidos'
        ];

        // Gasto Total en Combustible
        $kpis[] = [
            'codigo' => 'GASTO_COMBUSTIBLE',
            'titulo' => 'Gasto Combustible',
            'valor' => '$' . number_format($costoTotal, 0, ',', '.'),
            'valor_numerico' => $costoTotal,
            'unidad' => '',
            'cambio' => $formatoCambioConsumo,
            'es_positivo' => $cambioConsumo <= 0,
            'color' => 'orange',
            'subtext' => 'Costo total de combustible'
        ];

        // Eficiencia (Toneladas/Litro)
        $eficiencia = $litrosReales > 0 ? $valoresEntrada->toneladas_extraidas / $litrosReales : 0;
        $kpis[] = [
            'codigo' => 'EFICIENCIA_COMBUSTIBLE',
            'titulo' => 'Eficiencia',
            'valor' => number_format($eficiencia, 2, ',', '.'),
            'valor_numerico' => $eficiencia,
            'unidad' => 'ton/lt',
            'cambio' => '+0%', // No tenemos datos históricos para esto todavía
            'es_positivo' => true, // Mayor eficiencia es mejor
            'color' => 'green',
            'subtext' => 'Toneladas por litro'
        ];

        return $kpis;
    }
    /**
     * Obtiene los KPIs actuales y del periodo anterior para comparación
     */
    public function obtenerKpisComparativos(Request $request)
    {
        try {
            $idFaena = $request->input('faena'); // Default a la primera faena
            $periodo = $request->input('periodo', 'mensual');

            // Determinar fechas del periodo actual
            $fechaInicio = $this->determinarFechaInicio($periodo);
            $fechaFin = $this->determinarFechaFin($periodo);

            // Determinar fechas del periodo anterior
            $fechaInicioAnterior = clone $fechaInicio;
            $fechaFinAnterior = clone $fechaFin;

            switch ($periodo) {
                case 'diario':
                    $fechaInicioAnterior->subDay();
                    $fechaFinAnterior->subDay();
                    break;
                case 'semanal':
                    $fechaInicioAnterior->subWeek();
                    $fechaFinAnterior->subWeek();
                    break;
                case 'mensual':
                    $fechaInicioAnterior->subMonth();
                    $fechaFinAnterior->subMonth();
                    break;
                case 'trimestral':
                    $fechaInicioAnterior->subMonths(3);
                    $fechaFinAnterior->subMonths(3);
                    break;
                case 'anual':
                    $fechaInicioAnterior->subYear();
                    $fechaFinAnterior->subYear();
                    break;
            }

            // Obtener los valores de entrada del periodo actual
            $valorEntradaActual = DB::table('informes_kpi')
                ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
                ->where('informes_kpi.id_faena', $idFaena)
                ->where('informes_kpi.periodo', $periodo)
                ->whereBetween('informes_kpi.fecha_creacion', [$fechaInicio, $fechaFin])
                ->select('kpi_valores_entrada.*', 'informes_kpi.id_informe', 'informes_kpi.id_faena')
                ->orderBy('informes_kpi.fecha_creacion', 'desc')
                ->first();

            // Obtener los valores de entrada del periodo anterior
            $valorEntradaAnterior = DB::table('informes_kpi')
                ->join('kpi_valores_entrada', 'informes_kpi.id_informe', '=', 'kpi_valores_entrada.id_informe')
                ->where('informes_kpi.id_faena', $idFaena)
                ->where('informes_kpi.periodo', $periodo)
                ->whereBetween('informes_kpi.fecha_creacion', [$fechaInicioAnterior, $fechaFinAnterior])
                ->select('kpi_valores_entrada.*', 'informes_kpi.id_informe', 'informes_kpi.id_faena')
                ->orderBy('informes_kpi.fecha_creacion', 'desc')
                ->first();

            if (!$valorEntradaActual) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'No hay datos para el periodo actual'
                ], 200);
            }

            // Calcular KPIs para ambos periodos
            $kpisActuales = $this->calcularKpisAvanzados($valorEntradaActual, $idFaena, $periodo);
            $kpisAnteriores = $valorEntradaAnterior
                ? $this->calcularKpisAvanzados($valorEntradaAnterior, $idFaena, $periodo)
                : [];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'kpis_actuales' => $kpisActuales,
                    'kpis_anteriores' => $kpisAnteriores,
                    'info_periodo' => [
                        'actual' => [
                            'inicio' => $fechaInicio->format('Y-m-d'),
                            'fin' => $fechaFin->format('Y-m-d')
                        ],
                        'anterior' => [
                            'inicio' => $fechaInicioAnterior->format('Y-m-d'),
                            'fin' => $fechaFinAnterior->format('Y-m-d')
                        ]
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener KPIs comparativos: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los KPIs comparativos: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Obtiene el costo total de petróleo sin considerar los últimos consumos
     */
    // En tu controlador
    /**
     * Obtiene el costo total de petróleo sin considerar los últimos consumos
     * Modificado para filtrar por faena
     */
    /**
     * Obtiene el costo total de petróleo sin considerar los últimos consumos
     * Modificado para filtrar por faena y agregar costos por tipo de máquina
     */
    public function getCostoPetroleoSinUltimosConsumos(Request $request)
    {
        try {
            // Obtener la faena seleccionada (si existe)
            $idFaena = $request->input('faena');

            // Registrar la faena seleccionada para depuración
            Log::info('Obteniendo datos de petróleo filtrados por faena:', ['id_faena' => $idFaena]);

            // Obtener el primer y último día del mes actual
            $primerDiaMes = Carbon::now()->startOfMonth();
            $ultimoDiaMes = Carbon::now()->endOfMonth();

            // Obtener el primer y último día del mes anterior
            $primerDiaMesAnterior = Carbon::now()->subMonth()->startOfMonth();
            $ultimoDiaMesAnterior = Carbon::now()->subMonth()->endOfMonth();

            // Función para obtener datos por período
            $obtenerDatosPeriodo = function ($fechaInicio, $fechaFin, $idFaena = null) {
                // 1. Identificar los últimos consumos de cada máquina para excluirlos
                $ultimosConsumos = DB::table('consumos')
                    ->select('id_equipo', DB::raw('MAX(id_consumo) as ultimo_consumo_id'))
                    ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);

                if ($idFaena) {
                    $ultimosConsumos->where('id_faena', $idFaena);
                }

                $ultimosConsumos = $ultimosConsumos->groupBy('id_equipo')->get();

                // Guardar IDs de últimos consumos
                $idsUltimosConsumos = [];
                foreach ($ultimosConsumos as $ultimo) {
                    $idsUltimosConsumos[] = $ultimo->ultimo_consumo_id;
                }

                // 2. Obtener datos de consumo excluyendo los últimos consumos
                $consumosQuery = DB::table('consumos as c')
                    ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                    ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                    ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin]);

                if (!empty($idsUltimosConsumos)) {
                    $consumosQuery->whereNotIn('c.id_consumo', $idsUltimosConsumos);
                }

                if ($idFaena) {
                    $consumosQuery->where('c.id_faena', $idFaena);
                }

                $consumos = $consumosQuery->select(
                    'c.id_consumo',
                    'c.id_equipo',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.precio_litro',
                    'c.medicion',
                    'm.nombre_maquina',
                    'cm.tipo_medicion'
                )->get();

                // 3. Calcular costos totales (global y por tipo de máquina)
                $costoTotal = 0;
                $costoTotalHorometro = 0;
                $costoTotalKilometraje = 0;
                $litrosTotalHorometro = 0;
                $litrosTotalKilometraje = 0;

                foreach ($consumos as $consumo) {
                    $costo = $consumo->litros_consumidos * $consumo->precio_litro;
                    $costoTotal += $costo;

                    if (strtolower($consumo->tipo_medicion) === 'horometro') {
                        $costoTotalHorometro += $costo;
                        $litrosTotalHorometro += $consumo->litros_consumidos;
                    } elseif (strtolower($consumo->tipo_medicion) === 'kilometraje') {
                        $costoTotalKilometraje += $costo;
                        $litrosTotalKilometraje += $consumo->litros_consumidos;
                    }
                }

                // 4. Obtener datos de primeras y últimas mediciones
                $medicionesQuery = DB::table('consumos as c')
                    ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                    ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                    ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin]);

                if ($idFaena) {
                    $medicionesQuery->where('c.id_faena', $idFaena);
                }

                $mediciones = $medicionesQuery->select(
                    'c.id_equipo',
                    'cm.tipo_medicion',
                    DB::raw('MIN(c.fecha_consumo) as primera_fecha'),
                    DB::raw('MAX(c.fecha_consumo) as ultima_fecha')
                )
                    ->groupBy('c.id_equipo', 'cm.tipo_medicion')
                    ->get();

                // Obtener mediciones iniciales y finales
                $detallesMaquinas = [];
                $totalMedicionHorometro = 0;
                $totalMedicionKilometraje = 0;

                foreach ($mediciones as $medicion) {
                    // Obtener medición inicial
                    $medicionInicialQuery = DB::table('consumos')
                        ->where('id_equipo', $medicion->id_equipo)
                        ->where('fecha_consumo', $medicion->primera_fecha);

                    if ($idFaena) {
                        $medicionInicialQuery->where('id_faena', $idFaena);
                    }

                    $medicionInicial = $medicionInicialQuery->first();

                    // Obtener medición final
                    $medicionFinalQuery = DB::table('consumos')
                        ->where('id_equipo', $medicion->id_equipo)
                        ->where('fecha_consumo', $medicion->ultima_fecha);

                    if ($idFaena) {
                        $medicionFinalQuery->where('id_faena', $idFaena);
                    }

                    $medicionFinal = $medicionFinalQuery->first();

                    if ($medicionInicial && $medicionFinal) {
                        $diferenciaMedicion = $medicionFinal->medicion - $medicionInicial->medicion;

                        // Crear el detalle de la máquina
                        $detalleMaquina = new \stdClass();
                        $detalleMaquina->id_equipo = $medicion->id_equipo;

                        // Obtener datos adicionales de máquina
                        $maquina = DB::table('maquinas')
                            ->join('categorias_maquinas', 'maquinas.id_categoria', '=', 'categorias_maquinas.id_categoria')
                            ->where('maquinas.id_maquina', $medicion->id_equipo)
                            ->select('maquinas.id_maquina', 'maquinas.nombre_maquina', 'categorias_maquinas.tipo_medicion')
                            ->first();

                        if ($maquina) {
                            $detalleMaquina->id_maquina = $maquina->id_maquina;
                            $detalleMaquina->nombre_maquina = $maquina->nombre_maquina;
                            $detalleMaquina->tipo_medicion = $maquina->tipo_medicion;
                        } else {
                            $detalleMaquina->nombre_maquina = "Máquina ID " . $medicion->id_equipo;
                            $detalleMaquina->tipo_medicion = $medicion->tipo_medicion;
                        }

                        // Calcular litros y costo
                        $litrosMaquina = 0;
                        $costoMaquina = 0;

                        foreach ($consumos as $consumo) {
                            if ($consumo->id_equipo == $medicion->id_equipo) {
                                $litrosMaquina += $consumo->litros_consumidos;
                                $costoMaquina += $consumo->litros_consumidos * $consumo->precio_litro;
                            }
                        }

                        $detalleMaquina->total_litros = $litrosMaquina;
                        $detalleMaquina->costo_total_maquina = $costoMaquina;
                        $detalleMaquina->medicion_inicial = $medicionInicial->medicion;
                        $detalleMaquina->medicion_final = $medicionFinal->medicion;
                        $detalleMaquina->diferencia_medicion = $diferenciaMedicion;

                        $detallesMaquinas[] = $detalleMaquina;

                        // Acumular totales por tipo
                        if (strtolower($medicion->tipo_medicion) === 'horometro') {
                            $totalMedicionHorometro += $diferenciaMedicion;
                        } elseif (strtolower($medicion->tipo_medicion) === 'kilometraje') {
                            $totalMedicionKilometraje += $diferenciaMedicion;
                        }
                    }
                }

                // 5. Obtener los últimos consumos que se excluyeron para informar
                $ultimosConsumosData = [];
                if (!empty($idsUltimosConsumos)) {
                    $ultimosConsumosQuery = DB::table('consumos as c')
                        ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                        ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                        ->whereIn('c.id_consumo', $idsUltimosConsumos);

                    if ($idFaena) {
                        $ultimosConsumosQuery->where('c.id_faena', $idFaena);
                    }

                    $ultimosConsumosData = $ultimosConsumosQuery->select(
                        'c.id_consumo',
                        'c.id_equipo',
                        'c.fecha_consumo',
                        'c.litros_consumidos',
                        'c.precio_litro',
                        'c.medicion',
                        'm.nombre_maquina',
                        'cm.tipo_medicion'
                    )->get();
                }

                return [
                    'costo_total' => $costoTotal,
                    'costo_total_horometro' => $costoTotalHorometro,
                    'costo_total_kilometraje' => $costoTotalKilometraje,
                    'litros_total_horometro' => $litrosTotalHorometro,
                    'litros_total_kilometraje' => $litrosTotalKilometraje,
                    'medicion_horometro' => $totalMedicionHorometro,
                    'medicion_kilometraje' => $totalMedicionKilometraje,
                    'desglose_por_maquina' => $detallesMaquinas,
                    'ultimos_consumos' => $ultimosConsumosData
                ];
            };

            // 1. Obtener datos para el mes actual y el mes anterior
            $datosActual = $obtenerDatosPeriodo($primerDiaMes, $ultimoDiaMes, $idFaena);
            $datosAnterior = $obtenerDatosPeriodo($primerDiaMesAnterior, $ultimoDiaMesAnterior, $idFaena);

            // 2. Integrar los últimos consumos del mes anterior al actual
            // Este paso es para agregar los últimos consumos del mes anterior al mes actual
            $ultimosConsumosMesAnterior = $datosAnterior['ultimos_consumos'] ?? [];

            // Calcular sumas para integrar al mes actual
            $costoUltimosAnterior = 0;
            $costoUltimosAnteriorHorometro = 0;
            $costoUltimosAnteriorKilometraje = 0;
            $litrosUltimosAnteriorHorometro = 0;
            $litrosUltimosAnteriorKilometraje = 0;

            foreach ($ultimosConsumosMesAnterior as $consumo) {
                $costo = $consumo->litros_consumidos * $consumo->precio_litro;
                $costoUltimosAnterior += $costo;

                if (strtolower($consumo->tipo_medicion) === 'horometro') {
                    $costoUltimosAnteriorHorometro += $costo;
                    $litrosUltimosAnteriorHorometro += $consumo->litros_consumidos;
                } elseif (strtolower($consumo->tipo_medicion) === 'kilometraje') {
                    $costoUltimosAnteriorKilometraje += $costo;
                    $litrosUltimosAnteriorKilometraje += $consumo->litros_consumidos;
                }
            }

            // Sumar estos valores a los del mes actual
            $datosActual['costo_total'] += $costoUltimosAnterior;
            $datosActual['costo_total_horometro'] += $costoUltimosAnteriorHorometro;
            $datosActual['costo_total_kilometraje'] += $costoUltimosAnteriorKilometraje;
            $datosActual['litros_total_horometro'] += $litrosUltimosAnteriorHorometro;
            $datosActual['litros_total_kilometraje'] += $litrosUltimosAnteriorKilometraje;

            // 3. Calcular porcentajes de cambio
            $cambio_costo = 0;
            $cambio_costo_horometro = 0;
            $cambio_costo_kilometraje = 0;
            $cambio_horometro = 0;
            $cambio_kilometraje = 0;

            if ($datosAnterior['costo_total'] > 0) {
                $cambio_costo = (($datosActual['costo_total'] - $datosAnterior['costo_total']) / $datosAnterior['costo_total']) * 100;
            }

            if ($datosAnterior['costo_total_horometro'] > 0) {
                $cambio_costo_horometro = (($datosActual['costo_total_horometro'] - $datosAnterior['costo_total_horometro']) / $datosAnterior['costo_total_horometro']) * 100;
            }

            if ($datosAnterior['costo_total_kilometraje'] > 0) {
                $cambio_costo_kilometraje = (($datosActual['costo_total_kilometraje'] - $datosAnterior['costo_total_kilometraje']) / $datosAnterior['costo_total_kilometraje']) * 100;
            }

            if ($datosAnterior['medicion_horometro'] > 0) {
                $cambio_horometro = (($datosActual['medicion_horometro'] - $datosAnterior['medicion_horometro']) / $datosAnterior['medicion_horometro']) * 100;
            }

            if ($datosAnterior['medicion_kilometraje'] > 0) {
                $cambio_kilometraje = (($datosActual['medicion_kilometraje'] - $datosAnterior['medicion_kilometraje']) / $datosAnterior['medicion_kilometraje']) * 100;
            }

            // 4. Preparar respuesta final con datos de ambos períodos
            return response()->json([
                'status' => 'success',
                'data' => [
                    'faena_filtrada' => $idFaena,
                    'actual' => [
                        'periodo' => [
                            'inicio' => $primerDiaMes->format('Y-m-d'),
                            'fin' => $ultimoDiaMes->format('Y-m-d')
                        ],
                        'costo_total' => $datosActual['costo_total'],
                        'costo_total_horometro' => $datosActual['costo_total_horometro'],
                        'costo_total_kilometraje' => $datosActual['costo_total_kilometraje'],
                        'medicion_horometro' => $datosActual['medicion_horometro'],
                        'medicion_kilometraje' => $datosActual['medicion_kilometraje'],
                        'desglose_por_maquina' => $datosActual['desglose_por_maquina'],
                        'ultimos_consumos' => $datosActual['ultimos_consumos']
                    ],
                    'anterior' => [
                        'periodo' => [
                            'inicio' => $primerDiaMesAnterior->format('Y-m-d'),
                            'fin' => $ultimoDiaMesAnterior->format('Y-m-d')
                        ],
                        'costo_total' => $datosAnterior['costo_total'],
                        'costo_total_horometro' => $datosAnterior['costo_total_horometro'],
                        'costo_total_kilometraje' => $datosAnterior['costo_total_kilometraje'],
                        'medicion_horometro' => $datosAnterior['medicion_horometro'],
                        'medicion_kilometraje' => $datosAnterior['medicion_kilometraje'],
                        'desglose_por_maquina' => $datosAnterior['desglose_por_maquina'],
                        'ultimos_consumos' => $datosAnterior['ultimos_consumos']
                    ],
                    'cambios' => [
                        'costo_total' => $cambio_costo,
                        'costo_total_horometro' => $cambio_costo_horometro,
                        'costo_total_kilometraje' => $cambio_costo_kilometraje,
                        'medicion_horometro' => $cambio_horometro,
                        'medicion_kilometraje' => $cambio_kilometraje
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error en getCostoPetroleoSinUltimosConsumos: ' . $e->getMessage(), [
                'faena' => $request->input('faena'),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener datos de consumo de petróleo: ' . $e->getMessage()
            ], 500);
        }
    }
}
