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
        Schema::create('trasvasijes_multi_fijo_a_movil', function (Blueprint $table) {
            $table->id('id_trasvasije');
            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_estanque_movil');
            $table->unsignedBigInteger('id_faena');
            $table->timestamp('fecha_trasvasije');

            $table->decimal('numeral_inicial', 10, 3);
            $table->decimal('numeral_final', 10, 3);
            $table->decimal('litros_bombeados_total', 10, 2);

            $table->decimal('stock_inicial_movil', 10, 2);
            $table->decimal('stock_final_movil', 10, 2);

            $table->string('observaciones', 255)->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('id_usuario')->references('id')->on('users');
            $table->foreign('id_estanque_movil')->references('id_estanque')->on('estanques');
            $table->foreign('id_faena')->references('id_faena')->on('faenas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trasvasijes_fijo_a_movil');
    }
};
