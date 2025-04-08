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
        Schema::create('categorias_maquinas', function (Blueprint $table) {
            $table->id('id_categoria'); // id_auto_increment
            $table->string('nombre_categoria', 100); // Nombre de la categoría
            $table->enum('tipo_medicion', ['Kilometraje', 'Horometro']); // Tipo de medición (Kilometraje o Horometro)
            $table->timestamps(); // Campos de created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categorias_maquinas');
    }
};
