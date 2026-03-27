-- ============================================================
--  RENDIMIENTO DE MAQUINARIA — VISTA RESUMIDA
--  Medición anterior → última + rendimiento por máquina
-- ============================================================

WITH consumos_ordenados AS (
    SELECT
        c.id_equipo,
        c.fecha_consumo,
        c.litros_consumidos,
        c.numeral_inicial,
        c.numeral_final,
        c.precio_litro,
        ROW_NUMBER() OVER (
            PARTITION BY c.id_equipo
            ORDER BY c.fecha_consumo DESC
        ) AS nro
    FROM consumos c
    WHERE c.numeral_final IS NOT NULL
      AND c.numeral_final > 0
),

ultimo     AS (SELECT * FROM consumos_ordenados WHERE nro = 1),
penultimo  AS (SELECT * FROM consumos_ordenados WHERE nro = 2)

SELECT
    m.nombre_maquina                                                        AS maquina,
    COALESCE(mi.patente, '—')                                               AS patente,
    cm.nombre_categoria                                                      AS categoria,
    cm.tipo_medicion,

    -- Mediciones
    ROUND(COALESCE(p.numeral_final, 0), 1)                                  AS medicion_anterior,
    ROUND(u.numeral_final, 1)                                               AS ultima_medicion,
    ROUND(u.numeral_final - COALESCE(p.numeral_final, u.numeral_inicial), 1) AS diferencia,

    -- Litros del último consumo
    u.litros_consumidos                                                      AS litros_ultimo_llenado,

    -- Rendimiento
    CASE
        WHEN cm.tipo_medicion = 'Horometro'
         AND (u.numeral_final - u.numeral_inicial) > 0
        THEN CONCAT(
            ROUND(u.litros_consumidos / (u.numeral_final - u.numeral_inicial), 2),
            ' L/hr'
        )
        WHEN cm.tipo_medicion = 'Kilometraje'
         AND u.litros_consumidos > 0
         AND (u.numeral_final - u.numeral_inicial) > 0
        THEN CONCAT(
            ROUND((u.numeral_final - u.numeral_inicial) / u.litros_consumidos, 2),
            ' km/L'
        )
        ELSE '—'
    END                                                                      AS rendimiento,

    -- Fecha y costo
    DATE(u.fecha_consumo)                                                    AS fecha_ultimo_consumo,
    ROUND(u.litros_consumidos * COALESCE(u.precio_litro, 0), 0)             AS costo_ultimo_llenado,

    -- Estado
    m.estado

FROM maquinas m
INNER JOIN categorias_maquinas cm ON cm.id_categoria = m.id_categoria
LEFT  JOIN maquinas_internas   mi ON mi.id_maquina   = m.id_maquina
INNER JOIN ultimo               u  ON u.id_equipo    = m.id_maquina
LEFT  JOIN penultimo            p  ON p.id_equipo    = m.id_maquina

WHERE cm.nombre_categoria IN (
    'Excavadora',
    'Camion Pluma',
    'Manitou',
    'Manitou Arrendado'
)

ORDER BY
    cm.nombre_categoria ASC,
    u.fecha_consumo     DESC;
