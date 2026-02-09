-- ============================================================================
-- CONTINUACIÓN DESDE SECCIÓN 5 (Versión corregida para estructura real)
-- ============================================================================

USE sistema_autenticacion;

SELECT '
========================================
  PREPARANDO SISTEMA CENTRALIZADO
========================================
' as '';

-- 5.1 Verificar módulo de Petróleo
SELECT '5.1 MÓDULO DE PETRÓLEO:' as '';
SELECT id, nombre, url, estado FROM modulos WHERE id = 8 OR nombre LIKE '%Petr%';

SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE id = 8 OR nombre LIKE '%Petr%' LIMIT 1);

SELECT CASE
    WHEN @modulo_petroleo_id IS NOT NULL
    THEN CONCAT('✓ Módulo encontrado con ID: ', @modulo_petroleo_id)
    ELSE '❌ MÓDULO NO EXISTE - Necesitas crearlo manualmente'
END as estado_modulo;

-- Si el módulo NO existe (ID 8), ejecutar esto:
/*
INSERT INTO modulos (nombre, descripcion, url, icono, estado, created_at, updated_at)
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
    SELECT 1 FROM sistema_autenticacion.users uc
    WHERE BINARY LOWER(TRIM(uc.nombre)) = BINARY LOWER(TRIM(u.nombre))
      AND BINARY LOWER(TRIM(uc.apellido)) = BINARY LOWER(TRIM(u.apellido))
  )
ORDER BY u.apellido, u.nombre;

-- 6.2 Migrar usuarios (por nombre, no por RUT porque algunos tienen códigos)
INSERT INTO sistema_autenticacion.users
    (rut, nombre, apellido, email, password, estado, created_at, updated_at)
SELECT DISTINCT
    u.rut,
    u.nombre,
    u.apellido,
    COALESCE(NULLIF(u.email, ''), CONCAT(REPLACE(u.rut, ' ', ''), '@temp.local')) as email,
    u.password,
    u.estado,
    u.created_at,
    NOW() as updated_at
FROM m3h_gestion_petroleo.users u
WHERE u.estado = 1
  AND NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion.users uc
    WHERE BINARY LOWER(TRIM(uc.nombre)) = BINARY LOWER(TRIM(u.nombre))
      AND BINARY LOWER(TRIM(uc.apellido)) = BINARY LOWER(TRIM(u.apellido))
  );

SELECT CONCAT('✓ ', ROW_COUNT(), ' usuarios migrados') as resultado;

-- ============================================================================
-- SECCIÓN 7: ASIGNAR MÚLTIPLES ROLES ⭐
-- ============================================================================

SELECT '
========================================
  ASIGNANDO MÚLTIPLES ROLES
  (Usando rol_sistema_externo)
========================================
' as '';

-- 7.1 Mapeo de roles del sistema de petróleo
DROP TABLE IF EXISTS temp_mapeo_roles;

CREATE TEMPORARY TABLE temp_mapeo_roles (
    id_rol_petroleo INT,
    nombre_rol_externo VARCHAR(50) COMMENT 'Nombre que se guarda en rol_sistema_externo',
    PRIMARY KEY (id_rol_petroleo)
);

INSERT INTO temp_mapeo_roles VALUES
    (1, 'bombero'),
    (2, 'gerente'),
    (3, 'admin'),               -- Mapear a 'admin' no 'administrador'
    (4, 'toneladas'),
    (5, 'planificador'),
    (6, 'OperadorVehiculo'),    -- IMPORTANTE: mantener el case correcto
    (7, 'asistente_bombero'),
    (8, 'admin_operador'),
    (9, 'JefeMina');            -- IMPORTANTE: mantener el case correcto

-- 7.2 Vista previa de asignación
SELECT '7.2 ROLES QUE SE ASIGNARÁN:' as '';
SELECT
    u_central.id as user_id_central,
    u_central.rut as rut_centralizado,
    CONCAT(u_central.nombre, ' ', u_central.apellido) as nombre_completo,
    u_petro.rut as rut_petroleo,
    r_petro.rol as rol_petroleo,
    tmr.nombre_rol_externo as rol_sistema_externo,
    @modulo_petroleo_id as modulo_id
FROM m3h_gestion_petroleo.users u_petro
INNER JOIN sistema_autenticacion.users u_central
    ON BINARY LOWER(TRIM(u_central.nombre)) = BINARY LOWER(TRIM(u_petro.nombre))
    AND BINARY LOWER(TRIM(u_central.apellido)) = BINARY LOWER(TRIM(u_petro.apellido))
LEFT JOIN m3h_gestion_petroleo.roles r_petro ON u_petro.id_rol = r_petro.id_rol
LEFT JOIN temp_mapeo_roles tmr ON u_petro.id_rol = tmr.id_rol_petroleo
WHERE u_petro.estado = 1
ORDER BY nombre_completo, rol_petroleo;

-- 7.3 Asignar roles (PERMITE MÚLTIPLES ROLES POR USUARIO)
-- Usa rol_sistema_externo en lugar de rol_id
INSERT INTO sistema_autenticacion.usuario_roles
    (user_id, rol_id, modulo_id, rol_sistema_externo, created_at, updated_at)
SELECT DISTINCT
    u_central.id as user_id,
    NULL as rol_id,  -- Dejar NULL, usar rol_sistema_externo
    @modulo_petroleo_id as modulo_id,
    tmr.nombre_rol_externo as rol_sistema_externo,  -- ⭐ Aquí va el rol específico
    NOW() as created_at,
    NOW() as updated_at
FROM m3h_gestion_petroleo.users u_petro
INNER JOIN sistema_autenticacion.users u_central
    ON BINARY LOWER(TRIM(u_central.nombre)) = BINARY LOWER(TRIM(u_petro.nombre))
    AND BINARY LOWER(TRIM(u_central.apellido)) = BINARY LOWER(TRIM(u_petro.apellido))
INNER JOIN temp_mapeo_roles tmr ON u_petro.id_rol = tmr.id_rol_petroleo
WHERE u_petro.estado = 1
AND NOT EXISTS (
    -- Evitar duplicar asignaciones
    SELECT 1 FROM sistema_autenticacion.usuario_roles ur
    WHERE ur.user_id = u_central.id
    AND ur.modulo_id = @modulo_petroleo_id
    AND BINARY ur.rol_sistema_externo = BINARY tmr.nombre_rol_externo
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

USE sistema_autenticacion;

-- 8.2 Usuarios migrados
SELECT '8.2 TOTAL USUARIOS EN CENTRALIZADO:' as '';
SELECT COUNT(*) as total_usuarios FROM users WHERE estado = 1;

-- 8.3 Usuarios con acceso al módulo petróleo
SELECT '8.3 USUARIOS CON ACCESO A PETRÓLEO:' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    GROUP_CONCAT(ur.rol_sistema_externo ORDER BY ur.rol_sistema_externo SEPARATOR ', ') as roles,
    COUNT(ur.id) as cantidad_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id
ORDER BY cantidad_roles DESC, nombre_completo;

-- 8.4 🌟 USUARIOS CON MÚLTIPLES ROLES (¡OBJETIVO LOGRADO!)
SELECT '8.4 ⭐ USUARIOS CON MÚLTIPLES ROLES:' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    u.email,
    GROUP_CONCAT(ur.rol_sistema_externo ORDER BY ur.rol_sistema_externo SEPARATOR ', ') as roles_disponibles,
    COUNT(ur.id) as total_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id
HAVING COUNT(ur.id) > 1
ORDER BY total_roles DESC, nombre_completo;

-- 8.5 Ver todos los usuarios con sus roles
SELECT '8.5 DETALLE COMPLETO DE USUARIOS Y ROLES:' as '';
SELECT
    u.id,
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    u.email,
    ur.rol_sistema_externo as rol,
    m.nombre as modulo
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN modulos m ON ur.modulo_id = m.id
WHERE ur.modulo_id = @modulo_petroleo_id
ORDER BY nombre_completo, rol;

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
✓ Múltiples roles por usuario implementados
✓ Usa rol_sistema_externo (estructura correcta)
✓ Un solo login para diferentes roles

ESTRUCTURA CORRECTA:
- Roles globales en tabla "roles" (sin modulo_id)
- Asignación en tabla "usuario_roles" con:
  * user_id: ID del usuario
  * rol_id: NULL (no usamos roles globales)
  * modulo_id: 8 (Gestión Petróleo)
  * rol_sistema_externo: nombre del rol específico

EJEMPLOS:
Usuario: Christian Saavedra
- Entrada 1: user_id=X, rol_id=NULL, modulo_id=8, rol_sistema_externo="OperadorVehiculo"
- Entrada 2: user_id=X, rol_id=NULL, modulo_id=8, rol_sistema_externo="gerente"

Al hacer login en sistema centralizado:
1. Mostrar selector: [Gerente] [Operador Vehículo]
2. Usuario selecciona "Gerente"
3. Redirige: http://localhost:3000?token=xxx&modulo_id=8&rol=gerente
4. Sistema petróleo valida y redirige a /Gerente

SIGUIENTE PASO:
Implementar FASE 2 - Modificar frontend del sistema centralizado
para mostrar selector de rol cuando usuario tiene múltiples roles.

' as '';

-- Limpiar temporales (opcional)
USE m3h_gestion_petroleo;
-- DROP TABLE IF EXISTS temp_consolidacion_usuarios;
