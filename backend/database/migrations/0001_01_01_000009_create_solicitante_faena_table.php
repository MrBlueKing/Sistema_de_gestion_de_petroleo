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
        Schema::create('solicitante_faena', function (Blueprint $table) {
            // Definimos las columnas de relación
            $table->unsignedBigInteger('id_dotacion'); // Relación con la tabla solicitantes
            $table->unsignedBigInteger('id_faena'); // Relación con la tabla faenas

            // Definir las claves primarias compuestas
            $table->primary(['id_dotacion', 'id_faena']);
            
            // Definir las claves foráneas
            $table->foreign('id_dotacion')
                ->references('id_dotacion')
                ->on('solicitantes')
                ->onDelete('cascade');

            $table->foreign('id_faena')
                ->references('id_faena')
                ->on('faenas')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitante_faena');
    }
};
