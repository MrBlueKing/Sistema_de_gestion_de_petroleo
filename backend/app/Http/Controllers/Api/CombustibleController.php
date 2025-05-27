<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CombustibleController extends Controller
{
    /**
     * Dashboard principal con métricas clave
     */
    public function dashboard()
    {
        try {
            $data = [
                'stock_total' => $this->getStockTotalActual(),
                'consumo_diario' => $this->getConsumoDiarioPromedio(),
                'ingresos_mes' => $this->getIngresosMesActual(),
                'eficiencia_promedio' => $this->getEficienciaPromedio(),
                'alertas_activas' => $this->getAlertasActivas(),
                'top_consumidores' => $this->getTopConsumidoresDashboard(),
                'tendencia_semanal' => $this->getTendenciaSemanal(),
                'distribucion_faenas' => $this->getDistribucionPorFaenas()
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stock actual por faena y estanque
     */
    public function getStockActual()
    {
        $stock = DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->select(
                'f.ubicacion as faena',
                'e.nombre as estanque',
                'es.stock_actual',
                'e.capacidad',
                'es.altura_actual',
                'e.altura_nominal',
                'es.ultima_medicion',
                DB::raw('ROUND((es.stock_actual / e.capacidad) * 100, 2) as porcentaje_ocupacion')
            )
            ->where('e.activo', 1)
            ->orderBy('f.ubicacion')
            ->orderBy('e.nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stock
        ]);
    }

    /**
     * Stock por faena con totales
     */
    public function getStockPorFaena()
    {
        $stockPorFaena = DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->select(
                'f.id_faena',
                'f.ubicacion as faena',
                DB::raw('SUM(es.stock_actual) as stock_total'),
                DB::raw('SUM(e.capacidad) as capacidad_total'),
                DB::raw('COUNT(e.id_estanque) as total_estanques'),
                DB::raw('ROUND((SUM(es.stock_actual) / SUM(e.capacidad)) * 100, 2) as porcentaje_ocupacion'),
                DB::raw('MAX(es.ultima_medicion) as ultima_actualizacion')
            )
            ->where('e.activo', 1)
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->orderBy('stock_total', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stockPorFaena
        ]);
    }

    /**
     * Histórico de stock
     */
    public function getStockHistorico($dias = 30)
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        $historico = DB::table('movimientos_petroleo as mp')
            ->join('faenas as f', 'mp.id_faena', '=', 'f.id_faena')
            ->select(
                DB::raw('DATE(mp.created_at) as fecha'),
                'f.ubicacion as faena',
                DB::raw('SUM(CASE WHEN mp.tipo_movimiento = "ingreso" THEN mp.cantidad ELSE 0 END) as ingresos'),
                DB::raw('SUM(CASE WHEN mp.tipo_movimiento = "consumo" THEN ABS(mp.cantidad) ELSE 0 END) as consumos'),
                DB::raw('MAX(mp.stock_actual) as stock_final')
            )
            ->where('mp.created_at', '>=', $fechaInicio)
            ->groupBy(DB::raw('DATE(mp.created_at)'), 'f.id_faena', 'f.ubicacion')
            ->orderBy('fecha')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $historico
        ]);
    }

    /**
     * Resumen de ingresos
     */
    public function getIngresosResumen($dias = 30)
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        $ingresos = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->join('users as u', 'ip.id_usuario', '=', 'u.id')
            ->select(
                'ip.numero_guia',
                'ip.litros_documentados',
                'ip.litros_recibidos',
                'ip.precio',
                'ip.precio_total',
                'ip.diferencia',
                'ip.recibo_conforme',
                'f.ubicacion as faena',
                DB::raw('CONCAT(u.nombre, " ", u.apellido) as usuario'),
                'ip.created_at as fecha_ingreso'
            )
            ->where('ip.created_at', '>=', $fechaInicio)
            ->orderBy('ip.created_at', 'desc')
            ->get();

        $resumen = [
            'total_ingresos' => $ingresos->count(),
            'litros_totales' => $ingresos->sum('litros_recibidos'),
            'costo_total' => $ingresos->sum('precio_total'),
            'diferencias_detectadas' => $ingresos->where('diferencia', '!=', 0)->count(),
            'precio_promedio' => $ingresos->avg('precio'),
            'detalle' => $ingresos
        ];

        return response()->json([
            'success' => true,
            'data' => $resumen
        ]);
    }

    /**
     * Consumos por equipo
     */
    public function getConsumosPorEquipo($dias = 30)
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        $consumos = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->select(
                'm.nombre_maquina',
                'm.patente',
                'cm.nombre_categoria',
                'f.ubicacion as faena',
                DB::raw('COUNT(c.id_consumo) as total_consumos'),
                DB::raw('SUM(c.litros_consumidos) as litros_totales'),
                DB::raw('AVG(c.litros_consumidos) as promedio_por_consumo'),
                DB::raw('SUM(c.litros_consumidos * c.precio_litro) as costo_total'),
                DB::raw('MAX(c.fecha_consumo) as ultimo_consumo')
            )
            ->where('c.fecha_consumo', '>=', $fechaInicio)
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.nombre_categoria', 'f.ubicacion')
            ->orderBy('litros_totales', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $consumos
        ]);
    }

    /**
     * Eficiencia de equipos
     */
    public function getEficienciaEquipos()
    {
        $eficiencia = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->select(
                'm.nombre_maquina',
                'cm.nombre_categoria',
                'cm.tipo_medicion',
                DB::raw('SUM(c.litros_consumidos) as total_litros'),
                DB::raw('SUM(c.medicion) as total_medicion'),
                DB::raw('CASE 
                    WHEN SUM(c.medicion) > 0 THEN ROUND(SUM(c.litros_consumidos) / SUM(c.medicion), 2)
                    ELSE 0 
                END as eficiencia'),
                DB::raw('COUNT(c.id_consumo) as total_cargas')
            )
            ->where('c.fecha_consumo', '>=', Carbon::now()->subDays(30))
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'cm.nombre_categoria', 'cm.tipo_medicion')
            ->having('total_medicion', '>', 0)
            ->orderBy('eficiencia')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $eficiencia
        ]);
    }

    /**
     * Tendencia de consumo
     */
    public function getTendenciaConsumo($dias = 30)
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        $tendencia = DB::table('consumos as c')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->select(
                DB::raw('DATE(c.fecha_consumo) as fecha'),
                'f.ubicacion as faena',
                DB::raw('SUM(c.litros_consumidos) as litros_dia'),
                DB::raw('COUNT(c.id_consumo) as numero_consumos'),
                DB::raw('AVG(c.precio_litro) as precio_promedio')
            )
            ->where('c.fecha_consumo', '>=', $fechaInicio)
            ->groupBy(DB::raw('DATE(c.fecha_consumo)'), 'f.id_faena', 'f.ubicacion')
            ->orderBy('fecha')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tendencia
        ]);
    }

    /**
     * Alertas del sistema
     */
    public function getAlertas()
    {
        $alertas = [];

        // Stock bajo (menos del 20%)
        $stockBajo = DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->select('f.ubicacion', 'e.nombre', 'es.stock_actual', 'e.capacidad')
            ->whereRaw('(es.stock_actual / e.capacidad) < 0.20')
            ->where('e.activo', 1)
            ->get();

        foreach ($stockBajo as $estanque) {
            $alertas[] = [
                'tipo' => 'stock_bajo',
                'severidad' => 'alta',
                'mensaje' => "Stock bajo en {$estanque->ubicacion} - {$estanque->nombre}: {$estanque->stock_actual}L",
                'faena' => $estanque->ubicacion
            ];
        }

        // Consumo anormal (más del 150% del promedio)
        $consumoAnormal = DB::select("
            WITH promedios AS (
                SELECT id_equipo, AVG(litros_consumidos) as promedio
                FROM consumos 
                WHERE fecha_consumo >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY id_equipo
            )
            SELECT m.nombre_maquina, c.litros_consumidos, p.promedio
            FROM consumos c
            JOIN maquinas m ON c.id_equipo = m.id_maquina
            JOIN promedios p ON c.id_equipo = p.id_equipo
            WHERE c.fecha_consumo >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            AND c.litros_consumidos > (p.promedio * 1.5)
        ");

        foreach ($consumoAnormal as $consumo) {
            $alertas[] = [
                'tipo' => 'consumo_anormal',
                'severidad' => 'media',
                'mensaje' => "Consumo anormal en {$consumo->nombre_maquina}: {$consumo->litros_consumidos}L (promedio: " . round($consumo->promedio, 2) . "L)",
                'equipo' => $consumo->nombre_maquina
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $alertas
        ]);
    }

    /**
     * Balance mensual
     */
    public function getBalanceMensual()
    {
        $ultimosMeses = DB::select("
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m') as mes,
                SUM(ingresos) as total_ingresos,
                SUM(consumos) as total_consumos,
                SUM(ingresos) - SUM(consumos) as balance,
                AVG(stock_final) as stock_promedio
            FROM (
                SELECT 
                    DATE(ip.created_at) as fecha,
                    SUM(ip.litros_recibidos) as ingresos,
                    0 as consumos,
                    0 as stock_final
                FROM ingresos_petroleo ip
                WHERE ip.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE(ip.created_at)
                
                UNION ALL
                
                SELECT 
                    DATE(c.fecha_consumo) as fecha,
                    0 as ingresos,
                    SUM(c.litros_consumidos) as consumos,
                    0 as stock_final
                FROM consumos c
                WHERE c.fecha_consumo >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE(c.fecha_consumo)
                
                UNION ALL
                
                SELECT 
                    DATE(mp.created_at) as fecha,
                    0 as ingresos,
                    0 as consumos,
                    MAX(mp.stock_actual) as stock_final
                FROM movimientos_petroleo mp
                WHERE mp.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE(mp.created_at)
            ) as datos
            GROUP BY DATE_FORMAT(fecha, '%Y-%m')
            ORDER BY mes DESC
            LIMIT 12
        ");

        return response()->json([
            'success' => true,
            'data' => $ultimosMeses
        ]);
    }

    // Métodos auxiliares privados
    private function getStockTotalActual()
    {
        return DB::table('estanque_stock')->sum('stock_actual');
    }

    private function getConsumoDiarioPromedio()
    {
        return DB::table('consumos')
            ->where('fecha_consumo', '>=', Carbon::now()->subDays(7))
            ->avg(DB::raw('litros_consumidos'));
    }

    private function getIngresosMesActual()
    {
        return DB::table('ingresos_petroleo')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('litros_recibidos');
    }

    private function getEficienciaPromedio()
    {
        return DB::table('consumos as c')
            ->join('categorias_maquinas as cm', 'c.id_equipo', '=', 'cm.id_categoria')
            ->where('c.fecha_consumo', '>=', Carbon::now()->subDays(30))
            ->where('c.medicion', '>', 0)
            ->avg(DB::raw('c.litros_consumidos / c.medicion'));
    }

    private function getAlertasActivas()
    {
        $stockBajo = DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->whereRaw('(es.stock_actual / e.capacidad) < 0.20')
            ->count();

        return $stockBajo;
    }

    private function getTopConsumidoresDashboard()
    {
        return DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->select('m.nombre_maquina', DB::raw('SUM(c.litros_consumidos) as total'))
            ->where('c.fecha_consumo', '>=', Carbon::now()->subDays(7))
            ->groupBy('m.id_maquina', 'm.nombre_maquina')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();
    }

    private function getTendenciaSemanal()
    {
        return DB::table('consumos')
            ->select(
                DB::raw('DATE(fecha_consumo) as fecha'),
                DB::raw('SUM(litros_consumidos) as total')
            )
            ->where('fecha_consumo', '>=', Carbon::now()->subDays(7))
            ->groupBy(DB::raw('DATE(fecha_consumo)'))
            ->orderBy('fecha')
            ->get();
    }

    private function getDistribucionPorFaenas()
    {
        return DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->select('f.ubicacion', DB::raw('SUM(es.stock_actual) as stock'))
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->get();
    }
    // Agregar estos métodos al CombustibleController existente

    /**
     * Top consumidores por periodo
     */
    public function getTopConsumidores($limite = 10)
    {
        $topConsumidores = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->select(
                'm.nombre_maquina',
                'm.patente',
                'cm.nombre_categoria',
                'f.ubicacion as faena',
                DB::raw('SUM(c.litros_consumidos) as total_litros'),
                DB::raw('COUNT(c.id_consumo) as total_consumos'),
                DB::raw('AVG(c.litros_consumidos) as promedio_consumo'),
                DB::raw('SUM(c.litros_consumidos * c.precio_litro) as costo_total'),
                DB::raw('MAX(c.fecha_consumo) as ultimo_consumo')
            )
            ->where('c.fecha_consumo', '>=', Carbon::now()->subDays(30))
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.nombre_categoria', 'f.ubicacion')
            ->orderBy('total_litros', 'desc')
            ->limit($limite)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $topConsumidores
        ]);
    }

    /**
     * Proyección de agotamiento de stock
     */
    public function getProyeccionAgotamiento()
    {
        $consumoPromedioDiario = DB::table('consumos')
            ->where('fecha_consumo', '>=', Carbon::now()->subDays(30))
            ->avg(DB::raw('litros_consumidos'));

        $stockActual = DB::table('estanque_stock')->sum('stock_actual');

        $diasRestantes = $consumoPromedioDiario > 0 ? round($stockActual / $consumoPromedioDiario) : null;

        $proyeccionPorFaena = DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->leftJoin(
                DB::raw('(SELECT id_faena, AVG(litros_consumidos) as consumo_promedio 
                      FROM consumos 
                      WHERE fecha_consumo >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                      GROUP BY id_faena) as cp'),
                'f.id_faena',
                '=',
                'cp.id_faena'
            )
            ->select(
                'f.ubicacion as faena',
                DB::raw('SUM(es.stock_actual) as stock_actual'),
                DB::raw('COALESCE(cp.consumo_promedio, 0) as consumo_promedio'),
                DB::raw('CASE 
                WHEN COALESCE(cp.consumo_promedio, 0) > 0 
                THEN ROUND(SUM(es.stock_actual) / cp.consumo_promedio) 
                ELSE NULL 
            END as dias_restantes')
            )
            ->groupBy('f.id_faena', 'f.ubicacion', 'cp.consumo_promedio')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'global' => [
                    'stock_actual' => $stockActual,
                    'consumo_promedio_diario' => round($consumoPromedioDiario, 2),
                    'dias_restantes' => $diasRestantes
                ],
                'por_faena' => $proyeccionPorFaena
            ]
        ]);
    }

    /**
     * Rendimiento de combustible por equipo
     */
    public function getRendimientoCombustible()
    {
        $rendimiento = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->select(
                'm.nombre_maquina',
                'cm.nombre_categoria',
                'cm.tipo_medicion',
                DB::raw('SUM(c.litros_consumidos) as total_litros'),
                DB::raw('SUM(c.medicion) as total_medicion'),
                DB::raw('CASE 
                WHEN SUM(c.medicion) > 0 THEN ROUND(SUM(c.litros_consumidos) / SUM(c.medicion), 3)
                ELSE 0 
            END as rendimiento'),
                DB::raw('COUNT(c.id_consumo) as total_cargas'),
                DB::raw('AVG(c.litros_consumidos) as promedio_por_carga')
            )
            ->where('c.fecha_consumo', '>=', Carbon::now()->subDays(30))
            ->where('c.medicion', '>', 0)
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'cm.nombre_categoria', 'cm.tipo_medicion')
            ->orderBy('rendimiento')
            ->get();

        // Calcular benchmarks
        $benchmarkPorCategoria = $rendimiento->groupBy('nombre_categoria')->map(function ($items) {
            return [
                'promedio' => $items->avg('rendimiento'),
                'mejor' => $items->min('rendimiento'),
                'peor' => $items->max('rendimiento')
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rendimiento_equipos' => $rendimiento,
                'benchmarks' => $benchmarkPorCategoria
            ]
        ]);
    }

    /**
     * Diferencias en recepción de combustible
     */
    public function getDiferenciasRecepcion()
    {
        $diferencias = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->join('users as u', 'ip.id_usuario', '=', 'u.id')
            ->select(
                'ip.numero_guia',
                'ip.litros_documentados',
                'ip.litros_recibidos',
                'ip.diferencia',
                'ip.precio_total',
                'f.ubicacion as faena',
                DB::raw('CONCAT(u.nombre, " ", u.apellido) as responsable'),
                'ip.observacion',
                'ip.created_at as fecha_ingreso',
                DB::raw('CASE 
                WHEN ip.diferencia = 0 THEN "Sin diferencia"
                WHEN ip.diferencia > 0 THEN "Exceso"
                ELSE "Faltante"
            END as tipo_diferencia'),
                DB::raw('ABS(ip.diferencia) as diferencia_absoluta'),
                DB::raw('ROUND((ABS(ip.diferencia) / ip.litros_documentados) * 100, 2) as porcentaje_diferencia')
            )
            ->where('ip.created_at', '>=', Carbon::now()->subDays(90))
            ->orderBy('ip.created_at', 'desc')
            ->get();

        $resumen = [
            'total_ingresos' => $diferencias->count(),
            'con_diferencias' => $diferencias->where('diferencia', '!=', 0)->count(),
            'total_faltantes' => $diferencias->where('diferencia', '<', 0)->sum('diferencia_absoluta'),
            'total_excesos' => $diferencias->where('diferencia', '>', 0)->sum('diferencia_absoluta'),
            'porcentaje_precision' => round(($diferencias->where('diferencia', 0)->count() / $diferencias->count()) * 100, 2),
            'detalle' => $diferencias
        ];

        return response()->json([
            'success' => true,
            'data' => $resumen
        ]);
    }

    /**
     * Costo promedio del combustible
     */
    public function getCostoPromedio()
    {
        $costoPromedio = DB::table('ingresos_petroleo as ip')
            ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
            ->select(
                'f.ubicacion as faena',
                DB::raw('AVG(ip.precio) as precio_promedio'),
                DB::raw('MIN(ip.precio) as precio_minimo'),
                DB::raw('MAX(ip.precio) as precio_maximo'),
                DB::raw('COUNT(ip.id_ingreso) as total_ingresos'),
                DB::raw('SUM(ip.litros_recibidos) as total_litros'),
                DB::raw('SUM(ip.precio_total) as costo_total'),
                DB::raw('MAX(ip.created_at) as ultima_compra')
            )
            ->where('ip.created_at', '>=', Carbon::now()->subDays(90))
            ->groupBy('f.id_faena', 'f.ubicacion')
            ->get();

        // Evolución mensual de precios
        $evolucionPrecios = DB::table('ingresos_petroleo')
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mes'),
                DB::raw('AVG(precio) as precio_promedio'),
                DB::raw('MIN(precio) as precio_minimo'),
                DB::raw('MAX(precio) as precio_maximo'),
                DB::raw('SUM(litros_recibidos) as litros_totales')
            )
            ->where('created_at', '>=', Carbon::now()->subYear())
            ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
            ->orderBy('mes')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'por_faena' => $costoPromedio,
                'evolucion_mensual' => $evolucionPrecios,
                'precio_actual_promedio' => $costoPromedio->avg('precio_promedio')
            ]
        ]);
    }

    /**
     * Capacidad de estanques y utilización
     */
    public function getCapacidadEstanques()
    {
        $capacidades = DB::table('estanques as e')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->leftJoin('estanque_stock as es', 'e.id_estanque', '=', 'es.id_estanque')
            ->select(
                'f.ubicacion as faena',
                'e.nombre as estanque',
                'e.capacidad',
                'e.altura_nominal',
                DB::raw('COALESCE(es.stock_actual, 0) as stock_actual'),
                DB::raw('COALESCE(es.altura_actual, 0) as altura_actual'),
                DB::raw('ROUND((COALESCE(es.stock_actual, 0) / e.capacidad) * 100, 2) as porcentaje_utilizacion'),
                DB::raw('e.capacidad - COALESCE(es.stock_actual, 0) as capacidad_disponible'),
                'es.ultima_medicion',
                'e.activo'
            )
            ->where('e.activo', 1)
            ->orderBy('f.ubicacion')
            ->orderBy('e.nombre')
            ->get();

        $resumenPorFaena = $capacidades->groupBy('faena')->map(function ($estanques) {
            return [
                'total_estanques' => $estanques->count(),
                'capacidad_total' => $estanques->sum('capacidad'),
                'stock_total' => $estanques->sum('stock_actual'),
                'capacidad_disponible' => $estanques->sum('capacidad_disponible'),
                'porcentaje_utilizacion' => round(($estanques->sum('stock_actual') / $estanques->sum('capacidad')) * 100, 2),
                'estanques_criticos' => $estanques->where('porcentaje_utilizacion', '<', 20)->count(),
                'estanques_normales' => $estanques->where('porcentaje_utilizacion', '>=', 20)->count()
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'detalle_estanques' => $capacidades,
                'resumen_faenas' => $resumenPorFaena
            ]
        ]);
    }

    /**
     * Niveles críticos de stock
     */
    public function getNivelesCriticos()
    {
        $nivelesMinimos = [
            'critico' => 20,  // Menos del 20%
            'bajo' => 40,     // Entre 20% y 40%
            'normal' => 40    // Más del 40%
        ];

        $estanquesCriticos = DB::table('estanque_stock as es')
            ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
            ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
            ->select(
                'f.ubicacion as faena',
                'e.nombre as estanque',
                'es.stock_actual',
                'e.capacidad',
                DB::raw('ROUND((es.stock_actual / e.capacidad) * 100, 2) as porcentaje'),
                'es.ultima_medicion',
                DB::raw('CASE 
                WHEN (es.stock_actual / e.capacidad) < 0.20 THEN "critico"
                WHEN (es.stock_actual / e.capacidad) < 0.40 THEN "bajo"
                ELSE "normal"
            END as nivel')
            )
            ->where('e.activo', 1)
            ->orderBy(DB::raw('(es.stock_actual / e.capacidad)'))
            ->get();

        // Calcular proyección de agotamiento para estanques críticos
        $proyecciones = [];
        foreach ($estanquesCriticos->where('nivel', 'critico') as $estanque) {
            $consumoPromedio = DB::table('consumos as c')
                ->join('estanques as e', 'c.id_estanque', '=', 'e.id_estanque')
                ->where('e.nombre', $estanque->estanque)
                ->where('c.fecha_consumo', '>=', Carbon::now()->subDays(15))
                ->avg('litros_consumidos');

            if ($consumoPromedio > 0) {
                $diasRestantes = round($estanque->stock_actual / $consumoPromedio);
                $proyecciones[] = [
                    'faena' => $estanque->faena,
                    'estanque' => $estanque->estanque,
                    'stock_actual' => $estanque->stock_actual,
                    'consumo_diario_promedio' => round($consumoPromedio, 2),
                    'dias_restantes' => $diasRestantes,
                    'fecha_agotamiento_estimada' => Carbon::now()->addDays($diasRestantes)->format('Y-m-d')
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'niveles_configurados' => $nivelesMinimos,
                'estanques_por_nivel' => $estanquesCriticos->groupBy('nivel'),
                'resumen' => [
                    'criticos' => $estanquesCriticos->where('nivel', 'critico')->count(),
                    'bajos' => $estanquesCriticos->where('nivel', 'bajo')->count(),
                    'normales' => $estanquesCriticos->where('nivel', 'normal')->count(),
                ],
                'proyecciones_agotamiento' => $proyecciones
            ]
        ]);
    }

    /**
     * Datos filtrados para reportes personalizados
     */
    public function getDatosFiltrados(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio', Carbon::now()->subDays(30)->format('Y-m-d'));
        $fechaFin = $request->get('fecha_fin', Carbon::now()->format('Y-m-d'));
        $faenas = $request->get('faenas', []);
        $equipos = $request->get('equipos', []);
        $tipo = $request->get('tipo', 'consumos'); // consumos, ingresos, stock

        $query = null;

        switch ($tipo) {
            case 'consumos':
                $query = DB::table('consumos as c')
                    ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
                    ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
                    ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
                    ->select(
                        'c.fecha_consumo',
                        'f.ubicacion as faena',
                        'm.nombre_maquina',
                        'cm.nombre_categoria',
                        'c.litros_consumidos',
                        'c.medicion',
                        DB::raw('c.litros_consumidos * c.precio_litro as costo'),
                        'c.precio_litro'
                    )
                    ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin]);
                break;

            case 'ingresos':
                $query = DB::table('ingresos_petroleo as ip')
                    ->join('faenas as f', 'ip.id_faena', '=', 'f.id_faena')
                    ->select(
                        'ip.created_at as fecha',
                        'f.ubicacion as faena',
                        'ip.numero_guia',
                        'ip.litros_documentados',
                        'ip.litros_recibidos',
                        'ip.diferencia',
                        'ip.precio',
                        'ip.precio_total'
                    )
                    ->whereBetween('ip.created_at', [$fechaInicio, $fechaFin]);
                break;

            case 'stock':
                $query = DB::table('estanque_stock as es')
                    ->join('estanques as e', 'es.id_estanque', '=', 'e.id_estanque')
                    ->join('faenas as f', 'e.id_faena', '=', 'f.id_faena')
                    ->select(
                        'f.ubicacion as faena',
                        'e.nombre as estanque',
                        'es.stock_actual',
                        'e.capacidad',
                        'es.altura_actual',
                        'e.altura_nominal',
                        DB::raw('ROUND((es.stock_actual / e.capacidad) * 100, 2) as porcentaje_ocupacion'),
                        'es.ultima_medicion'
                    );
                break;
        }

        // Aplicar filtros si se proporcionan
        if (!empty($faenas) && $query) {
            $query->whereIn('f.id_faena', $faenas);
        }

        if (!empty($equipos) && $tipo === 'consumos' && $query) {
            $query->whereIn('m.id_maquina', $equipos);
        }

        $datos = $query ? $query->get() : collect();

        return response()->json([
            'success' => true,
            'data' => $datos,
            'filtros_aplicados' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'faenas' => $faenas,
                'equipos' => $equipos,
                'tipo' => $tipo
            ]
        ]);
    }

    /**
     * Obtener faenas disponibles
     */
    public function getFaenas()
    {
        $faenas = DB::table('faenas')
            ->select('id_faena', 'ubicacion', 'detalle')
            ->orderBy('ubicacion')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $faenas
        ]);
    }

    /**
     * Obtener equipos disponibles
     */
    public function getEquipos()
    {
        $equipos = DB::table('maquinas as m')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->select(
                'm.id_maquina',
                'm.nombre_maquina',
                'm.patente',
                'cm.nombre_categoria',
                'm.estado'
            )
            ->where('m.estado', 'operativo')
            ->orderBy('m.nombre_maquina')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $equipos
        ]);
    }

    /**
     * Exportar reporte en PDF o Excel
     */
    public function exportarReporte(Request $request)
    {
        $formato = $request->get('formato', 'pdf'); // pdf, excel
        $tipo = $request->get('tipo', 'completo'); // completo, stock, consumos, ingresos

        // Aquí implementarías la lógica de exportación
        // Por ahora retornamos la estructura que tendría el reporte

        $datosReporte = [
            'titulo' => 'Reporte de Control de Combustible',
            'fecha_generacion' => now()->format('Y-m-d H:i:s'),
            'periodo' => $request->get('periodo', 'Últimos 30 días'),
            'secciones' => []
        ];

        switch ($tipo) {
            case 'completo':
                $datosReporte['secciones'] = [
                    'resumen_ejecutivo',
                    'stock_actual',
                    'ingresos_periodo',
                    'consumos_equipos',
                    'alertas_activas',
                    'proyecciones'
                ];
                break;
            case 'stock':
                $datosReporte['secciones'] = ['stock_actual', 'niveles_criticos'];
                break;
            case 'consumos':
                $datosReporte['secciones'] = ['consumos_equipos', 'eficiencia'];
                break;
            case 'ingresos':
                $datosReporte['secciones'] = ['ingresos_periodo', 'diferencias_recepcion'];
                break;
        }

        return response()->json([
            'success' => true,
            'message' => 'Reporte generado exitosamente',
            'data' => $datosReporte,
            'download_url' => "/api/combustible/download-report/{$tipo}-" . now()->format('YmdHis') . ".{$formato}"
        ]);
    }
}
