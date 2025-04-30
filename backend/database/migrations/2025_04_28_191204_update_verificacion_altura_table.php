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
        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->dropColumn(['altura_antes', 'altura_despues']);
            $table->decimal('altura_medicion', 8, 2)->after('id_estanque');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verificacion_altura', function (Blueprint $table) {
            $table->dropColumn('altura_medicion');
            $table->decimal('altura_antes', 8, 2);
            $table->decimal('altura_despues', 8, 2);
        });
    }
};
