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
        Schema::table('personal_externo', function (Blueprint $table) {
            $table->dropColumn('id_dotacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_externo', function (Blueprint $table) {
            $table->unsignedBigInteger('id_dotacion')->nullable(); // o ajusta el tipo de dato según corresponda
        });
    }
};
