<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\permisos_maquinas_faenas;

class Faena extends Model
{
    protected $primaryKey = 'id_faena'; // 👈 Muy importante, ya que no usas 'id'

    public $timestamps = false;

    public function usuarios()
    {
        return $this->hasMany(User::class, 'id_faena');
    }
    // La relación inversa para los permisos de faena
    public function permisos()
    {
        return $this->hasMany(permisos_maquinas_faenas::class, 'id_faena');
    }
}
