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
        Schema::create('solicitantes', function (Blueprint $table) {
            $table->id('id'); // Define id_dotacion como AUTO_INCREMENT y clave primaria
            $table->unsignedBigInteger('id_dotacion'); // Relación con solicitantes
            $table->enum('tipo_personal', ['Interno', 'Externo']); // Definimos el tipo de personal
            $table->timestamps(); // Campos de created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitantes');
    }
};
