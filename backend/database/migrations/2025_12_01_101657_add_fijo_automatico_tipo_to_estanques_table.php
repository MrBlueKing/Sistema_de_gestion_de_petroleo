<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modificar el enum tipo_estanque para incluir 'fijo_automatico'
        DB::statement("ALTER TABLE estanques MODIFY COLUMN tipo_estanque ENUM('fijo', 'movil', 'fijo_automatico') NOT NULL COMMENT 'Tipo de estanque: fijo (estacionario con medición manual), movil (camión), fijo_automatico (con sensores automáticos)'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir el enum a los valores originales
        DB::statement("ALTER TABLE estanques MODIFY COLUMN tipo_estanque ENUM('fijo', 'movil') NOT NULL COMMENT 'Tipo de estanque: fijo (estacionario) o móvil (camión)'");
    }
};
