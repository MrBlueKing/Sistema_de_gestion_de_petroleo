    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;
    use Illuminate\Support\Facades\DB;


    return new class extends Migration
    {
        public function up(): void
        {
            Schema::create('faenas', function (Blueprint $table) {
                $table->id('id_faena');
                $table->string('ubicacion', 255);
                $table->text('detalle')->nullable();
                $table->dateTime('fecha_creacion')->default(DB::raw('CURRENT_TIMESTAMP'));
            });
        }

        public function down(): void
        {
            Schema::dropIfExists('faenas');
        }
    };
