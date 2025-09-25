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
        Schema::table('faenas', function (Blueprint $table) {
            $table->decimal('porcentaje_tributacion', 5, 2)
                  ->default(0)
                  ->after('detalle'); // <- aquí especificas la columna después de la cual se agrega
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faenas', function (Blueprint $table) {
            $table->dropColumn('porcentaje_tributacion');
        });
    }
};
