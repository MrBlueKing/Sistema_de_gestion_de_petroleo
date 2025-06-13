<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\TrasvasijeMovilAFijo;
use App\Models\TrasvasijeFijoAMovil;
use App\Models\Estanque;
use App\Models\EstanqueStock;
use App\Models\User;
use App\Models\Faena;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
class TrasvasijeController extends Controller
{
    // ========================================
    // TRASVASIJE MÓVIL → FIJO (con medición de alturas)
    // ========================================

    /**
     * Registrar trasvasije de estanque móvil a fijo
     * POST /api/trasvasijes/movil-a-fijo
     */
    public function registrarMovilAFijo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_usuario' => 'required|exists:users,id',
            'id_estanque_movil' => 'required|exists:estanques,id_estanque',
            'id_estanque_fijo' => 'required|exists:estanques,id_estanque',
            'id_faena' => 'required|exists:faenas,id_faena',

            // Datos del móvil
            'litros_movil_inicial' => 'required|numeric|min:0',
            'litros_movil_final' => 'required|numeric|min:0',

            // Medición de alturas del fijo
            'altura_fijo_inicial' => 'required|numeric|min:0',
            'altura_fijo_final' => 'required|numeric|min:0',

            'observaciones' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 📋 VALIDACIONES BUSINESS LOGIC
            $estanqueMovil = Estanque::find($request->id_estanque_movil);
            $estanqueFijo = Estanque::find($request->id_estanque_fijo);

            // Validar tipos de estanque
            if ($estanqueMovil->tipo_estanque !== 'movil') {
                return response()->json([
                    'success' => false,
                    'message' => 'El estanque origen debe ser de tipo móvil'
                ], 400);
            }

            if ($estanqueFijo->tipo_estanque !== 'fijo') {
                return response()->json([
                    'success' => false,
                    'message' => 'El estanque destino debe ser de tipo fijo'
                ], 400);
            }

            // Validar que ambos estanques pertenezcan a la misma faena
            if ($estanqueMovil->id_faena !== $request->id_faena || $estanqueFijo->id_faena !== $request->id_faena) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ambos estanques deben pertenecer a la faena seleccionada'
                ], 400);
            }

            // 🧮 CÁLCULOS AUTOMÁTICOS
            $litrosTransvasijados = $request->litros_movil_inicial - $request->litros_movil_final;

            // Validar que los litros trasvasijados sean positivos
            if ($litrosTransvasijados <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Los litros iniciales del móvil deben ser mayores que los finales'
                ], 400);
            }

            // Validar que la altura del fijo haya aumentado
            if ($request->altura_fijo_final <= $request->altura_fijo_inicial) {
                return response()->json([
                    'success' => false,
                    'message' => 'La altura final del estanque fijo debe ser mayor que la inicial'
                ], 400);
            }

            // Obtener stocks actuales
            $stockMovil = EstanqueStock::where('id_estanque', $request->id_estanque_movil)->first();
            $stockFijo = EstanqueStock::where('id_estanque', $request->id_estanque_fijo)->first();

            $stockInicialMovil = $stockMovil ? $stockMovil->stock_actual : 0;
            $stockInicialFijo = $stockFijo ? $stockFijo->stock_actual : 0;

            // Validar stock suficiente en móvil
            if ($stockInicialMovil < $litrosTransvasijados) {
                return response()->json([
                    'success' => false,
                    'message' => "Stock insuficiente en estanque móvil. Stock actual: {$stockInicialMovil}L, requerido: {$litrosTransvasijados}L"
                ], 400);
            }

            // Calcular stocks finales
            $stockFinalMovil = $stockInicialMovil - $litrosTransvasijados;
            $stockFinalFijo = $stockInicialFijo + $litrosTransvasijados;

            // Validar capacidad del estanque fijo
            if ($stockFinalFijo > $estanqueFijo->capacidad) {
                return response()->json([
                    'success' => false,
                    'message' => "Capacidad insuficiente en estanque fijo. Capacidad: {$estanqueFijo->capacidad}L, stock resultante: {$stockFinalFijo}L"
                ], 400);
            }

            // 📝 CREAR REGISTRO DE TRASVASIJE
            $trasvasije = TrasvasijeMovilAFijo::create([
                'id_usuario' => $request->id_usuario,
                'id_estanque_movil' => $request->id_estanque_movil,
                'id_estanque_fijo' => $request->id_estanque_fijo,
                'id_faena' => $request->id_faena,
                'fecha_trasvasije' => now(),

                // Datos del móvil
                'litros_movil_inicial' => $request->litros_movil_inicial,
                'litros_movil_final' => $request->litros_movil_final,
                'litros_trasvasijados' => $litrosTransvasijados,

                // Medición del fijo
                'altura_fijo_inicial' => $request->altura_fijo_inicial,
                'altura_fijo_final' => $request->altura_fijo_final,
                // litros_calculados_altura y diferencia_medicion se calculan por trigger

                // Stocks
                'stock_inicial_movil' => $stockInicialMovil,
                'stock_final_movil' => $stockFinalMovil,
                'stock_inicial_fijo' => $stockInicialFijo,
                'stock_final_fijo' => $stockFinalFijo,

                'observaciones' => $request->observaciones,
                'verificado' => false // Por defecto no verificado
            ]);

            // El trigger automáticamente actualiza los stocks, pero lo haremos manual para mayor control
            $this->actualizarStockEstanque($request->id_estanque_movil, $stockFinalMovil, null);
            $this->actualizarStockEstanque($request->id_estanque_fijo, $stockFinalFijo, $request->altura_fijo_final);

            // Recargar para obtener los campos calculados por trigger
            $trasvasije->refresh();

            DB::commit();

            Log::info('✅ Trasvasije móvil→fijo registrado', [
                'id_trasvasije' => $trasvasije->id_trasvasije,
                'estanque_movil' => $estanqueMovil->nombre,
                'estanque_fijo' => $estanqueFijo->nombre,
                'litros_trasvasijados' => $litrosTransvasijados,
                'diferencia_medicion' => $trasvasije->diferencia_medicion
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Trasvasije registrado exitosamente',
                'data' => [
                    'trasvasije' => $trasvasije,
                    'estanques' => [
                        'movil' => [
                            'nombre' => $estanqueMovil->nombre,
                            'stock_anterior' => $stockInicialMovil,
                            'stock_actual' => $stockFinalMovil
                        ],
                        'fijo' => [
                            'nombre' => $estanqueFijo->nombre,
                            'stock_anterior' => $stockInicialFijo,
                            'stock_actual' => $stockFinalFijo
                        ]
                    ],
                    'diferencia_medicion' => $trasvasije->diferencia_medicion ?? 0,
                    'requiere_verificacion' => !$trasvasije->verificado && abs($trasvasije->diferencia_medicion ?? 0) > 5
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Error al registrar trasvasije móvil→fijo', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar trasvasije: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========================================
    // TRASVASIJE FIJO → MÓVIL (con numerales de bomba)
    // ========================================

    /**
     * Registrar trasvasije de estanque fijo a móvil
     * POST /api/trasvasijes/fijo-a-movil
     */
    public function registrarFijoAMovil(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_usuario' => 'required|exists:users,id',
            'id_estanque_fijo' => 'required|exists:estanques,id_estanque',
            'id_estanque_movil' => 'required|exists:estanques,id_estanque',
            'id_faena' => 'required|exists:faenas,id_faena',

            // Numerales de bomba
            'numeral_inicial' => 'required|numeric|min:0',
            'numeral_final' => 'required|numeric|min:0',

            'observaciones' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 📋 VALIDACIONES BUSINESS LOGIC
            $estanqueFijo = Estanque::find($request->id_estanque_fijo);
            $estanqueMovil = Estanque::find($request->id_estanque_movil);

            // Validar tipos de estanque
            if ($estanqueFijo->tipo_estanque !== 'fijo') {
                return response()->json([
                    'success' => false,
                    'message' => 'El estanque origen debe ser de tipo fijo'
                ], 400);
            }

            if ($estanqueMovil->tipo_estanque !== 'movil') {
                return response()->json([
                    'success' => false,
                    'message' => 'El estanque destino debe ser de tipo móvil'
                ], 400);
            }

            // Validar que ambos estanques pertenezcan a la misma faena
            if ($estanqueFijo->id_faena !== $request->id_faena || $estanqueMovil->id_faena !== $request->id_faena) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ambos estanques deben pertenecer a la faena seleccionada'
                ], 400);
            }

            // 🧮 CÁLCULOS AUTOMÁTICOS
            $litrosBombeados = $request->numeral_final - $request->numeral_inicial;

            // Validar que los litros bombeados sean positivos
            if ($litrosBombeados <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'El numeral final debe ser mayor que el inicial'
                ], 400);
            }

            // Obtener stocks actuales
            $stockFijo = EstanqueStock::where('id_estanque', $request->id_estanque_fijo)->first();
            $stockMovil = EstanqueStock::where('id_estanque', $request->id_estanque_movil)->first();

            $stockInicialFijo = $stockFijo ? $stockFijo->stock_actual : 0;
            $stockInicialMovil = $stockMovil ? $stockMovil->stock_actual : 0;

            // Validar stock suficiente en fijo
            if ($stockInicialFijo < $litrosBombeados) {
                return response()->json([
                    'success' => false,
                    'message' => "Stock insuficiente en estanque fijo. Stock actual: {$stockInicialFijo}L, requerido: {$litrosBombeados}L"
                ], 400);
            }

            // Calcular stocks finales
            $stockFinalFijo = $stockInicialFijo - $litrosBombeados;
            $stockFinalMovil = $stockInicialMovil + $litrosBombeados;

            // Validar capacidad del estanque móvil
            if ($stockFinalMovil > $estanqueMovil->capacidad) {
                return response()->json([
                    'success' => false,
                    'message' => "Capacidad insuficiente en estanque móvil. Capacidad: {$estanqueMovil->capacidad}L, stock resultante: {$stockFinalMovil}L"
                ], 400);
            }

            // 📝 CREAR REGISTRO DE TRASVASIJE
            $trasvasije = TrasvasijeFijoAMovil::create([
                'id_usuario' => $request->id_usuario,
                'id_estanque_fijo' => $request->id_estanque_fijo,
                'id_estanque_movil' => $request->id_estanque_movil,
                'id_faena' => $request->id_faena,
                'fecha_trasvasije' => now(),

                // Numerales de bomba
                'numeral_inicial' => $request->numeral_inicial,
                'numeral_final' => $request->numeral_final,
                'litros_bombeados' => $litrosBombeados,

                // Stocks
                'stock_inicial_fijo' => $stockInicialFijo,
                'stock_final_fijo' => $stockFinalFijo,
                'stock_inicial_movil' => $stockInicialMovil,
                'stock_final_movil' => $stockFinalMovil,

                'observaciones' => $request->observaciones
            ]);

            // Actualizar stocks (aunque el trigger también lo hace)
            $this->actualizarStockEstanque($request->id_estanque_fijo, $stockFinalFijo, null);
            $this->actualizarStockEstanque($request->id_estanque_movil, $stockFinalMovil, null);

            DB::commit();

            Log::info('✅ Trasvasije fijo→móvil registrado', [
                'id_trasvasije' => $trasvasije->id_trasvasije,
                'estanque_fijo' => $estanqueFijo->nombre,
                'estanque_movil' => $estanqueMovil->nombre,
                'litros_bombeados' => $litrosBombeados
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Trasvasije registrado exitosamente',
                'data' => [
                    'trasvasije' => $trasvasije,
                    'estanques' => [
                        'fijo' => [
                            'nombre' => $estanqueFijo->nombre,
                            'stock_anterior' => $stockInicialFijo,
                            'stock_actual' => $stockFinalFijo
                        ],
                        'movil' => [
                            'nombre' => $estanqueMovil->nombre,
                            'stock_anterior' => $stockInicialMovil,
                            'stock_actual' => $stockFinalMovil
                        ]
                    ]
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Error al registrar trasvasije fijo→móvil', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar trasvasije: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========================================
    // CONSULTAS Y LISTADOS
    // ========================================

    /**
     * Listar trasvasijes por faena
     * GET /api/trasvasijes
     */
    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_faena' => 'nullable|exists:faenas,id_faena',
                'tipo' => 'nullable|in:movil_a_fijo,fijo_a_movil,todos',
                'fecha_desde' => 'nullable|date',
                'fecha_hasta' => 'nullable|date',
                'per_page' => 'nullable|integer|min:1|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $perPage = $request->get('per_page', 15);
            $trasvasijes = collect();

            // Obtener trasvasijes según el tipo solicitado
            if (!$request->tipo || $request->tipo === 'todos' || $request->tipo === 'movil_a_fijo') {
                $movilAFijo = TrasvasijeMovilAFijo::with([
                    'usuario:id,nombre,apellido',
                    'estanqueMovil:id_estanque,nombre,tipo_estanque',
                    'estanqueFijo:id_estanque,nombre,tipo_estanque',
                    'faena:id_faena,ubicacion'
                ]);

                if ($request->id_faena) {
                    $movilAFijo->where('id_faena', $request->id_faena);
                }

                if ($request->fecha_desde) {
                    $movilAFijo->whereDate('fecha_trasvasije', '>=', $request->fecha_desde);
                }

                if ($request->fecha_hasta) {
                    $movilAFijo->whereDate('fecha_trasvasije', '<=', $request->fecha_hasta);
                }

                $trasvasijesToMovilAFijo = $movilAFijo->get()->map(function ($trasvasije) {
                    return [
                        'id' => $trasvasije->id_trasvasije,
                        'tipo' => 'movil_a_fijo',
                        'fecha' => $trasvasije->fecha_trasvasije,
                        'usuario' => $trasvasije->usuario->nombre . ' ' . $trasvasije->usuario->apellido,
                        'estanque_origen' => $trasvasije->estanqueMovil->nombre,
                        'estanque_destino' => $trasvasije->estanqueFijo->nombre,
                        'litros' => $trasvasije->litros_trasvasijados,
                        'diferencia_medicion' => $trasvasije->diferencia_medicion,
                        'verificado' => $trasvasije->verificado,
                        'observaciones' => $trasvasije->observaciones,
                        'faena' => $trasvasije->faena->ubicacion
                    ];
                });

                $trasvasijes = $trasvasijes->merge($trasvasijesToMovilAFijo);
            }

            if (!$request->tipo || $request->tipo === 'todos' || $request->tipo === 'fijo_a_movil') {
                $fijoAMovil = TrasvasijeFijoAMovil::with([
                    'usuario:id,nombre,apellido',
                    'estanqueFijo:id_estanque,nombre,tipo_estanque',
                    'estanqueMovil:id_estanque,nombre,tipo_estanque',
                    'faena:id_faena,ubicacion'
                ]);

                if ($request->id_faena) {
                    $fijoAMovil->where('id_faena', $request->id_faena);
                }

                if ($request->fecha_desde) {
                    $fijoAMovil->whereDate('fecha_trasvasije', '>=', $request->fecha_desde);
                }

                if ($request->fecha_hasta) {
                    $fijoAMovil->whereDate('fecha_trasvasije', '<=', $request->fecha_hasta);
                }

                $trasvasijesFijoAMovil = $fijoAMovil->get()->map(function ($trasvasije) {
                    return [
                        'id' => $trasvasije->id_trasvasije,
                        'tipo' => 'fijo_a_movil',
                        'fecha' => $trasvasije->fecha_trasvasije,
                        'usuario' => $trasvasije->usuario->nombre . ' ' . $trasvasije->usuario->apellido,
                        'estanque_origen' => $trasvasije->estanqueFijo->nombre,
                        'estanque_destino' => $trasvasije->estanqueMovil->nombre,
                        'litros' => $trasvasije->litros_bombeados,
                        'diferencia_medicion' => null, // No aplica para fijo→móvil
                        'verificado' => true, // Siempre verificado por numerales
                        'observaciones' => $trasvasije->observaciones,
                        'faena' => $trasvasije->faena->ubicacion
                    ];
                });

                $trasvasijes = $trasvasijes->merge($trasvasijesFijoAMovil);
            }

            // Ordenar por fecha más reciente
            $trasvasijes = $trasvasijes->sortByDesc('fecha');

            // Paginación manual
            $total = $trasvasijes->count();
            $page = $request->get('page', 1);
            $offset = ($page - 1) * $perPage;
            $items = $trasvasijes->slice($offset, $perPage)->values();

            return response()->json([
                'success' => true,
                'data' => $items,
                'meta' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => ceil($total / $perPage),
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $total)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al listar trasvasijes', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener trasvasijes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar trasvasije móvil→fijo
     * POST /api/trasvasijes/movil-a-fijo/{id}/verificar
     */
    public function verificarMovilAFijo(Request $request, $id)
    {
        try {
            $trasvasije = TrasvasijeMovilAFijo::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'verificado' => 'required|boolean',
                'observaciones_verificacion' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trasvasije->verificado = $request->verificado;

            if ($request->observaciones_verificacion) {
                $trasvasije->observaciones = ($trasvasije->observaciones ? $trasvasije->observaciones . ' | ' : '') .
                    'Verificación: ' . $request->observaciones_verificacion;
            }

            $trasvasije->save();

            return response()->json([
                'success' => true,
                'message' => 'Trasvasije verificado correctamente',
                'data' => $trasvasije
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al verificar trasvasije', [
                'error' => $e->getMessage(),
                'id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al verificar trasvasije: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas de trasvasijes
     * GET /api/trasvasijes/estadisticas
     */
    public function estadisticas(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_faena' => 'nullable|exists:faenas,id_faena',
                'fecha_desde' => 'nullable|date',
                'fecha_hasta' => 'nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Construir consultas base
            $queryMovilAFijo = TrasvasijeMovilAFijo::query();
            $queryFijoAMovil = TrasvasijeFijoAMovil::query();

            if ($request->id_faena) {
                $queryMovilAFijo->where('id_faena', $request->id_faena);
                $queryFijoAMovil->where('id_faena', $request->id_faena);
            }

            if ($request->fecha_desde) {
                $queryMovilAFijo->whereDate('fecha_trasvasije', '>=', $request->fecha_desde);
                $queryFijoAMovil->whereDate('fecha_trasvasije', '>=', $request->fecha_desde);
            }

            if ($request->fecha_hasta) {
                $queryMovilAFijo->whereDate('fecha_trasvasije', '<=', $request->fecha_hasta);
                $queryFijoAMovil->whereDate('fecha_trasvasije', '<=', $request->fecha_hasta);
            }

            // Estadísticas generales
            $totalMovilAFijo = $queryMovilAFijo->count();
            $totalFijoAMovil = $queryFijoAMovil->count();
            $litrosTotalMovilAFijo = $queryMovilAFijo->sum('litros_trasvasijados');
            $litrosTotalFijoAMovil = $queryFijoAMovil->sum('litros_bombeados');

            // Trasvasijes pendientes de verificación
            $pendientesVerificacion = TrasvasijeMovilAFijo::where('verificado', false)
                ->when($request->id_faena, function ($q, $faena) {
                    return $q->where('id_faena', $faena);
                })
                ->count();

            // Diferencias promedio en móvil→fijo
            $diferenciasPromedio = TrasvasijeMovilAFijo::whereNotNull('diferencia_medicion')
                ->when($request->id_faena, function ($q, $faena) {
                    return $q->where('id_faena', $faena);
                })
                ->avg('diferencia_medicion') ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'resumen' => [
                        'total_trasvasijes' => $totalMovilAFijo + $totalFijoAMovil,
                        'movil_a_fijo' => [
                            'cantidad' => $totalMovilAFijo,
                            'litros_total' => round($litrosTotalMovilAFijo, 2)
                        ],
                        'fijo_a_movil' => [
                            'cantidad' => $totalFijoAMovil,
                            'litros_total' => round($litrosTotalFijoAMovil, 2)
                        ]
                    ],
                    'calidad' => [
                        'pendientes_verificacion' => $pendientesVerificacion,
                        'diferencia_promedio_litros' => round($diferenciasPromedio, 2)
                    ],
                    'periodo' => [
                        'fecha_desde' => $request->fecha_desde ?? 'Sin límite',
                        'fecha_hasta' => $request->fecha_hasta ?? 'Sin límite'
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener estadísticas de trasvasijes', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener datos para formularios (estanques disponibles)
     * GET /api/trasvasijes/datos-formulario
     */
    public function datosFormulario(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_faena' => 'required|exists:faenas,id_faena'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Faena requerida',
                    'errors' => $validator->errors()
                ], 422);
            }

            $estanques = Estanque::where('id_faena', $request->id_faena)
                ->where('activo', true)
                ->with(['stock'])
                ->get()
                ->map(function ($estanque) {
                    return [
                        'id_estanque' => $estanque->id_estanque,
                        'nombre' => $estanque->nombre,
                        'tipo' => $estanque->tipo_estanque,
                        'capacidad' => $estanque->capacidad,
                        'stock_actual' => $estanque->stock ? $estanque->stock->stock_actual : 0,
                        'altura_actual' => $estanque->stock ? $estanque->stock->altura_actual : null,
                        'disponible_para_trasvasije' => $estanque->stock ? $estanque->stock->stock_actual > 0 : false
                    ];
                });

            $estanquesFijos = $estanques->where('tipo', 'fijo')->values();
            $estanquesMoviles = $estanques->where('tipo', 'movil')->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'estanques_fijos' => $estanquesFijos,
                    'estanques_moviles' => $estanquesMoviles,
                    'usuarios' => User::where('estado', 1)
                        ->select('id', 'nombre', 'apellido', 'rut')
                        ->get()
                        ->map(function ($user) {
                            return [
                                'id' => $user->id,
                                'nombre_completo' => $user->nombre . ' ' . $user->apellido,
                                'rut' => $user->rut
                            ];
                        })
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener datos para formulario', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener datos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalle de un trasvasije específico
     * GET /api/trasvasijes/{tipo}/{id}
     */
    public function show($tipo, $id)
    {
        try {
            if (!in_array($tipo, ['movil-a-fijo', 'fijo-a-movil'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tipo de trasvasije inválido'
                ], 400);
            }

            if ($tipo === 'movil-a-fijo') {
                $trasvasije = TrasvasijeMovilAFijo::with([
                    'usuario:id,nombre,apellido,rut',
                    'estanqueMovil:id_estanque,nombre,tipo_estanque,capacidad',
                    'estanqueFijo:id_estanque,nombre,tipo_estanque,capacidad',
                    'faena:id_faena,ubicacion'
                ])->findOrFail($id);

                $data = [
                    'id' => $trasvasije->id_trasvasije,
                    'tipo' => 'movil_a_fijo',
                    'fecha_trasvasije' => $trasvasije->fecha_trasvasije,
                    'usuario' => $trasvasije->usuario,
                    'estanque_origen' => $trasvasije->estanqueMovil,
                    'estanque_destino' => $trasvasije->estanqueFijo,
                    'faena' => $trasvasije->faena,
                    'mediciones' => [
                        'litros_movil_inicial' => $trasvasije->litros_movil_inicial,
                        'litros_movil_final' => $trasvasije->litros_movil_final,
                        'litros_trasvasijados' => $trasvasije->litros_trasvasijados,
                        'altura_fijo_inicial' => $trasvasije->altura_fijo_inicial,
                        'altura_fijo_final' => $trasvasije->altura_fijo_final,
                        'litros_calculados_altura' => $trasvasije->litros_calculados_altura,
                        'diferencia_medicion' => $trasvasije->diferencia_medicion
                    ],
                    'stocks' => [
                        'movil' => [
                            'inicial' => $trasvasije->stock_inicial_movil,
                            'final' => $trasvasije->stock_final_movil
                        ],
                        'fijo' => [
                            'inicial' => $trasvasije->stock_inicial_fijo,
                            'final' => $trasvasije->stock_final_fijo
                        ]
                    ],
                    'verificado' => $trasvasije->verificado,
                    'observaciones' => $trasvasije->observaciones
                ];
            } else {
                $trasvasije = TrasvasijeFijoAMovil::with([
                    'usuario:id,nombre,apellido,rut',
                    'estanqueFijo:id_estanque,nombre,tipo_estanque,capacidad',
                    'estanqueMovil:id_estanque,nombre,tipo_estanque,capacidad',
                    'faena:id_faena,ubicacion'
                ])->findOrFail($id);

                $data = [
                    'id' => $trasvasije->id_trasvasije,
                    'tipo' => 'fijo_a_movil',
                    'fecha_trasvasije' => $trasvasije->fecha_trasvasije,
                    'usuario' => $trasvasije->usuario,
                    'estanque_origen' => $trasvasije->estanqueFijo,
                    'estanque_destino' => $trasvasije->estanqueMovil,
                    'faena' => $trasvasije->faena,
                    'mediciones' => [
                        'numeral_inicial' => $trasvasije->numeral_inicial,
                        'numeral_final' => $trasvasije->numeral_final,
                        'litros_bombeados' => $trasvasije->litros_bombeados
                    ],
                    'stocks' => [
                        'fijo' => [
                            'inicial' => $trasvasije->stock_inicial_fijo,
                            'final' => $trasvasije->stock_final_fijo
                        ],
                        'movil' => [
                            'inicial' => $trasvasije->stock_inicial_movil,
                            'final' => $trasvasije->stock_final_movil
                        ]
                    ],
                    'verificado' => true, // Siempre verificado
                    'observaciones' => $trasvasije->observaciones
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener detalle de trasvasije', [
                'error' => $e->getMessage(),
                'tipo' => $tipo,
                'id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener trasvasije: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dashboard de trasvasijes
     * GET /api/trasvasijes/dashboard
     */
    public function dashboard(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_faena' => 'nullable|exists:faenas,id_faena',
                'dias' => 'nullable|integer|min:1|max:365'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $dias = $request->get('dias', 30);
            $fechaDesde = Carbon::now()->subDays($dias);

            // Query base
            $queryMovilAFijo = TrasvasijeMovilAFijo::where('fecha_trasvasije', '>=', $fechaDesde);
            $queryFijoAMovil = TrasvasijeFijoAMovil::where('fecha_trasvasije', '>=', $fechaDesde);

            if ($request->id_faena) {
                $queryMovilAFijo->where('id_faena', $request->id_faena);
                $queryFijoAMovil->where('id_faena', $request->id_faena);
            }

            // Métricas principales
            $totalTrasvasijes = $queryMovilAFijo->count() + $queryFijoAMovil->count();
            $litrosTotalMovidos = $queryMovilAFijo->sum('litros_trasvasijados') + $queryFijoAMovil->sum('litros_bombeados');
            $pendientesVerificacion = TrasvasijeMovilAFijo::where('verificado', false)
                ->where('fecha_trasvasije', '>=', $fechaDesde)
                ->when($request->id_faena, function ($q, $faena) {
                    return $q->where('id_faena', $faena);
                })
                ->count();

            // Trasvasijes recientes
            $recientes = collect();

            $recentesMovilAFijo = $queryMovilAFijo->with([
                'estanqueMovil:id_estanque,nombre',
                'estanqueFijo:id_estanque,nombre',
                'usuario:id,nombre,apellido'
            ])
                ->orderBy('fecha_trasvasije', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($t) {
                    return [
                        'id' => $t->id_trasvasije,
                        'tipo' => 'Móvil → Fijo',
                        'fecha' => $t->fecha_trasvasije,
                        'origen' => $t->estanqueMovil->nombre,
                        'destino' => $t->estanqueFijo->nombre,
                        'litros' => $t->litros_trasvasijados,
                        'usuario' => $t->usuario->nombre . ' ' . $t->usuario->apellido,
                        'verificado' => $t->verificado
                    ];
                });

            $recentesFijoAMovil = $queryFijoAMovil->with([
                'estanqueFijo:id_estanque,nombre',
                'estanqueMovil:id_estanque,nombre',
                'usuario:id,nombre,apellido'
            ])
                ->orderBy('fecha_trasvasije', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($t) {
                    return [
                        'id' => $t->id_trasvasije,
                        'tipo' => 'Fijo → Móvil',
                        'fecha' => $t->fecha_trasvasije,
                        'origen' => $t->estanqueFijo->nombre,
                        'destino' => $t->estanqueMovil->nombre,
                        'litros' => $t->litros_bombeados,
                        'usuario' => $t->usuario->nombre . ' ' . $t->usuario->apellido,
                        'verificado' => true
                    ];
                });

            $recientes = $recentesMovilAFijo->merge($recentesFijoAMovil)
                ->sortByDesc('fecha')
                ->take(10)
                ->values();

            // Estadísticas por día (últimos 7 días)
            $estatisticasDiarias = [];
            for ($i = 6; $i >= 0; $i--) {
                $fecha = Carbon::now()->subDays($i);
                $fechaStr = $fecha->format('Y-m-d');

                $movilAFijoDia = TrasvasijeMovilAFijo::whereDate('fecha_trasvasije', $fecha)
                    ->when($request->id_faena, function ($q, $faena) {
                        return $q->where('id_faena', $faena);
                    })
                    ->count();

                $fijoAMovilDia = TrasvasijeFijoAMovil::whereDate('fecha_trasvasije', $fecha)
                    ->when($request->id_faena, function ($q, $faena) {
                        return $q->where('id_faena', $faena);
                    })
                    ->count();

                $estatisticasDiarias[] = [
                    'fecha' => $fechaStr,
                    'fecha_display' => $fecha->format('d/m'),
                    'movil_a_fijo' => $movilAFijoDia,
                    'fijo_a_movil' => $fijoAMovilDia,
                    'total' => $movilAFijoDia + $fijoAMovilDia
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'metricas' => [
                        'total_trasvasijes' => $totalTrasvasijes,
                        'litros_total_movidos' => round($litrosTotalMovidos, 2),
                        'pendientes_verificacion' => $pendientesVerificacion,
                        'periodo_dias' => $dias
                    ],
                    'recientes' => $recientes,
                    'estadisticas_diarias' => $estatisticasDiarias
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener dashboard de trasvasijes', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================

    /**
     * Actualizar stock de un estanque
     */
    private function actualizarStockEstanque($idEstanque, $nuevoStock, $nuevaAltura = null)
    {
        EstanqueStock::updateOrCreate(
            ['id_estanque' => $idEstanque],
            [
                'stock_actual' => $nuevoStock,
                'altura_actual' => $nuevaAltura,
                'ultima_medicion' => now()
            ]
        );
    }
}
