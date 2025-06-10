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
         Schema::create('trasvasijes', function (Blueprint $table) {
            $table->id('id_trasvasije');
            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_estanque_origen')->comment('Estanque móvil de origen');
            $table->timestamp('fecha_trasvasije')->useCurrent();
            $table->decimal('litros_total_trasvasije', 10, 2)->comment('Total de litros trasvasijados');
            
            // Información del estanque origen (móvil)
            $table->decimal('stock_inicial_origen', 10, 2)->comment('Stock del estanque móvil antes del trasvasije');
            $table->decimal('stock_final_origen', 10, 2)->comment('Stock del estanque móvil después del trasvasije');
            $table->decimal('medicion_inicial_origen', 10, 3)->nullable();
            $table->decimal('medicion_final_origen', 10, 3)->nullable();
            
            // Metadatos
            $table->string('observaciones', 255)->nullable();
            $table->unsignedBigInteger('id_faena')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('id_usuario')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_estanque_origen')->references('id_estanque')->on('estanques')->onDelete('cascade');
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('set null');
            
            // Índices
            $table->index('fecha_trasvasije', 'idx_trasvasijes_fecha');
            $table->index(['id_faena', 'fecha_trasvasije']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trasvasijes');
    }
};
