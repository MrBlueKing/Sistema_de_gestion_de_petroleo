<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('verificacion_altura', function (Blueprint $table) {
            // Agregar campo para tipo de operación
            $table->enum('tipo_operacion', [
                'ingreso_fijo',
                'ingreso_movil',
                'trasvasije'
            ])->default('ingreso_fijo')->after('verificado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->dropColumn(['tipo_operacion']);
        });
    }
};
