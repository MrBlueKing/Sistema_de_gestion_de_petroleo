<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class EstanqueStock extends Model
{
    use HasFactory;

    // Nombre de la tabla (opcional si sigue convención, pero mejor ser explícitos)
    protected $table = 'estanque_stock';

    // Clave primaria personalizada
    protected $primaryKey = 'id_estanque_stock';

    // Campos que se pueden asignar en masa (fillable)
    protected $fillable = [
        'id_estanque',
        'stock_actual',
        'altura_actual',
        'ultima_medicion',
    ];

    // Si quieres que Laravel maneje timestamps automáticamente (created_at, updated_at)
    public $timestamps = true;

    // Relaciones

    /**
     * Relación: cada registro de stock pertenece a un estanque.
     */
    public function estanque()
    {
        return $this->belongsTo(Estanque::class, 'id_estanque', 'id_estanque');
    }
}
