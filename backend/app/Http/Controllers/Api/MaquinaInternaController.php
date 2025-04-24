<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MaquinaInterna;
use Illuminate\Support\Facades\Validator;
use App\Models\Maquinas;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MaquinaInternaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Llegó solicitud a /api/maquinas-internas', $request->all());
    
        $validator = Validator::make($request->all(), [
            'patente' => 'required|string|max:20',
            'categoria' => 'required|integer|exists:categorias_maquinas,id_categoria',
            'nombre_maquina' => 'required|string|max:100',
            'tipo_maquina' => 'required|string|max:50',
        ]);
    
        if ($validator->fails()) {
            Log::error('Errores de validación', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        DB::beginTransaction(); // ← IMPORTANTE
    
        try {
            // Crear la máquina principal
            $maquina = Maquinas::create([
                'id_categoria' => $request->categoria,
                'nombre_maquina' => $request->nombre_maquina,
                'tipo_maquina' => $request->tipo_maquina,
                'estado' => 'Activa', // puedes ajustar el estado si es necesario
                'patente' => $request->patente,
            ]);
    
            // Crear la máquina interna
            $maquinaInterna = MaquinaInterna::create([
                'id_maquina' => $maquina->id_maquina,
                'patente' => $request->patente,
                'nombre' => $request->nombre_maquina,
                'categoria' => $request->categoria,
            ]);

            //permisini godig
    
            DB::commit(); // ← Se ejecuta sólo si todo salió bien
    
            return response()->json([
                'message' => 'Máquina interna registrada exitosamente.',
                'maquina_interna' => $maquinaInterna,
            ], 201);
    
        } catch (\Exception $e) {
            DB::rollBack(); // ← Revertir en caso de error
    
            Log::error('Error al registrar máquina interna', [
                'request_data' => $request->all(),
                'error_message' => $e->getMessage(),
            ]);
    
            return response()->json(['error' => 'Error al registrar: ' . $e->getMessage()], 500);
        }
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
