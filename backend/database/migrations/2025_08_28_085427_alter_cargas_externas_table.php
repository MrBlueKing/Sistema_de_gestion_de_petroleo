<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Paso 1: quitar enum y dejarlo como VARCHAR temporalmente
        DB::statement("ALTER TABLE cargas_externas MODIFY COLUMN estado VARCHAR(50) NOT NULL");

        // Paso 2: normalizar valores inválidos
        DB::statement("UPDATE cargas_externas SET estado = 'Por Rendir' WHERE estado NOT IN ('Por Rendir', 'Rendido') OR estado IS NULL OR estado = ''");

        // Paso 3: volver a poner el ENUM con los valores correctos
        DB::statement("ALTER TABLE cargas_externas MODIFY COLUMN estado ENUM('Por Rendir', 'Rendido') NOT NULL DEFAULT 'Por Rendir'");
    }

    public function down(): void
    {
        // ⚠️ Aquí deberías restaurar el enum anterior
        DB::statement("ALTER TABLE cargas_externas MODIFY COLUMN estado VARCHAR(50) NOT NULL");
    }
};
