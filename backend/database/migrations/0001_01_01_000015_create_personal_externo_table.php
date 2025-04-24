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
        Schema::create('personal_externo', function (Blueprint $table) {
            $table->id('id_personal'); // id_auto_increment
            $table->unsignedBigInteger('id_dotacion'); // Relación con solicitantes
            $table->string('nombre'); // Nombre del personal
            $table->string('rut', 12)->unique()->nullable(); // RUT del personal
            $table->unsignedBigInteger('id_empresa'); // Relación con empresas_externas
            $table->timestamps(); // Campos de created_at y updated_at

            // Definimos las claves foráneas
            $table->foreign('rut')->references('rut')->on('solicitantes')->onDelete('cascade');
            $table->foreign('id_empresa')->references('id_empresa')->on('empresas_externas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_externo');
    }
};
