<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Faena;
use App\Models\Planta;
use App\Models\Tonelaje;

class Padron extends Model
{
    protected $table = 'padrones';
    protected $primaryKey = 'id_padron';

    protected $fillable = [
        'id_faena',
        'id_planta',
        'nombre',
        'empresa',
        'capacidad'
    ];

    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    public function planta()
    {
        return $this->belongsTo(Planta::class, 'id_planta', 'id_planta');
    }

    public function tonelajes()
    {
        return $this->hasMany(Tonelaje::class, 'id_padron', 'id_padron');
    }

    // Scope para obtener padrones sin registros en una fecha
    public function scopeSinRegistrosEn($query, $fecha)
    {
        return $query->whereDoesntHave('tonelajes', function ($q) use ($fecha) {
            $q->where('fecha_produccion', $fecha);
        });
    }
}
