<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitanteFaena extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'solicitantefaena';

    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'id_dotacion',
        'id_faena',
    ];

    /**
     * Obtener la dotación (solicitante) asociada con esta relación.
     */
    public function dotacion(): BelongsTo
    {
        return $this->belongsTo(Dotacion::class, 'id_dotacion');
    }

    /**
     * Obtener la faena asociada con esta relación.
     */
    public function faena(): BelongsTo
    {
        return $this->belongsTo(Faena::class, 'id_faena');
    }
}
