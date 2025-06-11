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
        Schema::create('trasvasijes_multi_fijo_a_movil_detalle', function (Blueprint $table) {
            $table->id('id_detalle');
            $table->unsignedBigInteger('id_trasvasije_multi');
            $table->unsignedBigInteger('id_estanque_fijo');

            $table->decimal('litros_desde_estanque', 10, 2);
            $table->decimal('stock_inicial_fijo', 10, 2);
            $table->decimal('stock_final_fijo', 10, 2);

            $table->timestamps();

            // ========================================
            // FOREIGN KEYS CON NOMBRES CORTOS EXPLÍCITOS
            // ========================================

            // En lugar de dejar que Laravel genere nombres automáticos largos,
            // especificamos nombres cortos y descriptivos

            $table->foreign('id_trasvasije_multi', 'fk_detalle_trasvasije')
                ->references('id_trasvasije')
                ->on('trasvasijes_multi_fijo_a_movil')
                ->onDelete('cascade');

            $table->foreign('id_estanque_fijo', 'fk_detalle_estanque')
                ->references('id_estanque')
                ->on('estanques')
                ->onDelete('cascade');

            // Constraint único con nombre corto
            $table->unique(['id_trasvasije_multi', 'id_estanque_fijo'], 'uk_trasvasije_estanque');

            // Índices adicionales para performance
            $table->index('id_trasvasije_multi', 'idx_detalle_trasvasije');
            $table->index('id_estanque_fijo', 'idx_detalle_estanque');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trasvasijes_multi_fijo_a_movil_detalle');
    }
};
