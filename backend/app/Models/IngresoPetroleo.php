<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Faena;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class IngresoPetroleo extends Model
{
    use HasFactory;
    
    protected $table = 'ingresos_petroleo';
    protected $primaryKey = 'id_ingreso';
    public $incrementing = true;
    protected $keyType = 'int';
    
    // Actualizar fillable para incluir todos los campos de la tabla
    protected $fillable = [
        'id_usuario',
        'numero_guia',
        'litros_documentados',  // Añadido según tu estructura
        'litros_recibidos',
        'precio',
        'precio_total',
        'recibo_conforme',
        'observacion',
        'id_faena',
        'diferencia'
    ];
    
    // Relación con el usuario que registró el ingreso
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
    
    // Relación con la faena
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }
    
    // Relación con las verificaciones de altura
    public function verificacionesAltura()
    {
        return $this->hasMany(VerificacionAltura::class, 'id_ingreso');
    }
}