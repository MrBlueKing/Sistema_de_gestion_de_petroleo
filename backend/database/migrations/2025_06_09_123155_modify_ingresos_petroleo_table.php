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
            // Agregar tipo de recepción (solo desde Copec)
            $table->enum('tipo_recepcion', ['estanques_fijos', 'estanque_movil'])
                ->default('estanques_fijos')
                ->after('numero_guia')
                ->comment('Tipo de recepción desde Copec: a estanques fijos o a estanque móvil');

            // Agregar referencia al estanque móvil
            $table->unsignedBigInteger('id_estanque_movil')
                ->nullable()
                ->after('id_faena')
                ->comment('ID del estanque móvil (solo para recepciones tipo estanque_movil)');

            // Agregar foreign key
            $table->foreign('id_estanque_movil')
                ->references('id_estanque')
                ->on('estanques')
                ->onDelete('set null');

            // Agregar índices
            $table->index('tipo_recepcion');
            $table->index(['tipo_recepcion', 'id_faena']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingresos_petroleo', function (Blueprint $table) {
            // Eliminar foreign key e índices
            $table->dropForeign(['id_estanque_movil']);
            $table->dropIndex(['ingresos_petroleo_tipo_recepcion_index']);
            $table->dropIndex(['ingresos_petroleo_tipo_recepcion_id_faena_index']);

            // Eliminar columnas
            $table->dropColumn(['tipo_recepcion', 'id_estanque_movil']);
        });
    }
};
