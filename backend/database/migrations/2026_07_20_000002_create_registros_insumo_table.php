<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registros_insumo', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_maquina');
            $table->unsignedBigInteger('id_catalogo_insumo');
            $table->date('fecha');
            $table->text('observaciones')->nullable();
            $table->unsignedBigInteger('creado_por')->nullable();
            $table->timestamps();

            $table->foreign('id_maquina', 'fk_registro_insumo_maquina')->references('id_maquina')->on('maquinas');
            $table->foreign('id_catalogo_insumo', 'fk_registro_insumo_catalogo')->references('id')->on('catalogo_insumos');
            $table->foreign('creado_por', 'fk_registro_insumo_usuario')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registros_insumo');
    }
};
