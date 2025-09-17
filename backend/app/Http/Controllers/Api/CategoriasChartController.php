<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CategoriasChartController extends Controller
{
    /**
     * Obtener datos para el PieChart de categorías con opción de drill-down a máquinas
     * 🔑 CORREGIDO: Estructura de tablas compatible con el sistema existente
     */
    public function obtenerDatosCategoriasChart(Request $request)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena; // Opcional, para filtrar por faena
            $idCategoria = $request->id_categoria; // Opcional, para drill-down a máquinas
            $modo = $request->modo ?? 'categorias'; // 'categorias' o 'maquinas'

            // 🔑 Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            // Validar fechas
            if (!$this->validarFechas($fechaInicio, $fechaFin)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fechas inválidas. La fecha de inicio debe ser menor o igual a la fecha fin.'
                ], 400);
            }

            if ($modo === 'maquinas' && $idCategoria) {
                // Modo drill-down: mostrar máquinas de una categoría específica
                $resultado = $this->obtenerDatosMaquinasCategoria($idCategoria, $fechaInicio, $fechaFin, $idFaena);
            } else {
                // Modo principal: mostrar categorías
                $resultado = $this->obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena);
            }

            return response()->json([
                'success' => true,
                'data' => $resultado['data'],
                'metadata' => $resultado['metadata']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener datos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 CORREGIDO: Obtener datos de consumo por categorías usando estructura de tablas existente
     */
    private function obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena = null)
    {
        // 🆕 QUERY CORREGIDA: Usar solo la tabla `maquinas` con joins apropiados
        $queryConsumos = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0)
            ->when($idFaena && $idFaena !== 'todas', function ($q) use ($idFaena) {
                return $q->where('c.id_faena', $idFaena);
            })
            ->select([
                'cm.id_categoria',
                'cm.nombre_categoria',
                'cm.tipo_medicion',
                'm.id_maquina',
                // 🔑 CORREGIDO: Usar nombre de la máquina desde tabla maquinas o maquinas_internas
                DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                DB::raw('SUM(c.litros_consumidos) as consumo_maquina'),
                // 🔑 DETERMINAR TIPO: Si existe en maquinas_internas es interna, sino externa
                DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina')
            ])
            ->groupBy('cm.id_categoria', 'cm.nombre_categoria', 'cm.tipo_medicion', 'm.id_maquina', 'mi.nombre', 'm.nombre_maquina', 'mi.patente', 'm.patente', 'mi.id_maquina')
            ->get();

        // 🆕 AGRUPAR POR CATEGORÍA (sumar consumos de todas las máquinas por categoría)
        $categorias = $queryConsumos->groupBy('id_categoria')->map(function ($maquinas, $idCategoria) {
            $primeraMaquina = $maquinas->first();

            return [
                'id_categoria' => $idCategoria,
                'nombre_categoria' => $primeraMaquina->nombre_categoria,
                'tipo_medicion' => $primeraMaquina->tipo_medicion,
                'total_consumo' => $maquinas->sum('consumo_maquina'),
                'cantidad_maquinas' => $maquinas->count(),
                'maquinas_internas' => $maquinas->where('tipo_maquina', 'Interna')->count(),
                'maquinas_externas' => $maquinas->where('tipo_maquina', 'Externa')->count(),
                'total_registros' => $maquinas->count(), // Aproximado
                'promedio_consumo' => $maquinas->avg('consumo_maquina')
            ];
        })->sortByDesc('total_consumo')->values();

        // Formatear datos para el PieChart
        $data = $categorias->map(function ($item) {
            return [
                'id' => $item['id_categoria'],
                'name' => $item['nombre_categoria'],
                'value' => round($item['total_consumo'], 2),
                'maquinas_count' => $item['cantidad_maquinas'],
                'maquinas_internas' => $item['maquinas_internas'],
                'maquinas_externas' => $item['maquinas_externas'],
                'tipo_medicion' => $item['tipo_medicion'],
                'promedio_consumo' => round($item['promedio_consumo'], 2),
                'total_registros' => $item['total_registros']
            ];
        });

        // Calcular metadata
        $totalConsumo = $data->sum('value');
        $totalMaquinas = $data->sum('maquinas_count');
        $totalInternas = $data->sum('maquinas_internas');
        $totalExternas = $data->sum('maquinas_externas');

        $metadata = [
            'periodo' => [
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin' => $fechaFin->toDateString(),
                'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
            ],
            'resumen' => [
                'total_categorias' => $data->count(),
                'total_consumo_litros' => round($totalConsumo, 2),
                'total_maquinas' => $totalMaquinas,
                'total_maquinas_internas' => $totalInternas,
                'total_maquinas_externas' => $totalExternas,
                'promedio_por_categoria' => $data->count() > 0 ? round($totalConsumo / $data->count(), 2) : 0,
                'categoria_mayor_consumo' => $data->first() ? $data->first()['name'] : null
            ],
            'filtros_aplicados' => [
                'faena_especifica' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas'
            ]
        ];

        return [
            'data' => $data->values(),
            'metadata' => $metadata
        ];
    }

    /**
     * 🆕 CORREGIDO: Obtener datos de máquinas para una categoría específica
     */
    private function obtenerDatosMaquinasCategoria($idCategoria, $fechaInicio, $fechaFin, $idFaena = null)
    {
        // Obtener información de la categoría
        $categoria = DB::table('categorias_maquinas')
            ->where('id_categoria', $idCategoria)
            ->first();

        if (!$categoria) {
            throw new \Exception('Categoría no encontrada');
        }

        // 🆕 QUERY CORREGIDA: Una sola consulta con LEFT JOIN
        $resultados = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
            ->where('m.id_categoria', $idCategoria)
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0)
            ->when($idFaena && $idFaena !== 'todas', function ($q) use ($idFaena) {
                return $q->where('c.id_faena', $idFaena);
            })
            ->select([
                'm.id_maquina',
                // 🔑 CORREGIDO: Usar nombre apropiado según tipo
                DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                'm.estado',
                DB::raw('SUM(c.litros_consumidos) as total_consumo'),
                DB::raw('COUNT(c.id_consumo) as total_registros'),
                DB::raw('AVG(c.litros_consumidos) as promedio_consumo'),
                DB::raw('MAX(c.fecha_consumo) as ultimo_consumo'),
                DB::raw('MIN(c.fecha_consumo) as primer_consumo'),
                // 🔑 DETERMINAR TIPO: Si existe en maquinas_internas es interna
                DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina')
            ])
            ->groupBy('m.id_maquina', 'mi.nombre', 'm.nombre_maquina', 'mi.patente', 'm.patente', 'm.estado', 'mi.id_maquina')
            ->orderBy('total_consumo', 'desc')
            ->get();

        // Formatear datos para el PieChart
        $data = $resultados->map(function ($item) {
            return [
                'id' => $item->id_maquina,
                'name' => $item->nombre_maquina,
                'value' => round($item->total_consumo, 2),
                'patente' => $item->patente ?? 'N/A',
                'estado' => $item->estado,
                'tipo_maquina' => $item->tipo_maquina,
                'promedio_consumo' => round($item->promedio_consumo, 2),
                'total_registros' => $item->total_registros,
                'periodo_actividad' => [
                    'inicio' => $item->primer_consumo,
                    'fin' => $item->ultimo_consumo
                ]
            ];
        });

        // Calcular metadata
        $totalConsumo = $data->sum('value');
        $maquinasInternas = $data->where('tipo_maquina', 'Interna')->count();
        $maquinasExternas = $data->where('tipo_maquina', 'Externa')->count();

        $metadata = [
            'categoria' => [
                'id' => $categoria->id_categoria,
                'nombre' => $categoria->nombre_categoria,
                'tipo_medicion' => $categoria->tipo_medicion
            ],
            'periodo' => [
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin' => $fechaFin->toDateString(),
                'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
            ],
            'resumen' => [
                'total_maquinas' => $data->count(),
                'maquinas_internas' => $maquinasInternas,
                'maquinas_externas' => $maquinasExternas,
                'total_consumo_litros' => round($totalConsumo, 2),
                'promedio_por_maquina' => $data->count() > 0 ? round($totalConsumo / $data->count(), 2) : 0,
                'maquina_mayor_consumo' => $data->first() ? $data->first()['name'] : null,
                'maquinas_activas' => $data->where('estado', 'operativo')->count()
            ],
            'filtros_aplicados' => [
                'faena_especifica' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas'
            ]
        ];

        return [
            'data' => $data->values(),
            'metadata' => $metadata
        ];
    }

/**
 * Endpoint específico para obtener categorías con descripciones en formato DD-MM-YYYY
 * 🔑 CORREGIDO: Descripciones en formato DD-MM-YYYY al DD-MM-YYYY  
 */
public function obtenerCategoriasResumen(Request $request)
{
    try {
        // 🔄 MANEJAR TANTO GET COMO POST
        $fechaInicio = $request->input('fecha_inicio', $request->input('fecha_desde', Carbon::now()->startOfMonth()->format('Y-m-d')));
        $fechaFin = $request->input('fecha_fin', $request->input('fecha_hasta', Carbon::now()->format('Y-m-d')));
        $idFaena = $request->input('id_faena', $request->input('faena_id'));
        
        // 🔑 Convertir fechas con Carbon
        $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
        $fechaFin = Carbon::parse($fechaFin)->endOfDay();

        // 🔧 DESCRIPCIÓN DEL PERÍODO ACTUAL en formato DD-MM-YYYY
        $descripcionPeriodoActual = $fechaInicio->format('d-m-Y') . ' al ' . $fechaFin->format('d-m-Y');

        // 🆕 CALCULAR PERÍODO ANTERIOR CON DESCRIPCIÓN EN DD-MM-YYYY
        $periodoAnterior = $this->calcularPeriodoAnteriorFormatoDDMMYYYY(
            $fechaInicio->format('Y-m-d'), 
            $fechaFin->format('Y-m-d')
        );
        
        // 📊 OBTENER DATOS PARA AMBOS PERÍODOS EN PARALELO
        $resultadoActual = $this->obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena);
        
        $fechaInicioAnterior = Carbon::parse($periodoAnterior['fechaDesde'])->startOfDay();
        $fechaFinAnterior = Carbon::parse($periodoAnterior['fechaHasta'])->endOfDay();
        $resultadoAnterior = $this->obtenerDatosCategorias($fechaInicioAnterior, $fechaFinAnterior, $idFaena);

        // 🔄 PROCESAR AMBOS PERÍODOS con lógica del frontend
        $datosActualProcesados = $this->procesarCategoriasConLogicaFrontend($resultadoActual['data']);
        $datosAnteriorProcesados = $this->procesarCategoriasConLogicaFrontend($resultadoAnterior['data']);

        // 📊 ESTRUCTURA FINAL CON FORMATO DD-MM-YYYY
        return response()->json([
            'success' => true,
            'data' => [
                // Período actual
                'categoriasIniciales' => $datosActualProcesados['categoriasIniciales'],
                'categoriasFinales' => $datosActualProcesados['categoriasFinales'],
                
                // 🔧 FORMATO DD-MM-YYYY: Descripción del período actual
                'descripcionPeriodoActual' => $descripcionPeriodoActual,
                
                // 🆕 Período anterior con descripción DD-MM-YYYY
                'periodoAnterior' => [
                    'categoriasIniciales' => $datosAnteriorProcesados['categoriasIniciales'],
                    'categoriasFinales' => $datosAnteriorProcesados['categoriasFinales'],
                    'fechas' => [
                        'desde' => $periodoAnterior['fechaDesde'],
                        'hasta' => $periodoAnterior['fechaHasta'],
                    ],
                    // 🔧 FORMATO DD-MM-YYYY: Descripción del período anterior
                    'descripcion' => $periodoAnterior['descripcionDDMMYYYY'],
                    'metadatos' => $periodoAnterior['metadatos'] ?? []
                ]
            ],
            
            // Metadata con formato DD-MM-YYYY
            'resumen' => array_merge($resultadoActual['metadata'], [
                'periodo_actual' => [
                    'descripcion' => $descripcionPeriodoActual,
                    'fechas' => $descripcionPeriodoActual // Mismo formato DD-MM-YYYY
                ],
                'periodo_anterior' => [
                    'descripcion' => $periodoAnterior['descripcionDDMMYYYY'],
                    'fechas' => $periodoAnterior['descripcionDDMMYYYY'] // Mismo formato DD-MM-YYYY
                ]
            ]),
            
            // 🔄 MANTENER formato original para compatibilidad
            'categorias' => $resultadoActual['data'],
            'method_used' => $request->method(),
            'processing_applied' => true,
            'periods_calculated' => true,
            'date_format' => 'DD-MM-YYYY',
            'parameters_received' => [
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin' => $fechaFin->toDateString(),
                'id_faena' => $idFaena,
                'periodo_actual' => $descripcionPeriodoActual,
                'periodo_anterior_calculado' => $periodoAnterior['descripcionDDMMYYYY']
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener categorías: ' . $e->getMessage(),
            'method_used' => $request->method()
        ], 500);
    }
}

/**
 * 🔧 CALCULAR PERÍODO ANTERIOR con descripción en formato DD-MM-YYYY
 */
private function calcularPeriodoAnteriorFormatoDDMMYYYY($fechaDesde, $fechaHasta)
{
    // Función auxiliar para obtener días en un mes
    $getDiasEnMes = function($year, $month) {
        return Carbon::create($year, $month, 1)->daysInMonth;
    };

    // Parsear fechas de entrada
    [$yearDesde, $monthDesde, $dayDesde] = explode('-', $fechaDesde);
    [$yearHasta, $monthHasta, $dayHasta] = explode('-', $fechaHasta);
    
    $yearDesde = (int) $yearDesde;
    $monthDesde = (int) $monthDesde;
    $dayDesde = (int) $dayDesde;
    $yearHasta = (int) $yearHasta;
    $monthHasta = (int) $monthHasta;
    $dayHasta = (int) $dayHasta;

    // Calcular mes anterior para fecha inicio
    $yearAnteriorDesde = $yearDesde;
    $monthAnteriorDesde = $monthDesde - 1;
    if ($monthAnteriorDesde < 1) {
        $monthAnteriorDesde = 12;
        $yearAnteriorDesde -= 1;
    }

    // Calcular mes anterior para fecha fin
    $yearAnteriorHasta = $yearHasta;
    $monthAnteriorHasta = $monthHasta - 1;
    if ($monthAnteriorHasta < 1) {
        $monthAnteriorHasta = 12;
        $yearAnteriorHasta -= 1;
    }

    // 🔧 CORRECCIÓN CRÍTICA: Ajustar días si el mes anterior tiene menos días
    $dayAnteriorDesde = $dayDesde;
    $dayAnteriorHasta = $dayHasta;

    // Verificar días máximos para el mes anterior de la fecha inicio
    $maxDiasAnteriorDesde = $getDiasEnMes($yearAnteriorDesde, $monthAnteriorDesde);
    if ($dayAnteriorDesde > $maxDiasAnteriorDesde) {
        $dayAnteriorDesde = $maxDiasAnteriorDesde;
    }

    // Verificar días máximos para el mes anterior de la fecha fin
    $maxDiasAnteriorHasta = $getDiasEnMes($yearAnteriorHasta, $monthAnteriorHasta);
    if ($dayAnteriorHasta > $maxDiasAnteriorHasta) {
        $dayAnteriorHasta = $maxDiasAnteriorHasta;
    }

    // Formatear fechas como YYYY-MM-DD (para uso interno)
    $fechaInicioAnterior = sprintf(
        '%04d-%02d-%02d',
        $yearAnteriorDesde,
        $monthAnteriorDesde,
        $dayAnteriorDesde
    );
    
    $fechaFinAnterior = sprintf(
        '%04d-%02d-%02d',
        $yearAnteriorHasta,
        $monthAnteriorHasta,
        $dayAnteriorHasta
    );

    // 🎨 DESCRIPCIÓN EN FORMATO DD-MM-YYYY (para mostrar al usuario)
    $fechaInicioDDMMYYYY = sprintf(
        '%02d-%02d-%04d',
        $dayAnteriorDesde,
        $monthAnteriorDesde,
        $yearAnteriorDesde
    );
    
    $fechaFinDDMMYYYY = sprintf(
        '%02d-%02d-%04d',
        $dayAnteriorHasta,
        $monthAnteriorHasta,
        $yearAnteriorHasta
    );

    $descripcionDDMMYYYY = $fechaInicioDDMMYYYY . ' al ' . $fechaFinDDMMYYYY;

    return [
        'fechaDesde' => $fechaInicioAnterior,     // YYYY-MM-DD (uso interno)
        'fechaHasta' => $fechaFinAnterior,       // YYYY-MM-DD (uso interno)
        'descripcionDDMMYYYY' => $descripcionDDMMYYYY, // 🎨 DD-MM-YYYY (presentación)
        'metadatos' => [
            'ajusteDiaInicio' => $dayDesde !== $dayAnteriorDesde,
            'ajusteDiaFin' => $dayHasta !== $dayAnteriorHasta,
            'diasOriginales' => ['inicio' => $dayDesde, 'fin' => $dayHasta],
            'diasAjustados' => ['inicio' => $dayAnteriorDesde, 'fin' => $dayAnteriorHasta],
            'maxDiasEnMeses' => [
                'inicio' => $maxDiasAnteriorDesde,
                'fin' => $maxDiasAnteriorHasta
            ],
            'formatoPresentacion' => 'DD-MM-YYYY'
        ]
    ];
}

    /**
     * 🆕 NUEVA FUNCIÓN: Procesar categorías con la lógica exacta del frontend
     */
    private function procesarCategoriasConLogicaFrontend($categoriasOriginales)
    {
        // ===============================================
        // 📊 PASO 1: CATEGORÍAS INICIALES (TODO - sin filtros)
        // ===============================================
        $categoriasIniciales = $categoriasOriginales->map(function ($item, $index) {
            return [
                'id' => $item['id'] ?? $index,
                'name' => $item['name'] ?? 'Sin categoría',
                'nombre' => $item['name'] ?? 'Sin categoría',
                'value' => round(($item['value'] ?? 0), 2),
                'maquinas_count' => $item['maquinas_count'] ?? 0,
                'maquinas_internas' => $item['maquinas_internas'] ?? 0,
                'maquinas_externas' => $item['maquinas_externas'] ?? 0,
                'tipo_medicion' => $item['tipo_medicion'] ?? null,
                'promedio_consumo' => $item['promedio_consumo'] ?? 0,
                'total_registros' => $item['total_registros'] ?? 0,
                'originalData' => $item
            ];
        })
            ->filter(function ($item) {
                return $item['value'] > 0;
            })
            ->sortByDesc('value')
            ->values();

        // ===============================================
        // 🎯 PASO 2: CATEGORÍAS FINALES (OPERACIONALES)
        // ===============================================

        // 2.1 - Aplicar exclusiones (como hace el frontend)
        $categoriasExcluidas = ['Microbus', 'Microbús', 'MICROBUS'];

        $categoriasFiltradas = $categoriasIniciales->filter(function ($categoria) use ($categoriasExcluidas) {
            $nombreLimpio = trim($categoria['name']);

            foreach ($categoriasExcluidas as $excluida) {
                if (stripos($nombreLimpio, $excluida) !== false) {
                    return false; // Excluir esta categoría
                }
            }
            return true; // Mantener esta categoría
        });

        // 2.2 - Agrupar camionetas (lógica exacta del frontend)
        $categoriasAgrupadas = [];
        $camionetasAgrupadas = [
            'id' => 999, // ID especial para camionetas agrupadas
            'name' => 'Camionetas',
            'nombre' => 'Camionetas',
            'value' => 0,
            'maquinas_count' => 0,
            'maquinas_internas' => 0,
            'maquinas_externas' => 0,
            'tipo_medicion' => 'Kilometraje',
            'promedio_consumo' => 0,
            'total_registros' => 0,
            'categorias_originales' => []
        ];

        foreach ($categoriasFiltradas as $categoria) {
            $nombreLimpio = strtolower(trim($categoria['name']));

            // Detectar si es camioneta (lógica exacta del frontend)
            $esCamioneta = strpos($nombreLimpio, 'camioneta') !== false ||
                strpos($nombreLimpio, 'camionetas') !== false ||
                $nombreLimpio === 'camioneta';

            if ($esCamioneta) {
                // Agrupar en camionetas
                $camionetasAgrupadas['value'] += $categoria['value'];
                $camionetasAgrupadas['maquinas_count'] += $categoria['maquinas_count'];
                $camionetasAgrupadas['maquinas_internas'] += $categoria['maquinas_internas'];
                $camionetasAgrupadas['maquinas_externas'] += $categoria['maquinas_externas'];
                $camionetasAgrupadas['total_registros'] += $categoria['total_registros'];
                $camionetasAgrupadas['categorias_originales'][] = $categoria['name'];
            } else {
                // Mantener como categoría individual
                $categoriasAgrupadas[] = $categoria;
            }
        }

        // 2.3 - Aplicar factor de 30% a camionetas (lógica exacta del frontend)
        if ($camionetasAgrupadas['value'] > 0) {
            $valorOriginal = $camionetasAgrupadas['value'];
            $camionetasAgrupadas['value'] = $camionetasAgrupadas['value'] * 0.3; // Factor 30%
            $camionetasAgrupadas['value'] = round($camionetasAgrupadas['value'], 2);

            // Calcular promedio
            if ($camionetasAgrupadas['maquinas_count'] > 0) {
                $camionetasAgrupadas['promedio_consumo'] = round(
                    $camionetasAgrupadas['value'] / $camionetasAgrupadas['maquinas_count'],
                    2
                );
            }

            // Añadir metadata del factor aplicado
            $camionetasAgrupadas['factor_aplicado'] = 0.3;
            $camionetasAgrupadas['valor_original'] = $valorOriginal;

            $categoriasAgrupadas[] = $camionetasAgrupadas;
        }

        // 2.4 - Filtrar y ordenar finales
        $categoriasFinales = collect($categoriasAgrupadas)
            ->filter(function ($item) {
                return $item['value'] > 0;
            })
            ->sortByDesc('value')
            ->values();

        return [
            'categoriasIniciales' => $categoriasIniciales,
            'categoriasFinales' => $categoriasFinales
        ];
    }


    /**
     * Endpoint específico para obtener máquinas de una categoría
     * 🔑 CORREGIDO
     */
    public function obtenerMaquinasCategoria(Request $request, $idCategoria)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena;

            // 🔑 Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            $resultado = $this->obtenerDatosMaquinasCategoria($idCategoria, $fechaInicio, $fechaFin, $idFaena);

            return response()->json([
                'success' => true,
                'maquinas' => $resultado['data'],
                'categoria_info' => $resultado['metadata']['categoria'],
                'resumen' => $resultado['metadata']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener máquinas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 CORREGIDO: Obtener lista de categorías
     */
    public function obtenerListaCategorias()
    {
        try {
            $categorias = DB::table('categorias_maquinas')
                ->select([
                    'id_categoria',
                    'nombre_categoria',
                    'tipo_medicion',
                    'chc'
                ])
                ->orderBy('nombre_categoria')
                ->get();

            // 🆕 CORREGIDO: Conteo usando la estructura correcta
            $categoriasConConteo = $categorias->map(function ($categoria) {
                // Contar todas las máquinas de la categoría
                $conteoTotal = DB::table('maquinas')
                    ->where('id_categoria', $categoria->id_categoria)
                    ->count();

                // Contar máquinas internas (las que están en maquinas_internas)
                $conteoInternas = DB::table('maquinas as m')
                    ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                    ->where('m.id_categoria', $categoria->id_categoria)
                    ->count();

                // Las externas son el total menos las internas
                $conteoExternas = $conteoTotal - $conteoInternas;

                return [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria,
                    'tipo_medicion' => $categoria->tipo_medicion,
                    'chc' => $categoria->chc,
                    'cantidad_maquinas' => $conteoTotal,
                    'maquinas_internas' => $conteoInternas,
                    'maquinas_externas' => $conteoExternas,
                ];
            });

            return response()->json([
                'success' => true,
                'categorias' => $categoriasConConteo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lista de categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Métodos auxiliares
     */
    private function validarFechas($fechaInicio, $fechaFin)
    {
        try {
            return $fechaInicio->lte($fechaFin);
        } catch (\Exception $e) {
            return false;
        }
    }

    private function obtenerNombreFaena($idFaena)
    {
        $faena = DB::table('faenas')->where('id_faena', $idFaena)->first();
        return $faena ? $faena->ubicacion : "Faena ID: $idFaena";
    }

    public function obtenerConsumosIndividualesCategoria(Request $request, $idCategoria)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena;
            $limit = $request->limit ?? 1000; // Límite para evitar sobrecarga
            $page = $request->page ?? 1;
            $perPage = $request->per_page ?? 100;

            // 🔑 Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            // Validar fechas
            if (!$this->validarFechas($fechaInicio, $fechaFin)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fechas inválidas. La fecha de inicio debe ser menor o igual a la fecha fin.'
                ], 400);
            }

            // Obtener información de la categoría
            $categoria = DB::table('categorias_maquinas')
                ->where('id_categoria', $idCategoria)
                ->first();

            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 400);
            }

            // 🆕 QUERY PARA CONSUMOS INDIVIDUALES (NO AGRUPADOS)
            $query = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('faenas as f', 'c.id_faena', '=', 'f.id_faena')
                ->leftJoin('users as u', 'c.id_usuario', '=', 'u.id')
                ->leftJoin('solicitantes as s', 'c.id_dotacion', '=', 's.rut')
                ->leftJoin('personal_interno as pi', function ($join) {
                    $join->on('s.rut', '=', 'pi.rut')
                        ->where('s.tipo_personal', '=', 'Interno');
                })
                ->leftJoin('personal_externo as pe', function ($join) {
                    $join->on('s.rut', '=', 'pe.rut')
                        ->where('s.tipo_personal', '=', 'Externo');
                })
                ->leftJoin('empresas_externas as ee', 'pe.id_empresa', '=', 'ee.id_empresa')
                ->where('m.id_categoria', $idCategoria)
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->whereNotNull('c.litros_consumidos')
                ->where('c.litros_consumidos', '>', 0)
                ->when($idFaena && $idFaena !== 'todas', function ($q) use ($idFaena) {
                    return $q->where('c.id_faena', $idFaena);
                })
                ->select([
                    // Información del consumo
                    'c.id_consumo',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.medicion',
                    'c.numeral_inicial',
                    'c.numeral_final',
                    'c.precio_litro',
                    'c.observacion',
                    'c.tipo_consumo',

                    // Información de la máquina
                    'm.id_maquina',
                    DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                    DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                    'm.estado',
                    DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina'),

                    // Información de la faena
                    'f.ubicacion as faena_nombre',
                    'c.id_faena',

                    // Información del solicitante
                    'c.id_dotacion',
                    's.tipo_personal',
                    'pi.nombre as interno_nombre',
                    'pi.apellido as interno_apellido',
                    'pe.nombre as externo_nombre',
                    'ee.nombre as empresa_nombre',

                    // Información del usuario
                    'u.nombre as usuario_nombre',
                    'u.apellido as usuario_apellido'
                ])
                ->orderBy('c.fecha_consumo', 'desc')
                ->orderBy('c.id_consumo', 'desc');

            // Contar total de registros para paginación
            $totalRecords = $query->count();
            $totalPages = ceil($totalRecords / $perPage);

            // Aplicar paginación
            $consumos = $query
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            // 🔄 TRANSFORMAR DATOS para compatibilidad con frontend
            $data = $consumos->map(function ($item) {
                // Determinar nombre del solicitante
                $solicitanteNombre = 'N/A';
                if ($item->tipo_personal === 'Interno' && $item->interno_nombre) {
                    $solicitanteNombre = trim($item->interno_nombre . ' ' . ($item->interno_apellido ?? ''));
                } elseif ($item->tipo_personal === 'Externo' && $item->externo_nombre) {
                    $empresaNombre = $item->empresa_nombre ? ' (' . $item->empresa_nombre . ')' : '';
                    $solicitanteNombre = $item->externo_nombre . $empresaNombre;
                }

                return [
                    'id_consumo' => $item->id_consumo,
                    'fecha_consumo' => $item->fecha_consumo,
                    'litros_consumidos' => round($item->litros_consumidos, 2),
                    'nombre_maquina' => $item->nombre_maquina,
                    'patente' => $item->patente ?? 'S/P',
                    'tipo_maquina' => $item->tipo_maquina,
                    'estado' => $item->estado,
                    'id_faena' => $item->id_faena,
                    'faena_nombre' => $item->faena_nombre,
                    'solicitante_nombre' => $solicitanteNombre,
                    'id_dotacion' => $item->id_dotacion,
                    'observacion' => $item->observacion,
                    'medicion' => $item->medicion,
                    'numeral_inicial' => $item->numeral_inicial,
                    'numeral_final' => $item->numeral_final,
                    'precio_litro' => $item->precio_litro,
                    'tipo_consumo' => $item->tipo_consumo,
                    'usuario' => trim(($item->usuario_nombre ?? '') . ' ' . ($item->usuario_apellido ?? ''))
                ];
            });

            // 📊 CALCULAR ESTADÍSTICAS
            $totalConsumo = $data->sum('litros_consumidos');
            $equiposUnicos = $data->unique('nombre_maquina')->count();
            $promedioConsumo = $data->count() > 0 ? $totalConsumo / $data->count() : 0;

            $metadata = [
                'categoria' => [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria,
                    'tipo_medicion' => $categoria->tipo_medicion
                ],
                'periodo' => [
                    'fecha_inicio' => $fechaInicio->toDateString(),
                    'fecha_fin' => $fechaFin->toDateString(),
                    'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
                ],
                'resumen' => [
                    'total_consumos_individuales' => $data->count(),
                    'total_registros_bd' => $totalRecords,
                    'equipos_unicos' => $equiposUnicos,
                    'total_consumo_litros' => round($totalConsumo, 2),
                    'promedio_por_consumo' => round($promedioConsumo, 2),
                    'consumos_internos' => $data->where('tipo_maquina', 'Interna')->count(),
                    'consumos_externos' => $data->where('tipo_maquina', 'Externa')->count()
                ],
                'paginacion' => [
                    'pagina_actual' => $page,
                    'por_pagina' => $perPage,
                    'total_registros' => $totalRecords,
                    'total_paginas' => $totalPages,
                    'desde' => ($page - 1) * $perPage + 1,
                    'hasta' => min($page * $perPage, $totalRecords)
                ],
                'filtros_aplicados' => [
                    'faena_especifica' => $idFaena ? $this->obtenerNombreFaena($idFaena) : 'Todas las faenas'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $data->values(),
                'metadata' => $metadata,
                'consumos_individuales' => $data->values(), // Alias para claridad
                'categoria_info' => $metadata['categoria'],
                'message' => "Consumos individuales de la categoría '{$categoria->nombre_categoria}' obtenidos exitosamente"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener consumos individuales: ' . $e->getMessage()
            ], 500);
        }
    }
}
