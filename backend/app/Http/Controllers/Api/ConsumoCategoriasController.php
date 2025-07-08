<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// 😅 "Sistema que funciona por milagro y no tocar nada"

class ConsumoCategoriasController extends Controller
{
    const HORA_INICIO_LABORAL = 8;  // 8:00 AM
    const HORA_FIN_LABORAL = 18;    // 6:00 PM
    const HORAS_LABORALES_DIA = 10; // 8:00-18:00 = 10 horas

    // NUEVO: Configuración de días laborales
    const INCLUIR_SABADOS = true;   // Configuración del negocio
    const INCLUIR_DOMINGOS = false; // Configuración del negocio

    /**
     * Endpoint principal: Calcular consumo por categorías con datos confirmados + simulación
     * POST /api/consumo-categorias/calcular
     */
    public function calcularConsumoPorCategorias(Request $request)
    {
        $request->validate([
            'periodo_dias' => 'nullable|integer|min:1|max:365',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'id_faena' => 'nullable|integer|exists:faenas,id_faena',
            'id_categoria' => 'nullable|integer|exists:categorias_maquinas,id_categoria',
            'incluir_simulacion' => 'boolean',
            'usar_fechas_automaticas' => 'boolean',
            'incluir_sabados' => 'nullable|boolean',
            'incluir_domingos' => 'nullable|boolean'
        ]);

        try {
            // MOMENTO EXACTO DE LA CONSULTA
            $momentoConsulta = now('America/Santiago');

            $incluirSabados = $request->incluir_sabados ?? self::INCLUIR_SABADOS;
            $incluirDomingos = $request->incluir_domingos ?? self::INCLUIR_DOMINGOS;

            if ($request->usar_fechas_automaticas !== false && !$request->fecha_inicio && !$request->fecha_fin) {
                // MODO AUTOMÁTICO CON LÓGICA DE HORARIO LABORAL
                $periodoDias = $request->periodo_dias ?? 30;

                // APLICAR LÓGICA DE NICODEMO PARA FECHAS
                $fechasCalculadas = $this->calcularFechasSegunHorarioLaboral(
                    $momentoConsulta,
                    $periodoDias,
                    $incluirSabados,
                    $incluirDomingos
                );
                $fechaInicio = $fechasCalculadas['fecha_inicio'];
                $fechaFin = $fechasCalculadas['fecha_fin'];
                $modoConsulta = 'automatico_horario_laboral';
                $descripcionPeriodo = $fechasCalculadas['descripcion'];
            } else {
                // Modo manual: usar fechas proporcionadas
                $fechaInicio = Carbon::parse($request->fecha_inicio ?? now()->subDays(30));
                $fechaFinOriginal = $request->fecha_fin ?? now();
                $modoConsulta = 'manual';
                $descripcionPeriodo = "Período específico proporcionado";

                $ajusteFechaFin = $this->ajustarFechaFinInteligente($fechaFinOriginal, $momentoConsulta);
                $fechaFin = $ajusteFechaFin['fecha_ajustada'];

                $modoConsulta = 'manual';
                $descripcionPeriodo = $ajusteFechaFin['fue_ajustada']
                    ? "Período específico con ajuste automático de hora final"
                    : "Período específico proporcionado";
            }

            $idFaena = $request->id_faena;
            $idCategoria = $request->id_categoria;
            $incluirSimulacion = $request->incluir_simulacion ?? true;

            // Procesar categorías...
            $categorias = $this->obtenerCategorias($idCategoria);

            if ($categorias->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron categorías para procesar'
                ], 404);
            }

            $resultados = [];
            $resumenTotal = [
                'consumo_total_litros' => 0,
                'consumo_confirmado_litros' => 0,
                'consumo_simulado_litros' => 0,
                'maquinas_procesadas' => 0,
                'costo_total_estimado' => 0,
                'categorias_analizadas' => 0
            ];

            foreach ($categorias as $categoria) {
                $resultado = $this->procesarCategoria(
                    $categoria,
                    $fechaInicio,
                    $fechaFin,
                    $idFaena,
                    $incluirSimulacion,
                    $incluirSabados,
                    $incluirDomingos,
                    $momentoConsulta,
                    $idFaena
                );

                // ===== NUEVO: FILTRAR RESULTADOS NULOS (categoría 4 excluida) =====
                if ($resultado !== null && isset($resultado['resumen_categoria']) && $resultado['resumen_categoria']['maquinas_procesadas'] > 0) {
                    $resultados[] = $resultado;
                    $resumenTotal['categorias_analizadas']++;

                    $resumenCategoria = $resultado['resumen_categoria'];
                    $resumenTotal['consumo_total_litros'] += $resumenCategoria['consumo_total_litros'];
                    $resumenTotal['consumo_confirmado_litros'] += $resumenCategoria['consumo_confirmado_litros'];
                    $resumenTotal['consumo_simulado_litros'] += $resumenCategoria['consumo_simulado_litros'];
                    $resumenTotal['maquinas_procesadas'] += $resumenCategoria['maquinas_procesadas'];
                    $resumenTotal['costo_total_estimado'] += $resumenCategoria['costo_total_estimado'];
                }
            }

            $diasTotales = $fechaInicio->diffInDays($fechaFin) + 1;
            $diasLaborales = $this->calcularDiasLaboralesCorrectos($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos);
            $diasLaboralesMes = $this->calcularDiasLaboralesMesActual($incluirSabados, $incluirDomingos);

            return response()->json([
                'success' => true,
                'metadatos' => [
                    'consulta' => [
                        'timestamp_consulta' => $momentoConsulta->format('Y-m-d H:i:s'),
                        'timezone' => 'America/Santiago',
                        'ajuste_fecha_fin' => isset($ajusteFechaFin) ? $ajusteFechaFin : null,
                        'modo_consulta' => $modoConsulta,
                        'descripcion_periodo' => $descripcionPeriodo,
                        'usuario_timestamp' => "Consulta realizada: " . $momentoConsulta->format('d/m/Y \a \l\a\s H:i'),
                        // NUEVO: Información sobre horario laboral
                        'analisis_horario_laboral' => $this->analizarHorarioConsulta($momentoConsulta, $incluirSabados, $incluirDomingos)
                    ],
                    'configuracion_laboral' => [
                        'incluye_sabados' => $incluirSabados,
                        'incluye_domingos' => $incluirDomingos,
                        'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos),
                        'horario_operacion' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00',
                        'horas_por_dia_laboral' => self::HORAS_LABORALES_DIA
                    ],
                    'periodo' => [
                        'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                        'fecha_fin' => $fechaFin->format('Y-m-d'),
                        'hora_inicio' => $fechaInicio->format('H:i'),
                        'hora_fin' => $fechaFin->format('H:i'),
                        'dias_calendario' => $diasTotales,
                        'dias_laborales_reales' => $diasLaborales,
                        'dias_laborales_mes_actual' => $diasLaboralesMes,
                        'horario_operacion' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00 (' . self::HORAS_LABORALES_DIA . ' horas)',
                        'fecha_consulta' => $momentoConsulta->format('Y-m-d H:i:s'),
                        'timezone' => 'America/Santiago'
                    ],
                    'filtros_aplicados' => [
                        'faena' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas',
                        'categoria' => $idCategoria ? $this->obtenerNombreCategoria($idCategoria) : 'Todas las categorías (' . $resumenTotal['categorias_analizadas'] . ' con datos)',
                        'incluye_simulacion' => $incluirSimulacion,
                        'modo_fechas' => $modoConsulta === 'automatico_horario_laboral' ? 'Automático (horario laboral)' : 'Manual',
                        'periodo_analizado' => $modoConsulta === 'automatico_horario_laboral' ? ($request->periodo_dias ?? 30) . ' días con ajuste horario' : 'Rango específico'
                    ]
                ],
                'resumen_ejecutivo' => [
                    'consumo_total' => [
                        'litros' => round($resumenTotal['consumo_total_litros'], 2),
                        'porcentaje_confirmado' => $resumenTotal['consumo_total_litros'] > 0
                            ? round(($resumenTotal['consumo_confirmado_litros'] / $resumenTotal['consumo_total_litros']) * 100, 1)
                            : 0,
                        'porcentaje_simulado' => $resumenTotal['consumo_total_litros'] > 0
                            ? round(($resumenTotal['consumo_simulado_litros'] / $resumenTotal['consumo_total_litros']) * 100, 1)
                            : 0
                    ],
                    'precision_datos' => $this->clasificarPrecision($resumenTotal['consumo_total_litros'], $resumenTotal['consumo_confirmado_litros']),
                    'flota_analizada' => [
                        'categorias_con_datos' => $resumenTotal['categorias_analizadas'],
                        'categorias_totales' => count($categorias),
                        'maquinas_totales' => $resumenTotal['maquinas_procesadas'],
                        'promedio_maquinas_por_categoria' => $resumenTotal['categorias_analizadas'] > 0
                            ? round($resumenTotal['maquinas_procesadas'] / $resumenTotal['categorias_analizadas'], 1)
                            : 0
                    ],
                    'costo_estimado' => [
                        'total' => round($resumenTotal['costo_total_estimado'], 0),
                        'moneda' => 'CLP',
                        'precio_promedio_litro' => $resumenTotal['consumo_total_litros'] > 0
                            ? round($resumenTotal['costo_total_estimado'] / $resumenTotal['consumo_total_litros'], 0)
                            : 0,
                        'costo_por_dia_laboral' => $diasLaborales > 0
                            ? round($resumenTotal['costo_total_estimado'] / $diasLaborales, 0)
                            : 0
                    ]
                ],
                'analisis_por_categoria' => $resultados,
                'recomendaciones' => $this->generarRecomendacionesMejoradas($resultados, $resumenTotal, $diasLaborales, $modoConsulta)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular consumo por categorías',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => basename($e->getFile()),
                'timestamp' => now('America/Santiago')->format('Y-m-d H:i:s')
            ], 500);
        }
    }


    /**
     * NUEVO: Calcular fechas según horario laboral (LÓGICA DE NICODEMO)
     */
    private function calcularFechasSegunHorarioLaboral($momentoConsulta, $periodoDias, $incluirSabados, $incluirDomingos)
    {
        $horaConsulta = $momentoConsulta->hour;
        $minutoConsulta = $momentoConsulta->minute;
        $esDiaLaboral = $this->esDiaLaboral($momentoConsulta, $incluirSabados, $incluirDomingos);

        // LÓGICA PRINCIPAL DE NICODEMO
        if ($esDiaLaboral) {
            if ($horaConsulta < self::HORA_INICIO_LABORAL) {
                // ANTES de las 8:00 AM: NO considerar el día actual
                $fechaFin = $momentoConsulta->copy()->subDay()->setTime(self::HORA_FIN_LABORAL, 0, 0);
                $descripcion = "Consulta antes del horario laboral ({$momentoConsulta->format('H:i')}) - día actual excluido";
                $contexto = "pre_laboral";
            } elseif ($horaConsulta >= self::HORA_FIN_LABORAL) {
                // DESPUÉS de las 6:00 PM: Considerar TODO el día actual
                $fechaFin = $momentoConsulta->copy()->setTime(self::HORA_FIN_LABORAL, 0, 0);
                $descripcion = "Consulta después del horario laboral ({$momentoConsulta->format('H:i')}) - día actual incluido completo";
                $contexto = "post_laboral";
            } else {
                // DURANTE horario laboral: Considerar hasta la hora actual
                $fechaFin = $momentoConsulta->copy();
                $descripcion = "Consulta durante horario laboral ({$momentoConsulta->format('H:i')}) - día actual incluido hasta ahora";
                $contexto = "en_horario_laboral";
            }
        } else {
            // DÍA NO LABORAL: Siempre considerar hasta el final del último día laboral
            $ultimoDiaLaboral = $this->obtenerUltimoDiaLaboral($momentoConsulta, $incluirSabados, $incluirDomingos);
            $fechaFin = $ultimoDiaLaboral->setTime(self::HORA_FIN_LABORAL, 0, 0);
            $descripcion = "Consulta en día no laboral - se considera hasta último día laboral ({$ultimoDiaLaboral->format('d/m/Y')})";
            $contexto = "dia_no_laboral";
        }

        // Calcular fecha de inicio
        $fechaInicio = $fechaFin->copy()->subDays($periodoDias)->setTime(self::HORA_INICIO_LABORAL, 0, 0);

        return [
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'descripcion' => $descripcion,
            'contexto_consulta' => $contexto,
            'momento_original' => $momentoConsulta,
            'ajuste_aplicado' => [
                'dia_laboral' => $esDiaLaboral,
                'hora_consulta' => $momentoConsulta->format('H:i'),
                'accion_tomada' => $this->explicarAccionTomada($contexto, $momentoConsulta)
            ]
        ];
    }

    /**
     * NUEVO: Obtener último día laboral
     */
    private function obtenerUltimoDiaLaboral($fecha, $incluirSabados, $incluirDomingos)
    {
        $fechaActual = $fecha->copy()->subDay();

        while (!$this->esDiaLaboral($fechaActual, $incluirSabados, $incluirDomingos)) {
            $fechaActual->subDay();
        }

        return $fechaActual;
    }

    /**
     * NUEVO: Explicar acción tomada
     */
    private function explicarAccionTomada($contexto, $momentoConsulta)
    {
        $explicaciones = [
            'pre_laboral' => "Día actual excluido porque la consulta fue a las {$momentoConsulta->format('H:i')}, antes de las " . self::HORA_INICIO_LABORAL . ":00",
            'post_laboral' => "Día actual incluido completo porque la consulta fue a las {$momentoConsulta->format('H:i')}, después de las " . self::HORA_FIN_LABORAL . ":00",
            'en_horario_laboral' => "Día actual incluido hasta las {$momentoConsulta->format('H:i')} porque la consulta fue durante horario laboral",
            'dia_no_laboral' => "Se considera hasta el último día laboral porque la consulta fue en {$momentoConsulta->locale('es')->dayName}"
        ];

        return $explicaciones[$contexto] ?? 'Acción no determinada';
    }

    /**
     * NUEVO: Analizar horario de consulta
     */
    private function analizarHorarioConsulta($momentoConsulta, $incluirSabados, $incluirDomingos)
    {
        $horaConsulta = $momentoConsulta->hour;
        $esDiaLaboral = $this->esDiaLaboral($momentoConsulta, $incluirSabados, $incluirDomingos);

        $analisis = [
            'hora_consulta' => $momentoConsulta->format('H:i:s'),
            'dia_semana' => $momentoConsulta->locale('es')->dayName,
            'es_dia_laboral' => $esDiaLaboral,
            'dentro_horario_laboral' => $horaConsulta >= self::HORA_INICIO_LABORAL && $horaConsulta < self::HORA_FIN_LABORAL,
            'horario_referencia' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00'
        ];

        // Determinar categoría de consulta
        if (!$esDiaLaboral) {
            $analisis['categoria_consulta'] = 'dia_no_laboral';
            $analisis['descripcion'] = 'Consulta realizada en día no laboral';
        } elseif ($horaConsulta < self::HORA_INICIO_LABORAL) {
            $analisis['categoria_consulta'] = 'pre_laboral';
            $analisis['descripcion'] = 'Consulta antes del inicio del horario laboral';
        } elseif ($horaConsulta >= self::HORA_FIN_LABORAL) {
            $analisis['categoria_consulta'] = 'post_laboral';
            $analisis['descripcion'] = 'Consulta después del fin del horario laboral';
        } else {
            $analisis['categoria_consulta'] = 'en_horario_laboral';
            $analisis['descripcion'] = 'Consulta durante el horario laboral activo';
            $analisis['minutos_transcurridos_hoy'] = $momentoConsulta->diffInMinutes($momentoConsulta->copy()->setTime(self::HORA_INICIO_LABORAL, 0, 0));
            $analisis['porcentaje_dia_laboral'] = round(($analisis['minutos_transcurridos_hoy'] / (self::HORAS_LABORALES_DIA * 60)) * 100, 1);
        }

        return $analisis;
    }


    /**
     * CORREGIDO: Calcular días laborales según configuración del negocio
     */
    private function calcularDiasLaboralesCorrectos($fechaInicio, $fechaFin, $incluirSabados = null, $incluirDomingos = null)
    {
        $incluirSabados = $incluirSabados ?? self::INCLUIR_SABADOS;
        $incluirDomingos = $incluirDomingos ?? self::INCLUIR_DOMINGOS;

        $diasLaborales = 0;
        $fecha = $fechaInicio->copy()->startOfDay();
        // Antes $fechaFinAnalisis = $fechaFin->copy()->startOfDay();
        $fechaFinAnalisis = $fechaFin->copy()->endOfDay();
        while ($fecha <= $fechaFinAnalisis) {
            if ($this->esDiaLaboral($fecha, $incluirSabados, $incluirDomingos)) {
                $diasLaborales++;
            }
            $fecha->addDay();
        }

        return $diasLaborales;
    }

    /**
     * NUEVO: Determinar si un día es laboral según configuración
     */
    private function esDiaLaboral($fecha, $incluirSabados = true, $incluirDomingos = false)
    {
        $diaSemana = $fecha->dayOfWeek;

        if ($diaSemana >= 1 && $diaSemana <= 5) return true;
        if ($diaSemana === 6) return $incluirSabados;
        if ($diaSemana === 0) return $incluirDomingos;

        return false;
    }

    /**
     * NUEVO: Calcular días laborales del mes actual
     */
    private function calcularDiasLaboralesMesActual($incluirSabados = null, $incluirDomingos = null)
    {
        $incluirSabados = $incluirSabados ?? self::INCLUIR_SABADOS;
        $incluirDomingos = $incluirDomingos ?? self::INCLUIR_DOMINGOS;

        $ahora = now('America/Santiago');
        $inicioMes = $ahora->copy()->startOfMonth();
        $finMes = $ahora->copy()->endOfMonth();

        return $this->calcularDiasLaboralesCorrectos($inicioMes, $finMes, $incluirSabados, $incluirDomingos);
    }

    /**
     * NUEVO: Obtener días por semana según configuración
     */
    private function getDiasPorSemana($incluirSabados = true, $incluirDomingos = false)
    {
        $dias = 5; // Lunes a Viernes
        if ($incluirSabados) $dias++;
        if ($incluirDomingos) $dias++;
        return $dias;
    }

    /**
     * CORREGIDO: Formatear períodos confirmados con cálculo de días precisos
     */
    private function formatearPeriodosConfirmados($consumosConfirmados, $incluirSabados = true, $incluirDomingos = false)
    {
        if (empty($consumosConfirmados)) {
            return [];
        }

        return array_map(function ($consumo) use ($incluirSabados, $incluirDomingos) {
            $fechaInicio = Carbon::parse($consumo['fecha_inicio']);
            $fechaFin = Carbon::parse($consumo['fecha_fin']);

            // CORREGIDO: Usar configuración de días laborales
            $diasLaborales = $this->calcularDiasLaboralesCorrectos($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos);

            // CORREGIDO: Cálculo preciso de días calendario con horas
            $diasCalendarioExactos = $fechaInicio->diffInHours($fechaFin) / 24;
            $diasCalendarioEnteros = $fechaInicio->diffInDays($fechaFin) + 1;

            $horasLaboralesReales = $diasLaborales * self::HORAS_LABORALES_DIA;

            // Determinar si incluye fin de semana
            $incluyeFinDeSemana = $this->incluyeFinDeSemana($fechaInicio, $fechaFin);

            return [
                'periodo' => [
                    'fecha_inicio' => $fechaInicio->format('d/m/Y'),
                    'fecha_fin' => $fechaFin->format('d/m/Y'),
                    'horario_carga_inicio' => $fechaInicio->format('H:i'),
                    'horario_carga_fin' => $fechaFin->format('H:i'),
                    'dias_calendario_exactos' => round($diasCalendarioExactos, 2), // NUEVO: Días con decimales
                    'dias_calendario_enteros' => $diasCalendarioEnteros, // NUEVO: Días enteros
                    'dias_laborales' => $diasLaborales,
                    'horas_laborales_periodo' => $horasLaboralesReales,
                    'horario_operacion' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00'
                ],
                'consumo' => [
                    'litros' => round($consumo['litros_confirmados'], 2),
                    'promedio_por_dia_laboral' => $diasLaborales > 0 ? round($consumo['litros_confirmados'] / $diasLaborales, 2) : 0,
                    'promedio_por_hora_laboral' => $horasLaboralesReales > 0 ? round($consumo['litros_confirmados'] / $horasLaboralesReales, 2) : 0,
                    'intensidad_uso' => $this->clasificarIntensidadUso($consumo['litros_confirmados'], $diasLaborales)
                ],
                'confirmacion' => [
                    'metodo' => 'Recarga posterior confirma consumo anterior',
                    'referencia' => $consumo['confirmado_por'] ?? 'N/A',
                    'confiabilidad' => 'Alta (100%)'
                ],
                'contexto_operacional' => [
                    'tipo_periodo' => $this->identificarTipoPeriodo($diasCalendarioEnteros),
                    'incluye_fines_semana' => $incluyeFinDeSemana,
                    'detalle_periodo' => $this->generarDetallePeriodo($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos)
                ]
            ];
        }, $consumosConfirmados);
    }

    /**
     * CORREGIDO: Generar detalle del período con configuración laboral
     */
    private function generarDetallePeriodo($fechaInicio, $fechaFin, $incluirSabados = true, $incluirDomingos = false)
    {
        $fecha = $fechaInicio->copy();
        $detalle = [];

        while ($fecha <= $fechaFin) {
            $esLaboral = $this->esDiaLaboral($fecha, $incluirSabados, $incluirDomingos);

            $detalle[] = [
                'fecha' => $fecha->format('d/m'),
                'dia' => $fecha->locale('es')->dayName,
                'laboral' => $esLaboral,
                'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos)
            ];
            $fecha->addDay();
        }

        return $detalle;
    }

    /**
     * NUEVO: Obtener tipo de día
     */
    private function getTipoDia($fecha, $incluirSabados = true, $incluirDomingos = false)
    {
        $diaSemana = $fecha->dayOfWeek;

        if ($diaSemana >= 1 && $diaSemana <= 5) {
            return 'Laboral estándar';
        } elseif ($diaSemana === 6) {
            return $incluirSabados ? 'Laboral (sábado)' : 'No laboral (sábado)';
        } elseif ($diaSemana === 0) {
            return $incluirDomingos ? 'Laboral (domingo)' : 'No laboral (domingo)';
        }

        return 'No determinado';
    }

    /**
     * ✅ MÉTODO ACTUALIZADO: procesarCategoria con separación por faenas
     */
    private function procesarCategoria($categoria, $fechaInicio, $fechaFin, $idFaena, $incluirSimulacion, $incluirSabados, $incluirDomingos, $momentoConsulta)
    {
        try {
            // Verificar si es categoría 4 y excluir
            if ($categoria->id_categoria == 3) {
                return null;
            }

            $maquinas = $this->obtenerMaquinasCategoria($categoria->id_categoria, $idFaena);

            if ($maquinas->isEmpty()) {
                return [
                    'categoria' => $this->formatearInfoCategoria($categoria),
                    'maquinas_analizadas' => [],
                    'analisis_detallado' => [],
                    'resumen_categoria' => $this->resumenVacio()
                ];
            }

            $analisisPorMaquina = [];
            $totalConfirmado = 0;
            $totalSimulado = 0;

            foreach ($maquinas as $maquina) {
                // ✅ USAR NUEVA FUNCIÓN: Separar por faenas si es necesario
                $analisisMaquinaPorFaenas = $this->analizarMaquinaConSeparacionFaenas(
                    $maquina->id_maquina,
                    $fechaInicio,
                    $fechaFin,
                    $categoria,
                    $incluirSimulacion,
                    $incluirSabados,
                    $incluirDomingos,
                    $momentoConsulta,
                    $idFaena
                );

                // Agregar cada entrada (una por faena si hay múltiples)
                foreach ($analisisMaquinaPorFaenas as $analisisFaena) {
                    $analisisPorMaquina[] = $analisisFaena;

                    // Acumular totales
                    $totalConfirmado += $analisisFaena['resumen_ejecutivo']['litros_confirmados'];
                    $totalSimulado += $analisisFaena['resumen_ejecutivo']['litros_simulados'];
                }
            }

            $precioPromedio = $this->obtenerPrecioPromedioCategoria($categoria->id_categoria, $fechaInicio, $fechaFin);
            $costoTotal = ($totalConfirmado + $totalSimulado) * $precioPromedio;
            $diasLaboralesMes = $this->calcularDiasLaboralesMesActual($incluirSabados, $incluirDomingos);

            return [
                'categoria' => $this->formatearInfoCategoria($categoria),
                'parametros_operacion' => [
                    'consumo_hora_cronologica' => (float) ($categoria->chc ?? 10.0),
                    'horas_cronologicas_dia' => (float) ($categoria->hrc ?? 7.0),
                    'consumo_teorico_dia' => round(((float) ($categoria->chc ?? 10.0)) * ((float) ($categoria->hrc ?? 7.0)), 2),
                    'horario_trabajo' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00',
                    'dias_laborales_mes' => $diasLaboralesMes,
                    'incluye_sabados' => $incluirSabados,
                    'incluye_domingos' => $incluirDomingos,
                    'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
                ],
                'maquinas_analizadas' => array_map(function ($m) {
                    return [
                        'id' => $m->id_maquina,
                        'nombre' => $m->nombre_maquina,
                        'patente' => $m->patente ?? 'N/A',
                        'estado' => $m->estado ?? 'N/A'
                    ];
                }, $maquinas->toArray()),
                'analisis_detallado' => $analisisPorMaquina, // ✅ Ahora incluye separación por faenas
                'resumen_categoria' => [
                    'maquinas_procesadas' => count($maquinas),
                    'entradas_procesadas' => count($analisisPorMaquina), // ✅ NUEVO: Total de entradas
                    'consumo_confirmado_litros' => round($totalConfirmado, 2),
                    'consumo_simulado_litros' => round($totalSimulado, 2),
                    'consumo_total_litros' => round($totalConfirmado + $totalSimulado, 2),
                    'precision_porcentaje' => ($totalConfirmado + $totalSimulado) > 0
                        ? round(($totalConfirmado / ($totalConfirmado + $totalSimulado)) * 100, 1)
                        : 0,
                    'costo_total_estimado' => round($costoTotal, 0),
                    'precio_promedio_litro' => round($precioPromedio, 0),
                    'nota_separacion' => count($analisisPorMaquina) > count($maquinas)
                        ? 'Algunas máquinas aparecen múltiples veces (operan en diferentes faenas)'
                        : 'Una entrada por máquina',
                    'eficiencia_vs_teorica' => $this->calcularEficienciaVsTeorica($totalConfirmado, $categoria, $fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos)
                ]
            ];
        } catch (\Exception $e) {
            return [
                'categoria' => $this->formatearInfoCategoria($categoria),
                'maquinas_analizadas' => [],
                'analisis_detallado' => [],
                'resumen_categoria' => $this->resumenVacio(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ✅ MÉTODO ACTUALIZADO: Actualizar el método que llama al cálculo de rendimiento
     */
    private function calcularEstadisticasDetalladasMaquina($maquina, $analisisMaquina, $categoria, $fechaInicio, $fechaFin, $incluirSabados = true, $incluirDomingos = false, $idFaena = null)
    {
        // Calcular totales
        $litrosTotales = $analisisMaquina['total_confirmado'] + ($analisisMaquina['simulacion']['litros_simulados'] ?? 0);
        $litrosConfirmados = $analisisMaquina['total_confirmado'];
        $litrosSimulados = $analisisMaquina['simulacion']['litros_simulados'] ?? 0;

        // Calcular días y medición según tipo
        $diasLaborales = $this->calcularDiasLaboralesCorrectos($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos);
        $medicionTotal = $this->calcularMedicionTotal($maquina->id_maquina, $fechaInicio, $fechaFin, $idFaena);

        // Calcular precio promedio
        $precioPromedio = $this->obtenerPrecioPromedioMaquina($maquina->id_maquina, $fechaInicio, $fechaFin, $idFaena);
        $valorTotal = $litrosTotales * $precioPromedio;

        // ✅ CORRECCIÓN: Pasar todos los parámetros necesarios
        $rendimiento = $this->calcularRendimientoMaquina(
            $litrosTotales,
            $litrosConfirmados,
            $medicionTotal,
            $categoria,
            $categoria->tipo_medicion
        );

        return [
            'resumen' => [
                'litros_totales' => round($litrosTotales, 2),
                'litros_confirmados' => round($litrosConfirmados, 2),
                'litros_simulados' => round($litrosSimulados, 2),
                'porcentaje_confirmado' => $litrosTotales > 0 ? round(($litrosConfirmados / $litrosTotales) * 100, 1) : 0,
                'dias_operativos' => $diasLaborales,
                'promedio_litros_dia' => $diasLaborales > 0 ? round($litrosTotales / $diasLaborales, 2) : 0
            ],
            'rendimiento' => [
                'tipo_medicion' => $categoria->tipo_medicion,
                'medicion_total' => $medicionTotal,
                'rendimiento_valor' => $rendimiento['valor'],
                'rendimiento_unidad' => $rendimiento['unidad'],
                'rendimiento_formateado' => $rendimiento['formateado'],
                'interpretacion' => $rendimiento['interpretacion'],
                'detalle_calculo' => $rendimiento['detalle_calculo'] ?? null
            ],
            'costos' => [
                'precio_promedio_litro' => round($precioPromedio, 0),
                'valor_total' => round($valorTotal, 0),
                'costo_por_dia' => $diasLaborales > 0 ? round($valorTotal / $diasLaborales, 0) : 0,
                'moneda' => 'CLP'
            ]
        ];
    }
    /**
     * ✅ NUEVO: Analizar máquina separando por faenas cuando opera en múltiples
     */
    private function analizarMaquinaConSeparacionFaenas($idMaquina, $fechaInicio, $fechaFin, $categoria, $incluirSimulacion, $incluirSabados, $incluirDomingos, $momentoConsulta, $idFaena = null)
    {
        // 1. Obtener todas las faenas donde esta máquina tuvo consumos en el período
        $faenasConConsumos = DB::table('consumos')
            ->join('faenas', 'consumos.id_faena', '=', 'faenas.id_faena')
            ->where('consumos.id_equipo', $idMaquina)
            ->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin])
            ->when($idFaena, function ($query, $idFaena) {
                return $query->where('consumos.id_faena', $idFaena);
            })
            ->select([
                'faenas.id_faena',
                'faenas.ubicacion',
                'faenas.detalle',
                DB::raw('COUNT(*) as consumos_count'),
                DB::raw('MIN(consumos.fecha_consumo) as primera_fecha'),
                DB::raw('MAX(consumos.fecha_consumo) as ultima_fecha')
            ])
            ->groupBy('faenas.id_faena', 'faenas.ubicacion', 'faenas.detalle')
            ->orderBy('faenas.id_faena')
            ->get();

        if ($faenasConConsumos->isEmpty()) {
            return []; // Sin datos para esta máquina
        }

        $resultadosPorFaena = [];

        // 2. Analizar cada faena por separado
        foreach ($faenasConConsumos as $faenaInfo) {
            $analisisFaena = $this->analizarMaquinaEnFaenaEspecifica(
                $idMaquina,
                $faenaInfo->id_faena,
                $fechaInicio,
                $fechaFin,
                $categoria,
                $incluirSimulacion,
                $incluirSabados,
                $incluirDomingos,
                $momentoConsulta
            );

            if (!empty($analisisFaena['consumos_confirmados']) || !empty($analisisFaena['simulacion'])) {
                // 3. Crear entrada separada para esta faena
                $estadisticasDetalladas = $this->calcularEstadisticasDetalladasMaquina(
                    (object)[
                        'id_maquina' => $idMaquina,
                        'nombre_maquina' => $this->obtenerNombreMaquina($idMaquina),
                        'patente' => $this->obtenerPatenteMaquina($idMaquina),
                        'estado' => 'operativo'
                    ],
                    $analisisFaena,
                    $categoria,
                    $fechaInicio,
                    $fechaFin,
                    $incluirSabados,
                    $incluirDomingos,
                    $faenaInfo->id_faena
                );

                $resultadosPorFaena[] = [
                    'maquina' => [
                        'id' => $idMaquina,
                        'nombre' => $this->obtenerNombreMaquina($idMaquina),
                        'patente' => $this->obtenerPatenteMaquina($idMaquina),
                        'tipo' => $categoria->nombre_categoria,
                        'tipo_medicion' => $categoria->tipo_medicion,
                        'faena' => [
                            'id' => $faenaInfo->id_faena,
                            'nombre' => $faenaInfo->ubicacion,
                            'detalle' => $faenaInfo->detalle,
                            'consumos_en_periodo' => $faenaInfo->consumos_count,
                            'periodo_operacion' => [
                                'desde' => $faenaInfo->primera_fecha,
                                'hasta' => $faenaInfo->ultima_fecha
                            ],
                            'origen' => 'faena_especifica_separada'
                        ],
                        'estado' => 'operativo'
                    ],
                    'resumen_ejecutivo' => $estadisticasDetalladas['resumen'],
                    'rendimiento' => $estadisticasDetalladas['rendimiento'],
                    'costos' => $estadisticasDetalladas['costos'],
                    'periodos_confirmados' => $this->formatearPeriodosConfirmados($analisisFaena['consumos_confirmados'], $incluirSabados, $incluirDomingos),
                    'simulacion' => $analisisFaena['simulacion'] ? $this->formatearSimulacion($analisisFaena['simulacion'], $incluirSabados, $incluirDomingos) : null,
                    'estadisticas' => $this->calcularEstadisticasMaquina($analisisFaena, $categoria, $incluirSabados, $incluirDomingos),
                    'info_consulta' => [
                        'momento_consulta' => $momentoConsulta->format('Y-m-d H:i:s'),
                        'faena_separada' => true,
                        'total_faenas_maquina' => $faenasConConsumos->count(),
                        'ajuste_aplicado' => $analisisFaena['ajuste_consulta'] ?? null
                    ]
                ];
            }
        }

        return $resultadosPorFaena;
    }

    /**
     * ✅ MÉTODOS AUXILIARES para obtener datos de máquina
     */
    private function obtenerNombreMaquina($idMaquina)
    {
        return DB::table('maquinas')
            ->where('id_maquina', $idMaquina)
            ->value('nombre_maquina') ?? 'Máquina #' . $idMaquina;
    }

    private function obtenerPatenteMaquina($idMaquina)
    {
        return DB::table('maquinas')
            ->where('id_maquina', $idMaquina)
            ->value('patente') ?? 'N/A';
    }

    /**
     * ✅ NUEVO: Analizar máquina en una faena específica
     */
    private function analizarMaquinaEnFaenaEspecifica($idMaquina, $idFaena, $fechaInicio, $fechaFin, $categoria, $incluirSimulacion, $incluirSabados, $incluirDomingos, $momentoConsulta)
    {
        // Filtrar consumos solo de esta faena específica
        $query = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->where('id_faena', $idFaena) // ✅ FILTRO ESPECÍFICO
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);

        $cargas = $query->orderBy('fecha_consumo')->get();

        if ($cargas->isEmpty()) {
            return [
                'consumos_confirmados' => [],
                'simulacion' => null,
                'total_confirmado' => 0,
                'ajuste_consulta' => 'sin_datos_en_faena'
            ];
        }

        $consumosConfirmados = [];
        $totalConfirmado = 0;

        // Procesar consumos confirmados (excluyendo última carga según regla de Nicodemo)
        for ($i = 0; $i < count($cargas) - 1; $i++) {
            $cargaActual = $cargas[$i];
            $cargaSiguiente = $cargas[$i + 1];

            $consumoConfirmado = [
                'id_maquina' => $idMaquina,
                'id_faena' => $idFaena,
                'fecha_inicio' => $cargaActual->fecha_consumo,
                'fecha_fin' => $cargaSiguiente->fecha_consumo,
                'litros_confirmados' => (float) $cargaActual->litros_consumidos,
                'confirmado_por' => 'carga_posterior_' . $cargaSiguiente->id_consumo,
                'tipo' => 'CONFIRMADO'
            ];

            $consumosConfirmados[] = $consumoConfirmado;
            $totalConfirmado += $cargaActual->litros_consumidos;
        }

        $simulacion = null;
        $ajusteConsulta = null;

        if ($incluirSimulacion && count($cargas) > 0) {
            $ultimaCarga = $cargas->last();
            $fechaUltimaCarga = Carbon::parse($ultimaCarga->fecha_consumo);

            if ($fechaUltimaCarga->lt($fechaFin)) {
                $simulacion = $this->simularConsumoUltimaCarga(
                    $ultimaCarga,
                    $fechaFin,
                    $categoria,
                    $incluirSabados,
                    $incluirDomingos,
                    $momentoConsulta
                );

                $ajusteConsulta = [
                    'ultima_carga_fecha' => $fechaUltimaCarga->format('Y-m-d H:i:s'),
                    'stock_ultima_carga' => $ultimaCarga->litros_consumidos,
                    'simulacion_limitada_por_stock' => $simulacion['limitado_por_stock'] ?? false,
                    'momento_consulta_aplicado' => $momentoConsulta->format('Y-m-d H:i:s'),
                    'faena_especifica' => $idFaena
                ];
            }
        }

        return [
            'consumos_confirmados' => $consumosConfirmados,
            'simulacion' => $simulacion,
            'total_confirmado' => $totalConfirmado,
            'ajuste_consulta' => $ajusteConsulta
        ];
    }

    /**
     * NUEVO: Calcular rendimiento según tipo de medición
     */
    /**
     * ✅ MÉTODO CORREGIDO: Calcular rendimiento con tiempo real + proyección
     */
    private function calcularRendimientoMaquina($litrosTotales, $litrosConfirmados, $medicionData, $categoria, $tipoMedicion)
    {
        $medicionValor = $medicionData['valor'] ?? 0;
        $litrosSimulados = $litrosTotales - $litrosConfirmados;

        if ($medicionValor <= 0 || $litrosTotales <= 0) {
            return [
                'valor' => 0,
                'unidad' => $tipoMedicion === 'Kilometraje' ? 'lts/km' : 'lts/h',
                'formateado' => '0.00 ' . ($tipoMedicion === 'Kilometraje' ? 'lts/km' : 'lts/h'),
                'interpretacion' => 'Sin datos suficientes para calcular rendimiento',
                'detalle_calculo' => [
                    'error' => 'Datos insuficientes',
                    'medicion_valor' => $medicionValor,
                    'litros_totales' => $litrosTotales
                ]
            ];
        }

        // ✅ NUEVA LÓGICA: Tiempo real + tiempo proyectado
        $tiempoReal = $medicionValor; // Diferencia de mediciones (horas o km reales)
        $tiempoProyectado = 0;

        // Si hay litros simulados, calcular tiempo proyectado
        if ($litrosSimulados > 0) {
            $chc = (float) ($categoria->chc ?? 10.0); // Consumo por hora cronológica
            $tiempoProyectado = $litrosSimulados / $chc;
        }

        $tiempoTotal = $tiempoReal + $tiempoProyectado;
        $rendimiento = $litrosTotales / $tiempoTotal;
        $unidad = $tipoMedicion === 'Kilometraje' ? 'lts/km' : 'lts/h';

        // Interpretación según el tipo
        $interpretacion = $this->interpretarRendimiento($rendimiento, $tipoMedicion);

        return [
            'valor' => round($rendimiento, 2),
            'unidad' => $unidad,
            'formateado' => round($rendimiento, 2) . ' ' . $unidad,
            'interpretacion' => $interpretacion,
            'detalle_calculo' => [
                'litros_totales' => $litrosTotales,
                'litros_confirmados' => $litrosConfirmados,
                'litros_simulados' => $litrosSimulados,
                'tiempo_real' => $tiempoReal,
                'tiempo_proyectado' => $tiempoProyectado,
                'tiempo_total' => $tiempoTotal,
                'chc_utilizado' => $categoria->chc ?? 10.0,
                'metodo' => 'tiempo_real_mas_proyeccion'
            ]
        ];
    }
    /**
     * ✅ MÉTODO MEJORADO: Interpretación más precisa del rendimiento
     */
    private function interpretarRendimiento($rendimiento, $tipoMedicion)
    {
        if ($tipoMedicion === 'Kilometraje') {
            // Para camiones - litros por kilómetro
            if ($rendimiento > 0.5) {
                return 'Consumo alto - revisar eficiencia';
            } elseif ($rendimiento > 0.3) {
                return 'Consumo moderado - dentro del rango normal';
            } else {
                return 'Consumo eficiente';
            }
        } else {
            // Para maquinaria - litros por hora
            if ($rendimiento > 15) {
                return 'Consumo alto - revisar condiciones operativas';
            } elseif ($rendimiento > 8) {
                return 'Consumo moderado - rango operativo normal';
            } elseif ($rendimiento > 3) {
                return 'Consumo bajo - operación eficiente';
            } else {
                return 'Consumo muy bajo - verificar mediciones';
            }
        }
    }

    /**
     * NUEVO: Obtener precio promedio específico de una máquina
     */
    private function obtenerPrecioPromedioMaquina($idMaquina, $fechaInicio, $fechaFin, $idFaena = null)
    {
        // ✅ CONSTRUIR LA QUERY COMPLETA ANTES DE EJECUTAR
        $query = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('precio_litro')
            ->where('precio_litro', '>', 0);

        // ✅ FILTRAR POR FAENA ANTES DE EJECUTAR
        if ($idFaena) {
            $query->where('id_faena', $idFaena);
        }

        // ✅ AHORA SÍ EJECUTAR
        return $query->avg('precio_litro') ?? 0;
    }

    /**
     * NUEVO: Calcular medición total según tipo de máquina
     */
    /**
     * ✅ MÉTODO CORREGIDO: Calcular la diferencia real entre mediciones
     */
    private function calcularMedicionTotal($idMaquina, $fechaInicio, $fechaFin, $idFaena = null)
    {
        $query = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('medicion')
            ->where('medicion', '>', 0);

        if ($idFaena) {
            $query->where('id_faena', $idFaena);
        }

        $mediciones = $query->orderBy('fecha_consumo', 'asc')->get();

        if ($mediciones->isEmpty()) {
            return [
                'valor' => 0,
                'primera_medicion' => null,
                'ultima_medicion' => null,
                'total_registros' => 0
            ];
        }

        $primeraMedicion = $mediciones->first();
        $ultimaMedicion = $mediciones->last();

        // ✅ CORRECCIÓN: Calcular diferencia, no suma
        $diferencia = $ultimaMedicion->medicion - $primeraMedicion->medicion;

        return [
            'valor' => max(0, $diferencia), // Asegurar que no sea negativo
            'primera_medicion' => $primeraMedicion->medicion,
            'ultima_medicion' => $ultimaMedicion->medicion,
            'total_registros' => $mediciones->count(),
            'fecha_inicial' => $primeraMedicion->fecha_consumo,
            'fecha_final' => $ultimaMedicion->fecha_consumo
        ];
    }

    /**
     * ✅ NUEVO: Método para obtener información de faena de una máquina
     */
    private function obtenerFaenaMaquina($idMaquina, $idFaenaConsulta = null, $fechaInicio = null, $fechaFin = null)
    {
        if ($idFaenaConsulta) {
            // Si se especificó una faena en la consulta, usar esa
            $faena = DB::table('faenas')->where('id_faena', $idFaenaConsulta)->first();
            return [
                'id' => $faena->id_faena,
                'nombre' => $faena->ubicacion,
                'detalle' => $faena->detalle ?? null,
                'origen' => 'consulta_especifica'
            ];
        }
        // ✅ NUEVO: Verificar faenas REALMENTE USADAS en el período específico
        if ($fechaInicio && $fechaFin) {
            $faenasUsadasEnPeriodo = DB::table('consumos')
                ->join('faenas', 'consumos.id_faena', '=', 'faenas.id_faena')
                ->where('consumos.id_equipo', $idMaquina)
                ->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin])
                ->select([
                    'faenas.id_faena',
                    'faenas.ubicacion',
                    'faenas.detalle',
                    DB::raw('COUNT(*) as consumos_count'),
                    DB::raw('MIN(consumos.fecha_consumo) as primera_fecha'),
                    DB::raw('MAX(consumos.fecha_consumo) as ultima_fecha')
                ])
                ->groupBy('faenas.id_faena', 'faenas.ubicacion', 'faenas.detalle')
                ->orderBy('consumos_count', 'desc')
                ->get();

            if ($faenasUsadasEnPeriodo->count() === 1) {
                // ✅ Solo operó en UNA faena durante el período
                $faena = $faenasUsadasEnPeriodo->first();
                return [
                    'id' => $faena->id_faena,
                    'nombre' => $faena->ubicacion,
                    'detalle' => $faena->detalle ?? null,
                    'consumos_en_periodo' => $faena->consumos_count,
                    'periodo_operacion' => [
                        'desde' => $faena->primera_fecha,
                        'hasta' => $faena->ultima_fecha
                    ],
                    'origen' => 'faena_unica_en_periodo'
                ];
            } elseif ($faenasUsadasEnPeriodo->count() > 1) {
                // ✅ Operó en MÚLTIPLES faenas durante el período
                $faenaPrincipal = $faenasUsadasEnPeriodo->first(); // La que más consumos tiene

                return [
                    'id' => $faenaPrincipal->id_faena,
                    'nombre' => $faenaPrincipal->ubicacion . ' (Principal)',
                    'detalle' => "Operó en {$faenasUsadasEnPeriodo->count()} faenas en período",
                    'consumos_en_periodo' => $faenaPrincipal->consumos_count,
                    'faenas_usadas_en_periodo' => $faenasUsadasEnPeriodo->map(function ($f) {
                        return [
                            'id' => $f->id_faena,
                            'nombre' => $f->ubicacion,
                            'consumos' => $f->consumos_count,
                            'desde' => $f->primera_fecha,
                            'hasta' => $f->ultima_fecha
                        ];
                    })->toArray(),
                    'origen' => 'multiple_faenas_en_periodo'
                ];
            }
            // Si no hay consumos en el período, continuar con lógica de permisos
        }
        // Si no se especificó faena, buscar en qué faenas puede operar esta máquina
        $faenasMaquina = DB::table('permisos_maquinas_faenas')
            ->join('faenas', 'permisos_maquinas_faenas.id_faena', '=', 'faenas.id_faena')
            ->where('permisos_maquinas_faenas.id_maquina', $idMaquina)
            ->select([
                'faenas.id_faena',
                'faenas.ubicacion',
                'faenas.detalle'
            ])
            ->get();

        if ($faenasMaquina->count() === 1) {
            // Si solo tiene permisos para una faena
            $faena = $faenasMaquina->first();
            return [
                'id' => $faena->id_faena,
                'nombre' => $faena->ubicacion,
                'detalle' => $faena->detalle ?? null,
                'origen' => 'faena_unica_permisos'
            ];
        } elseif ($faenasMaquina->count() > 1) {
            // Si tiene permisos para múltiples faenas
            return [
                'id' => null,
                'nombre' => 'Múltiples faenas (sin datos período)',
                'detalle' => 'Tiene permisos para ' . $faenasMaquina->count() . ' faenas, pero sin consumos en período',
                'faenas_disponibles' => $faenasMaquina->map(function ($f) {
                    return [
                        'id' => $f->id_faena,
                        'nombre' => $f->ubicacion
                    ];
                })->toArray(),
                'origen' => 'multiple_faenas_permisos'
            ];
        } else {
            // Si no tiene permisos asignados
            return [
                'id' => null,
                'nombre' => 'Sin faena asignada',
                'detalle' => 'No tiene permisos de faena configurados',
                'origen' => 'sin_permisos'
            ];
        }
    }

    // CORREGIR todos los métodos que usan calcularDiasLaboralesCorrectos para incluir parámetros

    private function analizarMaquina($idMaquina, $fechaInicio, $fechaFin, $categoria, $incluirSimulacion, $incluirSabados, $incluirDomingos, $momentoConsulta, $idFaena = null)
    {

        // ✅ AQUÍ ESTÁ EL CAMBIO CRÍTICO
        $query = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);
        // ✅ FILTRO POR FAENA - ESTO DEBE ESTAR PRESENTE
        if ($idFaena) {
            $query->where('id_faena', $idFaena);
        }

        $cargas = $query->orderBy('fecha_consumo')->get();
        if ($cargas->isEmpty()) {
            return [
                'consumos_confirmados' => [],
                'simulacion' => null,
                'total_confirmado' => 0,
                'ajuste_consulta' => 'sin_datos'
            ];
        }

        $consumosConfirmados = [];
        $totalConfirmado = 0;

        // Procesar consumos confirmados (excluyendo última carga según regla de Nicodemo)
        for ($i = 0; $i < count($cargas) - 1; $i++) {
            $cargaActual = $cargas[$i];
            $cargaSiguiente = $cargas[$i + 1];

            $consumoConfirmado = [
                'id_maquina' => $idMaquina,
                'fecha_inicio' => $cargaActual->fecha_consumo,
                'fecha_fin' => $cargaSiguiente->fecha_consumo,
                'litros_confirmados' => (float) $cargaActual->litros_consumidos,
                'confirmado_por' => 'carga_posterior_' . $cargaSiguiente->id_consumo,
                'tipo' => 'CONFIRMADO'
            ];

            $consumosConfirmados[] = $consumoConfirmado;
            $totalConfirmado += $cargaActual->litros_consumidos;
        }

        $simulacion = null;
        $ajusteConsulta = null;

        if ($incluirSimulacion && count($cargas) > 0) {
            $ultimaCarga = $cargas->last();
            $fechaUltimaCarga = Carbon::parse($ultimaCarga->fecha_consumo);

            if ($fechaUltimaCarga->lt($fechaFin)) {
                // APLICAR REGLA DE NICODEMO: Limitar simulación por stock de última carga
                $simulacion = $this->simularConsumoUltimaCarga(
                    $ultimaCarga,
                    $fechaFin,
                    $categoria,
                    $incluirSabados,
                    $incluirDomingos,
                    $momentoConsulta // NUEVO: Considerar momento de consulta
                );

                $ajusteConsulta = [
                    'ultima_carga_fecha' => $fechaUltimaCarga->format('Y-m-d H:i:s'),
                    'stock_ultima_carga' => $ultimaCarga->litros_consumidos,
                    'simulacion_limitada_por_stock' => $simulacion['limitado_por_stock'] ?? false,
                    'momento_consulta_aplicado' => $momentoConsulta->format('Y-m-d H:i:s')
                ];
            }
        }

        return [
            'consumos_confirmados' => $consumosConfirmados,
            'simulacion' => $simulacion,
            'total_confirmado' => $totalConfirmado,
            'ajuste_consulta' => $ajusteConsulta
        ];
    }

    /**
     * NUEVO: Ajustar fecha fin según consulta
     */
    private function ajustarFechaFinSegunConsulta($fechaFin, $momentoConsulta, $incluirSabados, $incluirDomingos)
    {
        // Si la fecha fin es el día actual o futuro, aplicar lógica de horario
        if ($fechaFin->isToday() || $fechaFin->isFuture()) {
            $horaConsulta = $momentoConsulta->hour;
            $esDiaLaboral = $this->esDiaLaboral($momentoConsulta, $incluirSabados, $incluirDomingos);

            if ($esDiaLaboral) {
                if ($horaConsulta < self::HORA_INICIO_LABORAL) {
                    // Antes del horario laboral: excluir día actual
                    return $momentoConsulta->copy()->subDay()->setTime(self::HORA_FIN_LABORAL, 0, 0);
                } elseif ($horaConsulta >= self::HORA_FIN_LABORAL) {
                    // Después del horario laboral: incluir día completo
                    return $momentoConsulta->copy()->setTime(self::HORA_FIN_LABORAL, 0, 0);
                } else {
                    // Durante horario laboral: hasta la hora actual
                    return $momentoConsulta->copy();
                }
            } else {
                // Día no laboral: ir al último día laboral
                $ultimoDiaLaboral = $this->obtenerUltimoDiaLaboral($momentoConsulta, $incluirSabados, $incluirDomingos);
                return $ultimoDiaLaboral->setTime(self::HORA_FIN_LABORAL, 0, 0);
            }
        }

        return $fechaFin;
    }

    /**
     * CORREGIDO: Simular consumo con momento de consulta y límite de stock
     */
    private function simularConsumoUltimaCarga($ultimaCarga, $fechaFin, $categoria, $incluirSabados, $incluirDomingos, $momentoConsulta)
    {
        $fechaUltimaCarga = Carbon::parse($ultimaCarga->fecha_consumo);
        $stockInicial = (float) $ultimaCarga->litros_consumidos;

        $chc = (float) ($categoria->chc ?? 10.0);
        $hrc = (float) ($categoria->hrc ?? 7.0);

        // ✅ PASO 1: Verificar si hay tiempo real para simular
        if ($fechaUltimaCarga >= $fechaFin) {
            return null; // No hay nada que simular
        }

        // ✅ PASO 2: Calcular tiempo real entre carga y fin de período
        $tiempoRealHoras = $this->calcularHorasLaboralesEntreCargas($fechaUltimaCarga, $fechaFin, $incluirSabados, $incluirDomingos);

        if ($tiempoRealHoras <= 0) {
            return null; // No hay horas laborales entre las fechas
        }

        // ✅ PASO 3: Convertir a horas efectivas
        $factorConversion = $hrc / self::HORAS_LABORALES_DIA; // 7/10 = 0.7
        $horasEfectivas = $tiempoRealHoras * $factorConversion;

        // ✅ PASO 4: Calcular consumo basado en horas reales
        $consumoTeorico = $chc * $horasEfectivas;
        $consumoReal = min($consumoTeorico, $stockInicial);
        $limitadoPorStock = $consumoReal < $consumoTeorico;

        // ✅ PASO 5: Calcular días equivalentes para reporte
        $diasEquivalentes = $tiempoRealHoras / self::HORAS_LABORALES_DIA;

        return [
            'id_maquina' => $ultimaCarga->id_equipo,
            'fecha_inicio' => $ultimaCarga->fecha_consumo,
            'fecha_fin' => $fechaFin->format('Y-m-d H:i:s'),
            'stock_inicial' => $stockInicial,
            'dias_simulados' => round($diasEquivalentes, 2), // ✅ Días equivalentes reales
            'horas_simuladas' => round($tiempoRealHoras, 2), // ✅ Horas reales
            'horas_efectivas' => round($horasEfectivas, 2), // ✅ Horas con factor conversión
            'consumo_teorico' => round($consumoTeorico, 2),
            'litros_simulados' => round($consumoReal, 2),
            'limitado_por_stock' => $limitadoPorStock,
            'parametros_usados' => [
                'chc' => $chc,
                'hrc' => $hrc,
                'factor_conversion' => round($factorConversion, 3),
                'consumo_diario' => $chc * $hrc,
                'incluye_sabados' => $incluirSabados,
                'incluye_domingos' => $incluirDomingos
            ],
            'calculo_detallado' => [
                'tiempo_real_horas' => round($tiempoRealHoras, 2),
                'factor_conversion' => round($factorConversion, 3),
                'horas_efectivas' => round($horasEfectivas, 2),
                'formula' => "CHC {$chc} L/h × {$horasEfectivas} h efectivas = {$consumoTeorico} L"
            ],
            'tipo' => 'SIMULADO_TIEMPO_REAL'
        ];
    }
    /**
     * ✅ NUEVO: Método para calcular horas laborales reales entre dos cargas
     */
    private function calcularHorasLaboralesEntreCargas($fechaInicio, $fechaFin, $incluirSabados = true, $incluirDomingos = false)
    {
        // Si las fechas son el mismo día
        if ($fechaInicio->isSameDay($fechaFin)) {
            return $this->calcularHorasLaboralesMismoDia($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos);
        }

        // Si abarcan múltiples días (caso raro para cargas)
        $horasTotal = 0;
        $fechaActual = $fechaInicio->copy();

        while ($fechaActual->lte($fechaFin)) {
            if ($this->esDiaLaboral($fechaActual, $incluirSabados, $incluirDomingos)) {
                if ($fechaActual->isSameDay($fechaInicio)) {
                    // Primer día: desde la hora de inicio hasta fin del día laboral
                    $horaInicio = max($fechaActual->hour + ($fechaActual->minute / 60), self::HORA_INICIO_LABORAL);
                    $horaFin = self::HORA_FIN_LABORAL;
                    $horasTotal += max(0, $horaFin - $horaInicio);
                } elseif ($fechaActual->isSameDay($fechaFin)) {
                    // Último día: desde inicio del día laboral hasta la hora fin
                    $horaInicio = self::HORA_INICIO_LABORAL;
                    $horaFin = min($fechaFin->hour + ($fechaFin->minute / 60), self::HORA_FIN_LABORAL);
                    $horasTotal += max(0, $horaFin - $horaInicio);
                } else {
                    // Días completos intermedios
                    $horasTotal += self::HORAS_LABORALES_DIA;
                }
            }
            $fechaActual->addDay()->startOfDay();
        }

        return $horasTotal;
    }
    /**
     * ✅ NUEVO: Calcular horas laborales en el mismo día
     */
    private function calcularHorasLaboralesMismoDia($fechaInicio, $fechaFin, $incluirSabados = true, $incluirDomingos = false)
    {
        // Verificar si es día laboral
        if (!$this->esDiaLaboral($fechaInicio, $incluirSabados, $incluirDomingos)) {
            return 0;
        }

        // Convertir a horas decimales
        $horaInicio = $fechaInicio->hour + ($fechaInicio->minute / 60);
        $horaFin = $fechaFin->hour + ($fechaFin->minute / 60);

        // Ajustar al horario laboral
        $horaInicioLaboral = max($horaInicio, self::HORA_INICIO_LABORAL);
        $horaFinLaboral = min($horaFin, self::HORA_FIN_LABORAL);

        // Calcular diferencia
        $horasLaborales = max(0, $horaFinLaboral - $horaInicioLaboral);

        return $horasLaborales;
    }
    /**
     * ✅ NUEVO: Calcular horas laborales reales entre dos fechas
     */
    private function calcularHorasLaboralesReales($fechaInicio, $fechaFin, $incluirSabados = true, $incluirDomingos = false)
    {
        $horasLaborales = 0;
        $fechaActual = $fechaInicio->copy();

        while ($fechaActual < $fechaFin) {
            $esDiaLaboral = $this->esDiaLaboral($fechaActual, $incluirSabados, $incluirDomingos);

            if ($esDiaLaboral) {
                // Determinar hora inicio y fin para este día
                $horaInicioDelDia = max($fechaActual->hour, self::HORA_INICIO_LABORAL);

                // Si es el último día, usar la hora fin del período
                if ($fechaActual->isSameDay($fechaFin)) {
                    $horaFinDelDia = min($fechaFin->hour, self::HORA_FIN_LABORAL);
                } else {
                    $horaFinDelDia = self::HORA_FIN_LABORAL;
                }

                // Calcular horas laborales de este día
                if ($horaFinDelDia > $horaInicioDelDia) {
                    $horasEsteDia = $horaFinDelDia - $horaInicioDelDia;

                    // Considerar minutos si es necesario
                    if ($fechaActual->isSameDay($fechaInicio)) {
                        $minutosInicio = $fechaInicio->minute;
                        $horasEsteDia -= ($minutosInicio / 60);
                    }

                    if ($fechaActual->isSameDay($fechaFin)) {
                        $minutosFin = $fechaFin->minute;
                        $horasEsteDia += ($minutosFin / 60) - ($fechaFin->hour);
                        $horasEsteDia += $fechaFin->hour - $horaInicioDelDia;
                    }

                    $horasLaborales += max(0, $horasEsteDia);
                }
            }

            $fechaActual->addDay()->startOfDay();
        }

        return $horasLaborales;
    }
    /**
     * ✅ CORREGIDO: Formatear simulación con datos correctos
     */
    private function formatearSimulacionSimple($simulacion, $incluirSabados = true, $incluirDomingos = false)
    {
        if (empty($simulacion)) {
            return null;
        }

        $fechaInicio = Carbon::parse($simulacion['fecha_inicio']);
        $fechaFin = Carbon::parse($simulacion['fecha_fin']);

        // ✅ Usar valores corregidos de la simulación
        $diasSimulados = $simulacion['dias_simulados'] ?? 0;
        $horasSimuladas = $simulacion['horas_simuladas'] ?? 0;
        $horasEfectivas = $simulacion['horas_efectivas'] ?? 0;

        // ✅ Calcular días calendario reales
        $diasCalendario = $fechaInicio->diffInHours($fechaFin) / 24;

        return [
            'periodo' => [
                'fecha_inicio' => $fechaInicio->format('d/m/Y H:i'),
                'fecha_fin' => $fechaFin->format('d/m/Y H:i'),
                'dias_calendario' => round($diasCalendario, 2), // ✅ Días reales
                'dias_laborales_simulados' => round($diasSimulados, 2), // ✅ Días equivalentes
                'horas_laborales_simuladas' => round($horasSimuladas, 2), // ✅ Horas reales
                'horas_efectivas_simuladas' => round($horasEfectivas, 2), // ✅ Horas con conversión
                'horario_operacion' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00',
                'tipo' => 'Proyección basada en tiempo real transcurrido',
                'configuracion_laboral' => [
                    'incluye_sabados' => $incluirSabados,
                    'incluye_domingos' => $incluirDomingos,
                    'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
                ]
            ],
            'stock' => [
                'inicial_litros' => round($simulacion['stock_inicial'], 2),
                'disponible_para_consumo' => round($simulacion['stock_inicial'], 2),
                'autonomia_horas_reales' => $simulacion['parametros_usados']['chc'] > 0
                    ? round($simulacion['stock_inicial'] / $simulacion['parametros_usados']['chc'], 1)
                    : 0,
                'origen_stock' => 'Última carga registrada (Regla Nicodemo)'
            ],
            'calculo' => [
                'consumo_teorico_sin_limite' => round($simulacion['consumo_teorico'], 2),
                'consumo_proyectado_real' => round($simulacion['litros_simulados'], 2),
                'limitado_por_stock' => $simulacion['limitado_por_stock'],
                'parametros_usados' => $simulacion['parametros_usados'],
                'formula_aplicada' => $simulacion['calculo_detallado']['formula'] ?? 'N/A',
                'limite_aplicado' => $simulacion['limitado_por_stock']
                    ? 'Reducido a ' . round($simulacion['litros_simulados'], 2) . 'L por stock disponible'
                    : 'Sin límite de stock aplicado'
            ],
            'precision_temporal' => [
                'metodo' => 'Cálculo basado en tiempo real transcurrido',
                'tiempo_real_horas' => $simulacion['calculo_detallado']['tiempo_real_horas'] ?? 0,
                'factor_conversion_aplicado' => $simulacion['parametros_usados']['factor_conversion'] ?? 0.7,
                'horas_cronologicas_vs_efectivas' => [
                    'cronologicas' => round($horasSimuladas, 2),
                    'efectivas' => round($horasEfectivas, 2),
                    'diferencia' => round($horasSimuladas - $horasEfectivas, 2)
                ],
                'beneficio' => 'Precisión máxima: considera tiempo exacto transcurrido entre cargas'
            ],
            'confiabilidad' => [
                'nivel' => 'Muy Alta',
                'razon' => 'Basado en tiempo real transcurrido entre cargas',
                'porcentaje_estimado' => '95%',
                'consideraciones' => [
                    'Cálculo basado en tiempo real transcurrido: ' . round($horasSimuladas, 2) . ' horas',
                    'Factor de conversión aplicado: ' . round($simulacion['parametros_usados']['factor_conversion'] ?? 0.7, 2),
                    'Horario operacional: ' . self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00',
                    $simulacion['limitado_por_stock']
                        ? 'Stock insuficiente para el período completo'
                        : 'Stock suficiente para el período proyectado'
                ]
            ]
        ];
    }
    /**
     * ✅ AGREGAR: Método para ajustar fecha fin automáticamente
     */
    private function ajustarFechaFinInteligente($fechaFin, $momentoConsulta)
    {
        $fechaFinAjustada = Carbon::parse($fechaFin);
        $hoy = $momentoConsulta->copy();

        // Si la fecha fin NO tiene hora específica (es solo fecha)
        $tieneHoraEspecifica = $fechaFin instanceof Carbon
            ? ($fechaFin->hour !== 0 || $fechaFin->minute !== 0)
            : (strpos($fechaFin, ':') !== false);

        if (!$tieneHoraEspecifica) {
            // ✅ CASO 1: Fecha sin hora específica

            if ($fechaFinAjustada->isSameDay($hoy)) {
                // ✅ ES HOY: Usar hora actual o fin laboral (el menor)
                $horaActual = $hoy->hour + ($hoy->minute / 60);
                $horaFinal = min($horaActual, self::HORA_FIN_LABORAL);
                $fechaFinAjustada = $fechaFinAjustada->setTime(
                    floor($horaFinal),
                    ($horaFinal - floor($horaFinal)) * 60
                );

                $razon = "Fecha fin es hoy - ajustado a hora actual: " . $fechaFinAjustada->format('H:i');
            } else {
                // ✅ NO ES HOY: Usar fin del horario laboral
                $fechaFinAjustada = $fechaFinAjustada->setTime(self::HORA_FIN_LABORAL, 0, 0);
                $razon = "Fecha fin no es hoy - ajustado a fin horario laboral: " . self::HORA_FIN_LABORAL . ":00";
            }
        } else {
            // ✅ CASO 2: Fecha con hora específica - respetar la hora
            $razon = "Fecha fin con hora específica - respetada tal como está";
        }

        return [
            'fecha_original' => $fechaFin,
            'fecha_ajustada' => $fechaFinAjustada,
            'fue_ajustada' => !$tieneHoraEspecifica,
            'razon' => $razon,
            'es_dia_actual' => $fechaFinAjustada->isSameDay($hoy),
            'hora_final' => $fechaFinAjustada->format('H:i')
        ];
    }
    /**
     * NUEVO: Calcular consumo hasta el momento de una carga
     */
    private function calcularConsumoHastaCarga($fechaCarga, $categoria, $incluirSabados, $incluirDomingos)
    {
        $esDiaLaboral = $this->esDiaLaboral($fechaCarga, $incluirSabados, $incluirDomingos);

        if (!$esDiaLaboral) {
            return [
                'es_dia_laboral' => false,
                'horas_trabajadas' => 0,
                'horas_efectivas' => 0,
                'consumo_teorico' => 0,
                'descripcion' => 'Carga en día no laboral - sin consumo previo'
            ];
        }

        $horaCarga = $fechaCarga->hour;
        $minutoCarga = $fechaCarga->minute;
        $chc = (float) ($categoria->chc ?? 10.0);
        $hrc = (float) ($categoria->hrc ?? 7.0);

        // Factor de conversión
        $horasCronologicasDia = self::HORAS_LABORALES_DIA;
        $horasEfectivasDia = $hrc;
        $factorConversion = $horasEfectivasDia / $horasCronologicasDia;

        if ($horaCarga <= self::HORA_INICIO_LABORAL) {
            return [
                'es_dia_laboral' => true,
                'horas_trabajadas' => 0,
                'horas_efectivas' => 0,
                'consumo_teorico' => 0,
                'descripcion' => "Carga a las {$fechaCarga->format('H:i')} - antes/inicio del horario laboral"
            ];
        }

        if ($horaCarga >= self::HORA_FIN_LABORAL) {
            // Día completo de trabajo antes de la carga
            $horasTrabajadasCronologicas = $horasCronologicasDia;
            $horasEfectivas = $horasEfectivasDia;
            $descripcion = "Carga a las {$fechaCarga->format('H:i')} - día laboral completo trabajado";
        } else {
            // Cálculo parcial hasta la hora de la carga
            $tiempoInicioLaboral = self::HORA_INICIO_LABORAL * 60;
            $tiempoCarga = ($horaCarga * 60) + $minutoCarga;
            $minutosTrabajadasCronologicas = $tiempoCarga - $tiempoInicioLaboral;
            $horasTrabajadasCronologicas = $minutosTrabajadasCronologicas / 60;

            // Conversión a horas efectivas
            $horasEfectivas = $horasTrabajadasCronologicas * $factorConversion;

            $descripcion = "Carga a las {$fechaCarga->format('H:i')} - " .
                round($horasTrabajadasCronologicas, 1) . " horas cronológicas (" .
                round($horasEfectivas, 1) . " horas efectivas) trabajadas desde las " . self::HORA_INICIO_LABORAL . ":00";
        }

        $consumoTeorico = $chc * $horasEfectivas;

        return [
            'es_dia_laboral' => true,
            'hora_inicio_laboral' => self::HORA_INICIO_LABORAL . ':00',
            'hora_carga' => $fechaCarga->format('H:i'),
            'horas_trabajadas' => round($horasTrabajadasCronologicas, 2),
            'horas_efectivas' => round($horasEfectivas, 2),
            'factor_conversion' => round($factorConversion, 3),
            'consumo_teorico' => round($consumoTeorico, 2),
            'chc_aplicado' => $chc,
            'descripcion' => $descripcion,
            'calculo_detalle' => "CHC {$chc} L/h × " . round($horasEfectivas, 2) . "h efectivas = " . round($consumoTeorico, 2) . "L"
        ];
    }
    /**
     * NUEVO: Calcular proyección hasta la carga
     */
    private function calcularProyeccionHastaCarga($fechaUltimaCarga, $ultimaCarga, $stockDisponible, $categoria, $incluirSabados, $incluirDomingos)
    {
        // Encontrar carga anterior
        $cargaAnterior = DB::table('consumos')
            ->where('id_equipo', $ultimaCarga->id_equipo)
            ->where('fecha_consumo', '<', $fechaUltimaCarga)
            ->orderBy('fecha_consumo', 'desc')
            ->first();

        if (!$cargaAnterior) {
            return [[
                'fecha' => $fechaUltimaCarga->format('d/m/Y'),
                'dia_semana' => $fechaUltimaCarga->locale('es')->dayName,
                'stock_inicio_dia' => 0,
                'consumo_proyectado' => 0,
                'stock_fin_dia' => 0,
                'operativo' => false,
                'nota' => 'No hay datos de carga anterior'
            ]];
        }

        $fechaCargaAnterior = Carbon::parse($cargaAnterior->fecha_consumo);
        $stockInicial = (float) $cargaAnterior->litros_consumidos;

        return $this->calcularProyeccionDiariaConPrecisionHoraria(
            $fechaCargaAnterior,
            $fechaUltimaCarga,
            $stockInicial,
            $categoria,
            $incluirSabados,
            $incluirDomingos,
            null
        );
    }
    /**
     * NUEVO: Calcular consumo hasta la última carga
     */
    private function calcularConsumoHastaUltimaCarga($fechaUltimaCarga, $ultimaCarga, $categoria, $incluirSabados, $incluirDomingos)
    {
        // Encontrar la carga anterior para determinar desde cuándo simular
        $cargaAnterior = DB::table('consumos')
            ->where('id_equipo', $ultimaCarga->id_equipo)
            ->where('fecha_consumo', '<', $fechaUltimaCarga)
            ->orderBy('fecha_consumo', 'desc')
            ->first();

        if (!$cargaAnterior) {
            return [
                'consumo_teorico' => 0,
                'descripcion' => 'No hay carga anterior para calcular el período'
            ];
        }

        $fechaCargaAnterior = Carbon::parse($cargaAnterior->fecha_consumo);
        $stockCargaAnterior = (float) $cargaAnterior->litros_consumidos;

        // Calcular días laborales entre las dos cargas
        $diasLaborales = $this->calcularDiasLaboralesCorrectos(
            $fechaCargaAnterior,
            $fechaUltimaCarga,
            $incluirSabados,
            $incluirDomingos
        );

        $chc = (float) ($categoria->chc ?? 10.0);
        $hrc = (float) ($categoria->hrc ?? 7.0);
        $consumoDiario = $chc * $hrc;

        // Calcular consumo teórico del período
        $consumoTeorico = $consumoDiario * $diasLaborales;

        // El consumo real está limitado por el stock de la carga anterior
        $consumoReal = min($consumoTeorico, $stockCargaAnterior);

        return [
            'fecha_inicio' => $fechaCargaAnterior->format('Y-m-d H:i:s'),
            'fecha_fin' => $fechaUltimaCarga->format('Y-m-d H:i:s'),
            'stock_inicial' => $stockCargaAnterior,
            'dias_laborales' => $diasLaborales,
            'consumo_teorico' => $consumoTeorico,
            'consumo_real' => $consumoReal,
            'limitado_por_stock' => $consumoReal < $consumoTeorico,
            'descripcion' => "Consumo desde carga anterior hasta carga actual"
        ];
    }
    /**
     * 3. REEMPLAZAR el método calcularProyeccionDiaria existente
     */
    private function calcularProyeccionDiariaConPrecisionHoraria($fechaInicio, $fechaFin, $stockInicial, $categoria, $incluirSabados = true, $incluirDomingos = false, $consumoPrimerDia = null)
    {
        $proyeccion = [];
        $stockActual = $stockInicial;
        $fecha = $fechaInicio->copy();
        $chc = (float) ($categoria->chc ?? 10.0);
        $hrc = (float) ($categoria->hrc ?? 7.0);
        $consumoDiarioCompleto = $chc * $hrc;
        $esPrimerDia = true;

        // ===== CORREGIDO: Incluir el último día en el bucle =====
        // Cambio: while ($fecha <= $fechaFin && $stockActual > 0) por while ($fecha <= $fechaFin)
        // Y manejo separado del stock agotado
        while ($fecha <= $fechaFin) {
            $esLaboral = $this->esDiaLaboral($fecha, $incluirSabados, $incluirDomingos);

            if ($esLaboral) {
                $stockAnterior = $stockActual;
                $esUltimoDia = $fecha->isSameDay($fechaFin);

                // ===== VERIFICAR SI HAY STOCK DISPONIBLE =====
                if ($stockActual <= 0) {
                    // Sin stock pero seguir registrando días para completar el período
                    $proyeccion[] = $this->crearProyeccionDiaSinStock($fecha, $incluirSabados, $incluirDomingos);
                    $fecha->addDay();
                    $esPrimerDia = false;
                    continue;
                }

                // ===== LÓGICA MEJORADA: PRIMER DÍA =====
                if ($esPrimerDia && $consumoPrimerDia && $consumoPrimerDia['es_dia_laboral'] && $consumoPrimerDia['horas_restantes'] > 0) {
                    $consumoDelDia = min($consumoPrimerDia['consumo_teorico'], $stockActual);
                    $proyeccionDia = $this->crearProyeccionDiaParcial($fecha, $stockAnterior, $stockActual, $consumoDelDia, $consumoPrimerDia, $chc, true, $incluirSabados, $incluirDomingos);

                    $stockActual -= $consumoDelDia;
                    $proyeccion[] = $proyeccionDia;

                    // ===== CORREGIDO: ÚLTIMO DÍA CON VERIFICACIÓN DE FECHA ACTUAL =====
                } elseif ($esUltimoDia) {
                    $ahora = now('America/Santiago');
                    $esFechaActual = $fecha->isSameDay($ahora);

                    if ($esFechaActual && $this->requierePrecisionHorariaFinal($fechaFin)) {
                        // Es el día actual y tiene hora específica - aplicar precisión horaria
                        $consumoUltimoDia = $this->calcularConsumoUltimoDiaConPrecision($fechaFin, $categoria, $stockActual, $incluirSabados, $incluirDomingos);

                        $consumoDelDia = min($consumoUltimoDia['consumo_teorico'], $stockActual);
                        $proyeccionDia = $this->crearProyeccionDiaParcial($fecha, $stockAnterior, $stockActual, $consumoDelDia, $consumoUltimoDia, $chc, false, $incluirSabados, $incluirDomingos);
                    } else {
                        // ===== NUEVO: No es día actual O es medianoche - día completo =====
                        $consumoDelDia = min($consumoDiarioCompleto, $stockActual);
                        $proyeccionDia = $this->crearProyeccionDiaCompleto($fecha, $stockAnterior, $stockActual, $consumoDelDia, $chc, $hrc, $consumoDiarioCompleto, $incluirSabados, $incluirDomingos);
                    }

                    $stockActual -= $consumoDelDia;
                    $proyeccion[] = $proyeccionDia;

                    // ===== AGREGAR INFORMACIÓN DE AUTONOMÍA RESTANTE SOLO SI NO HAY MÁS DÍAS =====
                    // CORREGIDO: No agregar autonomía si es el último día del rango
                    // La autonomía se calculará automáticamente después del bucle principal
                } else {
                    // Días completos normales
                    $consumoDelDia = min($consumoDiarioCompleto, $stockActual);
                    $proyeccionDia = $this->crearProyeccionDiaCompleto($fecha, $stockAnterior, $stockActual, $consumoDelDia, $chc, $hrc, $consumoDiarioCompleto, $incluirSabados, $incluirDomingos);

                    $stockActual -= $consumoDelDia;
                    $proyeccion[] = $proyeccionDia;
                }

                // ===== MARCAR ÚLTIMO DÍA OPERATIVO SI SE AGOTA STOCK =====
                if ($stockActual <= 0) {
                    $proyeccion[count($proyeccion) - 1]['nota'] = 'Último día operativo - se agota combustible en tanque';
                    $proyeccion[count($proyeccion) - 1]['stock_fin_dia'] = 0;
                }
            } else {
                // Día no laboral
                $proyeccion[] = $this->crearProyeccionDiaNoLaboral($fecha, $stockActual, $incluirSabados, $incluirDomingos);
            }

            $fecha->addDay();
            $esPrimerDia = false;
        }

        return $proyeccion;
    }
    /**
     * NUEVO: Crear proyección para día sin stock
     */
    private function crearProyeccionDiaSinStock($fecha, $incluirSabados, $incluirDomingos)
    {
        return [
            'fecha' => $fecha->format('d/m/Y'),
            'dia_semana' => $fecha->locale('es')->dayName,
            'stock_inicio_dia' => 0,
            'consumo_proyectado' => 0,
            'stock_fin_dia' => 0,
            'operativo' => false,
            'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
            'limitado_por_stock' => true,
            'precision_horaria' => [
                'es_dia_parcial' => false,
                'descripcion' => 'Sin combustible disponible'
            ],
            'nota' => 'Sin combustible - máquina inoperativa'
        ];
    }

    /**
     * MEJORADO: Crear proyección para día no laboral
     */
    private function crearProyeccionDiaNoLaboral($fecha, $stockActual, $incluirSabados, $incluirDomingos)
    {
        return [
            'fecha' => $fecha->format('d/m/Y'),
            'dia_semana' => $fecha->locale('es')->dayName,
            'stock_inicio_dia' => round($stockActual, 2),
            'consumo_proyectado' => 0,
            'stock_fin_dia' => round($stockActual, 2),
            'operativo' => false,
            'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
            'precision_horaria' => [
                'es_dia_parcial' => false,
                'descripcion' => 'Día no laboral - sin consumo proyectado'
            ],
            'nota' => 'No operativo - día no laboral'
        ];
    }
    /**
     * MEJORADO: Crear proyección para día completo 
     */
    private function crearProyeccionDiaCompleto($fecha, $stockAnterior, $stockActual, $consumoDelDia, $chc, $hrc, $consumoDiarioCompleto, $incluirSabados, $incluirDomingos)
    {
        return [
            'fecha' => $fecha->format('d/m/Y'),
            'dia_semana' => $fecha->locale('es')->dayName,
            'stock_inicio_dia' => round($stockAnterior, 2),
            'consumo_proyectado' => round($consumoDelDia, 2),
            'stock_fin_dia' => round($stockActual - $consumoDelDia, 2),
            'operativo' => true,
            'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
            'limitado_por_stock' => $consumoDelDia < $consumoDiarioCompleto,
            'precision_horaria' => [
                'es_dia_parcial' => false,
                'hora_inicio_consumo' => self::HORA_INICIO_LABORAL . ':00',
                'hora_fin_consumo' => self::HORA_FIN_LABORAL . ':00',
                'horas_consumidas' => $hrc,
                'consumo_por_hora' => $chc,
                'calculo' => "{$chc}L/h × {$hrc}h = " . round($consumoDelDia, 2) . "L",
                'descripcion' => 'Día laboral completo según parámetros estándar'
            ]
        ];
    }
    /**
     * NUEVO: Crear proyección para día parcial (primer o último día)
     */
    private function crearProyeccionDiaParcial($fecha, $stockAnterior, $stockActual, $consumoDelDia, $infoDia, $chc, $esPrimerDia, $incluirSabados, $incluirDomingos)
    {
        $tipoDescripcion = $esPrimerDia ? 'inicial' : 'final';
        $rangoHoras = $esPrimerDia
            ? "desde {$infoDia['hora_ultima_carga']} hasta {$infoDia['hora_fin_laboral']}"
            : "desde {$infoDia['hora_inicio_laboral']} hasta {$infoDia['hora_consulta']}";

        return [
            'fecha' => $fecha->format('d/m/Y'),
            'dia_semana' => $fecha->locale('es')->dayName,
            'stock_inicio_dia' => round($stockAnterior, 2),
            'consumo_proyectado' => round($consumoDelDia, 2),
            'stock_fin_dia' => round($stockActual - $consumoDelDia, 2),
            'operativo' => true,
            'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
            'limitado_por_stock' => $consumoDelDia < $infoDia['consumo_teorico'],
            'precision_horaria' => [
                'es_dia_parcial' => true,
                'tipo_dia_parcial' => $tipoDescripcion,
                'hora_inicio_consumo' => $esPrimerDia ? $infoDia['hora_ultima_carga'] : $infoDia['hora_inicio_laboral'],
                'hora_fin_consumo' => $esPrimerDia ? $infoDia['hora_fin_laboral'] : $infoDia['hora_consulta'],
                // ===== INFORMACIÓN DETALLADA DE CONVERSIÓN =====
                'horas_cronologicas' => $esPrimerDia ? $infoDia['horas_restantes'] : $infoDia['horas_trabajadas'],
                'horas_efectivas' => $infoDia['horas_efectivas'], // ✅ NUEVO
                'factor_conversion' => $infoDia['factor_conversion'] ?? null, // ✅ NUEVO
                'consumo_por_hora' => $chc,
                'calculo' => $infoDia['calculo_detalle'],
                'descripcion' => $infoDia['descripcion'],
                // ✅ NUEVO: Explicación de la conversión
                'conversion_explicada' => isset($infoDia['factor_conversion']) ?
                    "Conversión: " . round($infoDia['horas_restantes'] ?? $infoDia['horas_trabajadas'], 1) .
                    "h cronológicas × " . round($infoDia['factor_conversion'], 2) .
                    " = " . round($infoDia['horas_efectivas'], 1) . "h efectivas" : null
            ],
            'nota' => "Día parcial ({$tipoDescripcion}): consumo {$rangoHoras}"
        ];
    }
    /**
     * NUEVO: Calcular autonomía restante después del último consumo
     */
    private function calcularAutonomiaRestante($fechaUltimoConsumo, $stockRestante, $chc)
    {
        if ($stockRestante <= 0 || $chc <= 0) {
            return null;
        }

        $horasRestantes = $stockRestante / $chc;
        $minutosRestantes = $horasRestantes * 60;

        // Calcular hasta qué hora alcanza el combustible
        $horaUltimoConsumo = $fechaUltimoConsumo->hour;
        $minutoUltimoConsumo = $fechaUltimoConsumo->minute;

        $minutosDesdeMedianoche = ($horaUltimoConsumo * 60) + $minutoUltimoConsumo + $minutosRestantes;
        $horaFinal = floor($minutosDesdeMedianoche / 60);
        $minutoFinal = $minutosDesdeMedianoche % 60;

        // Manejar casos donde se pasa a otro día
        $fechaFinal = $fechaUltimoConsumo->copy();
        if ($horaFinal >= 24) {
            $fechaFinal->addDay();
            $horaFinal -= 24;
        }

        $horaFinalFormateada = sprintf('%02d:%02d', $horaFinal, $minutoFinal);

        return [
            'fecha' => $fechaFinal->format('d/m/Y'),
            'dia_semana' => $fechaFinal->locale('es')->dayName,
            'stock_inicio_autonomia' => round($stockRestante, 2),
            'consumo_proyectado' => 0,
            'stock_fin_dia' => round($stockRestante, 2),
            'operativo' => false,
            'tipo_dia' => 'Autonomía restante',
            'precision_horaria' => [
                'es_autonomia_restante' => true,
                'hora_ultimo_consumo' => $fechaUltimoConsumo->format('H:i'),
                'horas_autonomia' => round($horasRestantes, 2),
                'hora_agotamiento_estimado' => $horaFinalFormateada,
                'consumo_por_hora' => $chc,
                'calculo' => "Stock restante: {$stockRestante}L ÷ {$chc}L/h = " . round($horasRestantes, 1) . " horas",
                'descripcion' => "Con {$stockRestante}L restantes, la máquina funcionará hasta las {$horaFinalFormateada}"
            ],
            'nota' => "Autonomía restante: " . round($horasRestantes, 1) . " horas (hasta las {$horaFinalFormateada})"
        ];
    }
    /**
     * NUEVO: Calcular consumo del último día con precisión horaria
     */
    private function calcularConsumoUltimoDiaConPrecision($fechaFin, $categoria, $stockDisponible, $incluirSabados, $incluirDomingos)
    {
        $esDiaLaboral = $this->esDiaLaboral($fechaFin, $incluirSabados, $incluirDomingos);

        if (!$esDiaLaboral) {
            return [
                'es_dia_laboral' => false,
                'horas_trabajadas' => 0,
                'horas_efectivas' => 0,
                'consumo_teorico' => 0,
                'descripcion' => 'Último día no laboral - sin consumo'
            ];
        }

        $horaConsulta = $fechaFin->hour;
        $minutoConsulta = $fechaFin->minute;
        $chc = (float) ($categoria->chc ?? 10.0);
        $hrc = (float) ($categoria->hrc ?? 7.0);

        // ===== CALCULAR FACTOR DE CONVERSIÓN =====
        $horasCronologicasDia = self::HORAS_LABORALES_DIA;
        $horasEfectivasDia = $hrc;
        $factorConversion = $horasEfectivasDia / $horasCronologicasDia;

        if ($horaConsulta < self::HORA_INICIO_LABORAL) {
            return [
                'es_dia_laboral' => true,
                'horas_trabajadas' => 0,
                'horas_efectivas' => 0,
                'consumo_teorico' => 0,
                'descripcion' => "Consulta a las {$fechaFin->format('H:i')} - antes del horario laboral"
            ];
        }

        if ($horaConsulta >= self::HORA_FIN_LABORAL) {
            // Día completo
            $horasTrabajadasCronologicas = $horasCronologicasDia;
            $horasEfectivas = $horasEfectivasDia;
            $descripcion = "Consulta a las {$fechaFin->format('H:i')} - día laboral completo";
        } else {
            // ===== CÁLCULO PRECISO CON CONVERSIÓN =====
            $tiempoInicioLaboral = self::HORA_INICIO_LABORAL * 60;
            $tiempoConsulta = ($horaConsulta * 60) + $minutoConsulta;
            $minutosTrabajadasCronologicas = $tiempoConsulta - $tiempoInicioLaboral;
            $horasTrabajadasCronologicas = $minutosTrabajadasCronologicas / 60;

            // ===== CONVERSIÓN A HORAS EFECTIVAS =====
            $horasEfectivas = $horasTrabajadasCronologicas * $factorConversion;

            $descripcion = "Consulta a las {$fechaFin->format('H:i')} - " .
                round($horasTrabajadasCronologicas, 1) . " horas cronológicas (" .
                round($horasEfectivas, 1) . " horas efectivas) trabajadas desde las " . self::HORA_INICIO_LABORAL . ":00";
        }

        $consumoTeorico = $chc * $horasEfectivas; // ✅ Usar horas efectivas

        return [
            'es_dia_laboral' => true,
            'hora_inicio_laboral' => self::HORA_INICIO_LABORAL . ':00',
            'hora_consulta' => $fechaFin->format('H:i'),
            'horas_trabajadas' => round($horasTrabajadasCronologicas, 2), // Cronológicas para info
            'horas_efectivas' => round($horasEfectivas, 2), // ✅ NUEVO: Horas efectivas
            'factor_conversion' => round($factorConversion, 3), // ✅ NUEVO: Factor aplicado
            'consumo_teorico' => round($consumoTeorico, 2),
            'chc_aplicado' => $chc,
            'descripcion' => $descripcion,
            'calculo_detalle' => "CHC {$chc} L/h × " . round($horasEfectivas, 2) . "h efectivas = " . round($consumoTeorico, 2) . "L"
        ];
    }

    /**
     * NUEVO: Verificar si el día final requiere precisión horaria
     */
    private function requierePrecisionHorariaFinal($fechaFin)
    {
        $horaFin = $fechaFin->hour;
        $minutoFin = $fechaFin->minute;

        // Si la fecha fin tiene hora específica (no es medianoche), aplicar precisión
        // ===== CORREGIDO: También verificar que no sea las 00:00 del día siguiente =====
        return !($horaFin == 0 && $minutoFin == 0);
    }
    /**
     * 2. AGREGAR nuevo método para calcular consumo del primer día
     */
    private function calcularConsumoPrimerDiaConPrecisionHoraria($fechaUltimaCarga, $categoria, $incluirSabados, $incluirDomingos)
    {
        $esDiaLaboral = $this->esDiaLaboral($fechaUltimaCarga, $incluirSabados, $incluirDomingos);

        if (!$esDiaLaboral) {
            return [
                'es_dia_laboral' => false,
                'horas_restantes' => 0,
                'horas_efectivas' => 0,
                'consumo_teorico' => 0,
                'descripcion' => 'Última carga en día no laboral - no hay consumo pendiente'
            ];
        }

        $horaUltimaCarga = $fechaUltimaCarga->hour;
        $minutoUltimaCarga = $fechaUltimaCarga->minute;
        $chc = (float) ($categoria->chc ?? 10.0);
        $hrc = (float) ($categoria->hrc ?? 7.0); // Horas efectivas por día
        $horaFinLaboral = self::HORA_FIN_LABORAL; // 18:00

        // ===== CALCULAR FACTOR DE CONVERSIÓN =====
        $horasCronologicasDia = self::HORAS_LABORALES_DIA; // 10 horas (8:00-18:00)
        $horasEfectivasDia = $hrc; // 7 horas efectivas de trabajo
        $factorConversion = $horasEfectivasDia / $horasCronologicasDia; // 7/10 = 0.7

        if ($horaUltimaCarga >= $horaFinLaboral) {
            return [
                'es_dia_laboral' => true,
                'horas_restantes' => 0,
                'horas_efectivas' => 0,
                'consumo_teorico' => 0,
                'descripcion' => "Última carga a las {$fechaUltimaCarga->format('H:i')} - después del horario laboral"
            ];
        }

        if ($horaUltimaCarga < self::HORA_INICIO_LABORAL) {
            // Día completo
            $horasRestantesCronologicas = $horasCronologicasDia;
            $horasEfectivas = $horasEfectivasDia; // Usar directamente HRC
            $descripcion = "Última carga a las {$fechaUltimaCarga->format('H:i')} - día laboral completo pendiente";
        } else {
            // ===== CÁLCULO PRECISO CON CONVERSIÓN =====
            $tiempoUltimaCarga = ($horaUltimaCarga * 60) + $minutoUltimaCarga;
            $tiempoFinLaboral = $horaFinLaboral * 60;
            $minutosRestantesCronologicos = max(0, $tiempoFinLaboral - $tiempoUltimaCarga);
            $horasRestantesCronologicas = $minutosRestantesCronologicos / 60;

            // ===== CONVERSIÓN A HORAS EFECTIVAS =====
            $horasEfectivas = $horasRestantesCronologicas * $factorConversion;

            $descripcion = "Última carga a las {$fechaUltimaCarga->format('H:i')} - " .
                round($horasRestantesCronologicas, 1) . " horas cronológicas (" .
                round($horasEfectivas, 1) . " horas efectivas) restantes hasta las {$horaFinLaboral}:00";
        }

        $consumoTeorico = $chc * $horasEfectivas; // ✅ Usar horas efectivas

        return [
            'es_dia_laboral' => true,
            'hora_ultima_carga' => $fechaUltimaCarga->format('H:i'),
            'hora_fin_laboral' => "{$horaFinLaboral}:00",
            'horas_restantes' => round($horasRestantesCronologicas, 2), // Cronológicas para info
            'horas_efectivas' => round($horasEfectivas, 2), // ✅ NUEVO: Horas efectivas
            'factor_conversion' => round($factorConversion, 3), // ✅ NUEVO: Factor aplicado
            'consumo_teorico' => round($consumoTeorico, 2),
            'chc_aplicado' => $chc,
            'descripcion' => $descripcion,
            'calculo_detalle' => "CHC {$chc} L/h × " . round($horasEfectivas, 2) . "h efectivas = " . round($consumoTeorico, 2) . "L"
        ];
    }
    /**
     * NUEVO: Formatear simulación con información de horario
     */
    private function formatearSimulacion($simulacion, $incluirSabados = true, $incluirDomingos = false)
    {
        if (empty($simulacion)) {
            return null;
        }

        $fechaInicio = Carbon::parse($simulacion['fecha_inicio']);
        $fechaFin = Carbon::parse($simulacion['fecha_fin']);
        $diasLaboralesSimulados = $simulacion['dias_simulados'] ?? 0;

        // ===== NUEVO: Cálculo más preciso de horas considerando el primer día parcial =====
        $horasLaboralesSimuladas = $diasLaboralesSimulados * self::HORAS_LABORALES_DIA;
        if (isset($simulacion['primer_dia_parcial']) && $simulacion['primer_dia_parcial']['es_dia_laboral']) {
            $horasLaboralesSimuladas += $simulacion['primer_dia_parcial']['horas_restantes'];
        }

        $diasCalendario = $fechaInicio->diffInDays($fechaFin) + 1;

        return [
            'periodo' => [
                'fecha_inicio' => $fechaInicio->format('d/m/Y'),
                'fecha_fin' => $fechaFin->format('Y-m-d H:i:s'),
                'dias_calendario' => $diasCalendario,
                'dias_laborales_simulados' => $diasLaboralesSimulados,
                'horas_laborales_simuladas' => round($horasLaboralesSimuladas, 2), // ===== ACTUALIZADO =====
                'horario_operacion' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00',
                'tipo' => 'Proyección con precisión horaria + límite stock', // ===== ACTUALIZADO =====
                'configuracion_laboral' => [
                    'incluye_sabados' => $incluirSabados,
                    'incluye_domingos' => $incluirDomingos,
                    'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
                ]
            ],
            'stock' => [
                'inicial_litros' => round($simulacion['stock_inicial'], 2),
                'disponible_para_consumo' => round($simulacion['stock_inicial'], 2),
                'autonomia_dias_laborales' => $simulacion['parametros_usados']['consumo_diario'] > 0
                    ? round($simulacion['stock_inicial'] / $simulacion['parametros_usados']['consumo_diario'], 1)
                    : 0,
                'origen_stock' => 'Última carga registrada (Regla Nicodemo)'
            ],
            'calculo' => [
                'consumo_teorico_sin_limite' => round($simulacion['consumo_teorico'], 2),
                'consumo_proyectado_real' => round($simulacion['litros_simulados'], 2),
                'limitado_por_stock' => $simulacion['limitado_por_stock'],
                'parametros_usados' => [
                    'chc_litros_hora' => $simulacion['parametros_usados']['chc'],
                    'hrc_horas_dia' => $simulacion['parametros_usados']['hrc'],
                    'consumo_diario_teorico' => $simulacion['parametros_usados']['consumo_diario']
                ],
                'formula_aplicada' => $this->generarFormulaAplicadaConPrecision($simulacion), // ===== NUEVO =====
                'limite_aplicado' => $simulacion['limitado_por_stock']
                    ? 'Reducido a ' . round($simulacion['litros_simulados'], 2) . 'L por stock disponible en tanque'
                    : 'Sin límite de stock aplicado'
            ],
            // ===== NUEVO: Información específica de precisión horaria =====
            'precision_horaria' => [
                'habilitada' => isset($simulacion['primer_dia_parcial']),
                'primer_dia_parcial' => $simulacion['primer_dia_parcial'] ?? null,
                'beneficio' => 'Cálculo considera horas exactas desde última carga, no días completos',
                'descripcion' => 'Mayor precisión en proyecciones cuando la última carga no coincide con inicio de día laboral'
            ],
            'proyeccion_detallada' => $simulacion['proyeccion_detallada'] ?? [],
            'ajuste_temporal' => $simulacion['ajuste_temporal'] ?? null,
            'confiabilidad' => [
                'nivel' => $simulacion['limitado_por_stock'] ? 'Media-Alta' : 'Alta',
                'razon' => $simulacion['limitado_por_stock']
                    ? 'Proyección realista limitada por combustible disponible (Regla Nicodemo + Precisión Horaria)'
                    : 'Proyección basada en parámetros operacionales validados con precisión horaria',
                'porcentaje_estimado' => $simulacion['limitado_por_stock'] ? '85%' : '95%', // ===== MEJORADO =====
                'consideraciones' => [
                    'Considera días laborales: ' . ($incluirSabados && $incluirDomingos ? 'Lun-Dom' : ($incluirSabados ? 'Lun-Sáb' : 'Lun-Vie')),
                    'Horario operacional: ' . self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00',
                    'Aplicación de Regla Nicodemo: Última carga = stock máximo disponible',
                    'NUEVO: Precisión horaria habilitada - considera horas exactas desde última carga', // ===== NUEVO =====
                    $simulacion['limitado_por_stock']
                        ? 'Máquina se quedará sin combustible antes del final del período'
                        : 'Stock suficiente para todo el período proyectado'
                ]
            ]
        ];
    }
    /**
     * 5. AGREGAR nuevo método para generar fórmula con precisión
     */
    private function generarFormulaAplicadaConPrecision($simulacion)
    {
        $primerDia = $simulacion['primer_dia_parcial'] ?? null;
        $chc = $simulacion['parametros_usados']['chc'];
        $hrc = $simulacion['parametros_usados']['hrc'];
        $diasCompletos = $simulacion['dias_simulados'];
        $stockInicial = $simulacion['stock_inicial'];
        $consumoFinal = $simulacion['litros_simulados'];

        if ($primerDia && $primerDia['es_dia_laboral'] && $primerDia['horas_restantes'] > 0) {
            $consumoPrimerDia = $primerDia['consumo_teorico'];
            $consumoDiasCompletos = $hrc * $chc * $diasCompletos;
            $consumoTotal = $consumoPrimerDia + $consumoDiasCompletos;

            return "MIN([Primer día parcial: {$chc}L/h × {$primerDia['horas_restantes']}h = {$consumoPrimerDia}L] + " .
                "[Días completos: {$chc}L/h × {$hrc}h × {$diasCompletos}días = {$consumoDiasCompletos}L] = {$consumoTotal}L, " .
                "Stock_Disponible: {$stockInicial}L) = {$consumoFinal}L";
        } else {
            $consumoTotal = $hrc * $chc * $diasCompletos;
            return "MIN(CHC × HRC × días_laborales, Stock_Última_Carga) = MIN({$consumoTotal}L, {$stockInicial}L) = {$consumoFinal}L";
        }
    }

    /**
     * CORREGIDO: Calcular proyección día a día con límite real
     */
    private function calcularProyeccionDiaria($fechaInicio, $fechaFin, $stockInicial, $consumoDiario, $incluirSabados = true, $incluirDomingos = false)
    {
        $proyeccion = [];
        $stockActual = $stockInicial;
        $fecha = $fechaInicio->copy();

        while ($fecha <= $fechaFin) {
            $esLaboral = $this->esDiaLaboral($fecha, $incluirSabados, $incluirDomingos);

            if ($esLaboral && $stockActual > 0) {
                // APLICAR REGLA: No puede consumir más de lo que tiene en tanque
                $consumoDelDia = min($consumoDiario, $stockActual);
                $stockAnterior = $stockActual;
                $stockActual -= $consumoDelDia;

                $proyeccion[] = [
                    'fecha' => $fecha->format('d/m/Y'),
                    'dia_semana' => $fecha->locale('es')->dayName,
                    'stock_inicio_dia' => round($stockAnterior, 2),
                    'consumo_proyectado' => round($consumoDelDia, 2),
                    'stock_fin_dia' => round($stockActual, 2),
                    'operativo' => true,
                    'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
                    'limitado_por_stock' => $consumoDelDia < $consumoDiario
                ];

                if ($stockActual <= 0) {
                    $proyeccion[count($proyeccion) - 1]['nota'] = 'Último día operativo - se agota combustible en tanque';
                    break;
                }
            } elseif ($esLaboral && $stockActual <= 0) {
                // Día laboral pero sin combustible
                $proyeccion[] = [
                    'fecha' => $fecha->format('d/m/Y'),
                    'dia_semana' => $fecha->locale('es')->dayName,
                    'stock_inicio_dia' => 0,
                    'consumo_proyectado' => 0,
                    'stock_fin_dia' => 0,
                    'operativo' => false,
                    'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
                    'nota' => 'Sin combustible - máquina inoperativa'
                ];
            } else {
                // Día no laboral
                $proyeccion[] = [
                    'fecha' => $fecha->format('d/m/Y'),
                    'dia_semana' => $fecha->locale('es')->dayName,
                    'stock_inicio_dia' => round($stockActual, 2),
                    'consumo_proyectado' => 0,
                    'stock_fin_dia' => round($stockActual, 2),
                    'operativo' => false,
                    'tipo_dia' => $this->getTipoDia($fecha, $incluirSabados, $incluirDomingos),
                    'nota' => 'No operativo - día no laboral'
                ];
            }
            $fecha->addDay();
        }

        return $proyeccion;
    }

    /**
     * CORREGIDO: Calcular estadísticas de máquina con configuración laboral
     */
    private function calcularEstadisticasMaquina($analisisMaquina, $categoria, $incluirSabados = true, $incluirDomingos = false)
    {
        $totalConfirmado = $analisisMaquina['total_confirmado'] ?? 0;
        $diasConDatos = 0;

        if (!empty($analisisMaquina['consumos_confirmados'])) {
            foreach ($analisisMaquina['consumos_confirmados'] as $consumo) {
                $fechaInicio = Carbon::parse($consumo['fecha_inicio']);
                $fechaFin = Carbon::parse($consumo['fecha_fin']);
                $diasConDatos += $this->calcularDiasLaboralesCorrectos($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos);
            }
        }

        $consumoTeoricoDiario = ((float) ($categoria->chc ?? 10.0)) * ((float) ($categoria->hrc ?? 7.0));
        $consumoRealDiario = $diasConDatos > 0 ? $totalConfirmado / $diasConDatos : 0;

        return [
            'dias_con_datos_reales' => $diasConDatos,
            'consumo_real_promedio_dia' => round($consumoRealDiario, 2),
            'consumo_teorico_dia' => round($consumoTeoricoDiario, 2),
            'eficiencia_porcentaje' => $consumoTeoricoDiario > 0
                ? round((($consumoTeoricoDiario - $consumoRealDiario) / $consumoTeoricoDiario) * 100, 1)
                : 0,
            'interpretacion' => $consumoRealDiario < $consumoTeoricoDiario
                ? 'Mejor eficiencia que estimación teórica'
                : 'Consumo mayor a estimación teórica',
            'configuracion_aplicada' => [
                'incluye_sabados' => $incluirSabados,
                'incluye_domingos' => $incluirDomingos,
                'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
            ]
        ];
    }

    /**
     * CORREGIDO: Calcular eficiencia vs teórica con configuración laboral
     */
    private function calcularEficienciaVsTeorica($totalConfirmado, $categoria, $fechaInicio, $fechaFin, $incluirSabados = true, $incluirDomingos = false)
    {
        $diasLaborales = $this->calcularDiasLaboralesCorrectos($fechaInicio, $fechaFin, $incluirSabados, $incluirDomingos);
        $consumoTeorico = ((float) ($categoria->chc ?? 10.0)) * ((float) ($categoria->hrc ?? 7.0)) * $diasLaborales;

        return [
            'consumo_real_total' => round($totalConfirmado, 2),
            'consumo_teorico_total' => round($consumoTeorico, 2),
            'diferencia_litros' => round($consumoTeorico - $totalConfirmado, 2),
            'eficiencia_porcentaje' => $consumoTeorico > 0
                ? round((($consumoTeorico - $totalConfirmado) / $consumoTeorico) * 100, 1)
                : 0,
            'interpretacion' => $totalConfirmado < $consumoTeorico
                ? 'Operación más eficiente que estimación'
                : 'Consumo mayor a estimación estándar',
            'base_calculo' => [
                'dias_laborales_considerados' => $diasLaborales,
                'incluye_sabados' => $incluirSabados,
                'incluye_domingos' => $incluirDomingos
            ]
        ];
    }

    /**
     * NUEVO: Verificar si incluye fin de semana con nueva lógica
     */
    private function incluyeFinDeSemana($fechaInicio, $fechaFin)
    {
        $fecha = $fechaInicio->copy();
        while ($fecha <= $fechaFin) {
            if ($fecha->isWeekend()) {
                return true;
            }
            $fecha->addDay();
        }
        return false;
    }

    // ========================================
    // ENDPOINTS ADICIONALES CORREGIDOS
    // ========================================

    /**
     * NUEVO: Endpoint simplificado con configuración laboral
     */
    public function resumenActual(Request $request)
    {
        $request->validate([
            'dias' => 'nullable|integer|min:1|max:365',
            'faena' => 'nullable|integer|exists:faenas,id_faena',
            'categoria' => 'nullable|integer|exists:categorias_maquinas,id_categoria',
            'incluir_sabados' => 'nullable|boolean',
            'incluir_domingos' => 'nullable|boolean'
        ]);

        // Forzar modo automático
        $requestData = $request->all();
        $requestData['periodo_dias'] = $request->dias ?? 30;
        $requestData['id_faena'] = $request->faena;
        $requestData['id_categoria'] = $request->categoria;
        $requestData['usar_fechas_automaticas'] = true;
        $requestData['incluir_simulacion'] = true;
        $requestData['incluir_sabados'] = $request->incluir_sabados ?? self::INCLUIR_SABADOS;
        $requestData['incluir_domingos'] = $request->incluir_domingos ?? self::INCLUIR_DOMINGOS;

        $newRequest = new Request($requestData);

        return $this->calcularConsumoPorCategorias($newRequest);
    }

    /**
     * CORREGIDO: Endpoint tiempo real con configuración laboral
     */
    public function tiempoReal(Request $request)
    {
        try {
            $ahora = now('America/Santiago');
            $incluirSabados = $request->incluir_sabados ?? self::INCLUIR_SABADOS;
            $incluirDomingos = $request->incluir_domingos ?? self::INCLUIR_DOMINGOS;

            // Análisis de las últimas 24 horas
            $fechaInicio = $ahora->copy()->subDay()->setTime(self::HORA_INICIO_LABORAL, 0, 0);
            $fechaFin = $ahora->copy()->setTime(self::HORA_FIN_LABORAL, 0, 0);

            $consumosHoy = DB::table('consumos')
                ->join('maquinas', 'consumos.id_equipo', '=', 'maquinas.id_maquina')
                ->join('categorias_maquinas', 'maquinas.id_categoria', '=', 'categorias_maquinas.id_categoria')
                ->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin])
                ->when($request->faena, function ($query, $faena) {
                    return $query->where('consumos.id_faena', $faena);
                })
                ->select([
                    'consumos.*',
                    'maquinas.nombre_maquina',
                    'maquinas.patente',
                    'categorias_maquinas.nombre_categoria'
                ])
                ->orderBy('consumos.fecha_consumo', 'desc')
                ->get();

            $estadisticasHoy = [
                'total_consumos' => $consumosHoy->count(),
                'litros_totales' => $consumosHoy->sum('litros_consumidos'),
                'maquinas_activas' => $consumosHoy->pluck('id_equipo')->unique()->count(),
                'categorias_activas' => $consumosHoy->pluck('nombre_categoria')->unique()->count(),
                'costo_estimado' => $consumosHoy->sum(function ($consumo) {
                    return $consumo->litros_consumidos * ($consumo->precio_litro ?? 900);
                })
            ];

            return response()->json([
                'success' => true,
                'timestamp' => $ahora->format('Y-m-d H:i:s'),
                'configuracion_laboral' => [
                    'incluye_sabados' => $incluirSabados,
                    'incluye_domingos' => $incluirDomingos,
                    'dia_actual_es_laboral' => $this->esDiaLaboral($ahora, $incluirSabados, $incluirDomingos),
                    'tipo_dia_actual' => $this->getTipoDia($ahora, $incluirSabados, $incluirDomingos)
                ],
                'periodo_analisis' => [
                    'desde' => $fechaInicio->format('Y-m-d H:i:s'),
                    'hasta' => $fechaFin->format('Y-m-d H:i:s'),
                    'descripcion' => 'Últimas 24 horas laborales'
                ],
                'estadisticas_tiempo_real' => $estadisticasHoy,
                'consumos_detalle' => $consumosHoy->map(function ($consumo) {
                    return [
                        'id' => $consumo->id_consumo,
                        'timestamp' => Carbon::parse($consumo->fecha_consumo)->format('H:i:s'),
                        'maquina' => $consumo->nombre_maquina,
                        'patente' => $consumo->patente,
                        'categoria' => $consumo->nombre_categoria,
                        'litros' => round($consumo->litros_consumidos, 2),
                        'costo_estimado' => round($consumo->litros_consumidos * ($consumo->precio_litro ?? 900), 0),
                        'hace' => Carbon::parse($consumo->fecha_consumo)->diffForHumans()
                    ];
                }),
                'alertas_tiempo_real' => $this->generarAlertasTiempoReal($consumosHoy, $estadisticasHoy, $incluirSabados, $incluirDomingos)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en análisis tiempo real',
                'error' => $e->getMessage(),
                'timestamp' => now('America/Santiago')->format('Y-m-d H:i:s')
            ], 500);
        }
    }

    /**
     * CORREGIDO: Generar alertas con configuración laboral
     */
    private function generarAlertasTiempoReal($consumos, $estadisticas, $incluirSabados = true, $incluirDomingos = false)
    {
        $alertas = [];
        $ahora = now('America/Santiago');
        $esDiaLaboral = $this->esDiaLaboral($ahora, $incluirSabados, $incluirDomingos);

        // Alerta por baja actividad (solo en días laborales)
        if (
            $estadisticas['total_consumos'] === 0 &&
            $esDiaLaboral &&
            $ahora->hour >= self::HORA_INICIO_LABORAL &&
            $ahora->hour < self::HORA_FIN_LABORAL
        ) {

            $alertas[] = [
                'tipo' => 'actividad',
                'nivel' => 'warning',
                'mensaje' => 'No se han registrado consumos en horario laboral hoy',
                'timestamp' => $ahora->format('H:i:s'),
                'contexto' => 'Día laboral: ' . $this->getTipoDia($ahora, $incluirSabados, $incluirDomingos)
            ];
        }

        // Información de día no laboral
        if (!$esDiaLaboral) {
            $alertas[] = [
                'tipo' => 'info_dia',
                'nivel' => 'info',
                'mensaje' => 'Hoy es ' . $this->getTipoDia($ahora, $incluirSabados, $incluirDomingos),
                'timestamp' => $ahora->format('H:i:s')
            ];
        }

        // Resto de alertas existentes...
        if ($estadisticas['litros_totales'] > 500) {
            $alertas[] = [
                'tipo' => 'consumo_alto',
                'nivel' => 'info',
                'mensaje' => "Consumo elevado detectado: {$estadisticas['litros_totales']}L en las últimas 24h",
                'timestamp' => $ahora->format('H:i:s')
            ];
        }

        if ($estadisticas['costo_estimado'] > 500000) {
            $alertas[] = [
                'tipo' => 'costo_alto',
                'nivel' => 'warning',
                'mensaje' => 'Costo diario elevado: ' . number_format($estadisticas['costo_estimado'], 0, ',', '.'),
                'timestamp' => $ahora->format('H:i:s')
            ];
        }

        return $alertas;
    }

    // ========================================
    // MANTENER MÉTODOS AUXILIARES EXISTENTES
    // ========================================

    private function aplicarHorarioLaboral($fecha, $tipo = 'inicio')
    {
        if ($tipo === 'inicio') {
            return $fecha->setTime(self::HORA_INICIO_LABORAL, 0, 0);
        } else {
            return $fecha->setTime(self::HORA_FIN_LABORAL, 0, 0);
        }
    }

    private function obtenerCategorias($idCategoria = null)
    {
        $query = DB::table('categorias_maquinas')
            // ===== NUEVO: EXCLUIR CATEGORÍA 4 =====
            ->where('id_categoria', '!=', 3);

        if ($idCategoria) {
            $query->where('id_categoria', $idCategoria);
        }
        return $query->get();
    }

    private function obtenerMaquinasCategoria($idCategoria, $idFaena = null)
    {
        $query = DB::table('maquinas')
            ->where('id_categoria', $idCategoria)
            ->where('tipo_maquina', 'Interno')
            ->where('estado', 'operativo')
            // ===== NUEVO: EXCLUIR CATEGORÍA 4 =====
            ->where('id_categoria', '!=', 3);

        if ($idFaena) {
            $query->join('permisos_maquinas_faenas', 'maquinas.id_maquina', '=', 'permisos_maquinas_faenas.id_maquina')
                ->where('permisos_maquinas_faenas.id_faena', $idFaena);
        }

        return $query->select('maquinas.*')->get();
    }

    private function formatearInfoCategoria($categoria)
    {
        return [
            'id' => $categoria->id_categoria,
            'nombre' => $categoria->nombre_categoria,
            'tipo_medicion' => $categoria->tipo_medicion ?? 'N/A',
            'descripcion' => $this->obtenerDescripcionCategoria($categoria->nombre_categoria)
        ];
    }

    private function resumenVacio()
    {
        return [
            'maquinas_procesadas' => 0,
            'consumo_confirmado_litros' => 0,
            'consumo_simulado_litros' => 0,
            'consumo_total_litros' => 0,
            'precision_porcentaje' => 0,
            'costo_total_estimado' => 0,
            'precio_promedio_litro' => 0,
            'eficiencia_vs_teorica' => [
                'consumo_real_total' => 0,
                'consumo_teorico_total' => 0,
                'diferencia_litros' => 0,
                'eficiencia_porcentaje' => 0,
                'interpretacion' => 'Sin datos disponibles'
            ]
        ];
    }

    private function identificarTipoPeriodo($diasCalendario)
    {
        if ($diasCalendario <= 1) return 'Mismo día';
        if ($diasCalendario <= 3) return 'Período corto (2-3 días)';
        if ($diasCalendario <= 7) return 'Semanal (4-7 días)';
        if ($diasCalendario <= 15) return 'Quincenal (8-15 días)';
        return 'Período extendido (+15 días)';
    }

    private function clasificarIntensidadUso($litrosConsumidos, $diasLaborales)
    {
        if ($diasLaborales <= 0) return 'No determinado';

        $consumoDiario = $litrosConsumidos / $diasLaborales;

        if ($consumoDiario > 80) {
            return 'Uso intensivo (' . round($consumoDiario, 1) . 'L/día)';
        } elseif ($consumoDiario > 50) {
            return 'Uso moderado (' . round($consumoDiario, 1) . 'L/día)';
        } else {
            return 'Uso ligero (' . round($consumoDiario, 1) . 'L/día)';
        }
    }

    private function clasificarPrecision($total, $confirmado)
    {
        if ($total <= 0) return ['nivel' => 'Sin datos', 'descripcion' => 'No hay datos para analizar'];

        $porcentaje = ($confirmado / $total) * 100;

        if ($porcentaje >= 90) {
            return ['nivel' => 'Muy Alta', 'porcentaje' => round($porcentaje, 1), 'descripcion' => 'Datos altamente confiables'];
        } elseif ($porcentaje >= 80) {
            return ['nivel' => 'Alta', 'porcentaje' => round($porcentaje, 1), 'descripcion' => 'Datos confiables con mínima simulación'];
        } elseif ($porcentaje >= 60) {
            return ['nivel' => 'Media', 'porcentaje' => round($porcentaje, 1), 'descripcion' => 'Datos aceptables con simulación moderada'];
        } else {
            return ['nivel' => 'Baja', 'porcentaje' => round($porcentaje, 1), 'descripcion' => 'Datos requieren validación adicional'];
        }
    }

    private function generarRecomendacionesMejoradas($resultados, $resumenTotal, $diasLaborales, $modoConsulta = 'manual')
    {
        $recomendaciones = [];

        $porcentajeConfirmado = $resumenTotal['consumo_total_litros'] > 0
            ? ($resumenTotal['consumo_confirmado_litros'] / $resumenTotal['consumo_total_litros']) * 100
            : 0;

        if ($porcentajeConfirmado < 80) {
            $recomendaciones[] = [
                'tipo' => 'Calidad de Datos',
                'prioridad' => 'Alta',
                'mensaje' => 'La precisión de datos es del ' . round($porcentajeConfirmado, 1) . '%. Se recomienda aumentar la frecuencia de registros.',
                'accion_sugerida' => 'Implementar registros cada 2-3 días laborales máximo',
                'impacto' => 'Mejorará la precisión de proyecciones y costos'
            ];
        } else {
            $recomendaciones[] = [
                'tipo' => 'Calidad de Datos',
                'prioridad' => 'Baja',
                'mensaje' => 'Excelente calidad de datos con ' . round($porcentajeConfirmado, 1) . '% de información confirmada.',
                'accion_sugerida' => 'Mantener frecuencia actual de registros de combustible',
                'impacto' => 'Datos altamente confiables para toma de decisiones'
            ];
        }

        $recomendaciones[] = [
            'tipo' => 'Gestión Horaria',
            'prioridad' => 'Baja',
            'mensaje' => 'El análisis considera horario laboral ' . self::HORA_INICIO_LABORAL . ':00-' . self::HORA_FIN_LABORAL . ':00, ' . $diasLaborales . ' días laborales en el período.',
            'accion_sugerida' => 'Validar que el horario operacional real coincida con el configurado',
            'impacto' => 'Asegura precisión en cálculos de consumo por hora'
        ];

        if ($modoConsulta === 'automatico') {
            $recomendaciones[] = [
                'tipo' => 'Automatización',
                'prioridad' => 'Info',
                'mensaje' => 'Consulta realizada en modo automático usando timestamp actual del servidor.',
                'accion_sugerida' => 'El sistema actualiza automáticamente las fechas de análisis',
                'impacto' => 'Datos siempre actualizados al momento de la consulta'
            ];
        }

        $recomendaciones[] = [
            'tipo' => 'Mantenimiento del Sistema',
            'prioridad' => 'Baja',
            'mensaje' => 'Sistema de seguimiento funcionando correctamente.',
            'accion_sugerida' => 'Ejecutar calibración automática de parámetros CHC cada mes',
            'impacto' => 'Mantiene la precisión del sistema de gestión'
        ];

        return $recomendaciones;
    }
    private function obtenerPrecioPromedioCategoria($idCategoria, $fechaInicio = null, $fechaFin = null, $idFaena = null)
    {
        $query = DB::table('consumos')
            ->join('maquinas', 'consumos.id_equipo', '=', 'maquinas.id_maquina')
            ->where('maquinas.id_categoria', $idCategoria)
            ->whereNotNull('consumos.precio_litro')
            ->where('consumos.precio_litro', '>', 0);

        // ← AGREGAR FILTRO DE FECHAS
        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('consumos.fecha_consumo', [$fechaInicio, $fechaFin]);
        }

        // ✅ FILTRO POR FAENA
        if ($idFaena) {
            $query->where('consumos.id_faena', $idFaena);
        }

        return $query->avg('consumos.precio_litro') ?? 0;
    }

    private function obtenerNombreFaena($idFaena)
    {
        $faena = DB::table('faenas')->where('id_faena', $idFaena)->first();
        return $faena ? $faena->ubicacion : "Faena ID: $idFaena";
    }

    private function obtenerNombreCategoria($idCategoria)
    {
        $categoria = DB::table('categorias_maquinas')->where('id_categoria', $idCategoria)->first();
        return $categoria ? $categoria->nombre_categoria : "Categoría ID: $idCategoria";
    }

    private function obtenerDescripcionCategoria($nombreCategoria)
    {
        $descripciones = [
            'Dumper' => 'Vehículo de volteo para transporte de materiales',
            'Camion' => 'Vehículo de carga pesada para transporte',
            'Excavadora' => 'Maquinaria para excavación y movimiento de tierra',
            'Cargador Frontal' => 'Maquinaria para carga y descarga de materiales'
        ];

        return $descripciones[$nombreCategoria] ?? 'Maquinaria especializada';
    }

    // ========================================
    // ENDPOINTS ADICIONALES ACTUALIZADOS
    // ========================================

    /**
     * CORREGIDO: Obtener parámetros de categorías con configuración laboral
     */
    public function obtenerParametrosCategorias(Request $request)
    {
        try {
            $incluirSabados = $request->incluir_sabados ?? self::INCLUIR_SABADOS;
            $incluirDomingos = $request->incluir_domingos ?? self::INCLUIR_DOMINGOS;
            $diasLaboralesMes = $this->calcularDiasLaboralesMesActual($incluirSabados, $incluirDomingos);

            $categorias = DB::table('categorias_maquinas')
                ->select([
                    'id_categoria',
                    'nombre_categoria',
                    'tipo_medicion',
                    'chc',
                    'hrc',
                    'horas_mantencion'
                ])
                // ===== NUEVO: EXCLUIR CATEGORÍAS CON tipo_medicion = 'N/A' =====
                ->where('tipo_medicion', '!=', 'N/A')
                ->whereNotNull('tipo_medicion') // También excluir NULL por seguridad
                ->get()
                ->map(function ($categoria) use ($diasLaboralesMes, $incluirSabados, $incluirDomingos) {
                    $chc = (float) ($categoria->chc ?? 10.0);
                    $hrc = (float) ($categoria->hrc ?? 7.0);
                    $consumoDiario = $chc * $hrc;

                    return [
                        'id_categoria' => $categoria->id_categoria,
                        'nombre_categoria' => $categoria->nombre_categoria,
                        'descripcion' => $this->obtenerDescripcionCategoria($categoria->nombre_categoria),
                        'tipo_medicion' => $categoria->tipo_medicion,
                        'parametros_operacion' => [
                            'chc_litros_hora' => $chc,
                            'hrc_horas_dia' => $hrc,
                            'consumo_diario_estimado' => round($consumoDiario, 2),
                            'consumo_mensual_estimado' => round($consumoDiario * $diasLaboralesMes, 2),
                            'horario_operacion' => self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00 (10 horas)',
                            'dias_laborales_mes_actual' => $diasLaboralesMes,
                            'configuracion_laboral' => [
                                'incluye_sabados' => $incluirSabados,
                                'incluye_domingos' => $incluirDomingos,
                                'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
                            ]
                        ],
                        'mantenimiento' => [
                            'horas_mantencion' => (float) ($categoria->horas_mantencion ?? 0),
                            'frecuencia_estimada' => $hrc > 0 ?
                                'Cada ' . round((float) ($categoria->horas_mantencion ?? 300) / ($hrc * $diasLaboralesMes), 1) . ' meses'
                                : 'No calculable'
                        ]
                    ];
                });

            // ===== NUEVO: INFORMACIÓN SOBRE FILTRADO =====
            $totalCategorias = DB::table('categorias_maquinas')->count();
            $categoriasExcluidas = DB::table('categorias_maquinas')
                ->where('tipo_medicion', 'N/A')
                ->orWhereNull('tipo_medicion')
                ->count();

            return response()->json([
                'success' => true,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'configuracion_laboral' => [
                    'incluye_sabados' => $incluirSabados,
                    'incluye_domingos' => $incluirDomingos,
                    'dias_laborales_mes_actual' => $diasLaboralesMes,
                    'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
                ],
                // ===== NUEVO: INFORMACIÓN DE FILTRADO =====
                'filtrado' => [
                    'total_categorias_sistema' => $totalCategorias,
                    'categorias_incluidas' => count($categorias),
                    'categorias_excluidas' => $categoriasExcluidas,
                    'criterio_exclusion' => 'tipo_medicion = N/A o NULL',
                    'descripcion' => "Se excluyen {$categoriasExcluidas} categorías sin tipo de medición válido"
                ],
                'categorias' => $categorias,
                'notas' => [
                    'CHC: Consumo por Hora Cronológica (Litros/hora)',
                    'HRC: Horas Cronológicas por día laboral',
                    'Horario estándar: ' . self::HORA_INICIO_LABORAL . ':00 - ' . self::HORA_FIN_LABORAL . ':00 (10 horas con descansos)',
                    'Configuración actual: ' . ($incluirSabados ? 'Incluye sábados' : 'Excluye sábados') . ', ' . ($incluirDomingos ? 'Incluye domingos' : 'Excluye domingos'),
                    'Días laborales mes actual: ' . $diasLaboralesMes . ' días',
                    'FILTRO APLICADO: Se excluyen categorías con tipo_medicion N/A o NULL' // ===== NUEVO =====
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener parámetros de categorías',
                'error' => $e->getMessage(),
                'timestamp' => now()->format('Y-m-d H:i:s')
            ], 500);
        }
    }

    /**
     * CORREGIDO: Actualizar parámetros de categoría
     */
    public function actualizarParametrosCategoria(Request $request, $id)
    {
        $request->validate([
            'chc' => 'required|numeric|min:0',
            'hrc' => 'required|numeric|min:0',
            'justificacion' => 'nullable|string|max:500',
            'incluir_sabados' => 'nullable|boolean',
            'incluir_domingos' => 'nullable|boolean'
        ]);

        try {
            $categoria = DB::table('categorias_maquinas')
                ->where('id_categoria', $id)
                ->first();

            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            $incluirSabados = $request->incluir_sabados ?? self::INCLUIR_SABADOS;
            $incluirDomingos = $request->incluir_domingos ?? self::INCLUIR_DOMINGOS;
            $diasLaboralesMes = $this->calcularDiasLaboralesMesActual($incluirSabados, $incluirDomingos);

            $chcAnterior = (float) ($categoria->chc ?? 10.0);
            $hrcAnterior = (float) ($categoria->hrc ?? 7.0);
            $chcNuevo = (float) $request->chc;
            $hrcNuevo = (float) $request->hrc;

            $consumoAnterior = $chcAnterior * $hrcAnterior;
            $consumoNuevo = $chcNuevo * $hrcNuevo;
            $impactoPorcentaje = $consumoAnterior > 0
                ? round((($consumoNuevo - $consumoAnterior) / $consumoAnterior) * 100, 1)
                : 0;

            // Calcular impacto mensual
            $consumoMensualAnterior = $consumoAnterior * $diasLaboralesMes;
            $consumoMensualNuevo = $consumoNuevo * $diasLaboralesMes;

            DB::table('categorias_maquinas')
                ->where('id_categoria', $id)
                ->update([
                    'chc' => $chcNuevo,
                    'hrc' => $hrcNuevo,
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Parámetros actualizados correctamente',
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'actualizacion' => [
                    'categoria' => [
                        'id' => $id,
                        'nombre' => $categoria->nombre_categoria
                    ],
                    'configuracion_laboral' => [
                        'incluye_sabados' => $incluirSabados,
                        'incluye_domingos' => $incluirDomingos,
                        'dias_laborales_mes' => $diasLaboralesMes
                    ],
                    'cambios' => [
                        'chc' => [
                            'anterior' => $chcAnterior,
                            'nuevo' => $chcNuevo,
                            'diferencia' => round($chcNuevo - $chcAnterior, 2)
                        ],
                        'hrc' => [
                            'anterior' => $hrcAnterior,
                            'nuevo' => $hrcNuevo,
                            'diferencia' => round($hrcNuevo - $hrcAnterior, 2)
                        ],
                        'consumo_diario' => [
                            'anterior' => round($consumoAnterior, 2),
                            'nuevo' => round($consumoNuevo, 2),
                            'impacto_porcentaje' => $impactoPorcentaje
                        ],
                        'consumo_mensual' => [
                            'anterior' => round($consumoMensualAnterior, 2),
                            'nuevo' => round($consumoMensualNuevo, 2),
                            'diferencia' => round($consumoMensualNuevo - $consumoMensualAnterior, 2)
                        ]
                    ],
                    'justificacion' => $request->justificacion ?? 'Actualización manual de parámetros'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar parámetros',
                'error' => $e->getMessage(),
                'timestamp' => now()->format('Y-m-d H:i:s')
            ], 500);
        }
    }

    /**
     * NUEVO: Endpoint para configurar días laborales globalmente
     */
    public function configurarDiasLaborales(Request $request)
    {
        $request->validate([
            'incluir_sabados' => 'required|boolean',
            'incluir_domingos' => 'required|boolean',
            'justificacion' => 'nullable|string|max:500'
        ]);

        try {
            $incluirSabados = $request->incluir_sabados;
            $incluirDomingos = $request->incluir_domingos;

            // Calcular impacto del cambio
            $diasActuales = $this->calcularDiasLaboralesMesActual(self::INCLUIR_SABADOS, self::INCLUIR_DOMINGOS);
            $diasNuevos = $this->calcularDiasLaboralesMesActual($incluirSabados, $incluirDomingos);
            $impactoDias = $diasNuevos - $diasActuales;
            $impactoPorcentaje = $diasActuales > 0 ? round(($impactoDias / $diasActuales) * 100, 1) : 0;

            // Aquí podrías actualizar una configuración global en base de datos
            // Por ahora solo retornamos el análisis del impacto

            return response()->json([
                'success' => true,
                'message' => 'Configuración de días laborales analizada',
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'configuracion_propuesta' => [
                    'incluir_sabados' => $incluirSabados,
                    'incluir_domingos' => $incluirDomingos,
                    'dias_por_semana' => $this->getDiasPorSemana($incluirSabados, $incluirDomingos)
                ],
                'impacto_analisis' => [
                    'dias_laborales_actuales' => $diasActuales,
                    'dias_laborales_nuevos' => $diasNuevos,
                    'diferencia_dias' => $impactoDias,
                    'impacto_porcentaje' => $impactoPorcentaje,
                    'interpretacion' => $impactoDias > 0 ? 'Incremento en días laborales' : ($impactoDias < 0 ? 'Reducción en días laborales' : 'Sin cambios')
                ],
                'recomendaciones' => [
                    'Este cambio afectará todos los cálculos de consumo',
                    'Se recomienda recalcular los KPIs históricos',
                    'Notificar el cambio a los usuarios del sistema'
                ],
                'justificacion' => $request->justificacion ?? 'Configuración manual de días laborales'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al analizar configuración de días laborales',
                'error' => $e->getMessage(),
                'timestamp' => now()->format('Y-m-d H:i:s')
            ], 500);
        }
    }
}
