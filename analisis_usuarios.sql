-- ============================================================================
-- ANÁLISIS DE USUARIOS PARA ENTENDER EL PATRÓN
-- ============================================================================

USE m3h_gestion_petroleo;

-- Ver todos los usuarios con información básica
SELECT '=== TODOS LOS USUARIOS ===' as '';
SELECT
    id,
    rut,
    nombre,
    apellido,
    email,
    id_rol,
    r.rol
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
ORDER BY apellido, nombre;

-- Ver usuarios que tienen RUT numérico (formato normal)
SELECT '=== USUARIOS CON RUT NUMÉRICO ===' as '';
SELECT
    id,
    rut,
    CONCAT(nombre, ' ', apellido) as nombre_completo,
    email,
    r.rol
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
WHERE rut REGEXP '^[0-9]+[kK]?$'  -- Solo dígitos + opcional K
ORDER BY nombre_completo;

-- Ver usuarios que tienen CÓDIGO (no es RUT numérico)
SELECT '=== USUARIOS CON CÓDIGO (NO RUT) ===' as '';
SELECT
    id,
    rut as codigo,
    CONCAT(nombre, ' ', apellido) as nombre_completo,
    email,
    r.rol
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
WHERE rut NOT REGEXP '^[0-9]+[kK]?$'  -- NO es RUT numérico
ORDER BY nombre_completo;

-- Buscar posibles duplicados por nombre + apellido
SELECT '=== POSIBLES DUPLICADOS POR NOMBRE ===' as '';
SELECT
    CONCAT(nombre, ' ', apellido) as nombre_completo,
    COUNT(*) as cantidad_cuentas,
    GROUP_CONCAT(id ORDER BY id) as ids,
    GROUP_CONCAT(rut ORDER BY id) as ruts_codigos,
    GROUP_CONCAT(r.rol ORDER BY u.id) as roles,
    GROUP_CONCAT(COALESCE(email, 'NULL') ORDER BY u.id) as emails
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
GROUP BY nombre, apellido
HAVING COUNT(*) > 1
ORDER BY cantidad_cuentas DESC;

-- Buscar usuarios con email duplicado
SELECT '=== USUARIOS CON EMAIL DUPLICADO ===' as '';
SELECT
    email,
    COUNT(*) as cantidad,
    GROUP_CONCAT(id ORDER BY id) as ids,
    GROUP_CONCAT(CONCAT(nombre, ' ', apellido) ORDER BY id SEPARATOR ' | ') as nombres,
    GROUP_CONCAT(rut ORDER BY id) as ruts_codigos
FROM users
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1;

-- Buscar patrones en los códigos
SELECT '=== PATRONES DE CÓDIGOS ===' as '';
SELECT
    SUBSTRING(rut, 1, 3) as prefijo,
    COUNT(*) as cantidad,
    GROUP_CONCAT(CONCAT(id, ':', rut, ':', nombre, ' ', apellido) SEPARATOR ' | ') as ejemplos
FROM users
WHERE rut NOT REGEXP '^[0-9]+[kK]?$'
GROUP BY SUBSTRING(rut, 1, 3)
ORDER BY cantidad DESC;
