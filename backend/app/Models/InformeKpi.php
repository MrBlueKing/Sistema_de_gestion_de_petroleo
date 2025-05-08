<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Faena;
use App\Models\KpiValoresEntrada;

class InformeKpi extends Model
{
    use HasFactory;
    
    protected $table = 'informes_kpi';
    protected $primaryKey = 'id_informe';

    protected $fillable = [
        'id_usuario',
        'id_faena',
        'periodo',
        'fecha_inicio_periodo',
        'fecha_fin_periodo',
        'titulo',
        'observaciones'
    ];

    protected $casts = [
        'fecha_inicio_periodo' => 'date',
        'fecha_fin_periodo' => 'date',
    ];

    // Relación con el usuario que creó el informe
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    // Relación con la faena
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }

    // Relación con valores de entrada (uno a uno)
    public function valoresEntrada()
    {
        return $this->hasOne(KpiValoresEntrada::class, 'id_informe');
    }
}