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
        Schema::table('personal_interno', function (Blueprint $table) {
            // Eliminar la clave foránea y la columna 'id_dotacion' si existen
            if (Schema::hasColumn('personal_interno', 'id_dotacion')) {
                $table->dropForeign(['id_dotacion']);
                $table->dropColumn('id_dotacion');
            }

            // Asegurar que 'rut' sea NOT NULL y tenga índice único
            $table->string('rut', 12)->change();
            
            // Agregar la relación con 'solicitantes' por 'rut'
            $table->foreign('rut')->references('rut')->on('solicitantes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_interno', function (Blueprint $table) {
            // Quitar la nueva relación por rut
            $table->dropForeign(['rut']);

            // Restaurar columna id_dotacion
            $table->unsignedBigInteger('id_dotacion')->nullable()->after('id_personal_interno');
            $table->foreign('id_dotacion')->references('id')->on('solicitantes')->onDelete('cascade');
        });
    }
};
