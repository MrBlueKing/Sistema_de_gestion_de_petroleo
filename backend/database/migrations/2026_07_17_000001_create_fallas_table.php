<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fallas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_maquina');
            $table->decimal('horometro', 10, 2);
            $table->dateTime('fecha')->useCurrent();
            $table->text('descripcion');
            $table->enum('estado', ['abierta', 'en_reparacion', 'cerrada'])->default('abierta');
            $table->dateTime('fecha_cierre')->nullable();
            $table->text('observaciones_finales')->nullable();
            $table->unsignedBigInteger('creado_por')->nullable();
            $table->timestamps();

            $table->foreign('id_maquina', 'fk_falla_maquina')->references('id_maquina')->on('maquinas');
            $table->foreign('creado_por', 'fk_falla_usuario')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fallas');
    }
};
