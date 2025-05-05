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
        Schema::create('kpi_historico', function (Blueprint $table) {
            $table->bigIncrements('id_historico');
            $table->unsignedBigInteger('id_faena')->nullable();
            $table->unsignedBigInteger('id_informe')->nullable(); // ← NUEVO CAMPO
            $table->string('codigo_kpi', 50);
            $table->decimal('valor', 12, 4);
            $table->date('fecha');
            $table->enum('periodo', ['diario', 'semanal', 'mensual', 'trimestral', 'anual']);
            $table->timestamps();

            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('set null');
            $table->foreign('id_informe')->references('id_informe')->on('informes_kpi')->onDelete('set null'); // ← RELACIÓN NUEVA
            $table->index('codigo_kpi');
            $table->index(['fecha', 'periodo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_historico');
    }
};
