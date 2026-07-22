<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ActividadFalla extends Model
{
    protected $table = 'actividades_falla';

    protected $fillable = [
        'id_falla',
        'id_mecanico',
        'descripcion',
        'tipo',
        'tiempo_estimado',
        'orden',
        'fecha_inicio_planificada',
        'fecha_inicio_real',
        'tiempo_real',
        'fecha_fin_real',
    ];

    protected $casts = [
        'tiempo_estimado' => 'decimal:2',
        'tiempo_real' => 'decimal:2',
        'fecha_inicio_planificada' => 'date',
        'fecha_inicio_real' => 'date',
        'fecha_fin_real' => 'date',
    ];

    public function falla()
    {
        return $this->belongsTo(Falla::class, 'id_falla', 'id');
    }

    public function mecanico()
    {
        return $this->belongsTo(Mecanico::class, 'id_mecanico', 'id');
    }

    public function difFechaDias(): ?int
    {
        if (!$this->fecha_inicio_real || !$this->fecha_inicio_planificada) {
            return null;
        }

        return Carbon::parse($this->fecha_inicio_planificada)
            ->diffInDays(Carbon::parse($this->fecha_inicio_real), false);
    }

    public function difTiempo(): ?float
    {
        if ($this->tiempo_real === null) {
            return null;
        }

        return round((float) $this->tiempo_real - (float) $this->tiempo_estimado, 2);
    }
}
