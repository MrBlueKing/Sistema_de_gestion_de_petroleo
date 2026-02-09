# 🚪 CONFIGURACIÓN DE PUERTOS - SISTEMA 3H COOPER

> Última actualización: 2025-12-09
> Este documento detalla todos los puertos utilizados por los 3 sistemas principales

---

## 📋 RESUMEN RÁPIDO

| Sistema | Frontend | Backend | Base de Datos | Estado |
|---------|----------|---------|---------------|--------|
| **Petróleo** | 5173 | 8000 | 3306 (m3h_gestion_petroleo) | ✅ Activo |
| **Centralizado** | 5174 | 8001 | 3306 (m3h_autenticacion_centralizada) | ✅ Activo |
| **Producción/Bodega** | 5175 | 8002 | 3306 (mhcl_sistemabodega) | ⚠️ Por configurar |

---

## 🛢️ 1. SISTEMA DE GESTIÓN DE PETRÓLEO

### Frontend (React + Vite)
- **Puerto:** `5173`
- **URL Local:** http://localhost:5173
- **Configuración:** `frontend/vite.config.js`
- **Comando:** `npm run dev`

### Backend (Laravel)
- **Puerto:** `8000`
- **URL Local:** http://localhost:8000
- **Configuración:** `backend/.env`
  ```env
  APP_URL=http://localhost:8000
  ```
- **Comando:** `php artisan serve`

### Base de Datos (MySQL)
- **Puerto:** `3306`
- **Base de datos:** `m3h_gestion_petroleo`
- **Configuración en .env:**
  ```env
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=m3h_gestion_petroleo
  DB_USERNAME=root
  DB_PASSWORD=
  ```

### Conexión con Sistema Centralizado
- **URL Backend Centralizado:** http://localhost:8001 (definido en `backend/.env`)
  ```env
  SISTEMA_CENTRALIZADO_URL=http://localhost:8001
  ```
- **URL Frontend Centralizado:** http://localhost:5174 (definido en `frontend/.env`)
  ```env
  VITE_SISTEMA_CENTRALIZADO_URL=http://localhost:5174
  ```

---

## 🔐 2. SISTEMA DE AUTENTICACIÓN CENTRALIZADO

### Frontend (React + Vite)
- **Puerto:** `5174`
- **URL Local:** http://localhost:5174
- **Configuración:** Archivo `vite.config.js` en el proyecto centralizado
- **Comando:** `npm run dev -- --port 5174`

### Backend (Laravel)
- **Puerto:** `8001`
- **URL Local:** http://localhost:8001
- **Configuración:** Archivo `.env` del proyecto centralizado
  ```env
  APP_URL=http://localhost:8001
  ```
- **Comando:** `php artisan serve --port=8001`

### Base de Datos (MySQL)
- **Puerto:** `3306` (compartido con otros sistemas)
- **Base de datos:** `m3h_autenticacion_centralizada`
- **Configuración esperada:**
  ```env
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=m3h_autenticacion_centralizada
  DB_USERNAME=root
  DB_PASSWORD=
  ```

---

## 🏭 3. SISTEMA DE PRODUCCIÓN/BODEGA

### Frontend (React + Vite)
- **Puerto Recomendado:** `5175`
- **URL Local:** http://localhost:5175
- **Comando:** `npm run dev -- --port 5175`

### Backend (Laravel o FastAPI)
- **Puerto Laravel:** `8002` (si usa Laravel)
- **Puerto FastAPI:** `8001` (⚠️ CONFLICTO con Sistema Centralizado)
- **URL Local:** http://localhost:8002
- **Comando Laravel:** `php artisan serve --port=8002`
- **Comando FastAPI:** `uvicorn main:app --port 8003` (cambiar puerto para evitar conflicto)

### Base de Datos (MySQL)
- **Puerto:** `3306` (compartido)
- **Base de datos:** `mhcl_sistemabodega`
- **Configuración actual en Petróleo:**
  ```env
  DB_BODEGA_HOST=127.0.0.1
  DB_BODEGA_PORT=3306
  DB_BODEGA_DATABASE=mhcl_sistemabodega
  DB_BODEGA_USERNAME=root
  DB_BODEGA_PASSWORD=
  ```

---

## ⚠️ CONFLICTOS DETECTADOS

### 1. FastAPI vs Sistema Centralizado
- **Problema:** Ambos intentan usar el puerto `8001`
  - Sistema Centralizado Backend: `8001`
  - FastAPI (Producción): `8001`

- **Solución:** Cambiar FastAPI a otro puerto
  ```bash
  # En el proyecto FastAPI, cambiar a puerto 8003
  uvicorn main:app --port 8003 --reload
  ```

- **Actualizar en Petróleo `.env`:**
  ```env
  FASTAPI_URL=http://127.0.0.1:8003
  ```

---

## 🚀 CÓMO CORRER LOS 3 SISTEMAS SIMULTÁNEAMENTE

### 1️⃣ Iniciar Base de Datos
```bash
# Asegúrate de que XAMPP esté corriendo
# MySQL debe estar en puerto 3306
```

### 2️⃣ Sistema de Petróleo

**Terminal 1 - Backend:**
```bash
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backend
php artisan serve
# Puerto: 8000
```

**Terminal 2 - Frontend:**
```bash
cd C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\frontend
npm run dev
# Puerto: 5173
```

### 3️⃣ Sistema Centralizado

**Terminal 3 - Backend:**
```bash
cd C:\xampp\htdocs\Sistema_Autenticacion_Centralizado\backend
php artisan serve --port=8001
# Puerto: 8001
```

**Terminal 4 - Frontend:**
```bash
cd C:\xampp\htdocs\Sistema_Autenticacion_Centralizado\frontend
npm run dev -- --port 5174
# Puerto: 5174
```

### 4️⃣ Sistema de Producción/Bodega

**Terminal 5 - Backend (si usa Laravel):**
```bash
cd C:\xampp\htdocs\Sistema_Produccion\backend
php artisan serve --port=8002
# Puerto: 8002
```

**Terminal 5 - Backend (si usa FastAPI):**
```bash
cd C:\xampp\htdocs\Sistema_Produccion\backend
uvicorn main:app --port 8003 --reload
# Puerto: 8003 (cambiado para evitar conflicto)
```

**Terminal 6 - Frontend:**
```bash
cd C:\xampp\htdocs\Sistema_Produccion\frontend
npm run dev -- --port 5175
# Puerto: 5175
```

---

## 📊 DIAGRAMA DE PUERTOS

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCALHOST                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MySQL (XAMPP)                                               │
│  └─ Puerto 3306                                              │
│     ├─ m3h_gestion_petroleo                                  │
│     ├─ m3h_autenticacion_centralizada                        │
│     └─ mhcl_sistemabodega                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SISTEMA DE PETRÓLEO                                 │   │
│  │  Frontend: http://localhost:5173                     │   │
│  │  Backend:  http://localhost:8000                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕ API                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SISTEMA CENTRALIZADO                                │   │
│  │  Frontend: http://localhost:5174                     │   │
│  │  Backend:  http://localhost:8001                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕ API                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SISTEMA DE PRODUCCIÓN                               │   │
│  │  Frontend: http://localhost:5175                     │   │
│  │  Backend:  http://localhost:8002 (Laravel)           │   │
│  │         o  http://localhost:8003 (FastAPI)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 CONFIGURACIÓN ADICIONAL NECESARIA

### Sistema Centralizado - Configurar Puerto Frontend

Si el `vite.config.js` del sistema centralizado no tiene puerto definido, agregarlo:

```javascript
// vite.config.js del Sistema Centralizado
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5174,
    host: true,
  },
  plugins: [react()],
})
```

### Sistema de Producción - Configurar Puerto Frontend

```javascript
// vite.config.js del Sistema de Producción
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5175,
    host: true,
  },
  plugins: [react()],
})
```

### FastAPI - Cambiar Puerto

Si usas FastAPI en el sistema de producción, crea un archivo `run.sh` o `run.bat`:

```bash
# run.bat
uvicorn main:app --port 8003 --reload
```

Y actualiza cualquier referencia al puerto en los archivos `.env`:

```env
# En el sistema que consume FastAPI
FASTAPI_URL=http://127.0.0.1:8003
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "Port already in use" (Puerto ya en uso)

**Error:** `Error: listen EADDRINUSE: address already in use :::5173`

**Soluciones:**

1. **Verificar qué está usando el puerto:**
   ```bash
   # Windows
   netstat -ano | findstr :5173

   # Matar proceso
   taskkill /PID [número_de_proceso] /F
   ```

2. **Usar otro puerto manualmente:**
   ```bash
   npm run dev -- --port 5180
   ```

### Laravel "Address already in use"

**Error:** `Failed to listen on 127.0.0.1:8000`

**Solución:**
```bash
# Especificar otro puerto
php artisan serve --port=8005
```

### Verificar todos los puertos ocupados

```bash
# Windows - Ver todos los puertos en uso
netstat -ano | findstr "5173 5174 5175 8000 8001 8002 8003 3306"
```

---

## 📝 CHECKLIST PRE-INICIO

Antes de correr los 3 sistemas, verificar:

- [ ] XAMPP MySQL corriendo en puerto 3306
- [ ] Bases de datos creadas:
  - [ ] `m3h_gestion_petroleo`
  - [ ] `m3h_autenticacion_centralizada`
  - [ ] `mhcl_sistemabodega`
- [ ] Puertos libres:
  - [ ] 5173, 5174, 5175 (Frontends)
  - [ ] 8000, 8001, 8002/8003 (Backends)
- [ ] Archivos `.env` configurados correctamente
- [ ] Dependencias instaladas (`npm install`, `composer install`)

---

## 🌐 PRODUCCIÓN

En producción, los puertos serán diferentes:

```env
# Sistema de Petróleo
VITE_API_URL=https://api.m3h.cl

# Sistema Centralizado
SISTEMA_CENTRALIZADO_URL=https://auth.m3h.cl

# Todos en puerto 443 (HTTPS)
```

---

## 📞 CONTACTO

Si tienes problemas con la configuración de puertos, contacta al equipo de desarrollo.

---

**Fin del documento**
