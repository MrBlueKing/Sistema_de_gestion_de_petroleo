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
        Schema::table('asignaciones_user_maquinas', function (Blueprint $table) {
            // Eliminar la clave única actual
            $table->dropUnique('unique_asignacion_activa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asignaciones_user_maquinas', function (Blueprint $table) {
            // Restaurar la clave única original
            $table->unique(['id_user', 'id_maquina', 'activo'], 'unique_asignacion_activa');
        });
    }
};
