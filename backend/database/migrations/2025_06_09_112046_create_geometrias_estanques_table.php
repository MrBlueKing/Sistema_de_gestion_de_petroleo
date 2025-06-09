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
        Schema::create('geometrias_estanques', function (Blueprint $table) {
            $table->id('id_geometria');
            $table->unsignedBigInteger('id_estanque');
            $table->enum('tipo_geometria', ['cilindrico_horizontal', 'cilindrico_vertical', 'rectangular', 'otro'])
                ->default('cilindrico_horizontal');
            $table->string('nombre_geometria', 100)->comment('Nombre descriptivo de la configuración geométrica');

            // Dimensiones básicas
            $table->decimal('diametro', 8, 2)->nullable()->comment('Diámetro en cm (para cilíndricos)');
            $table->decimal('largo', 8, 2)->nullable()->comment('Largo en cm (cilíndrico horizontal o rectangular)');
            $table->decimal('ancho', 8, 2)->nullable()->comment('Ancho en cm (para rectangular)');
            $table->decimal('altura_maxima', 8, 2)->comment('Altura máxima del estanque en cm');

            // Metadatos
            $table->text('observaciones')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Claves foráneas
            $table->foreign('id_estanque')->references('id_estanque')->on('estanques')->onDelete('cascade');

            // Índices
            $table->unique('id_estanque', 'geometrias_estanques_estanque_unique');
            $table->index('tipo_geometria', 'idx_geometrias_tipo');
            $table->index('activo', 'idx_geometrias_activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('geometrias_estanques');
    }
};
