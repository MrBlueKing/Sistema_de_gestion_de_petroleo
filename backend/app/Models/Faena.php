<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\permisos_maquinas_faenas;
use App\Models\SolicitanteFaena;
use App\Models\PersonalInterno;
use App\Models\IngresoPetroleo;
use App\Models\User;

class Faena extends Model
{
    protected $primaryKey = 'id_faena';
    protected $table = 'faenas';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'ubicacion', // Según la estructura que compartiste, esto es lo que usas en lugar de 'nombre'
    ];

    public $timestamps = false;

    // Relación con usuarios
    public function usuarios()
    {
        return $this->hasMany(User::class, 'id_faena');
    }

    // Relación con permisos de faena
    public function permisos()
    {
        return $this->hasMany(permisos_maquinas_faenas::class, 'id_faena');
    }

    // Relación con ingresos de petróleo
    public function ingresosPetroleo()
    {
        return $this->hasMany(IngresoPetroleo::class, 'id_faena');
    }

    // Relación con SolicitanteFaena
    public function solicitanteFaenas()
    {
        return $this->hasMany(SolicitanteFaena::class, 'id_faena', 'id_faena');
    }

    // Relación muchos a muchos con Solicitante
    public function solicitantes()
    {
        return $this->belongsToMany(
            Solicitante::class,
            'solicitante_faena',
            'id_faena',     // Clave de la faena en la tabla pivot
            'id_dotacion'   // Clave del solicitante en la tabla pivot
        );
    }
}
