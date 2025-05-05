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
        Schema::create('informes_kpi', function (Blueprint $table) {
            $table->bigIncrements('id_informe');
            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_faena')->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->enum('periodo', ['diario', 'semanal', 'mensual', 'trimestral', 'anual'])->default('mensual');
            $table->date('fecha_inicio_periodo');
            $table->date('fecha_fin_periodo');
            $table->string('titulo')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->foreign('id_usuario')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('informes_kpi');
    }
};
