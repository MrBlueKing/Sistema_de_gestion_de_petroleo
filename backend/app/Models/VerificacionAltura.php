<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerificacionAltura extends Model
{
    use HasFactory;

    protected $table = 'verificacion_altura'; // nombre real de la tabla (no plural)

    protected $primaryKey = 'id_verificacion'; // clave primaria personalizada

    public $timestamps = true; // created_at y updated_at activos

    protected $fillable = [
        'id_ingreso',
        'id_estanque',
        'altura_medicion',
        'volumen_calculado',
        'verificado',
    ];

    /**
     * Relaciones
     */

    // Cada verificación pertenece a un ingreso de petróleo
    public function ingreso()
    {
        return $this->belongsTo(IngresoPetroleo::class, 'id_ingreso', 'id_ingreso');
    }

    // Cada verificación pertenece a un estanque
    public function estanque()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque', 'id_estanque');
    }
}
