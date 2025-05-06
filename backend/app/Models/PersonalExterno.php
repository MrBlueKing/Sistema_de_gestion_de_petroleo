<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PersonalExterno extends Model
{
    use HasFactory;

    protected $table = 'personal_externo';
    protected $primaryKey = 'id_personal';

    protected $fillable = [
        'id_dotacion',
        'nombre',
        'rut',
        'id_empresa',
    ];

    public function empresaExterna()
    {
        return $this->belongsTo(EmpresaExterna::class, 'id_empresa', 'id_empresa');
    }
}
