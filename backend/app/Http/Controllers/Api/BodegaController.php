<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bodega\Personal; // Asegúrate de que la ruta sea correcta

class BodegaController extends Controller
{
    // ✅ Método que devuelve solo el personal con RUT válido
    public function index()
    {
        $personal = Personal::all()->filter(function ($item) {
            return $this->validarRut($item->Rut ?? '');
        })->values(); // Reinicia los índices del array

        return response()->json([
            'data' => $personal
        ]);
    }

    // ✅ Método que devuelve solo maquinarias
    public function obtenerMaquinarias()
    {
        // Suponiendo que las maquinarias tienen 'Cargo' igual o similar a 'vehículo'
        $maquinarias = Personal::where('Cargo', 'like', '%vehículo%')->get();

        return response()->json([
            'success' => true,
            'data' => $maquinarias
        ]);
    }

    // ✅ Función privada para validar el RUT chileno
    private function validarRut($rut)
    {
        $rut = strtoupper(preg_replace('/[^0-9Kk]/', '', $rut));

        if (!preg_match('/^\d{7,8}[0-9Kk]$/', $rut)) {
            return false;
        }

        $cuerpo = substr($rut, 0, -1);
        $dv = substr($rut, -1);

        $suma = 0;
        $multiplo = 2;

        for ($i = strlen($cuerpo) - 1; $i >= 0; $i--) {
            $suma += $cuerpo[$i] * $multiplo;
            $multiplo = $multiplo === 7 ? 2 : $multiplo + 1;
        }

        $resto = 11 - ($suma % 11);
        $dvEsperado = $resto === 11 ? '0' : ($resto === 10 ? 'K' : (string) $resto);

        return $dv === $dvEsperado;
    }
    // ✅ Método que devuelve el personal con RUT inválido
    public function rutInvalidos()
    {
        $personal = Personal::all()->filter(function ($item) {
            return !$this->validarRut($item->Rut ?? '');
        })->values(); // Reinicia los índices del array

        return response()->json([
            'invalidos' => $personal
        ]);
    }

    // ✅ Método que devuelve maquinarias diferenciando el rut por mas de una letra
    public function getMaquinarias()
    {
        // Filtrar las maquinarias donde el campo 'Rut' contiene más de una letra
        // y no solo números ni vacío. Excluye las letras "K" o "k"
        $maquinarias = Personal::where('Rut', 'REGEXP', '^(?=(.*[A-Za-z]))(?!.*[Kk]$).*')->get();
    
        return response()->json([
            'success' => true,
            'data' => $maquinarias
        ]);
    }
    
}
