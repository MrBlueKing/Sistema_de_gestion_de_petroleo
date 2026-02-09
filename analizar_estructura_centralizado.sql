-- ============================================================================
-- ANÁLISIS DE ESTRUCTURA DEL SISTEMA CENTRALIZADO
-- ============================================================================

USE sistema_autenticacion_centralizado;

-- Ver estructura de tabla modulos
SELECT '=== ESTRUCTURA TABLA: modulos ===' as '';
DESCRIBE modulos;

-- Ver estructura de tabla roles
SELECT '=== ESTRUCTURA TABLA: roles ===' as '';
DESCRIBE roles;

-- Ver estructura de tabla users
SELECT '=== ESTRUCTURA TABLA: users ===' as '';
DESCRIBE users;

-- Ver estructura de tabla usuario_roles
SELECT '=== ESTRUCTURA TABLA: usuario_roles ===' as '';
DESCRIBE usuario_roles;

-- Ver todas las tablas disponibles
SELECT '=== TODAS LAS TABLAS ===' as '';
SHOW TABLES;

-- Ver datos actuales de modulos
SELECT '=== DATOS: modulos ===' as '';
SELECT * FROM modulos;

-- Ver datos actuales de roles
SELECT '=== DATOS: roles ===' as '';
SELECT * FROM roles LIMIT 20;

-- Ver datos actuales de usuario_roles
SELECT '=== DATOS: usuario_roles ===' as '';
SELECT * FROM usuario_roles LIMIT 20;

-- Ver relación entre roles y módulos
SELECT '=== CÓMO SE RELACIONAN ROLES CON MÓDULOS ===' as '';
SELECT
    ur.id,
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as usuario,
    r.nombre as rol,
    ur.modulo_id,
    m.nombre as modulo
FROM usuario_roles ur
INNER JOIN users u ON ur.user_id = u.id
INNER JOIN roles r ON ur.rol_id = r.id
INNER JOIN modulos m ON ur.modulo_id = m.id
LIMIT 10;
