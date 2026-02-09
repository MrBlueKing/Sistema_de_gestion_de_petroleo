# 🔐 Resumen Completo: Sistema de Login Centralizado

**Fecha:** Diciembre 2025
**Sistema:** Gestión de Petróleo + Sistema de Autenticación Centralizado
**Estado:** ✅ Operativo y Profesional

---

## 📊 **ESTADO ACTUAL DEL SISTEMA**

### ✅ **Lo que ESTÁ implementado y funcionando:**

1. **Login Centralizado**
   - Los usuarios hacen login en `http://localhost:5174` (Sistema Centralizado)
   - Las credenciales se validan contra `sistema_autenticacion.users`
   - Se genera un token de autenticación

2. **Múltiples Roles por Usuario**
   - Un usuario puede tener varios roles en el módulo de petróleo
   - Ejemplo: Juan puede ser "bombero" y "gerente" simultáneamente
   - Los roles se almacenan en `sistema_autenticacion.usuario_roles`

3. **Selector de Rol**
   - Si el usuario tiene múltiples roles, selecciona cuál usar
   - El sistema redirige con el rol específico

4. **🆕 Cambio Rápido de Rol (SIN cerrar sesión)**
   - Dropdown en el header del sistema de petróleo
   - Muestra todos los roles disponibles del usuario
   - Permite cambiar de rol sin cerrar sesión
   - Validación en tiempo real con sistema centralizado

5. **Sincronización Automática**
   - Al hacer login, el usuario se sincroniza automáticamente en `m3h_gestion_petroleo.users`
   - El rol seleccionado se actualiza en la copia local

6. **Panel de Administración de Roles (Sistema Centralizado)**
   - Gestión completa de roles por usuario y módulo
   - Vista consolidada de todos los usuarios y sus roles
   - Asignación/Remoción de roles en tiempo real
   - Disponible en: `http://localhost:5174/admin/users`

7. **Migración de Usuarios Completada**
   - Script `migracion_fase1_v3_final.sql` ejecutado ✅
   - Usuarios existentes migrados al sistema centralizado
   - Roles asignados correctamente

---

## 🗄️ **ARQUITECTURA DE BASES DE DATOS**

### **Base de Datos 1: `sistema_autenticacion` (FUENTE DE VERDAD ⭐)**

```sql
-- Tabla: users
-- Contiene los usuarios maestros del sistema
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT 1,
    id_faena INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Tabla: usuario_roles
-- Relaciona usuarios con roles en módulos específicos
CREATE TABLE usuario_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rol_id INT NULL,                      -- No se usa para roles externos
    modulo_id INT NOT NULL,               -- 8 = Petróleo
    rol_sistema_externo VARCHAR(50),      -- 'bombero', 'gerente', etc.
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (modulo_id) REFERENCES modulos(id)
);

-- Tabla: modulos
-- Define los módulos del sistema
CREATE TABLE modulos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    url VARCHAR(255),
    icono VARCHAR(50),
    estado BOOLEAN DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Ejemplo de datos:
-- Módulo Petróleo: id=8, nombre='Gestión de Petróleo'
```

### **Base de Datos 2: `m3h_gestion_petroleo` (COPIA SINCRONIZADA 📋)**

```sql
-- Tabla: users (copia local)
-- Se sincroniza automáticamente desde el sistema centralizado
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255),           -- Password random (no se usa)
    estado BOOLEAN DEFAULT 1,
    id_rol INT,                      -- Rol mapeado del centralizado
    id_faena INT,
    faena_activa_id INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Tabla: roles (mapeo local)
-- Define la correspondencia de roles
CREATE TABLE roles (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    rol VARCHAR(50) NOT NULL
);

-- Mapeo de roles:
-- id_rol=1 → 'bombero'
-- id_rol=2 → 'gerente'
-- id_rol=3 → 'admin'
-- etc.
```

---

## 🔄 **FLUJO COMPLETO DE LOGIN - PASO A PASO**

### **FASE 1: Autenticación en Sistema Centralizado**

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 1: Usuario accede al login                            │
├──────────────────────────────────────────────────────────────┤
│  URL: http://localhost:5174                                  │
│  Pantalla: Formulario de login                               │
│  Campos: RUT + Password                                      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 2: Frontend envía credenciales                         │
├──────────────────────────────────────────────────────────────┤
│  POST http://localhost:8001/api/auth/login                   │
│  Body: { "rut": "12345678-9", "password": "..." }           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 3: Backend Centralizado valida                         │
├──────────────────────────────────────────────────────────────┤
│  1. Busca usuario en sistema_autenticacion.users            │
│  2. Verifica password con Hash::check()                      │
│  3. Verifica estado = 1 (activo)                             │
│  4. Crea token de Sanctum                                    │
│  5. Guarda token con expiración 24h                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 4: Retorna token al frontend                          │
├──────────────────────────────────────────────────────────────┤
│  Response: {                                                 │
│    "token": "1|abc123xyz...",                                │
│    "user": { "id": 10, "nombre": "Juan", ... }              │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

### **FASE 2: Obtener Módulos y Roles**

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 5: Frontend obtiene módulos disponibles               │
├──────────────────────────────────────────────────────────────┤
│  GET http://localhost:8001/api/modulos-disponibles          │
│  Headers: Authorization: Bearer 1|abc123xyz...              │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 6: Backend consulta roles del usuario                 │
├──────────────────────────────────────────────────────────────┤
│  Query SQL:                                                  │
│  SELECT DISTINCT ur.rol_sistema_externo                      │
│  FROM usuario_roles ur                                       │
│  WHERE ur.user_id = 10                                       │
│    AND ur.modulo_id = 8                                      │
│                                                              │
│  Resultado: ['bombero', 'gerente']                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 7: Retorna módulos con roles                          │
├──────────────────────────────────────────────────────────────┤
│  Response: {                                                 │
│    "modulos": [                                              │
│      {                                                       │
│        "id": 8,                                              │
│        "nombre": "Gestión de Petróleo",                      │
│        "url": "http://localhost:3000",                       │
│        "roles": ["bombero", "gerente"]                       │
│      }                                                       │
│    ]                                                         │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

### **FASE 3: Selector de Rol (si tiene múltiples)**

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 8: Frontend muestra selector                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SI tiene 1 solo rol:                                        │
│    → Redirige automáticamente                                │
│                                                              │
│  SI tiene múltiples roles:                                   │
│    → Muestra selector:                                       │
│                                                              │
│      ┌────────────────────────────────┐                     │
│      │  Selecciona tu rol:            │                     │
│      │                                │                     │
│      │  ( ) Bombero                   │                     │
│      │  (•) Gerente    ← Usuario elige│                     │
│      │                                │                     │
│      │  [ Continuar ]                 │                     │
│      └────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 9: Redirección con rol seleccionado                   │
├──────────────────────────────────────────────────────────────┤
│  URL: http://localhost:3000?token=1|abc123xyz...&           │
│       modulo_id=8&rol=gerente                                │
└──────────────────────────────────────────────────────────────┘
```

---

### **FASE 4: Validación en Sistema de Petróleo**

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 10: Frontend de Petróleo captura parámetros          │
├──────────────────────────────────────────────────────────────┤
│  JavaScript detecta:                                         │
│  - token = "1|abc123xyz..."                                  │
│  - modulo_id = 8                                             │
│  - rol = "gerente"                                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 11: Frontend llama a su backend                       │
├──────────────────────────────────────────────────────────────┤
│  POST http://localhost:8000/api/login-centralizado          │
│  Headers: Authorization: Bearer 1|abc123xyz...              │
│  Body: {                                                     │
│    "modulo_id": 8,                                           │
│    "rol_solicitado": "gerente"                               │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 12: Backend Petróleo valida con Centralizado         │
├──────────────────────────────────────────────────────────────┤
│  Backend Petróleo hace HTTP Request:                        │
│                                                              │
│  POST http://localhost:8001/api/validar-token               │
│  Headers: Authorization: Bearer 1|abc123xyz...              │
│  Body: {                                                     │
│    "modulo_id": 8,                                           │
│    "rol_solicitado": "gerente"                               │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 13: Centralizado valida token y rol                  │
├──────────────────────────────────────────────────────────────┤
│  1. Verifica que el token sea válido                        │
│  2. Verifica que no haya expirado                           │
│  3. Busca el usuario del token                              │
│  4. Verifica acceso al módulo 8:                            │
│                                                              │
│     SELECT * FROM usuario_roles                              │
│     WHERE user_id = 10                                       │
│       AND modulo_id = 8                                      │
│       AND rol_sistema_externo = 'gerente'                    │
│                                                              │
│  5. Si todo OK, retorna datos del usuario                   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 14: Backend Centralizado responde                     │
├──────────────────────────────────────────────────────────────┤
│  Response: {                                                 │
│    "valid": true,                                            │
│    "user": {                                                 │
│      "id": 10,                                               │
│      "rut": "12345678-9",                                    │
│      "nombre": "Juan",                                       │
│      "apellido": "Pérez",                                    │
│      "email": "juan@example.com",                            │
│      "faena": { "id": 1, "ubicacion": "Mina Norte" }        │
│    },                                                        │
│    "roles": ["bombero", "gerente"],                          │
│    "rol_asignado": "gerente",                                │
│    "permisos": [...]                                         │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

### **FASE 5: Sincronización y Creación de Token Local**

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 15: Backend Petróleo sincroniza usuario               │
├──────────────────────────────────────────────────────────────┤
│  1. Mapea 'gerente' → id_rol = 2 (local)                    │
│                                                              │
│  2. Busca usuario en m3h_gestion_petroleo.users:            │
│     $user = User::where('rut', '12345678-9')->first();      │
│                                                              │
│  3a. SI NO EXISTE:                                           │
│      User::create([                                          │
│        'rut' => '12345678-9',                                │
│        'nombre' => 'Juan',                                   │
│        'apellido' => 'Pérez',                                │
│        'email' => 'juan@example.com',                        │
│        'id_rol' => 2,  // ← Gerente                          │
│        'id_faena' => 1,                                      │
│        'password' => Hash::make(uniqid()),                   │
│        'estado' => 1                                         │
│      ]);                                                     │
│                                                              │
│  3b. SI YA EXISTE:                                           │
│      $user->update([                                         │
│        'nombre' => 'Juan',                                   │
│        'apellido' => 'Pérez',                                │
│        'email' => 'juan@example.com',                        │
│        'id_rol' => 2  // ← Actualiza al rol seleccionado    │
│      ]);                                                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 16: Crea token LOCAL de Petróleo                     │
├──────────────────────────────────────────────────────────────┤
│  $tokenResult = $user->createToken('auth_token');           │
│  $localToken = $tokenResult->plainTextToken;                │
│                                                              │
│  // Token LOCAL: "2|xyz789abc..."                           │
│                                                              │
│  // Configurar expiración                                   │
│  $tokenModel->expires_at = now()->addHours(24);             │
│  $tokenModel->save();                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 17: Backend Petróleo responde al frontend            │
├──────────────────────────────────────────────────────────────┤
│  Response: {                                                 │
│    "success": true,                                          │
│    "user": {                                                 │
│      "id": 5,  // ← ID local en BD de petróleo              │
│      "nombre": "Juan",                                       │
│      "rol": "gerente",  // ← Rol mapeado                    │
│      "id_rol": 2,                                            │
│      ...                                                     │
│    },                                                        │
│    "token": "2|xyz789abc...",  // ← TOKEN LOCAL             │
│    "expires_at": "2025-12-05T15:30:00Z",                    │
│    "authenticated_by": "sistema_centralizado"               │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

### **FASE 6: Uso del Sistema de Petróleo**

```
┌──────────────────────────────────────────────────────────────┐
│  PASO 18: Frontend guarda token LOCAL                       │
├──────────────────────────────────────────────────────────────┤
│  localStorage.setItem('token', '2|xyz789abc...');           │
│  localStorage.setItem('user', JSON.stringify(user));         │
│                                                              │
│  Redirige a: /dashboard                                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PASO 19: Usuario usa el sistema de Petróleo               │
├──────────────────────────────────────────────────────────────┤
│  Todas las peticiones usan el TOKEN LOCAL:                  │
│                                                              │
│  GET http://localhost:8000/api/consumos                     │
│  Headers: Authorization: Bearer 2|xyz789abc...              │
│                                                              │
│  GET http://localhost:8000/api/ingresos-petroleo           │
│  Headers: Authorization: Bearer 2|xyz789abc...              │
│                                                              │
│  POST http://localhost:8000/api/consumos                    │
│  Headers: Authorization: Bearer 2|xyz789abc...              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔑 **TOKENS: Diferencias Clave**

```
┌────────────────────────────────────────────────────────────────┐
│  TOKEN DEL SISTEMA CENTRALIZADO                               │
├────────────────────────────────────────────────────────────────┤
│  • Valor: "1|abc123xyz..."                                    │
│  • Se genera en: Sistema Centralizado (puerto 8001)           │
│  • Se guarda en: sistema_autenticacion.personal_access_tokens│
│  • Se usa para: Validar identidad y obtener módulos           │
│  • Expiración: 24 horas                                       │
│  • Validación: Laravel Sanctum del sistema centralizado       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  TOKEN LOCAL DEL SISTEMA DE PETRÓLEO                          │
├────────────────────────────────────────────────────────────────┤
│  • Valor: "2|xyz789abc..."                                     │
│  • Se genera en: Sistema de Petróleo (puerto 8000)            │
│  • Se guarda en: m3h_gestion_petroleo.personal_access_tokens  │
│  • Se usa para: Todas las operaciones en petróleo             │
│  • Expiración: 24 horas                                       │
│  • Validación: Laravel Sanctum del sistema de petróleo        │
└────────────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** Cada sistema tiene su propio token. El token del centralizado se usa SOLO para autenticación inicial. Después, todo funciona con el token local.

---

## 🗺️ **MAPEO DE ROLES**

### **Sistema Centralizado → Sistema de Petróleo**

| rol_sistema_externo<br>(Centralizado) | id_rol<br>(Petróleo) | Nombre del Rol |
|---------------------------------------|----------------------|----------------|
| `bombero` | 1 | Encargado de Operaciones de Combustible |
| `gerente` | 2 | Gerente |
| `admin` | 3 | Administrador |
| `toneladas` | 4 | Dispatch |
| `planificador` | 5 | Planificador / Taller Mecánico |
| `OperadorVehiculo` ⚠️ | 6 | Operador de Vehículo |
| `asistente_bombero` | 7 | Asistente de Operaciones |
| `admin_operador` | 8 | Administrador de Operadores |
| `JefeMina` ⚠️ | 9 | Jefe de Mina |

**⚠️ IMPORTANTE:** `OperadorVehiculo` y `JefeMina` son **case sensitive** (respetan mayúsculas/minúsculas).

**Código de mapeo:**
```php
// En AuthController::obtenerIdRolLocal() línea 695
private function obtenerIdRolLocal($rolExterno)
{
    $mapeo = [
        'admin' => 3,
        'bombero' => 1,
        'gerente' => 2,
        'toneladas' => 4,
        'planificador' => 5,
        'OperadorVehiculo' => 6,
        'asistente_bombero' => 7,
        'admin_operador' => 8,
        'JefeMina' => 9,
    ];

    return $mapeo[$rolExterno] ?? null;
}
```

---

## ✅ **¿POR QUÉ ESTA ARQUITECTURA ES PROFESIONAL?**

### **1. Es el estándar de la industria**

Esta arquitectura se llama **"Identity Provider + Applications"** y es usada por:

- Microsoft Active Directory → Office 365
- Okta/Auth0 → Aplicaciones empresariales
- Google Workspace → Apps integradas
- AWS Cognito → Aplicaciones web
- Keycloak → Microservicios

### **2. Cumple con las mejores prácticas**

| Principio | ¿Se cumple? |
|-----------|-------------|
| **Single Source of Truth** | ✅ Sistema Centralizado |
| **Separation of Concerns** | ✅ Cada app es independiente |
| **Centralized Authentication** | ✅ Login centralizado |
| **Role-Based Access Control** | ✅ Roles por módulo |
| **Auditable** | ✅ Logs en ambos sistemas |
| **Resiliente** | ✅ Si el centralizado falla, petróleo sigue funcionando |

### **3. Ventajas específicas para tu caso**

| Ventaja | Beneficio |
|---------|-----------|
| **Simplicidad** | Fácil de mantener y debuggear |
| **Performance** | No hay latencia cross-database |
| **Compatibilidad** | Funciona con Laravel Sanctum |
| **Relaciones intactas** | Todas las FK siguen funcionando |
| **Rollback fácil** | Sistema local sigue operativo |
| **Costo cero** | No requiere infraestructura adicional |

### **4. NO necesitas alternativas complejas**

❌ **NO necesitas:**
- Microservicios
- Kubernetes/Docker
- API Gateway
- Service Mesh
- Conexión cross-database en cada query

✅ **Porque:**
- Tienes ~100-500 usuarios máximo
- Es un sistema interno
- No es SaaS multitenancy
- El equipo es pequeño
- El presupuesto es limitado

---

## 📝 **REGLAS DE ORO**

### **¿Dónde se hacen las operaciones?**

| Operación | ¿Dónde? | Sistema |
|-----------|---------|---------|
| **Crear usuario nuevo** | ❌ NO en petróleo<br>✅ SÍ en panel admin | Sistema Centralizado |
| **Editar usuario** | ❌ NO en petróleo<br>✅ SÍ en panel admin | Sistema Centralizado |
| **Cambiar password** | ❌ NO en petróleo<br>✅ SÍ en panel admin | Sistema Centralizado |
| **Asignar roles** | ❌ NO en petróleo<br>✅ SÍ en panel admin | Sistema Centralizado |
| **Desactivar usuario** | ❌ NO en petróleo<br>✅ SÍ en panel admin | Sistema Centralizado |
| **Login** | ✅ Sistema Centralizado | http://localhost:5174 |
| **Usar funciones de petróleo** | ✅ Sistema de Petróleo | http://localhost:3000 |

### **¿Qué tabla es la fuente de verdad?**

```
┌────────────────────────────────────────────────────────────┐
│  FUENTE DE VERDAD ⭐                                        │
├────────────────────────────────────────────────────────────┤
│  sistema_autenticacion.users                               │
│  sistema_autenticacion.usuario_roles                       │
└────────────────────────────────────────────────────────────┘
                      ↓ sincroniza
┌────────────────────────────────────────────────────────────┐
│  COPIA SINCRONIZADA 📋                                     │
├────────────────────────────────────────────────────────────┤
│  m3h_gestion_petroleo.users (copia automática)            │
└────────────────────────────────────────────────────────────┘
```

### **¿Cuándo se sincroniza?**

La sincronización es **automática** y ocurre:
- ✅ Cada vez que un usuario hace login
- ✅ Si el usuario no existe localmente, se crea
- ✅ Si el usuario ya existe, se actualiza su información
- ✅ El rol se actualiza según el rol seleccionado

---

## 🚀 **CONFIGURACIÓN REQUERIDA**

### **1. Variables de Entorno**

**Backend Sistema de Petróleo (`.env`):**
```env
SISTEMA_CENTRALIZADO_URL=http://localhost:8001
```

**Backend Sistema Centralizado (`.env`):**
```env
SANCTUM_EXPIRATION=1440  # 24 horas en minutos
```

### **2. Servidores en Ejecución**

```bash
# Terminal 1: Sistema Centralizado
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend
php artisan serve --port=8001

# Terminal 2: Sistema de Petróleo
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend
php artisan serve --port=8000

# Terminal 3: Frontend Centralizado
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\frontend
npm run dev  # Puerto 5174

# Terminal 4: Frontend Petróleo
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\frontend
npm run dev  # Puerto 3000
```

### **3. Base de Datos**

✅ **Ejecutar script de migración:**
```sql
-- Archivo: migracion_fase1_v3_final.sql
-- Ya ejecutado ✅
```

✅ **Verificar módulo de Petróleo:**
```sql
SELECT * FROM sistema_autenticacion.modulos WHERE id = 8;
-- Debe existir: id=8, nombre='Gestión de Petróleo'
```

✅ **Verificar usuarios migrados:**
```sql
-- Usuarios en sistema centralizado
SELECT COUNT(*) FROM sistema_autenticacion.users WHERE estado = 1;

-- Roles asignados
SELECT COUNT(*)
FROM sistema_autenticacion.usuario_roles
WHERE modulo_id = 8;
```

---

## 🔍 **VERIFICACIÓN DEL SISTEMA**

### **Checklist de Funcionamiento**

```
✅ Checklist de Verificación
────────────────────────────────────────

□ Sistema Centralizado corriendo (puerto 8001)
□ Sistema de Petróleo corriendo (puerto 8000)
□ Frontend Centralizado corriendo (puerto 5174)
□ Frontend Petróleo corriendo (puerto 3000)
□ Variable SISTEMA_CENTRALIZADO_URL configurada
□ Módulo de Petróleo existe (id=8)
□ Script de migración ejecutado
□ Usuarios migrados correctamente
□ Al hacer login, muestra módulos disponibles
□ Al seleccionar rol, redirige a petróleo
□ Token se valida correctamente
□ Usuario puede usar funciones de petróleo
```

### **Prueba Manual**

**Test 1: Login básico**
1. Ir a `http://localhost:5174`
2. Ingresar RUT y password
3. Verificar que aparecen los módulos
4. Click en "Gestión de Petróleo"
5. Verificar redirección con token

**Test 2: Múltiples roles**
1. Asignar 2 roles a un usuario desde panel admin
2. Hacer login con ese usuario
3. Verificar que aparece selector de rol
4. Seleccionar un rol
5. Verificar que se carga con el rol correcto

**Test 3: Funcionalidad de petróleo**
1. Después del login
2. Navegar a cualquier función (consumos, ingresos, etc.)
3. Verificar que funciona correctamente

---

## 🔄 **CAMBIO RÁPIDO DE ROL (SIN CERRAR SESIÓN)**

### **¿Cómo funciona?**

El sistema permite a usuarios con múltiples roles cambiar entre ellos sin cerrar sesión:

```
┌──────────────────────────────────────────────────────────────┐
│  Usuario: Juan Pérez (tiene 2 roles: Bombero + Gerente)    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Está navegando como "Gerente"                           │
│  2. Click en su perfil (header derecho)                     │
│  3. Ve dropdown con sección "Cambiar rol:"                  │
│     ┌────────────────────────────┐                          │
│     │ • Gerente (actual)         │                          │
│     │ ○ Bombero                  │ ← Click aquí             │
│     └────────────────────────────┘                          │
│  4. Sistema valida con centralizado que tiene ese rol       │
│  5. Actualiza id_rol en BD local                            │
│  6. Recarga la página automáticamente                       │
│  7. Ahora trabaja como "Bombero"                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### **APIs Implementadas (Sistema de Petróleo)**

#### **1. Obtener roles disponibles**

```http
GET /api/roles-disponibles
Authorization: Bearer {token_local}
```

**Response:**
```json
{
  "success": true,
  "roles_disponibles": ["bombero", "gerente"],
  "rol_actual": "gerente",
  "id_rol_actual": 2
}
```

#### **2. Cambiar rol activo**

```http
POST /api/cambiar-rol
Authorization: Bearer {token_local}
Content-Type: application/json

{
  "rol_nuevo": "bombero"
}
```

**Validación:**
1. Obtiene token actual del usuario
2. Consulta al sistema centralizado: `POST /api/validar-token`
3. Verifica que el usuario tiene ese rol en módulo_id=8
4. Si es válido, actualiza `users.id_rol` en BD local
5. Retorna datos actualizados del usuario

**Response:**
```json
{
  "success": true,
  "message": "Rol cambiado exitosamente",
  "user": {
    "id": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "bombero",
    "id_rol": 1
  }
}
```

### **Componente Frontend**

**Ubicación:** `frontend/src/components/molecules/UserProfileDropdown.jsx`

**Características:**
- ✅ Carga roles disponibles al abrir dropdown
- ✅ Muestra rol actual destacado
- ✅ Permite cambiar con un click
- ✅ Validación en tiempo real
- ✅ Loading states y error handling
- ✅ Recarga automática después del cambio

### **Seguridad**

1. **Validación doble:**
   - Backend de petróleo consulta al sistema centralizado
   - Solo permite cambiar a roles que realmente tiene asignados

2. **Sin manipulación del token:**
   - No se genera un nuevo token
   - Se mantiene el token de sesión actual
   - Solo se actualiza el `id_rol` en la BD local

3. **Auditoría:**
   - Cada cambio de rol queda registrado en logs
   - Se guarda timestamp y rol anterior/nuevo

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Token no proporcionado"**

**Causa:** Sistema centralizado no está corriendo o URL incorrecta.

**Solución:**
```bash
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend
php artisan serve --port=8001
```

Verificar `.env`:
```env
SISTEMA_CENTRALIZADO_URL=http://localhost:8001
```

---

### **Error: "Token inválido o sin acceso"**

**Causa:** El usuario no tiene acceso al módulo o el rol especificado.

**Solución:**
```sql
-- Verificar roles del usuario
SELECT * FROM sistema_autenticacion.usuario_roles
WHERE user_id = [ID_USUARIO]
  AND modulo_id = 8;

-- Si no tiene roles, asignar desde panel admin
```

---

### **Error: "Rol no soportado en este sistema"**

**Causa:** El rol no está mapeado en el sistema de petróleo.

**Solución:**
Verificar mapeo en `AuthController::obtenerIdRolLocal()` línea 695.

Roles válidos:
- `admin`, `bombero`, `gerente`, `toneladas`, `planificador`
- `OperadorVehiculo`, `asistente_bombero`, `admin_operador`, `JefeMina`

---

### **Error: "Illegal mix of collations"**

**Causa:** Las tablas tienen diferentes collations.

**Solución:**
Ya resuelto en `migracion_fase1_v3_final.sql` usando `BINARY` en comparaciones.

---

## 📚 **ARCHIVOS CLAVE**

### **Sistema de Petróleo**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `AuthController.php` | 477-689 | `loginWithCentralToken()` - Login centralizado |
| `AuthController.php` | 695-715 | `obtenerIdRolLocal()` - Mapeo de roles |
| `routes/api.php` | 56 | Ruta `/api/login-centralizado` |

### **Sistema Centralizado**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `AuthController.php` | 18-88 | `login()` - Login principal |
| `AuthController.php` | ~200-300 | `validarToken()` - Validación de tokens |
| `AuthController.php` | ~350-450 | `getModulosDisponibles()` - Obtener módulos |
| `routes/api.php` | 28 | Ruta `/api/auth/login` |
| `routes/api.php` | 32 | Ruta `/api/validar-token` |

### **Scripts SQL**

| Archivo | Descripción |
|---------|-------------|
| `migracion_fase1_v3_final.sql` | Script de migración completo ✅ |

---

## 🎯 **CONCLUSIÓN**

Tu sistema actual:

### ✅ **Es Profesional**
- Sigue patrones estándar de la industria
- Cumple con las mejores prácticas
- Es mantenible y escalable

### ✅ **Es Adecuado para tu Contexto**
- Sistema interno empresarial
- ~100-500 usuarios
- Equipo pequeño
- Presupuesto limitado

### ✅ **Funciona Correctamente**
- Login centralizado operativo
- Múltiples roles por usuario
- Sincronización automática
- Migración completada

### ✅ **NO necesitas cambiar nada**
- La arquitectura es sólida
- El rendimiento es adecuado
- La complejidad es manejable
- Los costos son óptimos

---

## 📞 **SOPORTE**

### **Logs para Debug**

**Backend Petróleo:**
```bash
tail -f C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend\storage\logs\laravel.log
```

**Backend Centralizado:**
```bash
tail -f C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend\storage\logs\laravel.log
```

### **Búsqueda de Logs Específicos**

```bash
# Buscar logs de login
grep "LOGIN" laravel.log

# Buscar errores
grep "ERROR" laravel.log

# Buscar validación de token
grep "validar-token" laravel.log
```

---

**Documento generado:** Diciembre 2025
**Versión:** 1.0
**Estado:** ✅ Completo y Verificado
