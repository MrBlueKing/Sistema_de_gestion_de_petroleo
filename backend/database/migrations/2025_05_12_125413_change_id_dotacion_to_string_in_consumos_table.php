<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consumos', function (Blueprint $table) {
            // Primero eliminamos la restricción de clave foránea
            $table->dropForeign(['id_dotacion']);

            // Luego cambiamos el tipo de dato de la columna
            $table->string('id_dotacion', 12)->change();
        });
    }

    public function down(): void
    {
        Schema::table('consumos', function (Blueprint $table) {
            // Revertimos el tipo de dato
            $table->unsignedBigInteger('id_dotacion')->change();

            // Restauramos la clave foránea
            $table->foreign('id_dotacion')->references('id')->on('solicitantes')->onDelete('cascade');
        });
    }
};
