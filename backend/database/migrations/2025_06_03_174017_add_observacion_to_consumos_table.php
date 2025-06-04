<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
     public function up()
    {
        Schema::table('consumos', function (Blueprint $table) {
            $table->string('observacion')->nullable()->after('precio_litro');
        });
    }

    public function down()
    {
        Schema::table('consumos', function (Blueprint $table) {
            $table->dropColumn('observacion');
        });
    }
};
