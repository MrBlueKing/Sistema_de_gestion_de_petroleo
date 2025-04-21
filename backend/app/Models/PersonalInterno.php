<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Solicitante;

class PersonalInterno extends Model
{
    use HasFactory;

    // Especificar el nombre real de la tabla
    protected $table = 'personal_interno';

    // Clave primaria personalizada
    protected $primaryKey = 'id_personal_interno';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'id_dotacion',
        'nombre',
        'rut',
        'apellido',
        'cargo',
        'ubicacion',
    ];

    public function solicitante()
    {
        return $this->belongsTo(Solicitante::class, 'rut', 'rut');
    }


    // Si quieres desactivar timestamps, descomenta esto:
    // public $timestamps = false;
}
