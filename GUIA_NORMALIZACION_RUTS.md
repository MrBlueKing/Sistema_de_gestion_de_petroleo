# 🧹 Guía de Normalización de RUTs

## ⚠️ Problema Encontrado

Al intentar normalizar los RUTs, se detectaron **RUTs duplicados ocultos** por diferentes formatos:

```
Ejemplo:
- "12.816.236-4"  ← Formato 1
- "12816236-4"    ← Formato 2

Al normalizar, ambos se convierten en: "128162364"
→ MySQL detecta duplicado ❌
```

## 📋 Solución en 3 Pasos

He creado 3 scripts que deben ejecutarse en orden:

### **PASO 1: Detectar Duplicados** 🔍
**Archivo**: `paso1_detectar_duplicados.sql`

**¿Qué hace?**
- Encuentra todos los RUTs que se duplicarían al normalizar
- Muestra los registros duplicados con detalles
- Genera un resumen de cuántos duplicados hay

**Resultado esperado**:
- Tabla con RUTs duplicados
- Información de quién es cada registro
- Fecha de creación de cada uno

**Acción**: ⚠️ **REVISAR** los resultados antes de continuar

---

### **PASO 2: Eliminar Duplicados** 🗑️
**Archivo**: `paso2_eliminar_duplicados.sql`

**¿Qué hace?**
- Elimina registros duplicados
- **Conserva el registro más antiguo** (menor ID)
- Verifica que no queden duplicados

**Criterio de eliminación**:
- Si hay 2 registros con el mismo RUT normalizado
- Se mantiene el que tiene **menor ID** (más antiguo)
- Se elimina el más reciente

**⚠️ IMPORTANTE**: Este script **ELIMINA** registros. Asegúrate de tener backup.

---

### **PASO 3: Normalizar RUTs** ✅
**Archivo**: `paso3_normalizar_ruts_final.sql`

**¿Qué hace?**
- Normaliza todos los RUTs (elimina `.`, `-`, espacios)
- Actualiza 5 tablas:
  - `solicitantes`
  - `personal_interno`
  - `personal_externo`
  - `empresas_externas`
  - `consumos` (campo `id_dotacion`)
- Verifica que todo funcionó correctamente

---

## 🚀 Instrucciones de Ejecución

### 1️⃣ Hacer BACKUP
```bash
mysqldump -u root -p m3h_gestion_petroleo > backup_antes_normalizacion.sql
```

### 2️⃣ Ejecutar Paso 1
```sql
-- En phpMyAdmin o MySQL Workbench
-- Abrir: paso1_detectar_duplicados.sql
-- Ejecutar y REVISAR los resultados
```

**Salida esperada**:
```
📋 SOLICITANTES - Duplicados encontrados:
rut_normalizado | cantidad | formatos_originales     | ids_duplicados
128162364       | 2        | 12.816.236-4 | 12816236-4 | 45, 78
```

### 3️⃣ Ejecutar Paso 2
```sql
-- Abrir: paso2_eliminar_duplicados.sql
-- Ejecutar para eliminar duplicados
```

**Salida esperada**:
```
✅ Registros eliminados: 5
✅ Duplicados restantes: 0
```

### 4️⃣ Ejecutar Paso 3
```sql
-- Abrir: paso3_normalizar_ruts_final.sql
-- Ejecutar para normalizar
```

**Salida esperada**:
```
✅ Solicitantes actualizados: 120 registros
✅ Personal interno actualizado: 85 registros
✅ Todos los RUTs normalizados
```

---

## 📊 ¿Qué se va a eliminar?

Los scripts eliminan **solo los registros duplicados más recientes**:

- ✅ Se **mantiene**: El registro más antiguo (menor ID)
- ❌ Se **elimina**: Los registros más recientes con el mismo RUT

### Ejemplo:

**Antes:**
```
id | rut           | nombre        | created_at
45 | 12.816.236-4  | Juan Pérez    | 2024-01-10  ← SE MANTIENE
78 | 12816236-4    | Juan Pérez    | 2024-03-15  ← SE ELIMINA
```

**Después:**
```
id | rut        | nombre        | created_at
45 | 128162364  | Juan Pérez    | 2024-01-10  ← Normalizado
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué hay duplicados?
Porque el sistema no validaba RUTs normalizados. Alguien pudo registrarse con `12.345.678-9` y luego con `12345678-9`, y el sistema los veía como diferentes.

### ¿Puedo elegir manualmente qué registro mantener?
Sí, pero tendrías que modificar el script. Por defecto mantiene el más antiguo (menor ID).

### ¿Se perderán datos importantes?
Potencialmente sí. Por eso es **crítico** revisar el PASO 1 antes de ejecutar el PASO 2.

### ¿Qué pasa con los consumos asociados?
Los consumos están en la tabla `consumos` con el campo `id_dotacion`. Ese campo también se normaliza, pero no se eliminan registros de consumos.

### ¿Puedo revertir los cambios?
Sí, si hiciste el backup. Puedes restaurarlo:
```bash
mysql -u root -p m3h_gestion_petroleo < backup_antes_normalizacion.sql
```

---

## ✅ Checklist de Seguridad

Antes de ejecutar, verifica:

- [ ] ✅ Hice backup de la base de datos
- [ ] ✅ Ejecuté PASO 1 y revisé los duplicados
- [ ] ✅ Confirmé que está bien eliminar los registros duplicados
- [ ] ✅ Tengo acceso para restaurar el backup si algo sale mal
- [ ] ✅ Estoy en entorno de desarrollo (NO producción)

---

## 🎯 Resultado Final

Después de ejecutar los 3 pasos:

**Formato almacenado en BD**:
```
123456789  (sin puntos ni guiones)
98765432K
```

**Formato mostrado al usuario** (mediante frontend):
```
12.345.678-9
9.876.543-2K
```

**Beneficios**:
- ✅ Búsquedas consistentes
- ✅ No más duplicados ocultos
- ✅ Comparaciones confiables
- ✅ Mejor performance
- ✅ Código más simple

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de MySQL
2. Verifica que ejecutaste los pasos en orden
3. Restaura el backup si es necesario
4. Contacta al equipo de desarrollo

---

**Última actualización**: 2025-12-05
**Versión**: 1.0
