<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("
    ALTER TABLE verificacion_altura 
    MODIFY stock_inicial DECIMAL(10,3) 
    COMMENT 'Para cada ingreso y cada estanque, este campo registra el valor del stock inicial. En el primer registro del ingreso representa el stock real del estanque antes de la operación. En los siguientes registros del mismo ingreso, representa la cantidad de combustible que se planeó distribuir hacia ese estanque.'
");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            ALTER TABLE verificacion_altura 
            MODIFY stock_inicial DECIMAL(10,2) 
            COMMENT 'Valor stock inicial de cada estanque'
        ");
    }
};
