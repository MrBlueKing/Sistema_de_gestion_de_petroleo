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
        Schema::table('consumos', function (Blueprint $table) {
            // Hacer opcional el campo id_estanque para consumos múltiples
            $table->unsignedBigInteger('id_estanque')->nullable()->change();

            // Agregar campo para tipo de consumo
            $table->enum('tipo_consumo', ['simple', 'multiple'])
                ->default('simple')
                ->after('litros_consumidos')
                ->comment('Indica si el consumo es de un solo estanque o múltiples estanques');

            // Agregar campo para tipo de operación (preparado para futuro)
            $table->enum('tipo_operacion', ['normal', 'estanque_movil'])
                ->default('normal')
                ->after('tipo_consumo')
                ->comment('Tipo de operación de combustible');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consumos', function (Blueprint $table) {
            // Revertir cambios
            $table->dropColumn(['tipo_consumo', 'tipo_operacion']);
            $table->unsignedBigInteger('id_estanque')->nullable(false)->change();
        });
    }
};
