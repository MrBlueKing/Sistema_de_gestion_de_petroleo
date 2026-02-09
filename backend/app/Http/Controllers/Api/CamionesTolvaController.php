<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CamionesTolvaController extends Controller
{
    /**
     * Obtener todos los camiones tolva (categoría 7) disponibles
     * Endpoint público para ser consumido por otros sistemas
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCamionesTolva(Request $request)
    {
        try {
            // Obtener TODOS los camiones de categoría 7 (Tolva) - internos y externos
            $camiones = DB::table('maquinas')
                ->where('id_categoria', 7)
                ->select(
                    'id_maquina',
                    'nombre_maquina',
                    'patente',
                    'id_categoria',
                    'tipo_maquina'
                )
                ->get();

            // También obtener información de la categoría
            $categoria = DB::table('categorias_maquinas')
                ->where('id_categoria', 7)
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => $camiones,
                'total' => $camiones->count(),
                'categoria' => [
                    'id' => $categoria->id_categoria ?? 7,
                    'nombre' => $categoria->nombre_categoria ?? 'Tolva'
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al obtener camiones tolva', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener camiones tolva',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los dumpers disponibles
     * Endpoint público para ser consumido por otros sistemas
     */
    public function getDumpers(Request $request)
    {
        try {
            // Buscar la categoría Dumper
            $categoria = DB::table('categorias_maquinas')
                ->where('nombre_categoria', 'Dumper')
                ->first();

            if (!$categoria) {
                return response()->json([
                    'status' => 'success',
                    'data' => [],
                    'total' => 0,
                    'mensaje' => 'No existe la categoría Dumper'
                ], 200);
            }

            // Obtener todos los dumpers
            $dumpers = DB::table('maquinas')
                ->where('id_categoria', $categoria->id_categoria)
                ->select(
                    'id_maquina',
                    'nombre_maquina',
                    'patente',
                    'id_categoria',
                    'tipo_maquina'
                )
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $dumpers,
                'total' => $dumpers->count(),
                'categoria' => [
                    'id' => $categoria->id_categoria,
                    'nombre' => $categoria->nombre_categoria
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al obtener dumpers', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener dumpers',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
