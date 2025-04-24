<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CategoriaMaquina;
use App\Models\permisos_maquinas_faenas;

class Maquinas extends Model
{
    protected $table = 'maquinas'; // Especifica la tabla solo si no sigue la convención
    protected $primaryKey = 'id_maquina'; // clave primaria personalizada
    public $incrementing = true; // Laravel lo necesita para claves personalizadas

    protected $fillable = [
        'id_categoria',
        'nombre_maquina',
        'tipo_maquina',
        'patente',
    ];

    // Relación con la tabla Categorias
    public function categoria()
    {
        return $this->belongsTo(CategoriaMaquina::class, 'id_categoria');
    }
    // La relación inversa para los permisos de máquina
    public function permisos()
    {
        return $this->hasMany(permisos_maquinas_faenas::class, 'id_maquina');
    }
}
