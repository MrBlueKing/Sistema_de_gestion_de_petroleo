<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CategoriaMaquina;
use App\Models\PermisosMaquinasFaenas;
use App\Models\MaquinaExterna;

class Maquinas extends Model
{
    protected $table = 'maquinas';
    protected $primaryKey = 'id_maquina';
    public $incrementing = true;

    protected $fillable = [
        'id_categoria',
        'nombre_maquina',
        'tipo_maquina',
        'patente',
        'estado',
        'chc_maquina',
    ];

    // Relación con la tabla Categorias
    public function categoria()
    {
        return $this->belongsTo(CategoriaMaquina::class, 'id_categoria');
    }

    // La relación inversa para los permisos de máquina
    public function permisos()
    {
        return $this->hasMany(PermisosMaquinasFaenas::class, 'id_maquina');
    }

    // Relación con máquinas externas
    public function maquinasExternas()
    {
        return $this->hasMany(MaquinaExterna::class, 'id_maquina', 'id_maquina');
    }

    // Relación específica para una máquina externa
    public function maquinaExterna()
    {
        return $this->hasOne(MaquinaExterna::class, 'id_maquina', 'id_maquina');
    }

    // Scope para máquinas internas
    public function scopeInternas($query)
    {
        return $query->where('tipo_maquina', 'Interno');
    }

    // Scope para máquinas externas
    public function scopeExternas($query)
    {
        return $query->where('tipo_maquina', 'Externo');
    }

    // Scope para máquinas operativas
    public function scopeOperativas($query)
    {
        return $query->where('estado', 'operativo');
    }
}