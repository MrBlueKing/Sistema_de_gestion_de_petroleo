<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bodega\Personal; // Asegúrate de que la ruta sea correcta

class BodegaController extends Controller
{
    // ✅ Este método devuelve todo el personal (personas y maquinarias mezcladas)
    public function index()
    {
        $personal = Personal::all();

        return response()->json([
            'data' => $personal
        ]);
    }

    // ✅ Este método devuelve solo las maquinarias
    public function obtenerMaquinarias()
    {
        // Suponiendo que las maquinarias tienen "Cargo" igual a "Vehículo" o algo parecido
        $maquinarias = Personal::where('Cargo', 'like', '%vehículo%')->get();

        return response()->json([
            'success' => true,
            'data' => $maquinarias
        ]);
    }
}
