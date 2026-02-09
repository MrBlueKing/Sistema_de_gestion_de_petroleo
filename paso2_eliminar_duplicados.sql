-- ========================================
-- 🗑️ PASO 2: ELIMINAR RUTs DUPLICADOS
-- ========================================
-- Este script elimina registros duplicados, conservando el más antiguo
-- ========================================

USE m3h_gestion_petroleo;

-- ========================================
-- IMPORTANTE: HACER BACKUP ANTES DE EJECUTAR
-- ========================================

SELECT '⚠️ ADVERTENCIA: Este script eliminará registros duplicados' AS alerta;
SELECT 'Asegúrate de haber ejecutado paso1_detectar_duplicados.sql primero' AS recordatorio;
SELECT 'Presiona "Continuar" solo si has revisado los duplicados' AS confirmacion;

-- ========================================
-- PASO 1: ELIMINAR FKs TEMPORALMENTE
-- ========================================

SELECT '🔓 Eliminando Foreign Keys temporalmente' AS '═══════════════════════════════════';

ALTER TABLE personal_interno DROP FOREIGN KEY IF EXISTS personal_interno_rut_foreign;
ALTER TABLE personal_externo DROP FOREIGN KEY IF EXISTS personal_externo_rut_foreign;

SELECT '✅ Foreign Keys eliminadas' AS resultado;

-- ========================================
-- PASO 2: ELIMINAR DUPLICADOS DE PERSONAL_INTERNO
-- ========================================

SELECT '🗑️ Eliminando duplicados de PERSONAL_INTERNO' AS '═══════════════════════════════════';

-- Conservar el registro más antiguo, eliminar los demás
DELETE pi1 FROM personal_interno pi1
INNER JOIN personal_interno pi2
WHERE REPLACE(REPLACE(REPLACE(UPPER(pi1.rut), '.', ''), '-', ''), ' ', '') =
      REPLACE(REPLACE(REPLACE(UPPER(pi2.rut), '.', ''), '-', ''), ' ', '')
AND pi1.id_personal_interno > pi2.id_personal_interno;

SELECT CONCAT('✅ Registros eliminados: ', ROW_COUNT()) AS resultado;

-- ========================================
-- PASO 3: ELIMINAR DUPLICADOS DE PERSONAL_EXTERNO
-- ========================================

SELECT '🗑️ Eliminando duplicados de PERSONAL_EXTERNO' AS '═══════════════════════════════════';

DELETE pe1 FROM personal_externo pe1
INNER JOIN personal_externo pe2
WHERE REPLACE(REPLACE(REPLACE(UPPER(pe1.rut), '.', ''), '-', ''), ' ', '') =
      REPLACE(REPLACE(REPLACE(UPPER(pe2.rut), '.', ''), '-', ''), ' ', '')
AND pe1.id_personal_externo > pe2.id_personal_externo;

SELECT CONCAT('✅ Registros eliminados: ', ROW_COUNT()) AS resultado;

-- ========================================
-- PASO 4: ELIMINAR DUPLICADOS DE SOLICITANTES
-- ========================================

SELECT '🗑️ Eliminando duplicados de SOLICITANTES' AS '═══════════════════════════════════';

-- Conservar el registro más antiguo, eliminar los demás
DELETE s1 FROM solicitantes s1
INNER JOIN solicitantes s2
WHERE REPLACE(REPLACE(REPLACE(UPPER(s1.rut), '.', ''), '-', ''), ' ', '') =
      REPLACE(REPLACE(REPLACE(UPPER(s2.rut), '.', ''), '-', ''), ' ', '')
AND s1.id > s2.id;

SELECT CONCAT('✅ Registros eliminados: ', ROW_COUNT()) AS resultado;

-- ========================================
-- PASO 5: ELIMINAR DUPLICADOS DE EMPRESAS_EXTERNAS
-- ========================================

SELECT '🗑️ Eliminando duplicados de EMPRESAS_EXTERNAS' AS '═══════════════════════════════════';

DELETE e1 FROM empresas_externas e1
INNER JOIN empresas_externas e2
WHERE REPLACE(REPLACE(REPLACE(UPPER(e1.rut), '.', ''), '-', ''), ' ', '') =
      REPLACE(REPLACE(REPLACE(UPPER(e2.rut), '.', ''), '-', ''), ' ', '')
AND e1.id_empresa > e2.id_empresa;

SELECT CONCAT('✅ Registros eliminados: ', ROW_COUNT()) AS resultado;

-- ========================================
-- PASO 6: VERIFICAR QUE NO QUEDAN DUPLICADOS
-- ========================================

SELECT '✅ Verificando que no quedan duplicados' AS '═══════════════════════════════════';

SELECT
    'solicitantes' AS tabla,
    COUNT(*) AS total_registros,
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')) AS ruts_unicos,
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')) AS duplicados_restantes
FROM solicitantes
UNION ALL
SELECT
    'personal_interno',
    COUNT(*),
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')),
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM personal_interno
UNION ALL
SELECT
    'personal_externo',
    COUNT(*),
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')),
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM personal_externo
UNION ALL
SELECT
    'empresas_externas',
    COUNT(*),
    COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '')),
    COUNT(*) - COUNT(DISTINCT REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''))
FROM empresas_externas;

-- ========================================
-- PASO 7: RECREAR FOREIGN KEYS (sin normalizar aún)
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
-- COMPLETADO
-- ========================================

SELECT '🎉 DUPLICADOS ELIMINADOS EXITOSAMENTE' AS resultado;
SELECT 'Ahora puedes ejecutar paso3_normalizar_ruts_final.sql' AS siguiente_paso;
