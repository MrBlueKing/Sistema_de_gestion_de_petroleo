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
        Schema::create('maquinas_externas', function (Blueprint $table) {
            $table->unsignedBigInteger('id_maquina'); // Relación con la tabla maquinas
            $table->unsignedBigInteger('id_empresa'); // Relación con la tabla empresas_externas
            $table->string('nombre_contacto')->nullable();
            $table->primary('id_maquina');
        
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas')->onDelete('cascade');
            $table->foreign('id_empresa')->references('id_empresa')->on('empresas_externas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maquinas_externas');
    }
};
