<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ConsumoReporte extends Model
{
    public static function getReporteConsumoMaquinas($fechaInicio, $fechaFin)
    {
        return DB::table('consumos as c')
            ->join('maquinas as m', 'c.id_equipo', '=', 'm.id_maquina')
            ->join('categorias_maquinas as cm', 'm.id_categoria', '=', 'cm.id_categoria')
            ->join('faenas as f', 'c.id_faena', '=', 'f.id_faena')
            ->select(
                'm.id_maquina',
                'm.nombre_maquina',
                'm.patente',
                'cm.tipo_medicion',
                'c.id_faena',
                'f.ubicacion as nombre_faena',
                DB::raw('MIN(c.fecha_consumo) as primera_fecha'),
                DB::raw('MAX(c.fecha_consumo) as ultima_fecha'),
                DB::raw('MIN(c.medicion) as medicion_inicial'),
                DB::raw('MAX(c.medicion) as medicion_final'),
                DB::raw('(MAX(c.medicion) - MIN(c.medicion)) as diferencia_medicion'),
                DB::raw('SUM(c.litros_consumidos) as total_litros'),
                DB::raw('AVG(c.precio_litro) as precio_promedio'),
                DB::raw('SUM(c.litros_consumidos * c.precio_litro) as costo_total')
            )
            ->where('c.fecha_consumo', '>=', $fechaInicio)
            ->where('c.fecha_consumo', '<=', $fechaFin)
            ->groupBy('m.id_maquina', 'm.nombre_maquina', 'm.patente', 'cm.tipo_medicion', 'c.id_faena', 'f.ubicacion')
            ->having(DB::raw('COUNT(c.id_consumo)'), '>', 1) // Solo incluir máquinas con al menos 2 registros
            ->orderBy('f.ubicacion')
            ->orderBy('m.nombre_maquina')
            ->get();
    }
    
    // Alternativa si no quieres añadir la columna precio_litro
    public static function getReporteConsumoMaquinasSinColumna($fechaInicio, $fechaFin)
    {
        return DB::select("
            SELECT 
                m.id_maquina,
                m.nombre_maquina,
                m.patente,
                cm.tipo_medicion,
                c.id_faena,
                f.ubicacion AS nombre_faena,
                
                (SELECT fecha_consumo FROM consumos 
                 WHERE id_equipo = m.id_maquina AND id_faena = c.id_faena
                 AND fecha_consumo BETWEEN ? AND ?
                 ORDER BY fecha_consumo ASC LIMIT 1) AS primera_fecha,
                
                (SELECT fecha_consumo FROM consumos 
                 WHERE id_equipo = m.id_maquina AND id_faena = c.id_faena
                 AND fecha_consumo BETWEEN ? AND ?
                 ORDER BY fecha_consumo DESC LIMIT 1) AS ultima_fecha,
                 
                (SELECT medicion FROM consumos 
                 WHERE id_equipo = m.id_maquina AND id_faena = c.id_faena
                 AND fecha_consumo BETWEEN ? AND ?
                 ORDER BY fecha_consumo ASC LIMIT 1) AS medicion_inicial,
                 
                (SELECT medicion FROM consumos 
                 WHERE id_equipo = m.id_maquina AND id_faena = c.id_faena
                 AND fecha_consumo BETWEEN ? AND ?
                 ORDER BY fecha_consumo DESC LIMIT 1) AS medicion_final,
                 
                (
                    (SELECT medicion FROM consumos 
                     WHERE id_equipo = m.id_maquina AND id_faena = c.id_faena
                     AND fecha_consumo BETWEEN ? AND ?
                     ORDER BY fecha_consumo DESC LIMIT 1)
                    -
                    (SELECT medicion FROM consumos 
                     WHERE id_equipo = m.id_maquina AND id_faena = c.id_faena
                     AND fecha_consumo BETWEEN ? AND ?
                     ORDER BY fecha_consumo ASC LIMIT 1)
                ) AS diferencia_medicion,
                
                SUM(c.litros_consumidos) AS total_litros,
                (
                    SELECT AVG(precio) FROM ingresos_petroleo
                    WHERE id_faena = c.id_faena
                    AND created_at BETWEEN ? AND ?
                ) AS precio_promedio,
                SUM(c.litros_consumidos) * (
                    SELECT AVG(precio) FROM ingresos_petroleo
                    WHERE id_faena = c.id_faena
                    AND created_at BETWEEN ? AND ?
                ) AS costo_total
            FROM 
                consumos c
                INNER JOIN maquinas m ON c.id_equipo = m.id_maquina
                INNER JOIN categorias_maquinas cm ON m.id_categoria = cm.id_categoria
                INNER JOIN faenas f ON c.id_faena = f.id_faena
            WHERE 
                c.fecha_consumo BETWEEN ? AND ?
            GROUP BY 
                m.id_maquina, m.nombre_maquina, m.patente, cm.tipo_medicion, c.id_faena, f.ubicacion
            HAVING 
                COUNT(c.id_consumo) > 1
            ORDER BY 
                f.ubicacion, m.nombre_maquina
        ", array_fill(0, 12, [$fechaInicio, $fechaFin]));
    }
}
