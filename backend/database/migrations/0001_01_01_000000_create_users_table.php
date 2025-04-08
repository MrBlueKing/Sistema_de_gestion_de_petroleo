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
        // Crear tabla de usuarios
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('rut', 12)->unique();
            $table->string('nombre', 100);
            $table->string('email')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->unsignedBigInteger('id_faena')->nullable();
            $table->tinyInteger('estado')->default(1);
            $table->timestamps();
            
            // Solo esta clave foránea
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('cascade');            
        });

        // Crear tabla para los tokens de restablecimiento de contraseña
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();  // Email del usuario
            $table->string('token');  // Token para restablecer contraseña
            $table->timestamp('created_at')->nullable();  // Fecha de creación del token
        });

        // Crear tabla para sesiones de los usuarios
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();  // ID de sesión
            $table->foreignId('user_id')->nullable()->index();  // ID del usuario relacionado
            $table->string('ip_address', 45)->nullable();  // Dirección IP del usuario
            $table->text('user_agent')->nullable();  // Agente de usuario
            $table->longText('payload');  // Información de la sesión
            $table->integer('last_activity')->index();  // Última actividad de la sesión
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar las tablas si se deshacen las migraciones
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
