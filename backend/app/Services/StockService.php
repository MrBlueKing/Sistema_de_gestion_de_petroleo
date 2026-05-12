<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockService
{
    /**
     * Calcula el stock real de un estanque sumando todos los movimientos hasta $fechaHasta.
     * Soporta estanques fijos y móviles. Incluye ingresos, trasvasijes y consumos.
     */
    public static function calcularStockHistorico(int $idEstanque, Carbon $fechaHasta): float
    {
        if (!\App\Models\Estanque::find($idEstanque)) return 0.0;

        $entradasIngreso = (float) DB::table('verificacion_altura as va')
            ->join('ingresos_petroleo as ip', 'va.id_ingreso', '=', 'ip.id_ingreso')
            ->where('va.id_estanque', $idEstanque)
            ->where('ip.created_at', '<=', $fechaHasta)
            ->sum('va.volumen_calculado');

        // Entradas: independiente del tipo — busca en ambas tablas
        // (cubre el caso donde un fijo fue registrado como 'movil' temporalmente)
        $entradasTrasvasije =
            (float) DB::table('trasvasijes_multi_fijo_a_movil')
                ->where('id_estanque_movil', $idEstanque)
                ->where('fecha_trasvasije', '<=', $fechaHasta)
                ->sum('litros_bombeados_total')
            +
            (float) DB::table('trasvasijes_movil_a_fijo')
                ->where('id_estanque_fijo', $idEstanque)
                ->where('fecha_trasvasije', '<=', $fechaHasta)
                ->sum('litros_trasvasijados');

        // Salidas: independiente del tipo — busca en ambas tablas
        $salidasTrasvasije =
            (float) DB::table('trasvasijes_movil_a_fijo')
                ->where('id_estanque_movil', $idEstanque)
                ->where('fecha_trasvasije', '<=', $fechaHasta)
                ->sum('litros_trasvasijados')
            +
            (float) DB::table('trasvasijes_multi_fijo_a_movil_detalle as d')
                ->join('trasvasijes_multi_fijo_a_movil as t', 'd.id_trasvasije_multi', '=', 't.id_trasvasije')
                ->where('d.id_estanque_fijo', $idEstanque)
                ->where('t.fecha_trasvasije', '<=', $fechaHasta)
                ->sum('d.litros_desde_estanque');

        $salidasSimple = (float) DB::table('consumos as c')
            ->where('c.id_estanque', $idEstanque)
            ->where('c.fecha_consumo', '<=', $fechaHasta)
            ->whereNotExists(fn($q) => $q->select(DB::raw(1))
                ->from('consumo_estanques as ce')
                ->whereColumn('ce.id_consumo', 'c.id_consumo'))
            ->sum('c.litros_consumidos');

        $salidasMultiple = (float) DB::table('consumo_estanques as ce')
            ->join('consumos as c', 'ce.id_consumo', '=', 'c.id_consumo')
            ->where('ce.id_estanque', $idEstanque)
            ->where('c.fecha_consumo', '<=', $fechaHasta)
            ->sum('ce.litros_desde_estanque');

        return max(0.0, ($entradasIngreso + $entradasTrasvasije) - ($salidasSimple + $salidasMultiple + $salidasTrasvasije));
    }

    /**
     * Recalcula y persiste el stock_actual (y altura_actual) de los estanques dados.
     * Llamar siempre después de cualquier edición de consumo o trasvasije.
     */
    public static function recalcularStockActual(array $idEstanques): void
    {
        $ahora = now('America/Santiago');
        foreach (array_unique($idEstanques) as $idEstanque) {
            $stock    = \App\Models\EstanqueStock::where('id_estanque', $idEstanque)->first();
            $estanque = \App\Models\Estanque::find($idEstanque);
            if (!$stock || !$estanque) continue;

            $stock->stock_actual = self::calcularStockHistorico($idEstanque, $ahora);

            if ($estanque->altura_nominal && $estanque->capacidad && (float)$estanque->capacidad > 0) {
                $stock->altura_actual = ($stock->stock_actual / (float)$estanque->capacidad) * (float)$estanque->altura_nominal;
            }

            $stock->save();
        }
    }
}
