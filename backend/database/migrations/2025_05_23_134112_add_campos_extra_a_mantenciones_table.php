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
        Schema::table('mantenciones', function (Blueprint $table) {
            // Agregar tipo de mantenimiento
            $table->enum('tipo_mantenimiento', ['preventivo', 'correctivo', 'mayor'])
                ->default('preventivo')
                ->after('proxima_mantencion');

            // Agregar quién realizó la mantención
            $table->unsignedBigInteger('realizado_por')->nullable()->after('tipo_mantenimiento');
            $table->foreign('realizado_por')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('mantenciones', function (Blueprint $table) {
            $table->dropForeign(['realizado_por']);
            $table->dropColumn(['tipo_mantenimiento', 'realizado_por']);
        });
    }
};
