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
            $table->decimal('stock_inicial', 10, 2)
                ->nullable()
                ->comment('Stock antes del ingreso (puede ser NULL para casos especiales)')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingresos_petroleo', function (Blueprint $table) {
            $table->decimal('stock_inicial', 10, 2)
                ->nullable(false)
                ->change();
        });
    }
};
