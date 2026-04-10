<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consumos', function (Blueprint $table) {
            $table->dropForeign(['anulado_por']);
            $table->dropColumn(['anulado', 'motivo_anulacion', 'anulado_por', 'anulado_at']);
        });
    }

    public function down(): void
    {
        Schema::table('consumos', function (Blueprint $table) {
            $table->boolean('anulado')->default(false)->after('observacion');
            $table->text('motivo_anulacion')->nullable()->after('anulado');
            $table->unsignedBigInteger('anulado_por')->nullable()->after('motivo_anulacion');
            $table->timestamp('anulado_at')->nullable()->after('anulado_por');
        });
    }
};
