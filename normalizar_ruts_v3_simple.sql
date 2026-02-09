-- ========================================
-- 🧹 SCRIPT DE NORMALIZACIÓN DE RUTs v3
-- ========================================
-- Versión simplificada y directa
-- ========================================

USE m3h_gestion_petroleo;

-- ========================================
-- PASO 1: ANÁLISIS PREVIO
-- ========================================

SELECT '📊 ANÁLISIS PREVIO - RUTs con formato' AS '═══════════════════════════════════';

SELECT 'solicitantes' AS tabla, COUNT(*) AS total_con_formato
FROM solicitantes
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT 'personal_interno' AS tabla, COUNT(*) AS total_con_formato
FROM personal_interno
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT 'personal_externo' AS tabla, COUNT(*) AS total_con_formato
FROM personal_externo
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT 'empresas_externas' AS tabla, COUNT(*) AS total_con_formato
FROM empresas_externas
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT 'consumos (id_dotacion)' AS tabla, COUNT(*) AS total_con_formato
FROM consumos
WHERE id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %';

-- ========================================
-- PASO 2: ELIMINAR FOREIGN KEYS
-- ========================================

SELECT '🔓 PASO 2: Eliminando Foreign Keys' AS '═══════════════════════════════════';

-- Eliminar FK de personal_interno
ALTER TABLE personal_interno DROP FOREIGN KEY IF EXISTS personal_interno_rut_foreign;

-- Eliminar FK de personal_externo
ALTER TABLE personal_externo DROP FOREIGN KEY IF EXISTS personal_externo_rut_foreign;

SELECT '✅ Foreign Keys eliminadas' AS resultado;

-- ========================================
-- PASO 3: NORMALIZAR RUTs
-- ========================================

SELECT '🧹 PASO 3: Normalizando RUTs' AS '═══════════════════════════════════';

-- 3.1. Normalizar solicitantes
UPDATE solicitantes
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Solicitantes actualizados: ', ROW_COUNT(), ' registros') AS resultado;

-- 3.2. Normalizar personal_interno
UPDATE personal_interno
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Personal interno actualizado: ', ROW_COUNT(), ' registros') AS resultado;

-- 3.3. Normalizar personal_externo
UPDATE personal_externo
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Personal externo actualizado: ', ROW_COUNT(), ' registros') AS resultado;

-- 3.4. Normalizar empresas_externas
UPDATE empresas_externas
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('✅ Empresas externas actualizadas: ', ROW_COUNT(), ' registros') AS resultado;

-- 3.5. Normalizar consumos (id_dotacion)
UPDATE consumos
SET id_dotacion = REPLACE(REPLACE(REPLACE(UPPER(id_dotacion), '.', ''), '-', ''), ' ', '')
WHERE id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %';

SELECT CONCAT('✅ Consumos actualizados: ', ROW_COUNT(), ' registros') AS resultado;

-- ========================================
-- PASO 4: RECREAR FOREIGN KEYS
-- ========================================

SELECT '🔐 PASO 4: Recreando Foreign Keys' AS '═══════════════════════════════════';

-- Recrear FK de personal_interno
ALTER TABLE personal_interno
ADD CONSTRAINT personal_interno_rut_foreign
FOREIGN KEY (rut)
REFERENCES solicitantes(rut)
ON DELETE CASCADE;

SELECT '✅ FK personal_interno recreada' AS resultado;

-- Recrear FK de personal_externo
ALTER TABLE personal_externo
ADD CONSTRAINT personal_externo_rut_foreign
FOREIGN KEY (rut)
REFERENCES solicitantes(rut)
ON DELETE CASCADE;

SELECT '✅ FK personal_externo recreada' AS resultado;

-- ========================================
-- PASO 5: VERIFICACIÓN FINAL
-- ========================================

SELECT '✅ PASO 5: Verificación final' AS '═══════════════════════════════════';

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

SELECT 'personal_externo' AS tabla, rut, nombre
FROM personal_externo
LIMIT 5;

-- ========================================
-- ✅ NORMALIZACIÓN COMPLETADA
-- ========================================

SELECT '🎉 NORMALIZACIÓN COMPLETADA EXITOSAMENTE' AS resultado;
SELECT 'Todos los RUTs ahora están en formato limpio (sin puntos ni guiones)' AS info;
SELECT 'Ejemplo: "12.345.678-9" → "123456789"' AS formato;
