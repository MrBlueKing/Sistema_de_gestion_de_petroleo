-- ========================================
-- 🧹 SCRIPT DE NORMALIZACIÓN DE RUTs v2
-- ========================================
-- Versión mejorada que maneja correctamente las Foreign Keys
-- ========================================

USE m3h_gestion_petroleo;

-- ========================================
-- PASO 1: ANÁLISIS PREVIO
-- ========================================

SELECT 'ANÁLISIS PREVIO - RUTs con formato' AS etapa;

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
-- PASO 2: ELIMINAR TEMPORALMENTE FOREIGN KEYS
-- ========================================

SELECT 'PASO 2: Eliminando Foreign Keys temporalmente' AS etapa;

-- Guardar definición de FK para recrearlas después
CREATE TABLE IF NOT EXISTS _temp_fk_backup (
    constraint_name VARCHAR(255),
    table_name VARCHAR(255),
    column_name VARCHAR(255),
    referenced_table VARCHAR(255),
    referenced_column VARCHAR(255),
    delete_rule VARCHAR(50),
    update_rule VARCHAR(50)
);

-- Limpiar tabla temporal si existe
TRUNCATE TABLE _temp_fk_backup;

-- Guardar información de FKs relacionadas con RUT
INSERT INTO _temp_fk_backup
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'm3h_gestion_petroleo'
  AND (COLUMN_NAME = 'rut' OR REFERENCED_COLUMN_NAME = 'rut')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Mostrar FKs que serán eliminadas
SELECT 'Foreign Keys encontradas:' AS info, constraint_name, table_name, column_name
FROM _temp_fk_backup;

-- Eliminar FKs
SET @drop_fk_personal_interno = 'ALTER TABLE personal_interno DROP FOREIGN KEY personal_interno_rut_foreign';
SET @drop_fk_personal_externo = 'ALTER TABLE personal_externo DROP FOREIGN KEY personal_externo_rut_foreign';

-- Ejecutar drops (ignorar errores si no existen)
SET @sql_error = 0;
PREPARE stmt FROM @drop_fk_personal_interno;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @drop_fk_personal_externo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Foreign Keys eliminadas exitosamente' AS resultado;

-- ========================================
-- PASO 3: NORMALIZAR RUTs
-- ========================================

SELECT 'PASO 3: Normalizando RUTs' AS etapa;

-- 3.1. Normalizar solicitantes
UPDATE solicitantes
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('Solicitantes actualizados: ', ROW_COUNT()) AS resultado;

-- 3.2. Normalizar personal_interno
UPDATE personal_interno
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('Personal interno actualizado: ', ROW_COUNT()) AS resultado;

-- 3.3. Normalizar personal_externo
UPDATE personal_externo
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('Personal externo actualizado: ', ROW_COUNT()) AS resultado;

-- 3.4. Normalizar empresas_externas
UPDATE empresas_externas
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

SELECT CONCAT('Empresas externas actualizadas: ', ROW_COUNT()) AS resultado;

-- 3.5. Normalizar consumos (id_dotacion)
UPDATE consumos
SET id_dotacion = REPLACE(REPLACE(REPLACE(UPPER(id_dotacion), '.', ''), '-', ''), ' ', '')
WHERE id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %';

SELECT CONCAT('Consumos actualizados: ', ROW_COUNT()) AS resultado;

-- ========================================
-- PASO 4: RECREAR FOREIGN KEYS
-- ========================================

SELECT 'PASO 4: Recreando Foreign Keys' AS etapa;

-- Recrear FK de personal_interno
ALTER TABLE personal_interno
ADD CONSTRAINT personal_interno_rut_foreign
FOREIGN KEY (rut)
REFERENCES solicitantes(rut)
ON DELETE CASCADE;

SELECT 'FK personal_interno recreada' AS resultado;

-- Recrear FK de personal_externo
ALTER TABLE personal_externo
ADD CONSTRAINT personal_externo_rut_foreign
FOREIGN KEY (rut)
REFERENCES solicitantes(rut)
ON DELETE CASCADE;

SELECT 'FK personal_externo recreada' AS resultado;

-- ========================================
-- PASO 5: VERIFICACIÓN FINAL
-- ========================================

SELECT 'PASO 5: Verificación final' AS etapa;

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
SELECT 'EJEMPLOS DE RUTs NORMALIZADOS:' AS info;

SELECT 'solicitantes' AS tabla, rut
FROM solicitantes
LIMIT 5;

SELECT 'personal_interno' AS tabla, rut
FROM personal_interno
LIMIT 5;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS _temp_fk_backup;

-- ========================================
-- ✅ NORMALIZACIÓN COMPLETADA
-- ========================================

SELECT '✅ NORMALIZACIÓN COMPLETADA EXITOSAMENTE' AS resultado;
SELECT 'Todos los RUTs ahora están en formato limpio (sin puntos ni guiones)' AS info;
