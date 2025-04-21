<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CategoriaMaquina extends Model
{
    use HasFactory;

    protected $table = 'categorias_maquinas'; // Nombre exacto de la tabla

    protected $primaryKey = 'id_categoria'; // Clave primaria personalizada

    protected $fillable = [
        'nombre_categoria',
        'tipo_medicion',
    ];
}
