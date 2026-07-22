<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalogo_insumos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_categoria');
            $table->string('tipo');
            $table->string('detalle');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('id_categoria', 'fk_catalogo_insumo_categoria')->references('id_categoria')->on('categorias_maquinas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogo_insumos');
    }
};
