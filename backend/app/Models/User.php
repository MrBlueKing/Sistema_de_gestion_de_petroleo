<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Rol;
use App\Models\Faena;
use App\Models\OperadorVehiculo\AsignacionPersonalMaquina;
use App\Models\OperadorVehiculo\CargaExterna;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nombre',
        'apellido',
        'rut',
        'password',
        'id_faena',
        'faena_activa_id',
        'id_rol',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function getAuthIdentifierName()
    {
        return 'rut';
    }

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

    // Relación con Faena principal
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }

    // Relación con Faena activa
    public function faenaActiva()
    {
        return $this->belongsTo(Faena::class, 'faena_activa_id', 'id_faena');
    }

    // Relación muchos-a-muchos con Faenas
    public function faenas()
    {
        return $this->belongsToMany(Faena::class, 'user_faena', 'user_id', 'faena_id')
            ->withPivot('activo')
            ->withTimestamps();
    }

    // Obtener la faena activa o la principal
    public function getFaenaActualAttribute()
    {
        return $this->faena_activa_id ?? $this->id_faena;
    }
    // Relación con Recepción Petróleo
    public function ingresosPetroleo()
    {
        return $this->hasMany(IngresoPetroleo::class, 'id_usuario');
    }

    // ✅ NUEVAS RELACIONES PARA CARGAS EXTERNAS

    /**
     * Relación con asignaciones de máquinas
     */
    public function asignacionesMaquinas()
    {
        return $this->hasMany(AsignacionPersonalMaquina::class, 'id_user');
    }

    /**
     * Obtener la máquina actualmente asignada
     */
    public function maquinaAsignada()
    {
        return $this->hasOneThrough(
            Maquinas::class,
            AsignacionPersonalMaquina::class,
            'id_user', // Foreign key en asignaciones_user_maquinas
            'id_maquina', // Foreign key en maquinas
            'id', // Local key en users
            'id_maquina' // Local key en asignaciones_user_maquinas
        )->where('asignaciones_user_maquinas.activo', true);
    }

    /**
     * Relación con cargas externas realizadas
     */
    public function cargasExternas()
    {
        return $this->hasMany(CargaExterna::class, 'id_user');
    }

    /**
     * Método helper para verificar si tiene máquina asignada
     */
    public function tieneMaquinaAsignada()
    {
        return AsignacionPersonalMaquina::where('id_user', $this->id)
            ->where('activo', true)
            ->exists();
    }

    /**
     * Método helper para obtener la asignación activa
     */
    public function getAsignacionActiva()
    {
        return AsignacionPersonalMaquina::getMaquinaAsignada($this->id);
    }
}
