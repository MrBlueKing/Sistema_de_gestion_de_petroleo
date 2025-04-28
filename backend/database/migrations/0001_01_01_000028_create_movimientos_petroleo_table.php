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
        Schema::create('movimientos_petroleo', function (Blueprint $table) {
            $table->id('id_movimiento');
            $table->unsignedBigInteger('id_faena');
            $table->enum('tipo_movimiento', ['ingreso', 'consumo']); // Tipo de movimiento
            $table->unsignedBigInteger('id_referencia'); // ID del ingreso o consumo
            $table->decimal('cantidad', 10, 2); // Cantidad en litros (positiva para ingresos, negativa para consumos)
            $table->decimal('stock_anterior', 12, 2); // Stock antes del movimiento
            $table->decimal('stock_actual', 12, 2); // Stock después del movimiento
            $table->unsignedBigInteger('id_usuario'); // Usuario que registró el movimiento
            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('cascade');
            $table->foreign('id_usuario')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_petroleo');
    }
};
