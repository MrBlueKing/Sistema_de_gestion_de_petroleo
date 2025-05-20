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
     * incluyendo rendimientos y métricas para KPIs
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
            $diasProyeccion = $request->query('dias_proyeccion', 4); // Por defecto 4 días como en tu ejemplo

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
            $fechaHasta = Carbon::parse($fechaHasta)->startOfDay(); // No incluimos el último día completo
            $hoy = Carbon::now()->endOfDay();

            // Ajustar fecha hasta si es futura
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
                // Obtener TODO el historial de consumos ordenado por fecha (no limitado al rango de fechas)
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

                // Preparar arrays para los cálculos (similar a tu ejemplo React)
                $fechas = [];
                $horometro = [];
                $cargas = [];
                $horasTrabajadas = [];
                $consumoReal = [];
                $esReal = []; // Indica si el registro es real o proyectado

                // Llenar los arrays con datos históricos
                foreach ($historialCompleto as $index => $consumo) {
                    $fechas[] = Carbon::parse($consumo->fecha_consumo)->format('Y-m-d');
                    $horometro[] = floatval($consumo->medicion);
                    $cargas[] = floatval($consumo->litros_consumidos);
                    $esReal[] = true;

                    // Calcular horas trabajadas (a partir del segundo registro)
                    if ($index > 0) {
                        $horasTrabajadas[] = floatval($horometro[$index] - $horometro[$index - 1]);
                    } else {
                        $horasTrabajadas[] = 0; // El primer registro no tiene horas trabajadas previas
                    }

                    // El primer registro no tiene consumo real
                    if ($index == 0) {
                        $consumoReal[] = 0;
                    } else {
                        // El consumo real del día actual es la carga del día anterior
                        $consumoReal[] = floatval($cargas[$index - 1]);
                    }
                }

                // Calcular totales y rendimientos
                $totalHoras = array_sum(array_slice($horasTrabajadas, 1)); // Excluir el primer día
                $totalConsumo = array_sum(array_slice($consumoReal, 1)); // Excluir el primer día

                // Evitar división por cero
                $rendimiento = $totalConsumo > 0 ? $totalHoras / $totalConsumo : 0;
                $diasRegistrados = count($horometro) - 1; // Excluir el primer día

                $promedioHorasDiario = $diasRegistrados > 0 ? $totalHoras / $diasRegistrados : 0;
                $consumoSimuladoDiario = $rendimiento > 0 ? $promedioHorasDiario / $rendimiento : 0;

                // Verificar si hay datos reales en el rango seleccionado
                $tieneConsumoRealEnRango = false;
                $consumoRealEnRango = 0;
                $horasTrabajadas_enRango = 0;

                foreach ($historialCompleto as $index => $consumo) {
                    $fechaConsumo = Carbon::parse($consumo->fecha_consumo);

                    if ($fechaConsumo->between($fechaDesde, $fechaHastaEfectiva) && $index > 0) {
                        $tieneConsumoRealEnRango = true;
                        $consumoRealEnRango += $consumoReal[$index];
                        $horasTrabajadas_enRango += $horasTrabajadas[$index];
                    }
                }

                // Realizar proyección (similar a tu lógica React)
                $simulacion = [];
                $ultimoIndice = count($horometro) - 1;
                $stockInicial = $cargas[$ultimoIndice]; // Último valor de carga es el stock inicial

                for ($i = 1; $i <= $diasProyeccion; $i++) {
                    $dia = $ultimoIndice + $i + 1; // +1 porque los índices empiezan en 0
                    $consumo = $consumoSimuladoDiario;
                    $stockFinal = max($stockInicial - $consumo, 0);

                    $simulacion[] = [
                        'dia' => $dia,
                        'fecha' => Carbon::parse($fechas[$ultimoIndice])->addDays($i)->format('Y-m-d'),
                        'horas' => round($promedioHorasDiario, 2),
                        'consumo' => round($consumo, 2),
                        'stock_inicial' => round($stockInicial, 2),
                        'stock_final' => round($stockFinal, 2),
                        'es_real' => false
                    ];

                    $stockInicial = $stockFinal;

                    // Si el stock llega a cero, detenemos la proyección
                    if ($stockFinal <= 0) {
                        break;
                    }
                }

                // Determinar si algún dato proyectado cae en el rango seleccionado
                $tieneProyeccionEnRango = false;
                $consumoProyectadoEnRango = 0;
                $horasProyectadasEnRango = 0;

                foreach ($simulacion as $sim) {
                    $fechaSim = Carbon::parse($sim['fecha']);

                    if ($fechaSim->between($fechaDesde, $fechaHastaEfectiva)) {
                        $tieneProyeccionEnRango = true;
                        $consumoProyectadoEnRango += $sim['consumo'];
                        $horasProyectadasEnRango += $sim['horas'];
                    }
                }

                // Solo incluir máquinas con datos en el rango (real o proyectado)
                if (!$tieneConsumoRealEnRango && !$tieneProyeccionEnRango) {
                    continue;
                }

                // Generar datos detallados para esta máquina
                $datosHistoricos = [];

                for ($i = 0; $i < count($horometro); $i++) {
                    $datosHistoricos[] = [
                        'dia' => $i + 1,
                        'fecha' => $fechas[$i],
                        'medicion' => $horometro[$i],
                        'carga' => $cargas[$i],
                        'horas_trabajadas' => $horasTrabajadas[$i],
                        'consumo_real' => $consumoReal[$i],
                        'es_real' => true
                    ];
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
                        'total_registros' => count($horometro),
                        'total_horas_trabajadas' => round($totalHoras, 2),
                        'total_consumo_real' => round($totalConsumo, 2),
                        'rendimiento' => round($rendimiento, 3),
                        'promedio_horas_diario' => round($promedioHorasDiario, 2),
                        'consumo_simulado_diario' => round($consumoSimuladoDiario, 2)
                    ],
                    'datos_en_rango' => [
                        'consumo_real' => round($consumoRealEnRango, 2),
                        'horas_trabajadas' => round($horasTrabajadas_enRango, 2),
                        'consumo_proyectado' => round($consumoProyectadoEnRango, 2),
                        'horas_proyectadas' => round($horasProyectadasEnRango, 2),
                        'consumo_total' => round($consumoRealEnRango + $consumoProyectadoEnRango, 2),
                        'horas_totales' => round($horasTrabajadas_enRango + $horasProyectadasEnRango, 2)
                    ],
                    'detalle_historico' => $datosHistoricos,
                    'detalle_proyeccion' => $simulacion
                ];

                // Actualizar KPIs globales
                if ($tipoMedicion == 'horometro') {
                    $kpisGlobales['horas_trabajadas_total'] += $horasTrabajadas_enRango + $horasProyectadasEnRango;
                    $kpisGlobales['num_maquinas_horometro']++;
                } else { // kilometraje
                    $kpisGlobales['kilometros_recorridos_total'] += $horasTrabajadas_enRango + $horasProyectadasEnRango;
                    $kpisGlobales['num_maquinas_kilometraje']++;
                }

                $kpisGlobales['consumo_total_real'] += $consumoRealEnRango;
                $kpisGlobales['consumo_total_proyectado'] += $consumoProyectadoEnRango;

                $maquinasData[] = $maquinaData;
            }

            // Calcular KPIs globales finales
            $consumoTotalGeneral = $kpisGlobales['consumo_total_real'] + $kpisGlobales['consumo_total_proyectado'];

            // Rendimiento promedio (evitar división por cero)
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

            // Agregar porcentajes y valores completos
            $kpisGlobales['consumo_total'] = round($consumoTotalGeneral, 2);
            $kpisGlobales['porcentaje_proyectado'] = $consumoTotalGeneral > 0
                ? round(($kpisGlobales['consumo_total_proyectado'] / $consumoTotalGeneral) * 100, 2)
                : 0;

            // Ordenar las máquinas (primero reales, luego proyecciones)
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
                        'hasta' => $fechaHasta->toDateString(), // La fecha original seleccionada
                        'fecha_hasta_efectiva' => $fechaHastaEfectiva->toDateString(),
                        'dias_totales' => $fechaDesde->diffInDays($fechaHasta) + 1
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
     * Determina si una máquina usa horometro o kilometraje basado en su historial
     * 
     * @param int $idMaquina
     * @return string 'horometro' o 'kilometraje'
     */
    private function determinarTipoMedicion($idMaquina)
    {
        // Esta implementación es una aproximación. Se debería adaptar según tu esquema de base de datos.
        // Si tienes un campo que indica el tipo, úsalo directamente.
        try {
            // Intentar determinar por el nombre de la máquina
            $maquina = DB::table('maquinas_internas')
                ->where('id_maquina_interna', $idMaquina)
                ->first();

            if ($maquina) {
                $nombre = strtolower($maquina->nombre);

                // Verificar por palabras clave en el nombre
                if (
                    strpos($nombre, 'camion') !== false ||
                    strpos($nombre, 'camión') !== false ||
                    strpos($nombre, 'vehiculo') !== false ||
                    strpos($nombre, 'vehículo') !== false
                ) {
                    return 'kilometraje';
                }

                if (
                    strpos($nombre, 'excavadora') !== false ||
                    strpos($nombre, 'tractor') !== false ||
                    strpos($nombre, 'cargador') !== false ||
                    strpos($nombre, 'retroexcavadora') !== false ||
                    strpos($nombre, 'maquinaria') !== false
                ) {
                    return 'horometro';
                }
            }

            // Si no podemos determinar por el nombre, verificamos el rango de mediciones
            $ultimosMeses = Carbon::now()->subMonths(6);

            $consumos = DB::table('consumos')
                ->where('id_equipo', $idMaquina)
                ->where('fecha_consumo', '>=', $ultimosMeses)
                ->orderBy('fecha_consumo', 'desc')
                ->limit(10)
                ->get();

            if ($consumos->isNotEmpty()) {
                $minMedicion = $consumos->min('medicion');
                $maxMedicion = $consumos->max('medicion');

                // Si las mediciones son muy altas, probablemente es kilometraje
                if ($maxMedicion > 10000) {
                    return 'kilometraje';
                } else {
                    return 'horometro';
                }
            }

            // Por defecto
            return 'horometro';
        } catch (\Exception $e) {
            Log::warning('Error al determinar tipo de medición', [
                'id_maquina' => $idMaquina,
                'error' => $e->getMessage()
            ]);

            // Si hay error, asumir horometro por defecto
            return 'horometro';
        }
    }

    /* Los demás métodos del controlador se mantienen igual... */
}
