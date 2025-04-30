<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\PersonalInterno;

class Solicitante extends Model
{
    use HasFactory;

    // Tabla asociada
    protected $table = 'solicitantes';

    // Clave primaria
    protected $primaryKey = 'id';

    // Los campos que se pueden asignar masivamente
    protected $fillable = ['rut', 'tipo_personal'];

    // Relación con personal interno - Un solicitante puede tener un personal interno
    public function personalInterno()
    {
        return $this->hasOne(PersonalInterno::class, 'rut', 'rut');
    }
    
    // Relación con SolicitanteFaena - Un solicitante puede estar en múltiples SolicitanteFaena
    public function solicitanteFaenas()
    {
        return $this->hasMany(SolicitanteFaena::class, 'id_dotacion', 'id');
    }
    
    // Relación muchos a muchos con Faena a través de SolicitanteFaena
    public function faenas()
    {
        return $this->belongsToMany(
            Faena::class,
            'solicitante_faena',
            'id_dotacion',  // Clave del solicitante en la tabla pivot
            'id_faena'      // Clave de la faena en la tabla pivot
        );
    }
}
