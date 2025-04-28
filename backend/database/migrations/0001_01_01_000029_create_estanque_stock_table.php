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
        Schema::create('estanque_stock', function (Blueprint $table) {
            $table->id('id_estanque_stock');
            $table->unsignedBigInteger('id_estanque');
            $table->decimal('stock_actual', 10, 2)->default(0); // Stock actual en litros
            $table->decimal('altura_actual', 8, 2)->nullable(); // Altura actual en cm o metros
            $table->timestamp('ultima_medicion')->nullable();
            $table->timestamps();

            $table->foreign('id_estanque')->references('id_estanque')->on('estanques')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estanque_stock');
    }
};
