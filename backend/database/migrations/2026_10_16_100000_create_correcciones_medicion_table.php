<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Historial de correcciones de horómetro / kilometraje de los consumos
 * (pestaña "Horómetros y km" del Administrador). Cada fila guarda el valor
 * anterior y el nuevo de consumos.medicion, quién lo cambió y un motivo opcional.
 * Las correcciones de un tramo (varias lecturas juntas) comparten `lote`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('correcciones_medicion', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_consumo');
            $table->unsignedBigInteger('id_maquina');
            $table->decimal('medicion_anterior', 10, 3)->nullable();
            $table->decimal('medicion_nueva', 10, 3);
            $table->string('motivo', 500)->nullable();
            $table->string('lote', 36);
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('usuario_nombre', 150)->nullable();
            $table->timestamps();

            $table->index('id_consumo');
            $table->index(['id_maquina', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('correcciones_medicion');
    }
};
