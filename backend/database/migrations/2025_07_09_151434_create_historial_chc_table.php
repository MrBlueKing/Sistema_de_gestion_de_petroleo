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
       Schema::create('historial_chc', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_categoria');
            $table->decimal('chc_calculado', 10, 4); // CHC calculado
            $table->decimal('chc_anterior', 10, 4)->nullable(); // CHC que tenía antes
            $table->integer('anio'); // 2025
            $table->integer('mes'); // 1-12
            $table->date('periodo_inicio'); // Primer día del mes calculado
            $table->date('periodo_fin'); // Último día del mes calculado
            
            // Datos del cálculo
            $table->decimal('total_litros', 12, 2); // Sumatoria de litros del mes
            $table->integer('dias_periodo'); // Días desde primer al último consumo
            $table->decimal('hrc_utilizado', 6, 2); // HRC usado en el cálculo (actualmente 7)
            $table->integer('total_consumos'); // Cantidad de consumos en el período
            $table->integer('maquinas_activas'); // Máquinas que consumieron en el período
            
            // Metadatos
            $table->timestamp('calculado_en'); // Cuándo se hizo el cálculo
            $table->string('metodo_calculo')->default('automatico_mensual'); // Para futuras variaciones
            $table->json('detalle_calculo')->nullable(); // Info adicional del cálculo
            
            $table->timestamps();
            
            // Índices
            $table->foreign('id_categoria')->references('id_categoria')->on('categorias_maquinas');
            $table->unique(['id_categoria', 'anio', 'mes'], 'unique_categoria_periodo');
            $table->index(['anio', 'mes']);
            $table->index(['calculado_en']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_chc');
    }
};
