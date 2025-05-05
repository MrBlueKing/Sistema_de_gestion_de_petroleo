<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\InformeKpi;

class KpiResultados extends Model
{
    use HasFactory;
    
    protected $table = 'kpi_resultados';
    protected $primaryKey = 'id_resultado';

    protected $fillable = [
        'id_informe',
        'codigo_kpi',
        'titulo',
        'valor',
        'unidad',
        'cambio',
        'es_positivo',
        'color',
        'descripcion'
    ];

    protected $casts = [
        'es_positivo' => 'boolean'
    ];

    // Relación con el informe
    public function informe()
    {
        return $this->belongsTo(InformeKpi::class, 'id_informe');
    }
}