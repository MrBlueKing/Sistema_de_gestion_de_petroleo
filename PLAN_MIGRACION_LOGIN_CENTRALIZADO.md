# 🚀 Plan de Migración al Sistema de Login Centralizado

## 📋 Contexto del Problema

### Situación Actual
El **Sistema de Gestión de Petróleo** maneja su propia autenticación independiente, lo que causa:

❌ **Usuarios duplicados** - Una misma persona tiene múltiples cuentas según su rol
- Ejemplo: Christian Saavedra tiene 2 cuentas:
  - Usuario ID 31: RUT 172105599, rol Admin
  - Usuario ID 37: Código OPE1721, rol Operador Vehículo

❌ **Gestión fragmentada** - Cada sistema mantiene sus propios usuarios

❌ **Mala experiencia de usuario** - Múltiples logins para la misma persona

### Solución Propuesta

✅ **Sistema de Autenticación Centralizado**
- Un solo usuario por persona con múltiples roles/permisos
- Login centralizado que da acceso a todos los módulos disponibles
- Gestión unificada de usuarios y permisos

---

## 🎯 Objetivos de la Migración

1. ✅ Consolidar usuarios duplicados en el sistema de petróleo
2. ✅ Migrar usuarios del sistema de petróleo al sistema centralizado
3. ✅ Integrar login centralizado en sistema de petróleo
4. ✅ Mantener funcionalidad del login local como fallback
5. ✅ Asegurar que no se pierde información (ingresos, asignaciones, etc.)

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────────┐
│   SISTEMA DE AUTENTICACIÓN CENTRALIZADO     │
│   (Puerto 8001)                             │
│                                             │
│   Base de datos: sistema_autenticacion      │
│   - Tabla: users (usuarios únicos)          │
│   - Tabla: modulos (sistemas disponibles)   │
│   - Tabla: usuario_roles (permisos)         │
│   - Tabla: roles (por módulo)               │
└──────────────┬──────────────────────────────┘
               │
               │ Token Bearer + RUT
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Petróleo   │   │ Producción  │
│  (8000)     │   │  (8002)     │
└─────────────┘   └─────────────┘
```

**Flujo de autenticación:**
1. Usuario hace login en sistema centralizado (una sola vez)
2. Ve módulos disponibles (Petróleo, Producción, etc.)
3. Selecciona módulo → Redirección automática con token
4. Sistema valida token y crea/actualiza usuario local
5. Usuario accede sin volver a ingresar credenciales

---

## 🔧 Fases de Implementación

### FASE 1: Preparación (Backend ya completado ✅)

**Estado actual:**
- ✅ Endpoint `/api/login-centralizado` creado en AuthController.php
- ✅ Validación de token con sistema centralizado
- ✅ Creación automática de usuarios locales
- ✅ Mapeo de roles entre sistemas
- ✅ Variable `SISTEMA_CENTRALIZADO_URL` en .env
- ✅ Logs detallados para debugging

---

### FASE 2: Preparación (Frontend ya completado ✅)

**Estado actual:**
- ✅ Servicio `authCentralizado.js` creado (frontend/src/services/)
- ✅ Componente `LoginCentralizado.jsx` creado
- ✅ Ruta `/auth/centralizado` agregada en Routes.jsx
- ✅ Detección automática de token en HomePage.jsx
- ✅ Botón opcional en LoginScreen.jsx

---

### FASE 3: Consolidación de Usuarios (PRÓXIMO PASO 🔄)

#### 3.1 Análisis de Duplicados

**Objetivo:** Identificar todos los usuarios duplicados

**Script SQL:** `consolidar_usuarios_duplicados.sql` (PASO 1)

```bash
mysql -u root -p sistema_petroleo
```

```sql
-- Ver usuarios duplicados
SELECT
    rut,
    COUNT(*) as cantidad,
    GROUP_CONCAT(id ORDER BY id) as ids,
    GROUP_CONCAT(r.rol ORDER BY u.id) as roles
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
GROUP BY rut
HAVING COUNT(*) > 1;
```

**Resultado esperado:**
- Lista de RUTs con múltiples usuarios
- IDs de cada cuenta duplicada
- Roles asociados a cada cuenta

#### 3.2 Backup de la Base de Datos

**CRÍTICO:** Hacer backup completo antes de cualquier cambio

```bash
# Backup completo
mysqldump -u root sistema_petroleo > backup_antes_consolidacion_$(date +%Y%m%d_%H%M%S).sql

# Verificar que el backup se creó correctamente
ls -lh backup_antes_consolidacion_*.sql
```

#### 3.3 Ejecutar Consolidación

**Usar el script:** `consolidar_usuarios_duplicados.sql`

**Pasos:**
1. Ejecutar PASO 1 (análisis) - Revisar resultados
2. Ejecutar PASOS 2-3 (crear tabla temporal)
3. **REVISAR** la tabla `temp_usuarios_consolidar` - Verificar que el mapeo es correcto
4. Ejecutar PASO 4 (actualizar relaciones)
5. Ejecutar PASO 5 (consolidar información)
6. **VERIFICAR** que todas las relaciones se actualizaron correctamente
7. Ejecutar PASO 6 (eliminar duplicados) - **IRREVERSIBLE**
8. Ejecutar PASO 7 (verificaciones finales)

**Criterios de consolidación:**
- Se mantiene el usuario con **email registrado** (prioridad 1)
- Si ambos tienen email, se mantiene el **más antiguo** (prioridad 2)
- Si empate, se mantiene el usuario con **rol admin** (prioridad 3)

**Ejemplo:**
```
Usuario A: ID 31, RUT 172105599, email: csaavedra3h@gmail.com, rol: admin, fecha: 2025-09-26
Usuario B: ID 37, RUT 172105599, email: NULL, rol: operador_vehiculo, fecha: 2025-10-03

→ Se mantiene Usuario A (tiene email + más antiguo + rol admin)
→ Se eliminará Usuario B
→ Todos los registros de B se migran a A
```

#### 3.4 Verificación Post-Consolidación

```sql
-- No deben quedar duplicados
SELECT rut, COUNT(*) as cantidad
FROM users
GROUP BY rut
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

-- Ver resumen de usuarios consolidados
SELECT
    u.id,
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre,
    u.email,
    r.rol,
    (SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario = u.id) as ingresos
FROM users u
LEFT JOIN roles r ON u.id_rol = r.id_rol
ORDER BY u.rut;
```

---

### FASE 4: Migración al Sistema Centralizado (SIGUIENTE 🔜)

#### 4.1 Registrar Módulo de Petróleo

**En el sistema centralizado:**

```bash
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado
```

**Ejecutar script SQL:**

```sql
USE sistema_autenticacion;

-- Registrar módulo
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

-- Obtener ID del módulo creado
SELECT @modulo_petroleo_id := id FROM modulos WHERE nombre = 'Gestión de Petróleo';

-- Crear roles para el módulo de petróleo
INSERT INTO roles (nombre, descripcion, modulo_id, created_at, updated_at) VALUES
('administrador', 'Administrador del sistema de petróleo', @modulo_petroleo_id, NOW(), NOW()),
('gerente', 'Gerente - Acceso a reportes y gestión', @modulo_petroleo_id, NOW(), NOW()),
('bombero', 'Bombero - Registro de abastecimientos', @modulo_petroleo_id, NOW(), NOW()),
('asistente_bombero', 'Asistente de bombero', @modulo_petroleo_id, NOW(), NOW()),
('operador_vehiculo', 'Operador de vehículo', @modulo_petroleo_id, NOW(), NOW()),
('planificador', 'Planificador de operaciones', @modulo_petroleo_id, NOW(), NOW()),
('jefe_mina', 'Jefe de mina', @modulo_petroleo_id, NOW(), NOW());

-- Verificar
SELECT m.nombre as modulo, r.nombre as rol, r.descripcion
FROM modulos m
JOIN roles r ON m.id = r.modulo_id
WHERE m.nombre = 'Gestión de Petróleo';
```

#### 4.2 Migrar Usuarios al Sistema Centralizado

**Script de migración de usuarios:**

```sql
-- En sistema_autenticacion
USE sistema_autenticacion;

-- Insertar usuarios del sistema de petróleo que no existen en centralizado
INSERT INTO users (rut, nombre, apellido, email, faena_id, activo, created_at, updated_at)
SELECT DISTINCT
    u_petroleo.rut,
    u_petroleo.nombre,
    u_petroleo.apellido,
    u_petroleo.email,
    u_petroleo.id_faena,
    u_petroleo.estado,
    u_petroleo.created_at,
    NOW()
FROM sistema_petroleo.users u_petroleo
WHERE NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion.users u_central
    WHERE u_central.rut = u_petroleo.rut
);

-- Ver usuarios migrados
SELECT COUNT(*) as usuarios_migrados FROM users;
```

#### 4.3 Asignar Roles a Usuarios

**Para cada usuario, asignar su rol en el módulo de petróleo:**

```sql
USE sistema_autenticacion;

SET @modulo_petroleo_id = (SELECT id FROM modulos WHERE nombre = 'Gestión de Petróleo');

-- Mapeo de roles (ajustar según tus necesidades)
-- rol_id del sistema petróleo → rol del sistema centralizado

INSERT INTO usuario_roles (user_id, rol_id, modulo_id, created_at, updated_at)
SELECT
    u_central.id as user_id,
    (
        CASE u_petroleo.id_rol
            WHEN 2 THEN (SELECT id FROM roles WHERE nombre = 'administrador' AND modulo_id = @modulo_petroleo_id)
            WHEN 3 THEN (SELECT id FROM roles WHERE nombre = 'gerente' AND modulo_id = @modulo_petroleo_id)
            WHEN 1 THEN (SELECT id FROM roles WHERE nombre = 'bombero' AND modulo_id = @modulo_petroleo_id)
            WHEN 4 THEN (SELECT id FROM roles WHERE nombre = 'asistente_bombero' AND modulo_id = @modulo_petroleo_id)
            WHEN 6 THEN (SELECT id FROM roles WHERE nombre = 'operador_vehiculo' AND modulo_id = @modulo_petroleo_id)
            WHEN 7 THEN (SELECT id FROM roles WHERE nombre = 'planificador' AND modulo_id = @modulo_petroleo_id)
            WHEN 8 THEN (SELECT id FROM roles WHERE nombre = 'jefe_mina' AND modulo_id = @modulo_petroleo_id)
            ELSE (SELECT id FROM roles WHERE nombre = 'bombero' AND modulo_id = @modulo_petroleo_id)
        END
    ) as rol_id,
    @modulo_petroleo_id as modulo_id,
    NOW(),
    NOW()
FROM sistema_petroleo.users u_petroleo
INNER JOIN sistema_autenticacion.users u_central ON u_petroleo.rut = u_central.rut
WHERE u_petroleo.estado = 1; -- Solo usuarios activos

-- Verificar asignaciones
SELECT
    u.rut,
    CONCAT(u.nombre, ' ', u.apellido) as nombre,
    r.nombre as rol,
    m.nombre as modulo
FROM users u
JOIN usuario_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.rol_id = r.id
JOIN modulos m ON ur.modulo_id = m.id
WHERE m.nombre = 'Gestión de Petróleo'
ORDER BY u.rut;
```

---

### FASE 5: Testing Completo (FINAL 🎯)

#### 5.1 Verificar Todos los Servicios

```bash
# Terminal 1 - Backend Sistema Centralizado
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend
php artisan serve --port=8001

# Terminal 2 - Frontend Sistema Centralizado
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\frontend
npm run dev -- --port 5173

# Terminal 3 - Backend Sistema Petróleo
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend
php artisan serve --port=8000

# Terminal 4 - Frontend Sistema Petróleo
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\frontend
npm run dev -- --port 3000
```

#### 5.2 Test 1: Login Normal (Debe seguir funcionando)

1. Ir a `http://localhost:3000/login`
2. Ingresar con RUT + password
3. Verificar que funciona igual que antes
4. ✅ **Resultado esperado:** Login exitoso

#### 5.3 Test 2: Login Centralizado

1. Ir a `http://localhost:5173` (Sistema Centralizado)
2. Login con RUT (ejemplo: 172105599)
3. Debe mostrar módulos disponibles
4. Seleccionar "Gestión de Petróleo"
5. Debe redirigir a `http://localhost:3000?token=xxx&modulo_id=1`
6. HomePage detecta token y redirige a `/auth/centralizado`
7. LoginCentralizado valida token con backend
8. Redirige al dashboard según rol
9. ✅ **Resultado esperado:** Usuario autenticado sin password

#### 5.4 Verificar Logs

```bash
# Backend sistema petróleo
tail -f backend/storage/logs/laravel.log | grep "LOGIN CON TOKEN"

# Buscar:
# - "=== INICIO LOGIN CON TOKEN CENTRALIZADO ==="
# - "Token válido"
# - "Usuario creado automáticamente" o "Usuario existe localmente"
# - "=== LOGIN CENTRALIZADO EXITOSO ==="
```

#### 5.5 Verificar LocalStorage (Navegador)

```javascript
// En consola del navegador (F12)
console.log('Token:', JSON.parse(localStorage.getItem('authToken')));
console.log('Roles:', JSON.parse(localStorage.getItem('roles_centralizados')));
console.log('Permisos:', JSON.parse(localStorage.getItem('permisos_centralizados')));
```

#### 5.6 Test de Permisos y Funcionalidad

Para cada rol, verificar que:
- ✅ Puede acceder a sus rutas permitidas
- ✅ Ve los menús correspondientes
- ✅ Puede realizar operaciones (crear ingresos, ver reportes, etc.)
- ✅ No puede acceder a rutas no permitidas

---

## 📝 Checklist de Migración Completa

### Pre-Migración
- [ ] Backup de `sistema_petroleo` creado
- [ ] Backup de `sistema_autenticacion` creado
- [ ] Documentación leída y comprendida
- [ ] Entorno de desarrollo/staging preparado

### Consolidación de Usuarios
- [ ] Análisis de duplicados ejecutado (PASO 1)
- [ ] Tabla temporal creada (PASOS 2-3)
- [ ] Mapeo de consolidación revisado
- [ ] Relaciones actualizadas (PASO 4)
- [ ] Información consolidada (PASO 5)
- [ ] Usuarios duplicados eliminados (PASO 6)
- [ ] Verificaciones ejecutadas (PASO 7)
- [ ] No quedan usuarios duplicados

### Registro en Sistema Centralizado
- [ ] Módulo "Gestión de Petróleo" registrado
- [ ] Roles del módulo creados
- [ ] Usuarios migrados al sistema centralizado
- [ ] Roles asignados a usuarios
- [ ] Verificación de asignaciones completada

### Testing
- [ ] Login normal funciona correctamente
- [ ] Login centralizado funciona correctamente
- [ ] Redirecciones funcionan según rol
- [ ] Permisos se aplican correctamente
- [ ] Usuarios pueden realizar operaciones normales
- [ ] Logs no muestran errores críticos
- [ ] LocalStorage contiene datos correctos

### Post-Migración
- [ ] Tabla temporal limpiada (opcional)
- [ ] Documentación actualizada
- [ ] Usuarios informados del cambio
- [ ] Monitoreo activo por 1 semana

---

## 🐛 Troubleshooting

### Problema 1: "Token no proporcionado"

**Causa:** El token no se envía correctamente en la URL

**Solución:**
```javascript
// Verificar en consola del navegador
const params = new URLSearchParams(window.location.search);
console.log('Token:', params.get('token'));
console.log('Módulo ID:', params.get('modulo_id'));
```

### Problema 2: "Token inválido o sin acceso"

**Causa:** Usuario no tiene acceso al módulo de petróleo

**Solución:**
```sql
-- Verificar asignación en sistema centralizado
SELECT * FROM usuario_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.rut = '172105599' AND ur.modulo_id = 1;

-- Si no existe, asignar:
INSERT INTO usuario_roles (user_id, rol_id, modulo_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE rut = '172105599'),
    (SELECT id FROM roles WHERE nombre = 'administrador' AND modulo_id = 1),
    1,
    NOW(),
    NOW()
);
```

### Problema 3: Usuario no existe localmente

**Esto es NORMAL.** El sistema lo crea automáticamente.

**Verificar creación:**
```sql
SELECT * FROM sistema_petroleo.users WHERE rut = '172105599';
```

**Ver logs:**
```bash
tail -f backend/storage/logs/laravel.log | grep "Usuario creado automáticamente"
```

### Problema 4: Relaciones perdidas después de consolidación

**Causa:** No se ejecutó correctamente el PASO 4 del script de consolidación

**Solución:**
```sql
-- Verificar integridad referencial
SELECT COUNT(*) FROM ingresos_petroleo WHERE id_usuario NOT IN (SELECT id FROM users);
-- Debe ser 0

-- Si hay registros huérfanos, investigar
SELECT * FROM ingresos_petroleo WHERE id_usuario NOT IN (SELECT id FROM users);
```

### Problema 5: CORS Error

**Solución:**

`backend/config/cors.php`:
```php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:3000', 'http://localhost:5173'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

---

## 🔒 Seguridad

### Validaciones Implementadas

1. ✅ Token se valida con el sistema centralizado
2. ✅ Se verifica acceso al módulo específico
3. ✅ Usuarios sin acceso son rechazados
4. ✅ Logs detallados de cada intento
5. ✅ Tokens tienen expiración (24 horas)
6. ✅ Información sensible no se expone en logs

### Recomendaciones Adicionales

- Implementar HTTPS en producción
- Configurar rate limiting en nginx/apache
- Revisar logs regularmente
- Implementar alertas de intentos fallidos
- Rotar secrets periódicamente

---

## 📊 Mapeo de Roles

| ID Rol Petróleo | Rol Petróleo      | Rol Centralizado   | Permisos                           |
|-----------------|-------------------|--------------------|------------------------------------|
| 1               | bombero           | bombero            | Registro de abastecimientos        |
| 2               | admin             | administrador      | Acceso completo                    |
| 3               | gerente           | gerente            | Reportes y gestión                 |
| 4               | asistente_bombero | asistente_bombero  | Asistencia en abastecimientos      |
| 6               | operador_vehiculo | operador_vehiculo  | Registro de cargas externas        |
| 7               | planificador      | planificador       | Planificación de operaciones       |
| 8               | jefe_mina         | jefe_mina          | Supervisión de faena               |

---

## 🎉 Beneficios Esperados

### Para Usuarios
✅ Un solo login para todos los sistemas
✅ No más cuentas duplicadas
✅ Experiencia unificada
✅ Acceso más rápido a los módulos

### Para Administradores
✅ Gestión centralizada de usuarios
✅ Control de permisos más granular
✅ Auditoría unificada
✅ Mantenimiento simplificado

### Para el Sistema
✅ Datos más consistentes
✅ Menos redundancia
✅ Mejor escalabilidad
✅ Código más mantenible

---

## 📞 Soporte

### Revisar Logs

```bash
# Sistema Petróleo
tail -f backend/storage/logs/laravel.log

# Sistema Centralizado
tail -f ../Sistema_de_autenticacion_centralizado/backend/storage/logs/laravel.log
```

### Verificar Configuración

```bash
# Variables de entorno
cat backend/.env | grep SISTEMA_CENTRALIZADO

# Rutas registradas
php artisan route:list | grep login
```

### Rollback de Emergencia

Si algo sale mal, restaurar backup:

```bash
mysql -u root sistema_petroleo < backup_antes_consolidacion.sql
```

---

**Última actualización:** 3 de diciembre de 2025
**Versión:** 2.0
**Autor:** Sistema de Gestión - Claude Code
