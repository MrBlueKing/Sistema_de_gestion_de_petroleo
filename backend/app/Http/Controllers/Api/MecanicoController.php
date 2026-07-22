<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mecanico;
use Illuminate\Http\Request;

class MecanicoController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Mecanico::orderBy('nombre');

            if ($request->filled('activo')) {
                $query->where('activo', $request->boolean('activo'));
            }

            return response()->json([
                'status' => 'success',
                'data' => $query->get(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener mecánicos: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|unique:mecanicos,nombre',
            'rut' => 'nullable|string|unique:mecanicos,rut',
        ]);

        try {
            $mecanico = Mecanico::create([
                'nombre' => $request->nombre,
                'rut' => $request->rut,
                'activo' => true,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Mecánico registrado correctamente',
                'data' => $mecanico,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar mecánico: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $mecanico = Mecanico::find($id);

        if (!$mecanico) {
            return response()->json(['status' => 'error', 'message' => 'Mecánico no encontrado'], 404);
        }

        $request->validate([
            'nombre' => 'sometimes|string|unique:mecanicos,nombre,' . $mecanico->id,
            'activo' => 'sometimes|boolean',
        ]);

        try {
            $mecanico->update($request->only(['nombre', 'activo']));

            return response()->json([
                'status' => 'success',
                'message' => 'Mecánico actualizado correctamente',
                'data' => $mecanico,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar mecánico: ' . $e->getMessage(),
            ], 500);
        }
    }
}
