<?php

namespace App\Models\Bodega;

use Illuminate\Database\Eloquent\Model;

class Personal extends Model
{
    protected $connection = 'bodega'; // Usamos la conexión alternativa
    protected $table = 'personal';    // Nombre real de la tabla
    protected $primaryKey = 'Id_Personal'; // Llave primaria personalizada

    public $timestamps = false; // Porque tu tabla no tiene created_at ni updated_at

    // Opcionalmente puedes definir qué columnas se pueden usar en fill/update
    protected $fillable = [
        'Rut',
        'Nombre',
        'Cargo',
    ];
}
