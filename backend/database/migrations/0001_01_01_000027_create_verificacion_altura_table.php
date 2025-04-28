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
        Schema::create('verificacion_altura', function (Blueprint $table) {
            $table->id('id_verificacion');
            $table->unsignedBigInteger('id_ingreso'); // Relación con ingreso de petróleo
            $table->unsignedBigInteger('id_estanque');
            $table->decimal('altura_antes', 8, 2); // Altura antes del ingreso
            $table->decimal('altura_despues', 8, 2); // Altura después del ingreso
            $table->decimal('volumen_calculado', 10, 2); // Volumen calculado según diferencia de alturas
            $table->boolean('verificado')->default(false); // Indica si la verificación está completa
            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_ingreso')->references('id_ingreso')->on('ingresos_petroleo')->onDelete('cascade');
            $table->foreign('id_estanque')->references('id_estanque')->on('estanques')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verificacion_altura');
    }
};
