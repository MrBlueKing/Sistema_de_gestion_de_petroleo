<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trasvasijes_multi_fijo_a_movil extends Model
{
    use HasFactory;

    protected $table = 'trasvasijes_multi_fijo_a_movil';
    protected $primaryKey = 'id_trasvasije';

    protected $fillable = [
        'id_usuario',
        'id_estanque_movil',
        'id_faena',
        'fecha_trasvasije',
        'numeral_inicial',
        'numeral_final',
        'litros_bombeados_total',
        'stock_inicial_movil',
        'stock_final_movil',
        'observaciones'
    ];

    protected $casts = [
        'fecha_trasvasije' => 'datetime',
        'numeral_inicial' => 'decimal:3',
        'numeral_final' => 'decimal:3',
        'litros_bombeados_total' => 'decimal:2',
        'stock_inicial_movil' => 'decimal:2',
        'stock_final_movil' => 'decimal:2'
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
     * Estanque móvil destino (hacia donde va el combustible)
     */
    public function estanqueMovil()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque_movil', 'id_estanque');
    }

    /**
     * Faena donde se realiza el trasvasije
     */
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    /**
     * Detalles de estanques fijos origen (relación 1:N)
     */
    public function detalles()
    {
        return $this->hasMany(TrasvasijeMultiDetalle::class, 'id_trasvasije_multi', 'id_trasvasije');
    }

    /**
     * Estanques fijos origen a través de los detalles
     */
    public function estanquesFijos()
    {
        return $this->hasManyThrough(
            Estanque::class,
            TrasvasijeMultiDetalle::class,
            'id_trasvasije_multi', // FK en tabla detalle
            'id_estanque',          // FK en tabla estanques
            'id_trasvasije',        // PK local
            'id_estanque_fijo'      // PK en tabla detalle
        );
    }

    // ========================================
    // ACCESSORS Y MÉTODOS ÚTILES
    // ========================================

    /**
     * Obtener el total de estanques fijos origen
     */
    public function getTotalEstanquesFijosAttribute()
    {
        return $this->detalles()->count();
    }

    /**
     * Verificar si es un trasvasije simple (1 fijo → móvil)
     */
    public function getEsSimpleAttribute()
    {
        return $this->total_estanques_fijos === 1;
    }

    /**
     * Verificar si es un trasvasije múltiple (N fijos → móvil)
     */
    public function getEsMultipleAttribute()
    {
        return $this->total_estanques_fijos > 1;
    }

    /**
     * Obtener litros bombeados calculados (diferencia numerales)
     */
    public function getLitrosBombeadosCalculadosAttribute()
    {
        return $this->numeral_final - $this->numeral_inicial;
    }
}
