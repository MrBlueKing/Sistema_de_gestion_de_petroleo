<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Verificar si un índice existe
     */
    private function indexExists($table, $indexName)
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return !empty($indexes);
    }

    /**
     * Crear índice solo si no existe
     */
    private function createIndexIfNotExists($table, $columns, $indexName)
    {
        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                if (is_array($columns)) {
                    $table->index($columns, $indexName);
                } else {
                    $table->index($columns, $indexName);
                }
            });
            echo "✅ Índice {$indexName} creado en tabla {$table}\n";
        } else {
            echo "⚠️  Índice {$indexName} ya existe en tabla {$table}\n";
        }
    }

    /**
     * Eliminar índice solo si existe
     */
    private function dropIndexIfExists($table, $indexName)
    {
        if ($this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
            echo "🗑️ Índice {$indexName} eliminado de tabla {$table}\n";
        } else {
            echo "ℹ️  Índice {$indexName} no existe en tabla {$table} (salteado)\n";
        }
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        echo "🚀 Creando índices optimizados...\n";

        // 📊 ÍNDICES PARA TABLA CONSUMOS
        $this->createIndexIfNotExists('consumos', ['id_faena', 'fecha_consumo'], 'idx_consumos_faena_fecha');
        $this->createIndexIfNotExists('consumos', ['id_faena', 'fecha_consumo', 'id_equipo'], 'idx_consumos_filtros');
        $this->createIndexIfNotExists('consumos', ['fecha_consumo', 'id_consumo'], 'idx_consumos_orden');
        $this->createIndexIfNotExists('consumos', 'id_equipo', 'idx_consumos_equipo');

        // 🔧 ÍNDICES PARA TABLA MAQUINAS
        $this->createIndexIfNotExists('maquinas', 'id_categoria', 'idx_maquinas_categoria');

        // 🏭 ÍNDICES PARA TABLA FAENAS
        $this->createIndexIfNotExists('faenas', 'ubicacion', 'idx_faenas_nombre');

        // 📦 ÍNDICES PARA CARGAS EXTERNAS (tus originales)
        $this->createIndexIfNotExists('cargas_externas', ['id_faena', 'created_at', 'id_maquina'], 'idx_cargas_filtros');
        $this->createIndexIfNotExists('cargas_externas', ['created_at', 'id'], 'idx_cargas_orden');

        echo "✅ Migración completada!\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        echo "🔄 Eliminando índices...\n";

        // Eliminar índices de consumos (estos SÍ se pueden eliminar)
        $this->dropIndexIfExists('consumos', 'idx_consumos_equipo');
        $this->dropIndexIfExists('consumos', 'idx_consumos_orden');
        $this->dropIndexIfExists('consumos', 'idx_consumos_filtros');
        $this->dropIndexIfExists('consumos', 'idx_consumos_faena_fecha');

        $this->dropIndexIfExists('maquinas', 'idx_maquinas_categoria');
        $this->dropIndexIfExists('faenas', 'idx_faenas_nombre');

        // ⚠️ SALTAR cargas_externas porque tiene foreign key constraints
        echo "ℹ️  Índices de cargas_externas saltados (foreign key constraints)\n";

        echo "✅ Rollback completado!\n";
    }
};
