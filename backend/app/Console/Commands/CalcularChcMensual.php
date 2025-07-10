<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CategoriaMaquina;
use App\Models\Maquinas;
use App\Models\HistorialChc;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CalcularChcMensual extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'chc:calcular-mensual 
                            {--mes= : Mes específico (1-12)} 
                            {--anio= : Año específico (YYYY)}
                            {--categoria= : ID de categoría específica}
                            {--maquina= : ID de máquina específica}
                            {--forzar : Recalcular aunque ya exista}';

    /**
     * The console command description.
     */
    protected $description = 'Calcula el CHC mensual individual por máquina y CHC ponderado por categoría basado en consumos reales';

    /**
     * HRC por defecto (horas por día)
     */
    const HRC_DEFAULT = 7;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando cálculo de CHC mensual individual y ponderado...');

        // Determinar período a calcular
        $periodo = $this->determinarPeriodo();
        $this->info("📅 Calculando CHC para: {$periodo['mes']}/{$periodo['anio']}");

        $resultados = [
            'maquinas_procesadas' => 0,
            'maquinas_actualizadas' => 0,
            'categorias_procesadas' => 0,
            'categorias_actualizadas' => 0,
            'sin_datos' => 0,
            'errores' => 0
        ];

        // Paso 1: Calcular CHC individual por máquina
        $this->info("\n🔧 === CALCULANDO CHC INDIVIDUAL POR MÁQUINA ===");
        $this->calcularChcIndividualMaquinas($periodo, $resultados);

        // Paso 2: Calcular CHC ponderado por categoría
        $this->info("\n🏭 === CALCULANDO CHC PONDERADO POR CATEGORÍA ===");
        $this->calcularChcPonderadoCategorias($periodo, $resultados);

        $this->mostrarResumen($resultados, $periodo);
        return Command::SUCCESS;
    }

    /**
     * Calcular CHC individual para cada máquina
     */
    private function calcularChcIndividualMaquinas($periodo, &$resultados)
    {
        $query = Maquinas::with('categoria');
        
        // Filtros opcionales
        if ($idCategoria = $this->option('categoria')) {
            $query->where('id_categoria', $idCategoria);
        }
        
        if ($idMaquina = $this->option('maquina')) {
            $query->where('id_maquina', $idMaquina);
        }
        
        $maquinas = $query->get();
        $this->info("🎯 Máquinas a procesar: " . $maquinas->count());

        foreach ($maquinas as $maquina) {
            try {
                $this->info("🔧 Procesando: {$maquina->nombre_maquina} (ID: {$maquina->id_maquina})");
                
                $resultado = $this->calcularChcParaMaquina($maquina, $periodo);
                
                if ($resultado['calculado']) {
                    $resultados['maquinas_actualizadas']++;
                    $this->info("   ✅ CHC individual actualizado: {$resultado['chc_nuevo']} L/h");
                } else {
                    $resultados['sin_datos']++;
                    $this->warn("   ⚠️  Sin datos suficientes para calcular CHC individual");
                }
                
                $resultados['maquinas_procesadas']++;
                
            } catch (\Exception $e) {
                $resultados['errores']++;
                $this->error("   ❌ Error procesando {$maquina->nombre_maquina}: " . $e->getMessage());
            }
        }
    }

    /**
     * Calcular CHC ponderado para categorías
     */
    private function calcularChcPonderadoCategorias($periodo, &$resultados)
    {
        $categorias = $this->obtenerCategorias();
        
        foreach ($categorias as $categoria) {
            try {
                $this->info("🏭 Procesando categoría: {$categoria->nombre_categoria}");
                
                $resultado = $this->calcularChcPonderadoCategoria($categoria, $periodo);
                
                if ($resultado['calculado']) {
                    $resultados['categorias_actualizadas']++;
                    $this->info("   ✅ CHC ponderado actualizado: {$resultado['chc_nuevo']} L/h");
                    $this->info("   📊 Basado en {$resultado['maquinas_consideradas']} máquinas");
                } else {
                    $resultados['sin_datos']++;
                    $this->warn("   ⚠️  Sin máquinas con datos para calcular CHC ponderado");
                }
                
                $resultados['categorias_procesadas']++;
                
            } catch (\Exception $e) {
                $resultados['errores']++;
                $this->error("   ❌ Error procesando categoría {$categoria->nombre_categoria}: " . $e->getMessage());
            }
        }
    }

    /**
     * Calcular CHC para una máquina específica
     */
    private function calcularChcParaMaquina($maquina, $periodo): array
    {
        // Obtener datos de consumos del período para esta máquina
        $datosConsumo = $this->obtenerDatosConsumoMaquina($maquina->id_maquina, $periodo);

        if (!$datosConsumo['tiene_datos']) {
            return ['calculado' => false, 'motivo' => 'sin_datos'];
        }

        // Calcular CHC individual
        $chcCalculado = $this->aplicarFormulaChc($datosConsumo);

        // Actualizar CHC en la máquina
        $chcAnterior = $maquina->chc_maquina;
        DB::table('maquinas')
            ->where('id_maquina', $maquina->id_maquina)
            ->update([
                'chc_maquina' => $chcCalculado,
                'updated_at' => now()
            ]);

        $this->info("   💾 CHC máquina actualizado: {$chcAnterior} → {$chcCalculado}");

        return [
            'calculado' => true,
            'chc_anterior' => $chcAnterior,
            'chc_nuevo' => $chcCalculado,
            'datos' => $datosConsumo
        ];
    }

    /**
     * Calcular CHC ponderado para una categoría basado en consumos reales
     */
    private function calcularChcPonderadoCategoria($categoria, $periodo): array
    {
        // Obtener máquinas de la categoría con sus CHC y consumos
        $maquinasData = DB::table('maquinas')
            ->leftJoin('consumos', 'maquinas.id_maquina', '=', 'consumos.id_equipo')
            ->where('maquinas.id_categoria', $categoria->id_categoria)
            ->whereBetween('consumos.fecha_consumo', [$periodo['inicio'], $periodo['fin']])
            ->groupBy('maquinas.id_maquina', 'maquinas.nombre_maquina', 'maquinas.chc_maquina')
            ->select([
                'maquinas.id_maquina',
                'maquinas.nombre_maquina', 
                'maquinas.chc_maquina',
                DB::raw('SUM(consumos.litros_consumidos) as total_litros_maquina'),
                DB::raw('COUNT(*) as total_consumos'),
                DB::raw('MIN(DATE(consumos.fecha_consumo)) as primer_consumo'),
                DB::raw('MAX(DATE(consumos.fecha_consumo)) as ultimo_consumo')
            ])
            ->having('total_litros_maquina', '>', 0)
            ->get();

        if ($maquinasData->isEmpty()) {
            return ['calculado' => false, 'motivo' => 'sin_maquinas_con_datos'];
        }

        // Calcular totales y CHC ponderado
        $totalLitrosCategoria = $maquinasData->sum('total_litros_maquina');
        $chcPonderado = 0;
        $detalleCalculo = [];

        foreach ($maquinasData as $maquina) {
            $chcIndividual = (float) $maquina->chc_maquina;
            $litrosMaquina = (float) $maquina->total_litros_maquina;
            $peso = $litrosMaquina / $totalLitrosCategoria;
            $contribucion = $chcIndividual * $peso;
            
            $chcPonderado += $contribucion;
            
            $detalleCalculo[] = [
                'maquina' => $maquina->nombre_maquina,
                'chc_individual' => $chcIndividual,
                'litros_consumidos' => $litrosMaquina,
                'peso_porcentaje' => round($peso * 100, 2),
                'contribucion_chc' => round($contribucion, 6)
            ];
            
            $this->info("   🔧 {$maquina->nombre_maquina}: CHC={$chcIndividual} L/h, Consumo={$litrosMaquina}L (" . round($peso * 100, 1) . "%)");
        }

        $chcCalculado = round($chcPonderado, 4);

        // Actualizar CHC en categoria_maquinas
        $chcAnterior = $categoria->chc;
        DB::table('categorias_maquinas')
            ->where('id_categoria', $categoria->id_categoria)
            ->update([
                'chc' => $chcCalculado,
                'updated_at' => now()
            ]);

        // Guardar en historial de categoría
        $this->guardarHistorialChcCategoriaPonderado($categoria, $periodo, $maquinasData, $chcCalculado, $detalleCalculo);

        return [
            'calculado' => true,
            'chc_anterior' => $chcAnterior,
            'chc_nuevo' => $chcCalculado,
            'maquinas_consideradas' => $maquinasData->count(),
            'total_litros' => $totalLitrosCategoria,
            'detalle' => $detalleCalculo
        ];
    }

    /**
     * Obtener datos de consumo para una máquina específica
     */
    private function obtenerDatosConsumoMaquina($idMaquina, $periodo): array
    {
        $consumos = DB::table('consumos')
            ->where('id_equipo', $idMaquina)
            ->whereBetween('fecha_consumo', [$periodo['inicio'], $periodo['fin']])
            ->select([
                DB::raw('SUM(litros_consumidos) as total_litros'),
                DB::raw('COUNT(*) as total_consumos'),
                DB::raw('MIN(DATE(fecha_consumo)) as primer_consumo'),
                DB::raw('MAX(DATE(fecha_consumo)) as ultimo_consumo')
            ])
            ->first();

        if (!$consumos || $consumos->total_litros <= 0) {
            return ['tiene_datos' => false];
        }

        // Calcular días del período
        $primerConsumo = Carbon::parse($consumos->primer_consumo);
        $ultimoConsumo = Carbon::parse($consumos->ultimo_consumo);
        $diasPeriodo = $primerConsumo->diffInDays($ultimoConsumo) + 1;

        return [
            'tiene_datos' => true,
            'total_litros' => (float) $consumos->total_litros,
            'total_consumos' => (int) $consumos->total_consumos,
            'dias_periodo' => $diasPeriodo,
            'primer_consumo' => $primerConsumo,
            'ultimo_consumo' => $ultimoConsumo
        ];
    }

    /**
     * Aplicar fórmula: CHC = Sumatoria Litros / (Días * HRC)
     */
    private function aplicarFormulaChc($datosConsumo): float
    {
        $hrc = self::HRC_DEFAULT;
        $denominador = $datosConsumo['dias_periodo'] * $hrc;
        
        if ($denominador <= 0) {
            throw new \Exception("Denominador inválido en cálculo CHC");
        }
        
        return round($datosConsumo['total_litros'] / $denominador, 4);
    }

    /**
     * Guardar historial de CHC de categoría con método ponderado
     */
    private function guardarHistorialChcCategoriaPonderado($categoria, $periodo, $maquinasData, $chcCalculado, $detalleCalculo)
    {
        HistorialChc::updateOrCreate(
            [
                'id_categoria' => $categoria->id_categoria,
                'anio' => $periodo['anio'],
                'mes' => $periodo['mes']
            ],
            [
                'chc_calculado' => $chcCalculado,
                'chc_anterior' => $categoria->chc,
                'periodo_inicio' => $periodo['inicio']->toDateString(),
                'periodo_fin' => $periodo['fin']->toDateString(),
                'total_litros' => $maquinasData->sum('total_litros_maquina'),
                'dias_periodo' => $periodo['fin']->diffInDays($periodo['inicio']) + 1,
                'hrc_utilizado' => self::HRC_DEFAULT,
                'total_consumos' => $maquinasData->sum('total_consumos'),
                'maquinas_activas' => $maquinasData->count(),
                'calculado_en' => now(),
                'metodo_calculo' => 'ponderado_por_consumo',
                'detalle_calculo' => [
                    'formula' => 'Σ(CHC_individual × Peso_consumo)',
                    'descripcion' => 'CHC ponderado basado en el consumo real de cada máquina',
                    'maquinas_detalle' => $detalleCalculo
                ]
            ]
        );
    }

    /**
     * Determinar qué período calcular
     */
    private function determinarPeriodo(): array
    {
        $mes = $this->option('mes');
        $anio = $this->option('anio');

        if ($mes && $anio) {
            return [
                'mes' => (int) $mes,
                'anio' => (int) $anio,
                'inicio' => Carbon::create($anio, $mes, 1)->startOfMonth(),
                'fin' => Carbon::create($anio, $mes, 1)->endOfMonth()
            ];
        }

        $mesAnterior = now()->subMonth();
        return [
            'mes' => $mesAnterior->month,
            'anio' => $mesAnterior->year,
            'inicio' => $mesAnterior->copy()->startOfMonth(),
            'fin' => $mesAnterior->copy()->endOfMonth()
        ];
    }

    /**
     * Obtener categorías a procesar
     */
    private function obtenerCategorias()
    {
        $query = CategoriaMaquina::query();
        
        if ($idCategoria = $this->option('categoria')) {
            $query->where('id_categoria', $idCategoria);
        }
        
        return $query->get();
    }

    /**
     * Mostrar resumen de la ejecución
     */
    private function mostrarResumen($resultados, $periodo)
    {
        $this->info("\n🎯 RESUMEN DE EJECUCIÓN");
        $this->info("═══════════════════════");
        $this->info("📅 Período: {$periodo['mes']}/{$periodo['anio']}");
        $this->info("🔧 Máquinas procesadas: {$resultados['maquinas_procesadas']}");
        $this->info("✅ CHC individuales actualizados: {$resultados['maquinas_actualizadas']}");
        $this->info("🏭 Categorías procesadas: {$resultados['categorias_procesadas']}");
        $this->info("✅ CHC categorías actualizados: {$resultados['categorias_actualizadas']}");
        $this->info("⚠️  Sin datos: {$resultados['sin_datos']}");
        $this->info("❌ Errores: {$resultados['errores']}");
        
        if ($resultados['errores'] === 0 && $resultados['maquinas_actualizadas'] > 0) {
            $this->info("\n🎉 ¡Cálculo completado exitosamente!");
        }
    }
}