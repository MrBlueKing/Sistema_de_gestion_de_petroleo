<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PersonalInternoPublicoController extends Controller
{
    /**
     * Verificar API Key para sistemas internos
     */
    private function verificarApiKey(Request $request): bool
    {
        $apiKey = $request->header('X-API-Key');
        $apiKeyValida = env('API_KEY_SISTEMAS_INTERNOS');

        return $apiKey && $apiKey === $apiKeyValida;
    }

    /**
     * Obtener todo el personal interno disponible
     * Endpoint para ser consumido por el Sistema de Producción
     * Requiere API Key en header X-API-Key
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPersonalInterno(Request $request)
    {
        // Verificar API Key
        if (!$this->verificarApiKey($request)) {
            return response()->json([
                'status' => 'error',
                'message' => 'API Key inválida o no proporcionada'
            ], 401);
        }

        try {
            // Filtro opcional por faena
            $idFaena = $request->query('id_faena');

            $query = DB::table('personal_interno')
                ->leftJoin('solicitantes', 'personal_interno.rut', '=', 'solicitantes.rut')
                ->leftJoin('solicitante_faena', 'solicitantes.id', '=', 'solicitante_faena.id_dotacion')
                ->select(
                    'personal_interno.id_personal_interno',
                    'personal_interno.rut',
                    'personal_interno.nombre',
                    'personal_interno.apellido',
                    'personal_interno.cargo',
                    'personal_interno.ubicacion',
                    'solicitante_faena.id_faena'
                );

            // Si se especifica faena, filtrar
            if ($idFaena) {
                $query->where('solicitante_faena.id_faena', $idFaena);
            }

            $personal = $query->get();

            // Agrupar por persona (puede aparecer en múltiples faenas)
            $personalAgrupado = $personal->groupBy('id_personal_interno')->map(function ($items) {
                $first = $items->first();
                return [
                    'id_personal_interno' => $first->id_personal_interno,
                    'rut' => $first->rut,
                    'nombre' => $first->nombre,
                    'apellido' => $first->apellido,
                    'nombre_completo' => trim($first->nombre . ' ' . ($first->apellido ?? '')),
                    'cargo' => $first->cargo,
                    'ubicacion' => $first->ubicacion,
                    'faenas' => $items->pluck('id_faena')->filter()->unique()->values()
                ];
            })->values();

            return response()->json([
                'status' => 'success',
                'data' => $personalAgrupado,
                'total' => $personalAgrupado->count()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al obtener personal interno', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener personal interno',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
