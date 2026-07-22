<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActividadFalla;
use App\Models\Falla;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FallaController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Falla::with(['maquina', 'usuario'])
                ->withCount('actividades')
                ->orderByDesc('fecha');

            if ($request->filled('estado')) {
                $query->where('estado', $request->get('estado'));
            }

            if ($request->filled('id_maquina')) {
                $query->where('id_maquina', $request->get('id_maquina'));
            }

            if ($request->filled('fecha_desde')) {
                $query->whereDate('fecha', '>=', $request->get('fecha_desde'));
            }

            if ($request->filled('fecha_hasta')) {
                $query->whereDate('fecha', '<=', $request->get('fecha_hasta'));
            }

            if ($request->filled('busqueda')) {
                $texto = $request->get('busqueda');
                $query->where(function ($q) use ($texto) {
                    $q->where('descripcion', 'like', "%{$texto}%")
                        ->orWhereHas('maquina', function ($mq) use ($texto) {
                            $mq->where('nombre_maquina', 'like', "%{$texto}%");
                        });
                });
            }

            $porPagina = (int) $request->get('per_page', 15);
            $resultado = $query->paginate($porPagina);

            return response()->json([
                'status' => 'success',
                'data' => $resultado->items(),
                'pagination' => [
                    'current_page' => $resultado->currentPage(),
                    'last_page' => $resultado->lastPage(),
                    'per_page' => $resultado->perPage(),
                    'total' => $resultado->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener fallas: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'horometro' => 'required|numeric|min:0',
            'fecha' => 'nullable|date',
            'descripcion' => 'required|string',
            'actividades' => 'nullable|array',
            'actividades.*.descripcion' => 'required|string',
            'actividades.*.tipo' => 'required|in:I,E',
            'actividades.*.tiempo_estimado' => 'required|numeric|min:0',
            'actividades.*.orden' => 'required|integer|min:1',
            'actividades.*.fecha_inicio_planificada' => 'required|date',
            'actividades.*.id_mecanico' => 'nullable|exists:mecanicos,id',
        ]);

        try {
            DB::beginTransaction();

            $falla = Falla::create([
                'id_maquina' => $request->id_maquina,
                'horometro' => $request->horometro,
                'fecha' => $request->fecha ?? now(),
                'descripcion' => $request->descripcion,
                'estado' => 'abierta',
                'creado_por' => $request->user()->id,
            ]);

            foreach ($request->actividades ?? [] as $actividad) {
                $falla->actividades()->create([
                    'descripcion' => $actividad['descripcion'],
                    'tipo' => $actividad['tipo'],
                    'tiempo_estimado' => $actividad['tiempo_estimado'],
                    'orden' => $actividad['orden'],
                    'fecha_inicio_planificada' => $actividad['fecha_inicio_planificada'],
                    'id_mecanico' => $actividad['id_mecanico'] ?? null,
                ]);
            }

            DB::table('maquinas')
                ->where('id_maquina', $request->id_maquina)
                ->update(['estado' => 'en_mantenimiento', 'updated_at' => now()]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Falla registrada correctamente',
                'data' => $falla->load('actividades.mecanico', 'maquina'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar falla: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $falla = Falla::with(['maquina', 'usuario', 'actividades.mecanico'])->find($id);

            if (!$falla) {
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            $data = $falla->toArray();
            $data['resumen'] = $falla->resumen();
            $data['actividades'] = $falla->actividades->map(function (ActividadFalla $actividad) {
                $item = $actividad->toArray();
                $item['dif_fecha_dias'] = $actividad->difFechaDias();
                $item['dif_tiempo'] = $actividad->difTiempo();
                return $item;
            });

            return response()->json(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener falla: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_maquina' => 'sometimes|exists:maquinas,id_maquina',
            'horometro' => 'sometimes|numeric|min:0',
            'fecha' => 'sometimes|date',
            'descripcion' => 'sometimes|string',
            'observaciones_finales' => 'nullable|string',
        ]);

        try {
            $falla = Falla::find($id);

            if (!$falla) {
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            $falla->update($request->only([
                'id_maquina', 'horometro', 'fecha', 'descripcion', 'observaciones_finales',
            ]));

            return response()->json([
                'status' => 'success',
                'message' => 'Falla actualizada correctamente',
                'data' => $falla,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar falla: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function cerrar(Request $request, $id)
    {
        $request->validate([
            'observaciones_finales' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $falla = Falla::find($id);

            if (!$falla) {
                DB::rollBack();
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            if ($falla->actividades->isEmpty()) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede cerrar la falla: agrega al menos una actividad al plan de reparación.',
                ], 422);
            }

            $sinFinalizar = $falla->actividades->contains(fn ($a) => !$a->fecha_inicio_real || !$a->fecha_fin_real);
            if ($sinFinalizar) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede cerrar la falla: hay actividades pendientes o en curso sin finalizar.',
                ], 422);
            }

            $falla->update([
                'estado' => 'cerrada',
                'fecha_cierre' => now(),
                'observaciones_finales' => $request->observaciones_finales ?? $falla->observaciones_finales,
            ]);

            DB::table('maquinas')
                ->where('id_maquina', $falla->id_maquina)
                ->update(['estado' => 'operativo', 'updated_at' => now()]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Falla cerrada correctamente',
                'data' => $falla->load('actividades'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cerrar falla: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $falla = Falla::find($id);

            if (!$falla) {
                DB::rollBack();
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            $idMaquina = $falla->id_maquina;
            $falla->delete();

            if (!Falla::where('id_maquina', $idMaquina)->whereIn('estado', ['abierta', 'en_reparacion'])->exists()) {
                DB::table('maquinas')
                    ->where('id_maquina', $idMaquina)
                    ->update(['estado' => 'operativo', 'updated_at' => now()]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Falla eliminada correctamente',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar falla: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function storeActividad(Request $request, $id)
    {
        $request->validate([
            'descripcion' => 'required|string',
            'tipo' => 'required|in:I,E',
            'tiempo_estimado' => 'required|numeric|min:0',
            'orden' => 'required|integer|min:1',
            'fecha_inicio_planificada' => 'required|date',
            'id_mecanico' => 'nullable|exists:mecanicos,id',
        ]);

        try {
            $falla = Falla::find($id);

            if (!$falla) {
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            if ($falla->estado === 'cerrada') {
                return response()->json(['status' => 'error', 'message' => 'No se puede modificar el plan de una falla cerrada.'], 422);
            }

            $actividad = $falla->actividades()->create($request->only([
                'descripcion', 'tipo', 'tiempo_estimado', 'orden', 'fecha_inicio_planificada', 'id_mecanico',
            ]));

            return response()->json([
                'status' => 'success',
                'message' => 'Actividad agregada correctamente',
                'data' => $actividad,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al agregar actividad: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateActividad(Request $request, $id, $idActividad)
    {
        $request->validate([
            'descripcion' => 'sometimes|string',
            'tipo' => 'sometimes|in:I,E',
            'tiempo_estimado' => 'sometimes|numeric|min:0',
            'orden' => 'sometimes|integer|min:1',
            'fecha_inicio_planificada' => 'sometimes|date',
            'fecha_inicio_real' => 'nullable|date',
            'fecha_fin_real' => 'nullable|date',
            'tiempo_real' => 'nullable|numeric|min:0',
            'id_mecanico' => 'nullable|exists:mecanicos,id',
        ]);

        try {
            $falla = Falla::find($id);

            if (!$falla) {
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            if ($falla->estado === 'cerrada') {
                return response()->json(['status' => 'error', 'message' => 'No se puede modificar el plan de una falla cerrada.'], 422);
            }

            $actividad = ActividadFalla::where('id_falla', $id)->find($idActividad);

            if (!$actividad) {
                return response()->json(['status' => 'error', 'message' => 'Actividad no encontrada'], 404);
            }

            $datos = $request->only([
                'descripcion', 'tipo', 'tiempo_estimado', 'orden', 'fecha_inicio_planificada',
                'fecha_inicio_real', 'fecha_fin_real', 'tiempo_real', 'id_mecanico',
            ]);

            $actividad->update($datos);

            if ($actividad->fecha_inicio_real && $falla->estado === 'abierta') {
                $falla->update(['estado' => 'en_reparacion']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Actividad actualizada correctamente',
                'data' => $actividad,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar actividad: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroyActividad($id, $idActividad)
    {
        try {
            $falla = Falla::find($id);

            if (!$falla) {
                return response()->json(['status' => 'error', 'message' => 'Falla no encontrada'], 404);
            }

            if ($falla->estado === 'cerrada') {
                return response()->json(['status' => 'error', 'message' => 'No se puede modificar el plan de una falla cerrada.'], 422);
            }

            $actividad = ActividadFalla::where('id_falla', $id)->find($idActividad);

            if (!$actividad) {
                return response()->json(['status' => 'error', 'message' => 'Actividad no encontrada'], 404);
            }

            $actividad->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Actividad eliminada correctamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar actividad: ' . $e->getMessage(),
            ], 500);
        }
    }
}
