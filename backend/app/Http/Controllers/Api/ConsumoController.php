<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consumo;
use App\Models\ConsumoEstanque;
use App\Models\Estanque;
use App\Models\StockPetroleo;
use App\Models\EstanqueStock;
use App\Models\IngresoPetroleo;
use App\Models\MovimientoPetroleo;
use App\Models\Solicitante;
use App\Models\PersonalInterno;
use App\Models\PersonalExterno;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ConsumoController extends Controller
{
    /**
     * Registra un consumo de petróleo, permitiendo usar stock directo o estanques específicos
     */
    public function store(Request $request)
    {
        Log::info('Iniciando store de Consumo', ['data_recibida' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'id_dotacion' => 'required|exists:solicitantes,rut',
            'id_equipo' => 'required|exists:maquinas,id_maquina',
            'id_usuario' => 'required|exists:users,id',
            'litros_consumidos' => 'required|numeric|min:0',
            'id_faena' => 'required|exists:faenas,id_faena',
            'id_estanque' => 'nullable|exists:estanques,id_estanque',
            'medicion' => 'nullable|numeric',
            'numeral_inicial' => 'nullable|numeric',
            'numeral_final' => 'nullable|numeric',
            'usar_stock_total' => 'nullable|boolean',
            'crear_consumo_unico' => 'nullable|boolean',
            'observacion' => 'nullable|string|max:500',
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
            $crearConsumoUnico = $request->input('crear_consumo_unico', true);

            // Usar siempre now() con zona horaria de Chile
            $fechaConsumo = now('America/Santiago');

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
                $consumo->fecha_consumo = $fechaConsumo;
                $consumo->litros_consumidos = $litrosConsumidos;
                $consumo->id_faena = $idFaena;
                // Usamos el primer estanque de la faena como referencia
                $primerEstanque = Estanque::where('id_faena', $idFaena)->first();
                $consumo->id_estanque = $primerEstanque ? $primerEstanque->id_estanque : null;
                $consumo->medicion = $request->medicion;
                $consumo->numeral_inicial = $request->numeral_inicial;
                $consumo->numeral_final = $request->numeral_final;
                $consumo->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                $consumo->observacion = $request->observacion;
                $consumo->save();

                // Actualizamos el stock total
                $stockPetroleo->stock_actual -= $litrosConsumidos;
                $stockPetroleo->ultima_actualizacion = $fechaConsumo;
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

                        $estanque->stock->ultima_medicion = $fechaConsumo;
                        $estanque->stock->save();

                        // Registramos un movimiento con metadatos para cada estanque
                        DB::statement("
                        INSERT INTO movimientos_petroleo 
                        (id_faena, tipo_movimiento, id_referencia, cantidad, stock_anterior, stock_actual, id_usuario, created_at, updated_at, metadata) 
                        VALUES (?, 'consumo', ?, ?, ?, ?, ?, ?, ?, ?)
                    ", [
                            $idFaena,
                            $consumo->id_consumo,
                            -$litrosDescontados,
                            $stockAnteriorEstanque,
                            $estanque->stock->stock_actual,
                            $request->id_usuario,
                            $fechaConsumo,
                            $fechaConsumo,
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
                        'fecha_consumo' => $consumo->fecha_consumo->format('Y-m-d H:i:s'),
                        'fecha_consumo_formateada' => $consumo->fecha_consumo->format('d/m/Y H:i'),
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'litros_consumidos' => $litrosConsumidos,
                        'stock_anterior' => $stockAnterior,
                        'stock_actual' => $stockPetroleo->stock_actual,
                        'estanques_actualizados' => $estanquesActualizados
                    ]
                ], 201);
            }

            // Enfoque 2: Usar estanques específicos
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

            $litrosRestantes = $litrosConsumidos;
            $consumosRealizados = [];
            $estanquesAfectados = [];

            // Si queremos crear un consumo único, lo creamos aquí antes del bucle
            $consumoUnico = null;
            if ($crearConsumoUnico) {
                $consumoUnico = new Consumo();
                $consumoUnico->id_dotacion = $request->id_dotacion;
                $consumoUnico->id_equipo = $request->id_equipo;
                $consumoUnico->id_usuario = $request->id_usuario;
                $consumoUnico->fecha_consumo = $fechaConsumo;
                $consumoUnico->litros_consumidos = $litrosConsumidos;
                $consumoUnico->id_faena = $idFaena;
                $consumoUnico->id_estanque = $request->id_estanque ?? $estanques->first()->id_estanque;
                $consumoUnico->medicion = $request->medicion;
                $consumoUnico->numeral_inicial = $request->numeral_inicial;
                $consumoUnico->numeral_final = $request->numeral_final;
                $consumoUnico->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                $consumoUnico->observacion = $request->observacion;
                $consumoUnico->save();
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
                $stock->ultima_medicion = $fechaConsumo;
                $stock->save();

                // Solo creamos un nuevo consumo si no queremos un consumo único
                $consumoActual = $consumoUnico;

                if (!$crearConsumoUnico) {
                    // Crear consumo individual
                    $consumoActual = new Consumo();
                    $consumoActual->id_dotacion = $request->id_dotacion;
                    $consumoActual->id_equipo = $request->id_equipo;
                    $consumoActual->id_usuario = $request->id_usuario;
                    $consumoActual->fecha_consumo = $fechaConsumo;
                    $consumoActual->litros_consumidos = $litrosDeEste;
                    $consumoActual->id_faena = $idFaena;
                    $consumoActual->id_estanque = $estanque->id_estanque;
                    $consumoActual->medicion = $request->medicion;
                    $consumoActual->numeral_inicial = $request->numeral_inicial;
                    $consumoActual->numeral_final = $request->numeral_final;
                    $consumoActual->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                    $consumoActual->observacion = $request->observacion;
                    $consumoActual->save();
                }

                // El tipo de operación depende de si estamos usando consumo único o múltiple
                $tipoOperacion = $crearConsumoUnico ? 'consumo_unico_multiple_estanques' : 'consumo_multiple';

                // Registramos el movimiento con metadatos adicionales
                DB::statement("
                INSERT INTO movimientos_petroleo 
                (id_faena, tipo_movimiento, id_referencia, cantidad, stock_anterior, stock_actual, id_usuario, created_at, updated_at, metadata) 
                VALUES (?, 'consumo', ?, ?, ?, ?, ?, ?, ?, ?)
            ", [
                    $idFaena,
                    $consumoActual->id_consumo,
                    -$litrosDeEste,
                    $stockAnterior,
                    $stock->stock_actual,
                    $request->id_usuario,
                    $fechaConsumo,
                    $fechaConsumo,
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
            $stockPetroleo->ultima_actualizacion = $fechaConsumo;
            $stockPetroleo->save();

            DB::commit();

            // Si usamos consumo único, retornamos info sobre ese consumo único
            if ($crearConsumoUnico) {
                return response()->json([
                    'success' => true,
                    'message' => 'Consumo único registrado correctamente desde múltiples estanques',
                    'data' => [
                        'id_consumo' => $consumoUnico->id_consumo,
                        'fecha_consumo' => $consumoUnico->fecha_consumo->format('Y-m-d H:i:s'),
                        'fecha_consumo_formateada' => $consumoUnico->fecha_consumo->format('d/m/Y H:i'),
                        'id_grupo_operacion' => $idGrupoOperacion,
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
                        'fecha_consumo' => $fechaConsumo->format('Y-m-d H:i:s'),
                        'fecha_consumo_formateada' => $fechaConsumo->format('d/m/Y H:i'),
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'id_estanque' => $consumosRealizados[0]['id_estanque'],
                        'nombre_estanque' => $consumosRealizados[0]['nombre_estanque'],
                        'litros_consumidos' => $consumosRealizados[0]['litros_consumidos'],
                        'stock_anterior' => $consumosRealizados[0]['stock_anterior'],
                        'stock_actual' => $consumosRealizados[0]['stock_actual']
                    ]
                ], 201);
            }

            // Si tenemos múltiples consumos, devolvemos todos como grupo
            return response()->json([
                'success' => true,
                'message' => 'Consumo registrado desde múltiples estanques',
                'data' => [
                    'fecha_consumo' => $fechaConsumo->format('Y-m-d H:i:s'),
                    'fecha_consumo_formateada' => $fechaConsumo->format('d/m/Y H:i'),
                    'id_grupo_operacion' => $idGrupoOperacion,
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

    public function storeMultiEstanque(Request $request)
    {
        Log::info('Iniciando storeMultiEstanque', ['data_recibida' => $request->all()]);

        // ✅ VALIDACIÓN CORREGIDA - Eliminado precio_litro del request
        $validator = Validator::make($request->all(), [
            'id_dotacion' => 'required|string',
            'id_equipo' => 'required|integer',
            'id_usuario' => 'required|integer',
            'fecha_consumo' => 'nullable|date',
            'litros_consumidos' => 'required|numeric|min:0.01',
            'tipo_consumo' => 'nullable|in:simple,multiple',
            'tipo_operacion' => 'nullable|in:normal,estanque_movil',
            'id_faena' => 'required|integer',
            'numeral_inicial' => 'required|numeric|min:0',
            'numeral_final' => 'required|numeric|gt:numeral_inicial',
            'observacion' => 'nullable|string|max:500',

            // Para consumo simple
            'id_estanque' => 'nullable|integer',
            'medicion' => 'nullable|numeric|min:0',
            'horometro' => 'nullable|numeric|min:0',
            'kilometraje' => 'nullable|numeric|min:0',

            // Para consumo múltiple - validación más flexible
            'estanques_multiples' => 'nullable|array',
            'estanques_multiples.*.id_estanque' => 'nullable|integer',
            'estanques_multiples.*.litros' => 'nullable|numeric|min:0',
            'estanques_multiples.*.medicion' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            Log::warning('Validación fallida en storeMultiEstanque', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $idFaena = $request->id_faena;
            $litrosConsumidos = $request->litros_consumidos;
            $tipoConsumo = $request->tipo_consumo ?? 'multiple';
            $esMultiple = $tipoConsumo === 'multiple';

            $fechaConsumo = $request->fecha_consumo ?
                Carbon::parse($request->fecha_consumo)->setTimezone('America/Santiago') :
                now('America/Santiago');

            // ✅ OBTENER EL ÚLTIMO INGRESO DE PETRÓLEO IGUAL QUE EN EL MÉTODO STORE
            $ultimoIngreso = IngresoPetroleo::where('id_faena', $idFaena)
                ->orderBy('created_at', 'desc')
                ->first();

            // ✅ NO USAR EL PRECIO DEL REQUEST, SINO EL DEL ÚLTIMO INGRESO
            $precioLitro = $ultimoIngreso ? $ultimoIngreso->precio : null;

            DB::beginTransaction();

            // Generar un ID de grupo para todos los movimientos relacionados
            $idGrupoOperacion = "OP-" . uniqid();

            // ✅ VERIFICAR QUE EXISTEN LOS REGISTROS RELACIONADOS
            if (!DB::table('solicitantes')->where('rut', $request->id_dotacion)->exists()) {
                throw new \Exception("Solicitante con RUT {$request->id_dotacion} no encontrado");
            }

            if (!DB::table('maquinas')->where('id_maquina', $request->id_equipo)->exists()) {
                throw new \Exception("Máquina con ID {$request->id_equipo} no encontrada");
            }

            if (!DB::table('users')->where('id', $request->id_usuario)->exists()) {
                throw new \Exception("Usuario con ID {$request->id_usuario} no encontrado");
            }

            if (!DB::table('faenas')->where('id_faena', $idFaena)->exists()) {
                throw new \Exception("Faena con ID {$idFaena} no encontrada");
            }

            // 📋 CREAR EL CONSUMO PRINCIPAL (REGISTRO GENERAL)
            $consumo = new Consumo();
            $consumo->id_dotacion = $request->id_dotacion;
            $consumo->id_equipo = $request->id_equipo;
            $consumo->id_usuario = $request->id_usuario;
            $consumo->fecha_consumo = $fechaConsumo;
            $consumo->litros_consumidos = $litrosConsumidos;
            $consumo->tipo_consumo = $tipoConsumo;
            $consumo->tipo_operacion = $request->tipo_operacion ?? 'normal';
            $consumo->id_faena = $idFaena;

            // Para consumo simple, mantener la referencia al estanque principal
            // Para consumo múltiple, será null (los detalles van en consumo_estanques)
            $consumo->id_estanque = $esMultiple ? null : $request->id_estanque;

            $consumo->medicion = $request->medicion ?? $request->horometro ?? $request->kilometraje ?? null;
            $consumo->numeral_inicial = $request->numeral_inicial;
            $consumo->numeral_final = $request->numeral_final;

            // ✅ USAR EL PRECIO DEL ÚLTIMO INGRESO, NO DEL REQUEST
            $consumo->precio_litro = $precioLitro;

            $consumo->observacion = $request->observacion;
            $consumo->save();

            Log::info('✅ Consumo principal creado:', [
                'id_consumo' => $consumo->id_consumo,
                'tipo_consumo' => $tipoConsumo,
                'precio_litro' => $precioLitro,
                'origen_precio' => $ultimoIngreso ? 'ultimo_ingreso' : 'null'
            ]);

            $estanquesAfectados = [];
            $movimientos = [];

            if ($esMultiple && $request->has('estanques_multiples')) {
                // 🔄 CONSUMO MÚLTIPLE - PROCESAR CADA ESTANQUE
                foreach ($request->estanques_multiples as $estanqueData) {
                    if (!isset($estanqueData['id_estanque']) || !isset($estanqueData['litros'])) {
                        continue;
                    }

                    $estanque = Estanque::with('stock')->find($estanqueData['id_estanque']);
                    if (!$estanque || !$estanque->stock) {
                        Log::warning("Estanque no encontrado o sin stock", ['id_estanque' => $estanqueData['id_estanque']]);
                        continue;
                    }

                    $litrosEstanque = $estanqueData['litros'];
                    $medicionEstanque = $estanqueData['medicion'] ?? null;

                    if ($litrosEstanque <= 0 || $estanque->stock->stock_actual < $litrosEstanque) {
                        Log::warning("Stock insuficiente en estanque", [
                            'id_estanque' => $estanque->id_estanque,
                            'stock_actual' => $estanque->stock->stock_actual,
                            'litros_solicitados' => $litrosEstanque
                        ]);
                        continue;
                    }

                    $stockInicial = $estanque->stock->stock_actual;
                    $stockFinal = $stockInicial - $litrosEstanque;

                    // Calcular medición final basada en proporción
                    $medicionFinal = null;
                    if ($estanque->altura_nominal && $estanque->capacidad && $estanque->capacidad > 0) {
                        $medicionFinal = ($stockFinal / $estanque->capacidad) * $estanque->altura_nominal;
                    }

                    // Crear registro detallado del consumo por estanque
                    $consumoEstanque = new ConsumoEstanque();
                    $consumoEstanque->id_consumo = $consumo->id_consumo;
                    $consumoEstanque->id_estanque = $estanque->id_estanque;
                    $consumoEstanque->litros_desde_estanque = $litrosEstanque;
                    $consumoEstanque->stock_inicial_estanque = $stockInicial;
                    $consumoEstanque->stock_final_estanque = $stockFinal;
                    $consumoEstanque->medicion_inicial = $estanque->stock->altura_actual;
                    $consumoEstanque->medicion_final = $medicionFinal;

                    // Nota: medicion_equipo no existe en la tabla, usar otro campo si necesario

                    $consumoEstanque->save();

                    // Actualizar stock del estanque
                    $estanque->stock->stock_actual = $stockFinal;
                    if ($estanque->altura_nominal && $estanque->capacidad && $estanque->capacidad > 0) {
                        $estanque->stock->altura_actual = $medicionFinal;
                    }
                    $estanque->stock->ultima_medicion = $fechaConsumo;
                    $estanque->stock->save();

                    // Registrar movimiento
                    $movimiento = new MovimientoPetroleo();
                    $movimiento->id_faena = $idFaena;
                    $movimiento->tipo_movimiento = 'consumo';
                    $movimiento->id_referencia = $consumo->id_consumo;
                    $movimiento->cantidad = -$litrosEstanque;
                    $movimiento->stock_anterior = $stockInicial;
                    $movimiento->stock_actual = $stockFinal;
                    $movimiento->id_usuario = $request->id_usuario;
                    $movimiento->metadata = json_encode([
                        'id_estanque' => $estanque->id_estanque,
                        'nombre_estanque' => $estanque->nombre,
                        'id_grupo_operacion' => $idGrupoOperacion,
                        'tipo_operacion' => 'consumo_multi_estanque',
                        'es_consumo_multiple' => true,
                        'id_consumo_estanque' => $consumoEstanque->id_consumo_estanque
                    ]);
                    $movimiento->save();

                    $estanquesAfectados[] = [
                        'id_estanque' => $estanque->id_estanque,
                        'nombre_estanque' => $estanque->nombre,
                        'litros_extraidos' => $litrosEstanque,
                        'stock_anterior' => $stockInicial,
                        'stock_actual' => $stockFinal,
                        'medicion_anterior' => $estanque->stock->altura_actual,
                        'medicion_posterior' => $medicionFinal,
                        'id_consumo_estanque' => $consumoEstanque->id_consumo_estanque
                    ];

                    $movimientos[] = $movimiento->id_movimiento;

                    Log::info('✅ Estanque procesado:', [
                        'id_estanque' => $estanque->id_estanque,
                        'litros_extraidos' => $litrosEstanque,
                        'stock_final' => $stockFinal,
                        'precio_aplicado' => $precioLitro
                    ]);
                }
            } else {
                // 🎯 CONSUMO SIMPLE - UN SOLO ESTANQUE
                $estanque = Estanque::with('stock')->find($request->id_estanque);

                if (!$estanque || !$estanque->stock) {
                    throw new \Exception("Estanque no encontrado o sin stock configurado");
                }

                if ($estanque->stock->stock_actual < $litrosConsumidos) {
                    throw new \Exception("Stock insuficiente en el estanque seleccionado");
                }

                $stockInicial = $estanque->stock->stock_actual;
                $stockFinal = $stockInicial - $litrosConsumidos;

                // Calcular medición final
                $medicionFinal = null;
                if ($estanque->altura_nominal && $estanque->capacidad && $estanque->capacidad > 0) {
                    $medicionFinal = ($stockFinal / $estanque->capacidad) * $estanque->altura_nominal;
                }

                // Crear registro detallado del consumo
                $consumoEstanque = new ConsumoEstanque();
                $consumoEstanque->id_consumo = $consumo->id_consumo;
                $consumoEstanque->id_estanque = $estanque->id_estanque;
                $consumoEstanque->litros_desde_estanque = $litrosConsumidos;
                $consumoEstanque->stock_inicial_estanque = $stockInicial;
                $consumoEstanque->stock_final_estanque = $stockFinal;
                $consumoEstanque->medicion_inicial = $estanque->stock->altura_actual;
                $consumoEstanque->medicion_final = $medicionFinal;

                $consumoEstanque->save();

                // Actualizar stock del estanque
                $estanque->stock->stock_actual = $stockFinal;
                if ($estanque->altura_nominal && $estanque->capacidad && $estanque->capacidad > 0) {
                    $estanque->stock->altura_actual = $medicionFinal;
                }
                $estanque->stock->ultima_medicion = $fechaConsumo;
                $estanque->stock->save();

                // Registrar movimiento
                $movimiento = new MovimientoPetroleo();
                $movimiento->id_faena = $idFaena;
                $movimiento->tipo_movimiento = 'consumo';
                $movimiento->id_referencia = $consumo->id_consumo;
                $movimiento->cantidad = -$litrosConsumidos;
                $movimiento->stock_anterior = $stockInicial;
                $movimiento->stock_actual = $stockFinal;
                $movimiento->id_usuario = $request->id_usuario;
                $movimiento->metadata = json_encode([
                    'id_estanque' => $estanque->id_estanque,
                    'nombre_estanque' => $estanque->nombre,
                    'id_grupo_operacion' => $idGrupoOperacion,
                    'tipo_operacion' => 'consumo_simple',
                    'es_consumo_multiple' => false,
                    'id_consumo_estanque' => $consumoEstanque->id_consumo_estanque
                ]);
                $movimiento->save();

                $estanquesAfectados[] = [
                    'id_estanque' => $estanque->id_estanque,
                    'nombre_estanque' => $estanque->nombre,
                    'litros_extraidos' => $litrosConsumidos,
                    'stock_anterior' => $stockInicial,
                    'stock_actual' => $stockFinal,
                    'id_consumo_estanque' => $consumoEstanque->id_consumo_estanque
                ];

                $movimientos[] = $movimiento->id_movimiento;

                Log::info('✅ Consumo simple procesado exitosamente:', [
                    'stock_final' => $stockFinal,
                    'diferencia' => $stockInicial - $stockFinal,
                    'precio_aplicado' => $precioLitro,
                    'registro_detalle_creado' => $consumoEstanque->id_consumo_estanque
                ]);
            }

            // Actualizar stock total de la faena
            $nuevoStockTotal = EstanqueStock::whereHas('estanque', fn($q) => $q->where('id_faena', $idFaena))
                ->sum('stock_actual');

            $stockPetroleo = StockPetroleo::firstOrNew(['id_faena' => $idFaena]);
            $stockPetroleo->stock_actual = $nuevoStockTotal;
            $stockPetroleo->ultima_actualizacion = $fechaConsumo;
            $stockPetroleo->save();

            DB::commit();

            Log::info('🎉 Transacción completada exitosamente:', [
                'id_consumo' => $consumo->id_consumo,
                'tipo_consumo' => $tipoConsumo,
                'estanques_afectados' => count($estanquesAfectados),
                'stock_total_faena' => $nuevoStockTotal,
                'precio_utilizado' => $precioLitro,
                'origen_precio' => $ultimoIngreso ? "Ingreso ID: {$ultimoIngreso->id}" : 'Sin ingresos previos',
                'registros_detalle' => count($estanquesAfectados),
                'movimientos_creados' => count($movimientos)
            ]);

            return response()->json([
                'success' => true,
                'message' => $esMultiple ?
                    'Consumo múltiple registrado correctamente' :
                    'Consumo simple registrado correctamente',
                'data' => [
                    'id_consumo' => $consumo->id_consumo,
                    'fecha_consumo' => $consumo->fecha_consumo->format('Y-m-d H:i:s'),
                    'fecha_consumo_formateada' => $consumo->fecha_consumo->format('d/m/Y H:i'),
                    'id_grupo_operacion' => $idGrupoOperacion,
                    'tipo_consumo' => $tipoConsumo,
                    'litros_totales' => $litrosConsumidos,
                    'precio_litro' => $precioLitro,
                    'origen_precio' => $ultimoIngreso ? 'ultimo_ingreso_petroleo' : 'sin_ingresos_previos',
                    'estanques_afectados' => $estanquesAfectados,
                    'stock_total_faena' => $nuevoStockTotal,
                    'registros_detalle_creados' => count($estanquesAfectados),
                    'movimientos_creados' => count($movimientos)
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en storeMultiEstanque', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el consumo: ' . $e->getMessage(),
                'debug_info' => [
                    'litros_consumidos' => $request->litros_consumidos ?? 'no definido',
                    'id_faena' => $request->id_faena ?? 'no definido',
                    'precio_obtenido' => isset($precioLitro) ? $precioLitro : 'no obtenido',
                    'ultimo_ingreso_encontrado' => isset($ultimoIngreso) ? ($ultimoIngreso ? 'Si' : 'No') : 'no verificado'
                ]
            ], 500);
        }
    }

    /**
     * Obtener consumos recientes
     */
    public function getConsumosRecientes(Request $request)
    {
        try {
            $faenaId = $request->get('faena');
            $limit = $request->get('limit', 5);

            $consumos = DB::table('consumos as c')
                ->select(
                    'c.id_consumo',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.observacion',
                    'c.tipo_consumo',
                    'm.nombre_maquina',
                    'm.patente',
                    // Para consumo simple: nombre del estanque directo
                    'e.nombre as estanque_simple',
                    // Para consumo múltiple: concatenar estanques
                    DB::raw("GROUP_CONCAT(
                    DISTINCT ce_estanques.nombre 
                    ORDER BY ce_estanques.nombre 
                    SEPARATOR ' / '
                ) as estanques_multiples"),
                    DB::raw("CASE 
                    WHEN pi.nombre IS NOT NULL THEN CONCAT(pi.nombre, ' ', pi.apellido)
                    ELSE pe.nombre
                END as solicitante_nombre"),
                    // Contar cuántos estanques se usaron en consumo múltiple
                    DB::raw("COUNT(DISTINCT ce.id_estanque) as cantidad_estanques")
                )
                ->leftJoin('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                // Join para consumo simple (estanque directo)
                ->leftJoin('estanques as e', 'c.id_estanque', '=', 'e.id_estanque')
                // Join para consumo múltiple (a través de consumo_estanques)
                ->leftJoin('consumo_estanques as ce', 'c.id_consumo', '=', 'ce.id_consumo')
                ->leftJoin('estanques as ce_estanques', 'ce.id_estanque', '=', 'ce_estanques.id_estanque')
                // Joins para solicitantes
                ->leftJoin('solicitantes as s', 'c.id_dotacion', '=', 's.rut')
                ->leftJoin('personal_interno as pi', function ($join) {
                    $join->on('s.rut', '=', 'pi.rut')
                        ->where('s.tipo_personal', '=', 'Interno');
                })
                ->leftJoin('personal_externo as pe', function ($join) {
                    $join->on('s.rut', '=', 'pe.rut')
                        ->where('s.tipo_personal', '=', 'Externo');
                })
                ->where('c.id_faena', $faenaId)
                ->groupBy(
                    'c.id_consumo',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.observacion',
                    'c.tipo_consumo',
                    'm.nombre_maquina',
                    'm.patente',
                    'e.nombre',
                    'pi.nombre',
                    'pi.apellido',
                    'pe.nombre'
                )
                ->orderBy('c.fecha_consumo', 'desc')
                ->limit($limit)
                ->get();

            // Procesar los resultados para crear el campo 'estanque' final
            $consumosProcessed = $consumos->map(function ($consumo) {
                // Determinar qué mostrar en el campo estanque
                if ($consumo->tipo_consumo === 'multiple' && $consumo->estanques_multiples) {
                    // Para consumo múltiple, mostrar lista de estanques
                    $estanque = $consumo->estanques_multiples;
                    if ($consumo->cantidad_estanques > 1) {
                        $estanque .= " ({$consumo->cantidad_estanques} estanques)";
                    }
                } else if ($consumo->estanque_simple) {
                    // Para consumo simple, mostrar estanque directo
                    $estanque = $consumo->estanque_simple;
                } else {
                    // Fallback si no se encuentra estanque
                    $estanque = 'N/A';
                }

                return [
                    'fecha_consumo' => $consumo->fecha_consumo,
                    'litros_consumidos' => $consumo->litros_consumidos,
                    'observacion' => $consumo->observacion,
                    'nombre_maquina' => $consumo->nombre_maquina,
                    'patente' => $consumo->patente,
                    'estanque' => $estanque,
                    'solicitante_nombre' => $consumo->solicitante_nombre,
                    'tipo_consumo' => $consumo->tipo_consumo,
                    'cantidad_estanques' => $consumo->cantidad_estanques
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $consumosProcessed
            ]);
        } catch (\Exception $e) {
            Log::error('Error en getConsumosRecientes', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener consumos recientes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener consumos con filtros de fecha
     */
    public function getConsumos(Request $request)
    {
        try {
            // Obtener parámetros de filtro
            $faena = $request->input('faena');
            $faenas = $request->input('faenas'); // 🆕 NUEVO: Múltiples faenas
            $dateFrom = $request->input('dateFrom');
            $dateTo = $request->input('dateTo');
            $equipoFilter = $request->input('equipoFilter');
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);

            // 🆕 VALIDACIÓN MODIFICADA: Aceptar faena O faenas
            if (!$faena && !$faenas) {
                return response()->json([
                    'success' => false,
                    'message' => 'El parámetro faena o faenas es requerido'
                ], 400);
            }

            // 🆕 PREPARAR ARRAY DE FAENAS
            $faenasArray = [];
            if ($faenas) {
                // Si viene el parámetro "faenas", convertir string a array
                $faenasArray = explode(',', $faenas);
            } elseif ($faena) {
                // Si viene el parámetro "faena", convertir a array
                $faenasArray = [$faena];
            }

            // 🚀 CONSULTA REFACTORIZADA: Usar vista unificada consumos_unificados
            $query = DB::table('consumos_unificados as cu')
                ->leftJoin('maquinas as m', 'cu.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('estanques as e', 'cu.id_estanque', '=', 'e.id_estanque')
                // 🆕 NOTA: Para consumos externos, estos JOINs pueden devolver NULL
                ->leftJoin('consumo_estanques as ce', function ($join) {
                    $join->on('cu.id_consumo', '=', 'ce.id_consumo')
                        ->where('cu.tipo_consumo_origen', '=', 'INTERNO'); // Solo para internos
                })
                ->leftJoin('estanques as ce_estanques', 'ce.id_estanque', '=', 'ce_estanques.id_estanque')
                ->leftJoin('faenas as f', 'cu.id_faena', '=', 'f.id_faena')
                ->leftJoin('users as u', 'cu.id_usuario', '=', 'u.id')
                // 🆕 SOLICITANTES: Solo para consumos internos
                ->leftJoin('solicitantes as s', function ($join) {
                    $join->on('cu.id_dotacion', '=', 's.rut')
                        ->where('cu.tipo_consumo_origen', '=', 'INTERNO');
                })
                ->leftJoin('personal_interno as pi', function ($join) {
                    $join->on('s.rut', '=', 'pi.rut')
                        ->where('s.tipo_personal', '=', 'Interno');
                })
                ->leftJoin('personal_externo as pe', function ($join) {
                    $join->on('s.rut', '=', 'pe.rut')
                        ->where('s.tipo_personal', '=', 'Externo');
                })
                ->leftJoin('empresas_externas as ee', 'pe.id_empresa', '=', 'ee.id_empresa')
                ->select([
                    'cu.id_consumo',
                    'cu.id_dotacion',
                    'cu.fecha_consumo',
                    'cu.litros_consumidos',
                    'cu.medicion',
                    'cu.numeral_inicial',
                    'cu.numeral_final',
                    'cu.precio_litro',
                    'cu.observacion',
                    'cu.created_at',
                    'cu.updated_at',
                    'cu.tipo_consumo',
                    'cu.tipo_consumo_origen', // 🆕 NUEVO: Campo que indica si es INTERNO o EXTERNO
                    'm.nombre_maquina',
                    'mi.patente',
                    'cm.tipo_medicion',
                    'e.nombre as estanque_simple',
                    // 🆕 ESTANQUES MÚLTIPLES: Solo para consumos internos
                    DB::raw("CASE 
                    WHEN cu.tipo_consumo_origen = 'INTERNO' THEN
                        GROUP_CONCAT(
                            DISTINCT ce_estanques.nombre 
                            ORDER BY ce_estanques.nombre 
                            SEPARATOR ' / '
                        )
                    ELSE NULL 
                END as estanques_multiples"),
                    'f.ubicacion as faena',
                    'u.nombre as usuario_nombre',
                    'u.apellido as usuario_apellido',
                    's.tipo_personal',
                    'pi.nombre as interno_nombre',
                    'pi.apellido as interno_apellido',
                    'pe.nombre as externo_nombre',
                    'ee.nombre as empresa_nombre',
                    // 🆕 CANTIDAD ESTANQUES: Solo para consumos internos
                    DB::raw("CASE 
                    WHEN cu.tipo_consumo_origen = 'INTERNO' THEN
                        COUNT(DISTINCT ce.id_estanque)
                    ELSE 1 
                END as cantidad_estanques")
                ]);

            // 🆕 FILTRO MODIFICADO: Usar whereIn para múltiples faenas
            $query->whereIn('cu.id_faena', $faenasArray);

            // Aplicar filtros de fecha
            if ($dateFrom) {
                try {
                    $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                    $query->where('cu.fecha_consumo', '>=', $fechaDesde);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Formato de fecha inválido para dateFrom. Use Y-m-d'
                    ], 400);
                }
            }

            if ($dateTo) {
                try {
                    $fechaHasta = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();
                    $query->where('cu.fecha_consumo', '<=', $fechaHasta);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Formato de fecha inválido para dateTo. Use Y-m-d'
                    ], 400);
                }
            }

            // Aplicar filtro por equipo
            if ($equipoFilter) {
                $query->where(function ($q) use ($equipoFilter) {
                    $q->where('m.nombre_maquina', 'LIKE', '%' . $equipoFilter . '%')
                        ->orWhere('mi.patente', 'LIKE', '%' . $equipoFilter . '%');
                });
            }

            // GROUP BY actualizado para la vista unificada
            $query->groupBy([
                'cu.id_consumo',
                'cu.id_dotacion',
                'cu.fecha_consumo',
                'cu.litros_consumidos',
                'cu.medicion',
                'cu.numeral_inicial',
                'cu.numeral_final',
                'cu.precio_litro',
                'cu.observacion',
                'cu.created_at',
                'cu.updated_at',
                'cu.tipo_consumo',
                'cu.tipo_consumo_origen', // 🆕 NUEVO
                'm.nombre_maquina',
                'mi.patente',
                'cm.tipo_medicion',
                'e.nombre',
                'f.ubicacion',
                'u.nombre',
                'u.apellido',
                's.tipo_personal',
                'pi.nombre',
                'pi.apellido',
                'pe.nombre',
                'ee.nombre'
            ]);

            $query->orderBy('cu.fecha_consumo', 'desc');

            // 🆕 CONTEO MODIFICADO: Usar vista unificada
            $totalRecords = DB::table('consumos_unificados as cu')
                ->leftJoin('maquinas as m', 'cu.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->whereIn('cu.id_faena', $faenasArray);

            // Aplicar los mismos filtros para el conteo
            if ($dateFrom) {
                $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                $totalRecords->where('cu.fecha_consumo', '>=', $fechaDesde);
            }

            if ($dateTo) {
                $fechaHasta = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();
                $totalRecords->where('cu.fecha_consumo', '<=', $fechaHasta);
            }

            if ($equipoFilter) {
                $totalRecords->where(function ($q) use ($equipoFilter) {
                    $q->where('m.nombre_maquina', 'LIKE', '%' . $equipoFilter . '%')
                        ->orWhere('mi.patente', 'LIKE', '%' . $equipoFilter . '%');
                });
            }

            $totalRecords = $totalRecords->count();
            $totalPages = ceil($totalRecords / $perPage);

            // Aplicar paginación
            $consumos = $query
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            // 🆕 TRANSFORMAR DATOS: Manejar tanto internos como externos
            $consumosTransformados = $consumos->map(function ($consumo) {
                $solicitanteNombre = 'N/A';
                $solicitanteTipo = $consumo->tipo_personal ?? 'N/A';

                // 🆕 LÓGICA MEJORADA: Manejar solicitantes según origen
                if ($consumo->tipo_consumo_origen === 'INTERNO') {
                    // Para consumos internos, usar la lógica existente
                    if ($consumo->tipo_personal === 'Interno' && $consumo->interno_nombre) {
                        $solicitanteNombre = trim($consumo->interno_nombre . ' ' . ($consumo->interno_apellido ?? ''));
                    } elseif ($consumo->tipo_personal === 'Externo' && $consumo->externo_nombre) {
                        $empresaNombre = $consumo->empresa_nombre ? ' (' . $consumo->empresa_nombre . ')' : '';
                        $solicitanteNombre = $consumo->externo_nombre . $empresaNombre;
                    }
                } else {
                    // Para consumos externos (Copec), el id_dotacion es el RUT del usuario
                    $solicitanteNombre = $consumo->usuario_nombre ?
                        trim(($consumo->usuario_nombre ?? '') . ' ' . ($consumo->usuario_apellido ?? '')) :
                        'Usuario Externo';
                    $solicitanteTipo = 'Externo (Copec)';
                }

                // Determinar qué mostrar en el campo estanque
                $estanque = 'N/A';
                if ($consumo->tipo_consumo_origen === 'INTERNO') {
                    // Para consumos internos, usar lógica existente
                    if ($consumo->tipo_consumo === 'multiple' && $consumo->estanques_multiples) {
                        $estanque = $consumo->estanques_multiples;
                        if ($consumo->cantidad_estanques > 1) {
                            $estanque .= " ({$consumo->cantidad_estanques} estanques)";
                        }
                    } else if ($consumo->estanque_simple) {
                        $estanque = $consumo->estanque_simple;
                    }
                } else {
                    // Para consumos externos, mostrar información de la ubicación
                    $estanque = 'Estación Externa';
                }

                return [
                    'id_consumo' => $consumo->id_consumo,
                    'id_dotacion' => $consumo->id_dotacion,
                    'fecha_consumo' => $consumo->fecha_consumo,
                    'litros_consumidos' => number_format($consumo->litros_consumidos, 2, '.', ''),
                    'precio_litro' => $consumo->precio_litro ? number_format($consumo->precio_litro, 2, '.', '') : null,
                    'costo_total' => $consumo->precio_litro
                        ? number_format($consumo->litros_consumidos * $consumo->precio_litro, 2, '.', '')
                        : null,
                    'medicion' => $consumo->medicion ? number_format($consumo->medicion, 3, '.', '') : null,
                    'numeral_inicial' => $consumo->numeral_inicial ? number_format($consumo->numeral_inicial, 3, '.', '') : null,
                    'numeral_final' => $consumo->numeral_final ? number_format($consumo->numeral_final, 3, '.', '') : null,
                    'observacion' => $consumo->observacion,
                    'nombre_maquina' => $consumo->nombre_maquina,
                    'patente' => $consumo->patente,
                    'tipo_medicion' => $consumo->tipo_medicion,
                    'estanque' => $estanque,
                    'tipo_consumo' => $consumo->tipo_consumo,
                    'tipo_consumo_origen' => $consumo->tipo_consumo_origen, // 🆕 NUEVO
                    'cantidad_estanques' => $consumo->cantidad_estanques,
                    'faena' => $consumo->faena,
                    'usuario' => trim(($consumo->usuario_nombre ?? '') . ' ' . ($consumo->usuario_apellido ?? '')),
                    'solicitante_nombre' => $solicitanteNombre,
                    'solicitante_tipo' => $solicitanteTipo,
                    'created_at' => $consumo->created_at,
                    'updated_at' => $consumo->updated_at,
                ];
            });

            // 🆕 ESTADÍSTICAS MODIFICADAS: Usar vista unificada
            $statsQuery = DB::table('consumos_unificados as cu')
                ->leftJoin('maquinas as m', 'cu.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->whereIn('cu.id_faena', $faenasArray);

            // Aplicar filtros para estadísticas
            if ($dateFrom) {
                $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                $statsQuery->where('cu.fecha_consumo', '>=', $fechaDesde);
            }

            if ($dateTo) {
                $fechaHasta = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();
                $statsQuery->where('cu.fecha_consumo', '<=', $fechaHasta);
            }

            if ($equipoFilter) {
                $statsQuery->where(function ($q) use ($equipoFilter) {
                    $q->where('m.nombre_maquina', 'LIKE', '%' . $equipoFilter . '%')
                        ->orWhere('mi.patente', 'LIKE', '%' . $equipoFilter . '%');
                });
            }

            // 🆕 ESTADÍSTICAS MEJORADAS: Incluir información de origen
            $statsGlobales = $statsQuery->selectRaw('
            COUNT(*) as total_consumos,
            SUM(litros_consumidos) as total_litros,
            AVG(litros_consumidos) as promedio_consumo,
            SUM(CASE WHEN precio_litro IS NOT NULL THEN litros_consumidos * precio_litro ELSE 0 END) as costo_total,
            SUM(CASE WHEN tipo_consumo = "simple" OR tipo_consumo_origen = "EXTERNO" THEN 1 ELSE 0 END) as consumos_simples,
            SUM(CASE WHEN tipo_consumo = "multiple" AND tipo_consumo_origen = "INTERNO" THEN 1 ELSE 0 END) as consumos_multiples,
            SUM(CASE WHEN tipo_consumo_origen = "INTERNO" THEN 1 ELSE 0 END) as consumos_internos,
            SUM(CASE WHEN tipo_consumo_origen = "EXTERNO" THEN 1 ELSE 0 END) as consumos_externos
        ')->first();

            $equipoMasUsadoGlobal = $statsQuery
                ->selectRaw('m.nombre_maquina, COUNT(*) as total_usos')
                ->groupBy('m.nombre_maquina')
                ->orderBy('total_usos', 'desc')
                ->first();

            $stats = [
                'total_consumos' => (int) $statsGlobales->total_consumos,
                'total_litros' => (float) $statsGlobales->total_litros,
                'promedio_consumo' => (float) $statsGlobales->promedio_consumo,
                'costo_total' => (float) $statsGlobales->costo_total,
                'equipo_mas_usado' => $equipoMasUsadoGlobal->nombre_maquina ?? 'N/A',
                'consumos_simples' => (int) $statsGlobales->consumos_simples,
                'consumos_multiples' => (int) $statsGlobales->consumos_multiples,
                'consumos_internos' => (int) $statsGlobales->consumos_internos, // 🆕 NUEVO
                'consumos_externos' => (int) $statsGlobales->consumos_externos, // 🆕 NUEVO
                'porcentaje_multiples' => $statsGlobales->total_consumos > 0
                    ? round(($statsGlobales->consumos_multiples / $statsGlobales->total_consumos) * 100, 2)
                    : 0,
                'porcentaje_externos' => $statsGlobales->total_consumos > 0 // 🆕 NUEVO
                    ? round(($statsGlobales->consumos_externos / $statsGlobales->total_consumos) * 100, 2)
                    : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $consumosTransformados,
                'stats' => $stats,
                'pagination' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => (int) $totalRecords,
                    'total_pages' => (int) $totalPages,
                    'from' => ($page - 1) * $perPage + 1,
                    'to' => min($page * $perPage, $totalRecords),
                ],
                'filters_applied' => [
                    'faena' => $faena,
                    'faenas' => $faenas,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'equipo_filter' => $equipoFilter,
                ],
                'message' => 'Consumos obtenidos exitosamente'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error en getConsumos', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener consumos: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
    /**
     * Obtener el equipo más usado desde una colección
     */
    private function obtenerEquipoMasUsadoFromCollection($consumos)
    {
        if ($consumos->isEmpty()) {
            return 'N/A';
        }

        $equipoCount = [];

        foreach ($consumos as $consumo) {
            $equipo = $consumo->nombre_maquina ?? 'Sin equipo';
            $equipoCount[$equipo] = ($equipoCount[$equipo] ?? 0) + 1;
        }

        if (empty($equipoCount)) {
            return 'N/A';
        }

        return array_keys($equipoCount, max($equipoCount))[0];
    }

    // Agregar este método al ConsumoController.php

    /**
     * Obtener consumos específicos de una categoría de máquinas
     * 🆕 NUEVO: Endpoint especializado para el modal de detalles del PieChart
     */
    public function getConsumosPorCategoria(Request $request)
    {
        try {
            // Obtener parámetros
            $idCategoria = $request->input('id_categoria');
            $faena = $request->input('faena');
            $dateFrom = $request->input('dateFrom');
            $dateTo = $request->input('dateTo');

            // Parámetros de paginación
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);

            // Validaciones básicas
            if (!$idCategoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'El parámetro id_categoria es requerido'
                ], 400);
            }

            if (!$faena) {
                return response()->json([
                    'success' => false,
                    'message' => 'El parámetro faena es requerido'
                ], 400);
            }

            // Validar que la categoría existe
            $categoria = DB::table('categorias_maquinas')
                ->where('id_categoria', $idCategoria)
                ->first();

            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 400);
            }

            // Construir la consulta para consumos de máquinas de esta categoría específica
            $query = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                // Join para consumo simple (estanque directo)
                ->leftJoin('estanques as e', 'c.id_estanque', '=', 'e.id_estanque')
                // Joins para consumo múltiple (a través de consumo_estanques)
                ->leftJoin('consumo_estanques as ce', 'c.id_consumo', '=', 'ce.id_consumo')
                ->leftJoin('estanques as ce_estanques', 'ce.id_estanque', '=', 'ce_estanques.id_estanque')
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
                ->select([
                    'c.id_consumo',
                    'c.id_dotacion',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.medicion',
                    'c.numeral_inicial',
                    'c.numeral_final',
                    'c.precio_litro',
                    'c.observacion',
                    'c.created_at',
                    'c.updated_at',
                    'c.tipo_consumo',
                    // Información de la máquina
                    'cm.nombre_categoria',
                    'cm.tipo_medicion',
                    DB::raw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina'),
                    DB::raw('COALESCE(mi.patente, m.patente) as patente'),
                    // Información del estanque
                    'e.nombre as estanque_simple',
                    DB::raw("GROUP_CONCAT(
                    DISTINCT ce_estanques.nombre 
                    ORDER BY ce_estanques.nombre 
                    SEPARATOR ' / '
                ) as estanques_multiples"),
                    'f.ubicacion as faena',
                    'u.nombre as usuario_nombre',
                    'u.apellido as usuario_apellido',
                    's.tipo_personal',
                    'pi.nombre as interno_nombre',
                    'pi.apellido as interno_apellido',
                    'pe.nombre as externo_nombre',
                    'ee.nombre as empresa_nombre',
                    // Contar cuántos estanques se usaron en consumo múltiple
                    DB::raw("COUNT(DISTINCT ce.id_estanque) as cantidad_estanques"),
                    // 🆕 Determinar si es máquina interna o externa
                    DB::raw('CASE WHEN mi.id_maquina IS NOT NULL THEN "Interna" ELSE "Externa" END as tipo_maquina')
                ]);

            // 🔑 FILTRO PRINCIPAL: Solo máquinas de esta categoría
            $query->where('cm.id_categoria', $idCategoria);

            // Filtrar por faena
            $query->where('c.id_faena', $faena);

            // Aplicar filtros de fecha si están presentes
            if ($dateFrom) {
                try {
                    $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                    $query->where('c.fecha_consumo', '>=', $fechaDesde);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Formato de fecha inválido para dateFrom. Use Y-m-d'
                    ], 400);
                }
            }

            if ($dateTo) {
                try {
                    $fechaHasta = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();
                    $query->where('c.fecha_consumo', '<=', $fechaHasta);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Formato de fecha inválido para dateTo. Use Y-m-d'
                    ], 400);
                }
            }

            // Añadir GROUP BY para manejar los JOINs de consumo múltiple
            $query->groupBy([
                'c.id_consumo',
                'c.id_dotacion',
                'c.fecha_consumo',
                'c.litros_consumidos',
                'c.medicion',
                'c.numeral_inicial',
                'c.numeral_final',
                'c.precio_litro',
                'c.observacion',
                'c.created_at',
                'c.updated_at',
                'c.tipo_consumo',
                'cm.nombre_categoria',
                'cm.tipo_medicion',
                'mi.nombre',
                'm.nombre_maquina',
                'mi.patente',
                'm.patente',
                'e.nombre',
                'f.ubicacion',
                'u.nombre',
                'u.apellido',
                's.tipo_personal',
                'pi.nombre',
                'pi.apellido',
                'pe.nombre',
                'ee.nombre',
                'mi.id_maquina'
            ]);

            // Ordenar por fecha más reciente
            $query->orderBy('c.fecha_consumo', 'desc');

            // 🔧 CONTAR TOTAL DE REGISTROS (sin GROUP BY para evitar problemas)
            $totalRecords = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->where('cm.id_categoria', $idCategoria)
                ->where('c.id_faena', $faena);

            // Aplicar los mismos filtros de fecha para el conteo
            if ($dateFrom) {
                $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                $totalRecords->where('c.fecha_consumo', '>=', $fechaDesde);
            }

            if ($dateTo) {
                $fechaHasta = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();
                $totalRecords->where('c.fecha_consumo', '<=', $fechaHasta);
            }

            $totalRecords = $totalRecords->count();
            $totalPages = ceil($totalRecords / $perPage);

            // Aplicar paginación
            $consumos = $query
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            // Transformar los datos
            $consumosTransformados = $consumos->map(function ($consumo) {
                // Determinar el nombre del solicitante
                $solicitanteNombre = 'N/A';
                $solicitanteTipo = $consumo->tipo_personal ?? 'N/A';

                if ($consumo->tipo_personal === 'Interno' && $consumo->interno_nombre) {
                    $solicitanteNombre = trim($consumo->interno_nombre . ' ' . ($consumo->interno_apellido ?? ''));
                } elseif ($consumo->tipo_personal === 'Externo' && $consumo->externo_nombre) {
                    $empresaNombre = $consumo->empresa_nombre ? ' (' . $consumo->empresa_nombre . ')' : '';
                    $solicitanteNombre = $consumo->externo_nombre . $empresaNombre;
                }

                // Determinar qué mostrar en el campo estanque
                $estanque = 'N/A';
                if ($consumo->tipo_consumo === 'multiple' && $consumo->estanques_multiples) {
                    // Para consumo múltiple, mostrar lista de estanques
                    $estanque = $consumo->estanques_multiples;
                    if ($consumo->cantidad_estanques > 1) {
                        $estanque .= " ({$consumo->cantidad_estanques} estanques)";
                    }
                } else if ($consumo->estanque_simple) {
                    // Para consumo simple, mostrar estanque directo
                    $estanque = $consumo->estanque_simple;
                }

                return [
                    'id_consumo' => $consumo->id_consumo,
                    'id_dotacion' => $consumo->id_dotacion,
                    'fecha_consumo' => $consumo->fecha_consumo,
                    'litros_consumidos' => number_format($consumo->litros_consumidos, 2, '.', ''),
                    'precio_litro' => $consumo->precio_litro ? number_format($consumo->precio_litro, 2, '.', '') : null,
                    'costo_total' => $consumo->precio_litro
                        ? number_format($consumo->litros_consumidos * $consumo->precio_litro, 2, '.', '')
                        : null,
                    'medicion' => $consumo->medicion ? number_format($consumo->medicion, 3, '.', '') : null,
                    'numeral_inicial' => $consumo->numeral_inicial ? number_format($consumo->numeral_inicial, 3, '.', '') : null,
                    'numeral_final' => $consumo->numeral_final ? number_format($consumo->numeral_final, 3, '.', '') : null,
                    'observacion' => $consumo->observacion,
                    'nombre_maquina' => $consumo->nombre_maquina,
                    'patente' => $consumo->patente,
                    'tipo_medicion' => $consumo->tipo_medicion,
                    'estanque' => $estanque,
                    'tipo_consumo' => $consumo->tipo_consumo,
                    'cantidad_estanques' => $consumo->cantidad_estanques,
                    'faena' => $consumo->faena,
                    'usuario' => trim(($consumo->usuario_nombre ?? '') . ' ' . ($consumo->usuario_apellido ?? '')),
                    'solicitante_nombre' => $solicitanteNombre,
                    'solicitante_tipo' => $solicitanteTipo,
                    'created_at' => $consumo->created_at,
                    'updated_at' => $consumo->updated_at,
                    'categoria_nombre' => $consumo->nombre_categoria,
                    'tipo_maquina' => $consumo->tipo_maquina, // 🆕 Interna/Externa
                ];
            });

            // 🆕 CALCULAR ESTADÍSTICAS específicas de esta categoría
            $statsQuery = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->where('cm.id_categoria', $idCategoria)
                ->where('c.id_faena', $faena);

            // Aplicar los mismos filtros de fecha para las estadísticas
            if ($dateFrom) {
                $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                $statsQuery->where('c.fecha_consumo', '>=', $fechaDesde);
            }

            if ($dateTo) {
                $fechaHasta = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();
                $statsQuery->where('c.fecha_consumo', '<=', $fechaHasta);
            }

            // Obtener estadísticas de la categoría
            $statsGlobales = $statsQuery->selectRaw('
            COUNT(*) as total_consumos,
            SUM(c.litros_consumidos) as total_litros,
            AVG(c.litros_consumidos) as promedio_consumo,
            SUM(CASE WHEN c.precio_litro IS NOT NULL THEN c.litros_consumidos * c.precio_litro ELSE 0 END) as costo_total,
            SUM(CASE WHEN c.tipo_consumo = "simple" THEN 1 ELSE 0 END) as consumos_simples,
            SUM(CASE WHEN c.tipo_consumo = "multiple" THEN 1 ELSE 0 END) as consumos_multiples
        ')->first();

            // Obtener equipo más usado en esta categoría
            $equipoMasUsadoCategoria = $statsQuery
                ->selectRaw('COALESCE(mi.nombre, m.nombre_maquina) as nombre_maquina, COUNT(*) as total_usos')
                ->groupBy('mi.nombre', 'm.nombre_maquina')
                ->orderBy('total_usos', 'desc')
                ->first();

            $stats = [
                'total_consumos' => (int) $statsGlobales->total_consumos,
                'total_litros' => (float) $statsGlobales->total_litros,
                'promedio_consumo' => (float) $statsGlobales->promedio_consumo,
                'costo_total' => (float) $statsGlobales->costo_total,
                'equipo_mas_usado' => $equipoMasUsadoCategoria->nombre_maquina ?? 'N/A',
                'consumos_simples' => (int) $statsGlobales->consumos_simples,
                'consumos_multiples' => (int) $statsGlobales->consumos_multiples,
                'porcentaje_multiples' => $statsGlobales->total_consumos > 0
                    ? round(($statsGlobales->consumos_multiples / $statsGlobales->total_consumos) * 100, 2)
                    : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $consumosTransformados,
                'stats' => $stats,
                'pagination' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => (int) $totalRecords,
                    'total_pages' => (int) $totalPages,
                    'from' => ($page - 1) * $perPage + 1,
                    'to' => min($page * $perPage, $totalRecords),
                ],
                'categoria_info' => [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria,
                    'tipo_medicion' => $categoria->tipo_medicion
                ],
                'filters_applied' => [
                    'faena' => $faena,
                    'id_categoria' => $idCategoria,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
                'message' => "Consumos de la categoría '{$categoria->nombre_categoria}' obtenidos exitosamente"
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error en getConsumosPorCategoria', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener consumos por categoría: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
    /**
     * 🎯 FUNCIÓN MEJORADA: Obtener última medición y numeral sugerido
     */
    public function getUltimaMedicion(Request $request)
    {
        try {
            $idMaquina = $request->query('id_maquina');
            $idFaena = $request->query('id_faena'); // 🆕 NUEVO PARÁMETRO

            if (!$idMaquina) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID de máquina es requerido'
                ], 400);
            }

            if (!$idFaena) { // 🆕 VALIDACIÓN
                return response()->json([
                    'success' => false,
                    'message' => 'ID de faena es requerido'
                ], 400);
            }

            // 🔍 BUSCAR MÁQUINA CON CATEGORÍA para obtener tipo_medicion
            $maquinaInfo = DB::table('maquinas as m')
                ->join('categorias_maquinas as c', 'm.id_categoria', '=', 'c.id_categoria')
                ->where('m.id_maquina', $idMaquina)
                ->select('c.tipo_medicion', 'm.patente', 'm.nombre_maquina')
                ->first();

            if (!$maquinaInfo) {
                return response()->json([
                    'success' => false,
                    'message' => "La máquina con ID {$idMaquina} no existe"
                ], 404);
            }
            // 🔍 Último consumo DE ESTA MÁQUINA EN LA FAENA ESPECÍFICA (para medición)
            $ultimoConsumoMaquina = DB::table('consumos_unificados')
                ->where('id_equipo', $idMaquina)
                ->orderBy('fecha_consumo', 'desc')
                ->orderBy('id_consumo', 'desc')
                ->select('medicion', 'fecha_consumo', 'id_consumo')
                ->first();
            // 🔍 Último numeral_final de CUALQUIER MÁQUINA en esta faena (para numeral inicial)
            // 🆕 Numeral final MÁS RECIENTE de TODOS los consumos CON TIPO DE OPERACIÓN
            $numeralMasReciente = DB::table('consumos')
                ->where('id_faena', $idFaena)
                ->orderBy('fecha_consumo', 'desc')
                ->orderBy('id_consumo', 'desc')
                ->select('numeral_final', 'fecha_consumo', 'tipo_operacion')
                ->first();
            // 🎯 Formatear numeral inicial sugerido INTELIGENTE
            $numeralInicialSugerido = null;
            if ($numeralMasReciente) {
                // 🔍 Si el último consumo fue de estanque móvil, sugerir 0
                if ($numeralMasReciente->tipo_operacion === 'estanque_movil') {
                    $numeralInicialSugerido = "0";
                } else {
                    // 🔍 Si fue de estanque fijo, usar el numeral final
                    $numeral = floatval($numeralMasReciente->numeral_final);
                    if (floor($numeral) == $numeral) {
                        $numeralInicialSugerido = (string) intval($numeral);
                    } else {
                        $numeralInicialSugerido = rtrim(rtrim(sprintf('%.3f', $numeral), '0'), '.');
                    }
                }
            }

            // 📊 Formatear medición si existe
            // 📊 Formatear medición si existe
            $medicionFormateada = null;
            if ($ultimoConsumoMaquina) {
                $medicion = floatval($ultimoConsumoMaquina->medicion);

                if ($maquinaInfo->tipo_medicion === 'Horometro') {
                    // ⏰ HORÓMETRO: Siempre 1 decimal
                    $medicionFormateada = number_format($medicion, 1, ',', '.') . ' hrs';
                } else {
                    // 🚗 KILOMETRAJE: Sin decimales (redondeado)
                    $medicionFormateada = number_format($medicion, 0, ',', '.') . ' km';
                }
            } else {
                // Si no hay consumo previo, mostrar 0
                if ($maquinaInfo->tipo_medicion === 'Horometro') {
                    $medicionFormateada = '0.0 hrs';
                } else {
                    $medicionFormateada = '0 km';
                }
            }

            // 🔍 Log para debugging (opcional, puedes removerlo en producción)
            Log::info('🔍 getUltimaMedicion Debug', [
                'id_maquina' => $idMaquina,
                'maquina_info' => $maquinaInfo,
                'ultimo_consumo_maquina' => $ultimoConsumoMaquina,
                'numeral_mas_reciente' => $numeralMasReciente,
                'medicion_formateada' => $medicionFormateada
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'tiene_consumo' => $ultimoConsumoMaquina !== null,
                    'medicion_formateada' => $medicionFormateada,
                    'numeral_inicial_sugerido' => $numeralInicialSugerido, // 🎯 Ya formateado sin decimales innecesarios

                    // 🆕 DATOS PARA VALIDACIONES DE MEDICIÓN
                    'ultimo_consumo_maquina' => $ultimoConsumoMaquina ? [
                        'medicion' => floatval($ultimoConsumoMaquina->medicion),
                        'fecha_consumo' => $ultimoConsumoMaquina->fecha_consumo,
                        'id_consumo' => $ultimoConsumoMaquina->id_consumo
                    ] : null,

                    // 🆕 Datos adicionales útiles para debugging
                    'maquina' => [
                        'patente' => $maquinaInfo->patente ?? null,
                        'nombre' => $maquinaInfo->nombre ?? null,
                        'tipo_medicion' => $maquinaInfo->tipo_medicion
                    ],
                    'ultimo_consumo_fecha' => $ultimoConsumoMaquina ? $ultimoConsumoMaquina->fecha_consumo : null,
                    'numeral_fecha' => $numeralMasReciente ? $numeralMasReciente->fecha_consumo : null
                ]
            ]);
        } catch (\Exception $e) {
            // Log del error para debugging
            Log::error('❌ Error en getUltimaMedicion', [
                'id_maquina' => $request->query('id_maquina'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el último consumo: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Obtener los últimos N consumos de una máquina específica - VERSIÓN MEJORADA
     */
    public function getUltimosConsumosMaquina($id_maquina, Request $request)
    {
        try {
            $limit = $request->input('limit', 2); // Por defecto 2 registros

            $consumos = DB::table('consumos_unificados as c')
                ->leftJoin('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                // ✅ JOIN CORREGIDO para obtener faena.ubicacion
                ->leftJoin('faenas as f', 'c.id_faena', '=', 'f.id_faena')
                ->where('c.id_equipo', $id_maquina)
                ->select([
                    'c.id_consumo',
                    'c.id_dotacion',
                    'c.id_equipo',
                    'c.id_usuario',
                    'c.fecha_consumo',
                    'c.litros_consumidos',
                    'c.tipo_consumo',
                    'c.tipo_operacion',
                    'c.id_faena',
                    'c.id_estanque',
                    'c.medicion',
                    'c.numeral_inicial',
                    'c.numeral_final',
                    'c.precio_litro',
                    'c.observacion',
                    'c.created_at',
                    'c.updated_at',

                    // Datos de la máquina
                    'm.id_maquina',
                    'm.id_categoria',
                    'm.nombre_maquina',
                    'm.tipo_maquina',
                    'm.estado',
                    'm.chc_maquina',
                    'mi.patente',

                    // ✅ DATOS DE LA FAENA MEJORADOS
                    'f.ubicacion as faena_ubicacion',
                    'f.detalle as faena_detalle',

                    // Datos de categoría para tipo de medición
                    'cm.tipo_medicion'
                ])
                ->orderBy('c.fecha_consumo', 'desc')
                ->orderBy('c.id_consumo', 'desc') // Desempate por ID
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $consumos,
                'total' => $consumos->count(),
                'machine_info' => [
                    'id_maquina' => $id_maquina,
                    'nombre_maquina' => $consumos->first()->nombre_maquina ?? null,
                    'patente' => $consumos->first()->patente ?? null,
                    'tipo_medicion' => $consumos->first()->tipo_medicion ?? null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener consumos: ' . $e->getMessage()
            ], 500);
        }
    }
}
