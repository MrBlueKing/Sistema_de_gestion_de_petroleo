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
        Schema::table('categorias_maquinas', function (Blueprint $table) {
            $table->decimal('horas_mantencion', 10, 2)->default(0)->after('tipo_medicion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categorias_maquinas', function (Blueprint $table) {
            $table->dropColumn('horas_mantencion');
        });
    }
};
