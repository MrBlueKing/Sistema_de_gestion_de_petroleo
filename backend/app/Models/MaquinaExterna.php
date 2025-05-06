<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaquinaExterna extends Model
{
    use HasFactory;

    protected $table = 'maquinas_externas';
    protected $primaryKey = 'id_maquina';
    public $incrementing = false; // porque no es autoincremental

    protected $fillable = [
        'id_maquina',
        'id_empresa',
        'nombre_contacto',
    ];

    public function empresaExterna()
    {
        return $this->belongsTo(EmpresaExterna::class, 'id_empresa', 'id_empresa');
    }
}
