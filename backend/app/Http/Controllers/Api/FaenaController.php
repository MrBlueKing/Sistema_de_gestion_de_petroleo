<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Faena;

class FaenaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Faena::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create($id)
    {
        $faena = Faena::find($id); // Buscar por ID
        if ($faena) {
            return response()->json($faena);
        } else {
            return response()->json(['message' => 'Faena no encontrada'], 404);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'ubicacion' => 'required|string|max:255',
            'detalle' => 'nullable|string',
            'fecha_creacion' => 'nullable|date',
        ]);

        $faena = Faena::create([
            'ubicacion' => $request->ubicacion,
            'detalle' => $request->detalle,
            'fecha_creacion' => $request->fecha_creacion ?? now(),
        ]);

        return response()->json($faena, 201); // Retorna la faena recién creada
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $faena = Faena::find($id);
        if (!$faena) {
            return response()->json(['message' => 'Faena no encontrada'], 404);
        }

        $request->validate([
            'ubicacion' => 'required|string|max:255',
            'detalle' => 'nullable|string',
            'fecha_creacion' => 'nullable|date',
        ]);

        $faena->update([
            'ubicacion' => $request->ubicacion,
            'detalle' => $request->detalle,
            'fecha_creacion' => $request->fecha_creacion ?? now(),
        ]);

        return response()->json($faena);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $faena = Faena::find($id);
        if (!$faena) {
            return response()->json(['message' => 'Faena no encontrada'], 404);
        }

        $faena->delete(); // Elimina la faena

        return response()->json(['message' => 'Faena eliminada']);
    }
}
