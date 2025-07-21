<?php

namespace App\Models\OperadorVehiculo;

use App\Models\Maquinas;
use App\Models\PersonalInterno;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsignacionPersonalMaquina extends Model
{
use HasFactory;

    protected $table = 'asignaciones_user_maquinas';

    protected $fillable = [
        'id_user', // ✅ Cambio aquí
        'id_maquina',
        'fecha_asignacion',
        'activo',
        'observaciones'
    ];

    protected $casts = [
        'fecha_asignacion' => 'date',
        'activo' => 'boolean',
    ];

    /**
     * Relación con User
     */
    public function user(): BelongsTo // ✅ Cambio aquí
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }

    /**
     * Relación con Maquina
     */
    public function maquina(): BelongsTo
    {
        return $this->belongsTo(Maquinas::class, 'id_maquina', 'id_maquina');
    }

    /**
     * Scope para obtener solo asignaciones activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para obtener asignaciones por usuario
     */
    public function scopePorUsuario($query, $idUser) // ✅ Cambio aquí
    {
        return $query->where('id_user', $idUser);
    }

    /**
     * Scope para obtener asignaciones por máquina
     */
    public function scopePorMaquina($query, $idMaquina)
    {
        return $query->where('id_maquina', $idMaquina);
    }

    /**
     * Obtener la máquina asignada a un usuario (solo activa)
     */
    public static function getMaquinaAsignada($idUser) // ✅ Cambio aquí
    {
        return self::with(['maquina.maquinaInterna'])
            ->where('id_user', $idUser)
            ->where('activo', true)
            ->first();
    }

    /**
     * Obtener el usuario asignado a una máquina (solo activo)
     */
    public static function getUserAsignado($idMaquina) // ✅ Cambio aquí
    {
        return self::with('user')
            ->where('id_maquina', $idMaquina)
            ->where('activo', true)
            ->first();
    }

    /**
     * Desactivar asignación anterior y crear nueva
     */
    public static function reasignar($idUser, $idMaquinaNueva, $observaciones = null) // ✅ Cambio aquí
    {
        // Desactivar asignación anterior del usuario
        self::where('id_user', $idUser)
            ->where('activo', true)
            ->update(['activo' => false, 'updated_at' => now()]);

        // Desactivar asignación anterior de la máquina
        self::where('id_maquina', $idMaquinaNueva)
            ->where('activo', true)
            ->update(['activo' => false, 'updated_at' => now()]);

        // Crear nueva asignación
        return self::create([
            'id_user' => $idUser,
            'id_maquina' => $idMaquinaNueva,
            'fecha_asignacion' => now()->toDateString(),
            'activo' => true,
            'observaciones' => $observaciones
        ]);
    }
}
