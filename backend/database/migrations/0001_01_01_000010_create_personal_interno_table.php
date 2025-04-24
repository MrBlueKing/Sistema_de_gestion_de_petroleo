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
            $table->id('id_personal_interno'); // PK autoincremental
            $table->string('rut', 12); // Relación con solicitantes por rut
            $table->string('nombre');
            $table->string('apellido')->nullable();
            $table->string('cargo')->nullable();
            $table->string('ubicacion')->nullable();
            $table->timestamps();

            $table->unique('rut'); // Asegura que rut sea único
            $table->foreign('rut')->references('rut')->on('solicitantes')->onDelete('cascade');
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
