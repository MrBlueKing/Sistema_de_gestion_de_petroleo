<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tonelajes', function (Blueprint $table) {
            $table->id('id_tonelaje');
            $table->unsignedBigInteger('id_padron');
            $table->date('fecha_produccion'); // Fecha del día que se extrajo
            $table->decimal('tonelaje', 10, 2);
            $table->decimal('ley', 5, 2)->nullable();
            $table->unsignedInteger('viajes')->default(0);

            // Control de modificaciones
            $table->boolean('fue_modificado')->default(false);
            $table->text('motivo_modificacion')->nullable();
            $table->timestamp('fecha_modificacion')->nullable();

            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_padron')->references('id_padron')->on('padrones')->onDelete('cascade');

            // UN REGISTRO POR PADRÓN POR DÍA
            $table->unique(['id_padron', 'fecha_produccion']);

            // Índices para consultas frecuentes
            $table->index('fecha_produccion');
            $table->index(['id_padron', 'fecha_produccion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tonelajes');
    }
};
