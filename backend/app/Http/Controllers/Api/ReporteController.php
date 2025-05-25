<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReporteController extends Controller
{
    public function generarPDF()
    {
        $datos = [
            'faena' => 'Faena Norte',
            'estanque' => 'Estanque 3',
            'litros_ingresados' => 1200.5,
            'litros_consumidos' => 800.2,
            'promedio_consumo' => 150.5,
        ];

        $respuesta = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.fastapi.secret'),
        ])->post(config('services.fastapi.url') . '/reporte/pdf', $datos);

        if (!$respuesta->ok()) {
            return response()->json(['error' => 'Error al generar PDF'], 500);
        }

        $nombreArchivo = 'reporte_' . now()->format('Ymd_His') . '.pdf';
        $ruta = storage_path('app/public/' . $nombreArchivo);
        file_put_contents($ruta, $respuesta->body());

        return response()->download($ruta)->deleteFileAfterSend(true);
    }

    /**
     * Endpoint de prueba súper simple - usa datos de la faena Catemu
     */
    public function generarReportePrueba()
    {
        try {
            // Datos fijos para prueba rápida (Faena Catemu = ID 2)
            $datosReporte = [
                // Información general
                'faena' => 'Catemu',
                'fecha_inicio' => '2025-04-01',
                'fecha_fin' => '2025-05-25',
                'usuario_generador' => 'Usuario Prueba',
                
                // Resumen ejecutivo - datos reales de tu BD
                'total_ingresos_litros' => 8250.0,
                'total_consumos_litros' => 7400.0,
                'stock_disponible' => 850.0,
                'valor_inventario' => 1275000.0,
                'eficiencia_operacional' => 89.7,
                
                // Datos de ejemplo para las tablas
                'consumos' => [
                    [
                        'id_consumo' => 22,
                        'fecha_consumo' => '20/05/2025',
                        'maquina' => 'DUMPER 11',
                        'patente' => 'AUSA D1000APG',
                        'operador' => 'Henry Baudillo Angel Acosta',
                        'litros_consumidos' => 100.0,
                        'precio_litro' => 900.0,
                        'costo_total' => 90000.0,
                        'medicion_inicial' => 960.0,
                        'medicion_final' => 1060.0
                    ],
                    [
                        'id_consumo' => 23,
                        'fecha_consumo' => '19/05/2025',
                        'maquina' => 'CAMIÓN FAW',
                        'patente' => 'FAW - PYCH- 48',
                        'operador' => 'Alexandra Stefanii Alvarado Gil',
                        'litros_consumidos' => 50.0,
                        'precio_litro' => 900.0,
                        'costo_total' => 45000.0,
                        'medicion_inicial' => 3000.0,
                        'medicion_final' => 3050.0
                    ]
                ],
                
                'ingresos' => [
                    [
                        'id_ingreso' => 6,
                        'fecha_ingreso' => '22/05/2025',
                        'numero_guia' => '#prueba 1 seba',
                        'litros_documentados' => 1000.0,
                        'litros_recibidos' => 1000.0,
                        'precio_unitario' => 1400.0,
                        'precio_total' => 1400000.0,
                        'diferencia' => 0.0,
                        'observacion' => 'Recepción conforme'
                    ]
                ],
                
                'stock_estanques' => [
                    [
                        'nombre_estanque' => 'Catemu estanque 1',
                        'capacidad' => 3000.0,
                        'stock_actual' => 850.0,
                        'altura_actual' => 283.33,
                        'porcentaje_llenado' => 28.33
                    ],
                    [
                        'nombre_estanque' => 'Catemu estanque 2',
                        'capacidad' => 1000.0,
                        'stock_actual' => 0.0,
                        'altura_actual' => 0.0,
                        'porcentaje_llenado' => 0.0
                    ]
                ],
                
                'rendimiento_maquinas' => [
                    [
                        'maquina' => 'DUMPER 11',
                        'patente' => 'AUSA D1000APG',
                        'categoria' => 'Dumper',
                        'total_litros' => 283.0,
                        'total_horas' => 155.0,
                        'rendimiento_litros_hora' => 1.83,
                        'costo_total' => 325453.0
                    ],
                    [
                        'maquina' => 'CAMIÓN FAW',
                        'patente' => 'FAW - PYCH- 48',
                        'categoria' => 'Camion',
                        'total_litros' => 143.0,
                        'total_horas' => 83.0,
                        'rendimiento_litros_hora' => 1.72,
                        'costo_total' => 173500.0
                    ]
                ],
                
                // Análisis
                'promedio_consumo_diario' => 132.9,
                'dias_autonomia' => 6.4,
                'maquina_mas_eficiente' => 'DUMPER 11',
                'maquina_menos_eficiente' => 'CAMIÓN FAW'
            ];

            // Llamar al servicio Python
            $respuesta = Http::timeout(120)->withHeaders([
                'Authorization' => 'Bearer ' . config('services.fastapi.secret'),
            ])->post(config('services.fastapi.url') . '/reporte/completo', $datosReporte);

            if (!$respuesta->ok()) {
                return response()->json([
                    'error' => 'Error al generar PDF',
                    'details' => $respuesta->body()
                ], 500);
            }

            $nombreArchivo = 'reporte_PRUEBA_catemu_' . now()->format('Ymd_His') . '.pdf';
            $ruta = storage_path('app/public/' . $nombreArchivo);
            file_put_contents($ruta, $respuesta->body());

            return response()->download($ruta)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar reporte completo con datos reales de la base de datos
     */
    public function generarReporteCompleto(Request $request)
    {
        $request->validate([
            'id_faena' => 'required|exists:faenas,id_faena',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $idFaena = $request->id_faena;
        $fechaInicio = $request->fecha_inicio;
        $fechaFin = $request->fecha_fin;

        try {
            // Obtener información de la faena
            $faena = DB::table('faenas')
                ->where('id_faena', $idFaena)
                ->first();

            // Usuario de prueba (sin autenticación)
            $usuario = (object) ['nombre' => 'Usuario', 'apellido' => 'Prueba'];

            // Calcular resumen ejecutivo
            $totalIngresos = DB::table('ingresos_petroleo')
                ->where('id_faena', $idFaena)
                ->whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->sum('litros_recibidos');

            $totalConsumos = DB::table('consumos')
                ->where('id_faena', $idFaena)
                ->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin])
                ->sum('litros_consumidos');

            $stockDisponible = DB::table('stock_petroleo')
                ->where('id_faena', $idFaena)
                ->value('stock_actual') ?? 0;

            // Valor del inventario (precio promedio último mes)
            $precioPromedio = DB::table('ingresos_petroleo')
                ->where('id_faena', $idFaena)
                ->where('created_at', '>=', now()->subMonth())
                ->avg('precio') ?? 1500;

            $valorInventario = $stockDisponible * $precioPromedio;

            // Eficiencia operacional (relación ingresos vs consumos)
            $eficienciaOperacional = $totalIngresos > 0 ? ($totalConsumos / $totalIngresos * 100) : 0;

            // Promedio consumo diario
            $diasPeriodo = Carbon::parse($fechaInicio)->diffInDays(Carbon::parse($fechaFin)) + 1;
            $promedioConsumoDiario = $diasPeriodo > 0 ? $totalConsumos / $diasPeriodo : 0;

            // Días de autonomía
            $diasAutonomia = $promedioConsumoDiario > 0 ? $stockDisponible / $promedioConsumoDiario : 999;

            // Obtener detalles de consumos
            $consumos = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->leftJoin('personal_interno as pi', 'c.id_dotacion', '=', 'pi.rut')
                ->leftJoin('personal_externo as pe', 'c.id_dotacion', '=', 'pe.rut')
                ->where('c.id_faena', $idFaena)
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->select([
                    'c.id_consumo',
                    'c.fecha_consumo',
                    'm.nombre_maquina as maquina',
                    'm.patente',
                    DB::raw('COALESCE(CONCAT(pi.nombre, " ", pi.apellido), pe.nombre, "N/A") as operador'),
                    'c.litros_consumidos',
                    'c.precio_litro',
                    DB::raw('(c.litros_consumidos * c.precio_litro) as costo_total'),
                    'c.numeral_inicial as medicion_inicial',
                    'c.numeral_final as medicion_final'
                ])
                ->orderBy('c.fecha_consumo', 'desc')
                ->get()
                ->map(function ($consumo) {
                    return [
                        'id_consumo' => $consumo->id_consumo,
                        'fecha_consumo' => Carbon::parse($consumo->fecha_consumo)->format('d/m/Y'),
                        'maquina' => $consumo->maquina,
                        'patente' => $consumo->patente ?? 'N/A',
                        'operador' => $consumo->operador,
                        'litros_consumidos' => (float) $consumo->litros_consumidos,
                        'precio_litro' => (float) $consumo->precio_litro,
                        'costo_total' => (float) $consumo->costo_total,
                        'medicion_inicial' => (float) ($consumo->medicion_inicial ?? 0),
                        'medicion_final' => (float) ($consumo->medicion_final ?? 0)
                    ];
                })->toArray();

            // Obtener detalles de ingresos
            $ingresos = DB::table('ingresos_petroleo')
                ->where('id_faena', $idFaena)
                ->whereBetween('created_at', [$fechaInicio, $fechaFin])
                ->select([
                    'id_ingreso',
                    'created_at as fecha_ingreso',
                    'numero_guia',
                    'litros_documentados',
                    'litros_recibidos',
                    'precio',
                    'precio_total',
                    'diferencia',
                    'observacion'
                ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($ingreso) {
                    return [
                        'id_ingreso' => $ingreso->id_ingreso,
                        'fecha_ingreso' => Carbon::parse($ingreso->fecha_ingreso)->format('d/m/Y'),
                        'numero_guia' => $ingreso->numero_guia,
                        'litros_documentados' => (float) $ingreso->litros_documentados,
                        'litros_recibidos' => (float) $ingreso->litros_recibidos,
                        'precio_unitario' => (float) $ingreso->precio,
                        'precio_total' => (float) $ingreso->precio_total,
                        'diferencia' => (float) ($ingreso->diferencia ?? 0),
                        'observacion' => $ingreso->observacion ?? ''
                    ];
                })->toArray();

            // Stock por estanques
            $stockEstanques = DB::table('estanques as e')
                ->leftJoin('estanque_stock as es', 'e.id_estanque', '=', 'es.id_estanque')
                ->where('e.id_faena', $idFaena)
                ->where('e.activo', 1)
                ->select([
                    'e.nombre',
                    'e.capacidad',
                    'es.stock_actual',
                    'es.altura_actual'
                ])
                ->get()
                ->map(function ($estanque) {
                    $stockActual = (float) ($estanque->stock_actual ?? 0);
                    $capacidad = (float) $estanque->capacidad;
                    $porcentajeLlenado = $capacidad > 0 ? ($stockActual / $capacidad * 100) : 0;
                    
                    return [
                        'nombre_estanque' => $estanque->nombre,
                        'capacidad' => $capacidad,
                        'stock_actual' => $stockActual,
                        'altura_actual' => (float) ($estanque->altura_actual ?? 0),
                        'porcentaje_llenado' => $porcentajeLlenado
                    ];
                })->toArray();

            // Rendimiento por máquinas
            $rendimientoMaquinas = DB::table('consumos as c')
                ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                ->where('c.id_faena', $idFaena)
                ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
                ->groupBy(['m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.nombre_categoria'])
                ->select([
                    'm.nombre_maquina as maquina',
                    'm.patente',
                    'cm.nombre_categoria as categoria',
                    DB::raw('SUM(c.litros_consumidos) as total_litros'),
                    DB::raw('SUM(c.medicion) as total_horas'),
                    DB::raw('SUM(c.litros_consumidos * c.precio_litro) as costo_total')
                ])
                ->get()
                ->map(function ($maquina) {
                    $totalLitros = (float) $maquina->total_litros;
                    $totalHoras = (float) ($maquina->total_horas ?? 1);
                    $rendimiento = $totalHoras > 0 ? $totalLitros / $totalHoras : 0;
                    
                    return [
                        'maquina' => $maquina->maquina,
                        'patente' => $maquina->patente ?? 'N/A',
                        'categoria' => $maquina->categoria,
                        'total_litros' => $totalLitros,
                        'total_horas' => $totalHoras,
                        'rendimiento_litros_hora' => $rendimiento,
                        'costo_total' => (float) $maquina->costo_total
                    ];
                })->toArray();

            // Análisis de eficiencia
            $maquinaMasEficiente = collect($rendimientoMaquinas)
                ->sortBy('rendimiento_litros_hora')
                ->first()['maquina'] ?? 'N/A';

            $maquinaMenosEficiente = collect($rendimientoMaquinas)
                ->sortByDesc('rendimiento_litros_hora')
                ->first()['maquina'] ?? 'N/A';

            // Preparar datos para el PDF
            $datosReporte = [
                // Información general
                'faena' => $faena->ubicacion,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'usuario_generador' => $usuario->nombre . ' ' . $usuario->apellido,
                
                // Resumen ejecutivo
                'total_ingresos_litros' => $totalIngresos,
                'total_consumos_litros' => $totalConsumos,
                'stock_disponible' => $stockDisponible,
                'valor_inventario' => $valorInventario,
                'eficiencia_operacional' => $eficienciaOperacional,
                
                // Detalles
                'consumos' => $consumos,
                'ingresos' => $ingresos,
                'stock_estanques' => $stockEstanques,
                'rendimiento_maquinas' => $rendimientoMaquinas,
                
                // Análisis
                'promedio_consumo_diario' => $promedioConsumoDiario,
                'dias_autonomia' => $diasAutonomia,
                'maquina_mas_eficiente' => $maquinaMasEficiente,
                'maquina_menos_eficiente' => $maquinaMenosEficiente
            ];

            // Llamar al servicio Python
            $respuesta = Http::timeout(120)->withHeaders([
                'Authorization' => 'Bearer ' . config('services.fastapi.secret'),
            ])->post(config('services.fastapi.url') . '/reporte/completo', $datosReporte);

            if (!$respuesta->ok()) {
                return response()->json([
                    'error' => 'Error al generar PDF',
                    'details' => $respuesta->body()
                ], 500);
            }

            $nombreArchivo = 'reporte_completo_' . $faena->ubicacion . '_' . now()->format('Ymd_His') . '.pdf';
            $ruta = storage_path('app/public/' . $nombreArchivo);
            file_put_contents($ruta, $respuesta->body());

            return response()->download($ruta)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar reporte de consumos por período
     */
    public function reporteConsumosPorPeriodo(Request $request)
    {
        $request->validate([
            'id_faena' => 'required|exists:faenas,id_faena',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $consumos = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->leftJoin('personal_interno as pi', 'c.id_dotacion', '=', 'pi.rut')
            ->leftJoin('personal_externo as pe', 'c.id_dotacion', '=', 'pe.rut')
            ->where('c.id_faena', $request->id_faena)
            ->whereBetween('c.fecha_consumo', [$request->fecha_inicio, $request->fecha_fin])
            ->select([
                'f.ubicacion as faena',
                'c.fecha_consumo',
                'm.nombre_maquina as maquina',
                'm.patente',
                DB::raw('COALESCE(CONCAT(pi.nombre, " ", pi.apellido), pe.nombre, "Operador No Identificado") as operador'),
                'c.litros_consumidos',
                'c.precio_litro',
                DB::raw('(c.litros_consumidos * c.precio_litro) as costo_total')
            ])
            ->orderBy('c.fecha_consumo', 'desc')
            ->get();

        $totalLitros = $consumos->sum('litros_consumidos');
        $totalCosto = $consumos->sum('costo_total');
        $promedioConsumo = $consumos->avg('litros_consumidos');

        $datos = [
            'faena' => $consumos->first()->faena ?? 'N/A',
            'estanque' => 'Todos los estanques',
            'litros_ingresados' => 0,
            'litros_consumidos' => $totalLitros,
            'promedio_consumo' => $promedioConsumo
        ];

        $respuesta = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.fastapi.secret'),
        ])->post(config('services.fastapi.url') . '/reporte/pdf', $datos);

        if (!$respuesta->ok()) {
            return response()->json(['error' => 'Error al generar PDF'], 500);
        }

        $nombreArchivo = 'reporte_consumos_' . now()->format('Ymd_His') . '.pdf';
        $ruta = storage_path('app/public/' . $nombreArchivo);
        file_put_contents($ruta, $respuesta->body());

        return response()->download($ruta)->deleteFileAfterSend(true);
    }

    /**
     * Generar reporte de stock actual
     */
    public function     reporteStockActual(Request $request)
    {
        $request->validate([
            'id_faena' => 'required|exists:faenas,id_faena',
        ]);

        $stockData = DB::table('estanques as e')
            ->leftJoin('estanque_stock as es', 'e.id_estanque', '=', 'es.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->where('e.id_faena', $request->id_faena)
            ->where('e.activo', 1)
            ->select([
                'f.ubicacion as faena',
                'e.nombre as estanque',
                'e.capacidad',
                'es.stock_actual',
                'es.altura_actual',
                'es.ultima_medicion'
            ])
            ->get();

        $totalStock = $stockData->sum('stock_actual');
        $totalCapacidad = $stockData->sum('capacidad');

        $datos = [
            'faena' => $stockData->first()->faena ?? 'N/A',
            'estanque' => 'Stock General',
            'litros_ingresados' => $totalStock,
            'litros_consumidos' => 0,
            'promedio_consumo' => $totalStock / $stockData->count()
        ];

        $respuesta = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.fastapi.secret'),
        ])->post(config('services.fastapi.url') . '/reporte/pdf', $datos);

        if (!$respuesta->ok()) {
            return response()->json(['error' => 'Error al generar PDF'], 500);
        }

        $nombreArchivo = 'reporte_stock_' . now()->format('Ymd_His') . '.pdf';
        $ruta = storage_path('app/public/' . $nombreArchivo);
        file_put_contents($ruta, $respuesta->body());

        return response()->download($ruta)->deleteFileAfterSend(true);
    }

    /**
     * Generar reporte de rendimiento de máquinas
     */
    public function reporteRendimientoMaquinas(Request $request)
    {
        $request->validate([
            'id_faena' => 'required|exists:faenas,id_faena',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $rendimientos = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->where('c.id_faena', $request->id_faena)
            ->whereBetween('c.fecha_consumo', [$request->fecha_inicio, $request->fecha_fin])
            ->groupBy(['m.id_maquina', 'm.nombre_maquina', 'f.ubicacion'])
            ->select([
                'f.ubicacion as faena',
                'm.nombre_maquina as maquina',
                'm.patente',
                'cm.nombre_categoria as categoria',
                DB::raw('SUM(c.litros_consumidos) as total_litros'),
                DB::raw('SUM(c.medicion) as total_horas'),
                DB::raw('AVG(c.litros_consumidos) as promedio_litros'),
                DB::raw('COUNT(*) as total_operaciones')
            ])
            ->get();

        $promedioGeneral = $rendimientos->avg('promedio_litros');

        $datos = [
            'faena' => $rendimientos->first()->faena ?? 'N/A',
            'estanque' => 'Análisis de Rendimiento',
            'litros_ingresados' => $rendimientos->sum('total_litros'),
            'litros_consumidos' => $rendimientos->sum('total_litros'),
            'promedio_consumo' => $promedioGeneral
        ];

        $respuesta = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.fastapi.secret'),
        ])->post(config('services.fastapi.url') . '/reporte/pdf', $datos);

        if (!$respuesta->ok()) {
            return response()->json(['error' => 'Error al generar PDF'], 500);
        }

        $nombreArchivo = 'reporte_rendimiento_' . now()->format('Ymd_His') . '.pdf';
        $ruta = storage_path('app/public/' . $nombreArchivo);
        file_put_contents($ruta, $respuesta->body());

        return response()->download($ruta)->deleteFileAfterSend(true);
    }

    /**
     * Obtener datos para preview del reporte
     */
    public function previewReporte(Request $request)
    {
        $request->validate([
            'id_faena' => 'required|exists:faenas,id_faena',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $faena = DB::table('faenas')->where('id_faena', $request->id_faena)->first();
        
        $totalIngresos = DB::table('ingresos_petroleo')
            ->where('id_faena', $request->id_faena)
            ->whereBetween('created_at', [$request->fecha_inicio, $request->fecha_fin])
            ->sum('litros_recibidos');

        $totalConsumos = DB::table('consumos')
            ->where('id_faena', $request->id_faena)
            ->whereBetween('fecha_consumo', [$request->fecha_inicio, $request->fecha_fin])
            ->sum('litros_consumidos');

        $stockActual = DB::table('stock_petroleo')
            ->where('id_faena', $request->id_faena)
            ->value('stock_actual') ?? 0;

        $numeroConsumos = DB::table('consumos')
            ->where('id_faena', $request->id_faena)
            ->whereBetween('fecha_consumo', [$request->fecha_inicio, $request->fecha_fin])
            ->count();

        $numeroIngresos = DB::table('ingresos_petroleo')
            ->where('id_faena', $request->id_faena)
            ->whereBetween('created_at', [$request->fecha_inicio, $request->fecha_fin])
            ->count();

        return response()->json([
            'faena' => $faena->ubicacion,
            'periodo' => $request->fecha_inicio . ' - ' . $request->fecha_fin,
            'resumen' => [
                'total_ingresos' => $totalIngresos,
                'total_consumos' => $totalConsumos,
                'stock_actual' => $stockActual,
                'numero_operaciones_consumo' => $numeroConsumos,
                'numero_operaciones_ingreso' => $numeroIngresos,
                'balance' => $totalIngresos - $totalConsumos
            ]
        ]);
    }
}