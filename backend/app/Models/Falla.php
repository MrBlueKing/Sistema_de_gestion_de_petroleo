<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Falla extends Model
{
    protected $table = 'fallas';

    protected $fillable = [
        'id_maquina',
        'horometro',
        'fecha',
        'descripcion',
        'estado',
        'fecha_cierre',
        'observaciones_finales',
        'creado_por',
    ];

    protected $casts = [
        'horometro' => 'decimal:2',
        'fecha' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function maquina()
    {
        return $this->belongsTo(Maquinas::class, 'id_maquina', 'id_maquina');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function actividades()
    {
        return $this->hasMany(ActividadFalla::class, 'id_falla', 'id')->orderBy('orden');
    }

    /**
     * Totales de la falla: tiempo se suma directo por actividad,
     * fecha se compara de punta a punta (inicio del plan vs fin real),
     * no sumando los desfases de cada fila.
     */
    public function resumen(): array
    {
        $actividades = $this->actividades;

        $tiempoTotalEstimado = (float) $actividades->sum('tiempo_estimado');
        $tiempoTotalReal = (float) $actividades->sum('tiempo_real');
        $difTiempoTotal = $tiempoTotalReal - $tiempoTotalEstimado;

        $primera = $actividades->sortBy('orden')->first();
        $ultima = $actividades->sortByDesc('orden')->first();

        $fechaTerminoPlanificada = $primera
            ? $this->sumarDias(Carbon::parse($primera->fecha_inicio_planificada), $tiempoTotalEstimado)
            : null;

        $fechaTerminoReal = null;
        if ($ultima && $ultima->fecha_inicio_real && $ultima->tiempo_real !== null) {
            $fechaTerminoReal = $this->sumarDias(Carbon::parse($ultima->fecha_inicio_real), (float) $ultima->tiempo_real);
        }

        $difFechaTotal = ($fechaTerminoReal && $fechaTerminoPlanificada)
            ? $fechaTerminoPlanificada->diffInDays($fechaTerminoReal, false)
            : null;

        return [
            'tiempo_total_estimado' => round($tiempoTotalEstimado, 2),
            'tiempo_total_real' => round($tiempoTotalReal, 2),
            'dif_tiempo_total' => round($difTiempoTotal, 2),
            'fecha_termino_planificada' => $fechaTerminoPlanificada?->format('Y-m-d'),
            'fecha_termino_real' => $fechaTerminoReal?->format('Y-m-d'),
            'dif_fecha_total' => $difFechaTotal,
        ];
    }

    private function sumarDias(Carbon $fecha, float $dias): Carbon
    {
        return $fecha->copy()->addMinutes((int) round($dias * 24 * 60));
    }
}
