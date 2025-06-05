<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estanque;
use App\Models\EstanqueStock;
use App\Models\IngresoPetroleo;
use App\Models\StockPetroleo;
use App\Models\VerificacionAltura;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IngresoPetroleoController extends Controller
{
    public function index()
    {
        try {
            $ingresos = IngresoPetroleo::all();

            return response()->json([
                'success' => true,
                'data' => $ingresos
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener ingresos de petróleo', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los ingresos.'
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
            'stock_inicial' => 'required|numeric|min:0', // Stock inicial TOTAL
            'diferencia' => 'required|numeric',
            'alturas_estanques' => 'required|array',
            'alturas_estanques.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'alturas_estanques.*.altura' => 'required|numeric|min:0'
        ]);

        try {
            // Iniciar transacción para garantizar consistencia
            DB::beginTransaction();

            $idFaena = $request->id_faena;
            $litrosRecibidos = $request->litros_recibidos;

            // Obtener estanques y calcular capacidad disponible
            $estanques = Estanque::where('id_faena', $idFaena)->get();
            $capacidadTotal = 0;
            $stockActual = 0;

            foreach ($estanques as $estanque) {
                $capacidadTotal += $estanque->capacidad;

                // Obtener el stock actual de este estanque
                $estanqueStock = EstanqueStock::where('id_estanque', $estanque->id_estanque)->first();
                if ($estanqueStock) {
                    $stockActual += $estanqueStock->stock_actual;
                }
            }

            $capacidadDisponible = $capacidadTotal - $stockActual;

            // Validación de capacidad disponible
            // if ($litrosRecibidos > $capacidadDisponible) {
            //    DB::rollBack();
            //return response()->json([
            //                    'success' => false,
            //                  'message' => "No hay suficiente capacidad disponible en los estanques. Capacidad disponible: {$capacidadDisponible} litros."
            //            ], 400);
            //      }

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
            $ingreso->stock_inicial = $request->stock_inicial; // Stock inicial TOTAL
            $ingreso->save();

            // Validar y guardar las verificaciones de altura
            if ($request->has('alturas_estanques') && is_array($request->alturas_estanques)) {
                foreach ($request->alturas_estanques as $altura) {
                    $idEstanque = $altura['id_estanque'];
                    $alturaMedida = $altura['altura'];

                    // Obtener información del estanque
                    $estanque = Estanque::find($idEstanque);

                    // 🔍 OBTENER EL STOCK INICIAL DE ESTE ESTANQUE ESPECÍFICO
                    $estanqueStock = EstanqueStock::where('id_estanque', $idEstanque)->first();
                    $stockInicialEstanque = $estanqueStock ? $estanqueStock->stock_actual : 0;

                    // Calcular volumen
                    $volumenCalculado = ($alturaMedida / $estanque->altura_nominal) * $estanque->capacidad;

                    // Verificar que el nuevo volumen no exceda la capacidad del estanque
                    if ($volumenCalculado > $estanque->capacidad) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "El estanque '{$estanque->nombre}' excedería su capacidad máxima con esta altura"
                        ], 400);
                    }

                    // Guardar verificación de altura CON EL STOCK INICIAL DEL ESTANQUE
                    $verificacion = new VerificacionAltura();
                    $verificacion->id_estanque = $idEstanque;
                    $verificacion->id_ingreso = $ingreso->id_ingreso;
                    $verificacion->altura_medicion = $alturaMedida;
                    $verificacion->volumen_calculado = $volumenCalculado;
                    $verificacion->stock_inicial = $stockInicialEstanque; // 👈 STOCK INICIAL DE ESTE ESTANQUE ESPECÍFICO
                    $verificacion->verificado = true;
                    $verificacion->save();

                    // Log para verificar que se está guardando correctamente
                    Log::info('Verificación de altura guardada', [
                        'id_estanque' => $idEstanque,
                        'nombre_estanque' => $estanque->nombre,
                        'stock_inicial_estanque' => $stockInicialEstanque,
                        'altura_medicion' => $alturaMedida,
                        'volumen_calculado' => $volumenCalculado
                    ]);

                    // Actualizar estanque si tiene el campo litros_disponibles
                    if (isset($estanque->litros_disponibles)) {
                        $estanque->litros_disponibles += $volumenCalculado;
                        $estanque->save();
                    }

                    // Actualizar stock_actual en estanque_stock usando la función
                    $this->actualizarStock($idEstanque, $request->id_faena, $volumenCalculado, $alturaMedida);
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
    protected function actualizarStock($idEstanque, $idFaena, $cantidadLitros, $nuevaAltura = null)
    {
        try {
            // Obtener el estanque para validaciones
            $estanque = Estanque::find($idEstanque);
            if (!$estanque) {
                throw new \Exception("El estanque con ID {$idEstanque} no existe");
            }

            // Obtener el stock actual
            $estanqueStock = EstanqueStock::where('id_estanque', $idEstanque)->first();
            $stockActual = $estanqueStock ? $estanqueStock->stock_actual : 0;

            // Para ingresos, actualizar directamente con el valor calculado en lugar de sumar
            if ($cantidadLitros > 0 && $nuevaAltura !== null) {
                // Calcular volumen directamente desde la altura
                $volumenNuevo = ($nuevaAltura / $estanque->altura_nominal) * $estanque->capacidad;

                // Verificar que no exceda la capacidad
                if ($volumenNuevo > $estanque->capacidad) {
                    throw new \Exception("El nuevo stock ({$volumenNuevo} litros) excedería la capacidad del estanque '{$estanque->nombre}' ({$estanque->capacidad} litros)");
                }

                // Actualizar o crear el registro de stock
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
                // Para consumos o sin altura (modo antiguo), usar la lógica actual
                if ($estanqueStock) {
                    // Si es consumo, verificar que haya suficiente stock
                    if ($cantidadLitros < 0 && $estanqueStock->stock_actual < abs($cantidadLitros)) {
                        throw new \Exception('Stock insuficiente en el estanque');
                    }

                    $estanqueStock->stock_actual += $cantidadLitros;
                    $estanqueStock->ultima_medicion = now();

                    if ($nuevaAltura !== null) {
                        $estanqueStock->altura_actual = $nuevaAltura;
                    }

                    $estanqueStock->save();

                    Log::info('Stock de estanque actualizado', [
                        'id_estanque' => $idEstanque,
                        'stock_anterior' => $estanqueStock->stock_actual - $cantidadLitros,
                        'stock_actual' => $estanqueStock->stock_actual
                    ]);
                } else {
                    // Si no existe el estanque_stock, lo creamos
                    $nuevoStock = [
                        'id_estanque' => $idEstanque,
                        'stock_actual' => $cantidadLitros,
                        'ultima_medicion' => now()
                    ];

                    if ($nuevaAltura !== null) {
                        $nuevoStock['altura_actual'] = $nuevaAltura;
                    }

                    EstanqueStock::create($nuevoStock);

                    Log::info('Registro de stock creado para estanque', [
                        'id_estanque' => $idEstanque,
                        'stock_inicial' => $cantidadLitros
                    ]);
                }
            }

            // El resto del código para recalcular el stock total de la faena se mantiene igual
            if ($idFaena) {
                // Recalcular stock total de la faena sumando todos los estanques
                $totalFaena = EstanqueStock::whereHas('estanque', function ($q) use ($idFaena) {
                    $q->where('id_faena', $idFaena);
                })->sum('stock_actual');

                $stockPetroleo = StockPetroleo::where('id_faena', $idFaena)->first();
                if ($stockPetroleo) {
                    $stockPetroleo->stock_actual = $totalFaena;
                    $stockPetroleo->ultima_actualizacion = now();
                    $stockPetroleo->save();

                    Log::info('Stock total de petróleo recalculado', [
                        'id_faena' => $idFaena,
                        'nuevo_stock' => $totalFaena
                    ]);
                } else {
                    // Si no hay stock_petroleo, lo creamos
                    StockPetroleo::create([
                        'id_faena' => $idFaena,
                        'stock_actual' => $totalFaena,
                        'ultima_actualizacion' => now()
                    ]);
                    Log::info('Stock total de petróleo creado para faena', [
                        'id_faena' => $idFaena,
                        'stock_inicial' => $totalFaena
                    ]);
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Error en actualizarStock', ['error' => $e->getMessage()]);
            throw $e; // Re-lanzar la excepción para que la maneje el método que llamó
        }
    }

    /**
     * Método para obtener la capacidad disponible de los estanques de una faena
     */
    public function capacidadDisponible($idFaena)
    {
        try {
            // Obtener todos los estanques de la faena
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

                // Obtener el stock actual de este estanque
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

            // Stock total de la faena
            $stockTotal = DB::table('estanque_stock as es')
                ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
                ->where('e.id_faena', $faenaId)
                ->where('e.activo', 1)
                ->sum('es.stock_actual');

            // Recepciones de hoy
            $recepcionesHoy = DB::table('ingresos_petroleo')
                ->where('id_faena', $faenaId)
                ->whereDate('created_at', $hoy)
                ->count();

            // Consumos de hoy
            $consumosHoy = DB::table('consumos')
                ->where('id_faena', $faenaId)
                ->whereDate('fecha_consumo', $hoy)
                ->count();

            // Estanques activos
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

            // Construir la consulta con joins para obtener toda la información
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

            // Filtrar por faena
            $query->where('ip.id_faena', $faena);

            // Aplicar filtros de fecha
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

            // Ordenar por fecha más reciente
            $recepciones = $query->orderBy('ip.created_at', 'desc')->get();

            // Transformar los datos para el frontend
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

            // Calcular estadísticas
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

    

