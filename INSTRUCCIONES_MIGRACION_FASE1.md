# 🚀 FASE 1: Migración Completa al Sistema Centralizado

## 📋 Resumen

Este documento te guiará paso a paso para:
1. ✅ Consolidar usuarios duplicados (mismo RUT, diferentes roles)
2. ✅ Migrar TODOS los usuarios al sistema centralizado
3. ✅ Implementar **múltiples roles por usuario** (¡NO más cuentas duplicadas!)
4. ✅ Migrar relaciones de faenas
5. ✅ Verificar que todo funcionó correctamente

## ⏱️ Tiempo estimado: 30-45 minutos

---

## ⚠️ ANTES DE EMPEZAR

### 1. Hacer Backup COMPLETO

```bash
# Backup base de datos petróleo
mysqldump -u root -p m3h_gestion_petroleo > backup_petroleo_$(date +%Y%m%d_%H%M%S).sql

# Backup base de datos centralizado
mysqldump -u root -p sistema_autenticacion_centralizado > backup_centralizado_$(date +%Y%m%d_%H%M%S).sql

# Verificar que los backups se crearon
ls -lh backup_*.sql
```

### 2. Verificar servicios de MySQL

```bash
# Verificar que MySQL está corriendo
mysql -u root -p -e "SELECT 'MySQL OK' as status;"
```

### 3. Tener a mano

- [ ] Usuario y contraseña de MySQL
- [ ] Acceso a phpMyAdmin (opcional pero recomendado)
- [ ] Editor SQL (HeidiSQL, MySQL Workbench, o phpMyAdmin)
- [ ] 30-45 minutos sin interrupciones

---

## 🎯 PASO 1: ANÁLISIS INICIAL

### Objetivo: Entender la situación actual

```bash
# Abrir MySQL
mysql -u root -p
```

```sql
-- Ejecutar SECCIÓN 0 y SECCIÓN 1 del script
SOURCE C:/xampp/htdocs/Sistema_de_gestion_de_petroleo/migracion_completa_fase1.sql
```

**¿Qué hace?**
- Verifica conexión a ambas bases de datos
- Muestra usuarios duplicados
- Muestra distribución de roles
- Muestra usuarios con múltiples faenas

**Revisar:**
- ¿Cuántos usuarios duplicados hay?
- ¿Qué roles tienen?
- ¿Tienen emails registrados?

**Ejemplo de salida:**
```
RUT: 172105599
Cantidad cuentas: 2
IDs: 31,37
Roles: administrador, operador_vehiculo
Emails: csaavedra@gmail.com, NULL
```

---

## 🎯 PASO 2: CONSOLIDACIÓN DE DUPLICADOS

### Objetivo: Un solo usuario por RUT en sistema petróleo

```sql
-- Ejecutar SECCIÓN 2 del script
-- (Ya cargado en memoria si ejecutaste PASO 1)
```

**¿Qué hace?**
- Identifica qué usuario mantener (con email, más antiguo, mejor rol)
- Identifica qué usuarios eliminar
- Muestra resumen de cambios propuestos

**IMPORTANTE: Revisar la tabla de consolidación**

```sql
SELECT
    t.rut,
    CONCAT(u_mantener.nombre, ' ', u_mantener.apellido) as nombre,
    t.id_usuario_mantener,
    t.rol_mantener,
    t.id_usuario_eliminar,
    t.rol_eliminar
FROM temp_consolidacion_usuarios t
INNER JOIN users u_mantener ON t.id_usuario_mantener = u_mantener.id
ORDER BY t.rut;
```

**Pregúntate:**
- ✅ ¿El usuario a mantener es el correcto?
- ✅ ¿Los usuarios a eliminar son correctos?
- ✅ ¿No se perderá información importante?

**Si algo está mal:**
```sql
-- Abortar y no continuar
DROP TABLE temp_consolidacion_usuarios;
-- Revisar manualmente los datos y ajustar criterios
```

---

## 🎯 PASO 3: ACTUALIZAR RELACIONES

### Objetivo: Migrar todos los registros al usuario principal

```sql
-- Ejecutar SECCIÓN 3 del script
```

**¿Qué hace?**
- Actualiza `ingresos_petroleo` → cambia id_usuario
- Actualiza `asignaciones_user_maquinas` → cambia id_user
- Actualiza `cargas_externas` → cambia id_user
- Actualiza `user_faena` → consolida faenas
- Actualiza `personal_access_tokens` → cambia tokenable_id
- Consolida información del usuario principal

**Verificar resultados:**
```sql
-- ¿Cuántos registros se actualizaron?
SELECT
    (SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario IN (SELECT id_usuario_mantener FROM temp_consolidacion_usuarios)) as ingresos_actualizados,
    (SELECT COUNT(*) FROM user_faena WHERE user_id IN (SELECT id_usuario_mantener FROM temp_consolidacion_usuarios)) as faenas_actualizadas;
```

---

## 🎯 PASO 4: ELIMINAR DUPLICADOS

### Objetivo: Limpiar usuarios duplicados

```sql
-- Ejecutar SECCIÓN 4 del script
```

**⚠️ IRREVERSIBLE - Verifica antes**

```sql
-- Verificar que NO quedan relaciones huérfanas
SELECT COUNT(*) FROM ingresos_petroleo
WHERE id_usuario IN (SELECT id_usuario_eliminar FROM temp_consolidacion_usuarios);
-- Debe ser 0
```

**¿Qué hace?**
- Elimina físicamente los usuarios duplicados
- Verifica que no quedan duplicados

**Verificación:**
```sql
-- No debe haber duplicados
SELECT rut, COUNT(*) as cantidad
FROM users
GROUP BY rut
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas ✅
```

---

## 🎯 PASO 5: PREPARAR SISTEMA CENTRALIZADO

### Objetivo: Crear módulo y roles en sistema centralizado

```sql
-- Ejecutar SECCIÓN 5 del script
```

**¿Qué hace?**
- Verifica que existe el módulo "Gestión de Petróleo"
- Si no existe, muestra cómo crearlo (descomentar código)
- Verifica roles del módulo

**Si el módulo NO existe:**

```sql
USE sistema_autenticacion_centralizado;

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

-- Verificar
SELECT * FROM modulos WHERE nombre = 'Gestión de Petróleo';
```

**Si los roles NO existen:**

```sql
SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre = 'Gestión de Petróleo');

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

-- Verificar
SELECT * FROM roles WHERE modulo_id = @modulo_petroleo_id;
```

---

## 🎯 PASO 6: MIGRAR USUARIOS

### Objetivo: Copiar usuarios de petróleo a centralizado

```sql
-- Ejecutar SECCIÓN 6 del script
```

**¿Qué hace?**
- Identifica usuarios que NO están en centralizado
- Los migra con su información completa
- Si no tienen email, asigna email temporal

**Verificar:**
```sql
USE sistema_autenticacion_centralizado;

-- Ver usuarios migrados
SELECT
    u.id,
    u.rut,
    u.nombre,
    u.apellido,
    u.email,
    u.created_at
FROM users u
WHERE u.rut IN (
    SELECT DISTINCT rut FROM m3h_gestion_petroleo.users
)
ORDER BY u.rut;
```

---

## 🎯 PASO 7: ASIGNAR MÚLTIPLES ROLES 🌟

### Objetivo: **¡OBJETIVO PRINCIPAL!** Un usuario, múltiples roles

```sql
-- Ejecutar SECCIÓN 7 del script
```

**¿Qué hace?**
- Mapea roles de petróleo a roles de centralizado
- Asigna TODOS los roles que tenía el usuario (si tenía varias cuentas)
- **¡Permite múltiples roles por usuario!**

**Ejemplo:**
```
Usuario: Christian Saavedra (RUT 172105599)
Antes: 2 cuentas
  - Cuenta 1: Administrador
  - Cuenta 2: Operador Vehículo

Después: 1 cuenta con 2 roles
  - Usuario único: Christian Saavedra
  - Roles: [Administrador, Operador Vehículo]
```

**Verificar:**
```sql
USE sistema_autenticacion_centralizado;

SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre = 'Gestión de Petróleo');

-- Ver usuarios con múltiples roles ✨
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') as roles,
    COUNT(ur.rol_id) as total_roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.rol_id = r.id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id
HAVING COUNT(ur.rol_id) > 1
ORDER BY total_roles DESC;
```

**Resultado esperado:**
```
Christian Saavedra | administrador, operador_vehiculo | 2 roles ✅
```

---

## 🎯 PASO 8: VERIFICACIONES FINALES

### Objetivo: Asegurar que TODO está correcto

```sql
-- Ejecutar SECCIÓN 9 del script
```

**Verificaciones:**

### ✅ No quedan duplicados en petróleo
```sql
USE m3h_gestion_petroleo;
SELECT rut, COUNT(*) FROM users GROUP BY rut HAVING COUNT(*) > 1;
-- Debe ser 0 filas
```

### ✅ Usuarios migrados a centralizado
```sql
USE sistema_autenticacion_centralizado;
SELECT COUNT(*) as total FROM users;
-- Debe incluir todos los usuarios de petróleo
```

### ✅ Usuarios tienen roles asignados
```sql
SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre = 'Gestión de Petróleo');

SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre,
    GROUP_CONCAT(r.nombre) as roles
FROM users u
INNER JOIN usuario_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.rol_id = r.id
WHERE ur.modulo_id = @modulo_petroleo_id
GROUP BY u.id
ORDER BY u.rut;
```

### ✅ Relaciones en petróleo intactas
```sql
USE m3h_gestion_petroleo;

SELECT
    'ingresos_petroleo' as tabla,
    COUNT(*) as registros,
    COUNT(DISTINCT id_usuario) as usuarios_unicos
FROM ingresos_petroleo
UNION ALL
SELECT
    'user_faena',
    COUNT(*),
    COUNT(DISTINCT user_id)
FROM user_faena;
```

---

## 🎉 ¡MIGRACIÓN COMPLETADA!

### Resumen de logros:

✅ **Usuarios duplicados eliminados**
- Antes: 1 persona = 2+ cuentas
- Ahora: 1 persona = 1 cuenta

✅ **Múltiples roles por usuario**
- Un solo login
- Selector de rol al entrar
- NO más passwords duplicados

✅ **Todos los usuarios en centralizado**
- Gestión unificada
- Control de acceso centralizado

✅ **Datos preservados**
- Ingresos de petróleo
- Asignaciones de máquinas
- Relaciones de faenas
- Tokens de sesión

---

## 🚀 PRÓXIMOS PASOS (FASE 2)

Ahora que la migración está completa, necesitas:

### 1. Modificar Frontend del Sistema Centralizado

**Agregar selector de rol si usuario tiene múltiples roles:**

```javascript
// Después del login exitoso
if (userData.roles.length > 1) {
  // Mostrar selector: ¿Con qué rol quieres entrar?
  // Opciones: Administrador, Operador Vehículo
  const rolSeleccionado = await mostrarSelectorRoles(userData.roles);

  // Redirigir con rol específico
  window.location.href = `http://localhost:3000?token=${token}&modulo_id=1&rol=${rolSeleccionado}`;
} else {
  // Solo un rol, redirigir directamente
  window.location.href = `http://localhost:3000?token=${token}&modulo_id=1&rol=${userData.roles[0]}`;
}
```

### 2. Verificar Backend de Petróleo

El backend YA está preparado para recibir el rol específico:

```php
// AuthController::loginWithCentralToken()
// Línea 477 en AuthController.php

// Recibe rol_solicitado del request
$rolSolicitado = $request->input('rol_solicitado');

// Lo envía al sistema centralizado para validar
$response = Http::withToken($token)->post("{$centralizadoUrl}/api/validar-token", [
    'modulo_id' => $request->modulo_id,
    'rol_solicitado' => $rolSolicitado // ✅ Ya implementado
]);

// Mapea el rol y lo asigna
$idRolLocal = $this->obtenerIdRolLocal($rolAsignado);
```

### 3. Probar Login Completo

```
1. Abrir: http://localhost:3000
2. Redirige a: http://localhost:5174 (centralizado)
3. Login: RUT + password
4. Si tiene múltiples roles → Selector aparece
5. Seleccionar rol: "Operador Vehículo"
6. Redirige a petróleo con rol específico
7. ✅ Entra como Operador Vehículo

Luego puede:
1. Cerrar sesión
2. Login nuevamente
3. Seleccionar rol: "Administrador"
4. ✅ Entra como Administrador

¡TODO CON LA MISMA CUENTA!
```

---

## 🐛 Troubleshooting

### Problema: "Duplicate entry for key 'PRIMARY'"

**Causa:** Usuario ya existe en sistema centralizado

**Solución:**
```sql
-- Ver usuario existente
SELECT * FROM sistema_autenticacion_centralizado.users WHERE rut = '172105599';

-- Si es correcto, solo falta asignar roles (ejecutar SECCIÓN 7)
```

### Problema: "Table 'temp_consolidacion_usuarios' doesn't exist"

**Causa:** No ejecutaste SECCIÓN 2

**Solución:**
```sql
-- Ejecutar SECCIÓN 2 completa del script
SOURCE C:/xampp/htdocs/Sistema_de_gestion_de_petroleo/migracion_completa_fase1.sql
```

### Problema: "No quedan duplicados pero perdí registros"

**Causa:** Posible error en actualización de relaciones

**Solución:**
```sql
-- Restaurar backup
mysql -u root -p m3h_gestion_petroleo < backup_petroleo_YYYYMMDD_HHMMSS.sql

-- Revisar SECCIÓN 3 del script
-- Verificar que todas las tablas relacionadas están incluidas
```

### Problema: "Usuarios migrados pero sin roles"

**Causa:** No se ejecutó SECCIÓN 7

**Solución:**
```sql
-- Ejecutar solo SECCIÓN 7 nuevamente
USE sistema_autenticacion_centralizado;
SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre = 'Gestión de Petróleo');

-- Copiar código de SECCIÓN 7 y ejecutar
```

---

## 🔒 Seguridad Post-Migración

### Invalidar passwords locales (opcional)

Si quieres FORZAR que SOLO se use login centralizado:

```sql
USE m3h_gestion_petroleo;

UPDATE users
SET password = '$2y$12$INVALID_CENTRALIZED_ONLY_DO_NOT_USE'
WHERE estado = 1;
```

Esto invalida los passwords locales sin afectar el login centralizado.

---

## 📊 Estadísticas Útiles

```sql
-- Total de usuarios consolidados
SELECT COUNT(*) FROM temp_consolidacion_usuarios;

-- Usuarios con múltiples roles
SELECT COUNT(*) FROM (
    SELECT user_id
    FROM sistema_autenticacion_centralizado.usuario_roles
    WHERE modulo_id = @modulo_petroleo_id
    GROUP BY user_id
    HAVING COUNT(rol_id) > 1
) as multi_roles;

-- Ingresos de petróleo por usuario
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre,
    COUNT(ip.id) as total_ingresos
FROM m3h_gestion_petroleo.users u
LEFT JOIN m3h_gestion_petroleo.ingresos_petroleo ip ON u.id = ip.id_usuario
GROUP BY u.id
ORDER BY total_ingresos DESC
LIMIT 10;
```

---

## 📞 Ayuda

Si tienes problemas:

1. **Revisar logs de Laravel:**
```bash
tail -f backend/storage/logs/laravel.log
```

2. **Verificar backups:**
```bash
ls -lh backup_*.sql
```

3. **Restaurar si es necesario:**
```bash
mysql -u root -p m3h_gestion_petroleo < backup_petroleo_YYYYMMDD.sql
```

---

**¡Éxito con la migración!** 🎉

Una vez completada la FASE 1, avísame para implementar la FASE 2 (selector de roles en frontend).
