<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Padron;
use App\Models\TonelajeHistorial;

class Tonelaje extends Model
{
    protected $table = 'tonelajes';
    protected $primaryKey = 'id_tonelaje';

    protected $fillable = [
        'id_padron',
        'fecha_produccion',
        'tonelaje',
        'ley',
        'viajes',
        'fue_modificado',
        'fecha_modificacion'
    ];

    protected $casts = [
        'tonelaje' => 'decimal:2',
        'ley' => 'decimal:2',
        'viajes' => 'integer',
        'fue_modificado' => 'boolean',
        'fecha_produccion' => 'date',
        'fecha_modificacion' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Relación con Padrón
     */
    public function padron()
    {
        return $this->belongsTo(Padron::class, 'id_padron', 'id_padron');
    }

    /**
     * Relación con Historial
     */
    public function historial()
    {
        return $this->hasMany(TonelajeHistorial::class, 'id_tonelaje', 'id_tonelaje')
                    ->orderBy('fecha_cambio', 'desc');
    }

    /**
     * Verificar si puede ser editado
     */
    public function puedeEditar()
    {
        return !$this->fue_modificado;
    }

    /**
     * Registrar historial de cambios
     */
    public function registrarHistorial($valoresAnteriores, $valoresNuevos, $motivo, $accion = 'modificacion')
    {
        return TonelajeHistorial::create([
            'id_tonelaje' => $this->id_tonelaje,
            'tonelaje_anterior' => $valoresAnteriores['tonelaje'] ?? null,
            'ley_anterior' => $valoresAnteriores['ley'] ?? null,
            'viajes_anterior' => $valoresAnteriores['viajes'] ?? null,
            'tonelaje_nuevo' => $valoresNuevos['tonelaje'],
            'ley_nueva' => $valoresNuevos['ley'],
            'viajes_nuevo' => $valoresNuevos['viajes'],
            'motivo' => $motivo,
            'accion' => $accion,
            'fecha_cambio' => now()
        ]);
    }
}
