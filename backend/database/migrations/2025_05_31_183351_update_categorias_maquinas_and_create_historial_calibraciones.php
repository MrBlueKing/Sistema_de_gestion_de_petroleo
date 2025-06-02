<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         // 1. Agregar columnas chc y hrc a la tabla categorias_maquinas
        Schema::table('categorias_maquinas', function (Blueprint $table) {
            $table->decimal('chc', 10, 2)->default(10.00)->after('horas_mantencion')
                  ->comment('Consumo por Hora Cronológica (L/hrc)');
            $table->decimal('hrc', 10, 2)->default(7.00)->after('chc')
                  ->comment('Horas Cronológicas estándar por día');
        });

        // 2. Actualizar datos existentes para algunas categorías
        DB::table('categorias_maquinas')->where('nombre_categoria', 'Dumper')->update([
            'chc' => 10.00,
            'hrc' => 7.00,
        ]);

        DB::table('categorias_maquinas')->where('nombre_categoria', 'Camion')->update([
            'chc' => 8.00,
            'hrc' => 8.00,
        ]);

        // 3. Crear tabla historial_calibraciones
        Schema::create('historial_calibraciones', function (Blueprint $table) {
            $table->id('id_calibracion');
            $table->unsignedBigInteger('id_categoria');
            $table->integer('mes');
            $table->integer('año');
            $table->decimal('chc_anterior', 10, 2);
            $table->decimal('chc_nuevo', 10, 2);
            $table->decimal('consumo_total_mes', 12, 2)->nullable();
            $table->integer('maquinas_activas')->nullable();
            $table->timestamp('fecha_calibracion')->useCurrent();

            $table->foreign('id_categoria')->references('id_categoria')->on('categorias_maquinas')->onDelete('cascade');
            $table->index(['id_categoria', 'año', 'mes'], 'idx_categoria_periodo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         // Eliminar tabla historial_calibraciones
        Schema::dropIfExists('historial_calibraciones');

        // Eliminar columnas chc y hrc de categorias_maquinas
        Schema::table('categorias_maquinas', function (Blueprint $table) {
            $table->dropColumn(['chc', 'hrc']);
        });
    }
};
