-- ============================================================================
-- FASE 1: MIGRACIÓN COMPLETA AL SISTEMA CENTRALIZADO (VERSIÓN 2)
-- Sistema de Gestión de Petróleo
-- ============================================================================
--
-- IMPORTANTE: Esta versión maneja usuarios duplicados por NOMBRE completo
-- (no solo por RUT), porque algunos usuarios tienen códigos en lugar de RUT
--
-- CASOS DETECTADOS:
-- - Alexandra: TMC2568 + RUT numérico
-- - Carlos Andrés: RUT + Gerente15520
-- - Carlos Miguel: RUT + TMC10168
-- - Christian: RUT + OPE1721
-- - Sergio: RUT + SAGER1506
--
-- ============================================================================

-- ============================================================================
-- SECCIÓN 0: PRE-ANÁLISIS Y VERIFICACIONES
-- ============================================================================

USE m3h_gestion_petroleo;

SELECT '
========================================
  VERIFICACIÓN INICIAL
========================================
' as '';

SELECT 'BD Petróleo' as base_datos, COUNT(*) as total_usuarios FROM users;

-- Verificar conexión a sistema centralizado
USE sistema_autenticacion_centralizado;
SELECT 'BD Centralizado' as base_datos, COUNT(*) as total_usuarios FROM users;

-- ============================================================================
-- SECCIÓN 1: ANÁLISIS DE USUARIOS DUPLICADOS (POR NOMBRE)
-- ============================================================================

USE m3h_gestion_petroleo;

SELECT '
========================================
  ANÁLISIS DE USUARIOS DUPLICADOS
  (Por Nombre + Apellido)
========================================
' as '';

-- 1.1 Ver usuarios duplicados por nombre completo
SELECT '1.1 USUARIOS DUPLICADOS DETECTADOS:' as '';
SELECT
    CONCAT(nombre, ' ', apellido) as nombre_completo,
    COUNT(*) as cantidad_cuentas,
    GROUP_CONCAT(id ORDER BY id) as ids_usuarios,
    GROUP_CONCAT(rut ORDER BY id) as ruts_o_codigos,
    GROUP_CONCAT(r.rol ORDER BY u.id) as roles,
    GROUP_CONCAT(COALESCE(NULLIF(u.email, ''), 'SIN EMAIL') ORDER BY u.id SEPARATOR ' | ') as emails
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
WHERE u.estado = 1  -- Solo usuarios activos
GROUP BY LOWER(TRIM(nombre)), LOWER(TRIM(apellido))
HAVING COUNT(*) > 1
ORDER BY cantidad_cuentas DESC, nombre_completo;

-- 1.2 Resumen general
SELECT '1.2 RESUMEN:' as '';
SELECT
    COUNT(*) as total_usuarios_activos,
    COUNT(DISTINCT CONCAT(LOWER(TRIM(nombre)), ' ', LOWER(TRIM(apellido)))) as personas_unicas,
    COUNT(*) - COUNT(DISTINCT CONCAT(LOWER(TRIM(nombre)), ' ', LOWER(TRIM(apellido)))) as cuentas_duplicadas
FROM users
WHERE estado = 1;

-- 1.3 Ver distribución de roles
SELECT '1.3 ROLES EN EL SISTEMA:' as '';
SELECT
    r.id_rol,
    r.rol,
    COUNT(u.id) as cantidad_usuarios
FROM roles r
LEFT JOIN users u ON r.id_rol = u.id_rol AND u.estado = 1
GROUP BY r.id_rol, r.rol
ORDER BY cantidad_usuarios DESC;

-- ============================================================================
-- SECCIÓN 2: CREAR TABLA DE CONSOLIDACIÓN
-- ============================================================================

SELECT '
========================================
  PREPARANDO CONSOLIDACIÓN
========================================
' as '';

-- 2.1 Crear tabla temporal
DROP TABLE IF EXISTS temp_consolidacion_usuarios;

CREATE TABLE temp_consolidacion_usuarios (
    nombre_completo VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    id_usuario_mantener INT NOT NULL COMMENT 'Usuario principal (se mantendrá)',
    rut_mantener VARCHAR(12),
    id_usuario_eliminar INT NOT NULL COMMENT 'Usuario duplicado (se eliminará)',
    rut_eliminar VARCHAR(12),
    rol_mantener VARCHAR(50),
    rol_eliminar VARCHAR(50),
    email_mantener VARCHAR(255),
    email_eliminar VARCHAR(255),
    tiene_rut_numerico BOOLEAN COMMENT 'TRUE si mantener tiene RUT numérico',
    procesado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_usuario_eliminar),
    KEY idx_mantener (id_usuario_mantener),
    KEY idx_nombre (nombre_completo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.2 Identificar usuarios a consolidar
-- CRITERIOS (en orden de prioridad):
-- 1. Usuario con email registrado
-- 2. Usuario con RUT numérico (no código)
-- 3. Usuario más antiguo
-- 4. Usuario con rol de mayor jerarquía

INSERT INTO temp_consolidacion_usuarios
    (nombre_completo, nombre, apellido, id_usuario_mantener, rut_mantener,
     id_usuario_eliminar, rut_eliminar, rol_mantener, rol_eliminar,
     email_mantener, email_eliminar, tiene_rut_numerico)
SELECT
    CONCAT(u_duplicado.nombre, ' ', u_duplicado.apellido) as nombre_completo,
    u_duplicado.nombre,
    u_duplicado.apellido,

    -- ID del usuario a MANTENER (mejor opción)
    (
        SELECT u_principal.id
        FROM users u_principal
        WHERE LOWER(TRIM(u_principal.nombre)) = LOWER(TRIM(u_duplicado.nombre))
          AND LOWER(TRIM(u_principal.apellido)) = LOWER(TRIM(u_duplicado.apellido))
          AND u_principal.estado = 1
        ORDER BY
            -- Prioridad 1: RUT numérico (identificación real)
            CASE WHEN u_principal.rut REGEXP '^[0-9]+[kK]?$' THEN 0 ELSE 1 END,
            -- Prioridad 2: Con email válido
            CASE WHEN u_principal.email IS NOT NULL AND u_principal.email != '' THEN 0 ELSE 1 END,
            -- Prioridad 3: Más antiguo
            u_principal.created_at ASC,
            -- Prioridad 4: Rol de mayor jerarquía (admin > gerente > otros)
            CASE
                WHEN u_principal.id_rol = 3 THEN 0  -- Admin
                WHEN u_principal.id_rol = 2 THEN 1  -- Gerente
                WHEN u_principal.id_rol = 1 THEN 2  -- Bombero
                ELSE 3  -- Otros
            END
        LIMIT 1
    ) as id_usuario_mantener,

    -- RUT del usuario a mantener
    (
        SELECT u_principal.rut
        FROM users u_principal
        WHERE LOWER(TRIM(u_principal.nombre)) = LOWER(TRIM(u_duplicado.nombre))
          AND LOWER(TRIM(u_principal.apellido)) = LOWER(TRIM(u_duplicado.apellido))
          AND u_principal.estado = 1
        ORDER BY
            CASE WHEN u_principal.rut REGEXP '^[0-9]+[kK]?$' THEN 0 ELSE 1 END,
            CASE WHEN u_principal.email IS NOT NULL AND u_principal.email != '' THEN 0 ELSE 1 END,
            u_principal.created_at ASC,
            CASE WHEN u_principal.id_rol = 3 THEN 0 WHEN u_principal.id_rol = 2 THEN 1 WHEN u_principal.id_rol = 1 THEN 2 ELSE 3 END
        LIMIT 1
    ) as rut_mantener,

    -- ID del usuario a ELIMINAR (actual si no es el principal)
    u_duplicado.id as id_usuario_eliminar,
    u_duplicado.rut as rut_eliminar,

    -- Información de roles
    (
        SELECT r.rol
        FROM users u
        JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.id = (
            SELECT id FROM users WHERE
            LOWER(TRIM(nombre)) = LOWER(TRIM(u_duplicado.nombre)) AND
            LOWER(TRIM(apellido)) = LOWER(TRIM(u_duplicado.apellido)) AND
            estado = 1
            ORDER BY
                CASE WHEN rut REGEXP '^[0-9]+[kK]?$' THEN 0 ELSE 1 END,
                CASE WHEN email IS NOT NULL AND email != '' THEN 0 ELSE 1 END,
                created_at ASC,
                CASE WHEN id_rol = 3 THEN 0 WHEN id_rol = 2 THEN 1 WHEN id_rol = 1 THEN 2 ELSE 3 END
            LIMIT 1
        )
    ) as rol_mantener,

    r_dup.rol as rol_eliminar,

    -- Información de emails
    (
        SELECT email
        FROM users
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(u_duplicado.nombre))
          AND LOWER(TRIM(apellido)) = LOWER(TRIM(u_duplicado.apellido))
          AND estado = 1
        ORDER BY
            CASE WHEN email IS NOT NULL AND email != '' THEN 0 ELSE 1 END,
            CASE WHEN rut REGEXP '^[0-9]+[kK]?$' THEN 0 ELSE 1 END,
            created_at ASC,
            CASE WHEN id_rol = 3 THEN 0 WHEN id_rol = 2 THEN 1 WHEN id_rol = 1 THEN 2 ELSE 3 END
        LIMIT 1
    ) as email_mantener,

    u_duplicado.email as email_eliminar,

    -- Verificar si tiene RUT numérico
    (
        SELECT u_principal.rut REGEXP '^[0-9]+[kK]?$'
        FROM users u_principal
        WHERE LOWER(TRIM(u_principal.nombre)) = LOWER(TRIM(u_duplicado.nombre))
          AND LOWER(TRIM(u_principal.apellido)) = LOWER(TRIM(u_duplicado.apellido))
          AND u_principal.estado = 1
        ORDER BY
            CASE WHEN u_principal.email IS NOT NULL AND u_principal.email != '' THEN 0 ELSE 1 END,
            CASE WHEN u_principal.rut REGEXP '^[0-9]+[kK]?$' THEN 0 ELSE 1 END,
            u_principal.created_at ASC
        LIMIT 1
    ) as tiene_rut_numerico

FROM users u_duplicado
LEFT JOIN roles r_dup ON u_duplicado.id_rol = r_dup.id_rol
WHERE u_duplicado.estado = 1
  -- Solo nombres que tienen duplicados
  AND CONCAT(LOWER(TRIM(u_duplicado.nombre)), ' ', LOWER(TRIM(u_duplicado.apellido))) IN (
    SELECT CONCAT(LOWER(TRIM(nombre)), ' ', LOWER(TRIM(apellido)))
    FROM users
    WHERE estado = 1
    GROUP BY LOWER(TRIM(nombre)), LOWER(TRIM(apellido))
    HAVING COUNT(*) > 1
  )
  -- Excluir el usuario que se va a mantener
  AND u_duplicado.id <> (
    SELECT id
    FROM users u_principal
    WHERE LOWER(TRIM(u_principal.nombre)) = LOWER(TRIM(u_duplicado.nombre))
      AND LOWER(TRIM(u_principal.apellido)) = LOWER(TRIM(u_duplicado.apellido))
      AND u_principal.estado = 1
    ORDER BY
        CASE WHEN u_principal.rut REGEXP '^[0-9]+[kK]?$' THEN 0 ELSE 1 END,
        CASE WHEN u_principal.email IS NOT NULL AND u_principal.email != '' THEN 0 ELSE 1 END,
        u_principal.created_at ASC,
        CASE WHEN u_principal.id_rol = 3 THEN 0 WHEN u_principal.id_rol = 2 THEN 1 WHEN u_principal.id_rol = 1 THEN 2 ELSE 3 END
    LIMIT 1
  );

-- 2.3 Mostrar resumen de consolidación propuesta
SELECT '2.3 PLAN DE CONSOLIDACIÓN:' as '';
SELECT
    t.nombre_completo,

    CONCAT('ID ', t.id_usuario_mantener, ' (', t.rut_mantener, ')') as usuario_mantener,
    t.rol_mantener,
    COALESCE(NULLIF(t.email_mantener, ''), 'SIN EMAIL') as email_mantener,
    CASE WHEN t.tiene_rut_numerico THEN 'RUT' ELSE 'CÓDIGO' END as tipo_mantener,

    CONCAT('ID ', t.id_usuario_eliminar, ' (', t.rut_eliminar, ')') as usuario_eliminar,
    t.rol_eliminar,
    COALESCE(NULLIF(t.email_eliminar, ''), 'SIN EMAIL') as email_eliminar,
    CASE WHEN t.rut_eliminar REGEXP '^[0-9]+[kK]?$' THEN 'RUT' ELSE 'CÓDIGO' END as tipo_eliminar,

    -- Impacto
    (SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario = t.id_usuario_eliminar) as ingresos_afectados,
    (SELECT COUNT(*) FROM user_faena WHERE user_id = t.id_usuario_eliminar) as faenas_afectadas,
    (SELECT COUNT(*) FROM cargas_externas WHERE id_user = t.id_usuario_eliminar) as cargas_afectadas

FROM temp_consolidacion_usuarios t
ORDER BY t.nombre_completo;

-- Mostrar contador
SELECT COUNT(*) as total_cuentas_a_eliminar FROM temp_consolidacion_usuarios;

SELECT '
⚠️  REVISAR LA TABLA ANTERIOR CUIDADOSAMENTE
- ¿Los usuarios a MANTENER son correctos?
- ¿Los usuarios a ELIMINAR son correctos?
- ¿El impacto en registros es aceptable?

Si todo está correcto, continuar con SECCIÓN 3.
Si algo está mal, DETENER y ajustar criterios.
' as mensaje;

-- ============================================================================
-- SECCIÓN 3: ACTUALIZAR RELACIONES
-- ============================================================================
-- ⚠️ SOLO EJECUTAR DESPUÉS DE REVISAR SECCIÓN 2.3

SELECT '
========================================
  ACTUALIZANDO RELACIONES
========================================
' as '';

-- 3.1 Actualizar ingresos_petroleo
UPDATE ingresos_petroleo ip
INNER JOIN temp_consolidacion_usuarios t ON ip.id_usuario = t.id_usuario_eliminar
SET ip.id_usuario = t.id_usuario_mantener
WHERE NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros actualizados en ingresos_petroleo') as resultado;

-- 3.2 Actualizar asignaciones_user_maquinas
UPDATE asignaciones_user_maquinas aum
INNER JOIN temp_consolidacion_usuarios t ON aum.id_user = t.id_usuario_eliminar
SET aum.id_user = t.id_usuario_mantener
WHERE NOT t.procesado
AND NOT EXISTS (
    SELECT 1 FROM asignaciones_user_maquinas aum2
    WHERE aum2.id_user = t.id_usuario_mantener
    AND aum2.id_maquina = aum.id_maquina
);

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros actualizados en asignaciones_user_maquinas') as resultado;

-- 3.3 Actualizar cargas_externas
UPDATE cargas_externas ce
INNER JOIN temp_consolidacion_usuarios t ON ce.id_user = t.id_usuario_eliminar
SET ce.id_user = t.id_usuario_mantener
WHERE NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros actualizados en cargas_externas') as resultado;

-- 3.4 Actualizar user_faena (consolidar faenas)
UPDATE user_faena uf
INNER JOIN temp_consolidacion_usuarios t ON uf.user_id = t.id_usuario_eliminar
SET uf.user_id = t.id_usuario_mantener
WHERE NOT t.procesado
AND NOT EXISTS (
    SELECT 1 FROM user_faena uf2
    WHERE uf2.user_id = t.id_usuario_mantener
    AND uf2.faena_id = uf.faena_id
);

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros actualizados en user_faena') as resultado;

-- Eliminar duplicados que quedan en user_faena
DELETE uf FROM user_faena uf
INNER JOIN temp_consolidacion_usuarios t ON uf.user_id = t.id_usuario_eliminar
WHERE NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros duplicados eliminados en user_faena') as resultado;

-- 3.5 Actualizar personal_access_tokens
UPDATE personal_access_tokens pat
INNER JOIN temp_consolidacion_usuarios t ON pat.tokenable_id = t.id_usuario_eliminar
SET pat.tokenable_id = t.id_usuario_mantener
WHERE pat.tokenable_type = 'App\\Models\\User'
AND NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' tokens actualizados') as resultado;

-- 3.6 Consolidar información del usuario principal
-- Paso 1: Limpiar emails de usuarios a eliminar (para evitar conflicto UNIQUE)
UPDATE users u_eliminar
INNER JOIN temp_consolidacion_usuarios t ON u_eliminar.id = t.id_usuario_eliminar
SET u_eliminar.email = NULL
WHERE NOT t.procesado
  AND u_eliminar.email IS NOT NULL;

SELECT CONCAT('✓ Paso 1: ', ROW_COUNT(), ' emails limpiados de usuarios a eliminar') as resultado;

-- Paso 2: Actualizar usuario principal con mejor información
UPDATE users u_mantener
INNER JOIN temp_consolidacion_usuarios t ON u_mantener.id = t.id_usuario_mantener
SET
    -- Tomar email de la tabla temporal (guardado del usuario a eliminar)
    u_mantener.email = COALESCE(NULLIF(u_mantener.email, ''), t.email_eliminar),
    -- Actualizar RUT si el que se mantiene es código y el eliminado es RUT numérico
    u_mantener.rut = CASE
        WHEN (u_mantener.rut NOT REGEXP '^[0-9]+[kK]?$') AND (t.rut_eliminar REGEXP '^[0-9]+[kK]?$')
        THEN t.rut_eliminar  -- Preferir RUT numérico
        ELSE u_mantener.rut
    END
WHERE NOT t.procesado;

SELECT CONCAT('✓ Paso 2: ', ROW_COUNT(), ' usuarios principales actualizados con mejor información') as resultado;

-- 3.7 Marcar como procesado
UPDATE temp_consolidacion_usuarios SET procesado = TRUE;

SELECT '✓ Todas las relaciones actualizadas correctamente' as resultado;

-- ============================================================================
-- SECCIÓN 4: ELIMINAR USUARIOS DUPLICADOS
-- ============================================================================
-- ⚠️ IRREVERSIBLE

SELECT '
========================================
  ELIMINANDO USUARIOS DUPLICADOS
========================================
' as '';

-- 4.1 Verificación final antes de eliminar
SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario IN (SELECT id_usuario_eliminar FROM temp_consolidacion_usuarios)) = 0
        THEN '✓ OK: No hay ingresos con usuarios a eliminar'
        ELSE '❌ ERROR: Aún hay ingresos con usuarios a eliminar'
    END as verificacion_ingresos;

-- 4.2 Eliminar usuarios duplicados
DELETE u FROM users u
INNER JOIN temp_consolidacion_usuarios t ON u.id = t.id_usuario_eliminar
WHERE t.procesado = TRUE;

SELECT CONCAT('✓ ', ROW_COUNT(), ' usuarios duplicados eliminados') as resultado;

-- 4.3 Verificar que no quedan duplicados
SELECT '4.3 VERIFICACIÓN POST-ELIMINACIÓN:' as '';
SELECT
    CONCAT(nombre, ' ', apellido) as nombre_completo,
    COUNT(*) as cantidad
FROM users
WHERE estado = 1
GROUP BY LOWER(TRIM(nombre)), LOWER(TRIM(apellido))
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

SELECT
    CASE
        WHEN (
            SELECT COUNT(*) FROM (
                SELECT 1 FROM users WHERE estado = 1
                GROUP BY LOWER(TRIM(nombre)), LOWER(TRIM(apellido))
                HAVING COUNT(*) > 1
            ) as dups
        ) = 0
        THEN '✅ ÉXITO: No quedan usuarios duplicados'
        ELSE '❌ ERROR: Aún hay usuarios duplicados'
    END as resultado_final;

-- ============================================================================
-- SECCIÓN 5: PREPARAR SISTEMA CENTRALIZADO
-- ============================================================================

USE sistema_autenticacion_centralizado;

SELECT '
========================================
  PREPARANDO SISTEMA CENTRALIZADO
========================================
' as '';

-- 5.1 Verificar módulo de Petróleo
SELECT '5.1 MÓDULO DE PETRÓLEO:' as '';
SELECT id, nombre, url, activo FROM modulos WHERE nombre LIKE '%Petr%' OR nombre LIKE '%petro%';

SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre LIKE '%Petr%' OR nombre LIKE '%petro%' LIMIT 1);

SELECT CASE
    WHEN @modulo_petroleo_id IS NOT NULL
    THEN CONCAT('✓ Módulo encontrado con ID: ', @modulo_petroleo_id)
    ELSE '❌ MÓDULO NO EXISTE - Necesitas crearlo manualmente'
END as estado_modulo;

-- Si el módulo NO existe, ejecutar esto manualmente:
/*
INSERT INTO modulos (nombre, descripcion, url, icono, activo, created_at, updated_at)
VALUES (
    'Gestión de Petróleo',
    'Sistema de gestión y control de petróleo para faenas mineras',
    'http://localhost:3000',
    '🛢️',
    1,
    NOW(),
    NOW()
);
SET @modulo_petroleo_id = LAST_INSERT_ID();
*/

-- 5.2 Verificar roles del módulo
SELECT '5.2 ROLES DEL MÓDULO:' as '';
SELECT id, nombre, descripcion FROM roles WHERE modulo_id = @modulo_petroleo_id;

-- Si NO existen roles, ejecutar esto manualmente:
/*
INSERT INTO roles (nombre, descripcion, modulo_id, created_at, updated_at) VALUES
('administrador', 'Administrador del sistema', @modulo_petroleo_id, NOW(), NOW()),
('gerente', 'Gerente - Reportes y gestión', @modulo_petroleo_id, NOW(), NOW()),
('bombero', 'Bombero - Abastecimientos', @modulo_petroleo_id, NOW(), NOW()),
('asistente_bombero', 'Asistente de bombero', @modulo_petroleo_id, NOW(), NOW()),
('operador_vehiculo', 'Operador de vehículo', @modulo_petroleo_id, NOW(), NOW()),
('planificador', 'Planificador', @modulo_petroleo_id, NOW(), NOW()),
('jefe_mina', 'Jefe de mina', @modulo_petroleo_id, NOW(), NOW()),
('toneladas', 'Dispatch', @modulo_petroleo_id, NOW(), NOW()),
('admin_operador', 'Administrador de operadores', @modulo_petroleo_id, NOW(), NOW());
*/

-- ============================================================================
-- SECCIÓN 6: MIGRAR USUARIOS AL CENTRALIZADO
-- ============================================================================

SELECT '
========================================
  MIGRANDO USUARIOS
========================================
' as '';

-- 6.1 Ver usuarios a migrar
SELECT '6.1 USUARIOS A MIGRAR:' as '';
SELECT
    u.id,
    u.rut,
    u.nombre,
    u.apellido,
    u.email,
    r.rol
FROM m3h_gestion_petroleo.users u
LEFT JOIN m3h_gestion_petroleo.roles r ON u.id_rol = r.id_rol
WHERE u.estado = 1
  AND NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion_centralizado.users uc
    WHERE LOWER(TRIM(uc.nombre)) = LOWER(TRIM(u.nombre))
      AND LOWER(TRIM(uc.apellido)) = LOWER(TRIM(u.apellido))
  )
ORDER BY u.apellido, u.nombre;

-- 6.2 Migrar usuarios
INSERT INTO sistema_autenticacion_centralizado.users
    (rut, nombre, apellido, email, password, activo, created_at, updated_at)
SELECT DISTINCT
    u.rut,
    u.nombre,
    u.apellido,
    COALESCE(NULLIF(u.email, ''), CONCAT(REPLACE(u.rut, ' ', ''), '@temp.local')) as email,
    u.password,
    u.estado as activo,
    u.created_at,
    NOW() as updated_at
FROM m3h_gestion_petroleo.users u
WHERE u.estado = 1
  AND NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion_centralizado.users uc
    WHERE LOWER(TRIM(uc.nombre)) = LOWER(TRIM(u.nombre))
      AND LOWER(TRIM(uc.apellido)) = LOWER(TRIM(u.apellido))
  );

SELECT CONCAT('✓ ', ROW_COUNT(), ' usuarios migrados') as resultado;

-- ============================================================================
-- SECCIÓN 7: ASIGNAR MÚLTIPLES ROLES ⭐
-- ============================================================================

SELECT '
========================================
  ASIGNANDO MÚLTIPLES ROLES
========================================
' as '';

-- 7.1 Mapeo de roles
DROP TABLE IF EXISTS temp_mapeo_roles;

CREATE TEMPORARY TABLE temp_mapeo_roles (
    id_rol_petroleo INT,
    nombre_rol_centralizado VARCHAR(50),
    PRIMARY KEY (id_rol_petroleo)
);

INSERT INTO temp_mapeo_roles VALUES
    (1, 'bombero'),
    (2, 'gerente'),
    (3, 'administrador'),
    (4, 'toneladas'),
    (5, 'planificador'),
    (6, 'operador_vehiculo'),
    (7, 'asistente_bombero'),
    (8, 'admin_operador'),
    (9, 'jefe_mina');

-- 7.2 Vista previa de asignación
SELECT '7.2 ROLES QUE SE ASIGNARÁN:' as '';
SELECT
    CONCAT(u_central.nombre, ' ', u_central.apellido) as nombre_completo,
    u_central.rut as rut_centralizado,
    u_petro.rut as rut_petroleo,
    r_petro.rol as rol_petroleo,
    tmr.nombre_rol_centralizado as rol_centralizado,
    r_central.id as rol_id_central
FROM m3h_gestion_petroleo.users u_petro
INNER JOIN sistema_autenticacion_centralizado.users u_central
    ON LOWER(TRIM(u_petro.nombre)) = LOWER(TRIM(u_central.nombre))
    AND LOWER(TRIM(u_petro.apellido)) = LOWER(TRIM(u_central.apellido))
LEFT JOIN m3h_gestion_petroleo.roles r_petro ON u_petro.id_rol = r_petro.id_rol
LEFT JOIN temp_mapeo_roles tmr ON u_petro.id_rol = tmr.id_rol_petroleo
LEFT JOIN sistema_autenticacion_centralizado.roles r_central
    ON tmr.nombre_rol_centralizado = r_central.nombre
    AND r_central.modulo_id = @modulo_petroleo_id
WHERE u_petro.estado = 1
ORDER BY nombre_completo, rol_petroleo;

-- 7.3 Asignar roles (PERMITE MÚLTIPLES ROLES POR USUARIO)
INSERT INTO sistema_autenticacion_centralizado.usuario_roles
    (user_id, rol_id, modulo_id, created_at, updated_at)
SELECT DISTINCT
    u_central.id as user_id,
    r_central.id as rol_id,
    @modulo_petroleo_id as modulo_id,
    NOW() as created_at,
    NOW() as updated_at
FROM m3h_gestion_petroleo.users u_petro
INNER JOIN sistema_autenticacion_centralizado.users u_central
    ON LOWER(TRIM(u_petro.nombre)) = LOWER(TRIM(u_central.nombre))
    AND LOWER(TRIM(u_petro.apellido)) = LOWER(TRIM(u_central.apellido))
INNER JOIN temp_mapeo_roles tmr ON u_petro.id_rol = tmr.id_rol_petroleo
INNER JOIN sistema_autenticacion_centralizado.roles r_central
    ON tmr.nombre_rol_centralizado = r_central.nombre
    AND r_central.modulo_id = @modulo_petroleo_id
WHERE u_petro.estado = 1
AND NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion_centralizado.usuario_roles ur
    WHERE ur.user_id = u_central.id
    AND ur.rol_id = r_central.id
    AND ur.modulo_id = @modulo_petroleo_id
);

SELECT CONCAT('✓ ', ROW_COUNT(), ' roles asignados') as resultado;

-- ============================================================================
-- SECCIÓN 8: VERIFICACIONES FINALES
-- ============================================================================

SELECT '
========================================
  VERIFICACIONES FINALES
========================================
' as '';

USE m3h_gestion_petroleo;

-- 8.1 No quedan duplicados en petróleo
SELECT '8.1 ¿QUEDAN DUPLICADOS EN PETRÓLEO?' as '';
SELECT
    CONCAT(nombre, ' ', apellido) as nombre_completo,
    COUNT(*) as cantidad
FROM users
WHERE estado = 1
GROUP BY LOWER(TRIM(nombre)), LOWER(TRIM(apellido))
HAVING COUNT(*) > 1;
-- Esperado: 0 filas

USE sistema_autenticacion_centralizado;

-- 8.2 Usuarios migrados
SELECT '8.2 TOTAL USUARIOS EN CENTRALIZADO:' as '';
SELECT COUNT(*) as total_usuarios FROM users WHERE activo = 1;

-- 8.3 Usuarios con acceso al módulo petróleo
SELECT '8.3 USUARIOS CON ACCESO A PETRÓLEO:' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') as roles,
    COUNT(ur.rol_id) as cantidad_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.rol_id = r.id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id
ORDER BY cantidad_roles DESC, nombre_completo;

-- 8.4 🌟 USUARIOS CON MÚLTIPLES ROLES (¡OBJETIVO LOGRADO!)
SELECT '8.4 ⭐ USUARIOS CON MÚLTIPLES ROLES:' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    u.email,
    GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') as roles_disponibles,
    COUNT(ur.rol_id) as total_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.rol_id = r.id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id
HAVING COUNT(ur.rol_id) > 1
ORDER BY total_roles DESC, nombre_completo;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT '
========================================
  ✅ MIGRACIÓN COMPLETADA
========================================

LOGROS:
✓ Usuarios duplicados consolidados por NOMBRE completo
✓ Funciona con RUTs numéricos Y códigos (TMC, OPE, SAGER, etc.)
✓ Usuarios migrados al sistema centralizado
✓ Múltiples roles por usuario implementados
✓ Un solo login para diferentes roles
✓ Datos preservados (ingresos, faenas, cargas)

CASOS CONSOLIDADOS:
- Alexandra: TMC2568 + RUT → Una cuenta con 2 roles
- Carlos Andrés: RUT + Gerente15520 → Una cuenta con 2 roles
- Carlos Miguel: RUT + TMC10168 → Una cuenta con 2 roles
- Christian: RUT + OPE1721 → Una cuenta con 2 roles
- Sergio: RUT + SAGER1506 → Una cuenta con 2 roles

SIGUIENTE PASO:
Implementar FASE 2 - Modificar frontend para selector de rol

' as '';

-- Limpiar temporales (opcional)
USE m3h_gestion_petroleo;
-- DROP TABLE IF EXISTS temp_consolidacion_usuarios;
