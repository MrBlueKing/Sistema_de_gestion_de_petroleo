<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;


class ProyeccionConsumoController extends Controller
{
    /**
     * Calcula la proyección avanzada de consumo para todas las máquinas en un rango de fechas
     * incluyendo rendimientos y métricas para KPIs.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProyeccionAvanzada(Request $request)
    {
        try {
            // Parámetros
            $faena = $request->query('faena', 'todas');
            $fechaDesde = $request->query('desde');
            $fechaHasta = $request->query('hasta');
            $diasProyeccion = $request->query('dias_proyeccion', 4); // Por defecto 4 días


            // Validar fechas
            if (!$fechaDesde || !$fechaHasta) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Los parámetros desde y hasta son obligatorios',
                    'data' => []
                ], 400);
            }


            // Convertir fechas
            $fechaDesde = Carbon::parse($fechaDesde)->startOfDay();
            $fechaHasta = Carbon::parse($fechaHasta)->startOfDay();
            $hoy = Carbon::now()->startOfDay(); // Usar startOfDay para coherencia


            // Ajustar fecha hasta si es futura (no se proyecta el futuro en datos reales)
            $fechaHastaEfectiva = $fechaHasta->gt($hoy) ? $hoy : $fechaHasta;


            // Estructuras para almacenar resultados
            $maquinasData = [];
            $kpisGlobales = [
                'consumo_total_real' => 0,
                'consumo_total_proyectado' => 0,
                'horas_trabajadas_total' => 0,
                'kilometros_recorridos_total' => 0,
                'rendimiento_promedio_horometro' => 0, // horas/litro
                'rendimiento_promedio_kilometraje' => 0, // km/litro
                'num_maquinas_horometro' => 0,
                'num_maquinas_kilometraje' => 0,
            ];


            // 1. Obtener todas las máquinas que tienen datos de consumo
            $maquinasConRegistros = DB::table('consumos as c')
                ->join('maquinas_internas as mi', 'c.id_equipo', '=', 'mi.id_maquina_interna')
                ->when($faena !== 'todas', function ($query) use ($faena) {
                    return $query->where('c.id_faena', $faena);
                })
                ->select(
                    'mi.id_maquina_interna as id',
                    'mi.nombre',
                    'mi.patente'
                )
                ->distinct()
                ->get();


            // 2. Procesar cada máquina para obtener su historial completo y calcular proyección
            foreach ($maquinasConRegistros as $maquina) {
                // Obtener TODO el historial de consumos ordenado por fecha
                $historialCompleto = DB::table('consumos')
                    ->where('id_equipo', $maquina->id)
                    ->orderBy('fecha_consumo', 'asc')
                    ->get();


                // Si no hay suficientes datos (al menos 2 registros), no podemos proyectar
                if ($historialCompleto->count() < 2) {
                    continue;
                }


                // Determinar tipo de medición
                $tipoMedicion = $this->determinarTipoMedicion($maquina->id);
                if (!$tipoMedicion) {
                    Log::warning("No se pudo determinar el tipo de medición para la máquina interna ID: " . $maquina->id);
                    $tipoMedicion = 'Horometro'; // Valor por defecto si no se encuentra
                }


                $fechasHistorial = [];
                $medicionesHistorial = [];
                $cargasHistorial = [];


                foreach ($historialCompleto as $consumo) {
                    $fechasHistorial[] = Carbon::parse($consumo->fecha_consumo)->startOfDay();
                    $medicionesHistorial[] = floatval($consumo->medicion);
                    $cargasHistorial[] = floatval($consumo->litros_consumidos);
                }


                $intervalosValidos = [];
                $primerFechaConActividad = null;
                $ultimaFechaConActividad = null;


                for ($i = 1; $i < count($medicionesHistorial); $i++) {
                    $fechaAnterior = $fechasHistorial[$i - 1];
                    $fechaActual = $fechasHistorial[$i];


                    $medicionAnterior = $medicionesHistorial[$i - 1];
                    $medicionActual = $medicionesHistorial[$i];


                    $cargaAnterior = $cargasHistorial[$i - 1];


                    // Calcular días transcurridos entre los registros (inclusive el día final)
                    $diasTranscurridos = $fechaAnterior->diffInDays($fechaActual);


                    // Si los registros son del mismo día o la medición no avanza, puede no ser un intervalo útil
                    if ($diasTranscurridos === 0 && $medicionActual === $medicionAnterior) {
                        continue;
                    }


                    $diferenciaMedicion = $medicionActual - $medicionAnterior;
                    $consumoEnIntervalo = $cargaAnterior; // El consumo de este periodo es la carga del día anterior


                    // Solo considerar intervalos con progreso y consumo válido
                    if ($diferenciaMedicion >= 0 && $consumoEnIntervalo >= 0) {
                        $intervalosValidos[] = [
                            'dias' => $diasTranscurridos,
                            'actividad' => $diferenciaMedicion,
                            'consumo' => $consumoEnIntervalo,
                            'fecha_inicio' => $fechaAnterior->format('Y-m-d'),
                            'fecha_fin' => $fechaActual->format('Y-m-d'),
                        ];


                        if (is_null($primerFechaConActividad)) {
                            $primerFechaConActividad = $fechaAnterior;
                        }
                        $ultimaFechaConActividad = $fechaActual;
                    }
                }


                // Si no hay intervalos válidos para calcular promedios, saltar esta máquina
                if (empty($intervalosValidos) || is_null($primerFechaConActividad) || is_null($ultimaFechaConActividad)) {
                    continue;
                }


                $totalDiferenciaMedicionAcumulada = array_sum(array_column($intervalosValidos, 'actividad'));
                $totalConsumoAcumulado = array_sum(array_column($intervalosValidos, 'consumo'));


                $diasCubiertosPorHistorial = $primerFechaConActividad->diffInDays($ultimaFechaConActividad);
                // Si el historial cubre 0 días (ej. solo 2 registros en el mismo día), no podemos proyectar
                if ($diasCubiertosPorHistorial === 0) {
                    continue;
                }


                // Calcular rendimiento promedio (actividad/litro)
                $rendimientoPromedio = $totalConsumoAcumulado > 0 ? $totalDiferenciaMedicionAcumulada / $totalConsumoAcumulado : 0;


                // Calcular promedio diario de actividad (actividad/día)
                $promedioDiferenciaMedicionDiaria = $diasCubiertosPorHistorial > 0 ? $totalDiferenciaMedicionAcumulada / $diasCubiertosPorHistorial : 0;


                // Calcular consumo diario simulado (litros/día)
                $consumoSimuladoDiario = $rendimientoPromedio > 0 ? $promedioDiferenciaMedicionDiaria / $rendimientoPromedio : 0;


                // Si el consumo simulado diario es 0 o el rendimiento es 0, no podemos proyectar de forma útil
                if ($consumoSimuladoDiario <= 0 || $rendimientoPromedio <= 0) {
                    continue;
                }


                // Preparar datos históricos detallados
                $datosHistoricos = [];
                for ($i = 0; $i < count($fechasHistorial); $i++) {
                    // El consumo real para este día 'i' es la carga del día 'i-1'
                    $consumoReal = ($i > 0) ? $cargasHistorial[$i - 1] : 0;
                    // La diferencia de medición para este día 'i' es la diferencia entre medicion[i] y medicion[i-1]
                    $diferenciaMedicion = ($i > 0) ? ($medicionesHistorial[$i] - $medicionesHistorial[$i - 1]) : 0;


                    $datosHistoricos[] = [
                        'dia' => $i + 1,
                        'fecha' => $fechasHistorial[$i]->format('Y-m-d'),
                        'medicion' => $medicionesHistorial[$i],
                        'carga' => $cargasHistorial[$i],
                        'diferencia_medicion_diaria' => round($diferenciaMedicion, 2),
                        'consumo_real_diario' => round($consumoReal, 2),
                        'es_real' => true
                    ];
                }


                // Realizar proyección
                $simulacion = [];
                $ultimoIndiceReal = count($medicionesHistorial) - 1;
                $ultimoStockReal = $cargasHistorial[$ultimoIndiceReal];
                $ultimaFechaReal = $fechasHistorial[$ultimoIndiceReal];


                $stockActualProyeccion = $ultimoStockReal;


                for ($i = 1; $i <= $diasProyeccion; $i++) {
                    $fechaProyectada = $ultimaFechaReal->copy()->addDays($i)->startOfDay();
                    $consumoDiarioProyectado = $consumoSimuladoDiario;
                    $stockFinalProyeccion = max($stockActualProyeccion - $consumoDiarioProyectado, 0);


                    $simulacion[] = [
                        'fecha' => $fechaProyectada->format('Y-m-d'),
                        'medicion_diaria_proyectada' => round($promedioDiferenciaMedicionDiaria, 2),
                        'consumo_proyectado_diario' => round($consumoDiarioProyectado, 2),
                        'stock_inicial' => round($stockActualProyeccion, 2),
                        'stock_final' => round($stockFinalProyeccion, 2),
                        'es_real' => false
                    ];


                    $stockActualProyeccion = $stockFinalProyeccion;


                    if ($stockFinalProyeccion <= 0) {
                        break;
                    }
                }


                // Calcular consumo y actividad en el rango seleccionado (real + proyectado)
                $consumoRealEnRango = 0;
                $diferenciaMedicionRealEnRango = 0;
                $tieneConsumoRealEnRango = false;


                foreach ($datosHistoricos as $dato) {
                    $fechaDato = Carbon::parse($dato['fecha'])->startOfDay();
                    if ($fechaDato->between($fechaDesde, $fechaHastaEfectiva)) {
                        $consumoRealEnRango += $dato['consumo_real_diario'];
                        $diferenciaMedicionRealEnRango += $dato['diferencia_medicion_diaria'];
                        if ($dato['consumo_real_diario'] > 0 || $dato['diferencia_medicion_diaria'] > 0) {
                            $tieneConsumoRealEnRango = true;
                        }
                    }
                }


                $consumoProyectadoEnRango = 0;
                $diferenciaMedicionProyectadaEnRango = 0;
                $tieneProyeccionEnRango = false;


                foreach ($simulacion as $sim) {
                    $fechaSim = Carbon::parse($sim['fecha'])->startOfDay();
                    if ($fechaSim->between($fechaDesde, $fechaHastaEfectiva)) {
                        $consumoProyectadoEnRango += $sim['consumo_proyectado_diario'];
                        $diferenciaMedicionProyectadaEnRango += $sim['medicion_diaria_proyectada'];
                        $tieneProyeccionEnRango = true;
                    }
                }


                // Solo incluir máquinas con datos en el rango (real o proyectado)
                if (!$tieneConsumoRealEnRango && !$tieneProyeccionEnRango) {
                    continue;
                }


                // Preparar estructura de datos para esta máquina
                $maquinaData = [
                    'id' => $maquina->id,
                    'nombre' => $maquina->nombre,
                    'patente' => $maquina->patente,
                    'tipo_medicion' => $tipoMedicion,
                    'tiene_consumo_real' => $tieneConsumoRealEnRango,
                    'tiene_proyeccion' => $tieneProyeccionEnRango,
                    'datos_totales' => [
                        'total_registros_historicos' => count($historialCompleto),
                        'dias_cubiertos_historial' => $diasCubiertosPorHistorial,
                        'total_diferencia_medicion_historica' => round($totalDiferenciaMedicionAcumulada, 2),
                        'total_consumo_real_historico' => round($totalConsumoAcumulado, 2),
                        'rendimiento_promedio_historico' => round($rendimientoPromedio, 3),
                        'promedio_diferencia_medicion_diaria_calculado' => round($promedioDiferenciaMedicionDiaria, 2),
                        'consumo_simulado_diario_calculado' => round($consumoSimuladoDiario, 2)
                    ],
                    'datos_en_rango' => [
                        'consumo_real' => round($consumoRealEnRango, 2),
                        'diferencia_medicion_real' => round($diferenciaMedicionRealEnRango, 2),
                        'consumo_proyectado' => round($consumoProyectadoEnRango, 2),
                        'diferencia_medicion_proyectada' => round($diferenciaMedicionProyectadaEnRango, 2),
                        'consumo_total' => round($consumoRealEnRango + $consumoProyectadoEnRango, 2),
                        'diferencia_medicion_total' => round($diferenciaMedicionRealEnRango + $diferenciaMedicionProyectadaEnRango, 2)
                    ],
                    'detalle_historico' => $datosHistoricos,
                    'detalle_proyeccion' => $simulacion
                ];


                // Actualizar KPIs globales
                if (strtolower($tipoMedicion) == 'horometro') {
                    $kpisGlobales['horas_trabajadas_total'] += $maquinaData['datos_en_rango']['diferencia_medicion_total'];
                    $kpisGlobales['num_maquinas_horometro']++;
                } else { // kilometraje
                    $kpisGlobales['kilometros_recorridos_total'] += $maquinaData['datos_en_rango']['diferencia_medicion_total'];
                    $kpisGlobales['num_maquinas_kilometraje']++;
                }


                $kpisGlobales['consumo_total_real'] += $maquinaData['datos_en_rango']['consumo_real'];
                $kpisGlobales['consumo_total_proyectado'] += $maquinaData['datos_en_rango']['consumo_proyectado'];


                $maquinasData[] = $maquinaData;
            }


            // Calcular KPIs globales finales
            $consumoTotalGeneral = $kpisGlobales['consumo_total_real'] + $kpisGlobales['consumo_total_proyectado'];


            if ($consumoTotalGeneral > 0) {
                if ($kpisGlobales['num_maquinas_horometro'] > 0) {
                    $kpisGlobales['rendimiento_promedio_horometro'] = round(
                        $kpisGlobales['horas_trabajadas_total'] / $consumoTotalGeneral,
                        3
                    );
                }


                if ($kpisGlobales['num_maquinas_kilometraje'] > 0) {
                    $kpisGlobales['rendimiento_promedio_kilometraje'] = round(
                        $kpisGlobales['kilometros_recorridos_total'] / $consumoTotalGeneral,
                        3
                    );
                }
            }


            $kpisGlobales['consumo_total'] = round($consumoTotalGeneral, 2);
            $kpisGlobales['porcentaje_proyectado'] = $consumoTotalGeneral > 0
                ? round(($kpisGlobales['consumo_total_proyectado'] / $consumoTotalGeneral) * 100, 2)
                : 0;


            // Ordenar las máquinas
            usort($maquinasData, function ($a, $b) {
                if ($a['tiene_consumo_real'] != $b['tiene_consumo_real']) {
                    return $b['tiene_consumo_real'] - $a['tiene_consumo_real']; // Primero los reales
                }
                return strcmp($a['nombre'], $b['nombre']); // Luego por nombre
            });


            // Preparar la respuesta
            $respuesta = [
                'status' => 'success',
                'data' => [
                    'periodo' => [
                        'desde' => $fechaDesde->toDateString(),
                        'hasta' => $fechaHasta->toDateString(),
                        'fecha_hasta_efectiva' => $fechaHastaEfectiva->toDateString(),
                        'dias_totales_periodo_seleccionado' => $fechaDesde->diffInDays($fechaHasta) + 1
                    ],
                    'kpis_globales' => $kpisGlobales,
                    'total_maquinas' => count($maquinasData),
                    'maquinas_con_consumo_real' => count(array_filter($maquinasData, function ($m) {
                        return $m['tiene_consumo_real'];
                    })),
                    'maquinas_con_proyeccion' => count(array_filter($maquinasData, function ($m) {
                        return $m['tiene_proyeccion'];
                    })),
                    'maquinas' => $maquinasData
                ]
            ];


            return response()->json($respuesta);
        } catch (\Exception $e) {
            Log::error('Error al obtener proyección avanzada', [
                'error' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile()
            ]);


            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar la solicitud: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }


    /**
     * Devuelve todas las máquinas cuyo consumo real o proyectado alcanza hasta el día de ayer.
     * Incluye los datos específicos de consumo y actividad para "ayer".
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMaquinasConConsumoHastaAyer(Request $request)
    {
        try {
            $faena = $request->query('faena', 'todas');


            // La fecha objetivo es siempre "ayer"
            $fechaHastaObjetivo = Carbon::now()->subDay()->startOfDay(); // Usamos startOfDay para la comparación precisa del día


            $maquinasResultantes = [];


            // 1. Obtener todas las máquinas que tienen datos de consumo
            $maquinasConRegistros = DB::table('consumos as c')
                ->join('maquinas_internas as mi', 'c.id_equipo', '=', 'mi.id_maquina_interna')
                ->when($faena !== 'todas', function ($query) use ($faena) {
                    return $query->where('c.id_faena', $faena);
                })
                ->select(
                    'mi.id_maquina_interna as id',
                    'mi.nombre',
                    'mi.patente'
                )
                ->distinct()
                ->get();


            foreach ($maquinasConRegistros as $maquina) {
                $historialCompleto = DB::table('consumos')
                    ->where('id_equipo', $maquina->id)
                    ->orderBy('fecha_consumo', 'asc')
                    ->get();


                if ($historialCompleto->count() < 2) {
                    continue;
                }


                $tipoMedicion = $this->determinarTipoMedicion($maquina->id);
                if (!$tipoMedicion) {
                    Log::warning("No se pudo determinar el tipo de medición para la máquina interna ID: " . $maquina->id);
                    $tipoMedicion = 'Horometro'; // Valor por defecto
                }


                $fechasHistorial = [];
                $medicionesHistorial = [];
                $cargasHistorial = [];


                foreach ($historialCompleto as $consumo) {
                    $fechasHistorial[] = Carbon::parse($consumo->fecha_consumo)->startOfDay();
                    $medicionesHistorial[] = floatval($consumo->medicion);
                    $cargasHistorial[] = floatval($consumo->litros_consumidos);
                }


                $intervalosValidos = [];
                $primerFechaConActividad = null;
                $ultimaFechaConActividad = null;


                for ($i = 1; $i < count($medicionesHistorial); $i++) {
                    $fechaAnterior = $fechasHistorial[$i - 1];
                    $fechaActual = $fechasHistorial[$i];


                    $medicionAnterior = $medicionesHistorial[$i - 1];
                    $medicionActual = $medicionesHistorial[$i];


                    $cargaAnterior = $cargasHistorial[$i - 1];


                    $diasTranscurridos = $fechaAnterior->diffInDays($fechaActual);


                    if ($diasTranscurridos === 0 && $medicionActual === $medicionAnterior) {
                        continue;
                    }


                    $diferenciaMedicion = $medicionActual - $medicionAnterior;
                    $consumoEnIntervalo = $cargaAnterior;


                    if ($diferenciaMedicion >= 0 && $consumoEnIntervalo >= 0) {
                        $intervalosValidos[] = [
                            'dias' => $diasTranscurridos,
                            'actividad' => $diferenciaMedicion,
                            'consumo' => $consumoEnIntervalo,
                            'fecha_inicio' => $fechaAnterior->format('Y-m-d'),
                            'fecha_fin' => $fechaActual->format('Y-m-d'),
                        ];


                        if (is_null($primerFechaConActividad)) {
                            $primerFechaConActividad = $fechaAnterior;
                        }
                        $ultimaFechaConActividad = $fechaActual;
                    }
                }


                if (empty($intervalosValidos) || is_null($primerFechaConActividad) || is_null($ultimaFechaConActividad)) {
                    continue;
                }


                $totalDiferenciaMedicionAcumulada = array_sum(array_column($intervalosValidos, 'actividad'));
                $totalConsumoAcumulado = array_sum(array_column($intervalosValidos, 'consumo'));


                $diasCubiertosPorHistorial = $primerFechaConActividad->diffInDays($ultimaFechaConActividad);
                if ($diasCubiertosPorHistorial === 0) {
                    continue;
                }


                $rendimientoPromedio = $totalConsumoAcumulado > 0 ? $totalDiferenciaMedicionAcumulada / $totalConsumoAcumulado : 0;
                $promedioDiferenciaMedicionDiaria = $diasCubiertosPorHistorial > 0 ? $totalDiferenciaMedicionAcumulada / $diasCubiertosPorHistorial : 0;
                $consumoSimuladoDiario = $rendimientoPromedio > 0 ? $promedioDiferenciaMedicionDiaria / $rendimientoPromedio : 0;


                if ($consumoSimuladoDiario <= 0 || $rendimientoPromedio <= 0) {
                    continue;
                }


                $alcanzaHastaAyer = false;
                $consumoTotalAcumuladoHastaAyer = 0;
                $diferenciaMedicionAcumuladaHastaAyer = 0;


                $consumoAyer = 0;
                $medicionAyer = 0;
                $tipoDatoAyer = '';


                // 1. Acumular y capturar datos reales hasta ayer
                for ($i = 0; $i < count($fechasHistorial); $i++) {
                    $fechaActualRegistro = $fechasHistorial[$i];

                    // Si el registro actual es anterior o igual a ayer
                    if ($fechaActualRegistro->lte($fechaHastaObjetivo)) {
                        $alcanzaHastaAyer = true; // Al menos un registro real alcanza o supera ayer


                        // Calcular actividad y consumo para este día/intervalo real
                        $diferenciaMedicionIntervalo = ($i > 0) ? ($medicionesHistorial[$i] - $medicionesHistorial[$i - 1]) : 0;
                        $consumoRealIntervalo = ($i > 0) ? $cargasHistorial[$i - 1] : 0; // Carga del día anterior


                        // Acumular totales hasta ayer
                        $consumoTotalAcumuladoHastaAyer += $consumoRealIntervalo;
                        $diferenciaMedicionAcumuladaHastaAyer += $diferenciaMedicionIntervalo;


                        // Si este registro es el de "ayer", capturarlo
                        if ($fechaActualRegistro->eq($fechaHastaObjetivo)) {
                            $consumoAyer = $consumoRealIntervalo;
                            $medicionAyer = $diferenciaMedicionIntervalo;
                            $tipoDatoAyer = 'real';
                        }
                    } else {
                        // Si ya pasamos la fecha objetivo, no seguir acumulando reales
                        break;
                    }
                }


                // 2. Proyectar si el último registro real es anterior a ayer
                $ultimoFechaRegistroReal = $fechasHistorial[count($fechasHistorial) - 1];
                $ultimoStockReal = $cargasHistorial[count($cargasHistorial) - 1];


                if ($ultimoFechaRegistroReal->lessThan($fechaHastaObjetivo)) {
                    $stockActualProyeccion = $ultimoStockReal;
                    $diasParaProyectarDesdeUltimoReal = $ultimoFechaRegistroReal->diffInDays($fechaHastaObjetivo);


                    for ($i = 1; $i <= $diasParaProyectarDesdeUltimoReal; $i++) {
                        $fechaProyectada = $ultimoFechaRegistroReal->copy()->addDays($i)->startOfDay();


                        // Si la proyección se extiende más allá de ayer, no la usamos para "ayer"
                        if ($fechaProyectada->greaterThan($fechaHastaObjetivo)) {
                            break;
                        }

                        $consumoDiarioProyectado = $consumoSimuladoDiario;
                        $medicionDiariaProyectada = $promedioDiferenciaMedicionDiaria;
                        $stockFinalProyeccion = max($stockActualProyeccion - $consumoDiarioProyectado, 0);


                        // Acumular los datos proyectados hasta ayer
                        $consumoTotalAcumuladoHastaAyer += $consumoDiarioProyectado;
                        $diferenciaMedicionAcumuladaHastaAyer += $medicionDiariaProyectada;
                        $alcanzaHastaAyer = true;


                        // Si la fecha proyectada es exactamente AYER, capturarla
                        if ($fechaProyectada->eq($fechaHastaObjetivo)) {
                            $consumoAyer = $consumoDiarioProyectado;
                            $medicionAyer = $medicionDiariaProyectada;
                            $tipoDatoAyer = 'proyectado';
                        }


                        $stockActualProyeccion = $stockFinalProyeccion;


                        if ($stockFinalProyeccion <= 0) {
                            // Se acabó el stock antes de llegar a ayer por proyección
                            $alcanzaHastaAyer = false; // Ajustar si el stock se agota antes de ayer
                            break;
                        }
                    }
                }

                // Si la máquina no alcanzó ayer (ni por datos reales ni por proyección), la omitimos.
                if (!$alcanzaHastaAyer || $stockActualProyeccion <= 0 && $ultimoFechaRegistroReal->lessThan($fechaHastaObjetivo)) {
                    continue;
                }


                // Si la máquina alcanzó ayer, pero no hubo actividad ni real ni proyectada ESE DÍA
                if ($tipoDatoAyer === '') {
                    $consumoAyer = 0;
                    $medicionAyer = 0;
                    $tipoDatoAyer = 'n/a';
                }


                $maquinasResultantes[] = [
                    'id' => $maquina->id,
                    'nombre' => $maquina->nombre,
                    'patente' => $maquina->patente,
                    'tipo_medicion' => $tipoMedicion,
                    'fecha_corte_datos' => $fechaHastaObjetivo->toDateString(),
                    'consumo_total_acumulado_hasta_ayer' => round($consumoTotalAcumuladoHastaAyer, 2),
                    'diferencia_medicion_acumulada_hasta_ayer' => round($diferenciaMedicionAcumuladaHastaAyer, 2),
                    'rendimiento_promedio_hasta_ayer' => $consumoTotalAcumuladoHastaAyer > 0 ? round($diferenciaMedicionAcumuladaHastaAyer / $consumoTotalAcumuladoHastaAyer, 3) : 0,
                    'datos_ayer' => [
                        'consumo_ayer' => round($consumoAyer, 2),
                        'medicion_ayer' => round($medicionAyer, 2),
                        'tipo_dato_ayer' => $tipoDatoAyer
                    ]
                ];
            }


            // Ordenar las máquinas por nombre
            usort($maquinasResultantes, function ($a, $b) {
                return strcmp($a['nombre'], $b['nombre']);
            });


            return response()->json([
                'status' => 'success',
                'message' => 'Máquinas con consumo real o proyectado hasta el día de ayer, incluyendo detalles de ayer.',
                'fecha_corte_solicitada' => $fechaHastaObjetivo->toDateString(),
                'total_maquinas_encontradas' => count($maquinasResultantes),
                'data' => $maquinasResultantes
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener máquinas con consumo hasta ayer', [
                'error' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile()
            ]);


            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar la solicitud: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }


    /**
     * Determina el tipo de medición ('Horometro' o 'Kilometraje') para una máquina
     * basándose en la categoría asociada en la base de datos.
     *
     * @param int $idMaquinaInterna El ID de la tabla 'maquinas_internas'.
     * @return string|null 'Horometro' o 'Kilometraje', o null si no se encuentra.
     */
    private function determinarTipoMedicion($idMaquinaInterna)
    {
        try {
            // Unir maquinas_internas con maquinas y luego con categoria_maquina
            $tipoMedicion = DB::table('maquinas_internas as mi')
                ->join('maquinas as m', 'mi.id_maquina', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->where('mi.id_maquina_interna', $idMaquinaInterna)
                ->select('cm.tipo_medicion')
                ->first();

            if ($tipoMedicion && !empty($tipoMedicion->tipo_medicion)) {
                return $tipoMedicion->tipo_medicion;
            }

            // Por defecto, si no se encuentra, asumimos Horometro
            return null; // tipo de medición no determinado
        } catch (\Exception $e) {
            Log::error('Error al determinar tipo de medición desde DB', [
                'id_maquina_interna' => $idMaquinaInterna,
                'error' => $e->getMessage()
            ]);
            return null; // tipo de medición no determinado
        }
    }

    /**
     * Obtiene un resumen agregado de consumo y actividad para una faena en una fecha específica
     * Pensado para alimentar el componente DailyKpiCalculator
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResumenConsumoParaFecha(Request $request)
    {
        try {
            $faena = $request->query('faena', 'todas');
            $fecha = $request->query('fecha'); // Fecha específica (normalmente ayer)

            // Validar fecha
            if (!$fecha) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El parámetro fecha es obligatorio',
                    'data' => []
                ], 400);
            }

            $fechaObjetivo = Carbon::parse($fecha)->startOfDay();
            $maquinasConDatos = [];

            // 1. Obtener todas las máquinas que tienen datos de consumo para la faena
            $maquinasConRegistros = DB::table('consumos as c')
                ->join('maquinas_internas as mi', 'c.id_equipo', '=', 'mi.id_maquina_interna')
                ->when($faena !== 'todas', function ($query) use ($faena) {
                    return $query->where('c.id_faena', $faena);
                })
                ->select(
                    'mi.id_maquina_interna as id',
                    'mi.nombre',
                    'mi.patente'
                )
                ->distinct()
                ->get();

            // Contadores y acumuladores
            $totalMaquinas = 0;
            $maquinasConConsumoReal = 0;
            $maquinasConProyeccion = 0;
            $maquinasHorometro = 0;
            $maquinasKilometraje = 0;

            $consumoTotalReal = 0;
            $consumoTotalProyectado = 0;
            $horasTrabajadas = 0;
            $kilometrosRecorridos = 0;

            // Nuevos acumuladores para cálculos detallados
            $totalHorasHistoricas = 0;
            $totalKilometrosHistoricos = 0;
            $totalConsumoHistorico = 0;
            $totalDiasHistoricos = 0;
            $sumatoriaRendimientos = 0;
            $contadorMaquinasConRendimiento = 0;

            foreach ($maquinasConRegistros as $maquina) {
                $historialCompleto = DB::table('consumos')
                    ->where('id_equipo', $maquina->id)
                    ->orderBy('fecha_consumo', 'asc')
                    ->get();

                if ($historialCompleto->count() < 2) {
                    continue;
                }

                $tipoMedicion = $this->determinarTipoMedicion($maquina->id);
                if (!$tipoMedicion) {
                    $tipoMedicion = 'Horometro';
                }

                $fechasHistorial = [];
                $medicionesHistorial = [];
                $cargasHistorial = [];

                foreach ($historialCompleto as $consumo) {
                    $fechasHistorial[] = Carbon::parse($consumo->fecha_consumo)->startOfDay();
                    $medicionesHistorial[] = floatval($consumo->medicion);
                    $cargasHistorial[] = floatval($consumo->litros_consumidos);
                }

                // Calcular intervalos válidos y promedios
                $intervalosValidos = [];
                $primerFechaConActividad = null;
                $ultimaFechaConActividad = null;

                for ($i = 1; $i < count($medicionesHistorial); $i++) {
                    $fechaAnterior = $fechasHistorial[$i - 1];
                    $fechaActual = $fechasHistorial[$i];
                    $medicionAnterior = $medicionesHistorial[$i - 1];
                    $medicionActual = $medicionesHistorial[$i];
                    $cargaAnterior = $cargasHistorial[$i - 1];

                    $diasTranscurridos = $fechaAnterior->diffInDays($fechaActual);

                    if ($diasTranscurridos === 0 && $medicionActual === $medicionAnterior) {
                        continue;
                    }

                    $diferenciaMedicion = $medicionActual - $medicionAnterior;
                    $consumoEnIntervalo = $cargaAnterior;

                    if ($diferenciaMedicion >= 0 && $consumoEnIntervalo >= 0) {
                        $intervalosValidos[] = [
                            'dias' => $diasTranscurridos,
                            'actividad' => $diferenciaMedicion,
                            'consumo' => $consumoEnIntervalo,
                            'fecha_inicio' => $fechaAnterior->format('Y-m-d'),
                            'fecha_fin' => $fechaActual->format('Y-m-d'),
                        ];

                        if (is_null($primerFechaConActividad)) {
                            $primerFechaConActividad = $fechaAnterior;
                        }
                        $ultimaFechaConActividad = $fechaActual;
                    }
                }

                if (empty($intervalosValidos) || is_null($primerFechaConActividad) || is_null($ultimaFechaConActividad)) {
                    continue;
                }

                $totalDiferenciaMedicionAcumulada = array_sum(array_column($intervalosValidos, 'actividad'));
                $totalConsumoAcumulado = array_sum(array_column($intervalosValidos, 'consumo'));
                $diasCubiertosPorHistorial = $primerFechaConActividad->diffInDays($ultimaFechaConActividad);

                if ($diasCubiertosPorHistorial === 0) {
                    continue;
                }

                $rendimientoPromedio = $totalConsumoAcumulado > 0 ? $totalDiferenciaMedicionAcumulada / $totalConsumoAcumulado : 0;
                $promedioDiferenciaMedicionDiaria = $diasCubiertosPorHistorial > 0 ? $totalDiferenciaMedicionAcumulada / $diasCubiertosPorHistorial : 0;
                $consumoSimuladoDiario = $rendimientoPromedio > 0 ? $promedioDiferenciaMedicionDiaria / $rendimientoPromedio : 0;

                if ($consumoSimuladoDiario <= 0 || $rendimientoPromedio <= 0) {
                    continue;
                }

                // Determinar si hay datos reales para la fecha objetivo
                $tieneConsumoRealEnFecha = false;
                $consumoRealEnFecha = 0;
                $actividadRealEnFecha = 0;

                for ($i = 0; $i < count($fechasHistorial); $i++) {
                    $fechaActualRegistro = $fechasHistorial[$i];

                    if ($fechaActualRegistro->eq($fechaObjetivo)) {
                        $actividadRealEnFecha = ($i > 0) ? ($medicionesHistorial[$i] - $medicionesHistorial[$i - 1]) : 0;
                        $consumoRealEnFecha = ($i > 0) ? $cargasHistorial[$i - 1] : 0;
                        $tieneConsumoRealEnFecha = true;
                        break;
                    }
                }

                // Si no hay datos reales para la fecha, usar proyección
                $tieneProyeccionEnFecha = false;
                $consumoProyectadoEnFecha = 0;
                $actividadProyectadaEnFecha = 0;

                $ultimoFechaRegistroReal = $fechasHistorial[count($fechasHistorial) - 1];

                if (!$tieneConsumoRealEnFecha && $ultimoFechaRegistroReal->lessThan($fechaObjetivo)) {
                    $consumoProyectadoEnFecha = $consumoSimuladoDiario;
                    $actividadProyectadaEnFecha = $promedioDiferenciaMedicionDiaria;
                    $tieneProyeccionEnFecha = true;
                }

                // Solo incluir máquinas que tengan datos para la fecha objetivo
                if (!$tieneConsumoRealEnFecha && !$tieneProyeccionEnFecha) {
                    continue;
                }

                $totalMaquinas++;

                // Contadores por tipo de dato
                if ($tieneConsumoRealEnFecha) {
                    $maquinasConConsumoReal++;
                }
                if ($tieneProyeccionEnFecha) {
                    $maquinasConProyeccion++;
                }

                // Contadores por tipo de medición
                if (strtolower($tipoMedicion) == 'horometro') {
                    $maquinasHorometro++;
                } else {
                    $maquinasKilometraje++;
                }

                // Acumular totales para la fecha específica
                $consumoTotalReal += $consumoRealEnFecha;
                $consumoTotalProyectado += $consumoProyectadoEnFecha;

                if (strtolower($tipoMedicion) == 'horometro') {
                    $horasTrabajadas += $actividadRealEnFecha + $actividadProyectadaEnFecha;
                } else {
                    $kilometrosRecorridos += $actividadRealEnFecha + $actividadProyectadaEnFecha;
                }

                // Acumular totales históricos para cálculos de promedios
                $totalConsumoHistorico += $totalConsumoAcumulado;
                $totalDiasHistoricos += $diasCubiertosPorHistorial;

                if (strtolower($tipoMedicion) == 'horometro') {
                    $totalHorasHistoricas += $totalDiferenciaMedicionAcumulada;
                } else {
                    $totalKilometrosHistoricos += $totalDiferenciaMedicionAcumulada;
                }

                // Acumular rendimientos para promedio general
                if ($rendimientoPromedio > 0) {
                    $sumatoriaRendimientos += $rendimientoPromedio;
                    $contadorMaquinasConRendimiento++;
                }

                // Datos detallados de la máquina con información extendida
                $maquinasConDatos[] = [
                    'id' => $maquina->id,
                    'nombre' => $maquina->nombre,
                    'patente' => $maquina->patente,
                    'tipo_medicion' => $tipoMedicion,
                    'tiene_consumo_real' => $tieneConsumoRealEnFecha,
                    'tiene_proyeccion' => $tieneProyeccionEnFecha,
                    'datos_totales' => [
                        'total_registros' => count($historialCompleto),
                        'dias_historicos_cubiertos' => $diasCubiertosPorHistorial,
                        'rendimiento' => round($rendimientoPromedio, 3),
                        'actividad_historica_total' => round($totalDiferenciaMedicionAcumulada, 2),
                        'consumo_historico_total' => round($totalConsumoAcumulado, 2),
                        'promedio_actividad_diaria' => round($promedioDiferenciaMedicionDiaria, 2),
                        'consumo_simulado_diario' => round($consumoSimuladoDiario, 2)
                    ],
                    'datos_en_rango' => [
                        'consumo_real' => round($consumoRealEnFecha, 2),
                        'consumo_proyectado' => round($consumoProyectadoEnFecha, 2),
                        'consumo_total' => round($consumoRealEnFecha + $consumoProyectadoEnFecha, 2),
                        'diferencia_medicion_real' => round($actividadRealEnFecha, 2),
                        'diferencia_medicion_proyectada' => round($actividadProyectadaEnFecha, 2),
                        'diferencia_medicion_total' => round($actividadRealEnFecha + $actividadProyectadaEnFecha, 2)
                    ],
                    'metricas_especificas' => [
                        'eficiencia_actual' => $actividadRealEnFecha + $actividadProyectadaEnFecha > 0 ?
                            round(($consumoRealEnFecha + $consumoProyectadoEnFecha) / ($actividadRealEnFecha + $actividadProyectadaEnFecha), 3) : 0,
                        'variacion_vs_promedio' => $promedioDiferenciaMedicionDiaria > 0 ?
                            round((($actividadRealEnFecha + $actividadProyectadaEnFecha) / $promedioDiferenciaMedicionDiaria - 1) * 100, 1) : 0,
                        'estado_operacional' => $actividadRealEnFecha + $actividadProyectadaEnFecha > 0 ? 'activa' : 'inactiva'
                    ]
                ];
            }

            // Calcular totales y promedios generales
            $consumoTotal = $consumoTotalReal + $consumoTotalProyectado;
            $porcentajeProyectado = $consumoTotal > 0 ? round(($consumoTotalProyectado / $consumoTotal) * 100, 2) : 0;

            $rendimientoHorometro = 0;
            $rendimientoKilometraje = 0;

            if ($consumoTotal > 0) {
                if ($maquinasHorometro > 0) {
                    $rendimientoHorometro = round($horasTrabajadas / $consumoTotal, 3);
                }
                if ($maquinasKilometraje > 0) {
                    $rendimientoKilometraje = round($kilometrosRecorridos / $consumoTotal, 3);
                }
            }

            $promedioConsumoPorMaquina = $totalMaquinas > 0 ? round($consumoTotal / $totalMaquinas, 2) : 0;

            // Cálculos de promedios históricos detallados
            $promedioRendimientoGeneral = $contadorMaquinasConRendimiento > 0 ?
                round($sumatoriaRendimientos / $contadorMaquinasConRendimiento, 3) : 0;

            $promedioHorasDiarias = $totalDiasHistoricos > 0 && $maquinasHorometro > 0 ?
                round($totalHorasHistoricas / $totalDiasHistoricos, 2) : 0;

            $promedioKilometrosDiarios = $totalDiasHistoricos > 0 && $maquinasKilometraje > 0 ?
                round($totalKilometrosHistoricos / $totalDiasHistoricos, 2) : 0;

            $promedioConsumoDiarioHistorico = $totalDiasHistoricos > 0 ?
                round($totalConsumoHistorico / $totalDiasHistoricos, 2) : 0;

            // Estructura de respuesta MEJORADA con detalles adicionales
            $respuesta = [
                'status' => 'success',
                'message' => "Resumen detallado de consumo para la fecha {$fechaObjetivo->toDateString()}",
                'fecha_consultada' => $fechaObjetivo->toDateString(),
                'data' => [
                    'resumen' => [
                        // Datos principales (mantenidos para compatibilidad)
                        'consumo_total' => round($consumoTotal, 2),
                        'consumo_total_real' => round($consumoTotalReal, 2),
                        'consumo_total_proyectado' => round($consumoTotalProyectado, 2),
                        'porcentaje_proyectado' => $porcentajeProyectado,
                        'horas_trabajadas' => round($horasTrabajadas, 2),
                        'kilometros_recorridos' => round($kilometrosRecorridos, 2),
                        'total_maquinas' => $totalMaquinas,
                        'maquinas_horometro' => $maquinasHorometro,
                        'maquinas_kilometraje' => $maquinasKilometraje,
                        'maquinas_con_consumo_real' => $maquinasConConsumoReal,
                        'maquinas_con_proyeccion' => $maquinasConProyeccion,
                        'rendimiento_horometro' => $rendimientoHorometro,
                        'rendimiento_kilometraje' => $rendimientoKilometraje,
                        'promedio_consumo_por_maquina' => $promedioConsumoPorMaquina,

                        // NUEVOS DATOS DETALLADOS SOLICITADOS
                        'detalles_actividad' => [
                            'promedio_horas_por_maquina_horometro' => $maquinasHorometro > 0 ?
                                round($horasTrabajadas / $maquinasHorometro, 2) : 0,
                            'promedio_km_por_maquina_kilometraje' => $maquinasKilometraje > 0 ?
                                round($kilometrosRecorridos / $maquinasKilometraje, 2) : 0,
                            'total_horas_todas_maquinas' => round($horasTrabajadas, 2),
                            'total_kilometros_todas_maquinas' => round($kilometrosRecorridos, 2),
                            'intensidad_operacional' => $totalMaquinas > 0 ?
                                round(($horasTrabajadas + $kilometrosRecorridos) / $totalMaquinas, 2) : 0
                        ],

                        'promedios_historicos' => [
                            'promedio_rendimiento_general' => $promedioRendimientoGeneral,
                            'promedio_horas_diarias_historico' => $promedioHorasDiarias,
                            'promedio_kilometros_diarios_historico' => $promedioKilometrosDiarios,
                            'promedio_consumo_diario_historico' => $promedioConsumoDiarioHistorico,
                            'total_dias_historicos_analizados' => $totalDiasHistoricos,
                            'total_actividad_historica_horas' => round($totalHorasHistoricas, 2),
                            'total_actividad_historica_kilometros' => round($totalKilometrosHistoricos, 2),
                            'total_consumo_historico' => round($totalConsumoHistorico, 2)
                        ],

                        'analisis_eficiencia' => [
                            'consumo_por_hora_promedio' => $horasTrabajadas > 0 ?
                                round($consumoTotal / $horasTrabajadas, 3) : 0,
                            'consumo_por_kilometro_promedio' => $kilometrosRecorridos > 0 ?
                                round($consumoTotal / $kilometrosRecorridos, 3) : 0,
                            'factor_utilizacion_horas' => $promedioHorasDiarias > 0 ?
                                round($horasTrabajadas / ($promedioHorasDiarias * $maquinasHorometro), 3) : 0,
                            'factor_utilizacion_km' => $promedioKilometrosDiarios > 0 ?
                                round($kilometrosRecorridos / ($promedioKilometrosDiarios * $maquinasKilometraje), 3) : 0,
                            'maquinas_activas' => count(array_filter($maquinasConDatos, function ($m) {
                                return $m['metricas_especificas']['estado_operacional'] === 'activa';
                            })),
                            'maquinas_inactivas' => count(array_filter($maquinasConDatos, function ($m) {
                                return $m['metricas_especificas']['estado_operacional'] === 'inactiva';
                            }))
                        ]
                    ],
                    'detalle_maquinas' => $maquinasConDatos
                ]
            ];

            return response()->json($respuesta);
        } catch (\Exception $e) {
            Log::error('Error al obtener resumen detallado de consumo para fecha', [
                'error' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile(),
                'fecha' => $fecha ?? 'N/A',
                'faena' => $faena
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar la solicitud: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}
