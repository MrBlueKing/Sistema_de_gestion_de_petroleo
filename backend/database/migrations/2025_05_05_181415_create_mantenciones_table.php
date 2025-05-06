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
        Schema::create('mantenciones', function (Blueprint $table) {
            $table->id('id_mantencion');    
            $table->unsignedBigInteger('id_maquina');
            $table->dateTime('fecha_mantencion');
            $table->decimal('horas_kilometros_actuales', 10, 2);
            $table->decimal('proxima_mantencion', 10, 2);
            $table->text('observaciones')->nullable();
            $table->timestamps();
    
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mantenciones');
    }
};
