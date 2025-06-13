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
        Schema::create('trasvasijes_movil_a_fijo', function (Blueprint $table) {
            $table->id('id_trasvasije');

            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_estanque_movil')->comment('Estanque móvil origen');
            $table->unsignedBigInteger('id_estanque_fijo')->comment('Estanque fijo destino');
            $table->timestamp('fecha_trasvasije')->useCurrent();

            // Datos del estanque móvil
            $table->decimal('litros_movil_inicial', 10, 2)->comment('Litros que marca el móvil antes');
            $table->decimal('litros_movil_final', 10, 2)->comment('Litros que marca el móvil después');
            $table->decimal('litros_trasvasijados', 10, 2)->comment('Diferencia: inicial - final del móvil');

            // Datos del estanque fijo (altura)
            $table->decimal('altura_fijo_inicial', 10, 3)->comment('Altura del fijo antes (cm)');
            $table->decimal('altura_fijo_final', 10, 3)->comment('Altura del fijo después (cm)');
            $table->decimal('litros_calculados_altura', 10, 2)->nullable()->comment('Litros calculados por altura');
            $table->decimal('diferencia_medicion', 10, 2)->nullable()->comment('Diferencia entre móvil y altura');

            // Stocks
            $table->decimal('stock_inicial_movil', 10, 2);
            $table->decimal('stock_final_movil', 10, 2);
            $table->decimal('stock_inicial_fijo', 10, 2);
            $table->decimal('stock_final_fijo', 10, 2);

            $table->string('observaciones')->nullable();
            $table->boolean('verificado')->default(false)->comment('Si la diferencia fue verificada');
            $table->unsignedBigInteger('id_faena')->nullable();

            $table->timestamps();

            // Índices
            $table->index('fecha_trasvasije', 'idx_movil_fijo_fecha');
            $table->index(['id_estanque_movil', 'id_estanque_fijo'], 'idx_movil_fijo_estanques');

            // Llaves foráneas
            $table->foreign('id_usuario')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_estanque_movil')->references('id_estanque')->on('estanques')->onDelete('cascade');
            $table->foreign('id_estanque_fijo')->references('id_estanque')->on('estanques')->onDelete('cascade');
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trasvasijes_movil_a_fijo');
    }
};
