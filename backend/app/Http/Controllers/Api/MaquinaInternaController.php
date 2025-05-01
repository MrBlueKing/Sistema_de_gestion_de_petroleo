<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MaquinaInterna;
use App\Models\PermisosMaquinasFaenas;  // Importamos el modelo que hemos corregido
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
        try {
            // Obtener directamente todas las máquinas internas sin relaciones
            $maquinasInternas = MaquinaInterna::all();

            return response()->json([
                'success' => true,
                'data' => $maquinasInternas
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener máquinas internas', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las máquinas internas.'
            ], 500);
        }
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
        // Log inicial para registrar la solicitud entrante
        Log::info('Solicitud recibida en MaquinaInternaController@store', [
            'request_data' => $request->all(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        // Validamos los datos incluyendo la faena
        $validator = Validator::make($request->all(), [
            'patente' => 'required|string|max:20',
            'categoria' => 'required|integer|exists:categorias_maquinas,id_categoria',
            'nombre_maquina' => 'required|string|max:100',
            'tipo_maquina' => 'required|string|max:50',
            'id_faena' => 'required|integer|exists:faenas,id_faena',  // Añadimos esta validación
        ]);

        if ($validator->fails()) {
            Log::error('Errores de validación en MaquinaInternaController@store', [
                'validation_errors' => $validator->errors()->toArray(),
                'request_data' => $request->all()
            ]);
            return response()->json(['errors' => $validator->errors()], 422);
        }

        Log::info('Validación exitosa, iniciando transacción');
        DB::beginTransaction(); // Iniciamos la transacción

        try {
            // Log antes de crear la máquina principal
            Log::debug('Intentando crear máquina principal', [
                'id_categoria' => $request->categoria,
                'nombre_maquina' => $request->nombre_maquina,
                'tipo_maquina' => $request->tipo_maquina,
                'patente' => $request->patente
            ]);

            // Crear la máquina principal
            $maquina = Maquinas::create([
                'id_categoria' => $request->categoria,
                'nombre_maquina' => $request->nombre_maquina,
                'tipo_maquina' => $request->tipo_maquina,
                'estado' => 'Activa',
                'patente' => $request->patente,
            ]);

            // Log después de crear la máquina principal
            Log::debug('Máquina principal creada con éxito', [
                'id_maquina' => $maquina->id_maquina,
                'maquina_data' => $maquina->toArray()
            ]);

            // Log antes de crear la máquina interna
            Log::debug('Intentando crear máquina interna', [
                'id_maquina' => $maquina->id_maquina,
                'patente' => $request->patente,
                'nombre' => $request->nombre_maquina,
                'categoria' => $request->categoria
            ]);

            // Crear la máquina interna
            $maquinaInterna = MaquinaInterna::create([
                'id_maquina' => $maquina->id_maquina,
                'patente' => $request->patente,
                'nombre' => $request->nombre_maquina,
                'categoria' => $request->categoria,
            ]);

            // Log después de crear la máquina interna
            Log::debug('Máquina interna creada con éxito', [
                'id_maquina_interna' => $maquinaInterna->id,
                'maquina_interna_data' => $maquinaInterna->toArray()
            ]);

            // Log antes de crear el permiso
            Log::debug('Intentando crear permiso de máquina-faena', [
                'id_maquina' => $maquina->id_maquina,
                'id_faena' => $request->id_faena
            ]);

            // Registrar permiso para la faena
            $permiso = PermisosMaquinasFaenas::create([
                'id_maquina' => $maquina->id_maquina,
                'id_faena' => $request->id_faena,
            ]);

            // Log después de crear el permiso
            Log::debug('Permiso de máquina-faena creado con éxito', [
                'permiso_data' => $permiso->toArray()
            ]);

            Log::info('Transacción completada con éxito, aplicando commit');
            DB::commit(); // Confirmamos todos los cambios si todo salió bien

            // Log de éxito final
            Log::info('Máquina interna registrada completamente', [
                'id_maquina' => $maquina->id_maquina,
                'id_maquina_interna' => $maquinaInterna->id,
                'id_faena' => $request->id_faena
            ]);

            return response()->json([
                'message' => 'Máquina interna registrada exitosamente.',
                'maquina_interna' => $maquinaInterna,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack(); // Revertimos todos los cambios en caso de error

            // Log detallado del error
            Log::error('Error al registrar máquina interna', [
                'request_data' => $request->all(),
                'error_message' => $e->getMessage(),
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile(),
                'error_trace' => $e->getTraceAsString()
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
