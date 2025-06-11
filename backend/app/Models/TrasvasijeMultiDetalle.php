<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrasvasijeMultiDetalle extends Model
{
 use HasFactory;

    protected $table = 'trasvasijes_multi_fijo_a_movil_detalle';
    protected $primaryKey = 'id_detalle';

    protected $fillable = [
        'id_trasvasije_multi',
        'id_estanque_fijo',
        'litros_desde_estanque',
        'stock_inicial_fijo',
        'stock_final_fijo'
    ];

    protected $casts = [
        'litros_desde_estanque' => 'decimal:2',
        'stock_inicial_fijo' => 'decimal:2',
        'stock_final_fijo' => 'decimal:2'
    ];

    // ========================================
    // RELACIONES
    // ========================================

    /**
     * Trasvasije principal al que pertenece este detalle
     */
    public function trasvasijeMulti()
    {
        return $this->belongsTo(Trasvasijes_multi_fijo_a_movil::class, 'id_trasvasije_multi', 'id_trasvasije');
    }

    /**
     * Estanque fijo origen (de donde sale el combustible)
     */
    public function estanqueFijo()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque_fijo', 'id_estanque');
    }

    // ========================================
    // ACCESSORS
    // ========================================

    /**
     * Porcentaje que representa este estanque del total bombeado
     */
    public function getPorcentajeDelTotalAttribute()
    {
        $trasvasije = $this->trasvasijeMulti;
        if (!$trasvasije || $trasvasije->litros_bombeados_total == 0) {
            return 0;
        }

        return round(($this->litros_desde_estanque / $trasvasije->litros_bombeados_total) * 100, 2);
    }
}
