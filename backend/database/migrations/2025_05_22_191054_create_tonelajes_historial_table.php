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
        Schema::create('tonelajes_historial', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_tonelaje');

            // Valores anteriores
            $table->decimal('tonelaje_anterior', 10, 2);
            $table->decimal('ley_anterior', 5, 2)->nullable();
            $table->unsignedInteger('viajes_anterior');

            // Valores nuevos
            $table->decimal('tonelaje_nuevo', 10, 2);
            $table->decimal('ley_nueva', 5, 2)->nullable();
            $table->unsignedInteger('viajes_nuevo');

            $table->text('motivo');
            $table->string('accion', 50); // 'creacion', 'modificacion'
            $table->timestamp('fecha_cambio');

            $table->foreign('id_tonelaje')->references('id_tonelaje')->on('tonelajes')->onDelete('cascade');
            $table->index(['id_tonelaje', 'fecha_cambio']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tonelajes_historial');
    }
};
