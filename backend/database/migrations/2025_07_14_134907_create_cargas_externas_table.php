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
        Schema::create('cargas_externas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_user'); // ✅ Cambio aquí
            $table->unsignedBigInteger('id_maquina');
            $table->string('numero_boleta', 50); // ✅ Corregí el nombre del campo
            $table->decimal('litros', 10, 3);
            $table->decimal('costo', 12, 3);
            $table->decimal('precio_por_litro', 8, 2)->nullable();
            $table->datetime('fecha_carga');
            $table->string('ubicacion', 100);
            $table->string('tipo_combustible', 30)->default('Diesel');
            $table->text('observaciones')->nullable();
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            $table->unsignedBigInteger('aprobado_por')->nullable();
            $table->datetime('fecha_aprobacion')->nullable();
            $table->text('motivo_rechazo')->nullable();
            $table->timestamps();

            // Índices para consultas eficientes
            $table->index(['id_user', 'fecha_carga']); // ✅ Cambio aquí
            $table->index(['id_maquina', 'fecha_carga']);
            $table->index(['estado', 'fecha_carga']);
            $table->index('numero_boleta');

            // Claves foráneas
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade'); // ✅ Cambio aquí
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas')->onDelete('cascade');
            $table->foreign('aprobado_por')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cargas_externas');
    }
};
