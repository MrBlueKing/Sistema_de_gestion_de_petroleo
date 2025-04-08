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
        Schema::create('empresas_externas', function (Blueprint $table) {
            $table->id('id_empresa'); // id_auto_increment
            $table->string('nombre'); // Nombre de la empresa
            $table->string('rut', 12)->unique()->nullable(); // RUT de la empresa
            $table->string('contacto', 150)->nullable(); // Información de contacto
            $table->timestamps(); // Campos de created_at y updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresas_externas');
    }
};
