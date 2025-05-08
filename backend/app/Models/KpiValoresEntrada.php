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
    public $incrementing = true; // Agregar esta línea

    protected $fillable = [
        'id_informe',
        'toneladas_extraidas',
        'camionadas',
        'petroleo_toneladas',
        'petroleo_horas',
        'petroleo_kilometros'
    ];
    
    protected $casts = [
        'toneladas_extraidas' => 'decimal:2',
        'camionadas' => 'decimal:2',
        'petroleo_toneladas' => 'decimal:2',
        'petroleo_horas' => 'decimal:2',
        'petroleo_kilometros' => 'decimal:2'
    ];

    public function informe()
    {
        return $this->belongsTo(InformeKpi::class, 'id_informe');
    }
}