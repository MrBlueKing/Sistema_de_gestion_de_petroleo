<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistroInsumo extends Model
{
    protected $table = 'registros_insumo';

    protected $fillable = [
        'id_maquina',
        'id_catalogo_insumo',
        'fecha',
        'observaciones',
        'id_responsable',
        'creado_por',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function maquina()
    {
        return $this->belongsTo(Maquinas::class, 'id_maquina', 'id_maquina');
    }

    public function catalogoInsumo()
    {
        return $this->belongsTo(CatalogoInsumo::class, 'id_catalogo_insumo');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function responsable()
    {
        return $this->belongsTo(Mecanico::class, 'id_responsable', 'id');
    }
}
