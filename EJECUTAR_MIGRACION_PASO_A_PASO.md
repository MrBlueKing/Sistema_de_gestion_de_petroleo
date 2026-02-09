# 🚀 Guía de Ejecución Paso a Paso - FASE 1 V2

## ✅ Pre-Requisitos

- [ ] MySQL corriendo
- [ ] Acceso a ambas bases de datos
- [ ] 30 minutos sin interrupciones

---

## PASO 1: Backup (OBLIGATORIO)

```bash
# Windows (CMD o PowerShell)
cd C:\xampp\mysql\bin

# Backup petróleo
mysqldump -u root -p m3h_gestion_petroleo > C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backup_petroleo_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql

# Backup centralizado
mysqldump -u root -p sistema_autenticacion_centralizado > C:\xampp\htdocs\Sistema_de_gestion_de_petroleo\backup_centralizado_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

---

## PASO 2: Abrir MySQL

```bash
mysql -u root -p
```

---

## PASO 3: Ejecutar Sección 0-1 (Análisis)

```sql
SOURCE C:/xampp/htdocs/Sistema_de_gestion_de_petroleo/migracion_completa_fase1_v2.sql
```

**⏸️ PAUSA AQUÍ**

Verás:
- Total usuarios activos
- Usuarios duplicados por nombre
- Distribución de roles

**Verificar:**
- ✅ ¿Se detectaron los 5 duplicados? (Alexandra, Carlos A., Carlos M., Christian, Sergio)

---

## PASO 4: Ejecutar Sección 2 (Crear Plan)

El script ya está cargado, solo continuar.

**⏸️ PAUSA AQUÍ**

Verás la tabla "PLAN DE CONSOLIDACIÓN" con:
- Qué usuario se mantiene
- Qué usuario se elimina
- Roles de cada uno
- Impacto (ingresos, faenas, cargas)

**Verificar:**
- ✅ Christian: ¿Mantiene ID 31 (172105599) y elimina ID 37 (OPE1721)?
- ✅ Alexandra: ¿Mantiene ID 22 (TMC2568 con email)?
- ✅ ¿Los usuarios con email se mantienen?
- ✅ ¿Los RUT numéricos se priorizan sobre códigos?

**SI ALGO ESTÁ MAL:** Escribe `exit;` y avísame.

**SI TODO ESTÁ BIEN:** Continuar.

---

## PASO 5: Ejecutar Sección 3 (Actualizar Relaciones)

El script continúa automáticamente.

**⏸️ PAUSA AQUÍ**

Verás:
- ✓ X registros actualizados en ingresos_petroleo
- ✓ X registros actualizados en asignaciones_user_maquinas
- ✓ X registros actualizados en cargas_externas
- ✓ X registros actualizados en user_faena
- ✓ X tokens actualizados

**Verificar:**
- ✅ ¿Los números tienen sentido?
- ✅ ¿No hay errores?

---

## PASO 6: Ejecutar Sección 4 (Eliminar Duplicados)

**⚠️ ESTO ES IRREVERSIBLE**

El script continúa.

Verás:
- ✓ Verificación de ingresos OK
- ✓ X usuarios duplicados eliminados
- ✅ ÉXITO: No quedan usuarios duplicados

**Verificar:**
- ✅ ¿Dice "No quedan usuarios duplicados"?

---

## PASO 7: Ejecutar Sección 5 (Preparar Centralizado)

**IMPORTANTE:** Si el módulo NO existe, el script te mostrará código para crearlo.

Verás:
- Módulo de Petróleo (si existe)
- Roles del módulo (si existen)

**Si módulo NO existe:**
```sql
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
SET @modulo_petroleo_id = LAST_INSERT_ID();
```

**Si roles NO existen:**
```sql
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
```

---

## PASO 8: Ejecutar Sección 6 (Migrar Usuarios)

El script continúa.

Verás:
- Lista de usuarios a migrar
- ✓ X usuarios migrados

**Verificar:**
- ✅ ¿Todos los usuarios de petróleo fueron migrados?

---

## PASO 9: Ejecutar Sección 7 (Asignar Múltiples Roles) ⭐

**¡ESTE ES EL PASO MÁS IMPORTANTE!**

El script continúa.

Verás:
- Vista previa de roles que se asignarán
- ✓ X roles asignados

---

## PASO 10: Verificaciones Finales

El script continúa hasta el final.

Verás:
- ¿QUEDAN DUPLICADOS EN PETRÓLEO? (debe ser 0)
- TOTAL USUARIOS EN CENTRALIZADO
- USUARIOS CON ACCESO A PETRÓLEO
- ⭐ USUARIOS CON MÚLTIPLES ROLES

**Verificar especialmente:**
```
Christian Luciano Saavedra Perez | gerente, operador_vehiculo | 2 roles ✅
```

---

## ✅ Migración Completada

Si todo salió bien, verás:

```
✅ MIGRACIÓN COMPLETADA

CASOS CONSOLIDADOS:
- Alexandra: TMC2568 + RUT → Una cuenta con 2 roles
- Carlos Andrés: RUT + Gerente15520 → Una cuenta con 2 roles
- Carlos Miguel: RUT + TMC10168 → Una cuenta con 2 roles
- Christian: RUT + OPE1721 → Una cuenta con 2 roles
- Sergio: RUT + SAGER1506 → Una cuenta con 2 roles
```

---

## 🐛 Si Algo Sale Mal

### Restaurar Backup

```bash
# Salir de MySQL
exit;

# Restaurar petróleo
mysql -u root -p m3h_gestion_petroleo < backup_petroleo_YYYYMMDD.sql

# Restaurar centralizado
mysql -u root -p sistema_autenticacion_centralizado < backup_centralizado_YYYYMMDD.sql
```

### Verificar Qué Pasó

```sql
-- Ver usuarios actuales
SELECT * FROM m3h_gestion_petroleo.users ORDER BY id;

-- Ver tabla temporal (si existe)
SELECT * FROM m3h_gestion_petroleo.temp_consolidacion_usuarios;
```

---

## 📞 Ayuda

Si en cualquier paso algo se ve raro, **DETENTE** y avísame antes de continuar.
