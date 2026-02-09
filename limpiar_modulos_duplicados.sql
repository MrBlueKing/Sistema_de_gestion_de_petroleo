-- ============================================================================
-- LIMPIAR MÓDULOS DUPLICADOS EN SISTEMA CENTRALIZADO
-- ============================================================================

USE sistema_autenticacion_centralizado;

-- Ver módulos de petróleo actuales
SELECT '=== MÓDULOS DE PETRÓLEO ACTUALES ===' as '';
SELECT id, nombre, url, icono, estado
FROM modulos
WHERE nombre LIKE '%Petr%' OR nombre LIKE '%petro%'
ORDER BY id;

-- Ver qué usuarios tienen roles en cada módulo
SELECT '=== USUARIOS POR MÓDULO DE PETRÓLEO ===' as '';
SELECT
    m.id as modulo_id,
    m.nombre as modulo,
    COUNT(DISTINCT ur.user_id) as total_usuarios
FROM modulos m
LEFT JOIN usuario_roles ur ON m.id = ur.modulo_id
WHERE m.nombre LIKE '%Petr%' OR m.nombre LIKE '%petro%'
GROUP BY m.id
ORDER BY m.id;

-- ============================================================================
-- DECISIÓN: ¿Qué módulo mantener?
-- ============================================================================
-- OPCIÓN 1: Mantener ID 8 (más reciente, con emoji correcto)
-- OPCIÓN 2: Mantener ID 7
-- OPCIÓN 3: Crear uno nuevo y eliminar ambos

-- ============================================================================
-- SOLUCIÓN RECOMENDADA: Mantener ID 8, eliminar 7 y 9
-- ============================================================================

-- Paso 1: Mover usuarios de módulo 7 a módulo 8
UPDATE usuario_roles
SET modulo_id = 8
WHERE modulo_id = 7;

SELECT CONCAT('✓ ', ROW_COUNT(), ' roles movidos de módulo 7 a módulo 8') as resultado;

-- Paso 2: Mover usuarios de módulo 9 a módulo 8
UPDATE usuario_roles
SET modulo_id = 8
WHERE modulo_id = 9;

SELECT CONCAT('✓ ', ROW_COUNT(), ' roles movidos de módulo 9 a módulo 8') as resultado;

-- Paso 3: Mover roles de módulo 7 a módulo 8
UPDATE roles
SET modulo_id = 8
WHERE modulo_id = 7;

SELECT CONCAT('✓ ', ROW_COUNT(), ' roles movidos de módulo 7 a módulo 8') as resultado;

-- Paso 4: Mover roles de módulo 9 a módulo 8
UPDATE roles
SET modulo_id = 8
WHERE modulo_id = 9;

SELECT CONCAT('✓ ', ROW_COUNT(), ' roles movidos de módulo 9 a módulo 8') as resultado;

-- Paso 5: Actualizar módulo 8 con información correcta
UPDATE modulos
SET
    nombre = 'Gestión de Petróleo',
    descripcion = 'Sistema de gestión y control de petróleo para faenas mineras',
    url = 'http://localhost:3000',  -- URL BASE (sin ruta específica)
    icono = '🛢️',
    estado = 1,
    updated_at = NOW()
WHERE id = 8;

SELECT '✓ Módulo 8 actualizado correctamente' as resultado;

-- Paso 6: Eliminar módulos duplicados (7 y 9)
DELETE FROM modulos WHERE id IN (7, 9);

SELECT CONCAT('✓ ', ROW_COUNT(), ' módulos duplicados eliminados') as resultado;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=== VERIFICACIÓN: MÓDULOS DE PETRÓLEO ===' as '';
SELECT id, nombre, url, icono, estado
FROM modulos
WHERE nombre LIKE '%Petr%' OR nombre LIKE '%petro%'
ORDER BY id;
-- Debe aparecer solo 1 módulo (ID 8)

SELECT '=== VERIFICACIÓN: USUARIOS EN MÓDULO 8 ===' as '';
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') as roles,
    COUNT(ur.rol_id) as total_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.rol_id = r.id
WHERE ur.modulo_id = 8
GROUP BY u.id
ORDER BY nombre_completo;

SELECT '=== VERIFICACIÓN: ROLES DEL MÓDULO 8 ===' as '';
SELECT id, nombre, descripcion
FROM roles
WHERE modulo_id = 8
ORDER BY nombre;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
SELECT '
✅ LIMPIEZA COMPLETADA

Ahora tienes:
- 1 solo módulo: "Gestión de Petróleo" (ID 8)
- URL base: http://localhost:3000
- Todos los usuarios y roles consolidados en módulo 8

El sistema centralizado redirigirá con:
  http://localhost:3000?token=xxx&modulo_id=8&rol=gerente

Y el sistema de petróleo redirigirá internamente a:
  /gerente (si rol es gerente)
  /bombero (si rol es bombero)
  /operadorVehiculo (si rol es operador_vehiculo)
  etc.

' as mensaje;
