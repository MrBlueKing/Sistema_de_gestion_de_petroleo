<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'nombre',
        'rut',
        'password',
        'id_rol', // Agrega 'id_rol' aquí
    ];

    /**
     * Los atributos que deben estar ocultos en la serialización.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts para atributos.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Sobrescribir el campo que Laravel usará para autenticación.
     * En lugar de 'email', usaremos 'rut'.
     */
    public function getAuthIdentifierName()
    {
        return 'rut';
    }
}
