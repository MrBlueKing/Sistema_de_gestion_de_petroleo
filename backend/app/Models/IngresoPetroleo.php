<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Faena;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class IngresoPetroleo extends Model
{
    use HasFactory;

    protected $table = 'ingresos_petroleo';
    protected $primaryKey = 'id_ingreso';
    public $incrementing = true;
    protected $keyType = 'int';

    // Asegúrate de que el campo 'precio_litro' esté en el array $fillable
    protected $fillable = [
        'id_usuario',
        'numero_guia',
        'litros_recibidos',
        'precio', // ← Nuevo campo agregado
        'recibo_conforme',
        'observacion',
        'id_faena',
    ];

    // 🔁 Relación con el usuario que registró el ingreso
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    // 🔁 Relación con la faena (puede que no exista)
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }
}
