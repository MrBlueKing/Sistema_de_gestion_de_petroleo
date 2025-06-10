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
    
    // 🔧 FILLABLE CORREGIDO - Incluye todos los campos de tu tabla
    protected $fillable = [
        'id_usuario',
        'numero_guia',
        'litros_documentados',    // Litros según la guía
        'litros_recibidos',       // Litros calculados según alturas
        'precio',
        'precio_total',
        'recibo_conforme',
        'observacion',
        'id_faena',
        'diferencia',             // Diferencia calculada
        'stock_inicial'           // Stock inicial del sistema
    ];
    
    // 🔧 CASTS PARA TIPOS DE DATOS CORRECTOS
    protected $casts = [
        'litros_documentados' => 'decimal:2',
        'litros_recibidos' => 'decimal:2',
        'precio' => 'decimal:2',
        'precio_total' => 'decimal:2',
        'diferencia' => 'decimal:2',
        'stock_inicial' => 'decimal:2',
        'recibo_conforme' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // 🔧 ATRIBUTOS DE FECHA
    protected $dates = [
        'created_at',
        'updated_at'
    ];
    
    // Relación con el usuario que registró el ingreso
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }
    
    // Relación con la faena
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }
    
    // Relación con las verificaciones de altura
    public function verificacionesAltura()
    {
        return $this->hasMany(VerificacionAltura::class, 'id_ingreso', 'id_ingreso');
    }
    
    // 🆕 SCOPES ÚTILES
    public function scopePorFaena($query, $idFaena)
    {
        return $query->where('id_faena', $idFaena);
    }
    
    public function scopePorFecha($query, $fechaInicio, $fechaFin = null)
    {
        if ($fechaFin) {
            return $query->whereBetween('created_at', [$fechaInicio, $fechaFin]);
        }
        return $query->whereDate('created_at', $fechaInicio);
    }
    
    public function scopeConDiferencia($query)
    {
        return $query->where('diferencia', '!=', 0);
    }
    
    // 🆕 ACCESSORS ÚTILES
    public function getDiferenciaMagnitudAttribute()
    {
        return abs($this->diferencia);
    }
    
    public function getTieneDiferenciaAttribute()
    {
        return abs($this->diferencia) > 0.5;
    }
    
    public function getEsExcedenteAttribute()
    {
        return $this->diferencia > 0;
    }
    
    public function getTipoRecepcionAttribute()
    {
        if (abs($this->diferencia) <= 0.5) {
            return 'normal';
        }
        return $this->diferencia > 0 ? 'excedente' : 'faltante';
    }
}


