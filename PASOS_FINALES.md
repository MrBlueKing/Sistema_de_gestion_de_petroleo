# ✅ Frontend Implementado - Pasos Finales

## 🎉 Lo que ya está hecho:

### Backend ✅
- Endpoint `/api/login-centralizado` creado
- Validación con sistema centralizado
- Creación automática de usuarios
- Mapeo de roles

### Frontend ✅
- Servicio `authCentralizado.js` creado
- Componente `LoginCentralizado.jsx` creado
- Ruta `/auth/centralizado` agregada
- Detección automática de token en HomePage
- Botón opcional en LoginScreen

---

## 📋 Pasos Finales para Completar la Integración

### PASO 1: Registrar el Módulo en Base de Datos (5 min)

Ejecuta el script SQL en el sistema centralizado:

```bash
# Abrir MySQL
mysql -u root -p

# Seleccionar base de datos
USE sistema_autenticacion;

# Ejecutar script
SOURCE C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\registrar_modulo_petroleo.sql;
```

O ejecuta el archivo directamente:

```bash
mysql -u root sistema_autenticacion < C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\registrar_modulo_petroleo.sql
```

**Verificar que se creó:**

```sql
SELECT * FROM modulos WHERE nombre = 'Gestión de Petróleo';
-- Deberías ver: id=1, nombre='Gestión de Petróleo', url='http://localhost:3000'
```

---

### PASO 2: Asignar Usuarios al Módulo (5 min)

**Ver usuarios disponibles:**

```sql
SELECT id, rut, nombre, apellido, email FROM users;
```

**Asignar un usuario al módulo de petróleo:**

```sql
-- Reemplaza USER_ID con el ID del usuario que quieres asignar
-- Ejemplo: si el usuario tiene id=1

INSERT INTO usuario_roles (user_id, rol_id, modulo_id, created_at, updated_at)
VALUES (
    1, -- ID del usuario (CAMBIAR)
    (SELECT id FROM roles WHERE nombre = 'administrador' AND modulo_id = 1),
    1, -- ID del módulo de petróleo
    NOW(),
    NOW()
);
```

**Verificar asignación:**

```sql
SELECT
    u.rut,
    u.nombre,
    u.apellido,
    r.nombre as rol,
    m.nombre as modulo
FROM users u
JOIN usuario_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.rol_id = r.id
JOIN modulos m ON ur.modulo_id = m.id
WHERE m.id = 1;
```

---

### PASO 3: Configurar Sistema Centralizado (10 min)

#### 3.1 Actualizar URL del módulo (si es necesario)

Si tu sistema de petróleo no está en `localhost:3000`, actualiza:

```sql
UPDATE modulos
SET url = 'http://TU_URL_AQUI'
WHERE id = 1;
```

#### 3.2 Modificar Dashboard para mostrar módulos

**Archivo:** `Sistema_de_autenticacion_centralizado/frontend/src/pages/Dashboard.jsx`

Agregar código para mostrar módulos y permitir selección:

```jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [modulos, setModulos] = useState([]);

  useEffect(() => {
    cargarModulos();
  }, []);

  const cargarModulos = async () => {
    try {
      const response = await api.get('/api/modulos');
      setModulos(response.data.modulos);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
    }
  };

  const irAModulo = (modulo) => {
    const token = localStorage.getItem('auth_token');
    const url = `${modulo.url}?token=${token}&modulo_id=${modulo.id}`;

    console.log('🚀 Abriendo módulo:', modulo.nombre);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Mis Módulos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulos.map(modulo => (
          <div
            key={modulo.id}
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => irAModulo(modulo)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">
                {modulo.nombre === 'Gestión de Petróleo' && '🛢️'}
                {modulo.nombre === 'Producción' && '⚙️'}
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {modulo.roles[0]}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">{modulo.nombre}</h3>
            <p className="text-gray-600 text-sm mb-4">{modulo.descripcion}</p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{modulo.permisos.length} permisos</span>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Entrar →
              </button>
            </div>
          </div>
        ))}
      </div>

      {modulos.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <p>No tienes módulos asignados</p>
          <p className="text-sm mt-2">Contacta al administrador</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

---

### PASO 4: Testing Completo (20 min)

#### Test 1: Verificar Backend

```bash
# Terminal 1 - Backend Sistema Centralizado
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\backend
php artisan serve --port=8001

# Terminal 2 - Backend Sistema Petróleo
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend
php artisan serve --port=8000
```

**Probar endpoint manualmente:**

```bash
# 1. Login en sistema centralizado
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"rut\":\"12345678-9\",\"password\":\"tu_password\"}"

# Copiar el token de la respuesta

# 2. Probar validación
curl -X POST http://localhost:8000/api/login-centralizado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "{\"modulo_id\":1}"
```

#### Test 2: Verificar Frontend

```bash
# Terminal 3 - Frontend Sistema Centralizado
cd C:\xampp\htdocs\Sistema_de_autenticacion_centralizado\frontend
npm run dev

# Terminal 4 - Frontend Sistema Petróleo
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\frontend
npm run dev
```

**Flujo de prueba:**

1. ✅ Abrir `http://localhost:5173` (Sistema Centralizado)
2. ✅ Login con usuario asignado al módulo
3. ✅ Verificar que aparezca "Gestión de Petróleo" en módulos
4. ✅ Hacer clic en el módulo
5. ✅ Debe abrir `http://localhost:3000` con loading
6. ✅ Debe redirigir automáticamente al dashboard correspondiente

#### Test 3: Verificar Login Normal

1. ✅ Ir directo a `http://localhost:3000/login`
2. ✅ Login con RUT + Password normal
3. ✅ Debe funcionar igual que antes

---

### PASO 5: Configurar Variables de Entorno

#### Sistema Petróleo - Frontend

**Archivo:** `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
VITE_SISTEMA_CENTRALIZADO_URL=http://localhost:8001
```

#### Sistema Centralizado - Frontend

**Archivo:** `frontend/.env`

```env
VITE_API_URL=http://localhost:8001
VITE_MODULO_PETROLEO_URL=http://localhost:3000
VITE_MODULO_PRODUCCION_URL=http://localhost:8002
```

---

## 🐛 Troubleshooting

### Problema 1: "Token no proporcionado"

**Causa:** El token no se está enviando correctamente

**Solución:**
```javascript
// Verificar en consola del navegador
console.log(new URLSearchParams(window.location.search).get('token'));
```

### Problema 2: "Token inválido o sin acceso"

**Causa:** Usuario no tiene acceso al módulo

**Solución:**
```sql
-- Verificar asignación
SELECT * FROM usuario_roles WHERE user_id = X AND modulo_id = 1;

-- Si no existe, agregar
INSERT INTO usuario_roles (user_id, rol_id, modulo_id, created_at, updated_at)
VALUES (X, Y, 1, NOW(), NOW());
```

### Problema 3: "Usuario no existe localmente"

**Esto es NORMAL.** El sistema lo crea automáticamente.

**Verificar creación:**
```sql
-- En base de datos sistema_petroleo
SELECT * FROM users WHERE rut = '12345678-9';
```

### Problema 4: CORS Error

**Agregar en backend de petróleo:**

```php
// backend/config/cors.php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:3000', 'http://localhost:5173'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

---

## 📝 Checklist Final

- [ ] Script SQL ejecutado en `sistema_autenticacion`
- [ ] Módulo "Gestión de Petróleo" registrado (id=1)
- [ ] Al menos 1 usuario asignado al módulo
- [ ] Backend Sistema Centralizado corriendo (puerto 8001)
- [ ] Backend Sistema Petróleo corriendo (puerto 8000)
- [ ] Frontend Sistema Centralizado corriendo (puerto 5173)
- [ ] Frontend Sistema Petróleo corriendo (puerto 3000)
- [ ] Variables de entorno configuradas
- [ ] Login normal probado y funcionando ✅
- [ ] Login centralizado probado y funcionando ✅
- [ ] Logs del backend verificados

---

## 🎉 Resultado Final

Una vez completado, tendrás:

```
🔐 Sistema Centralizado (localhost:5173)
    │
    ├── Login una sola vez
    │
    ├── Ver módulos disponibles:
    │   ├── 🛢️ Gestión de Petróleo (administrador)
    │   └── ⚙️ Producción (gerente)
    │
    └── Clic en módulo → Redirección automática


🛢️ Sistema Petróleo (localhost:3000)
    │
    ├── Login Normal (RUT + Password) ← Sigue funcionando
    │
    └── Login Centralizado (Token) ← Nuevo método
        │
        └── Auto-login sin password
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras errores:

1. **Revisar logs backend:**
```bash
tail -f backend/storage/logs/laravel.log
```

2. **Revisar consola del navegador (F12)**

3. **Verificar que todos los servicios estén corriendo**

4. **Confirmar que el usuario tiene acceso al módulo**

---

**¡Listo!** Ahora puedes probar la integración completa.

¿Algún paso no te queda claro?
