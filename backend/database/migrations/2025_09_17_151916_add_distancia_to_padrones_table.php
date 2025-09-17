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
        Schema::table('padrones', function (Blueprint $table) {
            // 1. Eliminar la columna empresa si existe
            if (Schema::hasColumn('padrones', 'empresa')) {
                $table->dropColumn('empresa');
            }
            
            // 2. Agregar la columna id_empresa con referencia a empresas
            $table->unsignedBigInteger('id_empresa')->after('id_padron');
            
            // 3. Agregar la columna distancia
            $table->decimal('distancia', 8, 2)->nullable()->after('capacidad');
            
            // 4. Crear la foreign key hacia empresas
            $table->foreign('id_empresa')->references('id')->on('empresas')
                  ->onUpdate('cascade')
                  ->onDelete('restrict');
        });
        
        // 5. Si existen registros en la tabla, asignar valor 1 a id_empresa
        $existingRecords = DB::table('padrones')->count();
        if ($existingRecords > 0) {
            DB::table('padrones')->update(['id_empresa' => 1]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('padrones', function (Blueprint $table) {
            // Eliminar la foreign key
            $table->dropForeign(['id_empresa']);
            
            // Eliminar las columnas agregadas
            $table->dropColumn(['id_empresa', 'distancia']);
            
            // Opcional: recrear la columna empresa si existía antes
            // $table->string('empresa', 100)->nullable();
        });
    }
};