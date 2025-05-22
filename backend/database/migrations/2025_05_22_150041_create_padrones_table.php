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
        Schema::create('padrones', function (Blueprint $table) {
            $table->id('id_padron');
            $table->unsignedBigInteger('id_faena');
            $table->unsignedBigInteger('id_planta'); // DIRECTO A PLANTA
            $table->string('nombre', 100);
            $table->string('empresa', 100);
            $table->decimal('capacidad', 10, 2);
            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('cascade');
            $table->foreign('id_planta')->references('id_planta')->on('plantas')->onDelete('cascade');

            // Un padrón solo puede estar en una planta por faena
            $table->unique(['id_faena', 'nombre']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('padrones');
    }
};
