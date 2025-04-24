<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Maquinas;

class CategoriaMaquina extends Model
{
    use HasFactory;

    protected $table = 'categorias_maquinas'; // Nombre exacto de la tabla

    protected $primaryKey = 'id_categoria'; // Clave primaria personalizada

    protected $fillable = [
        'nombre_categoria',
        'tipo_medicion',
    ];

    // Relación inversa: una categoría puede tener muchas máquinas
    public function maquinas()
    {
        return $this->hasMany(Maquinas::class, 'id_categoria');
    }
}
