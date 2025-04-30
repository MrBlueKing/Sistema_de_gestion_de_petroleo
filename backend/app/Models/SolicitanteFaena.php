<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\PersonalInterno;
use App\Models\Faena;

class SolicitanteFaena extends Model
{
    use HasFactory;

    // Especificar el nombre real de la tabla
    protected $table = 'solicitante_faena';

    // Clave primaria personalizada (si existe)
    protected $primaryKey = 'id';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'id_dotacion',   // Este campo en realidad se refiere al id_personal_interno
        'id_faena',
    ];

    // Desactivar timestamps porque la tabla no tiene estas columnas
    public $timestamps = false;

   // Relación con Solicitante
   public function solicitante()
   {
       return $this->belongsTo(Solicitante::class, 'id_dotacion', 'id');
   }

   // Relación con Faena
   public function faena()
   {
       return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
   }
}