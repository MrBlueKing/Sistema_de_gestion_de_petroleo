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
        Schema::create('kpi_resultados', function (Blueprint $table) {
            $table->bigIncrements('id_resultado');
            $table->unsignedBigInteger('id_informe');
            $table->string('codigo_kpi', 50);
            $table->string('titulo', 100);
            $table->string('valor', 50);
            $table->string('unidad', 20)->nullable();
            $table->string('cambio', 20)->nullable();
            $table->boolean('es_positivo')->nullable();
            $table->string('color', 20)->nullable();
            $table->string('descripcion', 255)->nullable();
            $table->timestamps();

            $table->unique(['id_informe', 'codigo_kpi']);
            $table->foreign('id_informe')->references('id_informe')->on('informes_kpi')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_resultados');
    }
};
