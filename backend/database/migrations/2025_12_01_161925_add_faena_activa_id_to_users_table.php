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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('faena_activa_id')->nullable()->after('id_faena')
                ->comment('ID de la faena actualmente seleccionada por el usuario. Si es NULL, usa id_faena');

            $table->foreign('faena_activa_id')->references('id_faena')->on('faenas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['faena_activa_id']);
            $table->dropColumn('faena_activa_id');
        });
    }
};
