<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Padron;

class Planta extends Model
{
    protected $table = 'plantas';
    protected $primaryKey = 'id_planta';

    protected $fillable = ['nombre', 'descripcion'];

    public function padrones()
    {
        return $this->hasMany(Padron::class, 'id_planta', 'id_planta');
    }
}
