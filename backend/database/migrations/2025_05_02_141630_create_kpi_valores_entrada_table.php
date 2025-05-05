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
        Schema::create('kpi_valores_entrada', function (Blueprint $table) {
            $table->bigIncrements('id_valores_entrada');
            $table->unsignedBigInteger('id_informe');
            $table->decimal('ley_mineral', 10, 2);
            $table->decimal('toneladas_extraidas', 12, 2);
            $table->decimal('horas_trabajadas', 10, 2);
            $table->decimal('combustible_consumido', 12, 2);
            $table->decimal('kilometros_recorridos', 12, 2);
            $table->integer('numero_viajes');
            $table->decimal('rendimiento_base', 5, 2);
            $table->decimal('precio_combustible', 10, 2);
            $table->timestamps();

            $table->foreign('id_informe')->references('id_informe')->on('informes_kpi')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_valores_entrada');
    }
};
