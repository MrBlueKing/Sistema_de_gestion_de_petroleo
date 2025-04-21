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
            // Agrega el campo rut si no existe
            if (!Schema::hasColumn('solicitantes', 'rut')) {
                $table->string('rut')->unique()->after('id');
            }

            // Elimina el campo id_dotacion si existe
            if (Schema::hasColumn('solicitantes', 'id_dotacion')) {
                $table->dropColumn('id_dotacion');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('solicitantes', function (Blueprint $table) {
            // Restaurar id_dotacion
            $table->unsignedBigInteger('id_dotacion')->nullable();

            // Eliminar el campo rut
            $table->dropColumn('rut');
        });
    }
};
