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
        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->renameColumn('litros_calculados', 'stock_inicial');
        });

        // Si tu base de datos permite comentarios (ej. MySQL), puedes agregar uno así:
        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->decimal('stock_inicial', 10, 2)
                ->nullable()
                ->comment('Valor stock inicial de cada estanque')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->renameColumn('stock_inicial', 'litros_calculados');
        });

        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->decimal('litros_calculados', 10, 2)
                ->nullable()
                ->comment(null) // o puedes eliminar el comentario
                ->change();
        });
    }
};
