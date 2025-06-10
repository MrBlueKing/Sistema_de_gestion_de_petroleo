<?php
// ===================================
// MODEL: ConsumoEstanque.php
// ===================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumoEstanque extends Model
{
    use HasFactory;

    protected $table = 'consumo_estanques';
    protected $primaryKey = 'id_consumo_estanque';
    
    protected $fillable = [
        'id_consumo',
        'id_estanque',
        'litros_desde_estanque',
        'medicion_inicial',
        'medicion_final',
        'stock_inicial_estanque',
        'stock_final_estanque'
    ];

    protected $casts = [
        'litros_desde_estanque' => 'decimal:2',
        'medicion_inicial' => 'decimal:3',
        'medicion_final' => 'decimal:3',
        'stock_inicial_estanque' => 'decimal:2',
        'stock_final_estanque' => 'decimal:2'
    ];

    // ===================================
    // RELACIONES
    // ===================================

    /**
     * Relación con el consumo principal
     */
    public function consumo(): BelongsTo
    {
        return $this->belongsTo(Consumo::class, 'id_consumo', 'id_consumo');
    }

    /**
     * Relación con el estanque
     */
    public function estanque(): BelongsTo
    {
        return $this->belongsTo(Estanque::class, 'id_estanque', 'id_estanque');
    }

    // ===================================
    // MÉTODOS AUXILIARES
    // ===================================

    /**
     * Calcula la diferencia de stock
     */
    public function getDiferenciaStock(): float
    {
        return $this->stock_inicial_estanque - $this->stock_final_estanque;
    }

    /**
     * Calcula la diferencia de medición
     */
    public function getDiferenciaMedicion(): float
    {
        return $this->medicion_final - $this->medicion_inicial;
    }
}
