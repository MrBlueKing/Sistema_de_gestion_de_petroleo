<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalExterno;
use Illuminate\Http\Request;

class PersonalExternoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validar campos obligatorios y formato
        $request->validate([
            'nombre' => 'required|string|max:255',
            'rut' => 'required|string|max:12|unique:personal_externo',
            'id_empresa' => 'required|exists:empresas_externas,id_empresa',
        ]);
    
        // Crear el nuevo registro de personal externo
        $personal = PersonalExterno::create([
            'nombre' => $request->input('nombre'),
            'rut' => $request->input('rut'),
            'id_empresa' => $request->input('id_empresa'),
        ]);
    
        return response()->json([
            'success' => true,
            'message' => 'Personal externo registrado correctamente.',
            'data' => $personal
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
