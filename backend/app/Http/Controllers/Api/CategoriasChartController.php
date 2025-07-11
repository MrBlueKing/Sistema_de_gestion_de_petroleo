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
     * 🔑 SINCRONIZADO CON InformeKpiController para usar la misma estructura de datos
     */
    public function obtenerDatosCategoriasChart(Request $request)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena; // Opcional, para filtrar por faena
            $idCategoria = $request->id_categoria; // Opcional, para drill-down a máquinas
            $modo = $request->modo ?? 'categorias'; // 'categorias' o 'maquinas'

            // 🔑 IGUAL QUE InformeKpiController: Convertir fechas con Carbon
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
     * 🔑 SINCRONIZADO: Obtener datos de consumo por categorías usando la MISMA ESTRUCTURA que InformeKpiController
     */
    private function obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena = null)
    {
        // 🔑 CAMBIO CRÍTICO: Usar la MISMA estructura de joins que InformeKpiController
        $query = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina') // 🔑 AGREGAR maquinas_internas
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0);

        // 🔑 IGUAL QUE InformeKpiController: Filtro por faena
        if ($idFaena && $idFaena !== 'todas') {
            $query->where('c.id_faena', $idFaena);
        }

        $resultados = $query->select([
                'cm.id_categoria',
                'cm.nombre_categoria',
                'cm.tipo_medicion',
                DB::raw('SUM(c.litros_consumidos) as total_consumo'),
                DB::raw('COUNT(DISTINCT m.id_maquina) as cantidad_maquinas'),
                DB::raw('COUNT(c.id_consumo) as total_registros'),
                DB::raw('AVG(c.litros_consumidos) as promedio_consumo'),
                DB::raw('MAX(c.fecha_consumo) as ultimo_consumo'),
                DB::raw('MIN(c.fecha_consumo) as primer_consumo')
            ])
            ->groupBy([
                'cm.id_categoria', 
                'cm.nombre_categoria',
                'cm.tipo_medicion'
            ])
            ->orderBy('total_consumo', 'desc') // 🔑 IGUAL QUE InformeKpiController: orden desc
            ->get();

        // Formatear datos para el PieChart
        $data = $resultados->map(function ($item) {
            return [
                'id' => $item->id_categoria,
                'name' => $item->nombre_categoria,
                'value' => round($item->total_consumo, 2), // 🔑 IGUAL QUE InformeKpiController: redondeo
                'maquinas_count' => $item->cantidad_maquinas,
                'tipo_medicion' => $item->tipo_medicion,
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
        $totalMaquinas = $data->sum('maquinas_count');

        $metadata = [
            'periodo' => [
                'fecha_inicio' => $fechaInicio->toDateString(), // 🔑 IGUAL QUE InformeKpiController: format
                'fecha_fin' => $fechaFin->toDateString(),
                'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
            ],
            'resumen' => [
                'total_categorias' => $data->count(),
                'total_consumo_litros' => round($totalConsumo, 2),
                'total_maquinas' => $totalMaquinas,
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
     * 🔑 SINCRONIZADO: Obtener datos de máquinas usando la MISMA ESTRUCTURA que InformeKpiController
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

        // 🔑 CAMBIO CRÍTICO: Usar la MISMA estructura de joins que InformeKpiController
        $query = DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina') // 🔑 AGREGAR maquinas_internas
            ->where('m.id_categoria', $idCategoria)
            ->whereBetween('c.fecha_consumo', [$fechaInicio, $fechaFin])
            ->whereNotNull('c.litros_consumidos')
            ->where('c.litros_consumidos', '>', 0);

        // 🔑 IGUAL QUE InformeKpiController: Filtro por faena
        if ($idFaena && $idFaena !== 'todas') {
            $query->where('c.id_faena', $idFaena);
        }

        $resultados = $query->select([
                'm.id_maquina',
                'mi.nombre as nombre_maquina', // 🔑 CAMBIO: usar mi.nombre (maquinas_internas)
                'mi.patente',                  // 🔑 CAMBIO: usar mi.patente (maquinas_internas)
                'm.estado',
                DB::raw('SUM(c.litros_consumidos) as total_consumo'),
                DB::raw('COUNT(c.id_consumo) as total_registros'),
                DB::raw('AVG(c.litros_consumidos) as promedio_consumo'),
                DB::raw('MAX(c.fecha_consumo) as ultimo_consumo'),
                DB::raw('MIN(c.fecha_consumo) as primer_consumo')
            ])
            ->groupBy([
                'm.id_maquina', 
                'mi.nombre',     // 🔑 CAMBIO: agrupar por mi.nombre
                'mi.patente',    // 🔑 CAMBIO: agrupar por mi.patente
                'm.estado'
            ])
            ->orderBy('total_consumo', 'desc') // 🔑 IGUAL QUE InformeKpiController: orden desc
            ->get();

        // Formatear datos para el PieChart
        $data = $resultados->map(function ($item) {
            return [
                'id' => $item->id_maquina,
                'name' => $item->nombre_maquina,
                'value' => round($item->total_consumo, 2), // 🔑 IGUAL QUE InformeKpiController: redondeo
                'patente' => $item->patente ?? 'N/A',
                'estado' => $item->estado,
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

        $metadata = [
            'categoria' => [
                'id' => $categoria->id_categoria,
                'nombre' => $categoria->nombre_categoria,
                'tipo_medicion' => $categoria->tipo_medicion
            ],
            'periodo' => [
                'fecha_inicio' => $fechaInicio->toDateString(), // 🔑 IGUAL QUE InformeKpiController: format
                'fecha_fin' => $fechaFin->toDateString(),
                'dias_periodo' => $fechaInicio->diffInDays($fechaFin) + 1
            ],
            'resumen' => [
                'total_maquinas' => $data->count(),
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
     * Endpoint específico para obtener solo las categorías (más rápido)
     * 🔑 SINCRONIZADO con la nueva estructura
     */
    public function obtenerCategoriasResumen(Request $request)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena;

            // 🔑 IGUAL QUE InformeKpiController: Convertir fechas con Carbon
            $fechaInicio = Carbon::parse($fechaInicio)->startOfDay();
            $fechaFin = Carbon::parse($fechaFin)->endOfDay();

            $resultado = $this->obtenerDatosCategorias($fechaInicio, $fechaFin, $idFaena);

            return response()->json([
                'success' => true,
                'categorias' => $resultado['data'],
                'resumen' => $resultado['metadata']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endpoint específico para obtener máquinas de una categoría
     * 🔑 SINCRONIZADO con la nueva estructura
     */
    public function obtenerMaquinasCategoria(Request $request, $idCategoria)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? Carbon::now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? Carbon::now()->format('Y-m-d');
            $idFaena = $request->id_faena;

            // 🔑 IGUAL QUE InformeKpiController: Convertir fechas con Carbon
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
     * Obtener lista de categorías disponibles
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

            // 🔑 SINCRONIZADO: Agregar conteo usando maquinas_internas como InformeKpiController
            $categoriasConConteo = $categorias->map(function ($categoria) {
                $conteoMaquinas = DB::table('maquinas as m')
                    ->join('maquinas_internas as mi', 'm.id_maquina', '=', 'mi.id_maquina') // 🔑 CAMBIO
                    ->where('m.id_categoria', $categoria->id_categoria)
                    ->count();

                return [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria,
                    'tipo_medicion' => $categoria->tipo_medicion,
                    'chc' => $categoria->chc,
                    'cantidad_maquinas' => $conteoMaquinas
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
            // 🔑 CAMBIO: Validar Carbon objects directamente
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
}