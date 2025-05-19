<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Esta línea es la que falta

class DatabaseCheckController extends Controller
{
    public function check(): JsonResponse
    {
        $mainError = null;
        $bodegaError = null;

        try {
            DB::connection()->getPdo();
            $main = true;
        } catch (\Exception $e) {
            $main = false;
            $mainError = $e->getMessage();
        }

        try {
            // Vamos a intentar configuración explícita para bodega
            $conn = DB::connection('bodega');
            // Obtener y mostrar la configuración que está usando
            $config = $conn->getConfig();
            $username = $config['username'];

            $conn->getPdo();
            $bodega = true;
        } catch (\Exception $e) {
            $bodega = false;
            $bodegaError = $e->getMessage();
        }

        return response()->json([
            'gestion_petroleo' => $main,
            'gestion_petroleo_error' => $mainError,
            'bodega' => $bodega,
            'bodega_error' => $bodegaError,
            'bodega_config_username' => $username ?? 'No disponible',
        ]);
    }
}
