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
         Schema::create('asignaciones_user_maquinas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_user'); // ✅ Cambio aquí
            $table->unsignedBigInteger('id_maquina');
            $table->date('fecha_asignacion');
            $table->boolean('activo')->default(true);
            $table->text('observaciones')->nullable();
            $table->timestamps();

            // Índices para mejor rendimiento
            $table->index(['id_user', 'activo']); // ✅ Cambio aquí
            $table->index(['id_maquina', 'activo']);

            // Clave única para evitar asignaciones duplicadas activas
            $table->unique(['id_user', 'id_maquina', 'activo'], 'unique_asignacion_activa'); // ✅ Cambio aquí

            // Claves foráneas
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade'); // ✅ Cambio aquí
            $table->foreign('id_maquina')->references('id_maquina')->on('maquinas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asignaciones_personal_maquinas');
    }
};
