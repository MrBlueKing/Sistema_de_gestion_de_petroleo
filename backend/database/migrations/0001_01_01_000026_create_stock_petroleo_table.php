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
        Schema::create('stock_petroleo', function (Blueprint $table) {
            $table->id('id_stock');
            $table->unsignedBigInteger('id_faena');
            $table->decimal('stock_actual', 12, 2)->default(0); // Stock actual en litros
            $table->timestamp('ultima_actualizacion')->useCurrent();
            $table->timestamps();

            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_petroleo');
    }
};
