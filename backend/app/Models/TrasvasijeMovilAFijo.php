<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TrasvasijeMovilAFijo extends Model
{
    use HasFactory;

    protected $table = 'trasvasijes_movil_a_fijo';
    protected $primaryKey = 'id_trasvasije';

    protected $fillable = [
        'id_usuario',
        'id_estanque_movil',
        'id_estanque_fijo',
        'fecha_trasvasije',
        'litros_movil_inicial',
        'litros_movil_final',
        'litros_trasvasijados',
        'altura_fijo_inicial',
        'altura_fijo_final',
        'litros_fijo_inicial',
        'litros_fijo_final',
        'litros_calculados_altura',
        'diferencia_medicion',
        'stock_inicial_movil',
        'stock_final_movil',
        'stock_inicial_fijo',
        'stock_final_fijo',
        'observaciones',
        'verificado',
        'id_faena'
    ];

    protected $casts = [
        'fecha_trasvasije' => 'datetime',
        'litros_movil_inicial' => 'decimal:2',
        'litros_movil_final' => 'decimal:2',
        'litros_trasvasijados' => 'decimal:2',
        'altura_fijo_inicial' => 'decimal:3',
        'altura_fijo_final' => 'decimal:3',
        'litros_fijo_inicial' => 'decimal:2',
        'litros_fijo_final' => 'decimal:2',
        'litros_calculados_altura' => 'decimal:2',
        'diferencia_medicion' => 'decimal:2',
        'stock_inicial_movil' => 'decimal:2',
        'stock_final_movil' => 'decimal:2',
        'stock_inicial_fijo' => 'decimal:2',
        'stock_final_fijo' => 'decimal:2',
        'verificado' => 'boolean'
    ];

    // ========================================
    // RELACIONES
    // ========================================

    /**
     * Usuario que realiza el trasvasije
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }

    /**
     * Estanque móvil origen (de donde sale el combustible)
     */
    public function estanqueMovil()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque_movil', 'id_estanque');
    }

    /**
     * Estanque fijo destino (hacia donde va el combustible)
     */
    public function estanqueFijo()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque_fijo', 'id_estanque');
    }

    /**
     * Faena donde se realiza el trasvasije
     */
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    // ========================================
    // ACCESSORS Y SCOPES
    // ========================================

    /**
     * Estado de la diferencia de medición
     */
    public function getEstadoDiferenciaAttribute()
    {
        if (!$this->diferencia_medicion) {
            return 'sin_calcular';
        }

        $diferencia = abs($this->diferencia_medicion);

        if ($diferencia <= 2) {
            return 'excelente';
        } elseif ($diferencia <= 5) {
            return 'aceptable';
        } elseif ($diferencia <= 10) {
            return 'revision_requerida';
        } else {
            return 'critico';
        }
    }

    /**
     * Scope para trasvasijes pendientes de verificación
     */
    public function scopePendientesVerificacion($query)
    {
        return $query->where('verificado', false);
    }
}
