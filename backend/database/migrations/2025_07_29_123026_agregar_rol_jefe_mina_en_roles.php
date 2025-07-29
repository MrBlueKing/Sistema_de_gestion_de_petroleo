<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE roles 
            MODIFY rol ENUM('admin', 'bombero', 'gerente', 'toneladas', 'planificador', 'OperadorVehiculo', 'JefeMina') 
            NOT NULL
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE roles 
            MODIFY rol ENUM('admin', 'bombero', 'gerente', 'toneladas', 'planificador', 'OperadorVehiculo') 
            NOT NULL
        ");
    }
};
