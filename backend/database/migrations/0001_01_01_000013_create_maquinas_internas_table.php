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
        Schema::create('maquinas_internas', function (Blueprint $table) {
            $table->id('id_maquina_interna'); // Clave primaria propia
            $table->unsignedBigInteger('id_maquina');  // FK a la tabla maquinas
            $table->string('patente', 15)->unique();   // Patente única
            $table->string('nombre', 100);             // Nombre de la máquina
            $table->string('categoria', 100);          // O puedes hacer FK si es tabla aparte
            $table->timestamps();                      // created_at y updated_at
        
            // Foreign key
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas')->onDelete('cascade');
        });        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maquinas_internas');
    }
};
