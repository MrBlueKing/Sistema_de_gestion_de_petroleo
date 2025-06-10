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
        Schema::create('trasvasije_destinos', function (Blueprint $table) {
            $table->id('id_trasvasije_destino');
            $table->unsignedBigInteger('id_trasvasije');
            $table->unsignedBigInteger('id_estanque_destino')->comment('Estanque fijo de destino');
            $table->decimal('litros_hacia_destino', 10, 2)->comment('Litros que van a ESTE estanque destino');
            
            // Información del estanque destino (fijo)
            $table->decimal('stock_inicial_destino', 10, 2)->comment('Stock del estanque fijo antes del trasvasije');
            $table->decimal('stock_final_destino', 10, 2)->comment('Stock del estanque fijo después del trasvasije');
            $table->decimal('medicion_inicial_destino', 10, 3)->nullable();
            $table->decimal('medicion_final_destino', 10, 3)->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('id_trasvasije')->references('id_trasvasije')->on('trasvasijes')->onDelete('cascade');
            $table->foreign('id_estanque_destino')->references('id_estanque')->on('estanques')->onDelete('cascade');
            
            // Constraint único para evitar duplicados
            $table->unique(['id_trasvasije', 'id_estanque_destino'], 'trasvasije_destinos_unique');
            
            // Índices
            $table->index('id_trasvasije');
            $table->index('id_estanque_destino');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trasvasije_destinos');
    }
};
