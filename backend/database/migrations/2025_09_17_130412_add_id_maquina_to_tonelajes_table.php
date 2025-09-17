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
        Schema::table('tonelajes', function (Blueprint $table) {
            // 👉 Crear la columna solo si no existe
            if (!Schema::hasColumn('tonelajes', 'id_maquina')) {
                $table->unsignedBigInteger('id_maquina')->after('id_padron');
            }
        });

        // 👉 Crear la foreign key solo si no existe
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'tonelajes' 
              AND COLUMN_NAME = 'id_maquina' 
              AND CONSTRAINT_SCHEMA = DATABASE()
        ");

        $hasForeignKey = collect($foreignKeys)->contains(function ($fk) {
            return str_contains($fk->CONSTRAINT_NAME, 'tonelajes_id_maquina_foreign');
        });

        if (!$hasForeignKey) {
            Schema::table('tonelajes', function (Blueprint $table) {
                $table->foreign('id_maquina')
                    ->references('id_maquina')
                    ->on('maquinas')
                    ->onDelete('cascade');
            });
        }

        // 👉 Crear índice único solo si no existe
        $indexes = DB::select("
            SHOW INDEX FROM tonelajes WHERE Key_name = 'tonelajes_padron_maquina_fecha_unique'
        ");

        if (count($indexes) === 0) {
            Schema::table('tonelajes', function (Blueprint $table) {
                $table->unique(
                    ['id_padron', 'id_maquina', 'fecha_produccion'],
                    'tonelajes_padron_maquina_fecha_unique'
                );
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tonelajes', function (Blueprint $table) {
            if (Schema::hasColumn('tonelajes', 'id_maquina')) {
                $table->dropForeign(['id_maquina']);
            }

            $table->dropUnique('tonelajes_padron_maquina_fecha_unique');

            if (Schema::hasColumn('tonelajes', 'id_maquina')) {
                $table->dropColumn('id_maquina');
            }
        });
    }
};
