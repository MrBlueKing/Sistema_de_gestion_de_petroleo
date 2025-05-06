<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Faena;
use App\Models\SolicitanteFaena;

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

    public function faenasDisponibles($idSolicitante)
    {
        // Obtener los ID de faenas que YA están asignadas al solicitante
        $faenasAsignadas = SolicitanteFaena::where('id_dotacion', $idSolicitante)->pluck('id_faena')->toArray();
    
        // Obtener todas las faenas que NO estén en la lista de asignadas
        $faenasDisponibles = Faena::whereNotIn('id_faena', $faenasAsignadas)->get();
    
        return response()->json([
            'success' => true,
            'data' => $faenasDisponibles,
        ]);
    }

    
    public function getPermisosFaenas(Request $request)
    {
        try {
            // Validar parámetros de entrada
            $request->validate([
                'id_dotacion' => 'required|integer',
            ]);

            $idSolicitante = $request->input('id_dotacion');

            // Obtener las faenas asignadas al solicitante
            $faenasAsignadas = SolicitanteFaena::where('id_dotacion', $idSolicitante)->get();

            // Obtener información detallada de cada faena
            $permisos = [];
            foreach ($faenasAsignadas as $permiso) {
                $faena = Faena::find($permiso->id_faena);
                
                $permisos[] = [
                    'id_permiso' => $permiso->id,
                    'id_faena' => $permiso->id_faena,
                    'id_dotacion' => $permiso->id_dotacion,
                    'faena' => $faena ? [
                        'id_faena' => $faena->id_faena, 
                        'ubicacion' => $faena->ubicacion,
                        // Otros campos de faena que quieras incluir
                    ] : null,
                    'fecha_asignacion' => $permiso->created_at,
                ];
            }

            return response()->json([
                'success' => true,
                'permisos' => $permisos
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener permisos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar si un solicitante tiene permiso para una faena específica
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verificarPermiso(Request $request)
    {
        try {
            // Validar parámetros de entrada
            $request->validate([
                'id_dotacion' => 'required|integer',
                'id_faena' => 'required|integer',
            ]);

            $idSolicitante = $request->input('id_dotacion');
            $idFaena = $request->input('id_faena');

            // Verificar si el permiso existe
            $permiso = SolicitanteFaena::where('id_dotacion', $idSolicitante)
                ->where('id_faena', $idFaena)
                ->first();

            return response()->json([
                'success' => true,
                'existe' => $permiso ? true : false,
                'permiso' => $permiso
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener las faenas disponibles para un solicitante (faenas donde no tiene permiso)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFaenasDisponibles(Request $request)
    {
        try {
            // Validar parámetros de entrada
            $request->validate([
                'id_dotacion' => 'required|integer',
            ]);

            $idSolicitante = $request->input('id_dotacion');

            // Obtener IDs de faenas donde el solicitante ya tiene permiso
            $faenasAsignadas = SolicitanteFaena::where('id_dotacion', $idSolicitante)
                ->pluck('id_faena')
                ->toArray();

            // Obtener todas las faenas disponibles (excluyendo las ya asignadas)
            $faenasDisponibles = Faena::whereNotIn('id_faena', $faenasAsignadas)->get();

            return response()->json([
                'success' => true,
                'faenas_disponibles' => $faenasDisponibles
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener faenas disponibles: ' . $e->getMessage()
            ], 500);
        }
    }
}
