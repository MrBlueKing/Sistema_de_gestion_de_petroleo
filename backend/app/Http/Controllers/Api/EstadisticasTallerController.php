<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Falla;
use App\Models\ActividadFalla;
use App\Models\RegistroInsumo;
use Illuminate\Http\Request;

class EstadisticasTallerController extends Controller
{
    public function resumen(Request $request)
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'fallas' => $this->estadisticasFallas(),
                    'insumos' => $this->estadisticasInsumos(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al calcular estadísticas: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function estadisticasFallas(): array
    {
        $fallas = Falla::with(['maquina.categoria', 'actividades'])->get();

        $porEstado = [
            'abierta' => $fallas->where('estado', 'abierta')->count(),
            'en_reparacion' => $fallas->where('estado', 'en_reparacion')->count(),
            'cerrada' => $fallas->where('estado', 'cerrada')->count(),
        ];

        $porCategoria = $fallas
            ->filter(fn ($f) => $f->maquina && $f->maquina->categoria)
            ->groupBy(fn ($f) => $f->maquina->categoria->nombre_categoria)
            ->map(fn ($grupo, $nombre) => ['nombre' => $nombre, 'total' => $grupo->count()])
            ->values()
            ->sortByDesc('total')
            ->values();

        $actividades = ActividadFalla::all();

        $porTipo = [
            'Interno' => $actividades->where('tipo', 'I')->count(),
            'Externo' => $actividades->where('tipo', 'E')->count(),
        ];

        $finalizadas = $actividades->filter(fn ($a) => $a->fecha_inicio_real && $a->fecha_fin_real && $a->tiempo_real !== null);

        $cumplieronTiempo = $finalizadas->filter(fn ($a) => (float) $a->tiempo_real <= (float) $a->tiempo_estimado);
        $porcentajeAciertoTiempo = $finalizadas->count() > 0
            ? round(($cumplieronTiempo->count() / $finalizadas->count()) * 100, 1)
            : null;

        $cumplieronFecha = $finalizadas->filter(fn ($a) => ($a->difFechaDias() ?? 0) <= 0);
        $porcentajeAciertoFecha = $finalizadas->count() > 0
            ? round(($cumplieronFecha->count() / $finalizadas->count()) * 100, 1)
            : null;

        $tiempoPromedioReal = $finalizadas->count() > 0
            ? round($finalizadas->avg(fn ($a) => (float) $a->tiempo_real), 2)
            : null;

        return [
            'total_fallas' => $fallas->count(),
            'por_estado' => $porEstado,
            'por_categoria' => $porCategoria,
            'total_actividades' => $actividades->count(),
            'por_tipo' => $porTipo,
            'actividades_finalizadas' => $finalizadas->count(),
            'porcentaje_acierto_tiempo' => $porcentajeAciertoTiempo,
            'porcentaje_acierto_fecha' => $porcentajeAciertoFecha,
            'tiempo_promedio_real_dias' => $tiempoPromedioReal,
        ];
    }

    private function estadisticasInsumos(): array
    {
        $registros = RegistroInsumo::with(['maquina.categoria', 'catalogoInsumo'])->get();

        $porTipo = $registros
            ->filter(fn ($r) => $r->catalogoInsumo)
            ->groupBy(fn ($r) => $r->catalogoInsumo->tipo)
            ->map(fn ($grupo, $tipo) => ['nombre' => $tipo, 'total' => $grupo->count()])
            ->values()
            ->sortByDesc('total')
            ->values();

        $porCategoria = $registros
            ->filter(fn ($r) => $r->maquina && $r->maquina->categoria)
            ->groupBy(fn ($r) => $r->maquina->categoria->nombre_categoria)
            ->map(fn ($grupo, $nombre) => ['nombre' => $nombre, 'total' => $grupo->count()])
            ->values()
            ->sortByDesc('total')
            ->values();

        $porMes = $registros
            ->groupBy(fn ($r) => $r->fecha->format('Y-m'))
            ->map(fn ($grupo, $mes) => ['mes' => $mes, 'total' => $grupo->count()])
            ->values()
            ->sortBy('mes')
            ->values();

        return [
            'total_registros' => $registros->count(),
            'por_tipo' => $porTipo,
            'por_categoria' => $porCategoria,
            'por_mes' => $porMes,
        ];
    }
}
