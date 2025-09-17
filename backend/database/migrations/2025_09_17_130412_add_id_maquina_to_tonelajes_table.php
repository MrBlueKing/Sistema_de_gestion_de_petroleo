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
        Schema::table('tonelajes', function (Blueprint $table) {
            // Añadimos la columna después de id_padron para mantener orden lógico
            $table->unsignedBigInteger('id_maquina')->after('id_padron');

            // Clave foránea
            $table->foreign('id_maquina')
                ->references('id_maquina')
                ->on('maquinas')
                ->onDelete('cascade');

            // Si quieres evitar duplicados por padrón, máquina y fecha_produccion:
            $table->unique(['id_padron', 'id_maquina', 'fecha_produccion']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tonelajes', function (Blueprint $table) {
            // Primero eliminar restricción y luego la columna
            $table->dropForeign(['id_maquina']);
            $table->dropUnique(['id_padron', 'id_maquina', 'fecha_produccion']);
            $table->dropColumn('id_maquina');
        });
    }
};
