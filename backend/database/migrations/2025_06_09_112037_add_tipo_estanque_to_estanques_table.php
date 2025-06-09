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
        Schema::table('estanques', function (Blueprint $table) {
            // Agregar tipo de estanque
            $table->enum('tipo_estanque', ['fijo', 'movil'])
                ->default('fijo')
                ->after('nombre')
                ->comment('Tipo de estanque: fijo (estacionario) o móvil (camión)');

            // Agregar índices para mejor performance
            $table->index('tipo_estanque', 'idx_estanques_tipo');
            $table->index(['id_faena', 'tipo_estanque'], 'idx_estanques_faena_tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estanques', function (Blueprint $table) {
            $table->dropIndex('idx_estanques_tipo');
            $table->dropIndex('idx_estanques_faena_tipo');
            $table->dropColumn('tipo_estanque');
        });
    }
};
