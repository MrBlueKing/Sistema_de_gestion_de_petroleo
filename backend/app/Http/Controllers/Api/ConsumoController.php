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
use Illuminate\Support\Carbon;

class ConsumoController extends Controller
{
    /**
     * Registra un consumo de petróleo, permitiendo usar stock directo o estanques específicos
     */
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
        // REMOVIDO: 'fecha_consumo' => 'nullable|date',
        'litros_consumidos' => 'required|numeric|min:0',
        'id_faena' => 'required|exists:faenas,id_faena',
        'id_estanque' => 'nullable|exists:estanques,id_estanque',
        'medicion' => 'nullable|numeric',
        'numeral_inicial' => 'nullable|numeric',
        'numeral_final' => 'nullable|numeric',
        'usar_stock_total' => 'nullable|boolean',
        'crear_consumo_unico' => 'nullable|boolean',
        // ✅ AGREGADO: Validación para observación
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

        // CAMBIO PRINCIPAL: Usar siempre now() con zona horaria de Chile
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
            $consumo->fecha_consumo = $fechaConsumo; // Usar fecha del servidor
            $consumo->litros_consumidos = $litrosConsumidos;
            $consumo->id_faena = $idFaena;
            // Usamos el primer estanque de la faena como referencia
            $primerEstanque = Estanque::where('id_faena', $idFaena)->first();
            $consumo->id_estanque = $primerEstanque ? $primerEstanque->id_estanque : null;
            $consumo->medicion = $request->medicion;
            $consumo->numeral_inicial = $request->numeral_inicial;
            $consumo->numeral_final = $request->numeral_final;
            $consumo->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
            // ✅ AGREGADO: Guardar observación
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
            $consumoUnico->fecha_consumo = $fechaConsumo; // Usar fecha del servidor
            $consumoUnico->litros_consumidos = $litrosConsumidos;
            $consumoUnico->id_faena = $idFaena;

            // Usamos el estanque específico si viene en la solicitud, o el primero si no
            $consumoUnico->id_estanque = $request->id_estanque ?? $estanques->first()->id_estanque;

            $consumoUnico->medicion = $request->medicion;
            $consumoUnico->numeral_inicial = $request->numeral_inicial;
            $consumoUnico->numeral_final = $request->numeral_final;
            $consumoUnico->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
            // ✅ AGREGADO: Guardar observación
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
                $consumoActual->fecha_consumo = $fechaConsumo; // Usar fecha del servidor
                $consumoActual->litros_consumidos = $litrosDeEste;
                $consumoActual->id_faena = $idFaena;
                $consumoActual->id_estanque = $estanque->id_estanque;
                $consumoActual->medicion = $request->medicion;
                $consumoActual->numeral_inicial = $request->numeral_inicial;
                $consumoActual->numeral_final = $request->numeral_final;
                $consumoActual->precio_litro = $ultimoIngreso ? $ultimoIngreso->precio : null;
                // ✅ AGREGADO: Guardar observación
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


public function getConsumosRecientes(Request $request)
{
    try {
        $faenaId = $request->get('faena');
        $limit = $request->get('limit', 5);

        $consumos = DB::table('consumos as c')
    ->select(
        'c.fecha_consumo',
        'c.litros_consumidos',
        'c.observacion',
        'm.nombre_maquina',
        'm.patente',
        'e.nombre as estanque',
        DB::raw("CASE 
            WHEN pi.nombre IS NOT NULL THEN CONCAT(pi.nombre, ' ', pi.apellido)
            ELSE pe.nombre
        END as solicitante_nombre")
    )
    ->leftJoin('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
    ->leftJoin('estanques as e', 'c.id_estanque', '=', 'e.id_estanque')
    ->leftJoin('solicitantes as s', 'c.id_dotacion', '=', 's.rut')
    ->leftJoin('personal_interno as pi', function($join) {
        $join->on('s.rut', '=', 'pi.rut')
             ->where('s.tipo_personal', '=', 'Interno');
    })
    ->leftJoin('personal_externo as pe', function($join) {
        $join->on('s.rut', '=', 'pe.rut')
             ->where('s.tipo_personal', '=', 'Externo');
    })
    ->where('c.id_faena', $faenaId)
    ->orderBy('c.fecha_consumo', 'desc')
    ->limit($limit)
    ->get();


        return response()->json([
            'success' => true,
            'data' => $consumos
        ]);

    } catch (\Exception $e) {
        Log::error('Error en getConsumosRecientes', [
            'exception' => $e->getMessage()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener consumos recientes',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Obtener consumos con filtros de fecha - SIN AUTENTICACIÓN
     */
    public function getConsumos(Request $request)
    {
        try {
            // Obtener parámetros de filtro
            $faena = $request->input('faena');
            $dateFrom = $request->input('dateFrom');
            $dateTo = $request->input('dateTo');

            // Validar que al menos venga la faena
            if (!$faena) {
                return response()->json([
                    'success' => false,
                    'message' => 'El parámetro faena es requerido'
                ], 400);
            }

            // Construir la consulta con joins para obtener toda la información necesaria
            $query = DB::table('consumos as c')
                ->leftJoin('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina')
                ->leftJoin('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->leftJoin('estanques as e', 'c.id_estanque', '=', 'e.id_estanque')
                ->leftJoin('faenas as f', 'c.id_faena', '=', 'f.id_faena')
                ->leftJoin('users as u', 'c.id_usuario', '=', 'u.id')
                ->leftJoin('solicitantes as s', 'c.id_dotacion', '=', 's.rut')
                ->leftJoin('personal_interno as pi', function($join) {
                    $join->on('s.rut', '=', 'pi.rut')
                         ->where('s.tipo_personal', '=', 'Interno');
                })
                ->leftJoin('personal_externo as pe', function($join) {
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
                    'm.nombre_maquina',
                    'mi.patente',
                    'cm.tipo_medicion',
                    'e.nombre as estanque',
                    'f.ubicacion as faena',
                    'u.nombre as usuario_nombre',
                    'u.apellido as usuario_apellido',
                    's.tipo_personal',
                    'pi.nombre as interno_nombre',
                    'pi.apellido as interno_apellido',
                    'pe.nombre as externo_nombre',
                    'ee.nombre as empresa_nombre'
                ]);

            // Filtrar por faena
            $query->where('c.id_faena', $faena);

            // Aplicar filtros de fecha
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

            // Ordenar por fecha más reciente
            $consumos = $query->orderBy('c.fecha_consumo', 'desc')->get();

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
                    'estanque' => $consumo->estanque,
                    'faena' => $consumo->faena,
                    'usuario' => trim(($consumo->usuario_nombre ?? '') . ' ' . ($consumo->usuario_apellido ?? '')),
                    'solicitante_nombre' => $solicitanteNombre,
                    'solicitante_tipo' => $solicitanteTipo,
                    'created_at' => $consumo->created_at,
                    'updated_at' => $consumo->updated_at,
                ];
            });

            // Calcular estadísticas
            $totalLitros = $consumos->sum('litros_consumidos');
            $totalConsumos = $consumos->count();
            
            $costoTotal = $consumos->filter(function($item) {
                return $item->precio_litro !== null;
            })->sum(function($item) {
                return $item->litros_consumidos * $item->precio_litro;
            });

            $equipoMasUsado = $this->obtenerEquipoMasUsadoFromCollection($consumos);

            $stats = [
                'total_consumos' => $totalConsumos,
                'total_litros' => $totalLitros,
                'promedio_consumo' => $totalConsumos > 0 ? $totalLitros / $totalConsumos : 0,
                'costo_total' => $costoTotal,
                'equipo_mas_usado' => $equipoMasUsado,
            ];

            return response()->json([
                'success' => true,
                'data' => $consumosTransformados,
                'stats' => $stats,
                'filters_applied' => [
                    'faena' => $faena,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
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
     * Obtener información del solicitante por RUT
     */
    private function obtenerInfoSolicitante($rut)
    {
        if (!$rut) {
            return ['nombre' => 'N/A', 'tipo' => 'N/A'];
        }

        // Buscar en solicitantes para determinar el tipo
        $solicitante = Solicitante::where('rut', $rut)->first();
        
        if (!$solicitante) {
            return ['nombre' => 'Solicitante no encontrado', 'tipo' => 'N/A'];
        }

        if ($solicitante->tipo_personal === 'Interno') {
            $personal = PersonalInterno::where('rut', $rut)->first();
            if ($personal) {
                return [
                    'nombre' => trim($personal->nombre . ' ' . ($personal->apellido ?? '')),
                    'tipo' => 'Interno'
                ];
            }
        } else {
            $personal = PersonalExterno::with('empresa')->where('rut', $rut)->first();
            if ($personal) {
                return [
                    'nombre' => $personal->nombre . ' (' . ($personal->empresa->nombre ?? 'Empresa N/A') . ')',
                    'tipo' => 'Externo'
                ];
            }
        }

        return ['nombre' => 'Información no disponible', 'tipo' => $solicitante->tipo_personal];
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

    /**
     * Obtener el equipo más usado (método original)
     */
    private function obtenerEquipoMasUsado($consumos)
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
}

