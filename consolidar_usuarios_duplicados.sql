-- ============================================================================
-- SCRIPT PARA CONSOLIDAR USUARIOS DUPLICADOS
-- Sistema de Gestión de Petróleo
-- ============================================================================
--
-- PROBLEMA:
-- El sistema de petróleo creaba múltiples usuarios para la misma persona
-- según su rol (ej: Christian Saavedra tenía 2 cuentas: admin y operador)
--
-- SOLUCIÓN:
-- 1. Identificar usuarios duplicados (mismo RUT)
-- 2. Consolidar en un solo usuario
-- 3. Mantener el registro más completo
-- 4. Actualizar relaciones (ingresos, asignaciones, etc.)
--
-- IMPORTANTE: Hacer backup antes de ejecutar
-- ============================================================================

USE sistema_petroleo;

-- ============================================================================
-- PASO 1: ANÁLISIS - Ver usuarios duplicados
-- ============================================================================

-- Ver todos los usuarios duplicados por RUT
SELECT
    rut,
    COUNT(*) as cantidad,
    GROUP_CONCAT(id ORDER BY id) as ids_usuarios,
    GROUP_CONCAT(r.rol ORDER BY u.id) as roles,
    GROUP_CONCAT(u.nombre, ' ', u.apellido ORDER BY u.id SEPARATOR ' | ') as nombres
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
GROUP BY rut
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- ============================================================================
-- PASO 2: CREAR TABLA TEMPORAL DE MAPEO
-- ============================================================================
-- Esta tabla guardará qué usuarios se van a consolidar

DROP TABLE IF EXISTS temp_usuarios_consolidar;

CREATE TABLE temp_usuarios_consolidar (
    rut VARCHAR(12) NOT NULL,
    id_usuario_mantener INT NOT NULL COMMENT 'Usuario que se mantendrá',
    id_usuario_eliminar INT NOT NULL COMMENT 'Usuario que se eliminará',
    rol_eliminar VARCHAR(50) COMMENT 'Rol del usuario a eliminar',
    procesado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_usuario_eliminar),
    KEY idx_mantener (id_usuario_mantener)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- PASO 3: IDENTIFICAR USUARIOS A CONSOLIDAR
-- ============================================================================
-- Para cada RUT duplicado, mantener el usuario con más información completa
-- Criterios (en orden de prioridad):
-- 1. Usuario con email registrado
-- 2. Usuario más antiguo (created_at más temprano)
-- 3. Usuario con id_rol = 2 (admin)

INSERT INTO temp_usuarios_consolidar (rut, id_usuario_mantener, id_usuario_eliminar, rol_eliminar)
SELECT
    u.rut,
    (
        SELECT u2.id
        FROM users u2
        WHERE u2.rut = u.rut
        ORDER BY
            CASE WHEN u2.email IS NOT NULL THEN 0 ELSE 1 END,
            u2.created_at ASC,
            CASE WHEN u2.id_rol = 2 THEN 0 ELSE 1 END
        LIMIT 1
    ) as id_usuario_mantener,
    u.id as id_usuario_eliminar,
    r.rol as rol_eliminar
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
WHERE u.rut IN (
    SELECT rut
    FROM users
    GROUP BY rut
    HAVING COUNT(*) > 1
)
AND u.id NOT IN (
    SELECT u3.id
    FROM users u3
    WHERE u3.rut = u.rut
    ORDER BY
        CASE WHEN u3.email IS NOT NULL THEN 0 ELSE 1 END,
        u3.created_at ASC,
        CASE WHEN u3.id_rol = 2 THEN 0 ELSE 1 END
    LIMIT 1
);

-- Ver resultados del análisis
SELECT
    t.rut,
    CONCAT(u1.nombre, ' ', u1.apellido) as nombre_completo,
    u1.id as id_mantener,
    r1.rol as rol_mantener,
    u1.email as email_mantener,
    t.id_usuario_eliminar as id_eliminar,
    t.rol_eliminar,
    u2.email as email_eliminar
FROM temp_usuarios_consolidar t
INNER JOIN users u1 ON t.id_usuario_mantener = u1.id
INNER JOIN users u2 ON t.id_usuario_eliminar = u2.id
LEFT JOIN roles r1 ON u1.id_rol = r1.id_rol
ORDER BY t.rut;

-- ============================================================================
-- PASO 4: ACTUALIZAR RELACIONES
-- ============================================================================
-- IMPORTANTE: Ajustar según las tablas relacionadas en tu sistema

-- 4.1 Actualizar ingresos de petróleo
UPDATE ingresos_petroleo ip
INNER JOIN temp_usuarios_consolidar t ON ip.id_usuario = t.id_usuario_eliminar
SET ip.id_usuario = t.id_usuario_mantener
WHERE NOT t.procesado;

-- 4.2 Actualizar asignaciones de máquinas (si existe)
UPDATE asignaciones_user_maquinas aum
INNER JOIN temp_usuarios_consolidar t ON aum.id_user = t.id_usuario_eliminar
SET aum.id_user = t.id_usuario_mantener
WHERE NOT t.procesado
AND NOT EXISTS (
    -- Evitar duplicados
    SELECT 1 FROM asignaciones_user_maquinas aum2
    WHERE aum2.id_user = t.id_usuario_mantener
    AND aum2.id_maquina = aum.id_maquina
);

-- 4.3 Actualizar cargas externas (si existe)
UPDATE cargas_externas ce
INNER JOIN temp_usuarios_consolidar t ON ce.id_user = t.id_usuario_eliminar
SET ce.id_user = t.id_usuario_mantener
WHERE NOT t.procesado;

-- 4.4 Actualizar user_faena (relación muchos a muchos)
UPDATE user_faena uf
INNER JOIN temp_usuarios_consolidar t ON uf.user_id = t.id_usuario_eliminar
SET uf.user_id = t.id_usuario_mantener
WHERE NOT t.procesado
AND NOT EXISTS (
    -- Evitar duplicados
    SELECT 1 FROM user_faena uf2
    WHERE uf2.user_id = t.id_usuario_mantener
    AND uf2.faena_id = uf.faena_id
);

-- 4.5 Actualizar tokens de autenticación (personal_access_tokens)
UPDATE personal_access_tokens pat
INNER JOIN temp_usuarios_consolidar t ON pat.tokenable_id = t.id_usuario_eliminar
SET pat.tokenable_id = t.id_usuario_mantener
WHERE pat.tokenable_type = 'App\\Models\\User'
AND NOT t.procesado;

-- ============================================================================
-- PASO 5: CONSOLIDAR INFORMACIÓN DEL USUARIO
-- ============================================================================
-- Actualizar el usuario que se mantiene con la mejor información disponible

UPDATE users u_mantener
INNER JOIN temp_usuarios_consolidar t ON u_mantener.id = t.id_usuario_mantener
INNER JOIN users u_eliminar ON u_eliminar.id = t.id_usuario_eliminar
SET
    u_mantener.email = COALESCE(u_mantener.email, u_eliminar.email),
    u_mantener.nombre = COALESCE(NULLIF(u_mantener.nombre, ''), u_eliminar.nombre),
    u_mantener.apellido = COALESCE(NULLIF(u_mantener.apellido, ''), u_eliminar.apellido)
WHERE NOT t.procesado;

-- ============================================================================
-- PASO 6: ELIMINAR USUARIOS DUPLICADOS
-- ============================================================================
-- ATENCIÓN: Este paso es irreversible. Verificar resultados antes de ejecutar.

-- Marcar como procesado (hacer esto primero como checkpoint)
-- UPDATE temp_usuarios_consolidar SET procesado = TRUE;

-- Eliminar usuarios duplicados (DESCOMENTAR cuando estés seguro)
/*
DELETE u FROM users u
INNER JOIN temp_usuarios_consolidar t ON u.id = t.id_usuario_eliminar
WHERE t.procesado = TRUE;
*/

-- ============================================================================
-- PASO 7: VERIFICACIÓN POST-CONSOLIDACIÓN
-- ============================================================================

-- Verificar que no quedan duplicados
SELECT
    rut,
    COUNT(*) as cantidad,
    GROUP_CONCAT(id) as ids_usuarios
FROM users
GROUP BY rut
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

-- Ver cuántos usuarios se consolidaron
SELECT COUNT(*) as usuarios_consolidados
FROM temp_usuarios_consolidar;

-- Ver resumen final de usuarios
SELECT
    u.id,
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    u.email,
    r.rol,
    f.ubicacion as faena,
    u.estado,
    (SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario = u.id) as ingresos_count,
    u.created_at
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
LEFT JOIN faenas f ON u.id_faena = f.id_faena
ORDER BY u.rut;

-- ============================================================================
-- PASO 8: LIMPIAR DATOS TEMPORALES (Opcional)
-- ============================================================================
-- Solo ejecutar cuando todo esté funcionando correctamente

-- DROP TABLE IF EXISTS temp_usuarios_consolidar;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. BACKUP: Hacer backup completo antes de ejecutar
--    mysqldump -u root sistema_petroleo > backup_antes_consolidacion.sql
--
-- 2. PROBAR EN DESARROLLO: Ejecutar primero en entorno de desarrollo
--
-- 3. TABLAS RELACIONADAS: Este script incluye las tablas más comunes:
--    - ingresos_petroleo
--    - asignaciones_user_maquinas
--    - cargas_externas
--    - user_faena
--    - personal_access_tokens
--
--    Si tienes otras tablas que referencian users.id, agrégalas en el PASO 4
--
-- 4. VERIFICAR CONSTRAINTS: Asegurar que no hay foreign keys que impidan
--    la eliminación. Si hay problemas, desactivar temporalmente:
--    SET FOREIGN_KEY_CHECKS = 0;
--    ... realizar cambios ...
--    SET FOREIGN_KEY_CHECKS = 1;
--
-- 5. LOGS: Después de ejecutar, verificar el log de Laravel para errores
--
-- ============================================================================
-- CÓMO EJECUTAR PASO A PASO
-- ============================================================================
--
-- 1. Hacer backup:
--    mysqldump -u root sistema_petroleo > backup.sql
--
-- 2. Ejecutar PASO 1 (análisis) y revisar resultados
--
-- 3. Ejecutar PASOS 2-3 (crear tabla temporal e identificar duplicados)
--
-- 4. Revisar resultados del análisis en temp_usuarios_consolidar
--
-- 5. Ejecutar PASO 4 (actualizar relaciones)
--
-- 6. Ejecutar PASO 5 (consolidar información)
--
-- 7. Verificar que todo está correcto
--
-- 8. DESCOMENTAR y ejecutar el DELETE en PASO 6
--
-- 9. Ejecutar PASO 7 (verificaciones)
--
-- 10. Si todo está bien, ejecutar PASO 8 (limpiar temporales)
--
-- ============================================================================
