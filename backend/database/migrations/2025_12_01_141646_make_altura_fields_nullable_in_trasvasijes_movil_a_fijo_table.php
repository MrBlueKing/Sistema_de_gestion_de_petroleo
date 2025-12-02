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
        Schema::table('trasvasijes_movil_a_fijo', function (Blueprint $table) {
            // Hacer nullable los campos de altura para estanques manuales
            // Los estanques automáticos usan litros_fijo_inicial/final en su lugar
            $table->decimal('altura_fijo_inicial', 10, 3)->nullable()->change();
            $table->decimal('altura_fijo_final', 10, 3)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trasvasijes_movil_a_fijo', function (Blueprint $table) {
            // Revertir a NOT NULL (aunque esto podría fallar si hay registros con NULL)
            $table->decimal('altura_fijo_inicial', 10, 3)->nullable(false)->change();
            $table->decimal('altura_fijo_final', 10, 3)->nullable(false)->change();
        });
    }
};
