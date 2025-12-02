<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Estanque;
use App\Models\EstanqueStock;
use App\Models\Faena;
use App\Models\MovimientoPetroleo;
use App\Models\StockPetroleo;
use App\Models\VerificacionAltura;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EstanqueController extends Controller
{
    /**
     * 🔧 MÉTODO MEJORADO - Mantiene tu lógica pero con mejores validaciones y formato
     */
    public function estanquesPorFaena($id_faena)
    {
        try {
            Log::info("🔍 Buscando estanques para faena: {$id_faena}");

            // 🆕 VALIDAR QUE LA FAENA EXISTE
            $faenaExists = DB::table('faenas')->where('id_faena', $id_faena)->exists();
            if (!$faenaExists) {
                Log::warning("❌ Faena {$id_faena} no existe");
                return response()->json([
                    'success' => false,
                    'message' => "La faena con ID {$id_faena} no existe",
                    'data' => []
                ], 404);
            }

            // Obtenemos los estanques con la relación stock incluida
            $estanques = Estanque::where('id_faena', $id_faena)
                ->where('activo', 1) // 🆕 SOLO ESTANQUES ACTIVOS
                ->with('stock')  // Usamos la relación 'stock' que ya tienes definida
                ->orderBy('nombre') // 🆕 ORDENAR POR NOMBRE
                ->get();

            Log::info("📦 Estanques encontrados", [
                'faena' => $id_faena,
                'cantidad' => $estanques->count(),
                'Estanques' => $estanques->pluck('nombre', 'id_estanque')->toArray()
            ]);

            if ($estanques->isEmpty()) {
                Log::warning("⚠️ No se encontraron estanques activos para faena {$id_faena}");
                return response()->json([
                    'success' => true, // 🔧 CAMBIAR A true para que el frontend maneje mejor
                    'message' => 'No se encontraron estanques activos para esta faena.',
                    'data' => []
                ], 200); // 🔧 CAMBIAR A 200 en lugar de 404
            }

            // 🔧 TRANSFORMACIÓN MEJORADA - Asegurar tipos de datos correctos
            $estanquesConStock = $estanques->map(function ($estanque) {
                $stockActual = $estanque->stock ? (float) $estanque->stock->stock_actual : 0.0;
                $capacidad = (float) $estanque->capacidad;

                return [
                    // IDs como enteros
                    'id_estanque' => (int) $estanque->id_estanque,

                    // Información básica
                    'nombre' => (string) $estanque->nombre,
                    'tipo_estanque' => $estanque->tipo_estanque ?? 'fijo',
                    'activo' => (bool) $estanque->activo,

                    // Capacidades como flotantes
                    'capacidad' => $capacidad,
                    'altura_nominal' => (float) $estanque->altura_nominal,

                    // Stock actual
                    'stock_actual' => $stockActual,
                    'altura_actual' => $estanque->stock ? (float) $estanque->stock->altura_actual : 0.0,
                    'ultima_medicion' => $estanque->stock ? $estanque->stock->ultima_medicion : null,

                    // 🆕 CAMPOS CALCULADOS QUE ESPERA EL FRONTEND
                    'capacidad_disponible' => $capacidad - $stockActual,
                    'porcentaje_llenado' => $capacidad > 0 ? round(($stockActual / $capacidad) * 100, 2) : 0,

                    // 🆕 ESTADO PARA EL FRONTEND
                    'permite_consumo' => $stockActual > 0,
                    'nivel_critico' => $capacidad > 0 ? (($stockActual / $capacidad) * 100) < 20 : false,

                    // Timestamps
                    'created_at' => $estanque->created_at,
                    'updated_at' => $estanque->updated_at,
                ];
            });

            // 🆕 ESTADÍSTICAS PARA EL FRONTEND
            $stats = [
                'total_estanques' => $estanques->count(),
                'capacidad_total' => $estanquesConStock->sum('capacidad'),
                'stock_total' => $estanquesConStock->sum('stock_actual'),
                'estanques_con_stock' => $estanquesConStock->where('stock_actual', '>', 0)->count(),
                'estanques_criticos' => $estanquesConStock->where('nivel_critico', true)->count(),
            ];

            Log::info("✅ Respuesta preparada", [
                'faena' => $id_faena,
                'estanques_procesados' => $estanquesConStock->count(),
                'stock_total' => $stats['stock_total']
            ]);

            return response()->json([
                'success' => true,
                'data' => $estanquesConStock,
                'stats' => $stats, // 🆕 ESTADÍSTICAS ADICIONALES
                'message' => 'Estanques obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            Log::error("❌ Error al obtener estanques para faena {$id_faena}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los estanques: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * 🆕 NUEVO MÉTODO - Análisis de viabilidad para consumo (para el frontend adaptativo)
     */
    public function analizarConsumo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_faena' => 'required|exists:faenas,id_faena',
            'litros_requeridos' => 'required|numeric|min:0.1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $idFaena = $request->id_faena;
            $litrosRequeridos = (float) $request->litros_requeridos;

            // Obtener estanques con stock
            $estanques = Estanque::where('id_faena', $idFaena)
                ->where('activo', 1)
                ->with('stock')
                ->get()
                ->map(function ($est) {
                    return [
                        'id_estanque' => $est->id_estanque,
                        'nombre' => $est->nombre,
                        'capacidad' => (float) $est->capacidad,
                        'stock_actual' => $est->stock ? (float) $est->stock->stock_actual : 0.0,
                    ];
                })
                ->filter(function ($est) {
                    return $est['stock_actual'] > 0; // Solo estanques con stock
                })
                ->sortByDesc('stock_actual')
                ->values();

            if ($estanques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay estanques con stock disponible en esta faena',
                    'analisis' => [
                        'viable' => false,
                        'modo' => 'sin_stock',
                        'mensaje' => 'No hay combustible disponible'
                    ]
                ]);
            }

            $stockTotal = $estanques->sum('stock_actual');

            // 🎯 ANÁLISIS DE VIABILIDAD

            // Buscar estanque único suficiente
            $estanqueSuficiente = $estanques->firstWhere('stock_actual', '>=', $litrosRequeridos);

            if ($estanqueSuficiente) {
                return response()->json([
                    'success' => true,
                    'analisis' => [
                        'viable' => true,
                        'modo' => 'simple',
                        'estanque' => $estanqueSuficiente,
                        'mensaje' => "✅ Stock suficiente en {$estanqueSuficiente['nombre']}",
                        'stock_disponible' => $estanqueSuficiente['stock_actual']
                    ],
                    'estanques_disponibles' => $estanques
                ]);
            }

            // Verificar si es posible con múltiples estanques
            if ($stockTotal >= $litrosRequeridos) {
                return response()->json([
                    'success' => true,
                    'analisis' => [
                        'viable' => true,
                        'modo' => 'multiple',
                        'estanques_necesarios' => $estanques->toArray(),
                        'mensaje' => "⚠️ Requiere múltiples estanques (Total: {$stockTotal}L)",
                        'stock_total' => $stockTotal
                    ],
                    'estanques_disponibles' => $estanques
                ]);
            }

            // Stock insuficiente
            return response()->json([
                'success' => false,
                'analisis' => [
                    'viable' => false,
                    'modo' => 'insuficiente',
                    'mensaje' => "❌ Stock insuficiente (Disponible: {$stockTotal}L, Necesario: {$litrosRequeridos}L)",
                    'stock_total' => $stockTotal,
                    'deficit' => $litrosRequeridos - $stockTotal
                ],
                'estanques_disponibles' => $estanques
            ]);
        } catch (\Exception $e) {
            Log::error('Error analizando consumo', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al analizar consumo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔧 MANTENER TU MÉTODO ORIGINAL - Solo con mejores logs
     */
    public function calcularLitrosPetroleo(Request $request)
    {
        Log::info('🧮 Calculando litros de petróleo', ['request' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'id_faena' => 'required|exists:faenas,id_faena',
            'tipo_movimiento' => 'required|in:ingreso,consumo',
            'alturas' => 'required|array',
            'alturas.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas.*.altura' => 'required|numeric|min:0',
            'id_usuario' => 'required|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $alturas = $request->alturas;
            $idFaena = $request->id_faena;
            $tipoMovimiento = $request->tipo_movimiento;

            // Obtener todos los estanques para la faena seleccionada
            $estanques = Estanque::whereIn('id_estanque', array_column($alturas, 'id_estanque'))
                ->get()->keyBy('id_estanque');

            // Verificar que todos los estanques pertenezcan a la faena indicada
            foreach ($alturas as $item) {
                $estanque = $estanques[$item['id_estanque']] ?? null;
                if (!$estanque || $estanque->id_faena != $idFaena) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El estanque #' . $item['id_estanque'] . ' no pertenece a la faena seleccionada'
                    ], 400);
                }
            }

            $litrosTotales = 0;
            $stockAnteriorTotal = 0;
            $resultadosPorEstanque = [];

            // Calcular litros para cada estanque sin guardar datos
            foreach ($alturas as $item) {
                $idEstanque = $item['id_estanque'];
                $alturaMedida = $item['altura'];
                $estanque = $estanques[$idEstanque];

                // Verificar que el estanque tiene altura_nominal y capacidad definidas
                if (!$estanque->altura_nominal || !$estanque->capacidad) {
                    return response()->json([
                        'success' => false,
                        'message' => "El estanque '{$estanque->nombre}' no tiene definida su altura nominal o capacidad"
                    ], 400);
                }

                // Calcular volumen en litros según la fórmula
                $volumenCalculado = ($alturaMedida / $estanque->altura_nominal) * $estanque->capacidad;

                // Obtener el stock actual del estanque
                $ultimaMedicion = EstanqueStock::where('id_estanque', $idEstanque)->first();
                $stockActual = $ultimaMedicion ? $ultimaMedicion->stock_actual : 0;
                $alturaActual = $ultimaMedicion ? $ultimaMedicion->altura_actual : 0;
                $stockAnteriorTotal += $stockActual;

                // Si es un ingreso, verificamos que no exceda la capacidad
                if ($tipoMovimiento === 'ingreso') {
                    // Verificar si el volumen calculado excede la capacidad
                    if ($volumenCalculado > $estanque->capacidad) {
                        return response()->json([
                            'success' => false,
                            'message' => "El estanque '{$estanque->nombre}' excedería su capacidad máxima con esta altura"
                        ], 400);
                    }
                }

                // Validación de capacidad excedida
                if ($volumenCalculado > $estanque->capacidad) {
                    return response()->json([
                        'success' => false,
                        'message' => "El estanque '{$estanque->nombre}' excedería su capacidad máxima con esta altura"
                    ], 400);
                }

                $litrosTotales += $volumenCalculado;

                // Obtener la última medición para este estanque (solo para referencia)
                $ultimaMedicion = EstanqueStock::where('id_estanque', $idEstanque)->first();

                $alturaAnterior = $ultimaMedicion ? $ultimaMedicion->altura_actual : 0;
                $diferenciaAltura = $alturaMedida - $alturaAnterior;

                $resultadosPorEstanque[] = [
                    'id_estanque' => $idEstanque,
                    'nombre_estanque' => $estanque->nombre,
                    'altura_anterior' => $alturaAnterior,
                    'altura_nueva' => $alturaMedida,
                    'diferencia_altura' => $diferenciaAltura,
                    'litros_calculados' => $volumenCalculado,
                    'stock_anterior' => $stockActual,
                    'diferencia_litros' => $volumenCalculado - $stockActual,
                    'capacidad' => $estanque->capacidad
                ];
            }

            // Calcular la diferencia respecto al stock anterior
            $litrosIngresados = $litrosTotales - $stockAnteriorTotal;

            // Obtener stock actual (solo para referencia)
            $stockActual = StockPetroleo::where('id_faena', $idFaena)
                ->value('stock_actual') ?? 0;

            Log::info('✅ Cálculo completado', [
                'litros_totales' => $litrosTotales,
                'stock_anterior' => $stockAnteriorTotal,
                'litros_ingresados' => $litrosIngresados
            ]);

            return response()->json([
                'success' => true,
                'tipo_movimiento' => $tipoMovimiento,
                'litros_totales' => $litrosTotales,
                'stock_anterior_total' => $stockAnteriorTotal,
                'litros_ingresados' => $litrosIngresados,
                'stock_actual' => $stockActual,
                'stock_estimado' => $tipoMovimiento === 'ingreso' ? $stockActual + $litrosIngresados : $stockActual - $litrosIngresados,
                'detalle_estanques' => $resultadosPorEstanque
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error en calcularLitrosPetroleo: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular los litros de petróleo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔧 MANTENER TU MÉTODO ORIGINAL - Solo con mejor formato de respuesta
     */
    public function capacidadDisponible($idFaena)
    {
        try {
            Log::info("📊 Calculando capacidad disponible para faena: {$idFaena}");

            // Obtener todos los estanques de la faena
            $estanques = Estanque::where('id_faena', $idFaena)
                ->where('activo', 1)
                ->get();

            if ($estanques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron estanques activos para esta faena.'
                ], 404);
            }

            $capacidadTotal = 0;
            $stockActual = 0;
            $detalleEstanques = [];

            foreach ($estanques as $estanque) {
                $capacidadTotal += $estanque->capacidad;

                // Obtener el stock actual de este estanque
                $estanqueStock = EstanqueStock::where('id_estanque', $estanque->id_estanque)->first();
                $stockEstanque = $estanqueStock ? $estanqueStock->stock_actual : 0;
                $stockActual += $stockEstanque;

                $detalleEstanques[] = [
                    'id_estanque' => $estanque->id_estanque,
                    'nombre' => $estanque->nombre,
                    'capacidad' => (float) $estanque->capacidad,
                    'stock_actual' => (float) $stockEstanque,
                    'disponible' => (float) ($estanque->capacidad - $stockEstanque),
                    'porcentaje_llenado' => $estanque->capacidad > 0 ? round(($stockEstanque / $estanque->capacidad) * 100, 2) : 0
                ];
            }

            $capacidadDisponible = $capacidadTotal - $stockActual;

            return response()->json([
                'success' => true,
                'data' => [
                    'capacidad_total' => (float) $capacidadTotal,
                    'stock_actual' => (float) $stockActual,
                    'capacidad_disponible' => (float) $capacidadDisponible,
                    'porcentaje_utilizacion' => $capacidadTotal > 0 ? round(($stockActual / $capacidadTotal) * 100, 2) : 0,
                    'detalle_estanques' => $detalleEstanques
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener capacidad disponible', [
                'faena' => $idFaena,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al calcular la capacidad disponible: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener solo los estanques fijos de una faena específica
     * 
     * @param int $id_faena
     * @return \Illuminate\Http\JsonResponse
     */
    public function estanquesFijoPorFaena($id_faena)
    {
        try {
            // Obtenemos los estanques FIJOS (manuales y automáticos) con la relación stock incluida
            $estanques = Estanque::where('id_faena', $id_faena)
                ->whereIn('tipo_estanque', ['fijo', 'fijo_automatico'])  // Incluir ambos tipos de estanques fijos
                ->where('activo', 1)  // Solo estanques activos
                ->with('stock')  // Incluir relación de stock
                ->get();

            Log::info("Estanques fijos obtenidos para faena {$id_faena}", [
                'cantidad' => $estanques->count(),
                'estanques' => $estanques->pluck('nombre', 'id_estanque')->toArray()
            ]);

            if ($estanques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron estanques fijos para esta faena.'
                ], 404);
            }

            // Transformamos los datos para incluir el stock_actual directamente
            $estanquesConStock = $estanques->map(function ($estanque) {
                $estanqueArray = $estanque->toArray();

                // Agregar información del stock actual
                $estanqueArray['stock_actual'] = $estanque->stock ? $estanque->stock->stock_actual : 0;
                $estanqueArray['altura_actual'] = $estanque->stock ? $estanque->stock->altura_actual : null;
                $estanqueArray['ultima_medicion'] = $estanque->stock ? $estanque->stock->ultima_medicion : null;

                // Calcular porcentaje de llenado
                $porcentajeLlenado = $estanque->capacidad > 0
                    ? ($estanqueArray['stock_actual'] / $estanque->capacidad) * 100
                    : 0;
                $estanqueArray['porcentaje_llenado'] = round($porcentajeLlenado, 2);

                // Capacidad disponible
                $estanqueArray['capacidad_disponible'] = $estanque->capacidad - $estanqueArray['stock_actual'];

                return $estanqueArray;
            });

            // Calcular estadísticas generales de los estanques fijos
            $estadisticas = [
                'total_estanques' => $estanques->count(),
                'capacidad_total' => $estanques->sum('capacidad'),
                'stock_total' => $estanquesConStock->sum('stock_actual'),
                'capacidad_disponible_total' => $estanquesConStock->sum('capacidad_disponible'),
                'porcentaje_llenado_promedio' => $estanquesConStock->avg('porcentaje_llenado')
            ];

            return response()->json([
                'success' => true,
                'data' => $estanquesConStock,
                'estadisticas' => $estadisticas,
                'message' => "Se encontraron {$estanques->count()} estanques fijos para la faena."
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener estanques fijos de faena', [
                'id_faena' => $id_faena,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los estanques fijos.',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Obtener estanques móviles de una faena
     */
    public function getEstanquesMoviles($idFaena)
    {
        Log::info("Obteniendo ");
        try {
            // Validar que la faena exista (asumiendo modelo Faena)
            if (!Faena::find($idFaena)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La faena no existe.'
                ], 404);
            }

            Log::info("Obteniendo estanques móviles para faena: {$idFaena}");

            // Obtener estanques móviles asociados a la faena
            $estanquesMoviles = Estanque::where('id_faena', $idFaena)
                ->where('tipo_estanque', 'movil')
                ->select('id_estanque', 'nombre', 'capacidad')
                ->get();

            if ($estanquesMoviles->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No hay estanques móviles registrados en esta faena.',
                    'data' => [],
                    'total' => 0
                ]);
            }

            // Agregar stock actual y capacidad disponible
            $estanquesConStock = $estanquesMoviles->map(function ($estanque) {
                $stock = EstanqueStock::where('id_estanque', $estanque->id_estanque)->first();
                $estanque->stock_actual = $stock ? $stock->stock_actual : 0;
                $estanque->capacidad_disponible = $estanque->capacidad - $estanque->stock_actual;
                return $estanque;
            });

            return response()->json([
                'success' => true,
                'message' => 'Estanques móviles obtenidos correctamente.',
                'data' => $estanquesConStock,
                'total' => $estanquesConStock->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener estanques móviles', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error inesperado al obtener los estanques móviles.'
            ], 500);
        }
    }

    // ============================================
    // MÉTODOS CRUD PARA ADMINISTRACIÓN DE ESTANQUES
    // ============================================

    /**
     * Obtener todos los estanques (para administración)
     * Incluye estanques activos e inactivos de todas las faenas
     */
    public function index()
    {
        try {
            $estanques = Estanque::with(['faena', 'stock'])
                ->orderBy('id_faena')
                ->orderBy('nombre')
                ->get()
                ->map(function ($estanque) {
                    $stockActual = $estanque->stock ? (float) $estanque->stock->stock_actual : 0.0;
                    $capacidad = (float) $estanque->capacidad;

                    return [
                        'id_estanque' => (int) $estanque->id_estanque,
                        'nombre' => $estanque->nombre,
                        'tipo_estanque' => $estanque->tipo_estanque,
                        'capacidad' => $capacidad,
                        'altura_nominal' => (float) $estanque->altura_nominal,
                        'id_faena' => (int) $estanque->id_faena,
                        'nombre_faena' => $estanque->faena ? $estanque->faena->nombre_faena : 'Sin faena',
                        'activo' => (bool) $estanque->activo,
                        'stock_actual' => $stockActual,
                        'porcentaje_llenado' => $capacidad > 0 ? round(($stockActual / $capacidad) * 100, 2) : 0,
                        'created_at' => $estanque->created_at,
                        'updated_at' => $estanque->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $estanques,
                'total' => $estanques->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener estanques para administración', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los estanques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un estanque específico por ID
     */
    public function show($id)
    {
        try {
            $estanque = Estanque::with(['faena', 'stock'])->find($id);

            if (!$estanque) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estanque no encontrado'
                ], 404);
            }

            $stockActual = $estanque->stock ? (float) $estanque->stock->stock_actual : 0.0;
            $capacidad = (float) $estanque->capacidad;

            $data = [
                'id_estanque' => (int) $estanque->id_estanque,
                'nombre' => $estanque->nombre,
                'tipo_estanque' => $estanque->tipo_estanque,
                'capacidad' => $capacidad,
                'altura_nominal' => (float) $estanque->altura_nominal,
                'id_faena' => (int) $estanque->id_faena,
                'nombre_faena' => $estanque->faena ? $estanque->faena->nombre_faena : null,
                'activo' => (bool) $estanque->activo,
                'stock_actual' => $stockActual,
                'altura_actual' => $estanque->stock ? (float) $estanque->stock->altura_actual : 0.0,
                'ultima_medicion' => $estanque->stock ? $estanque->stock->ultima_medicion : null,
                'porcentaje_llenado' => $capacidad > 0 ? round(($stockActual / $capacidad) * 100, 2) : 0,
                'capacidad_disponible' => $capacidad - $stockActual,
                'created_at' => $estanque->created_at,
                'updated_at' => $estanque->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error("Error al obtener estanque {$id}", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el estanque: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo estanque
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo_estanque' => 'required|in:fijo,movil,fijo_automatico',
            'capacidad' => 'required|numeric|min:0',
            'altura_nominal' => 'required|numeric|min:0',
            'id_faena' => 'required|exists:faenas,id_faena',
            'activo' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Crear el estanque
            $estanque = Estanque::create([
                'nombre' => $request->nombre,
                'tipo_estanque' => $request->tipo_estanque,
                'capacidad' => $request->capacidad,
                'altura_nominal' => $request->altura_nominal,
                'id_faena' => $request->id_faena,
                'activo' => $request->activo ?? true
            ]);

            // Crear el registro de stock inicial en 0
            EstanqueStock::create([
                'id_estanque' => $estanque->id_estanque,
                'stock_actual' => 0,
                'altura_actual' => 0,
                'ultima_medicion' => now()
            ]);

            DB::commit();

            Log::info("Estanque creado exitosamente", [
                'id_estanque' => $estanque->id_estanque,
                'nombre' => $estanque->nombre
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estanque creado exitosamente',
                'data' => $estanque->load('faena')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear estanque', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el estanque: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un estanque existente
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'tipo_estanque' => 'required|in:fijo,movil,fijo_automatico',
            'capacidad' => 'required|numeric|min:0',
            'altura_nominal' => 'required|numeric|min:0',
            'id_faena' => 'required|exists:faenas,id_faena',
            'activo' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $estanque = Estanque::find($id);

            if (!$estanque) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estanque no encontrado'
                ], 404);
            }

            // Verificar si el stock actual excede la nueva capacidad
            $stockActual = $estanque->stock ? $estanque->stock->stock_actual : 0;
            if ($request->capacidad < $stockActual) {
                return response()->json([
                    'success' => false,
                    'message' => "La nueva capacidad ({$request->capacidad}L) no puede ser menor al stock actual ({$stockActual}L)"
                ], 400);
            }

            $estanque->update([
                'nombre' => $request->nombre,
                'tipo_estanque' => $request->tipo_estanque,
                'capacidad' => $request->capacidad,
                'altura_nominal' => $request->altura_nominal,
                'id_faena' => $request->id_faena,
                'activo' => $request->activo ?? $estanque->activo
            ]);

            Log::info("Estanque actualizado", [
                'id_estanque' => $estanque->id_estanque,
                'cambios' => $request->all()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estanque actualizado exitosamente',
                'data' => $estanque->load('faena')
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar estanque {$id}", [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el estanque: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar (desactivar) un estanque
     * No se elimina físicamente para mantener integridad referencial
     */
    public function destroy($id)
    {
        try {
            $estanque = Estanque::find($id);

            if (!$estanque) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estanque no encontrado'
                ], 404);
            }

            // Verificar si tiene stock antes de desactivar
            $stockActual = $estanque->stock ? $estanque->stock->stock_actual : 0;
            if ($stockActual > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "No se puede desactivar el estanque '{$estanque->nombre}' porque tiene stock actual ({$stockActual}L). Debe vaciarlo primero."
                ], 400);
            }

            // Desactivar en lugar de eliminar
            $estanque->update(['activo' => false]);

            Log::info("Estanque desactivado", [
                'id_estanque' => $estanque->id_estanque,
                'nombre' => $estanque->nombre
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estanque desactivado exitosamente'
            ]);
        } catch (\Exception $e) {
            Log::error("Error al desactivar estanque {$id}", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al desactivar el estanque: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activar un estanque desactivado
     */
    public function activate($id)
    {
        try {
            $estanque = Estanque::find($id);

            if (!$estanque) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estanque no encontrado'
                ], 404);
            }

            $estanque->update(['activo' => true]);

            Log::info("Estanque activado", [
                'id_estanque' => $estanque->id_estanque,
                'nombre' => $estanque->nombre
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estanque activado exitosamente',
                'data' => $estanque
            ]);
        } catch (\Exception $e) {
            Log::error("Error al activar estanque {$id}", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al activar el estanque: ' . $e->getMessage()
            ], 500);
        }
    }
}
