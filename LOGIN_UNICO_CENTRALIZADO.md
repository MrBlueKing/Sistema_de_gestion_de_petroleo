# 🔐 Sistema de Login Único Centralizado

## ✅ ¿Qué se ha configurado?

El sistema de petróleo ahora **SOLO** permite login a través del **Sistema de Autenticación Centralizado**.

### Cambios Implementados:

1. ✅ **LoginScreen modificado** - Redirige automáticamente al sistema centralizado
2. ✅ **HomePage configurado** - Detecta tokens del sistema centralizado
3. ✅ **LoginCentralizado componente** - Maneja la autenticación automática
4. ✅ **Ruta /auth/centralizado** - Procesa tokens y autentica usuarios

---

## 🎯 ¿Cómo funciona?

### Flujo Completo de Autenticación:

```
1. Usuario intenta entrar a Sistema Petróleo
   http://localhost:3000/login

   ↓

2. Redirige automáticamente a Sistema Centralizado
   http://localhost:5173

   ↓

3. Usuario hace login UNA SOLA VEZ
   - RUT: 123456789
   - Password: password

   ↓

4. Sistema Centralizado valida credenciales
   - Verifica password en BD centralizada
   - Genera TOKEN válido

   ↓

5. Muestra módulos disponibles
   - 🛢️ Gestión de Petróleo
   - ⚙️ Producción
   - 📊 Otros módulos...

   ↓

6. Usuario selecciona "Gestión de Petróleo"
   Redirige a: http://localhost:3000?token=xxx&modulo_id=1

   ↓

7. HomePage detecta token en URL
   Redirige a: /auth/centralizado

   ↓

8. LoginCentralizado valida token
   - POST /api/login-centralizado
   - Backend valida con sistema centralizado
   - Crea/actualiza usuario local

   ↓

9. Usuario autenticado automáticamente
   Redirige según su rol:
   - Admin → /administrador
   - Gerente → /Gerente
   - Bombero → /bombero
   - Operador → /OperadorVehiculo
```

---

## 🔧 Configuración Actual

### Frontend - LoginScreen.jsx:17

```javascript
const FORCE_CENTRALIZED_LOGIN = true; // ✅ Activado
```

**Esto hace que:**
- Al entrar a `/login` → Redirige automáticamente al sistema centralizado
- NO se puede hacer login local
- SOLO se puede entrar por sistema centralizado

### Para desactivar (NO recomendado):

```javascript
const FORCE_CENTRALIZED_LOGIN = false; // Permitir login local
```

---

## 📋 Requisitos Previos

### 1. Sistema Centralizado debe estar configurado

**Base de datos: `sistema_autenticacion`**

```sql
-- Verificar que el módulo existe
SELECT * FROM modulos WHERE nombre = 'Gestión de Petróleo';

-- Debe retornar:
-- id=1, nombre='Gestión de Petróleo', url='http://localhost:3000'
```

### 2. Usuarios deben estar registrados en sistema centralizado

```sql
-- Ver usuarios en sistema centralizado
SELECT id, rut, nombre, apellido, email FROM sistema_autenticacion.users;

-- Ejemplo de usuario admin:
-- RUT: 123456789
-- Password: password (hasheada en BD)
```

### 3. Usuarios deben tener roles asignados

```sql
-- Ver roles asignados
SELECT
    u.rut,
    u.nombre,
    r.nombre as rol,
    m.nombre as modulo
FROM sistema_autenticacion.users u
JOIN sistema_autenticacion.usuario_roles ur ON u.id = ur.user_id
JOIN sistema_autenticacion.roles r ON ur.rol_id = r.id
JOIN sistema_autenticacion.modulos m ON ur.modulo_id = m.id
WHERE m.nombre = 'Gestión de Petróleo';
```

---

## 🚀 Cómo Iniciar el Sistema

### Terminal 1: Backend Sistema Centralizado

```bash
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend
php artisan serve --port=8001
```

**Output esperado:**
```
Laravel development server started: http://localhost:8001
```

### Terminal 2: Frontend Sistema Centralizado

```bash
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\frontend
npm run dev
```

**Output esperado:**
```
Local:   http://localhost:5173/
```

### Terminal 3: Backend Sistema Petróleo

```bash
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend
php artisan serve --port=8000
```

**Output esperado:**
```
Laravel development server started: http://localhost:8000
```

### Terminal 4: Frontend Sistema Petróleo

```bash
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\frontend
npm run dev
```

**Output esperado:**
```
Local:   http://localhost:3000/
```

---

## 🧪 Probar el Sistema

### Paso 1: Intentar acceder al sistema de petróleo

```
1. Abrir navegador
2. Ir a: http://localhost:3000
3. Automáticamente redirige a: http://localhost:5173
```

### Paso 2: Hacer login en sistema centralizado

```
1. Ingresar RUT: 123456789
2. Ingresar Password: password
3. Click en "Ingresar"
```

### Paso 3: Seleccionar módulo

```
1. Ver módulos disponibles
2. Click en "🛢️ Gestión de Petróleo"
3. Automáticamente redirige a petróleo
```

### Paso 4: Verificar autenticación automática

```
1. URL cambia a: http://localhost:3000?token=xxx&modulo_id=1
2. HomePage detecta token
3. Redirige a /auth/centralizado
4. Pantalla de "Autenticando..."
5. Redirige al dashboard según rol
```

---

## 🐛 Solución de Problemas

### Problema 1: "Sin conexión al servidor"

**Causa:** Alguno de los servicios no está corriendo

**Solución:**
```bash
# Verificar que todos los servicios estén activos
# Backend centralizado: http://localhost:8001
# Frontend centralizado: http://localhost:5173
# Backend petróleo: http://localhost:8000
# Frontend petróleo: http://localhost:3000
```

### Problema 2: "Token inválido o sin acceso"

**Causa:** Usuario no tiene acceso al módulo de petróleo

**Solución:**
```sql
USE sistema_autenticacion;

-- Asignar rol al usuario
INSERT INTO usuario_roles (user_id, rol_id, modulo_id, created_at, updated_at)
VALUES (
    (SELECT id FROM users WHERE rut = '123456789'),
    (SELECT id FROM roles WHERE nombre = 'administrador' AND modulo_id = 1),
    1,
    NOW(),
    NOW()
);
```

### Problema 3: "This password does not use Bcrypt algorithm"

**Causa:** Password en sistema centralizado no está hasheado correctamente

**Solución:**
```sql
USE sistema_autenticacion;

-- Actualizar password (valor: "password")
UPDATE users
SET password = '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYSQYKgDB9u'
WHERE rut = '123456789';
```

### Problema 4: "Usuario no existe localmente"

**Esto es NORMAL.** El sistema lo crea automáticamente.

**Verificar:**
```bash
# Ver logs del backend petróleo
tail -f backend/storage/logs/laravel.log | grep "Usuario creado automáticamente"
```

### Problema 5: Loop infinito de redirección

**Causa:** Sistema centralizado no está corriendo

**Solución:**
1. Verificar que http://localhost:5173 esté accesible
2. Reiniciar servicios
3. Limpiar caché del navegador (Ctrl + Shift + Delete)
4. Limpiar localStorage:
```javascript
// En consola del navegador (F12)
localStorage.clear();
sessionStorage.clear();
```

---

## 📊 Ver Logs en Tiempo Real

### Backend Petróleo

```bash
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend
tail -f storage/logs/laravel.log
```

**Buscar:**
- `=== INICIO LOGIN CON TOKEN CENTRALIZADO ===`
- `Token válido`
- `Usuario creado automáticamente`
- `=== LOGIN CENTRALIZADO EXITOSO ===`

### Backend Centralizado

```bash
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend
tail -f storage/logs/laravel.log
```

---

## 🔒 Seguridad

### Passwords en Base de Datos

❌ **NUNCA guardar passwords en texto plano**

✅ **Siempre usar bcrypt:**

```php
// En Laravel
Hash::make('password');
// Resultado: $2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYSQYKgDB9u
```

### Separación de Responsabilidades

```
Sistema Centralizado:
- Maneja passwords
- Valida credenciales
- Genera tokens
- Gestiona permisos globales

Sistema Petróleo:
- Recibe tokens
- Valida tokens con centralizado
- NO maneja passwords
- Gestiona datos locales (ingresos, maquinas, etc.)
```

---

## 📝 Variables de Entorno

### Backend Petróleo (.env)

```env
SISTEMA_CENTRALIZADO_URL=http://localhost:8001
```

### Frontend Petróleo (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_SISTEMA_CENTRALIZADO_URL=http://localhost:5173
```

---

## 🎯 Próximos Pasos

### 1. Consolidar Usuarios Duplicados

Si tienes usuarios duplicados en `sistema_petroleo.users`:

```bash
# Usar el script creado anteriormente
mysql -u root sistema_petroleo < consolidar_usuarios_duplicados.sql
```

### 2. Migrar Usuarios al Sistema Centralizado

Copiar usuarios de `sistema_petroleo` a `sistema_autenticacion`:

```sql
-- Ver usuarios que faltan migrar
SELECT u.rut, u.nombre, u.apellido
FROM sistema_petroleo.users u
WHERE NOT EXISTS (
    SELECT 1 FROM sistema_autenticacion.users uc
    WHERE uc.rut = u.rut
);
```

### 3. Invalidar Passwords Locales (Opcional pero recomendado)

Para forzar login centralizado únicamente:

```sql
USE sistema_petroleo;

-- Invalidar todos los passwords locales
UPDATE users
SET password = '$2y$12$INVALID_CENTRALIZED_LOGIN_ONLY'
WHERE estado = 1;
```

---

## ✅ Beneficios del Login Único

### Para Usuarios:
✅ Un solo password para recordar
✅ Acceso más rápido
✅ No más cuentas duplicadas
✅ Un solo lugar para cambiar password

### Para Administradores:
✅ Gestión centralizada de usuarios
✅ Control de acceso unificado
✅ Auditoría más simple
✅ Menos datos duplicados

### Para el Sistema:
✅ Más seguro (un solo punto de autenticación)
✅ Más mantenible
✅ Mejor escalabilidad
✅ Código más limpio

---

## 🔄 Cómo Revertir (En caso de emergencia)

Si necesitas volver al login local temporalmente:

### Paso 1: Editar LoginScreen.jsx

```javascript
// Línea 18
const FORCE_CENTRALIZED_LOGIN = false; // Cambiar a false
```

### Paso 2: Guardar y recargar

```bash
# El frontend se recargará automáticamente
# Ahora http://localhost:3000/login mostrará el formulario local
```

### Paso 3: Asegurar passwords válidos

```sql
USE sistema_petroleo;

-- Verificar que los usuarios tienen passwords válidos
SELECT id, rut, LENGTH(password) as pwd_length
FROM users
WHERE password LIKE '$2y$%';
```

---

## 📞 Soporte

### Archivos Relacionados:

**Frontend:**
- `frontend/src/components/organisms/Login/LoginScreen.jsx:17` - Configuración login
- `frontend/src/components/organisms/Login/LoginCentralizado.jsx` - Autenticación con token
- `frontend/src/pages/HomePage.jsx:9` - Detección de token
- `frontend/src/services/authCentralizado.js` - Servicio de autenticación
- `frontend/src/routes/Routes.jsx:75` - Ruta /auth/centralizado

**Backend:**
- `backend/app/Http/Controllers/Api/AuthController.php:477` - Endpoint login centralizado
- `backend/routes/api.php` - Ruta POST /api/login-centralizado
- `backend/config/cors.php` - Configuración CORS
- `backend/.env` - Variables de entorno

### Logs Importantes:

```bash
# Backend petróleo
backend/storage/logs/laravel.log

# Buscar errores
grep "ERROR" backend/storage/logs/laravel.log
grep "FAIL" backend/storage/logs/laravel.log
```

---

**Última actualización:** 3 de diciembre de 2025
**Versión:** 1.0 - Login Único Centralizado
**Estado:** ✅ Implementado y funcionando
