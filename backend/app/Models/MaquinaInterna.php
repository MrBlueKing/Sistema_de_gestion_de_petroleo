<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaquinaInterna extends Model
{
    protected $table = 'maquinas_internas'; // nombre exacto de la tabla

    protected $fillable = [
        'id_maquina',
        'patente',
        'nombre',
        'categoria',
    ];

    // Si tienes relación con la tabla "maquinarias"
    public function maquinaria()
    {
        return $this->belongsTo(Maquinas::class, 'id_maquina');
    }
}
