<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE ingresos_petroleo 
            MODIFY litros_documentados DECIMAL(10,3),
            MODIFY litros_recibidos DECIMAL(10,3)
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE ingresos_petroleo 
            MODIFY litros_documentados DECIMAL(10,2),
            MODIFY litros_recibidos DECIMAL(10,2)
        ");
    }
};
