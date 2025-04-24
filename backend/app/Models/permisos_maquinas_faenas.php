<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Maquinas;

class permisos_maquinas_faenas extends Model
{
    protected $table = 'permisos_maquinas_faenas'; // Especifica el nombre de la tabla si es diferente

    // Si tus tablas tienen claves primarias diferentes, puedes especificarlas
    protected $primaryKey = 'id_maquina';

    // Si no quieres que Laravel gestione los timestamps, puedes desactivarlos
    // public $timestamps = false;

    /**
     * Relación con Maquina
     */
    public function maquina()
    {
        return $this->belongsTo(Maquinas::class, 'id_maquina');
    }

    /**
     * Relación con Faena
     */
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }
}
