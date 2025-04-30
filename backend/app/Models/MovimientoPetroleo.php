<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MovimientoPetroleo extends Model
{
    use HasFactory;

    protected $table = 'movimientos_petroleo';
    protected $primaryKey = 'id_movimiento';
    
    protected $fillable = [
        'id_faena',
        'tipo_movimiento',
        'id_referencia',
        'cantidad',
        'stock_anterior',
        'stock_actual',
        'id_usuario'
    ];

    // Relaciones
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }
}
