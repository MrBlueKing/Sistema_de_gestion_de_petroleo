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

    // Clave primaria (si no es el ID autoincremental por defecto)
    protected $primaryKey = 'id'; // Esto ya está configurado por defecto, solo es para claridad.

    // Los campos que se pueden asignar masivamente
    protected $fillable = ['rut', 'tipo_personal'];

    // Relación con solicitantes internos
    public function personalInterno()
    {
        return $this->hasOne(PersonalInterno::class, 'rut', 'rut');
    }    

    // Relación con solicitantes externos
    //public function solicitanteExterno()
    //{
    //    return $this->hasOne(SolicitanteExterno::class, 'id_dotacion');
    //}
}
