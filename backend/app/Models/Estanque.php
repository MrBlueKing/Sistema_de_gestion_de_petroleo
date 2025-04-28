<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Estanque extends Model
{
    use HasFactory;

    protected $table = 'estanques';
    protected $primaryKey = 'id_estanque';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nombre',
        'id_faena',
        'capacidad_litros',
        'litros_disponibles',
        'estado',
        'descripcion',
    ];

    // Relación con faena
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }
    // Relación con EstanqueStock
    public function stock()
    {
        return $this->hasOne(EstanqueStock::class, 'id_estanque', 'id_estanque');
    }
}
