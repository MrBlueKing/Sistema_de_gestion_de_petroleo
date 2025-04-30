<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockPetroleo extends Model
{
    use HasFactory;

    protected $table = 'stock_petroleo';
    protected $primaryKey = 'id_stock';
    
    protected $fillable = [
        'id_faena',
        'stock_actual',
        'ultima_actualizacion'
    ];

    protected $dates = [
        'ultima_actualizacion'
    ];

    // Relaciones
    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }
}
