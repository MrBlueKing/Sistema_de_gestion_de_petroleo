<?php

namespace App\Models\OperadorVehiculo;

use App\Models\Maquinas;
use App\Models\PersonalInterno;
use App\Models\User;
use App\Models\Faena;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CargaExterna extends Model
{
    use HasFactory;

    protected $table = 'cargas_externas';

    protected $fillable = [
                'id_user',
        'id_maquina',
        'numero_boleta',
        'litros',
        'costo',
        'precio_por_litro',
        'id_faena',        
        'ubicacion',       
        'tipo_combustible',
        'observaciones',
        'estado',
        'aprobado_por',
        'fecha_aprobacion',
        'motivo_rechazo',
        'medicion',       
    ];

    protected $casts = [
        'litros' => 'decimal:2',
        'costo' => 'decimal:2',
        'precio_por_litro' => 'decimal:2',
        'medicion' => 'decimal:3',
        'fecha_aprobacion' => 'datetime',
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
     * ✅ NUEVA: Relación con Faena
     */
    public function faena(): BelongsTo
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
        // Si renombraste la columna a 'id_faena', cambia 'ubicacion' por 'id_faena'
    }

    /**
     * Relación con quien aprobó (Usuario)
     */
    public function aprobadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por', 'id');
    }

    // ... resto de métodos igual, solo cambiar id_personal_interno por id_user

    public function scopePorUsuario($query, $idUser) // ✅ Cambio aquí
    {
        return $query->where('id_user', $idUser);
    }

    /**
     * Obtener cargas de un usuario en un período
     */
    public static function getCargasUsuario($idUser, $fechaInicio = null, $fechaFin = null) // ✅ Cambio aquí
    {
        $query = self::with(['maquina.maquinaInterna'])
            ->porUsuario($idUser)
            ->orderBy('fecha_carga', 'desc');

        if ($fechaInicio && $fechaFin) {
            $query->entreFechas($fechaInicio, $fechaFin);
        }

        return $query->get();
    }
}
