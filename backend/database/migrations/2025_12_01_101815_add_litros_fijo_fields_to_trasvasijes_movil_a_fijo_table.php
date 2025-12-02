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
        Schema::table('trasvasijes_movil_a_fijo', function (Blueprint $table) {
            // Agregar campos para estanques fijos automáticos (con sensores)
            $table->decimal('litros_fijo_inicial', 10, 2)
                ->nullable()
                ->after('altura_fijo_final')
                ->comment('Litros medidos por sensor al inicio (solo para estanques fijo_automatico)');

            $table->decimal('litros_fijo_final', 10, 2)
                ->nullable()
                ->after('litros_fijo_inicial')
                ->comment('Litros medidos por sensor al final (solo para estanques fijo_automatico)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trasvasijes_movil_a_fijo', function (Blueprint $table) {
            $table->dropColumn(['litros_fijo_inicial', 'litros_fijo_final']);
        });
    }
};
