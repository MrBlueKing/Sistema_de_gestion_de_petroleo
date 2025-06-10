<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\User;
use App\Models\Estanque;
use App\Models\Faena;
use App\Models\TrasvasijeDestino;

class Trasvasije extends Model
{
    protected $table = 'trasvasijes';
    protected $primaryKey = 'id_trasvasije';

    protected $fillable = [
        'id_usuario',
        'id_estanque_origen',
        'fecha_trasvasije',
        'litros_total_trasvasije',
        'stock_inicial_origen',
        'stock_final_origen',
        'medicion_inicial_origen',
        'medicion_final_origen',
        'observaciones',
        'id_faena'
    ];

    protected $casts = [
        'fecha_trasvasije' => 'datetime',
        'litros_total_trasvasije' => 'decimal:2',
        'stock_inicial_origen' => 'decimal:2',
        'stock_final_origen' => 'decimal:2',
        'medicion_inicial_origen' => 'decimal:3',
        'medicion_final_origen' => 'decimal:3'
    ];

    // Relaciones
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    public function estanqueOrigen(): BelongsTo
    {
        return $this->belongsTo(Estanque::class, 'id_estanque_origen');
    }

    public function faena(): BelongsTo
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }

    public function destinos(): HasMany
    {
        return $this->hasMany(TrasvasijeDestino::class, 'id_trasvasije');
    }
}
