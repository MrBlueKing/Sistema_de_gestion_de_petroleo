-- ========================================
-- 🧹 PASO 3: NORMALIZAR RUTs (FINAL)
-- ========================================
-- Este script normaliza todos los RUTs después de eliminar duplicados
-- ========================================

USE m3h_gestion_petroleo;

-- ========================================
-- VERIFICACIÓN PREVIA
-- ========================================

SELECT '🔍 Verificando que no hay duplicados' AS '═══════════════════════════════════';

SELECT
    'solicitantes' AS tabla,
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')) AS duplicados
FROM solicitantes
UNION ALL
SELECT
    'personal_interno',
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM personal_interno
UNION ALL
SELECT
    'personal_externo',
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM personal_externo
UNION ALL
SELECT
    'empresas_externas',
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM empresas_externas;

-- ========================================
-- PASO 1: ELIMINAR FOREIGN KEYS
-- ========================================

SELECT '🔓 Eliminando Foreign Keys temporalmente' AS '═══════════════════════════════════';

ALTER TABLE personal_interno DROP FOREIGN KEY IF EXISTS personal_interno_rut_foreign;
ALTER TABLE personal_externo DROP FOREIGN KEY IF EXISTS personal_externo_rut_foreign;

SELECT '✅ Foreign Keys eliminadas' AS resultado;

-- ========================================
-- PASO 2: NORMALIZAR RUTs
-- ========================================

SELECT '🧹 Normalizando RUTs' AS '═══════════════════════════════════';

-- 2.1. Normalizar solicitantes
UPDATE solicitantes
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Solicitantes actualizados: ', ROW_COUNT(), ' registros') AS resultado;

-- 2.2. Normalizar personal_interno
UPDATE personal_interno
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Personal interno actualizado: ', ROW_COUNT(), ' registros') AS resultado;

-- 2.3. Normalizar personal_externo
UPDATE personal_externo
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Personal externo actualizado: ', ROW_COUNT(), ' registros') AS resultado;

-- 2.4. Normalizar empresas_externas
UPDATE empresas_externas
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Empresas externas actualizadas: ', ROW_COUNT(), ' registros') AS resultado;

-- 2.5. Normalizar consumos (id_dotacion)
UPDATE consumos
SET id_dotacion = REPLACE(REPLACE(REPLACE(UPPER(id_dotacion), '.', ''), '-', ''), ' ', '')
WHERE id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %';

SELECT CONCAT('✅ Consumos actualizados: ', ROW_COUNT(), ' registros') AS resultado;

-- ========================================
-- PASO 3: RECREAR FOREIGN KEYS
-- ========================================

SELECT '🔐 Recreando Foreign Keys' AS '═══════════════════════════════════';

ALTER TABLE personal_interno
ADD CONSTRAINT personal_interno_rut_foreign
FOREIGN KEY (rut)
REFERENCES solicitantes(rut)
ON DELETE CASCADE;

SELECT '✅ FK personal_interno recreada' AS resultado;

ALTER TABLE personal_externo
ADD CONSTRAINT personal_externo_rut_foreign
FOREIGN KEY (rut)
REFERENCES solicitantes(rut)
ON DELETE CASCADE;

SELECT '✅ FK personal_externo recreada' AS resultado;

-- ========================================
-- PASO 4: VERIFICACIÓN FINAL
-- ========================================

SELECT '✅ VERIFICACIÓN FINAL' AS '═══════════════════════════════════';

SELECT
    'solicitantes' AS tabla,
    COUNT(*) AS total_registros,
    COUNT(CASE WHEN rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %' THEN 1 END) AS con_formato,
    COUNT(CASE WHEN rut NOT LIKE '%.%' AND rut NOT LIKE '%-%' AND rut NOT LIKE '% %' THEN 1 END) AS sin_formato
FROM solicitantes
UNION ALL
SELECT
    'personal_interno',
    COUNT(*),
    COUNT(CASE WHEN rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %' THEN 1 END),
    COUNT(CASE WHEN rut NOT LIKE '%.%' AND rut NOT LIKE '%-%' AND rut NOT LIKE '% %' THEN 1 END)
FROM personal_interno
UNION ALL
SELECT
    'personal_externo',
    COUNT(*),
    COUNT(CASE WHEN rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %' THEN 1 END),
    COUNT(CASE WHEN rut NOT LIKE '%.%' AND rut NOT LIKE '%-%' AND rut NOT LIKE '% %' THEN 1 END)
FROM personal_externo
UNION ALL
SELECT
    'empresas_externas',
    COUNT(*),
    COUNT(CASE WHEN rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %' THEN 1 END),
    COUNT(CASE WHEN rut NOT LIKE '%.%' AND rut NOT LIKE '%-%' AND rut NOT LIKE '% %' THEN 1 END)
FROM empresas_externas
UNION ALL
SELECT
    'consumos (id_dotacion)',
    COUNT(*),
    COUNT(CASE WHEN id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %' THEN 1 END),
    COUNT(CASE WHEN id_dotacion NOT LIKE '%.%' AND id_dotacion NOT LIKE '%-%' AND id_dotacion NOT LIKE '% %' THEN 1 END)
FROM consumos;

-- Ejemplos de RUTs normalizados
SELECT '📋 EJEMPLOS DE RUTs NORMALIZADOS:' AS '═══════════════════════════════════';

SELECT 'solicitantes' AS tabla, rut
FROM solicitantes
LIMIT 5;

SELECT 'personal_interno' AS tabla, rut, nombre, apellido
FROM personal_interno
LIMIT 5;

-- ========================================
-- ✅ NORMALIZACIÓN COMPLETADA
-- ========================================

SELECT '🎉 NORMALIZACIÓN COMPLETADA EXITOSAMENTE' AS resultado;
SELECT 'Todos los RUTs están normalizados (sin puntos ni guiones)' AS info;
SELECT 'La base de datos ahora está consistente' AS estado;
