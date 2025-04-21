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
        Schema::create('personal_interno', function (Blueprint $table) {
            $table->id('id_personal_interno'); // Esto es autoincremental
            $table->unsignedBigInteger('id_dotacion'); // Relación con solicitantes
            $table->string('nombre'); // Nombre del personal
            $table->string('rut', 12)->unique()->nullable(); // RUT del personal
            $table->string('apellido')->nullable(); // Apellido
            $table->string('cargo')->nullable(); // Cargo
            $table->string('ubicacion')->nullable(); // Ubicación
            $table->timestamps(); // Campos de created_at y updated_at

            // Definimos la clave foránea
            $table->foreign('id_dotacion')->references('rut')->on('solicitantes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_interno');
    }
};
