<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividades_falla', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_falla');
            $table->string('descripcion');
            $table->enum('tipo', ['I', 'E']);
            $table->decimal('tiempo_estimado', 10, 2);
            $table->unsignedInteger('orden');
            $table->date('fecha_inicio_planificada');
            $table->date('fecha_inicio_real')->nullable();
            $table->decimal('tiempo_real', 10, 2)->nullable();
            $table->date('fecha_fin_real')->nullable();
            $table->timestamps();

            $table->foreign('id_falla', 'fk_actividad_falla')->references('id')->on('fallas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividades_falla');
    }
};
