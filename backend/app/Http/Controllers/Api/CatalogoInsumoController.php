<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogoInsumo;
use Illuminate\Http\Request;

class CatalogoInsumoController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = CatalogoInsumo::with(['categoria', 'responsable'])->orderBy('id_categoria')->orderBy('tipo');

            if ($request->filled('id_categoria')) {
                $query->where('id_categoria', $request->get('id_categoria'));
            }

            if ($request->filled('tipo')) {
                $query->where('tipo', $request->get('tipo'));
            }

            if ($request->filled('activo')) {
                $query->where('activo', $request->boolean('activo'));
            }

            if ($request->filled('busqueda')) {
                $texto = $request->get('busqueda');
                $query->where(function ($q) use ($texto) {
                    $q->where('detalle', 'like', "%{$texto}%")
                        ->orWhereHas('responsable', function ($rq) use ($texto) {
                            $rq->where('nombre', 'like', "%{$texto}%");
                        });
                });
            }

            $porPagina = (int) $request->get('per_page', 20);
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
                'message' => 'Error al obtener el catálogo: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_categoria' => 'required|exists:categorias_maquinas,id_categoria',
            'tipo' => 'required|string|in:Aceite,Neumático',
            'detalle' => 'required|string|max:255',
            'id_responsable' => 'nullable|exists:mecanicos,id',
        ]);

        try {
            $opcion = CatalogoInsumo::create([
                'id_categoria' => $request->id_categoria,
                'tipo' => $request->tipo,
                'detalle' => $request->detalle,
                'id_responsable' => $request->id_responsable,
                'activo' => true,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Opción agregada correctamente',
                'data' => $opcion->load('categoria', 'responsable'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al agregar la opción: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'tipo' => 'sometimes|string|in:Aceite,Neumático',
            'detalle' => 'sometimes|string|max:255',
            'id_responsable' => 'nullable|exists:mecanicos,id',
            'activo' => 'sometimes|boolean',
        ]);

        try {
            $opcion = CatalogoInsumo::find($id);

            if (!$opcion) {
                return response()->json(['status' => 'error', 'message' => 'Opción no encontrada'], 404);
            }

            $opcion->update($request->only(['tipo', 'detalle', 'id_responsable', 'activo']));

            return response()->json([
                'status' => 'success',
                'message' => 'Opción actualizada correctamente',
                'data' => $opcion->load('categoria', 'responsable'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar la opción: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $opcion = CatalogoInsumo::find($id);

            if (!$opcion) {
                return response()->json(['status' => 'error', 'message' => 'Opción no encontrada'], 404);
            }

            if ($opcion->registros()->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se puede eliminar: hay registros que usan esta opción. Puedes desactivarla en su lugar.',
                ], 422);
            }

            $opcion->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Opción eliminada correctamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar la opción: ' . $e->getMessage(),
            ], 500);
        }
    }
}
