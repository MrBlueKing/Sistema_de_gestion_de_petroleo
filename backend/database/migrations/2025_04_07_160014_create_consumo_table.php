<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('consumos', function (Blueprint $table) {
            $table->id('id_consumo'); // id_auto_increment
            $table->unsignedBigInteger('id_dotacion'); // Relación con solicitante
            $table->unsignedBigInteger('id_equipo'); // Relación con Maquina
            $table->unsignedBigInteger('id_usuario'); // Relación con Usuario
            $table->timestamp('fecha_consumo')->default(DB::raw('CURRENT_TIMESTAMP')); // Definimos la fecha con el valor por defecto
            $table->decimal('litros_consumidos', 10, 2); // Litros consumidos
            $table->unsignedBigInteger('id_faena')->nullable(); // Relación con Faena
            $table->decimal('medicion', 10, 3)->nullable(); // Medición
            $table->decimal('numeral_inicial', 10, 3)->nullable(); // Numeral inicial
            $table->decimal('numeral_final', 10, 3)->nullable(); // Numeral final

            // Clave primaria
            $table->primary('id_consumo');

            // Definición de claves foráneas
            $table->foreign('id_dotacion')->references('id_dotacion')->on('solicitantes')->onDelete('cascade');
            $table->foreign('id_equipo')->references('id_maquina')->on('maquinas')->onDelete('cascade');
            $table->foreign('id_usuario')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_faena')->references('id_faena')->on('faenas')->onDelete('set null');

            // Timestamps (created_at, updated_at)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consumo');
    }
};
