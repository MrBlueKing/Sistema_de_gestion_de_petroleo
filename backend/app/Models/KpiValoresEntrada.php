<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\InformeKpi;

class KpiValoresEntrada extends Model
{
    use HasFactory;
    
    protected $table = 'kpi_valores_entrada';
    protected $primaryKey = 'id_valores_entrada';

    protected $fillable = [
        'id_informe',
        'ley_mineral',
        'toneladas_extraidas',
        'horas_trabajadas',
        'combustible_consumido',
        'kilometros_recorridos',
        'numero_viajes',
        'rendimiento_base',
        'precio_combustible'
    ];

    protected $casts = [
        'ley_mineral' => 'decimal:2',
        'toneladas_extraidas' => 'decimal:2',
        'horas_trabajadas' => 'decimal:2',
        'combustible_consumido' => 'decimal:2',
        'kilometros_recorridos' => 'decimal:2',
        'rendimiento_base' => 'decimal:2',
        'precio_combustible' => 'decimal:2'
    ];

    // Relación con el informe
    public function informe()
    {
        return $this->belongsTo(InformeKpi::class, 'id_informe');
    }
}