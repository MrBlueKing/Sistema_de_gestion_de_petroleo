<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consumo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ConsumoPublicoController extends Controller
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
     * Total de litros consumidos por faena en un rango de fechas.
     * Endpoint para ser consumido por el Sistema de Producción (KPIs de eficiencia
     * del Dashboard Gerencial). Requiere API Key en header X-API-Key.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function litrosDisponibles(Request $request)
    {
        if (!$this->verificarApiKey($request)) {
            return response()->json([
                'status' => 'error',
                'message' => 'API Key inválida o no proporcionada'
            ], 401);
        }

        try {
            $idFaena = $request->query('id_faena');
            $fechaDesde = $request->query('fecha_desde');
            $fechaHasta = $request->query('fecha_hasta');
            $categorias = $request->query('categorias');

            $query = Consumo::query();

            if ($idFaena) {
                $query->porFaena($idFaena);
            }

            if ($fechaDesde && $fechaHasta) {
                $query->whereBetween('fecha_consumo', [$fechaDesde, $fechaHasta . ' 23:59:59']);
            }

            // Filtro opcional por categoría de máquina (ej: "Pala,Excavadora"), para
            // que el Sistema de Producción pueda pedir el consumo de un subconjunto
            // de equipos (ej: solo perforación, o solo equipos que mueven tonelaje).
            if ($categorias) {
                $categorias = array_filter(array_map('trim', explode(',', $categorias)));
                $query->whereHas('equipo.categoria', function ($q) use ($categorias) {
                    $q->whereIn('nombre_categoria', $categorias);
                });
            }

            $litros = $query->sum('litros_consumidos');

            return response()->json([
                'status' => 'success',
                'litros_consumidos' => round((float) $litros, 2),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener litros consumidos (público)', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener litros consumidos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
