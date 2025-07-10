<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistorialChc extends Model
{
    use HasFactory;

    protected $table = 'historial_chc';

    protected $fillable = [
        'id_categoria',
        'chc_calculado',
        'chc_anterior',
        'anio',
        'mes',
        'periodo_inicio',
        'periodo_fin',
        'total_litros',
        'dias_periodo',
        'hrc_utilizado',
        'total_consumos',
        'maquinas_activas',
        'calculado_en',
        'metodo_calculo',
        'detalle_calculo'
    ];

    protected $casts = [
        'chc_calculado' => 'decimal:4',
        'chc_anterior' => 'decimal:4',
        'total_litros' => 'decimal:2',
        'hrc_utilizado' => 'decimal:2',
        'periodo_inicio' => 'date',
        'periodo_fin' => 'date',
        'calculado_en' => 'datetime',
        'detalle_calculo' => 'array'
    ];

    /**
     * Relación con categoría de máquinas
     */
    public function categoria()
    {
        return $this->belongsTo(CategoriaMaquina::class, 'id_categoria', 'id_categoria');
    }

    /**
     * Scope para obtener el historial de una categoría específica
     */
    public function scopeDeCategoria($query, $idCategoria)
    {
        return $query->where('id_categoria', $idCategoria);
    }

    /**
     * Scope para obtener el CHC de un período específico
     */
    public function scopeDePeriodo($query, $anio, $mes)
    {
        return $query->where('anio', $anio)->where('mes', $mes);
    }

    /**
     * Obtener el CHC más reciente de una categoría
     */
    public static function obtenerChcActual($idCategoria)
    {
        return self::where('id_categoria', $idCategoria)
            ->orderBy('anio', 'desc')
            ->orderBy('mes', 'desc')
            ->first()?->chc_calculado;
    }

    /**
     * Verificar si ya existe cálculo para un período
     */
    public static function existeCalculoPara($idCategoria, $anio, $mes)
    {
        return self::where('id_categoria', $idCategoria)
            ->where('anio', $anio)
            ->where('mes', $mes)
            ->exists();
    }
}