<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registros_insumo', function (Blueprint $table) {
            $table->unsignedBigInteger('id_responsable')->nullable()->after('observaciones');
            $table->foreign('id_responsable', 'fk_registro_insumo_responsable')->references('id')->on('mecanicos')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('registros_insumo', function (Blueprint $table) {
            $table->dropForeign('fk_registro_insumo_responsable');
            $table->dropColumn('id_responsable');
        });
    }
};
