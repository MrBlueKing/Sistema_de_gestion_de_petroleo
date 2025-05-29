<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE categorias_maquinas MODIFY tipo_medicion ENUM('Horometro', 'Kilometraje', 'N/A') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE categorias_maquinas MODIFY tipo_medicion ENUM('Horometro', 'Kilometraje') NOT NULL");
    }
};
