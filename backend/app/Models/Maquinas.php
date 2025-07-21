<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CategoriaMaquina;
use App\Models\PermisosMaquinasFaenas;
use App\Models\MaquinaExterna;
use App\Models\MaquinaInterna; // ✅ Agregar este import
use App\Models\OperadorVehiculo\AsignacionPersonalMaquina;
use App\Models\OperadorVehiculo\CargaExterna;

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

    // ✅ NUEVA RELACIÓN CON MÁQUINA INTERNA
    /**
     * Relación con máquina interna
     */
    public function maquinaInterna()
    {
        return $this->hasOne(MaquinaInterna::class, 'id_maquina', 'id_maquina');
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

    // ✅ RELACIONES PARA CARGAS EXTERNAS

    /**
     * Relación con asignaciones de usuarios
     */
    public function asignacionesUsuarios()
    {
        return $this->hasMany(AsignacionPersonalMaquina::class, 'id_maquina', 'id_maquina');
    }

    /**
     * Obtener el usuario actualmente asignado
     */
    public function usuarioAsignado()
    {
        return $this->hasOneThrough(
            User::class,
            AsignacionPersonalMaquina::class,
            'id_maquina', // Foreign key en asignaciones_user_maquinas
            'id', // Foreign key en users
            'id_maquina', // Local key en maquinas
            'id_user' // Local key en asignaciones_user_maquinas
        )->where('asignaciones_user_maquinas.activo', true);
    }

    /**
     * Relación con cargas externas de esta máquina
     */
    public function cargasExternas()
    {
        return $this->hasMany(CargaExterna::class, 'id_maquina', 'id_maquina');
    }

    /**
     * Verificar si tiene usuario asignado
     */
    public function tieneUsuarioAsignado()
    {
        return AsignacionPersonalMaquina::where('id_maquina', $this->id_maquina)
            ->where('activo', true)
            ->exists();
    }
}