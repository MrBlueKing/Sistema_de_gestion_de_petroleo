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
        Schema::create('permisos_maquinas_faenas', function (Blueprint $table) {
            $table->unsignedBigInteger('id_maquina');  // Relación con la tabla maquinas
            $table->unsignedBigInteger('id_faena');    // Relación con la tabla faena

            // Definir las claves primarias compuestas
            $table->primary(['id_maquina', 'id_faena']);

            // Definir las claves foráneas
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas')->onDelete('cascade');
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permisos_maquinas_faenas');
    }
};
