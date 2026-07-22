<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mecanico extends Model
{
    protected $table = 'mecanicos';

    protected $fillable = [
        'nombre',
        'rut',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function actividades()
    {
        return $this->hasMany(ActividadFalla::class, 'id_mecanico', 'id');
    }
}
