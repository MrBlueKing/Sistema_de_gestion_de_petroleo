<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bodega\Personal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BodegaController extends Controller
{
    // ✅ Método original - mantener para compatibilidad
    public function getMaquinarias()
    {
        $maquinarias = Personal::where('Rut', 'REGEXP', '[A-Za-z]')
            ->where('Rut', 'NOT REGEXP', '^[0-9]{7,8}-[0-9Kk]$')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $maquinarias
        ]);
    }

    // ✅ NUEVO: Método que muestra TODAS las máquinas con información de normalización
    public function getMaquinariasConVistaPrevia()
    {
        $maquinasBodega = Personal::where('Rut', 'REGEXP', '[A-Za-z]')
            ->where('Rut', 'NOT REGEXP', '^[0-9]{7,8}-[0-9Kk]$')
            ->get();

        // Obtener patentes ya registradas
        $patentesRegistradas = DB::table('maquinas_internas')
            ->pluck('patente')
            ->filter()
            ->toArray();

        // Obtener combinaciones patente+nombre ya registradas
        $combinacionesRegistradas = DB::table('maquinas_internas')
            ->join('maquinas', 'maquinas_internas.id_maquina', '=', 'maquinas.id_maquina')
            ->get(['maquinas.nombre_maquina'])
            ->map(function ($item) {
                return strtolower(trim($item->nombre_maquina));
            })
            ->toArray();
        Log::info('maquinas', $combinacionesRegistradas );    
        $maquinasConInfo = $maquinasBodega->map(function ($maquina) use ($patentesRegistradas, $combinacionesRegistradas, $maquinasBodega) {

            $patenteOriginal = $maquina->Rut;
            $nombreMaquina = $maquina->Nombre;

            // Verificar si esta combinación específica ya está registrada
            $combinacionActual = strtolower(trim($nombreMaquina));
             Log::info('maquinas bodega', $combinacionesRegistradas );    
            $yaRegistradaEspecifica = in_array($combinacionActual, $combinacionesRegistradas);

            // Si ya está registrada esta máquina específica, no mostrarla
            if ($yaRegistradaEspecifica) {
                return null;
            }

            // Generar la patente que se usaría en el registro
            $patenteQueSeUsara = $this->generarPatenteUnica($patenteOriginal, $patentesRegistradas);

            // Contar cuántas máquinas hay con esta patente en bodega
            $maquinasConMismaPatente = $maquinasBodega->where('Rut', $patenteOriginal)->count();

            return [
                'Id_Personal' => $maquina->Id_Personal,
                'Rut' => $patenteOriginal,
                'Nombre' => $nombreMaquina,
                'Cargo' => $maquina->Cargo,
                'patente_que_se_usara' => $patenteQueSeUsara,
                'es_patente_normalizada' => $patenteOriginal !== $patenteQueSeUsara,
                'maquinas_con_misma_patente' => $maquinasConMismaPatente,
                'info_display' => $patenteOriginal !== $patenteQueSeUsara
                    ? "Se registrará como: $patenteQueSeUsara"
                    : "Patente disponible"
            ];
        })->filter(); // Eliminar nulls

        return response()->json([
            'success' => true,
            'data' => $maquinasConInfo->values(),
            'debug' => [
                'total_disponibles' => $maquinasConInfo->count(),
                'patentes_que_seran_normalizadas' => $maquinasConInfo->where('es_patente_normalizada', true)->count()
            ]
        ]);
    }

    /**
     * ✅ Genera una patente única agregando sufijos cuando hay duplicados
     */
    private function generarPatenteUnica($patenteOriginal, $patentesRegistradas)
    {
        // Si la patente original no está registrada, usarla tal como está
        if (!in_array($patenteOriginal, $patentesRegistradas)) {
            return $patenteOriginal;
        }

        // Si está duplicada, generar variaciones con sufijos
        $contador = 1;
        do {
            $patenteNueva = $patenteOriginal . "-" . str_pad($contador, 2, '0', STR_PAD_LEFT);
            $contador++;
        } while (in_array($patenteNueva, $patentesRegistradas) && $contador <= 99);

        return $patenteNueva;
    }

    // ... resto de métodos existentes (index, rutInvalidos, etc.) ...

    public function index()
    {
        $personal = Personal::all()->filter(function ($item) {
            return $this->validarRut($item->Rut ?? '');
        })->values();

        return response()->json([
            'data' => $personal
        ]);
    }

    public function obtenerMaquinarias()
    {
        $maquinarias = Personal::where('Cargo', 'like', '%vehículo%')->get();

        return response()->json([
            'success' => true,
            'data' => $maquinarias
        ]);
    }

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

    public function rutInvalidos()
    {
        $personal = Personal::all()->filter(function ($item) {
            return !$this->validarRut($item->Rut ?? '');
        })->values();

        return response()->json([
            'invalidos' => $personal
        ]);
    }
}
