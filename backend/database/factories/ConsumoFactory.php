<?php

namespace Database\Factories;

use App\Models\Consumo;
use App\Models\Dotacion;  // Si tienes un modelo Dotacion
use App\Models\Equipo;    // Si tienes un modelo Equipo
use App\Models\User;      // Si tienes un modelo User
use App\Models\Faena;     // Si tienes un modelo Faena
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsumoFactory extends Factory
{
    protected $model = Consumo::class;

    public function definition()
    {
        return [
            'id_dotacion' => Dotacion::factory(), // Relacionado con la tabla solicitantes
            'id_equipo' => Equipo::factory(),     // Relacionado con la tabla maquinas
            'id_usuario' => User::factory(),      // Relacionado con la tabla users
            'fecha_consumo' => $this->faker->dateTimeThisYear(), // Fecha aleatoria
            'litros_consumidos' => $this->faker->randomFloat(2, 0, 100), // Genera entre 0 y 100 litros
            'id_faena' => Faena::factory(),      // Relacionado con faenas
            'medicion' => $this->faker->randomFloat(3, 0, 1000), // Medición aleatoria
            'numeral_inicial' => $this->faker->randomFloat(3, 0, 1000), // Numeral inicial aleatorio
            'numeral_final' => $this->faker->randomFloat(3, 0, 1000), // Numeral final aleatorio
        ];
    }
}
