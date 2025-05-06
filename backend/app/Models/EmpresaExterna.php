<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmpresaExterna extends Model
{
    use HasFactory;

    protected $table = 'empresas_externas';
    protected $primaryKey = 'id_empresa';

    protected $fillable = [
        'nombre',
        'rut',
        'contacto',
    ];

    // Relación 1 a muchos con PersonalExterno
    public function personalExterno()
    {
        return $this->hasMany(PersonalExterno::class, 'id_empresa', 'id_empresa');
    }

    // Relación 1 a muchos con MaquinaExterna
    public function maquinasExternas()
    {
        return $this->hasMany(MaquinaExterna::class, 'id_empresa', 'id_empresa');
    }
}
