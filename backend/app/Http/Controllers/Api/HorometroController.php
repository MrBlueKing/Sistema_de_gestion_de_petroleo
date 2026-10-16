<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Corrección de horómetro / kilometraje de los consumos (solo Administrador).
 *
 * La lectura de la máquina vive en consumos.medicion; es la que usan los
 * informes de rendimiento. La detección de lecturas raras (baja, salto) se
 * hace en el navegador sobre la serie que devuelve index().
 */
class HorometroController extends Controller
{
    /**
     * Máquinas medidas por horómetro o km con sus consumos del rango, en orden.
     * GET /admin/horometros?desde=Y-m-d&hasta=Y-m-d (por defecto, últimos 60 días)
     */
    public function index(Request $request)
    {
        $hasta = $request->filled('hasta') ? Carbon::parse($request->hasta)->endOfDay() : Carbon::now()->endOfDay();
        $desde = $request->filled('desde') ? Carbon::parse($request->desde)->startOfDay() : $hasta->copy()->subDays(60)->startOfDay();

        $filas = DB::table('consumos as c')
            ->join('maquinas as m', 'm.id_maquina', '=', 'c.id_equipo')
            ->join('categorias_maquinas as cat', 'cat.id_categoria', '=', 'm.id_categoria')
            ->leftJoin('faenas as f', 'f.id_faena', '=', 'c.id_faena')
            ->whereIn('cat.tipo_medicion', ['Horometro', 'Kilometraje'])
            ->whereBetween('c.fecha_consumo', [$desde, $hasta])
            ->orderBy('m.id_maquina')->orderBy('c.fecha_consumo')->orderBy('c.id_consumo')
            ->get([
                'm.id_maquina', 'm.nombre_maquina', 'm.patente', 'cat.nombre_categoria', 'cat.tipo_medicion',
                'c.id_consumo', 'c.fecha_consumo', 'c.litros_consumidos', 'c.medicion', 'c.observacion', 'f.ubicacion as faena',
            ]);

        // Valor original de las lecturas ya corregidas (la primera corrección guarda el dato como venía)
        $originales = DB::table('correcciones_medicion')
            ->whereIn('id_consumo', $filas->pluck('id_consumo'))
            ->orderBy('id')
            ->get(['id_consumo', 'medicion_anterior'])
            ->groupBy('id_consumo')
            ->map(fn ($g) => $g->first()->medicion_anterior);

        $maquinas = $filas->groupBy('id_maquina')->map(function ($g) use ($originales) {
            $m = $g->first();
            return [
                'id'      => (int) $m->id_maquina,
                'nombre'  => $m->nombre_maquina,
                'patente' => $m->patente,
                'cat'     => $m->nombre_categoria,
                'tipo'    => $m->tipo_medicion,
                'rows'    => $g->map(fn ($r) => [
                    'id'       => (int) $r->id_consumo,
                    'f'        => Carbon::parse($r->fecha_consumo)->format('Y-m-d H:i'),
                    'l'        => (float) $r->litros_consumidos,
                    'm'        => $r->medicion !== null ? (float) $r->medicion : null,
                    'fa'       => $r->faena,
                    'obs'      => $r->observacion !== null && trim($r->observacion) !== '' ? trim($r->observacion) : null,
                    'original' => $originales->has($r->id_consumo) ? (float) $originales[$r->id_consumo] : null,
                ])->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'desde'    => $desde->toDateString(),
                'hasta'    => $hasta->toDateString(),
                'maquinas' => $maquinas,
            ],
        ]);
    }

    /**
     * Corrige una o varias lecturas en una sola transacción (una lectura o un tramo).
     * POST /admin/horometros/corregir { motivo?, cambios: [{ id_consumo, medicion }] }
     */
    public function corregir(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'motivo'               => 'nullable|string|max:500',
            'cambios'              => 'required|array|min:1|max:300',
            'cambios.*.id_consumo' => 'required|integer|distinct|exists:consumos,id_consumo',
            'cambios.*.medicion'   => 'required|numeric|min:0|max:9999999.999',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $ids = collect($request->cambios)->pluck('id_consumo');
        $consumos = DB::table('consumos as c')
            ->join('maquinas as m', 'm.id_maquina', '=', 'c.id_equipo')
            ->join('categorias_maquinas as cat', 'cat.id_categoria', '=', 'm.id_categoria')
            ->whereIn('c.id_consumo', $ids)
            ->get(['c.id_consumo', 'c.id_equipo', 'c.medicion', 'cat.tipo_medicion'])
            ->keyBy('id_consumo');

        // Solo lecturas de máquinas que se miden por horómetro o km, y todas de la misma máquina
        if ($consumos->contains(fn ($c) => !in_array($c->tipo_medicion, ['Horometro', 'Kilometraje'], true))) {
            return response()->json(['success' => false, 'message' => 'Hay consumos de máquinas que no se miden por horómetro ni km.'], 422);
        }
        if ($consumos->pluck('id_equipo')->unique()->count() > 1) {
            return response()->json(['success' => false, 'message' => 'Las lecturas de una corrección deben ser de la misma máquina.'], 422);
        }

        $user = $request->user();
        $nombre = trim(($user->nombre ?? '') . ' ' . ($user->apellido ?? '')) ?: null;
        $lote = (string) Str::uuid();
        $ahora = now();

        DB::transaction(function () use ($request, $consumos, $user, $nombre, $lote, $ahora) {
            foreach ($request->cambios as $cambio) {
                $c = $consumos[$cambio['id_consumo']];
                $nuevo = round((float) $cambio['medicion'], 3);
                if ($c->medicion !== null && abs((float) $c->medicion - $nuevo) < 0.005) {
                    continue; // sin cambio real
                }
                DB::table('consumos')->where('id_consumo', $c->id_consumo)->update(['medicion' => $nuevo, 'updated_at' => $ahora]);
                DB::table('correcciones_medicion')->insert([
                    'id_consumo'        => $c->id_consumo,
                    'id_maquina'        => $c->id_equipo,
                    'medicion_anterior' => $c->medicion,
                    'medicion_nueva'    => $nuevo,
                    'motivo'            => $request->filled('motivo') ? trim($request->motivo) : null,
                    'lote'              => $lote,
                    'usuario_id'        => $user?->id,
                    'usuario_nombre'    => $nombre,
                    'created_at'        => $ahora,
                    'updated_at'        => $ahora,
                ]);
            }
        });

        Log::info('Corrección de horómetro/km', ['lote' => $lote, 'usuario' => $nombre, 'cambios' => count($request->cambios)]);

        return response()->json(['success' => true, 'message' => 'Corrección guardada', 'data' => ['lote' => $lote]]);
    }

    /**
     * Correcciones hechas a una máquina, la más reciente primero, agrupadas por lote.
     * GET /admin/horometros/{idMaquina}/historial
     */
    public function historial($idMaquina)
    {
        $filas = DB::table('correcciones_medicion as h')
            ->join('consumos as c', 'c.id_consumo', '=', 'h.id_consumo')
            ->where('h.id_maquina', $idMaquina)
            ->orderByDesc('h.id')
            ->limit(500)
            ->get(['h.lote', 'h.created_at', 'h.usuario_nombre', 'h.motivo', 'h.medicion_anterior', 'h.medicion_nueva', 'c.fecha_consumo']);

        $lotes = $filas->groupBy('lote')->map(function ($g) {
            $orden = $g->sortBy('fecha_consumo')->values();
            return [
                'cuando'   => Carbon::parse($g->first()->created_at)->format('d-m-Y H:i'),
                'quien'    => $g->first()->usuario_nombre ?? 'Administrador',
                'motivo'   => $g->first()->motivo,
                'lecturas' => $g->count(),
                'desde'    => Carbon::parse($orden->first()->fecha_consumo)->format('d-m'),
                'hasta'    => Carbon::parse($orden->last()->fecha_consumo)->format('d-m'),
                'antes'    => $orden->first()->medicion_anterior !== null ? (float) $orden->first()->medicion_anterior : null,
                'despues'  => (float) $orden->first()->medicion_nueva,
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $lotes]);
    }
}
