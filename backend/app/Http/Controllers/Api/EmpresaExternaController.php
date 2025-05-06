<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmpresaExterna;
use Illuminate\Http\Request;

class EmpresaExternaController extends Controller
{
    public function index()
    {
        return EmpresaExterna::all();
    }

    public function store(Request $request)

    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'rut' => 'nullable|string|max:12|unique:empresas_externas',
            'contacto' => 'nullable|string|max:150',
        ]);
        
        $empresa = EmpresaExterna::create($request->all());

        return response()->json($empresa, 201);
    }

    public function show($id)
    {
        $empresa = EmpresaExterna::findOrFail($id);
        return response()->json($empresa);
    }

    public function update(Request $request, $id)
    {
        $empresa = EmpresaExterna::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:255',
            'rut' => 'nullable|string|max:12|unique:empresas_externas,rut,' . $empresa->id_empresa . ',id_empresa',
            'contacto' => 'nullable|string|max:150',
        ]);

        $empresa->update($request->all());

        return response()->json($empresa);
    }

    public function destroy($id)
    {
        EmpresaExterna::destroy($id);
        return response()->json(null, 204);
    }
}
