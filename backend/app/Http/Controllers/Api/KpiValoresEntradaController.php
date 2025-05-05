<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KpiValoresEntrada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KpiValoresEntradaController extends Controller
{
    // GET /api/kpi-valores-entrada
    public function index()
    {
        return response()->json(KpiValoresEntrada::all());
    }

    // POST /api/kpi-valores-entrada
    public function store(Request $request)
    {
        Log::info('Iniciando VALO ENTRADA', ['data_recibida' => $request->all()]);

        $validated = $request->validate([
            'id_informe' => 'required|integer|exists:informes_kpi,id_informe',
            'ley_mineral' => 'required|numeric',
            'toneladas_extraidas' => 'required|numeric',
            'horas_trabajadas' => 'required|numeric',
            'combustible_consumido' => 'required|numeric',
            'kilometros_recorridos' => 'required|numeric',
            'numero_viajes' => 'required|integer',
            'rendimiento_base' => 'required|numeric',
            'precio_combustible' => 'required|numeric',
            
        ]);

        $valoresEntrada = KpiValoresEntrada::create($validated);

        return response()->json($valoresEntrada, 201);
    }

    // GET /api/kpi-valores-entrada/{id}
    public function show($id)
    {
        $valoresEntrada = KpiValoresEntrada::findOrFail($id);
        return response()->json($valoresEntrada);
    }

    // PUT/PATCH /api/kpi-valores-entrada/{id}
    public function update(Request $request, $id)
    {
        $valoresEntrada = KpiValoresEntrada::findOrFail($id);

        $validated = $request->validate([
            'ley_mineral' => 'sometimes|numeric',
            'toneladas_extraidas' => 'sometimes|numeric',
            'horas_trabajadas' => 'sometimes|numeric',
            'combustible_consumido' => 'sometimes|numeric',
            'kilometros_recorridos' => 'sometimes|numeric',
            'numero_viajes' => 'sometimes|integer',
            'rendimiento_base' => 'sometimes|numeric',
            'precio_combustible' => 'sometimes|numeric',
        ]);

        $valoresEntrada->update($validated);

        return response()->json($valoresEntrada);
    }

    // DELETE /api/kpi-valores-entrada/{id}
    public function destroy($id)
    {
        $valoresEntrada = KpiValoresEntrada::findOrFail($id);
        $valoresEntrada->delete();

        return response()->json(['message' => 'Registro eliminado correctamente']);
    }
}
