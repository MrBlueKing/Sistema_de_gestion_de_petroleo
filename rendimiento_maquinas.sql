-- ============================================================
--  SISTEMA DE GESTIÓN DE PETRÓLEO
--  ANÁLISIS DE RENDIMIENTO DE MAQUINARIA
--  Máquinas: Excavadora · Camion Pluma · Manitou · Manitou Arrendado
--
--  Tablas : maquinas, categorias_maquinas, maquinas_internas,
--           consumos, mantenciones, historial_chc
--
--  NOTA: "Cargador Frontal" no existe como categoría en la BD.
--        Si se agrega en el futuro, incluirla en los WHERE.
--  COMPATIBILIDAD: MariaDB / MySQL 8+ (sin NULLS LAST)
-- ============================================================


-- ============================================================
-- PARÁMETROS GLOBALES (ajustar fechas según el período deseado)
-- ============================================================
SET @fecha_inicio = DATE_FORMAT(CURDATE(), '%Y-%m-01');  -- Primer día del mes actual
SET @fecha_fin    = LAST_DAY(CURDATE());                 -- Último día del mes actual


-- ============================================================
-- QUERY 1: PANEL PRINCIPAL DE RENDIMIENTO POR MÁQUINA
--          Resumen ejecutivo del período configurado
-- ============================================================

WITH consumos_periodo AS (
    /*
     * Acumula litros, recargas y lecturas de horómetro / odómetro
     * por máquina dentro del período seleccionado.
     * numeral_final - numeral_inicial = horas trabajadas (Horómetro)
     *                                  o km recorridos  (Kilometraje)
     */
    SELECT
        c.id_equipo,
        SUM(c.litros_consumidos)                                        AS total_litros,
        COUNT(c.id_consumo)                                             AS total_recargas,
        ROUND(AVG(c.litros_consumidos), 2)                              AS promedio_litros_recarga,
        SUM(
            CASE
                WHEN c.numeral_final   IS NOT NULL
                 AND c.numeral_inicial IS NOT NULL
                 AND c.numeral_final > c.numeral_inicial
                THEN (c.numeral_final - c.numeral_inicial)
                ELSE 0
            END
        )                                                               AS total_medicion_acumulada,
        COUNT(DISTINCT DATE(c.fecha_consumo))                           AS dias_con_actividad,
        MAX(c.fecha_consumo)                                            AS ultimo_consumo
    FROM consumos c
    WHERE DATE(c.fecha_consumo) BETWEEN @fecha_inicio AND @fecha_fin
    GROUP BY c.id_equipo
),

ultimo_mantenimiento AS (
    /*
     * Trae solo la mantención más reciente de cada máquina
     * para conocer el estado actual y la próxima intervención.
     */
    SELECT
        mt.id_maquina,
        mt.fecha_mantencion                                             AS fecha_ultima_mantencion,
        mt.horas_kilometros_actuales                                    AS medicion_en_mantencion,
        mt.proxima_mantencion,
        mt.tipo_mantenimiento,
        ROW_NUMBER() OVER (
            PARTITION BY mt.id_maquina
            ORDER BY mt.fecha_mantencion DESC
        )                                                               AS rn
    FROM mantenciones mt
),

chc_referencia AS (
    /*
     * CHC (Consumo Hora Combustible) más reciente por categoría,
     * calculado automáticamente por el sistema.
     * Sirve como benchmark para comparar el CHC individual de cada máquina.
     */
    SELECT
        hc.id_categoria,
        hc.chc_calculado,
        hc.total_litros                                                 AS litros_mes_chc,
        hc.maquinas_activas,
        hc.anio,
        hc.mes,
        CONCAT(hc.anio, '-', LPAD(hc.mes, 2, '0'))                     AS periodo_chc
    FROM historial_chc hc
    WHERE (hc.id_categoria, hc.anio, hc.mes) IN (
        SELECT id_categoria, MAX(anio), MAX(mes)
        FROM historial_chc
        GROUP BY id_categoria
    )
)

SELECT
    /* ── IDENTIFICACIÓN ──────────────────────────────────── */
    m.id_maquina,
    m.nombre_maquina                                                    AS maquina,
    COALESCE(mi.patente, '—')                                           AS patente,
    cm.nombre_categoria                                                 AS categoria,
    cm.tipo_medicion,
    m.tipo_maquina,
    m.estado,

    /* ── ACTIVIDAD EN EL PERÍODO ──────────────────────────── */
    COALESCE(cp.total_litros,            0)                             AS litros_consumidos,
    COALESCE(cp.total_recargas,          0)                             AS num_recargas,
    COALESCE(cp.promedio_litros_recarga, 0)                             AS litros_por_recarga,
    COALESCE(cp.dias_con_actividad,      0)                             AS dias_activo,
    cp.ultimo_consumo,

    /* ── RENDIMIENTO SEGÚN TIPO DE MEDICIÓN ───────────────── */
    -- Horómetro → CHC (litros / hora trabajada)
    CASE
        WHEN cm.tipo_medicion = 'Horometro'
         AND COALESCE(cp.total_medicion_acumulada, 0) > 0
        THEN ROUND(cp.total_litros / cp.total_medicion_acumulada, 4)
        ELSE NULL
    END                                                                 AS chc_calculado_lt_hr,

    -- Kilometraje → Rendimiento (km / litro)
    CASE
        WHEN cm.tipo_medicion = 'Kilometraje'
         AND COALESCE(cp.total_litros, 0) > 0
        THEN ROUND(cp.total_medicion_acumulada / cp.total_litros, 2)
        ELSE NULL
    END                                                                 AS rendimiento_km_lt,

    -- Total horas u km acumulados del período
    CASE
        WHEN cm.tipo_medicion = 'Horometro'
        THEN CONCAT(COALESCE(ROUND(cp.total_medicion_acumulada, 1), 0), ' hrs')
        ELSE CONCAT(COALESCE(ROUND(cp.total_medicion_acumulada, 1), 0), ' km')
    END                                                                 AS total_medicion_periodo,

    /* ── BENCHMARK CHC DE CATEGORÍA ──────────────────────── */
    m.chc_maquina                                                       AS chc_maquina_referencia,
    chc.chc_calculado                                                   AS chc_categoria_benchmark,
    chc.periodo_chc                                                     AS periodo_benchmark,

    -- Desviación del CHC individual vs el benchmark de la categoría (%)
    CASE
        WHEN cm.tipo_medicion = 'Horometro'
         AND COALESCE(cp.total_medicion_acumulada, 0) > 0
         AND COALESCE(chc.chc_calculado, 0) > 0
        THEN ROUND(
            (
                (cp.total_litros / cp.total_medicion_acumulada) - chc.chc_calculado
            ) / chc.chc_calculado * 100
        , 2)
        ELSE NULL
    END                                                                 AS desviacion_chc_pct,

    /* ── MANTENIMIENTO ────────────────────────────────────── */
    DATE(um.fecha_ultima_mantencion)                                    AS fecha_ultima_mantencion,
    um.tipo_mantenimiento,
    um.medicion_en_mantencion,
    um.proxima_mantencion,

    -- Días transcurridos desde la última mantención
    CASE
        WHEN um.fecha_ultima_mantencion IS NOT NULL
        THEN DATEDIFF(CURDATE(), DATE(um.fecha_ultima_mantencion))
        ELSE NULL
    END                                                                 AS dias_desde_mantencion,

    /* ── SEMÁFORO DE ESTADO ───────────────────────────────── */
    CASE
        WHEN m.estado = 'fuera_de_servicio'
            THEN 'FUERA DE SERVICIO'
        WHEN m.estado = 'en_mantenimiento'
            THEN 'EN MANTENCION'
        WHEN COALESCE(cp.total_litros, 0) = 0
            THEN 'SIN ACTIVIDAD'
        WHEN cm.tipo_medicion = 'Horometro'
         AND COALESCE(cp.total_medicion_acumulada, 0) > 0
         AND COALESCE(chc.chc_calculado, 0) > 0
         AND (cp.total_litros / cp.total_medicion_acumulada) > (chc.chc_calculado * 1.15)
            THEN 'ALTO CONSUMO'
        WHEN cm.tipo_medicion = 'Horometro'
         AND COALESCE(cp.total_medicion_acumulada, 0) > 0
         AND COALESCE(chc.chc_calculado, 0) > 0
         AND (cp.total_litros / cp.total_medicion_acumulada) > (chc.chc_calculado * 1.05)
            THEN 'CONSUMO ELEVADO'
        ELSE 'NORMAL'
    END                                                                 AS alerta_rendimiento

FROM maquinas m
INNER JOIN categorias_maquinas   cm  ON cm.id_categoria  = m.id_categoria
LEFT  JOIN maquinas_internas     mi  ON mi.id_maquina    = m.id_maquina
LEFT  JOIN consumos_periodo      cp  ON cp.id_equipo     = m.id_maquina
LEFT  JOIN ultimo_mantenimiento  um  ON um.id_maquina    = m.id_maquina AND um.rn = 1
LEFT  JOIN chc_referencia        chc ON chc.id_categoria = m.id_categoria

WHERE cm.nombre_categoria IN (
    'Excavadora',
    'Camion Pluma',
    'Manitou',
    'Manitou Arrendado'
)

ORDER BY
    cm.nombre_categoria ASC,
    litros_consumidos   DESC;


-- ============================================================
-- QUERY 2: TENDENCIA MENSUAL POR MÁQUINA (últimos 6 meses)
--          Evolución mes a mes del consumo y CHC
-- ============================================================

SELECT
    m.nombre_maquina                                                    AS maquina,
    COALESCE(mi.patente, '—')                                           AS patente,
    cm.nombre_categoria                                                 AS categoria,
    cm.tipo_medicion,

    DATE_FORMAT(c.fecha_consumo, '%Y-%m')                               AS mes,
    MONTHNAME(c.fecha_consumo)                                          AS nombre_mes,

    ROUND(SUM(c.litros_consumidos), 2)                                  AS litros_mes,
    COUNT(c.id_consumo)                                                 AS recargas_mes,
    COUNT(DISTINCT DATE(c.fecha_consumo))                               AS dias_activo,

    -- Acumulado de horómetro / km del mes
    ROUND(SUM(
        CASE
            WHEN c.numeral_final > c.numeral_inicial
            THEN (c.numeral_final - c.numeral_inicial)
            ELSE 0
        END
    ), 2)                                                               AS medicion_acumulada,

    -- CHC del mes (solo Horómetro)
    CASE
        WHEN cm.tipo_medicion = 'Horometro'
         AND SUM(CASE
                    WHEN c.numeral_final > c.numeral_inicial
                    THEN (c.numeral_final - c.numeral_inicial)
                    ELSE 0
                 END) > 0
        THEN ROUND(
                SUM(c.litros_consumidos) /
                SUM(CASE
                        WHEN c.numeral_final > c.numeral_inicial
                        THEN (c.numeral_final - c.numeral_inicial)
                        ELSE 0
                    END)
             , 4)
        ELSE NULL
    END                                                                 AS chc_mes,

    -- Km/Litro del mes (solo Kilometraje)
    CASE
        WHEN cm.tipo_medicion = 'Kilometraje'
         AND SUM(c.litros_consumidos) > 0
        THEN ROUND(
                SUM(CASE
                        WHEN c.numeral_final > c.numeral_inicial
                        THEN (c.numeral_final - c.numeral_inicial)
                        ELSE 0
                    END)
                / SUM(c.litros_consumidos)
             , 2)
        ELSE NULL
    END                                                                 AS km_por_litro_mes,

    ROUND(SUM(c.litros_consumidos * COALESCE(c.precio_litro, 0)), 2)   AS costo_estimado_mes

FROM consumos c
INNER JOIN maquinas            m   ON m.id_maquina   = c.id_equipo
INNER JOIN categorias_maquinas cm  ON cm.id_categoria = m.id_categoria
LEFT  JOIN maquinas_internas   mi  ON mi.id_maquina  = m.id_maquina

WHERE
    c.fecha_consumo >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
    AND cm.nombre_categoria IN (
        'Excavadora',
        'Camion Pluma',
        'Manitou',
        'Manitou Arrendado'
    )

GROUP BY
    m.id_maquina,
    m.nombre_maquina,
    mi.patente,
    cm.nombre_categoria,
    cm.tipo_medicion,
    DATE_FORMAT(c.fecha_consumo, '%Y-%m')

ORDER BY
    m.nombre_maquina ASC,
    mes              ASC;


-- ============================================================
-- QUERY 3: CONSUMO DIARIO DETALLADO (drill-down)
--          Para revisar operación turno por turno en el período
-- ============================================================

SELECT
    DATE(c.fecha_consumo)                                               AS fecha,
    m.nombre_maquina                                                    AS maquina,
    COALESCE(mi.patente, '—')                                           AS patente,
    cm.nombre_categoria                                                 AS categoria,
    cm.tipo_medicion,

    c.litros_consumidos,
    c.numeral_inicial,
    c.numeral_final,

    -- Horas u km del turno
    CASE
        WHEN c.numeral_final > c.numeral_inicial
        THEN ROUND(c.numeral_final - c.numeral_inicial, 2)
        ELSE NULL
    END                                                                 AS medicion_turno,

    -- CHC del turno (Horómetro)
    CASE
        WHEN cm.tipo_medicion = 'Horometro'
         AND c.numeral_final > c.numeral_inicial
        THEN ROUND(c.litros_consumidos / (c.numeral_final - c.numeral_inicial), 4)
        ELSE NULL
    END                                                                 AS chc_turno,

    -- Km/Litro del turno (Kilometraje)
    CASE
        WHEN cm.tipo_medicion = 'Kilometraje'
         AND c.litros_consumidos > 0
         AND c.numeral_final > c.numeral_inicial
        THEN ROUND((c.numeral_final - c.numeral_inicial) / c.litros_consumidos, 2)
        ELSE NULL
    END                                                                 AS km_lt_turno,

    COALESCE(c.precio_litro, 0)                                         AS precio_litro,
    ROUND(c.litros_consumidos * COALESCE(c.precio_litro, 0), 2)        AS costo_turno,
    c.observacion

FROM consumos c
INNER JOIN maquinas            m   ON m.id_maquina   = c.id_equipo
INNER JOIN categorias_maquinas cm  ON cm.id_categoria = m.id_categoria
LEFT  JOIN maquinas_internas   mi  ON mi.id_maquina  = m.id_maquina

WHERE
    DATE(c.fecha_consumo) BETWEEN @fecha_inicio AND @fecha_fin
    AND cm.nombre_categoria IN (
        'Excavadora',
        'Camion Pluma',
        'Manitou',
        'Manitou Arrendado'
    )

ORDER BY
    c.fecha_consumo  DESC,
    m.nombre_maquina ASC;


-- ============================================================
-- QUERY 4: ALERTA DE MANTENIMIENTO PREVENTIVO
--          Máquinas próximas o que superaron la mantención
--
--  FIX MariaDB: se reemplazó "NULLS LAST" (no soportado) por
--               ISNULL(margen_restante) que retorna 1 si NULL,
--               empujando los nulos al final del ORDER BY.
-- ============================================================

WITH ultima_mantencion AS (
    SELECT
        mt.id_maquina,
        mt.fecha_mantencion,
        mt.horas_kilometros_actuales,
        mt.proxima_mantencion,
        mt.tipo_mantenimiento,
        ROW_NUMBER() OVER (
            PARTITION BY mt.id_maquina
            ORDER BY mt.fecha_mantencion DESC
        )                                                               AS rn
    FROM mantenciones mt
),

medicion_actual AS (
    -- Último numeral_final registrado como medición actual de la máquina
    SELECT
        c.id_equipo,
        MAX(c.numeral_final)                                            AS medicion_actual,
        MAX(c.fecha_consumo)                                            AS fecha_ultima_medicion
    FROM consumos c
    WHERE c.numeral_final IS NOT NULL
    GROUP BY c.id_equipo
)

SELECT
    m.id_maquina,
    m.nombre_maquina                                                    AS maquina,
    COALESCE(mi.patente, '—')                                           AS patente,
    cm.nombre_categoria                                                 AS categoria,
    cm.tipo_medicion,
    m.estado,

    -- Datos de mantención
    DATE(um.fecha_mantencion)                                           AS fecha_ultima_mantencion,
    um.tipo_mantenimiento,
    um.horas_kilometros_actuales                                        AS medicion_en_ultima_mantencion,
    um.proxima_mantencion                                               AS umbral_proxima_mantencion,

    -- Medición actual estimada
    ROUND(COALESCE(ma.medicion_actual, 0), 2)                          AS medicion_actual_estimada,
    DATE(ma.fecha_ultima_medicion)                                      AS fecha_ultima_lectura,

    -- Margen restante hasta la próxima mantención
    CASE
        WHEN um.proxima_mantencion IS NOT NULL AND ma.medicion_actual IS NOT NULL
        THEN ROUND(um.proxima_mantencion - ma.medicion_actual, 2)
        ELSE NULL
    END                                                                 AS margen_restante,

    -- % de avance hacia la próxima mantención
    CASE
        WHEN um.proxima_mantencion        IS NOT NULL
         AND um.horas_kilometros_actuales IS NOT NULL
         AND um.proxima_mantencion > um.horas_kilometros_actuales
         AND ma.medicion_actual           IS NOT NULL
        THEN ROUND(
            (ma.medicion_actual - um.horas_kilometros_actuales)
            / (um.proxima_mantencion - um.horas_kilometros_actuales)
            * 100
        , 1)
        ELSE NULL
    END                                                                 AS porcentaje_avance,

    -- Nivel de alerta
    CASE
        WHEN ma.medicion_actual IS NULL
            THEN 'SIN LECTURA'
        WHEN um.proxima_mantencion IS NULL
            THEN 'SIN PROGRAMAR'
        WHEN ma.medicion_actual >= um.proxima_mantencion
            THEN 'MANTENCION VENCIDA'
        WHEN (um.proxima_mantencion - ma.medicion_actual)
             <= (um.proxima_mantencion - um.horas_kilometros_actuales) * 0.10
            THEN 'MANTENCION PROXIMA'
        ELSE 'AL DIA'
    END                                                                 AS alerta_mantencion,

    -- Días transcurridos desde la última mantención
    DATEDIFF(CURDATE(), DATE(um.fecha_mantencion))                      AS dias_sin_mantencion

FROM maquinas m
INNER JOIN categorias_maquinas   cm  ON cm.id_categoria  = m.id_categoria
LEFT  JOIN maquinas_internas     mi  ON mi.id_maquina    = m.id_maquina
LEFT  JOIN ultima_mantencion     um  ON um.id_maquina    = m.id_maquina AND um.rn = 1
LEFT  JOIN medicion_actual       ma  ON ma.id_equipo     = m.id_maquina

WHERE cm.nombre_categoria IN (
    'Excavadora',
    'Camion Pluma',
    'Manitou',
    'Manitou Arrendado'
)

ORDER BY
    -- Vencidas primero, luego por margen ascendente
    -- ISNULL() = 1 cuando es NULL → los empuja al final (compatible MariaDB)
    CASE WHEN ma.medicion_actual >= um.proxima_mantencion THEN 0 ELSE 1 END ASC,
    ISNULL(
        CASE
            WHEN um.proxima_mantencion IS NOT NULL AND ma.medicion_actual IS NOT NULL
            THEN ROUND(um.proxima_mantencion - ma.medicion_actual, 2)
            ELSE NULL
        END
    ) ASC,
    CASE
        WHEN um.proxima_mantencion IS NOT NULL AND ma.medicion_actual IS NOT NULL
        THEN ROUND(um.proxima_mantencion - ma.medicion_actual, 2)
        ELSE NULL
    END ASC;


-- ============================================================
-- QUERY 5: CHC HISTÓRICO POR CATEGORÍA (últimos 12 meses)
--          Evolución del benchmark de consumo por tipo de maquinaria
-- ============================================================

SELECT
    cm.nombre_categoria                                                 AS categoria,
    cm.tipo_medicion,

    hc.anio,
    hc.mes,
    CONCAT(hc.anio, '-', LPAD(hc.mes, 2, '0'))                         AS periodo,

    ROUND(hc.chc_calculado, 4)                                          AS chc_mes,
    ROUND(hc.chc_anterior,  4)                                          AS chc_mes_anterior,

    -- Variación mes a mes (%)
    CASE
        WHEN hc.chc_anterior IS NOT NULL AND hc.chc_anterior > 0
        THEN ROUND((hc.chc_calculado - hc.chc_anterior) / hc.chc_anterior * 100, 2)
        ELSE NULL
    END                                                                 AS variacion_pct,

    ROUND(hc.total_litros,  2)                                          AS total_litros_mes,
    hc.total_consumos                                                   AS num_recargas,
    hc.maquinas_activas,
    hc.dias_periodo,
    ROUND(hc.hrc_utilizado, 2)                                          AS hrc_utilizado,

    -- Tendencia respecto al mes anterior
    CASE
        WHEN hc.chc_anterior IS NULL                  THEN 'Primer registro'
        WHEN hc.chc_calculado < hc.chc_anterior       THEN 'Mejorando'
        WHEN hc.chc_calculado > hc.chc_anterior       THEN 'Empeorando'
        ELSE                                               'Sin cambio'
    END                                                                 AS tendencia

FROM historial_chc hc
INNER JOIN categorias_maquinas cm ON cm.id_categoria = hc.id_categoria

WHERE
    -- Últimos 12 meses (compatible MariaDB)
    (hc.anio * 100 + hc.mes) >=
    (YEAR(DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) * 100
     + MONTH(DATE_SUB(CURDATE(), INTERVAL 12 MONTH)))
    AND cm.nombre_categoria IN (
        'Excavadora',
        'Camion Pluma',
        'Manitou',
        'Manitou Arrendado'
    )

ORDER BY
    cm.nombre_categoria ASC,
    hc.anio             DESC,
    hc.mes              DESC;


-- ============================================================
-- QUERY 6: RANKING DE CONSUMO POR MÁQUINA
--          Top consumidores del período — útil para auditoría
-- ============================================================

SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(c.litros_consumidos) DESC)          AS ranking,
    m.nombre_maquina                                                    AS maquina,
    COALESCE(mi.patente, '—')                                           AS patente,
    cm.nombre_categoria                                                 AS categoria,
    cm.tipo_medicion,
    m.estado,

    ROUND(SUM(c.litros_consumidos), 2)                                  AS total_litros,
    COUNT(c.id_consumo)                                                 AS total_recargas,
    COUNT(DISTINCT DATE(c.fecha_consumo))                               AS dias_activo,
    ROUND(AVG(c.litros_consumidos), 2)                                  AS promedio_litros_recarga,

    -- Participación % en el consumo total de la categoría
    ROUND(
        SUM(c.litros_consumidos)
        / SUM(SUM(c.litros_consumidos)) OVER (PARTITION BY cm.nombre_categoria)
        * 100
    , 2)                                                                AS participacion_categoria_pct,

    -- Costo total estimado del período
    ROUND(SUM(c.litros_consumidos * COALESCE(c.precio_litro, 0)), 2)   AS costo_estimado

FROM consumos c
INNER JOIN maquinas            m   ON m.id_maquina   = c.id_equipo
INNER JOIN categorias_maquinas cm  ON cm.id_categoria = m.id_categoria
LEFT  JOIN maquinas_internas   mi  ON mi.id_maquina  = m.id_maquina

WHERE
    DATE(c.fecha_consumo) BETWEEN @fecha_inicio AND @fecha_fin
    AND cm.nombre_categoria IN (
        'Excavadora',
        'Camion Pluma',
        'Manitou',
        'Manitou Arrendado'
    )

GROUP BY
    m.id_maquina,
    m.nombre_maquina,
    mi.patente,
    cm.nombre_categoria,
    cm.tipo_medicion,
    m.estado

ORDER BY
    total_litros DESC;
