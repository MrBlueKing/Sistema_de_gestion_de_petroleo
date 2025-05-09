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
        Schema::table('kpi_valores_entrada', function (Blueprint $table) {
            $table->decimal('horas_trabajadas', 10, 2)
                ->default(0)
                ->comment('Horas totales trabajadas en el periodo');

            $table->decimal('rendimiento', 10, 2)
                ->default(0)
                ->comment('Rendimiento calculado (ton/camionada)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kpi_valores_entrada', function (Blueprint $table) {
            $table->dropColumn(['horas_trabajadas', 'rendimiento']);
        });
    }
};
