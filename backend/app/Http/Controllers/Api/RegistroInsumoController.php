<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistroInsumo;
use Illuminate\Http\Request;

class RegistroInsumoController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = RegistroInsumo::with(['maquina', 'catalogoInsumo', 'usuario', 'responsable'])->orderByDesc('fecha');

            if ($request->filled('mes') && $request->filled('anio')) {
                $query->whereYear('fecha', $request->get('anio'))
                    ->whereMonth('fecha', $request->get('mes'));
            }

            if ($request->filled('id_maquina')) {
                $query->where('id_maquina', $request->get('id_maquina'));
            }

            if ($request->filled('tipo')) {
                $query->whereHas('catalogoInsumo', function ($q) use ($request) {
                    $q->where('tipo', $request->get('tipo'));
                });
            }

            return response()->json([
                'status' => 'success',
                'data' => $query->get(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los registros: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'id_catalogo_insumo' => 'required|exists:catalogo_insumos,id',
            'fecha' => 'required|date',
            'observaciones' => 'nullable|string',
            'id_responsable' => 'nullable|exists:mecanicos,id',
        ]);

        try {
            $registro = RegistroInsumo::create([
                'id_maquina' => $request->id_maquina,
                'id_catalogo_insumo' => $request->id_catalogo_insumo,
                'fecha' => $request->fecha,
                'observaciones' => $request->observaciones,
                'id_responsable' => $request->id_responsable,
                'creado_por' => $request->user()->id,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Registro agregado correctamente',
                'data' => $registro->load(['maquina', 'catalogoInsumo', 'usuario', 'responsable']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al agregar el registro: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'id_catalogo_insumo' => 'sometimes|exists:catalogo_insumos,id',
            'fecha' => 'sometimes|date',
            'observaciones' => 'nullable|string',
            'id_responsable' => 'nullable|exists:mecanicos,id',
        ]);

        try {
            $registro = RegistroInsumo::find($id);

            if (!$registro) {
                return response()->json(['status' => 'error', 'message' => 'Registro no encontrado'], 404);
            }

            $registro->update($request->only(['id_catalogo_insumo', 'fecha', 'observaciones', 'id_responsable']));

            return response()->json([
                'status' => 'success',
                'message' => 'Registro actualizado correctamente',
                'data' => $registro->load(['maquina', 'catalogoInsumo', 'usuario', 'responsable']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar el registro: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $registro = RegistroInsumo::find($id);

            if (!$registro) {
                return response()->json(['status' => 'error', 'message' => 'Registro no encontrado'], 404);
            }

            $registro->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Registro eliminado correctamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al eliminar el registro: ' . $e->getMessage(),
            ], 500);
        }
    }
}
