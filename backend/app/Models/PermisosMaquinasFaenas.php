<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Maquinas;
use App\Models\Faena;

class PermisosMaquinasFaenas extends Model
{
    // El nombre de la tabla (si es diferente al nombre del modelo en plural)
    protected $table = 'permisos_maquinas_faenas';
    
    // Esta tabla tiene clave primaria compuesta, desactivamos incrementing
    public $incrementing = false;
    
    // Desactivamos timestamps (created_at y updated_at)
    public $timestamps = false;
    
    // Campos que se pueden asignar masivamente (para create() y update())
    protected $fillable = [
        'id_maquina',
        'id_faena'
    ];
    
    /**
     * Relación con la tabla Maquinas
     */
    public function maquina()
    {
        return $this->belongsTo(Maquinas::class, 'id_maquina');
    }
    
    /**
     * Relación con la tabla Faenas
     */
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }
}