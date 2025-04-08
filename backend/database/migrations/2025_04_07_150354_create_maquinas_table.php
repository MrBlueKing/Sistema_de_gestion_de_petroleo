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
        Schema::create('maquinas', function (Blueprint $table) {
            $table->id('id_maquina'); // id_auto_increment
            $table->unsignedBigInteger('id_categoria'); // Relación con categorias_maquinas
            $table->string('nombre_maquina', 100); // Nombre de la máquina
            $table->enum('tipo_maquina', ['Interno', 'Externo']); // Tipo de máquina (Interno o Externo)
            $table->enum('estado', ['operativo', 'en_mantenimiento', 'fuera_de_servicio'])->default('operativo'); // Estado de la máquina
            $table->timestamps(); // Campos created_at y updated_at

            // Definir la clave foránea
            $table->foreign('id_categoria')->references('id_categoria')->on('categorias_maquinas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maquinas');
    }
};
