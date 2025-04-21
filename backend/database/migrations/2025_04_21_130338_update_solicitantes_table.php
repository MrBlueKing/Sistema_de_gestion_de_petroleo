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
        Schema::table('solicitantes', function (Blueprint $table) {
            // Renombrar la columna actual de clave primaria
            $table->renameColumn('id_dotacion', 'id');

            // Agregar nueva columna id_dotacion
            $table->unsignedBigInteger('id_dotacion')->nullable()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('solicitantes', function (Blueprint $table) {
            // Revertir los cambios
            $table->renameColumn('id', 'id_dotacion');
            $table->dropColumn('id_dotacion');
        });
    }
};
