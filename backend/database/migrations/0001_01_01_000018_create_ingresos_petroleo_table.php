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
        Schema::create('ingresos_petroleo', function (Blueprint $table) {
            $table->id('id_ingreso'); // AUTO_INCREMENT PRIMARY KEY
            $table->unsignedBigInteger('id_usuario'); // FK a usuarios
            $table->string('numero_guia'); // VARCHAR(255)
            $table->decimal('litros_documentados', 10, 2); // según guía
            $table->decimal('litros_recibidos', 10, 2); // verificados por medición
            $table->decimal('precio', 10, 2); // Precio por litro
            $table->decimal('precio_total', 12, 2)->nullable(); // Precio total (calculado)
            $table->boolean('recibo_conforme')->default(1); // TINYINT(1)
            $table->string('observacion', 255)->nullable(); // observación opcional
            $table->unsignedBigInteger('id_faena')->nullable(); // FK opcional a faenas
            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_usuario')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingresos_petroleo');
    }
};
