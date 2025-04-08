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
        Schema::create('maquinas_internas', function (Blueprint $table) {
            $table->unsignedBigInteger('id_maquina');  // Relación con la tabla maquinas
            $table->string('patente', 15)->unique();   // Campo patente con restricción única
            $table->primary('id_maquina');  // Definir la clave primaria

            // Relación con la tabla maquinas
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maquinas_internas');
    }
};
