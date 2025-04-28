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
        Schema::create('estanques', function (Blueprint $table) {
            $table->id('id_estanque');
            $table->string('nombre', 255); // Nombre o identificador del estanque
            $table->decimal('capacidad', 10, 2); // capacidad máxima en litros
            $table->decimal('altura_nominal', 8, 2); // altura máxima en cm o metros
            $table->unsignedBigInteger('id_faena'); // Faena a la que pertenece el estanque
            $table->boolean('activo')->default(true); // Si el estanque está activo o no
            $table->timestamps();

            // Clave foránea a faena
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estanques');
    }
};
