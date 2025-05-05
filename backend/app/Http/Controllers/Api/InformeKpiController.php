<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InformeKpi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InformeKpiController extends Controller
{
    // Listar todos los informes
    public function index()
    {
        $informes = InformeKpi::with(['usuario', 'faena', 'valoresEntrada', 'resultados'])->get();
        return response()->json($informes, 200);
    }

    // Guardar un nuevo informe
    public function store(Request $request)
    {
        Log::info('Iniciando INFORME', ['data_recibida' => $request->all()]);
        $validated = $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'id_faena' => 'required|exists:faenas,id_faena',
            'periodo' => 'required|string|max:255',
            'fecha_inicio_periodo' => 'required|date',
            'fecha_fin_periodo' => 'required|date|after_or_equal:fecha_inicio_periodo',
            'titulo' => 'required|string|max:255',
            'observaciones' => 'nullable|string',
        ]);

        $informe = InformeKpi::create($validated);

        return response()->json([
            'message' => 'Informe KPI creado exitosamente.',
            'data' => $informe,
        ], 201);
    }

    // Mostrar un informe específico
    public function show($id)
    {
        $informe = InformeKpi::with(['usuario', 'faena', 'valoresEntrada', 'resultados'])->find($id);

        if (!$informe) {
            return response()->json(['message' => 'Informe no encontrado.'], 404);
        }

        return response()->json($informe, 200);
    }

    // Actualizar un informe
    public function update(Request $request, $id)
    {
        $informe = InformeKpi::find($id);

        if (!$informe) {
            return response()->json(['message' => 'Informe no encontrado.'], 404);
        }

        $validated = $request->validate([
            'id_usuario' => 'sometimes|exists:users,id',
            'id_faena' => 'sometimes|exists:faenas,id',
            'periodo' => 'sometimes|string|max:255',
            'fecha_inicio_periodo' => 'sometimes|date',
            'fecha_fin_periodo' => 'sometimes|date|after_or_equal:fecha_inicio_periodo',
            'titulo' => 'sometimes|string|max:255',
            'observaciones' => 'nullable|string',
        ]);

        $informe->update($validated);

        return response()->json([
            'message' => 'Informe KPI actualizado exitosamente.',
            'data' => $informe,
        ], 200);
    }

    // Eliminar un informe
    public function destroy($id)
    {
        $informe = InformeKpi::find($id);

        if (!$informe) {
            return response()->json(['message' => 'Informe no encontrado.'], 404);
        }

        $informe->delete();

        return response()->json(['message' => 'Informe eliminado exitosamente.'], 200);
    }
}
