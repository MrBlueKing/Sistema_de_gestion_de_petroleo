<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faena extends Model
{
    protected $primaryKey = 'id_faena'; // 👈 Muy importante, ya que no usas 'id'

    public $timestamps = false;

    public function usuarios()
    {
        return $this->hasMany(User::class, 'id_faena');
    }
}
