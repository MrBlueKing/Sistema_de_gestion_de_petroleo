<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Solicitante;
use App\Models\SolicitanteFaena;
use App\Models\Faena;

class PersonalInterno extends Model
{
    use HasFactory;

    // Especificar el nombre real de la tabla
    protected $table = 'personal_interno';

    // Clave primaria personalizada
    protected $primaryKey = 'id_personal_interno';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'nombre',
        'rut',
        'apellido',
        'cargo',
        'ubicacion',
    ];

    // Relación con Solicitante - Un personal interno pertenece a un solicitante
    public function solicitante()
    {
        return $this->belongsTo(Solicitante::class, 'rut', 'rut');
    }
    
    // Método de conveniencia para acceder a las faenas a través del solicitante
    public function faenas()
    {
        return $this->solicitante ? $this->solicitante->faenas() : collect();
    }
}