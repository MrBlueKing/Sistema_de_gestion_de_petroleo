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
        Schema::table('maquinas', function (Blueprint $table) {
            $table->string('patente', 20)->nullable(); // La longitud de 20 es un ejemplo, ajusta según tus necesidades
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maquinas', function (Blueprint $table) {
            //
        });
    }
};
