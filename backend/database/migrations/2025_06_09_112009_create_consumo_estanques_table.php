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
        Schema::create('consumo_estanques', function (Blueprint $table) {
            $table->id('id_consumo_estanque');
            $table->unsignedBigInteger('id_consumo');
            $table->unsignedBigInteger('id_estanque');
            $table->decimal('litros_desde_estanque', 10, 2)->comment('Litros que salen específicamente de ESTE estanque para el consumo');
            $table->decimal('medicion_inicial', 10, 3)->nullable()->comment('Medición inicial del estanque antes del consumo');
            $table->decimal('medicion_final', 10, 3)->nullable()->comment('Medición final del estanque después del consumo');
            $table->decimal('stock_inicial_estanque', 10, 2)->comment('Stock del estanque antes del consumo');
            $table->decimal('stock_final_estanque', 10, 2)->comment('Stock del estanque después del consumo');
            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_consumo')->references('id_consumo')->on('consumos')->onDelete('cascade');
            $table->foreign('id_estanque')->references('id_estanque')->on('estanques')->onDelete('cascade');

            // Índices
            $table->unique(['id_consumo', 'id_estanque'], 'consumo_estanques_unique');
            $table->index('id_consumo', 'idx_consumo_estanques_consumo');
            $table->index('id_estanque', 'idx_consumo_estanques_estanque');
            $table->index('created_at', 'idx_consumo_estanques_fecha');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consumo_estanques');
    }
};
