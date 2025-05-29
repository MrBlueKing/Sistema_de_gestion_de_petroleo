<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CategoriaMaquina;
use Illuminate\Validation\Rule;

class CategoriaMaquinaController extends Controller
{
    // ✅ Listar todas las categorías
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => CategoriaMaquina::all(),
        ]);
    }

    // ✅ Crear nueva categoría
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre_categoria' => 'required|string|max:100|unique:categorias_maquinas,nombre_categoria',
            'tipo_medicion' => ['required', Rule::in(['Kilometraje', 'Horometro', 'N/a'])],
            'horas_mantencion' => 'required|numeric|min:0', // Nuevo campo
        ]);

        $categoria = CategoriaMaquina::create($validated);

        return response()->json([
            'success' => true,
            'data' => $categoria,
            'message' => 'Categoría creada correctamente.',
        ], 201);
    }

    // ✅ Ver una sola categoría
    public function show($id)
    {
        $categoria = CategoriaMaquina::find($id);

        if (!$categoria) {
            return response()->json(['success' => false, 'message' => 'Categoría no encontrada.'], 404);
        }

        return response()->json(['success' => true, 'data' => $categoria]);
    }

    // ✅ Actualizar categoría
    public function update(Request $request, $id)
    {
        $categoria = CategoriaMaquina::find($id);

        if (!$categoria) {
            return response()->json(['success' => false, 'message' => 'Categoría no encontrada.'], 404);
        }

        $validated = $request->validate([
            'nombre_categoria' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categorias_maquinas', 'nombre_categoria')->ignore($categoria->id_categoria, 'id_categoria'),
            ],
            'tipo_medicion' => ['required', Rule::in(['Kilometraje', 'Horometro'])],
        ]);

        $categoria->update($validated);

        return response()->json([
            'success' => true,
            'data' => $categoria,
            'message' => 'Categoría actualizada correctamente.',
        ]);
    }

    // ✅ Eliminar categoría
    public function destroy($id)
    {
        $categoria = CategoriaMaquina::find($id);

        if (!$categoria) {
            return response()->json(['success' => false, 'message' => 'Categoría no encontrada.'], 404);
        }

        $categoria->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada correctamente.',
        ]);
    }
}
