<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Trasvasije;
use App\Models\Estanque;

class TrasvasijeDestino extends Model
{
    protected $table = 'trasvasije_destinos';
    protected $primaryKey = 'id_trasvasije_destino';

    protected $fillable = [
        'id_trasvasije',
        'id_estanque_destino',
        'litros_hacia_destino',
        'stock_inicial_destino',
        'stock_final_destino',
        'medicion_inicial_destino',
        'medicion_final_destino'
    ];

    protected $casts = [
        'litros_hacia_destino' => 'decimal:2',
        'stock_inicial_destino' => 'decimal:2',
        'stock_final_destino' => 'decimal:2',
        'medicion_inicial_destino' => 'decimal:3',
        'medicion_final_destino' => 'decimal:3'
    ];

    // Relaciones
    public function trasvasije(): BelongsTo
    {
        return $this->belongsTo(Trasvasije::class, 'id_trasvasije');
    }

    public function estanqueDestino(): BelongsTo
    {
        return $this->belongsTo(Estanque::class, 'id_estanque_destino');
    }
}
