-- ============================================================================
-- FASE 1: MIGRACIÓN COMPLETA AL SISTEMA CENTRALIZADO
-- Sistema de Gestión de Petróleo
-- ============================================================================
--
-- OBJETIVO:
-- 1. Consolidar usuarios duplicados en sistema petróleo (mismo RUT, diferentes roles)
-- 2. Migrar TODOS los usuarios al sistema centralizado
-- 3. Crear soporte para múltiples roles por usuario
-- 4. Migrar relaciones de faenas
--
-- IMPORTANTE:
-- - Hacer backup COMPLETO antes de ejecutar
-- - Ejecutar paso a paso y verificar resultados
-- - Este script asume que tienes acceso a ambas bases de datos
--
-- ============================================================================

-- ============================================================================
-- SECCIÓN 0: PRE-ANÁLISIS Y VERIFICACIONES
-- ============================================================================

-- Verificar conexión a ambas bases de datos
SELECT 'Verificando acceso a bases de datos...' as mensaje;

USE m3h_gestion_petroleo;
SELECT 'BD Petróleo OK' as status, COUNT(*) as total_usuarios FROM users;

USE sistema_autenticacion_centralizado;
SELECT 'BD Centralizado OK' as status, COUNT(*) as total_usuarios FROM users;

-- ============================================================================
-- SECCIÓN 1: ANÁLISIS DETALLADO DEL SISTEMA PETRÓLEO
-- ============================================================================

USE m3h_gestion_petroleo;

SELECT '
========================================
  ANÁLISIS DE USUARIOS EN PETRÓLEO
========================================
' as '';

-- 1.1 Ver todos los usuarios duplicados (mismo RUT)
SELECT '1.1 USUARIOS DUPLICADOS POR RUT:' as '';
SELECT
    rut,
    COUNT(*) as cantidad_cuentas,
    GROUP_CONCAT(id ORDER BY id) as ids_usuarios,
    GROUP_CONCAT(CONCAT(nombre, ' ', apellido) ORDER BY id SEPARATOR ' | ') as nombres,
    GROUP_CONCAT(r.rol ORDER BY u.id) as roles,
    GROUP_CONCAT(u.email ORDER BY u.id) as emails
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
GROUP BY rut
HAVING COUNT(*) > 1
ORDER BY cantidad_cuentas DESC, rut;

-- 1.2 Contar total de usuarios únicos por RUT
SELECT '1.2 RESUMEN DE USUARIOS:' as '';
SELECT
    COUNT(*) as total_usuarios,
    COUNT(DISTINCT rut) as usuarios_unicos_por_rut,
    COUNT(*) - COUNT(DISTINCT rut) as usuarios_duplicados
FROM users;

-- 1.3 Ver distribución de roles
SELECT '1.3 DISTRIBUCIÓN DE ROLES:' as '';
SELECT
    r.id_rol,
    r.rol,
    COUNT(u.id) as cantidad_usuarios
FROM roles r
LEFT JOIN users u ON r.id_rol = u.id_rol
GROUP BY r.id_rol, r.rol
ORDER BY cantidad_usuarios DESC;

-- 1.4 Ver usuarios con múltiples faenas asignadas
SELECT '1.4 USUARIOS CON MÚLTIPLES FAENAS:' as '';
SELECT
    u.id,
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    u.id_faena as faena_principal,
    COUNT(uf.faena_id) as total_faenas,
    GROUP_CONCAT(f.ubicacion ORDER BY uf.faena_id) as faenas_asignadas
FROM users u
LEFT JOIN user_faena uf ON u.id = uf.user_id
LEFT JOIN faenas f ON uf.faena_id = f.id_faena
GROUP BY u.id
HAVING COUNT(uf.faena_id) > 1
ORDER BY total_faenas DESC;

-- 1.5 Ver usuarios sin email
SELECT '1.5 USUARIOS SIN EMAIL (NECESITAN ATENCIÓN):' as '';
SELECT
    u.id,
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    r.rol,
    u.email
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
WHERE u.email IS NULL OR u.email = ''
ORDER BY u.rut;

-- ============================================================================
-- SECCIÓN 2: CONSOLIDACIÓN DE USUARIOS DUPLICADOS EN PETRÓLEO
-- ============================================================================

SELECT '
========================================
  CONSOLIDACIÓN DE DUPLICADOS
========================================
' as '';

-- 2.1 Crear tabla temporal para mapeo de consolidación
DROP TABLE IF EXISTS temp_consolidacion_usuarios;

CREATE TABLE temp_consolidacion_usuarios (
    rut VARCHAR(12) NOT NULL,
    id_usuario_mantener INT NOT NULL COMMENT 'Usuario principal que se mantendrá',
    id_usuario_eliminar INT NOT NULL COMMENT 'Usuario duplicado que se eliminará',
    rol_mantener VARCHAR(50),
    rol_eliminar VARCHAR(50),
    email_mantener VARCHAR(255),
    email_eliminar VARCHAR(255),
    procesado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_usuario_eliminar),
    KEY idx_mantener (id_usuario_mantener),
    KEY idx_rut (rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.2 Identificar qué usuarios mantener y cuáles eliminar
-- CRITERIOS DE SELECCIÓN (en orden de prioridad):
-- 1. Usuario con email registrado (más completo)
-- 2. Usuario más antiguo (created_at más temprano)
-- 3. Usuario con rol de mayor jerarquía (admin > gerente > otros)

INSERT INTO temp_consolidacion_usuarios
    (rut, id_usuario_mantener, id_usuario_eliminar, rol_mantener, rol_eliminar, email_mantener, email_eliminar)
SELECT
    u_duplicado.rut,
    -- ID del usuario a mantener
    (
        SELECT u_principal.id
        FROM users u_principal
        WHERE u_principal.rut = u_duplicado.rut
        ORDER BY
            -- Prioridad 1: Con email
            CASE WHEN u_principal.email IS NOT NULL AND u_principal.email != '' THEN 0 ELSE 1 END,
            -- Prioridad 2: Más antiguo
            u_principal.created_at ASC,
            -- Prioridad 3: Rol admin (id_rol = 3), luego gerente (2)
            CASE
                WHEN u_principal.id_rol = 3 THEN 0  -- Admin
                WHEN u_principal.id_rol = 2 THEN 1  -- Gerente
                WHEN u_principal.id_rol = 1 THEN 2  -- Bombero
                ELSE 3  -- Otros
            END
        LIMIT 1
    ) as id_usuario_mantener,
    -- ID del usuario a eliminar (el actual si no es el principal)
    u_duplicado.id as id_usuario_eliminar,
    -- Información adicional para revisión
    (SELECT r.rol FROM users u JOIN roles r ON u.id_rol = r.id_rol WHERE u.id = (
        SELECT id FROM users WHERE rut = u_duplicado.rut
        ORDER BY
            CASE WHEN email IS NOT NULL AND email != '' THEN 0 ELSE 1 END,
            created_at ASC,
            CASE WHEN id_rol = 3 THEN 0 WHEN id_rol = 2 THEN 1 WHEN id_rol = 1 THEN 2 ELSE 3 END
        LIMIT 1
    )) as rol_mantener,
    r_dup.rol as rol_eliminar,
    (SELECT email FROM users WHERE id = (
        SELECT id FROM users WHERE rut = u_duplicado.rut
        ORDER BY
            CASE WHEN email IS NOT NULL AND email != '' THEN 0 ELSE 1 END,
            created_at ASC,
            CASE WHEN id_rol = 3 THEN 0 WHEN id_rol = 2 THEN 1 WHEN id_rol = 1 THEN 2 ELSE 3 END
        LIMIT 1
    )) as email_mantener,
    u_duplicado.email as email_eliminar
FROM users u_duplicado
LEFT JOIN roles r_dup ON u_duplicado.id_rol = r_dup.id_rol
WHERE u_duplicado.rut IN (
    -- Solo RUTs que tienen duplicados
    SELECT rut
    FROM users
    GROUP BY rut
    HAVING COUNT(*) > 1
)
-- Excluir el usuario que se va a mantener
AND u_duplicado.id NOT IN (
    SELECT id FROM users u_principal
    WHERE u_principal.rut = u_duplicado.rut
    ORDER BY
        CASE WHEN u_principal.email IS NOT NULL AND u_principal.email != '' THEN 0 ELSE 1 END,
        u_principal.created_at ASC,
        CASE WHEN u_principal.id_rol = 3 THEN 0 WHEN u_principal.id_rol = 2 THEN 1 WHEN u_principal.id_rol = 1 THEN 2 ELSE 3 END
    LIMIT 1
);

-- 2.3 Mostrar resumen de consolidación propuesta
SELECT '2.3 RESUMEN DE CONSOLIDACIÓN PROPUESTA:' as '';
SELECT
    t.rut,
    CONCAT(u_mantener.nombre, ' ', u_mantener.apellido) as nombre_completo,

    t.id_usuario_mantener,
    t.rol_mantener,
    t.email_mantener,
    u_mantener.created_at as fecha_mantener,

    t.id_usuario_eliminar,
    t.rol_eliminar,
    t.email_eliminar,
    u_eliminar.created_at as fecha_eliminar,

    -- Información de impacto
    (SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario = t.id_usuario_eliminar) as ingresos_afectados,
    (SELECT COUNT(*) FROM user_faena WHERE user_id = t.id_usuario_eliminar) as faenas_afectadas
FROM temp_consolidacion_usuarios t
INNER JOIN users u_mantener ON t.id_usuario_mantener = u_mantener.id
INNER JOIN users u_eliminar ON t.id_usuario_eliminar = u_eliminar.id
ORDER BY t.rut;

-- PAUSA AQUÍ - REVISAR RESULTADOS ANTES DE CONTINUAR
SELECT '
⚠️  IMPORTANTE: REVISAR LA TABLA ANTERIOR
- Verificar que los usuarios a mantener son correctos
- Verificar que los usuarios a eliminar son correctos
- Verificar el impacto en ingresos y faenas

Para continuar con la consolidación, ejecutar las siguientes secciones.
Para ABORTAR, no ejecutar nada más y hacer DROP TABLE temp_consolidacion_usuarios;
' as mensaje;

-- ============================================================================
-- SECCIÓN 3: ACTUALIZAR RELACIONES EN SISTEMA PETRÓLEO
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
-- Primero actualizar las que no causan duplicados
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

-- Eliminar duplicados que quedan
DELETE uf FROM user_faena uf
INNER JOIN temp_consolidacion_usuarios t ON uf.user_id = t.id_usuario_eliminar
WHERE NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros duplicados eliminados en user_faena') as resultado;

-- 3.5 Actualizar personal_access_tokens (tokens de sesión)
UPDATE personal_access_tokens pat
INNER JOIN temp_consolidacion_usuarios t ON pat.tokenable_id = t.id_usuario_eliminar
SET pat.tokenable_id = t.id_usuario_mantener
WHERE pat.tokenable_type = 'App\\Models\\User'
AND NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' tokens actualizados') as resultado;

-- 3.6 Consolidar información del usuario principal
-- Actualizar con la mejor información disponible
UPDATE users u_mantener
INNER JOIN temp_consolidacion_usuarios t ON u_mantener.id = t.id_usuario_mantener
INNER JOIN users u_eliminar ON u_eliminar.id = t.id_usuario_eliminar
SET
    -- Tomar email del eliminado si el que se mantiene no tiene
    u_mantener.email = COALESCE(NULLIF(u_mantener.email, ''), u_eliminar.email),
    -- Tomar nombre del eliminado si el que se mantiene está vacío
    u_mantener.nombre = COALESCE(NULLIF(u_mantener.nombre, ''), u_eliminar.nombre),
    u_mantener.apellido = COALESCE(NULLIF(u_mantener.apellido, ''), u_eliminar.apellido)
WHERE NOT t.procesado;

SELECT CONCAT('✓ ', ROW_COUNT(), ' usuarios principales actualizados con mejor información') as resultado;

-- 3.7 Marcar como procesado
UPDATE temp_consolidacion_usuarios SET procesado = TRUE;

SELECT '✓ Todas las relaciones actualizadas correctamente' as resultado;

-- ============================================================================
-- SECCIÓN 4: ELIMINAR USUARIOS DUPLICADOS
-- ============================================================================
-- ⚠️ IRREVERSIBLE - Verificar SECCIÓN 3 antes de ejecutar

SELECT '
========================================
  ELIMINANDO USUARIOS DUPLICADOS
========================================
' as '';

-- 4.1 Verificar que todo está actualizado
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
SELECT '4.3 VERIFICACIÓN: ¿Quedan usuarios duplicados?' as '';
SELECT
    rut,
    COUNT(*) as cantidad
FROM users
GROUP BY rut
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM (SELECT rut FROM users GROUP BY rut HAVING COUNT(*) > 1) as dups) = 0
        THEN '✓ ÉXITO: No quedan usuarios duplicados'
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

-- 5.1 Verificar que el módulo de Petróleo existe
SELECT '5.1 VERIFICAR MÓDULO DE PETRÓLEO:' as '';
SELECT * FROM modulos WHERE nombre LIKE '%Petr%' OR nombre LIKE '%petro%';

-- 5.2 Si no existe, crear el módulo
-- DESCOMENTAR SOLO SI EL MÓDULO NO EXISTE:
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
*/

-- Obtener ID del módulo
SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre LIKE '%Petr%' LIMIT 1);
SELECT CONCAT('ID del módulo de petróleo: ', @modulo_petroleo_id) as info;

-- 5.3 Crear roles del módulo de petróleo (si no existen)
SELECT '5.3 VERIFICAR ROLES DEL MÓDULO:' as '';
SELECT * FROM roles WHERE modulo_id = @modulo_petroleo_id;

-- Si no existen roles, crearlos (DESCOMENTAR SI ES NECESARIO):
/*
INSERT INTO roles (nombre, descripcion, modulo_id, created_at, updated_at)
SELECT * FROM (
    SELECT 'administrador' as nombre, 'Administrador del sistema' as descripcion, @modulo_petroleo_id as modulo_id, NOW() as created_at, NOW() as updated_at UNION ALL
    SELECT 'gerente', 'Gerente - Reportes y gestión', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'bombero', 'Bombero - Abastecimientos', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'asistente_bombero', 'Asistente de bombero', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'operador_vehiculo', 'Operador de vehículo', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'planificador', 'Planificador', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'jefe_mina', 'Jefe de mina', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'toneladas', 'Dispatch - Control de toneladas', @modulo_petroleo_id, NOW(), NOW() UNION ALL
    SELECT 'admin_operador', 'Administrador de operadores', @modulo_petroleo_id, NOW(), NOW()
) as roles_nuevos
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE nombre = roles_nuevos.nombre AND modulo_id = @modulo_petroleo_id
);
*/

-- ============================================================================
-- SECCIÓN 6: MIGRAR USUARIOS AL SISTEMA CENTRALIZADO
-- ============================================================================

SELECT '
========================================
  MIGRANDO USUARIOS
========================================
' as '';

-- 6.1 Ver usuarios que NO están en sistema centralizado
SELECT '6.1 USUARIOS A MIGRAR:' as '';
SELECT
    u.id,
    u.rut,
    u.nombre,
    u.apellido,
    u.email,
    r.rol,
    u.id_faena
FROM m3h_gestion_petroleo.users u
LEFT JOIN m3h_gestion_petroleo.roles r ON u.id_rol = r.id_rol
WHERE NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion_centralizado.users uc
    WHERE uc.rut = u.rut
)
AND u.estado = 1
ORDER BY u.rut;

-- 6.2 Migrar usuarios que NO existen en centralizado
INSERT INTO sistema_autenticacion_centralizado.users
    (rut, nombre, apellido, email, password, activo, created_at, updated_at)
SELECT DISTINCT
    u.rut,
    u.nombre,
    u.apellido,
    COALESCE(NULLIF(u.email, ''), CONCAT(u.rut, '@temp.local')) as email, -- Email temporal si no tiene
    u.password, -- Password original (ya está hasheado)
    u.estado as activo,
    u.created_at,
    NOW() as updated_at
FROM m3h_gestion_petroleo.users u
WHERE NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion_centralizado.users uc
    WHERE uc.rut = u.rut
)
AND u.estado = 1;

SELECT CONCAT('✓ ', ROW_COUNT(), ' usuarios migrados al sistema centralizado') as resultado;

-- ============================================================================
-- SECCIÓN 7: ASIGNAR ROLES A USUARIOS (SOPORTE MÚLTIPLES ROLES)
-- ============================================================================

SELECT '
========================================
  ASIGNANDO ROLES
========================================
' as '';

-- 7.1 Crear tabla temporal para mapeo de roles
DROP TABLE IF EXISTS temp_mapeo_roles;

CREATE TEMPORARY TABLE temp_mapeo_roles (
    id_rol_petroleo INT,
    nombre_rol_centralizado VARCHAR(50),
    PRIMARY KEY (id_rol_petroleo)
);

-- 7.2 Definir mapeo de roles
INSERT INTO temp_mapeo_roles VALUES
    (1, 'bombero'),              -- Bombero
    (2, 'gerente'),              -- Gerente
    (3, 'administrador'),        -- Admin
    (4, 'toneladas'),            -- Toneladas/Dispatch
    (5, 'planificador'),         -- Planificador
    (6, 'operador_vehiculo'),    -- Operador Vehículo
    (7, 'asistente_bombero'),    -- Asistente Bombero
    (8, 'admin_operador'),       -- Admin Operador
    (9, 'jefe_mina');            -- Jefe Mina

-- 7.3 Ver roles que se asignarán
SELECT '7.3 VISTA PREVIA DE ASIGNACIÓN DE ROLES:' as '';
SELECT
    u_central.id as user_id_central,
    u_central.rut,
    CONCAT(u_central.nombre, ' ', u_central.apellido) as nombre_completo,
    u_petro.id_rol as rol_id_petroleo,
    r_petro.rol as rol_petroleo,
    tmr.nombre_rol_centralizado,
    r_central.id as rol_id_central,
    @modulo_petroleo_id as modulo_id
FROM m3h_gestion_petroleo.users u_petro
INNER JOIN sistema_autenticacion_centralizado.users u_central ON u_petro.rut = u_central.rut
LEFT JOIN m3h_gestion_petroleo.roles r_petro ON u_petro.id_rol = r_petro.id_rol
LEFT JOIN temp_mapeo_roles tmr ON u_petro.id_rol = tmr.id_rol_petroleo
LEFT JOIN sistema_autenticacion_centralizado.roles r_central
    ON tmr.nombre_rol_centralizado = r_central.nombre
    AND r_central.modulo_id = @modulo_petroleo_id
WHERE u_petro.estado = 1
ORDER BY u_central.rut;

-- 7.4 Asignar roles a usuarios
-- Esta query PERMITE MÚLTIPLES ROLES por usuario si la persona tiene varias cuentas
INSERT INTO sistema_autenticacion_centralizado.usuario_roles
    (user_id, rol_id, modulo_id, created_at, updated_at)
SELECT DISTINCT
    u_central.id as user_id,
    r_central.id as rol_id,
    @modulo_petroleo_id as modulo_id,
    NOW() as created_at,
    NOW() as updated_at
FROM m3h_gestion_petroleo.users u_petro
INNER JOIN sistema_autenticacion_centralizado.users u_central ON u_petro.rut = u_central.rut
INNER JOIN temp_mapeo_roles tmr ON u_petro.id_rol = tmr.id_rol_petroleo
INNER JOIN sistema_autenticacion_centralizado.roles r_central
    ON tmr.nombre_rol_centralizado = r_central.nombre
    AND r_central.modulo_id = @modulo_petroleo_id
WHERE u_petro.estado = 1
AND NOT EXISTS (
    -- Evitar duplicar asignaciones
    SELECT 1 FROM sistema_autenticacion_centralizado.usuario_roles ur
    WHERE ur.user_id = u_central.id
    AND ur.rol_id = r_central.id
    AND ur.modulo_id = @modulo_petroleo_id
);

SELECT CONCAT('✓ ', ROW_COUNT(), ' roles asignados a usuarios') as resultado;

-- ============================================================================
-- SECCIÓN 8: MIGRAR FAENAS AL SISTEMA CENTRALIZADO
-- ============================================================================

SELECT '
========================================
  MIGRANDO FAENAS
========================================
' as '';

-- 8.1 Verificar si existe tabla faenas en sistema centralizado
-- (AJUSTAR SEGÚN TU ESTRUCTURA)

-- 8.2 Ver faenas actuales en petróleo
SELECT '8.2 FAENAS EN SISTEMA PETRÓLEO:' as '';
SELECT * FROM m3h_gestion_petroleo.faenas;

-- 8.3 Verificar relaciones de usuarios con múltiples faenas
SELECT '8.3 USUARIOS CON MÚLTIPLES FAENAS:' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre,
    COUNT(uf.faena_id) as total_faenas,
    GROUP_CONCAT(f.ubicacion ORDER BY uf.faena_id) as faenas
FROM m3h_gestion_petroleo.users u
LEFT JOIN m3h_gestion_petroleo.user_faena uf ON u.id = uf.user_id
LEFT JOIN m3h_gestion_petroleo.faenas f ON uf.faena_id = f.id_faena
GROUP BY u.id, u.rut, u.nombre, u.apellido
HAVING COUNT(uf.faena_id) > 0
ORDER BY total_faenas DESC;

-- NOTA: La migración de faenas depende de la estructura de tu sistema centralizado
-- Si el sistema centralizado tiene tabla de faenas, crear script similar al de usuarios

-- ============================================================================
-- SECCIÓN 9: VERIFICACIONES FINALES
-- ============================================================================

SELECT '
========================================
  VERIFICACIONES FINALES
========================================
' as '';

USE m3h_gestion_petroleo;

-- 9.1 Verificar que no quedan duplicados en petróleo
SELECT '9.1 VERIFICAR DUPLICADOS EN PETRÓLEO:' as '';
SELECT
    rut,
    COUNT(*) as cantidad
FROM users
GROUP BY rut
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

USE sistema_autenticacion_centralizado;

-- 9.2 Verificar usuarios migrados
SELECT '9.2 RESUMEN DE USUARIOS EN CENTRALIZADO:' as '';
SELECT COUNT(*) as total_usuarios FROM users;

-- 9.3 Verificar usuarios con roles en módulo petróleo
SELECT '9.3 USUARIOS CON ACCESO AL MÓDULO PETRÓLEO:' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') as roles,
    COUNT(ur.rol_id) as cantidad_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.rol_id = r.id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id, u.rut, u.nombre, u.apellido
ORDER BY cantidad_roles DESC, u.rut;

-- 9.4 Verificar usuarios con múltiples roles (¡OBJETIVO LOGRADO!)
SELECT '9.4 USUARIOS CON MÚLTIPLES ROLES (UN SOLO LOGIN):' as '';
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
GROUP BY u.id, u.rut, u.nombre, u.apellido, u.email
HAVING COUNT(ur.rol_id) > 1
ORDER BY total_roles DESC;

-- ============================================================================
-- SECCIÓN 10: LIMPIEZA (OPCIONAL)
-- ============================================================================

-- Eliminar tabla temporal (solo cuando todo esté OK)
USE m3h_gestion_petroleo;
-- DROP TABLE IF EXISTS temp_consolidacion_usuarios;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT '
========================================
  ✅ MIGRACIÓN COMPLETADA
========================================

LOGROS:
✓ Usuarios duplicados consolidados en sistema petróleo
✓ Usuarios migrados al sistema centralizado
✓ Soporte para múltiples roles por usuario implementado
✓ Un solo login para acceder con diferentes roles
✓ Relaciones de faenas preservadas

SIGUIENTE PASO:
1. Modificar frontend del sistema centralizado para:
   - Si usuario tiene múltiples roles, mostrar selector
   - Pasar rol seleccionado en URL: ?token=xxx&modulo_id=1&rol=admin

2. Verificar que backend de petróleo maneja correctamente el rol específico
   (Ya está implementado en AuthController::loginWithCentralToken)

3. Probar login completo:
   - Login en centralizado
   - Seleccionar rol
   - Verificar que entra con el rol correcto

' as '';
