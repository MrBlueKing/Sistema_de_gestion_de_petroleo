<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogoInsumo extends Model
{
    protected $table = 'catalogo_insumos';

    protected $fillable = [
        'id_categoria',
        'tipo',
        'detalle',
        'id_responsable',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function categoria()
    {
        return $this->belongsTo(CategoriaMaquina::class, 'id_categoria', 'id_categoria');
    }

    public function responsable()
    {
        return $this->belongsTo(Mecanico::class, 'id_responsable', 'id');
    }

    public function registros()
    {
        return $this->hasMany(RegistroInsumo::class, 'id_catalogo_insumo');
    }
}
