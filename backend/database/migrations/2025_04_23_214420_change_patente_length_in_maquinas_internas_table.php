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
        Schema::table('maquinas_internas', function (Blueprint $table) {
            // Cambiar la longitud de la columna 'patente' a VARCHAR(50)
            $table->string('patente', 20)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maquinas_internas', function (Blueprint $table) {
            // Volver a la longitud anterior, por ejemplo, VARCHAR(20)
            $table->string('patente', 20)->change();
        });
    }
};
