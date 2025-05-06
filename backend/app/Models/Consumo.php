<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Solicitante;
use App\Models\Maquinas;
use App\Models\User;
use App\Models\Faena;
use App\Models\Estanque;

class Consumo extends Model
{
    use HasFactory;

    protected $table = 'consumos'; // Nombre de la tabla

    protected $primaryKey = 'id_consumo'; // Tu clave primaria personalizada

    public $incrementing = true; // Laravel necesita saber que es auto-incremental
    protected $keyType = 'int'; // Tipo de la clave primaria

    protected $fillable = [
        'id_dotacion',
        'id_equipo',
        'id_usuario',
        'fecha_consumo',
        'litros_consumidos',
        'id_faena',
        'id_estanque',
        'medicion',
        'numeral_inicial',
        'numeral_final',
        'precio_litro',
    ];

    // Relaciones
    public function solicitante()
    {
        return $this->belongsTo(Solicitante::class, 'id_dotacion');
    }

    public function maquina()
    {
        return $this->belongsTo(Maquinas::class, 'id_equipo', 'id_maquina');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    public function estanque()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque', 'id_estanque');
    }
}
