<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::table('cargas_externas', function (Blueprint $table) {
            // Agregar columna medicion
            $table->decimal('medicion', 10, 3)->default(0)->after('litros');

            // ✅ AGREGAR NUEVA COLUMNA id_faena (llave foránea)
            $table->unsignedBigInteger('id_faena')->after('medicion');

            // ✅ AÑADIR LLAVE FORÁNEA
            $table->foreign('id_faena')
                ->references('id_faena')
                ->on('faenas')
                ->onDelete('restrict');

            // ✅ MANTENER ubicacion como texto
            $table->string('ubicacion', 255)->nullable()->change();

            // ✅ ELIMINAR COLUMNA fecha_carga
            $table->dropColumn('fecha_carga');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cargas_externas', function (Blueprint $table) {
            // ✅ ELIMINAR LLAVE FORÁNEA PRIMERO
            $table->dropForeign(['id_faena']);
            
            // ✅ ELIMINAR COLUMNA id_faena
            $table->dropColumn('id_faena');
            
            // Eliminar columna medicion
            $table->dropColumn('medicion');

            // ✅ VOLVER ubicacion a string como estaba originalmente
            $table->string('ubicacion', 100)->change();

            // ✅ RESTAURAR COLUMNA fecha_carga
            $table->datetime('fecha_carga')->nullable();
        });
    }
};
