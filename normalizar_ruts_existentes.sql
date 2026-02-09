-- ========================================
-- 🧹 SCRIPT DE NORMALIZACIÓN DE RUTs
-- ========================================
-- Este script elimina puntos, guiones y espacios de todos los RUTs
-- en la base de datos m3h_gestion_petroleo para estandarizar el formato
--
-- IMPORTANTE:
-- 1. Hacer BACKUP de la base de datos ANTES de ejecutar
-- 2. Ejecutar en entorno de prueba primero
-- 3. Verificar resultados antes de aplicar en producción
-- ========================================

USE m3h_gestion_petroleo;

-- Deshabilitar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- ANÁLISIS PREVIO: Ver RUTs que serán modificados
-- ========================================

-- Ver RUTs con formato (con guiones o puntos) en solicitantes
SELECT 'solicitantes' AS tabla, COUNT(*) AS total_con_formato
FROM solicitantes
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- Ver RUTs con formato en personal_interno
SELECT 'personal_interno' AS tabla, COUNT(*) AS total_con_formato
FROM personal_interno
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- Ver RUTs con formato en personal_externo
SELECT 'personal_externo' AS tabla, COUNT(*) AS total_con_formato
FROM personal_externo
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- Ver RUTs con formato en empresas_externas
SELECT 'empresas_externas' AS tabla, COUNT(*) AS total_con_formato
FROM empresas_externas
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- Ver RUTs con formato en consumos (id_dotacion)
SELECT 'consumos' AS tabla, COUNT(*) AS total_con_formato
FROM consumos
WHERE id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %';

-- ========================================
-- NORMALIZACIÓN: Eliminar puntos, guiones y espacios
-- ========================================

-- 1. Normalizar tabla: solicitantes
UPDATE solicitantes
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- 2. Normalizar tabla: personal_interno
UPDATE personal_interno
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- 3. Normalizar tabla: personal_externo
UPDATE personal_externo
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- 4. Normalizar tabla: empresas_externas
UPDATE empresas_externas
SET rut = REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')
WHERE rut LIKE '%.%' OR rut LIKE '%-%' OR rut LIKE '% %';

-- 5. Normalizar tabla: consumos (campo id_dotacion que almacena RUT)
UPDATE consumos
SET id_dotacion = REPLACE(REPLACE(REPLACE(UPPER(id_dotacion), '.', ''), '-', ''), ' ', '')
WHERE id_dotacion LIKE '%.%' OR id_dotacion LIKE '%-%' OR id_dotacion LIKE '% %';

-- ========================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ========================================

-- Verificar que no queden RUTs con formato
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

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- EJEMPLOS DE RUTs NORMALIZADOS
-- ========================================

-- Ver ejemplos de RUTs después de la normalización
SELECT 'solicitantes' AS tabla, rut AS rut_normalizado
FROM solicitantes
LIMIT 5;

SELECT 'personal_interno' AS tabla, rut AS rut_normalizado
FROM personal_interno
LIMIT 5;

SELECT 'personal_externo' AS tabla, rut AS rut_normalizado
FROM personal_externo
LIMIT 5;

-- ========================================
-- ✅ MIGRACIÓN COMPLETADA
-- ========================================
-- Todos los RUTs ahora están en formato limpio (sin puntos ni guiones)
-- Ejemplo: "12.345.678-9" → "123456789"
-- ========================================
