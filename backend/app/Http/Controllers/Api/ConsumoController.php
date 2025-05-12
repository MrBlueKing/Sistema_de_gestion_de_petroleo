<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consumo;
use App\Models\Estanque;
use App\Models\StockPetroleo;
use App\Models\EstanqueStock;
use App\Models\IngresoPetroleo;
use App\Models\MovimientoPetroleo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ConsumoController extends Controller
{
    /**
     * Registra un consumo de petróleo, permitiendo usar stock directo o estanques específicos
     */
    public function store(Request $request)
    {
        Log::info('Iniciando store de Consumo', ['data_recibida' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'id_dotacion' => 'required|exists:solicitantes,id',
            'id_equipo' => 'required|exists:maquinas,id_maquina',
            'id_usuario' => 'required|exists:users,id',
            'fecha_consumo' => 'nullable|date',
            'litros_consumidos' => 'required|numeric|min:0',
            'id_faena' => 'required|exists:faenas,id_faena',
            'id_estanque' => 'nullable|exists:estanques,id_estanque',
            'medicion' => 'nullable|numeric',
            'numeral_inicial' => 'nullable|numeric',
            'numeral_final' => 'nullable|numeric',
            'usar_stock_total' => 'nullable|boolean', // Nuevo parámetro para decidir si usar stock total
            'crear_consumo_unico' => 'nullable|boolean', // Nuevo parámetro para decidir si crear un solo registro de consumo
        ]);

        if ($validator->fails()) {
            Log::warning('Validación fallida en Consumo::store', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $idFaena = $request->id_faena;
            $litrosConsumidos = $request->litros_consumidos;
            $usarStockTotal = $request->input('usar_stock_total', false);
            $crearConsumoUnico = $request->input('crear_consumo_unico', true); // Por defecto, crear un solo registro
            
            // Obtener el último ingreso de petróleo por faena para el precio
            $ultimoIngreso = IngresoPetroleo::where('id_faena', $idFaena)
                ->orderBy('created_at', 'desc')
                ->first();
            
            DB::beginTransaction();
            
            // Generar un ID de grupo para todos los movimientos relacionados con esta operación
            $idGrupoOperacion = "OP-" . uniqid();
            
            // Enfoque 1: Usar StockPetroleo (stock total de la faena)
            if ($usarStockTotal) {
                $stockPetroleo = StockPetroleo::where('id_faena', $idFaena)->first();
                
                if (!$stockPetroleo || $stockPetroleo->stock_actual < $litrosConsumidos) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Stock insuficiente',
                        'data' => [
                            'stock_actual' => $stockPetroleo ? $stockPetroleo->stock_actual : 0,
                            'litros_solicitados' => $litrosConsumidos
                        ]
                    ], 400);
                }
                
                // Guardamos el stock anterior para el registro
                $stockAnterior = $stockPetroleo->stock_actual;
                
                // Creamos el registro de consumo único
                $consumo = new Consumo();
                $consumo->id_dotacion = $request->id_dotacion;
                $consumo->id_equipo = $request->id_equipo;
                $consumo->id_usuario = $request->id_usuario;
                $consumo->fecha_consumo = $request->fecha_consumo ?? now();
                $consumo->litros_consumidos = $litrosConsumidos;
                $consumo->id_faena = $idFaena;
                // Usamos el primer estanque de la faena como referencia (es sólo referencial)
                $primerEstanque = Estanque::where('id_faena', $idFaena)->first();
                $consumo->id_estanque = $primerEstanque ? $primerEstanque->id_estanque : null;
                $consumo->medicion = $request->medicion;
                $consumo->numeral_inicial = $request->numeral_inicial;
                $consumo->numeral_final = $request->numeral_final;
                $consumo->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                $consumo->save();
                
                // Actualizamos el stock total
                $stockPetroleo->stock_actual -= $litrosConsumidos;
                $stockPetroleo->ultima_actualizacion = now();
                $stockPetroleo->save();
                
                // Estanques a actualizar
                $estanquesActualizados = [];
                
                // Actualizamos también los estanques de forma proporcional
                $estanques = Estanque::where('id_faena', $idFaena)
                    ->where('activo', true)
                    ->with('stock')
                    ->get()
                    ->filter(fn($e) => isset($e->stock) && $e->stock->stock_actual > 0);
                
                $stockTotalEstanques = $estanques->sum(fn($e) => $e->stock->stock_actual);
                
                if ($stockTotalEstanques > 0) {
                    foreach ($estanques as $estanque) {
                        $proporcion = $estanque->stock->stock_actual / $stockTotalEstanques;
                        $litrosDescontados = $litrosConsumidos * $proporcion;
                        $litrosDescontados = min($litrosDescontados, $estanque->stock->stock_actual);
                        
                        $stockAnteriorEstanque = $estanque->stock->stock_actual;
                        $estanque->stock->stock_actual -= $litrosDescontados;
                        
                        if ($estanque->altura_nominal && $estanque->capacidad) {
                            $estanque->stock->altura_actual = ($estanque->stock->stock_actual / $estanque->capacidad) 
                                * $estanque->altura_nominal;
                        }
                        
                        $estanque->stock->ultima_medicion = now();
                        $estanque->stock->save();
                        
                        // MODIFICACIÓN: Registramos un movimiento con metadatos para cada estanque
                        // La diferencia es que hacemos un INSERT con metadatos útiles, pero mantenemos id_referencia
                        // apuntando al consumo para mantener la integridad original
                        DB::statement("
                            INSERT INTO movimientos_petroleo 
                            (id_faena, tipo_movimiento, id_referencia, cantidad, stock_anterior, stock_actual, id_usuario, created_at, updated_at, metadata) 
                            VALUES (?, 'consumo', ?, ?, ?, ?, ?, ?, ?, ?)
                        ", [
                            $idFaena, 
                            $consumo->id_consumo, // Se mantiene id_referencia como id_consumo
                            -$litrosDescontados, 
                            $stockAnteriorEstanque, 
                            $estanque->stock->stock_actual, 
                            $request->id_usuario,
                            now(),
                            now(),
                            json_encode([
                                'id_estanque' => $estanque->id_estanque,
                                'nombre_estanque' => $estanque->nombre,
                                'id_grupo_operacion' => $idGrupoOperacion,
                                'tipo_operacion' => 'consumo_desde_stock_total',
                                'proporcion' => $proporcion
                            ])
                        ]);
                        
                        $estanquesActualizados[] = [
                            'id_estanque' => $estanque->id_estanque,
                            'nombre' => $estanque->nombre,
                            'litros_descontados' => $litrosDescontados,
                            'stock_anterior' => $stockAnteriorEstanque,
                            'stock_actual' => $estanque->stock->stock_actual,
                            'proporcion' => $proporcion
                        ];
                    }
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Consumo registrado correctamente desde stock total',
                    'data' => [
                        'id_consumo' => $consumo->id_consumo,
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'litros_consumidos' => $litrosConsumidos,
                        'stock_anterior' => $stockAnterior,
                        'stock_actual' => $stockPetroleo->stock_actual,
                        'estanques_actualizados' => $estanquesActualizados
                    ]
                ], 201);
            }
            
            // Enfoque 2: Usar estanques específicos (modo original con modificación para consumo único)
            $estanques = Estanque::where('id_faena', $idFaena)
                ->where('activo', true)
                ->with('stock')
                ->get()
                ->sortByDesc(fn($e) => $e->stock->stock_actual ?? 0);
            
            $stockTotal = $estanques->sum(fn($e) => $e->stock->stock_actual ?? 0);
            
            if ($stockTotal < $litrosConsumidos) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuficiente',
                    'data' => [
                        'stock_actual' => $stockTotal,
                        'litros_solicitados' => $litrosConsumidos
                    ]
                ], 400);
            }
            
            // Si viene un estanque específico en la solicitud, intentamos usar ese primero
            if ($request->has('id_estanque') && $request->id_estanque) {
                $estanqueSeleccionado = $estanques->firstWhere('id_estanque', $request->id_estanque);
                if ($estanqueSeleccionado && $estanqueSeleccionado->stock && $estanqueSeleccionado->stock->stock_actual >= $litrosConsumidos) {
                    // Podemos tomar todo del estanque seleccionado
                    $estanques = collect([$estanqueSeleccionado]);
                }
            }
            
            // Crear un timestamp exacto para todos los consumos del grupo
            $fechaConsumo = $request->fecha_consumo ?? now();
            $timestampExacto = date('Y-m-d H:i:s', strtotime($fechaConsumo));
            
            $litrosRestantes = $litrosConsumidos;
            $consumosRealizados = [];
            $estanquesAfectados = [];
            
            // MODIFICACIÓN: Si queremos crear un consumo único, lo creamos aquí antes del bucle
            $consumoUnico = null;
            if ($crearConsumoUnico) {
                $consumoUnico = new Consumo();
                $consumoUnico->id_dotacion = $request->id_dotacion;
                $consumoUnico->id_equipo = $request->id_equipo;
                $consumoUnico->id_usuario = $request->id_usuario;
                $consumoUnico->fecha_consumo = $timestampExacto;
                $consumoUnico->litros_consumidos = $litrosConsumidos;
                $consumoUnico->id_faena = $idFaena;
                
                // Usamos el estanque específico si viene en la solicitud, o el primero si no
                $consumoUnico->id_estanque = $request->id_estanque ?? $estanques->first()->id_estanque;
                
                $consumoUnico->medicion = $request->medicion;
                $consumoUnico->numeral_inicial = $request->numeral_inicial;
                $consumoUnico->numeral_final = $request->numeral_final;
                $consumoUnico->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                $consumoUnico->save();
                
                // También aseguramos que created_at sea EXACTAMENTE igual
                Consumo::where('id_consumo', $consumoUnico->id_consumo)
                       ->update(['created_at' => $timestampExacto]);
            }
            
            // Consumir de cada estanque según disponibilidad
            foreach ($estanques as $estanque) {
                if (!$estanque->stock || $estanque->stock->stock_actual <= 0 || $litrosRestantes <= 0) {
                    continue;
                }
                
                $stock = $estanque->stock;
                $litrosDeEste = min($stock->stock_actual, $litrosRestantes);
                $stockAnterior = $stock->stock_actual;
                
                // Actualizar stock del estanque
                $stock->stock_actual -= $litrosDeEste;
                if ($estanque->altura_nominal && $estanque->capacidad) {
                    $stock->altura_actual = ($stock->stock_actual / $estanque->capacidad) * $estanque->altura_nominal;
                }
                $stock->ultima_medicion = now();
                $stock->save();
                
                // MODIFICACIÓN: Solo creamos un nuevo consumo si no queremos un consumo único
                $consumoActual = $consumoUnico;
                
                if (!$crearConsumoUnico) {
                    // Crear consumo con timestamp exactamente igual (modo original)
                    $consumoActual = new Consumo();
                    $consumoActual->id_dotacion = $request->id_dotacion;
                    $consumoActual->id_equipo = $request->id_equipo;
                    $consumoActual->id_usuario = $request->id_usuario;
                    $consumoActual->fecha_consumo = $timestampExacto; // Usamos el mismo timestamp exacto
                    $consumoActual->litros_consumidos = $litrosDeEste;
                    $consumoActual->id_faena = $idFaena;
                    $consumoActual->id_estanque = $estanque->id_estanque;
                    $consumoActual->medicion = $request->medicion;
                    $consumoActual->numeral_inicial = $request->numeral_inicial;
                    $consumoActual->numeral_final = $request->numeral_final;
                    $consumoActual->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                    $consumoActual->save();
                    
                    // También aseguramos que created_at sea EXACTAMENTE igual para todos los consumos relacionados
                    Consumo::where('id_consumo', $consumoActual->id_consumo)
                           ->update(['created_at' => $timestampExacto]);
                }
                
                // MODIFICACIÓN: El tipo de operación depende de si estamos usando consumo único o múltiple
                $tipoOperacion = $crearConsumoUnico ? 'consumo_unico_multiple_estanques' : 'consumo_multiple';
                
                // MODIFICACIÓN: Registramos el movimiento con metadatos adicionales
                DB::statement("
                    INSERT INTO movimientos_petroleo 
                    (id_faena, tipo_movimiento, id_referencia, cantidad, stock_anterior, stock_actual, id_usuario, created_at, updated_at, metadata) 
                    VALUES (?, 'consumo', ?, ?, ?, ?, ?, ?, ?, ?)
                ", [
                    $idFaena, 
                    $consumoActual->id_consumo, // Mantenemos id_referencia como id_consumo
                    -$litrosDeEste, 
                    $stockAnterior, 
                    $stock->stock_actual, 
                    $request->id_usuario,
                    now(),
                    now(),
                    json_encode([
                        'id_estanque' => $estanque->id_estanque,
                        'nombre_estanque' => $estanque->nombre,
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'tipo_operacion' => $tipoOperacion,
                        'es_parte_consumo_unico' => $crearConsumoUnico
                    ])
                ]);
                
                $estanquesAfectados[] = [
                    'id_estanque' => $estanque->id_estanque,
                    'nombre_estanque' => $estanque->nombre,
                    'litros_descontados' => $litrosDeEste,
                    'stock_anterior' => $stockAnterior,
                    'stock_actual' => $stock->stock_actual
                ];
                
                // Si no estamos usando consumo único, guardamos cada consumo individual
                if (!$crearConsumoUnico) {
                    $consumosRealizados[] = [
                        'id_consumo' => $consumoActual->id_consumo,
                        'id_estanque' => $estanque->id_estanque,
                        'nombre_estanque' => $estanque->nombre,
                        'litros_consumidos' => $litrosDeEste,
                        'stock_anterior' => $stockAnterior,
                        'stock_actual' => $stock->stock_actual
                    ];
                }
                
                $litrosRestantes -= $litrosDeEste;
                if ($litrosRestantes <= 0) break;
            }
            
            // Actualizar stock total de la faena
            $nuevoStockTotal = EstanqueStock::whereHas('estanque', fn($q) => $q->where('id_faena', $idFaena))
                ->sum('stock_actual');
            
            $stockPetroleo = StockPetroleo::firstOrNew(['id_faena' => $idFaena]);
            $stockPetroleo->stock_actual = $nuevoStockTotal;
            $stockPetroleo->ultima_actualizacion = now();
            $stockPetroleo->save();
            
            DB::commit();
            
            // MODIFICACIÓN: Si usamos consumo único, retornamos info sobre ese consumo único
            if ($crearConsumoUnico) {
                return response()->json([
                    'success' => true,
                    'message' => 'Consumo único registrado correctamente desde múltiples estanques',
                    'data' => [
                        'id_consumo' => $consumoUnico->id_consumo,
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'timestamp' => $timestampExacto,
                        'litros_totales' => $litrosConsumidos,
                        'estanques_afectados' => $estanquesAfectados,
                        'nota_consulta' => "Puedes consultar todos los movimientos relacionados con: SELECT * FROM movimientos_petroleo WHERE metadata LIKE '%\"id_grupo_operacion\":\"$idGrupoOperacion\"%'"
                    ]
                ], 201);
            }
            
            // Si solo tenemos un consumo, devolvemos la respuesta original
            if (count($consumosRealizados) == 1) {
                return response()->json([
                    'success' => true,
                    'message' => 'Consumo registrado correctamente',
                    'data' => [
                        'id_consumo' => $consumosRealizados[0]['id_consumo'],
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'id_estanque' => $consumosRealizados[0]['id_estanque'],
                        'nombre_estanque' => $consumosRealizados[0]['nombre_estanque'],
                        'litros_consumidos' => $consumosRealizados[0]['litros_consumidos'],
                        'stock_anterior' => $consumosRealizados[0]['stock_anterior'],
                        'stock_actual' => $consumosRealizados[0]['stock_actual']
                    ]
                ], 201);
            }
            
            // Si tenemos múltiples consumos, devolvemos todos como grupo con info de timestamp
            return response()->json([
                'success' => true,
                'message' => 'Consumo registrado desde múltiples estanques',
                'data' => [
                    'id_grupo_operacion' => $idGrupoOperacion,
                    'timestamp_grupo' => $timestampExacto,
                    'litros_totales' => $litrosConsumidos,
                    'consumos_realizados' => $consumosRealizados,
                    'nota_consulta' => "Puedes consultar todos los movimientos relacionados con: SELECT * FROM movimientos_petroleo WHERE metadata LIKE '%\"id_grupo_operacion\":\"$idGrupoOperacion\"%'"
                ]
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en Consumo::store', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el consumo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Consulta los consumos y movimientos relacionados en una misma operación
     */
    public function getDetallesOperacion($idGrupoOperacion)
    {
        try {
            // Consultar movimientos por ID de grupo
            $movimientos = DB::select("
                SELECT * FROM movimientos_petroleo 
                WHERE metadata LIKE ?
            ", ["%\"id_grupo_operacion\":\"$idGrupoOperacion\"%"]);
            
            // Extraer los IDs de consumos relacionados
            $idsConsumos = collect($movimientos)->pluck('id_referencia')->unique()->toArray();
            
            // Obtener los consumos relacionados
            $consumos = Consumo::whereIn('id_consumo', $idsConsumos)->get();
            
            // Obtener información de estanques
            $metadata = collect($movimientos)->map(function($movimiento) {
                return json_decode($movimiento->metadata ?? '{}', true);
            });
            
            $idsEstanques = $metadata->pluck('id_estanque')->filter()->unique()->toArray();
            $estanques = Estanque::whereIn('id_estanque', $idsEstanques)->get()->keyBy('id_estanque');
            
            // Preparar respuesta detallada
            return response()->json([
                'success' => true,
                'id_grupo_operacion' => $idGrupoOperacion,
                'total_litros' => $consumos->sum('litros_consumidos'),
                'consumos' => $consumos,
                'movimientos' => collect($movimientos)->map(function($movimiento) use ($estanques) {
                    $meta = json_decode($movimiento->metadata ?? '{}', true);
                    $idEstanque = $meta['id_estanque'] ?? null;
                    $movimiento->estanque = $idEstanque ? $estanques->get($idEstanque) : null;
                    return $movimiento;
                }),
                'es_consumo_multiple' => count($consumos) > 1,
                'tipo_operacion' => $metadata->first()['tipo_operacion'] ?? 'consumo'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al consultar detalles de la operación',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Método para obtener todos los consumos relacionados por fecha exacta
     */
    public function getConsumosRelacionados($timestamp, $idEquipo = null)
    {
        try {
            $query = Consumo::where('fecha_consumo', $timestamp)
                          ->where('created_at', $timestamp);
            
            if ($idEquipo) {
                $query->where('id_equipo', $idEquipo);
            }
            
            $consumos = $query->get();
            
            // Si hay más de un consumo, estamos ante un consumo desde múltiples estanques
            $esMultiple = $consumos->count() > 1;
            
            return response()->json([
                'success' => true,
                'es_consumo_multiple' => $esMultiple,
                'total_litros' => $consumos->sum('litros_consumidos'),
                'consumos' => $consumos
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al consultar consumos relacionados',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}