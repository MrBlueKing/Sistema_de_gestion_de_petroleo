<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('actividades_falla', function (Blueprint $table) {
            $table->unsignedBigInteger('id_mecanico')->nullable()->after('id_falla');
            $table->foreign('id_mecanico', 'fk_actividad_mecanico')->references('id')->on('mecanicos')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('actividades_falla', function (Blueprint $table) {
            $table->dropForeign('fk_actividad_mecanico');
            $table->dropColumn('id_mecanico');
        });
    }
};
