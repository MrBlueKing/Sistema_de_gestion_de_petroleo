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
        Schema::table('kpi_valores_entrada', function (Blueprint $table) {
            // Eliminar columnas antiguas
            $table->dropColumn([
                'ley_mineral',
                'horas_trabajadas',
                'combustible_consumido',
                'kilometros_recorridos',
                'numero_viajes',
                'rendimiento_base',
                'precio_combustible'
            ]);
    
            // Agregar nuevas columnas
            $table->decimal('camionadas', 12, 2)->nullable();
            $table->decimal('petroleo_toneladas', 12, 2)->nullable();
            $table->decimal('petroleo_horas', 12, 2)->nullable();
            $table->decimal('petroleo_kilometros', 12, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kpi_valores_entrada', function (Blueprint $table) {
            // Volver a agregar las columnas eliminadas
            $table->decimal('ley_mineral', 10, 2)->nullable();
            $table->decimal('horas_trabajadas', 10, 2)->nullable();
            $table->decimal('combustible_consumido', 12, 2)->nullable();
            $table->decimal('kilometros_recorridos', 12, 2)->nullable();
            $table->integer('numero_viajes')->nullable();
            $table->decimal('rendimiento_base', 5, 2)->nullable();
            $table->decimal('precio_combustible', 10, 2)->nullable();
    
            // Quitar las columnas nuevas
            $table->dropColumn([
                'camionadas',
                'petroleo_toneladas',
                'petroleo_horas',
                'petroleo_kilometros'
            ]);
        });
    }
};
