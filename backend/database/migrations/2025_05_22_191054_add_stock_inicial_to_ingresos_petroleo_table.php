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
        Schema::table('ingresos_petroleo', function (Blueprint $table) {
            $table->decimal('stock_inicial', 10, 2)->after('id_faena')->comment('Stock total del sistema antes del ingreso');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingresos_petroleo', function (Blueprint $table) {
            $table->dropColumn('stock_inicial');
        });
    }
};