<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Tonelaje;

class TonelajeHistorial extends Model
{
    protected $table = 'tonelajes_historial';

    protected $fillable = [
        'id_tonelaje',
        'tonelaje_anterior',
        'ley_anterior',
        'viajes_anterior',
        'tonelaje_nuevo',
        'ley_nueva',
        'viajes_nuevo',
        'motivo',
        'accion',
        'fecha_cambio'
    ];

    protected $casts = [
        'tonelaje_anterior' => 'decimal:2',
        'ley_anterior' => 'decimal:2',
        'tonelaje_nuevo' => 'decimal:2',
        'ley_nueva' => 'decimal:2',
        'viajes_anterior' => 'integer',
        'viajes_nuevo' => 'integer',
        'fecha_cambio' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Relación con Tonelaje
     */
    public function tonelaje()
    {
        return $this->belongsTo(Tonelaje::class, 'id_tonelaje', 'id_tonelaje');
    }
}
