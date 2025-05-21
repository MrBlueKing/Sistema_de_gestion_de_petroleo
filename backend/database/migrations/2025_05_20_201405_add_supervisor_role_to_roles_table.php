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
        Schema::table('roles', function (Blueprint $table) {
            Schema::table('roles', function (Blueprint $table) {
                // Modificar el ENUM para permitir 'supervisor'
                $table->enum('rol', ['admin', 'bombero', 'gerente', 'toneladas', 'planificador'])->change();
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Revertir el cambio si haces rollback
            $table->enum('rol', ['admin', 'bombero', 'gerente'])->change();
        });
    }
};
