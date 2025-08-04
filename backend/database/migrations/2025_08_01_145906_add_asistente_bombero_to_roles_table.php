<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("
        ALTER TABLE roles 
        MODIFY rol ENUM('admin', 'bombero', 'gerente', 'toneladas', 'planificador', 'OperadorVehiculo', 'JefeMina', 'asistente_bombero') 
        NOT NULL
    ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
        ALTER TABLE roles 
        MODIFY rol ENUM('admin', 'bombero', 'gerente', 'toneladas', 'planificador', 'OperadorVehiculo', 'JefeMina') 
        NOT NULL
    ");
    }
};
