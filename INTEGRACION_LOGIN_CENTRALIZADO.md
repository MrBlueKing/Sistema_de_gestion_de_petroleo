# 🔐 Integración con Sistema de Autenticación Centralizado

## 📋 Resumen de Cambios

Se ha implementado un **login dual** para el Sistema de Gestión de Petróleo:

1. ✅ **Login actual** - Sigue funcionando normalmente (NO se modificó)
2. ✅ **Login centralizado** - Nueva opción que permite autenticación desde el sistema centralizado

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────┐
│  Sistema Autenticación Centralizado      │
│  (Puerto 8001)                           │
│  - Login con RUT                         │
│  - Gestión de módulos                    │
│  - Roles y permisos                      │
└────────────┬─────────────────────────────┘
             │
             │ Token Bearer
             │
             ▼
┌──────────────────────────────────────────┐
│  Sistema Gestión de Petróleo            │
│  (Puerto 8000 backend / 3000 frontend)  │
│  - Valida token                          │
│  - Crea/actualiza usuario local          │
│  - Mapea roles                           │
└──────────────────────────────────────────┘
```

---

## 📦 Archivos Modificados

### Backend (Laravel)

#### 1. `AuthController.php`
**Ubicación:** `backend/app/Http/Controllers/Api/AuthController.php`

**Método agregado:**
- `loginWithCentralToken()` - Valida token del sistema centralizado
- `mapearRolCentralizado()` - Mapea roles entre sistemas

**Características:**
- ✅ Valida token con sistema centralizado
- ✅ Crea usuarios automáticamente si no existen
- ✅ Actualiza información de usuarios existentes
- ✅ Mapea roles correctamente
- ✅ Logs detallados para debugging

#### 2. `routes/api.php`
**Nueva ruta:**
```php
POST /api/login-centralizado
```

**Parámetros:**
- Header: `Authorization: Bearer {token}`
- Body: `{ "modulo_id": 1 }`

#### 3. `.env`
**Variable agregada:**
```
SISTEMA_CENTRALIZADO_URL=http://localhost:8001
```

---

## 🗄️ Base de Datos

### Script de Registro del Módulo

**Archivo:** `registrar_modulo_petroleo.sql`

Ejecutar en la base de datos `sistema_autenticacion`:

```bash
mysql -u root sistema_autenticacion < registrar_modulo_petroleo.sql
```

**Pasos que realiza:**
1. Registra el módulo "Gestión de Petróleo"
2. Crea roles básicos (administrador, gerente, bombero)
3. Proporciona scripts para asignar usuarios

---

## 🎯 Flujo de Autenticación

### Flujo Normal (Actual) - SIN CAMBIOS

```
Usuario → /login
    ↓
RUT + Password
    ↓
Validación local
    ↓
Token Sanctum
    ↓
Sesión en sistema
```

### Flujo Centralizado (Nuevo)

```
Usuario → Sistema Centralizado (8001)
    ↓
Login con RUT
    ↓
Recibe Token + Lista de módulos
    ↓
Selecciona "Gestión de Petróleo"
    ↓
Redirección → http://localhost:3000?token=xxx&modulo_id=1
    ↓
Frontend detecta token
    ↓
POST /api/login-centralizado
    ↓
Backend valida con centralizado
    ↓
Usuario autenticado en sistema
```

---

## 🔧 Configuración Paso a Paso

### PASO 1: Configurar Base de Datos (10 min)

1. **Ejecutar script de registro:**

```bash
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado
mysql -u root -p sistema_autenticacion < registrar_modulo_petroleo.sql
```

2. **Obtener el ID del módulo creado:**

```sql
SELECT id, nombre, url FROM modulos WHERE nombre = 'Gestión de Petróleo';
```

3. **Asignar usuarios al módulo:**

```sql
-- Ver usuarios disponibles
SELECT id, rut, nombre, apellido FROM users;

-- Asignar usuario (reemplazar USER_ID y MODULO_ID)
INSERT INTO usuario_roles (user_id, rol_id, modulo_id, created_at, updated_at)
VALUES (
    1, -- ID del usuario
    (SELECT id FROM roles WHERE nombre = 'administrador' AND modulo_id = 1),
    1, -- ID del módulo de petróleo
    NOW(),
    NOW()
);
```

---

### PASO 2: Configurar Backend (Ya hecho ✅)

Los cambios ya están aplicados:
- ✅ Método `loginWithCentralToken()` agregado
- ✅ Ruta `/api/login-centralizado` creada
- ✅ Variable `SISTEMA_CENTRALIZADO_URL` en .env

**Verificar configuración:**

```bash
cd backend
php artisan route:list | grep login
```

Deberías ver:
```
POST /api/login .......................... login actual
POST /api/login-centralizado ............. login centralizado (nuevo)
```

---

### PASO 3: Configurar Frontend (Siguiente paso)

#### 3.1 Detectar token en URL

**Archivo:** `frontend/src/App.jsx` o `frontend/src/main.jsx`

```javascript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from './lib/axios';

function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Detectar si viene token del sistema centralizado
    const token = searchParams.get('token');
    const moduloId = searchParams.get('modulo_id');

    if (token && moduloId) {
      console.log('🔐 Token detectado, autenticando...');
      loginWithCentralToken(token, moduloId);
    }
  }, [searchParams]);

  const loginWithCentralToken = async (token, moduloId) => {
    try {
      const response = await axios.post('/api/login-centralizado',
        { modulo_id: parseInt(moduloId) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Guardar token y usuario
        localStorage.setItem('authToken', JSON.stringify({
          token: response.data.token
        }));
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Limpiar URL
        window.history.replaceState({}, document.title, '/');

        // Redirigir según rol
        const rol = response.data.user.rol;
        if (rol === 'admin') navigate('/administrador');
        else if (rol === 'gerente') navigate('/Gerente');
        else if (rol === 'bombero') navigate('/bombero');
        else navigate('/');

        console.log('✅ Autenticación centralizada exitosa');
      }
    } catch (error) {
      console.error('❌ Error en autenticación centralizada:', error);
      alert('Error al autenticar con el sistema centralizado');
      navigate('/login'); // Fallback al login normal
    }
  };

  // ... resto del componente
}
```

#### 3.2 Agregar botón opcional en Login

**Archivo:** `frontend/src/pages/LoginPage.jsx`

Agregar un botón para ir al sistema centralizado:

```jsx
<button
  onClick={() => window.location.href = 'http://localhost:8001/login'}
  className="mt-4 text-blue-600 hover:text-blue-800 underline"
>
  🔐 Ingresar con Sistema Centralizado
</button>
```

---

### PASO 4: Configurar Sistema Centralizado

**Archivo:** `Sistema_de_autenticacion_centralizado/frontend/.env`

Agregar URL del módulo de petróleo:

```env
VITE_MODULO_PETROLEO_URL=http://localhost:3000
```

**Modificar redirección al seleccionar módulo:**

Cuando el usuario seleccione "Gestión de Petróleo", redirigir con token:

```javascript
const handleModuloClick = (modulo) => {
  const token = localStorage.getItem('auth_token');
  const url = `${modulo.url}?token=${token}&modulo_id=${modulo.id}`;
  window.location.href = url;
};
```

---

## 🧪 Testing

### Test 1: Login Normal (Debe seguir funcionando)

```bash
# Terminal 1 - Backend
cd backend
php artisan serve --port=8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acceder a `http://localhost:3000/login` y probar login normal.

**Resultado esperado:** ✅ Login funciona igual que antes

---

### Test 2: Login Centralizado

```bash
# Terminal 1 - Sistema Centralizado Backend
cd ../Sistema_de_autenticacion_centralizado/backend
php artisan serve --port=8001

# Terminal 2 - Sistema Centralizado Frontend
cd ../Sistema_de_autenticacion_centralizado/frontend
npm run dev --port=5173

# Terminal 3 - Sistema Petróleo Backend
cd ../Sistema_de_gestion_de_petroleo/backend
php artisan serve --port=8000

# Terminal 4 - Sistema Petróleo Frontend
cd ../Sistema_de_gestion_de_petroleo/frontend
npm run dev --port=3000
```

**Pasos:**
1. Ir a `http://localhost:5173` (Sistema Centralizado)
2. Login con RUT (ej: 12345678-9)
3. Seleccionar módulo "Gestión de Petróleo"
4. Debe redirigir a `http://localhost:3000` ya autenticado

**Resultado esperado:** ✅ Autenticación automática en sistema de petróleo

---

## 🐛 Debugging

### Ver logs del backend:

```bash
tail -f backend/storage/logs/laravel.log
```

Buscar:
- `=== INICIO LOGIN CON TOKEN CENTRALIZADO ===`
- `Token válido`
- `Usuario creado automáticamente`
- `=== LOGIN CENTRALIZADO EXITOSO ===`

### Verificar token en frontend:

```javascript
// En consola del navegador
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('user'));
```

### Test manual del endpoint:

```bash
# 1. Obtener token del sistema centralizado
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"12345678-9","password":"tu_password"}'

# Copiar el token de la respuesta

# 2. Probar login centralizado
curl -X POST http://localhost:8000/api/login-centralizado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"modulo_id":1}'
```

---

## 🔒 Seguridad

### Validaciones implementadas:

1. ✅ Token se valida con el sistema centralizado
2. ✅ Se verifica acceso al módulo específico
3. ✅ Usuarios sin acceso son rechazados
4. ✅ Logs detallados de cada intento
5. ✅ Información sensible no se expone

### Consideraciones:

- Token se comunica mediante HTTPS en producción
- Rate limiting debe configurarse en nginx/apache
- Tokens tienen expiración configurable

---

## 📊 Mapeo de Roles

El sistema mapea automáticamente roles del sistema centralizado a roles locales:

| Rol Centralizado | Rol Local (ID) | Descripción |
|------------------|----------------|-------------|
| administrador    | 2 (admin)      | Acceso completo |
| gerente          | 3 (gerente)    | Gestión y reportes |
| bombero          | 1 (bombero)    | Abastecimiento |
| asistente_bombero | 1 (bombero)   | Asistente |
| operador_vehiculo | 6             | Operador |
| planificador     | 7              | Planificación |
| jefe_mina        | 8              | Jefe de mina |

**Personalizar mapeo:** Editar método `mapearRolCentralizado()` en `AuthController.php`

---

## ✅ Checklist de Implementación

- [x] Backend: Método `loginWithCentralToken()` creado
- [x] Backend: Ruta `/api/login-centralizado` agregada
- [x] Backend: Variable `SISTEMA_CENTRALIZADO_URL` en .env
- [x] Base de datos: Script de registro de módulo creado
- [ ] Base de datos: Módulo registrado en sistema centralizado
- [ ] Base de datos: Usuarios asignados al módulo
- [ ] Frontend: Detección de token en URL
- [ ] Frontend: Función `loginWithCentralToken()`
- [ ] Frontend: Botón opcional en login
- [ ] Sistema Centralizado: URL del módulo configurada
- [ ] Testing: Login normal verificado
- [ ] Testing: Login centralizado probado
- [ ] Producción: Variables de entorno actualizadas

---

## 🚀 Próximos Pasos

1. **Completar configuración frontend** (ver PASO 3)
2. **Registrar módulo en BD** (ejecutar script SQL)
3. **Asignar usuarios de prueba**
4. **Realizar testing exhaustivo**
5. **Documentar para usuarios finales**

---

## 📞 Soporte

Si tienes dudas o encuentras errores:

1. Revisar logs: `backend/storage/logs/laravel.log`
2. Verificar configuración de URLs en .env
3. Validar que el sistema centralizado esté corriendo
4. Confirmar que el módulo esté registrado en BD

---

## 🎉 Beneficios de esta Implementación

✅ **Login actual NO se modificó** - Cero riesgo para usuarios actuales
✅ **Sistema dual** - Ambos métodos funcionan simultáneamente
✅ **Creación automática de usuarios** - No requiere migración manual
✅ **Mapeo inteligente de roles** - Roles se adaptan automáticamente
✅ **Logs completos** - Fácil debugging y monitoreo
✅ **Rollback inmediato** - Solo desactivar la nueva ruta si hay problemas

---

**Última actualización:** 2 de diciembre de 2025
**Versión:** 1.0
