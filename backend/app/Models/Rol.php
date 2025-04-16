<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $table = 'roles'; // Nombre de la tabla si no es 'roles'
    protected $primaryKey = 'id_rol'; // Si la clave primaria no es 'id'
    public $timestamps = false; // Si no usas created_at/updated_at

    public function usuarios()
    {
        return $this->hasMany(User::class, 'id_rol');
    }
}
