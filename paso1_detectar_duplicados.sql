-- ========================================
-- 🔍 PASO 1: DETECTAR RUTs DUPLICADOS
-- ========================================
-- Este script identifica RUTs que se duplicarían al normalizar
-- ========================================

USE m3h_gestion_petroleo;

-- ========================================
-- ANÁLISIS: Encontrar RUTs duplicados ocultos
-- ========================================

SELECT '🔍 BUSCANDO DUPLICADOS OCULTOS POR FORMATO' AS '═══════════════════════════════════';

-- Función temporal para limpiar RUT (simula la normalización)
-- Ver RUTs duplicados en SOLICITANTES
SELECT
    '📋 SOLICITANTES - Duplicados encontrados:' AS info;

SELECT
    REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '') AS rut_normalizado,
    COUNT(*) AS cantidad,
    GROUP_CONCAT(rut SEPARATOR ' | ') AS formatos_originales,
    GROUP_CONCAT(id SEPARATOR ', ') AS ids_duplicados
FROM solicitantes
GROUP BY REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Ver detalles completos de los duplicados
SELECT
    '📊 DETALLE COMPLETO DE DUPLICADOS EN SOLICITANTES:' AS info;

SELECT
    s.id,
    s.rut AS rut_original,
    REPLACE(REPLACE(REPLACE(UPPER(s.rut), '.', ''), '-', ''), ' ', '') AS rut_normalizado,
    s.tipo_personal,
    CASE
        WHEN s.tipo_personal = 'Interno' THEN CONCAT(pi.nombre, ' ', pi.apellido)
        WHEN s.tipo_personal = 'Externo' THEN pe.nombre
        ELSE 'N/A'
    END AS nombre_completo,
    s.created_at AS fecha_creacion
FROM solicitantes s
LEFT JOIN personal_interno pi ON s.rut = pi.rut
LEFT JOIN personal_externo pe ON s.rut = pe.rut
WHERE REPLACE(REPLACE(REPLACE(UPPER(s.rut), '.', ''), '-', ''), ' ', '') IN (
    SELECT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
    FROM solicitantes
    GROUP BY REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
    HAVING COUNT(*) > 1
)
ORDER BY REPLACE(REPLACE(REPLACE(UPPER(s.rut), '.', ''), '-', ''), ' ', ''), s.created_at;

-- Ver duplicados en PERSONAL_INTERNO
SELECT
    '📋 PERSONAL_INTERNO - Duplicados encontrados:' AS info;

SELECT
    REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '') AS rut_normalizado,
    COUNT(*) AS cantidad,
    GROUP_CONCAT(rut SEPARATOR ' | ') AS formatos_originales,
    GROUP_CONCAT(CONCAT(nombre, ' ', apellido) SEPARATOR ' | ') AS nombres
FROM personal_interno
GROUP BY REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Ver duplicados en PERSONAL_EXTERNO
SELECT
    '📋 PERSONAL_EXTERNO - Duplicados encontrados:' AS info;

SELECT
    REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '') AS rut_normalizado,
    COUNT(*) AS cantidad,
    GROUP_CONCAT(rut SEPARATOR ' | ') AS formatos_originales,
    GROUP_CONCAT(nombre SEPARATOR ' | ') AS nombres
FROM personal_externo
GROUP BY REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Ver duplicados en EMPRESAS_EXTERNAS
SELECT
    '📋 EMPRESAS_EXTERNAS - Duplicados encontrados:' AS info;

SELECT
    REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '') AS rut_normalizado,
    COUNT(*) AS cantidad,
    GROUP_CONCAT(rut SEPARATOR ' | ') AS formatos_originales,
    GROUP_CONCAT(nombre SEPARATOR ' | ') AS nombres
FROM empresas_externas
GROUP BY REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- ========================================
-- RESUMEN
-- ========================================

SELECT '📊 RESUMEN DE DUPLICADOS' AS '═══════════════════════════════════';

SELECT
    'solicitantes' AS tabla,
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')) AS ruts_unicos,
    COUNT(*) AS total_registros,
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')) AS registros_duplicados
FROM solicitantes
UNION ALL
SELECT
    'personal_interno',
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')),
    COUNT(*),
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM personal_interno
UNION ALL
SELECT
    'personal_externo',
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')),
    COUNT(*),
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM personal_externo
UNION ALL
SELECT
    'empresas_externas',
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')),
    COUNT(*),
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM empresas_externas;

-- ========================================
-- INSTRUCCIONES
-- ========================================

SELECT '📝 PRÓXIMOS PASOS:' AS '═══════════════════════════════════';
SELECT '1. Revisar los RUTs duplicados encontrados arriba' AS paso;
SELECT '2. Decidir cuál registro mantener (generalmente el más antiguo)' AS paso;
SELECT '3. Ejecutar el script paso2_eliminar_duplicados.sql' AS paso;
SELECT '4. Finalmente ejecutar paso3_normalizar_ruts_final.sql' AS paso;
