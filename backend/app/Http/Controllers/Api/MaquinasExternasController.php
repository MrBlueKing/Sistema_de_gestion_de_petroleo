<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Maquinas;
use App\Models\MaquinaExterna;
use Illuminate\Http\Request;

class MaquinasExternasController extends Controller
{
    /**
     * Obtener máquinas externas disponibles
     */
    public function index(Request $request)
    {
        try {
            // Obtener todas las máquinas externas con sus relaciones
            $maquinasExternas = Maquinas::with([
                'categoria:id_categoria,nombre_categoria,tipo_medicion',
                'maquinasExternas.empresaExterna:id_empresa,nombre'
            ])
            ->where('tipo_maquina', 'Externo')
            ->where('estado', 'operativo')
            ->get();

            // Formatear los datos para el frontend
            $maquinasFormateadas = $maquinasExternas->map(function ($maquina) {
                $maquinaExterna = $maquina->maquinasExternas->first();
                
                return [
                    'id_maquina' => $maquina->id_maquina,
                    'nombre_maquina' => $maquina->nombre_maquina,
                    'patente' => $maquina->patente,
                    'id_categoria' => $maquina->id_categoria,
                    'categoria' => $maquina->categoria?->nombre_categoria,
                    'tipo_medicion' => $maquina->categoria?->tipo_medicion,
                    'estado' => $maquina->estado,
                    'empresa' => $maquinaExterna?->empresaExterna?->nombre,
                    'nombre_contacto' => $maquinaExterna?->nombre_contacto,
                    'tipo_maquina' => 'Externo'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $maquinasFormateadas,
                'message' => 'Máquinas externas obtenidas exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las máquinas externas: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Obtener máquinas externas por categoría
     */
    public function porCategoria(Request $request, $idCategoria)
    {
        try {
            $maquinasExternas = Maquinas::with([
                'categoria:id_categoria,nombre_categoria,tipo_medicion',
                'maquinasExternas.empresaExterna:id_empresa,nombre'
            ])
            ->where('tipo_maquina', 'Externo')
            ->where('estado', 'operativo')
            ->where('id_categoria', $idCategoria)
            ->get();

            $maquinasFormateadas = $maquinasExternas->map(function ($maquina) {
                $maquinaExterna = $maquina->maquinasExternas->first();
                
                return [
                    'id_maquina' => $maquina->id_maquina,
                    'nombre_maquina' => $maquina->nombre_maquina,
                    'patente' => $maquina->patente,
                    'id_categoria' => $maquina->id_categoria,
                    'categoria' => $maquina->categoria?->nombre_categoria,
                    'tipo_medicion' => $maquina->categoria?->tipo_medicion,
                    'estado' => $maquina->estado,
                    'empresa' => $maquinaExterna?->empresaExterna?->nombre,
                    'nombre_contacto' => $maquinaExterna?->nombre_contacto,
                    'tipo_maquina' => 'Externo'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $maquinasFormateadas,
                'message' => "Máquinas externas de la categoría {$idCategoria} obtenidas exitosamente"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las máquinas externas por categoría: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}