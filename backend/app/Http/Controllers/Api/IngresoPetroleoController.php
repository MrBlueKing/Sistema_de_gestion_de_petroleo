<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estanque;
use App\Models\EstanqueStock;
use App\Models\IngresoPetroleo;
use App\Models\StockPetroleo;
use App\Models\Trasvasije;
use App\Models\TrasvasijeDestino;
use App\Models\VerificacionAltura;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;  // ✅ ESTE ES IMPORTANTE
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class IngresoPetroleoController extends Controller
{
 public function index(Request $request)
{
    try {
        // Obtener parámetros de filtro
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');
        $faenaId = $request->input('faena');

        Log::info('🔍 Consultando ingresos de petróleo', [
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'faena_id' => $faenaId
        ]);

        // Query base - SIMPLIFICADO para evitar errores de relación
        $query = IngresoPetroleo::select([
            'id_ingreso',
            'numero_guia',
            'litros_documentados',
            'litros_recibidos', 
            'precio',
            'precio_total',
            'diferencia',
            'id_faena',
            'id_usuario',
            'observacion',
            'recibo_conforme',
            'created_at'
        ]);

        // Aplicar filtros de fecha
        if ($fechaInicio) {
            $query->whereDate('created_at', '>=', $fechaInicio);
        }

        if ($fechaFin) {
            $query->whereDate('created_at', '<=', $fechaFin);
        }

        // Aplicar filtro de faena
        if ($faenaId && $faenaId !== 'todas') {
            $query->where('id_faena', $faenaId);
        }

        // Obtener los datos ordenados por fecha descendente
        $ingresos = $query->orderBy('created_at', 'desc')->get();

        Log::info('✅ Consulta exitosa', ['total_registros' => $ingresos->count()]);

        // Formatear los datos manualmente para evitar errores de relación
        $ingresosFormateados = $ingresos->map(function ($ingreso) {
            
            // Obtener datos de faena manualmente
            $faena = DB::table('faenas')->where('id_faena', $ingreso->id_faena)->first();
            $usuario = DB::table('users')->where('id', $ingreso->id_usuario)->first();
            
            return [
                'id_ingreso' => $ingreso->id_ingreso,
                'numero_guia' => $ingreso->numero_guia,
                'litros_documentados' => (float) $ingreso->litros_documentados,
                'litros_recibidos' => (float) $ingreso->litros_recibidos,
                'precio' => (float) $ingreso->precio,
                'precio_total' => (float) $ingreso->precio_total,
                'diferencia' => (float) ($ingreso->diferencia ?? 0),
                'observacion' => $ingreso->observacion,
                'recibo_conforme' => (bool) $ingreso->recibo_conforme,
                'fecha_ingreso' => $ingreso->created_at->format('Y-m-d'),
                'hora_ingreso' => $ingreso->created_at->format('H:i:s'),
                'timestamp' => $ingreso->created_at->toISOString(),
                
                // Datos de la faena
                'id_faena' => $ingreso->id_faena,
                'nombre_faena' => $faena ? ($faena->ubicacion ?? $faena->nombre ?? 'Sin Faena') : 'Sin Faena',
                'faena' => [
                    'id_faena' => $ingreso->id_faena,
                    'ubicacion' => $faena ? ($faena->ubicacion ?? 'Sin Ubicación') : 'Sin Ubicación',
                    'nombre' => $faena ? ($faena->nombre ?? 'Sin Nombre') : 'Sin Nombre'
                ],
                
                // Datos del usuario
                'usuario' => $usuario ? ($usuario->name ?? $usuario->nombre ?? 'Usuario Desconocido') : 'Usuario Desconocido',
                'id_usuario' => $ingreso->id_usuario
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $ingresosFormateados,
            'metadata' => [
                'total_registros' => $ingresosFormateados->count(),
                'filtros_aplicados' => [
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin' => $fechaFin,
                    'faena_id' => $faenaId
                ],
                'fecha_consulta' => now()->toISOString()
            ]
        ], 200);

    } catch (\Exception $e) {
        Log::error('❌ Error al obtener ingresos de petróleo', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'parametros' => $request->all()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Error al obtener los ingresos de petróleo',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function store(Request $request)
    {
        Log::info('Llegó solicitud a /api/ingresos-petroleo', $request->all());

        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'numero_guia' => 'required|string',
            'litros_documentados' => 'required|numeric|min:0',
            'litros_recibidos' => 'required',
            'precio' => 'required|numeric|min:0',
            'precio_total' => 'required|numeric|min:0',
            'recibo_conforme' => 'required|boolean',
            'observacion' => 'nullable|string|max:255',
            'id_faena' => 'required|exists:faenas,id_faena',
            'stock_inicial' => 'required|numeric|min:0',
            'diferencia' => 'required|numeric',
            'alturas_estanques' => 'required|array',
            'alturas_estanques.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas_estanques.*.altura' => 'required|numeric|min:0',
            'alturas_estanques.*.tipo' => 'required|in:inicial,final',
            // 🆕 NUEVA VALIDACIÓN PARA DISTRIBUCIÓN
            'distribucion_litros' => 'sometimes|array',
        ]);

        try {
            DB::beginTransaction();

            // 1. Calcular stock inicial TOTAL de la faena
            $stockInicialFaena = EstanqueStock::whereHas('estanque', function ($q) use ($request) {
                $q->where('id_faena', $request->id_faena)->where('activo', 1);
            })->sum('stock_actual');

            $idFaena = $request->id_faena;
            $litrosRecibidos = $request->litros_recibidos;

            // Crear el registro de ingreso
            $ingreso = new IngresoPetroleo();
            $ingreso->id_usuario = $request->id_usuario;
            $ingreso->id_faena = $request->id_faena;
            $ingreso->numero_guia = $request->numero_guia;
            $ingreso->litros_documentados = $request->litros_documentados;
            $ingreso->litros_recibidos = $request->litros_recibidos;
            $ingreso->precio = $request->precio;
            $ingreso->precio_total = $request->precio_total;
            $ingreso->recibo_conforme = $request->recibo_conforme;
            $ingreso->observacion = $request->observacion;
            $ingreso->diferencia = $request->diferencia;
            $ingreso->stock_inicial = $stockInicialFaena; // ← STOCK TOTAL FAENA
            $ingreso->save();

            // 🆕 OBTENER DISTRIBUCIÓN DE LITROS
            $distribucionLitros = $request->input('distribucion_litros', []);

            // Agrupar alturas por estanque y tipo
            $alturasPorEstanque = [];
            foreach ($request->alturas_estanques as $altura) {
                $idEstanque = $altura['id_estanque'];
                $tipo = $altura['tipo'];

                if (!isset($alturasPorEstanque[$idEstanque])) {
                    $alturasPorEstanque[$idEstanque] = [];
                }

                $alturasPorEstanque[$idEstanque][$tipo] = $altura['altura'];
            }

            // Procesar cada estanque
            foreach ($alturasPorEstanque as $idEstanque => $alturas) {
                $estanque = Estanque::find($idEstanque);

                // 🆕 OBTENER LITROS ASIGNADOS A ESTE ESTANQUE
                $litrosAsignados = isset($distribucionLitros[$idEstanque])
                    ? floatval($distribucionLitros[$idEstanque])
                    : 0;

                // Obtener stock inicial del estanque
                $estanqueStock = EstanqueStock::where('id_estanque', $idEstanque)->first();
                $stockInicialEstanque = $estanqueStock ? $estanqueStock->stock_actual : 0;

                // 1️⃣ PRIMER REGISTRO: Estado INICIAL
                if (isset($alturas['inicial'])) {
                    $alturaMedidaInicial = $alturas['inicial'];
                    $volumenCalculadoInicial = ($alturaMedidaInicial / $estanque->altura_nominal) * $estanque->capacidad;

                    $verificacionInicial = new VerificacionAltura();
                    $verificacionInicial->id_estanque = $idEstanque;
                    $verificacionInicial->id_ingreso = $ingreso->id_ingreso;
                    $verificacionInicial->altura_medicion = $alturaMedidaInicial;
                    $verificacionInicial->volumen_calculado = $volumenCalculadoInicial;
                    $verificacionInicial->stock_inicial = $stockInicialEstanque; // 👈 STOCK INICIAL REAL
                    $verificacionInicial->verificado = true;
                    $verificacionInicial->save();

                    Log::info('Verificación INICIAL guardada', [
                        'id_estanque' => $idEstanque,
                        'stock_inicial_estanque' => $stockInicialEstanque,
                        'altura_inicial' => $alturaMedidaInicial,
                        'volumen_inicial' => $volumenCalculadoInicial
                    ]);
                }

                // 2️⃣ SEGUNDO REGISTRO: Estado FINAL
                if (isset($alturas['final'])) {
                    $alturaMedidaFinal = $alturas['final'];
                    $volumenCalculadoFinal = ($alturaMedidaFinal / $estanque->altura_nominal) * $estanque->capacidad;

                    $verificacionFinal = new VerificacionAltura();
                    $verificacionFinal->id_estanque = $idEstanque;
                    $verificacionFinal->id_ingreso = $ingreso->id_ingreso;
                    $verificacionFinal->altura_medicion = $alturaMedidaFinal;
                    $verificacionFinal->volumen_calculado = $volumenCalculadoFinal;
                    // 🎯 AQUÍ ES DONDE GUARDAMOS LOS LITROS INGRESADOS
                    $verificacionFinal->stock_inicial = $litrosAsignados; // 👈 LITROS INGRESADOS A ESTE ESTANQUE
                    $verificacionFinal->verificado = true;
                    $verificacionFinal->save();

                    Log::info('Verificación FINAL guardada', [
                        'id_estanque' => $idEstanque,
                        'litros_ingresados' => $litrosAsignados, // 👈 ESTO SE GUARDA EN stock_inicial
                        'altura_final' => $alturaMedidaFinal,
                        'volumen_final' => $volumenCalculadoFinal
                    ]);

                    // Actualizar stock del estanque usando la función existente
                    $this->actualizarStock($idEstanque, $request->id_faena, $litrosAsignados, $alturaMedidaFinal);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $ingreso,
                'message' => 'Ingreso registrado correctamente.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar ingreso de petróleo', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el ingreso: ' . $e->getMessage()
            ], 500);
        }
    }

    // CASO 1: RECEPCIÓN TRADICIONAL (Copec → Estanques fijos)
    public function storeRecepcionFijos(Request $request)
    {
        Log::info('Recepción a estanques fijos', $request->all());

        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'numero_guia' => 'required|string',
            'litros_documentados' => 'required|numeric|min:0',
            'litros_recibidos' => 'required|numeric|min:0',
            'precio' => 'required|numeric|min:0',
            'precio_total' => 'required|numeric|min:0',
            'recibo_conforme' => 'required|boolean',
            'observacion' => 'nullable|string|max:255',
            'id_faena' => 'required|exists:faenas,id_faena',
            'stock_inicial' => 'required|numeric|min:0',
            'diferencia' => 'required|numeric',
            'alturas_estanques' => 'required|array',
            'alturas_estanques.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas_estanques.*.altura' => 'required|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            // Crear ingreso con tipo estanques_fijos
            $ingreso = new IngresoPetroleo();
            $ingreso->id_usuario = $request->id_usuario;
            $ingreso->id_faena = $request->id_faena;
            $ingreso->numero_guia = $request->numero_guia;
            $ingreso->tipo_recepcion = 'estanques_fijos'; // ← NUEVO
            $ingreso->id_estanque_movil = null; // ← NUEVO
            $ingreso->litros_documentados = $request->litros_documentados;
            $ingreso->litros_recibidos = $request->litros_recibidos;
            $ingreso->precio = $request->precio;
            $ingreso->precio_total = $request->precio_total;
            $ingreso->recibo_conforme = $request->recibo_conforme;
            $ingreso->observacion = $request->observacion;
            $ingreso->diferencia = $request->diferencia;
            $ingreso->stock_inicial = $request->stock_inicial;
            $ingreso->save();

            // Procesar alturas (igual que antes)
            if ($request->has('alturas_estanques') && is_array($request->alturas_estanques)) {
                foreach ($request->alturas_estanques as $altura) {
                    $idEstanque = $altura['id_estanque'];
                    $alturaMedida = $altura['altura'];

                    $estanque = Estanque::find($idEstanque);
                    $estanqueStock = EstanqueStock::where('id_estanque', $idEstanque)->first();
                    $stockInicialEstanque = $estanqueStock ? $estanqueStock->stock_actual : 0;

                    $volumenCalculado = ($alturaMedida / $estanque->altura_nominal) * $estanque->capacidad;

                    if ($volumenCalculado > $estanque->capacidad) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "El estanque '{$estanque->nombre}' excedería su capacidad máxima"
                        ], 400);
                    }

                    // Guardar verificación
                    $verificacion = new VerificacionAltura();
                    $verificacion->id_estanque = $idEstanque;
                    $verificacion->id_ingreso = $ingreso->id_ingreso;
                    $verificacion->altura_medicion = $alturaMedida;
                    $verificacion->volumen_calculado = $volumenCalculado;
                    $verificacion->stock_inicial = $stockInicialEstanque;
                    $verificacion->verificado = true;
                    $verificacion->save();

                    // Actualizar stock
                    $this->actualizarStock($idEstanque, $request->id_faena, $volumenCalculado, $alturaMedida);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $ingreso,
                'message' => 'Recepción a estanques fijos registrada correctamente.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en recepción fijos', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar recepción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar ingreso de petróleo a estanque móvil
     * Este método NO usa medición de alturas, solo litros directos
     */
    public function storeRecepcionMovil(Request $request)
    {
        Log::info('🚛 Iniciando recepción para estanque móvil', $request->all());

        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'id_faena' => 'required|exists:faenas,id_faena',
            'numero_guia' => 'required|string|max:255',
            'litros_documentados' => 'required|numeric|min:0',
            'litros_recibidos' => 'required|numeric|min:0',
            'precio' => 'required|numeric|min:0',
            'precio_total' => 'required|numeric|min:0',
            'recibo_conforme' => 'required|boolean',
            'observacion' => 'nullable|string|max:500',
            'id_estanque_movil' => 'required|exists:estanques,id_estanque', // Estanque móvil específico
            'diferencia' => 'required|numeric',
        ]);

        try {
            DB::beginTransaction();

            // Verificar que el estanque sea móvil
            $estanqueMovil = Estanque::find($request->id_estanque_movil);
            if (!$estanqueMovil || $estanqueMovil->tipo_estanque !== 'movil') {
                throw new \Exception("El estanque seleccionado no es un estanque móvil válido");
            }

            // Obtener stock inicial del estanque móvil
            $estanqueStock = EstanqueStock::where('id_estanque', $request->id_estanque_movil)->first();
            $stockInicial = $estanqueStock ? $estanqueStock->stock_actual : 0;

            // Verificar capacidad del estanque móvil
            $nuevoStock = $stockInicial + $request->litros_recibidos;
            if ($nuevoStock > $estanqueMovil->capacidad) {
                throw new \Exception("El estanque móvil '{$estanqueMovil->nombre}' excedería su capacidad máxima. Capacidad: {$estanqueMovil->capacidad}L, Stock actual: {$stockInicial}L, Intentando agregar: {$request->litros_recibidos}L");
            }

            // 📝 1. GUARDAR EN INGRESO_PETROLEO
            $ingreso = new IngresoPetroleo();
            $ingreso->id_usuario = $request->id_usuario;
            $ingreso->id_faena = $request->id_faena;
            $ingreso->numero_guia = $request->numero_guia;
            $ingreso->litros_documentados = $request->litros_documentados;
            $ingreso->litros_recibidos = $request->litros_recibidos;
            $ingreso->precio = $request->precio;
            $ingreso->precio_total = $request->precio_total;
            $ingreso->recibo_conforme = $request->recibo_conforme;
            $ingreso->observacion = $request->observacion;
            $ingreso->diferencia = $request->diferencia;
            $ingreso->stock_inicial = $stockInicial;
            $ingreso->tipo_recepcion = 'estanque_movil'; // 🎯 CAMPO CLAVE
            $ingreso->save();

            Log::info('✅ Ingreso móvil guardado en ingreso_petroleo', [
                'id_ingreso' => $ingreso->id_ingreso,
                'tipo_recepcion' => 'movil',
                'estanque_movil' => $estanqueMovil->nombre
            ]);

            // 📝 2. GUARDAR EN VERIFICACION_ALTURAS (con campos especiales para móviles)
            $verificacion = new VerificacionAltura();
            $verificacion->id_estanque = $request->id_estanque_movil;
            $verificacion->id_ingreso = $ingreso->id_ingreso;
            $verificacion->altura_medicion = 0; // ❌ NO hay medición de altura
            $verificacion->volumen_calculado = $request->litros_recibidos; // ✅ Litros directos
            $verificacion->stock_inicial = $stockInicial;
            $verificacion->verificado = true;
            $verificacion->tipo_operacion = 'ingreso_movil'; // 🆕 Campo para distinguir
            $verificacion->save();

            Log::info('✅ Verificación guardada para estanque móvil', [
                'id_estanque' => $request->id_estanque_movil,
                'litros_ingresados' => $request->litros_recibidos,
                'tipo_operacion' => 'ingreso_movil'
            ]);

            // 📝 3. ACTUALIZAR STOCK DEL ESTANQUE MÓVIL
            if ($estanqueStock) {
                $estanqueStock->stock_actual = $nuevoStock;
                $estanqueStock->ultima_medicion = now();
                $estanqueStock->save();
            } else {
                EstanqueStock::create([
                    'id_estanque' => $request->id_estanque_movil,
                    'stock_actual' => $request->litros_recibidos,
                    'altura_actual' => null, // No aplica para móviles
                    'ultima_medicion' => now()
                ]);
            }

            Log::info('✅ Stock actualizado en estanque móvil', [
                'id_estanque' => $request->id_estanque_movil,
                'stock_anterior' => $stockInicial,
                'stock_nuevo' => $nuevoStock
            ]);

            // 📝 4. OPCIONAL: REGISTRAR EN MOVIMIENTOS_PETROLEO (si quieres mantener historial detallado)
            $this->registrarMovimientoPetroleo([
                'id_estanque' => $request->id_estanque_movil,
                'id_faena' => $request->id_faena,
                'id_usuario' => $request->id_usuario,
                'tipo_movimiento' => 'ingreso_movil',
                'cantidad_litros' => $request->litros_recibidos,
                'stock_anterior' => $stockInicial,
                'stock_posterior' => $nuevoStock,
                'referencia_id' => $ingreso->id_ingreso,
                'referencia_tipo' => 'ingreso_petroleo',
                'observacion' => "Recepción móvil: {$request->numero_guia}"
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'ingreso' => $ingreso,
                    'estanque_movil' => $estanqueMovil->nombre,
                    'stock_anterior' => $stockInicial,
                    'stock_nuevo' => $nuevoStock,
                    'tipo_recepcion' => 'movil'
                ],
                'message' => 'Recepción en estanque móvil registrada correctamente.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Error al registrar recepción móvil', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar la recepción móvil: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar movimiento detallado en tabla movimientos_petroleo
     */
    private function registrarMovimientoPetroleo($datos)
    {
        try {
            // Verificar si existe la tabla movimientos_petroleo
            if (!Schema::hasTable('movimientos_petroleo')) {
                Log::warning('⚠️ Tabla movimientos_petroleo no existe, saltando registro detallado');
                return;
            }

            $movimiento = new \App\Models\MovimientoPetroleo();
            $movimiento->id_estanque = $datos['id_estanque'];
            $movimiento->id_faena = $datos['id_faena'];
            $movimiento->id_usuario = $datos['id_usuario'];
            $movimiento->tipo_movimiento = $datos['tipo_movimiento'];
            $movimiento->cantidad_litros = $datos['cantidad_litros'];
            $movimiento->stock_anterior = $datos['stock_anterior'];
            $movimiento->stock_posterior = $datos['stock_posterior'];
            $movimiento->referencia_id = $datos['referencia_id'];
            $movimiento->referencia_tipo = $datos['referencia_tipo'];
            $movimiento->observacion = $datos['observacion'];
            $movimiento->save();

            Log::info('📝 Movimiento registrado en movimientos_petroleo', [
                'tipo' => $datos['tipo_movimiento'],
                'cantidad' => $datos['cantidad_litros']
            ]);
        } catch (\Exception $e) {
            Log::warning('⚠️ No se pudo registrar en movimientos_petroleo', [
                'error' => $e->getMessage()
            ]);
        }
    }


    // CASO 3: TRASVASIJE (Estanque móvil → Estanques fijos)
    public function storeTrasvasije(Request $request)
    {
        Log::info('Trasvasije de estanque móvil', $request->all());

        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'id_estanque_origen' => 'required|exists:estanques,id_estanque',
            'litros_total_trasvasije' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string|max:255',
            'id_faena' => 'required|exists:faenas,id_faena',
            'medicion_inicial_origen' => 'nullable|numeric|min:0',
            'medicion_final_origen' => 'nullable|numeric|min:0',
            'destinos' => 'required|array|min:1',
            'destinos.*.id_estanque_destino' => 'required|exists:estanques,id_estanque',
            'destinos.*.litros_hacia_destino' => 'required|numeric|min:0',
            'destinos.*.medicion_inicial_destino' => 'nullable|numeric|min:0',
            'destinos.*.medicion_final_destino' => 'nullable|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            // Validar estanque origen es móvil
            $estanqueOrigen = Estanque::find($request->id_estanque_origen);
            if ($estanqueOrigen->tipo_estanque !== 'movil') {
                return response()->json([
                    'success' => false,
                    'message' => 'El estanque origen debe ser de tipo móvil'
                ], 400);
            }

            // Validar estanques destino son fijos (manual o automático)
            foreach ($request->destinos as $destino) {
                $estanqueDestino = Estanque::find($destino['id_estanque_destino']);
                if (!in_array($estanqueDestino->tipo_estanque, ['fijo', 'fijo_automatico'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "El estanque destino '{$estanqueDestino->nombre}' debe ser de tipo fijo (manual o automático)"
                    ], 400);
                }
            }

            // Validar que la suma de destinos = total trasvasije
            $sumaDestinos = collect($request->destinos)->sum('litros_hacia_destino');
            if (abs($sumaDestinos - $request->litros_total_trasvasije) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => "La suma de litros hacia destinos ({$sumaDestinos}) no coincide con el total a trasvasijar ({$request->litros_total_trasvasije})"
                ], 400);
            }

            // Obtener stock inicial del origen
            $stockOrigenAntes = EstanqueStock::where('id_estanque', $request->id_estanque_origen)->first();
            $stockInicialOrigen = $stockOrigenAntes ? $stockOrigenAntes->stock_actual : 0;

            // Validar stock suficiente
            if ($stockInicialOrigen < $request->litros_total_trasvasije) {
                return response()->json([
                    'success' => false,
                    'message' => "Stock insuficiente en estanque origen. Disponible: {$stockInicialOrigen}L"
                ], 400);
            }

            // Crear registro de trasvasije
            $trasvasije = new Trasvasije();
            $trasvasije->id_usuario = $request->id_usuario;
            $trasvasije->id_estanque_origen = $request->id_estanque_origen;
            $trasvasije->fecha_trasvasije = now();
            $trasvasije->litros_total_trasvasije = $request->litros_total_trasvasije;
            $trasvasije->stock_inicial_origen = $stockInicialOrigen;
            $trasvasije->stock_final_origen = $stockInicialOrigen - $request->litros_total_trasvasije;
            $trasvasije->medicion_inicial_origen = $request->medicion_inicial_origen;
            $trasvasije->medicion_final_origen = $request->medicion_final_origen;
            $trasvasije->observaciones = $request->observaciones;
            $trasvasije->id_faena = $request->id_faena;
            $trasvasije->save();

            // Procesar cada destino
            foreach ($request->destinos as $destino) {
                $idEstanqueDestino = $destino['id_estanque_destino'];
                $litrosHaciaDestino = $destino['litros_hacia_destino'];

                // Obtener stock inicial del destino
                $stockDestinoAntes = EstanqueStock::where('id_estanque', $idEstanqueDestino)->first();
                $stockInicialDestino = $stockDestinoAntes ? $stockDestinoAntes->stock_actual : 0;

                // Crear registro detalle
                $trasvasijeDestino = new TrasvasijeDestino();
                $trasvasijeDestino->id_trasvasije = $trasvasije->id_trasvasije;
                $trasvasijeDestino->id_estanque_destino = $idEstanqueDestino;
                $trasvasijeDestino->litros_hacia_destino = $litrosHaciaDestino;
                $trasvasijeDestino->stock_inicial_destino = $stockInicialDestino;
                $trasvasijeDestino->stock_final_destino = $stockInicialDestino + $litrosHaciaDestino;
                $trasvasijeDestino->medicion_inicial_destino = $destino['medicion_inicial_destino'] ?? null;
                $trasvasijeDestino->medicion_final_destino = $destino['medicion_final_destino'] ?? null;
                $trasvasijeDestino->save();

                // Actualizar stock del destino (sumar)
                $this->actualizarStock($idEstanqueDestino, $request->id_faena, $litrosHaciaDestino);
            }

            // Actualizar stock del origen (restar)
            $this->actualizarStock($request->id_estanque_origen, $request->id_faena, -$request->litros_total_trasvasije);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'trasvasije' => $trasvasije,
                    'destinos_procesados' => count($request->destinos)
                ],
                'message' => 'Trasvasije registrado correctamente.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en trasvasije', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar trasvasije: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Función auxiliar para actualizar el stock de petróleo
     * 
     * @param int $idEstanque El ID del estanque
     * @param int $idFaena El ID de la faena
     * @param float $cantidadLitros La cantidad de litros (positivo para ingresos, negativo para consumos)
     * @param float $nuevaAltura La nueva altura medida (opcional, solo para ingresos)
     * @return bool
     * @throws \Exception
     */
    // MÉTODO ACTUALIZADO para soportar todos los casos
    protected function actualizarStock($idEstanque, $idFaena, $cantidadLitros, $nuevaAltura = null)
    {
        try {
            $estanque = Estanque::find($idEstanque);
            if (!$estanque) {
                throw new \Exception("El estanque con ID {$idEstanque} no existe");
            }

            $estanqueStock = EstanqueStock::where('id_estanque', $idEstanque)->first();
            $stockActual = $estanqueStock ? $estanqueStock->stock_actual : 0;

            // Para ingresos, actualizar directamente con el valor calculado en lugar de sumar
            if ($cantidadLitros > 0 && $nuevaAltura !== null) {
                $volumenNuevo = ($nuevaAltura / $estanque->altura_nominal) * $estanque->capacidad;

                if ($volumenNuevo > $estanque->capacidad) {
                    throw new \Exception("El nuevo stock ({$volumenNuevo} litros) excedería la capacidad del estanque '{$estanque->nombre}' ({$estanque->capacidad} litros)");
                }

                if ($estanqueStock) {
                    $estanqueStock->stock_actual = $volumenNuevo;
                    $estanqueStock->altura_actual = $nuevaAltura;
                    $estanqueStock->ultima_medicion = now();
                    $estanqueStock->save();

                    Log::info('Stock de estanque actualizado en ingreso', [
                        'id_estanque' => $idEstanque,
                        'stock_anterior' => $stockActual,
                        'stock_nuevo' => $volumenNuevo
                    ]);
                } else {
                    EstanqueStock::create([
                        'id_estanque' => $idEstanque,
                        'stock_actual' => $volumenNuevo,
                        'altura_actual' => $nuevaAltura,
                        'ultima_medicion' => now()
                    ]);

                    Log::info('Registro de stock creado para estanque', [
                        'id_estanque' => $idEstanque,
                        'stock_inicial' => $volumenNuevo
                    ]);
                }
            } else {
                // Para consumos o modo antiguo
                if ($estanqueStock) {
                    if ($cantidadLitros < 0 && $estanqueStock->stock_actual < abs($cantidadLitros)) {
                        throw new \Exception('Stock insuficiente en el estanque');
                    }

                    $estanqueStock->stock_actual += $cantidadLitros;
                    $estanqueStock->ultima_medicion = now();

                    if ($nuevaAltura !== null) {
                        $estanqueStock->altura_actual = $nuevaAltura;
                    }

                    $estanqueStock->save();
                } else {
                    $nuevoStock = [
                        'id_estanque' => $idEstanque,
                        'stock_actual' => $cantidadLitros,
                        'ultima_medicion' => now()
                    ];

                    if ($nuevaAltura !== null) {
                        $nuevoStock['altura_actual'] = $nuevaAltura;
                    }

                    EstanqueStock::create($nuevoStock);
                }
            }

            // Recalcular stock total de la faena
            if ($idFaena) {
                $totalFaena = EstanqueStock::whereHas('estanque', function ($q) use ($idFaena) {
                    $q->where('id_faena', $idFaena);
                })->sum('stock_actual');

                $stockPetroleo = StockPetroleo::where('id_faena', $idFaena)->first();
                if ($stockPetroleo) {
                    $stockPetroleo->stock_actual = $totalFaena;
                    $stockPetroleo->ultima_actualizacion = now();
                    $stockPetroleo->save();
                } else {
                    StockPetroleo::create([
                        'id_faena' => $idFaena,
                        'stock_actual' => $totalFaena,
                        'ultima_actualizacion' => now()
                    ]);
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Error en actualizarStock', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Método para obtener la capacidad disponible de los estanques de una faena
     */
    public function capacidadDisponible($idFaena)
    {
        try {
            $estanques = Estanque::where('id_faena', $idFaena)->get();

            if ($estanques->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron estanques para esta faena.'
                ], 404);
            }

            $capacidadTotal = 0;
            $stockActual = 0;
            $detalleEstanques = [];

            foreach ($estanques as $estanque) {
                $capacidadTotal += $estanque->capacidad;

                $estanqueStock = EstanqueStock::where('id_estanque', $estanque->id_estanque)->first();
                $stockEstanque = $estanqueStock ? $estanqueStock->stock_actual : 0;
                $stockActual += $stockEstanque;

                $detalleEstanques[] = [
                    'id_estanque' => $estanque->id_estanque,
                    'nombre' => $estanque->nombre,
                    'capacidad' => $estanque->capacidad,
                    'stock_actual' => $stockEstanque,
                    'disponible' => $estanque->capacidad - $stockEstanque
                ];
            }

            $capacidadDisponible = $capacidadTotal - $stockActual;

            return response()->json([
                'success' => true,
                'capacidad_total' => $capacidadTotal,
                'stock_actual' => $stockActual,
                'capacidad_disponible' => $capacidadDisponible,
                'detalle_estanques' => $detalleEstanques
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener capacidad disponible', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al calcular la capacidad disponible: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getStats(Request $request)
    {
        try {
            $faenaId = $request->get('faena');
            $hoy = Carbon::today();

            $stockTotal = DB::table('estanque_stock as es')
                ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
                ->where('e.id_faena', $faenaId)
                ->where('e.activo', 1)
                ->sum('es.stock_actual');

            $recepcionesHoy = DB::table('ingresos_petroleo')
                ->where('id_faena', $faenaId)
                ->whereDate('created_at', $hoy)
                ->count();

            $consumosHoy = DB::table('consumos')
                ->where('id_faena', $faenaId)
                ->whereDate('fecha_consumo', $hoy)
                ->count();

            $estanquesActivos = DB::table('estanques')
                ->where('id_faena', $faenaId)
                ->where('activo', 1)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'stockTotal' => round($stockTotal, 2),
                    'recepcionesHoy' => $recepcionesHoy,
                    'consumosHoy' => $consumosHoy,
                    'estanquesActivos' => $estanquesActivos
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRecepciones(Request $request)
    {
        try {
            $faena = $request->input('faena');
            $dateFrom = $request->input('dateFrom');
            $dateTo = $request->input('dateTo');

            if (!$faena) {
                return response()->json([
                    'success' => false,
                    'message' => 'El parámetro faena es requerido'
                ], 400);
            }

            $query = DB::table('ingresos_petroleo as ip')
                ->leftJoin('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
                ->leftJoin('users as u', 'ip.id_usuario', '=', 'u.id')
                ->select([
                    'ip.id_ingreso',
                    'ip.numero_guia',
                    'ip.litros_documentados',
                    'ip.litros_recibidos',
                    'ip.precio',
                    'ip.precio_total',
                    'ip.recibo_conforme',
                    'ip.observacion',
                    'ip.diferencia',
                    'ip.stock_inicial',
                    'ip.id_faena',
                    'ip.id_usuario',
                    'ip.created_at',
                    'ip.updated_at',
                    'f.ubicacion as faena_nombre',
                    'u.nombre as usuario_nombre',
                    'u.apellido as usuario_apellido'
                ]);

            $query->where('ip.id_faena', $faena);

            if ($dateFrom) {
                try {
                    $fechaDesde = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
                    $query->where('ip.created_at', '>=', $fechaDesde);
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
                    $query->where('ip.created_at', '<=', $fechaHasta);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Formato de fecha inválido para dateTo. Use Y-m-d'
                    ], 400);
                }
            }

            $recepciones = $query->orderBy('ip.created_at', 'desc')->get();

            $recepcionesTransformadas = $recepciones->map(function ($recepcion) {
                return [
                    'id_ingreso' => $recepcion->id_ingreso,
                    'numero_guia' => $recepcion->numero_guia,
                    'litros_documentados' => number_format($recepcion->litros_documentados, 2, '.', ''),
                    'litros_recibidos' => number_format($recepcion->litros_recibidos, 2, '.', ''),
                    'precio' => number_format($recepcion->precio, 2, '.', ''),
                    'precio_total' => number_format($recepcion->precio_total, 2, '.', ''),
                    'diferencia' => number_format($recepcion->diferencia ?? 0, 2, '.', ''),
                    'recibo_conforme' => (bool) $recepcion->recibo_conforme,
                    'observacion' => $recepcion->observacion,
                    'stock_inicial' => number_format($recepcion->stock_inicial ?? 0, 2, '.', ''),
                    'faena' => $recepcion->faena_nombre ?? 'N/A',
                    'usuario' => trim(($recepcion->usuario_nombre ?? '') . ' ' . ($recepcion->usuario_apellido ?? '')),
                    'created_at' => $recepcion->created_at,
                    'updated_at' => $recepcion->updated_at,
                    'fecha_formateada' => Carbon::parse($recepcion->created_at)->format('d/m/Y H:i'),
                ];
            });

            $totalRecepciones = $recepciones->count();
            $totalLitrosDocumentados = $recepciones->sum('litros_documentados');
            $totalLitrosRecibidos = $recepciones->sum('litros_recibidos');
            $totalMonto = $recepciones->sum('precio_total');
            $diferenciaTotal = $recepciones->sum('diferencia');

            $stats = [
                'total_recepciones' => $totalRecepciones,
                'total_litros_documentados' => $totalLitrosDocumentados,
                'total_litros_recibidos' => $totalLitrosRecibidos,
                'total_monto' => $totalMonto,
                'promedio_por_recepcion' => $totalRecepciones > 0
                    ? $totalMonto / $totalRecepciones
                    : 0,
                'diferencia_total' => $diferenciaTotal,
            ];

            return response()->json([
                'success' => true,
                'data' => $recepcionesTransformadas,
                'stats' => $stats,
                'filters_applied' => [
                    'faena' => $faena,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
                'message' => 'Recepciones obtenidas exitosamente'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error en getRecepciones', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener recepciones: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}
