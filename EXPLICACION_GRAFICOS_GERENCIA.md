# Guía de Interpretación de Gráficos — Dashboard de Consumo de Combustible
**Sistema de Gestión de Combustible — Minera 3H**
*Documento para presentación a Gerencia*

---

## Introducción

El Dashboard de Consumo presenta tres vistas complementarias del mismo dato: el combustible consumido. Cada vista responde una pregunta distinta y tiene un propósito específico para la toma de decisiones.

---

## Vista 1 — "Consumo por Categoría de Máquinas"

### ¿Qué muestra?
El consumo **real y directo** de combustible por tipo de maquinaria, tal como fue registrado físicamente en el estanque de la faena.

### ¿Cómo se calcula?
Es la suma directa de litros despachados a cada tipo de máquina, sin ningún tipo de ajuste ni redistribución.

```
Consumo por categoría = Suma de litros despachados a ese tipo de máquina
                        en el período y faena seleccionados
```

### Ejemplo — Catemu, Enero 2026

| Categoría          | Litros despachados |
|--------------------|-------------------|
| Grupo Electrogeno  | X litros           |
| Camionetas         | 5,250 litros       |
| Camion Tolva       | 1,509 litros       |
| Excavadora         | X litros           |
| Compresor De Aire  | X litros           |
| ...                | ...                |

> **Interpretación:** Cada barra o segmento representa exactamente lo que salió del
> estanque de Catemu hacia ese tipo de máquina durante el mes de enero.

### ¿Para qué sirve?
- Control operativo diario
- Verificar qué tipos de máquina consumen más combustible
- Detectar consumos anómalos por categoría
- Base para mantenimiento preventivo

---

## Vista 2 — "Consumo Total Ajustado" vs "Consumo Operacional"

Este gráfico introduce el concepto de **redistribución**, que permite una visión más justa del costo de combustible por faena.

---

### Concepto clave: ¿Por qué redistribuir?

Algunas máquinas **no trabajan exclusivamente para una sola faena**:

- Una **camioneta** que carga combustible en Cabildo también hace traslados hacia Catemu, La Cruz u otras faenas.
- Un **Camion Tolva** que carga en Tiltil puede estar transportando mineral para beneficio de múltiples operaciones.

Si se registra el 100% del combustible de esa camioneta en Cabildo, se estaría **sobredimensionando el costo de Cabildo** y **subdimensionando el de las otras faenas**.

La redistribución corrige esto.

---

### Regla de redistribución de Camionetas

```
Del total consumido por camionetas en una faena:
  ├── 50% → Se atribuye a esa faena (uso directo y local)
  └── 50% → Se distribuye entre TODAS las demás faenas
             según su porcentaje de participación asignado
```

> **Nota técnica:** El factor del 50% es una decisión de negocio definida en el sistema.
> No proviene de ninguna tabla de la base de datos — está fijo en el código.
> Si en el futuro se requiere un factor distinto (ej: 60/40 o 70/30), debe
> modificarse directamente en el sistema por el equipo de desarrollo.

**Porcentajes de participación por faena:**

| Faena       | % Participación |
|-------------|----------------|
| Cabildo     | 30%            |
| Tiltil      | 20%            |
| Rungue      | 20%            |
| Catemu      | 15%            |
| La Cruz     | 15%            |
| Chincolco   | 0%             |
| Laboratorio | 0%             |

---

### Ejemplo detallado — Camionetas para Cabildo y Catemu (Febrero 2026, datos reales)

Consumo real de camionetas en febrero 2026 por faena:

| Faena | % Participación | Camionetas consumidas |
|---|---|---|
| Catemu | 15% | 1,934 L |
| La Cruz | 15% | 1,191.68 L |
| Cabildo | 30% | 876 L |
| Laboratorio | 0% | 295.16 L |
| Tiltil | 20% | 0 L |
| Rungue | 20% | 0 L |

#### Cálculo para CABILDO (30%)
```
Propio (50% se queda):        876 × 50% =   438.00 L

Recibe de Catemu:           967 × (30/85) =  341.29 L
Recibe de La Cruz:        595.84 × (30/85) =  210.30 L
Recibe de Laboratorio:    147.58 × (30/100) =  44.27 L
─────────────────────────────────────────────────────
Camionetas ajustadas Cabildo:               1,033.86 L
(vs 876 L crudo — diferencia: +157.86 L, +18%)
```

#### Cálculo para CATEMU (15%)
```
Propio (50% se queda):      1,934 × 50% =   967.00 L

Recibe de Cabildo:          438 × (15/70) =   93.86 L
Recibe de La Cruz:        595.84 × (15/85) =  105.15 L
Recibe de Laboratorio:    147.58 × (15/100) =  22.14 L
─────────────────────────────────────────────────────
Camionetas ajustadas Catemu:                1,188.15 L
(vs 1,934 L crudo — diferencia: -745.85 L, -39%)
```

> **Nota:** Catemu es el mayor consumidor de camionetas (1,934 L) pero tiene solo 15%
> de participación. Esto significa que redistribuye 967 L hacia otras faenas y solo
> recupera 221 L desde las demás. El ajuste reduce significativamente su costo atribuido.

---

### Modo "Consumo Total Ajustado"

Incluye **todas las categorías** con la redistribución de camionetas aplicada.

```
Total Ajustado = Todas las categorías
                 + Camionetas (valor ajustado por redistribución)
                 + Camion Tolva (valor ajustado por faena)
```

**¿Para qué sirve?**
Visión completa del costo de combustible atribuible a la faena, considerando tanto
la operación productiva como el transporte de mineral y personal.

---

### Modo "Consumo Operacional"

Excluye el Camion Tolva y el Microbus, mostrando solo el consumo productivo.

```
Operacional = Total Ajustado
              − Camion Tolva  (transporte de mineral → costo de ventas)
              − Microbus      (transporte de personal → costo RRHH)
```

**¿Para qué sirve?**
Medir qué parte del combustible fue destinada **directamente a la producción minera**,
sin incluir costos de transporte que corresponden a otros centros de costo.

---

## Comparación de las tres vistas

| Aspecto | Consumo por Categoría | Total Ajustado | Operacional |
|---|---|---|---|
| **¿Qué mide?** | Lo físicamente despachado en la faena | Costo real atribuido a la faena | Solo la producción minera directa |
| **Camionetas** | Consumo real bruto | 50% propio + redistribución recibida | 50% propio + redistribución recibida |
| **Camion Tolva** | Consumo real bruto | Ajustado por faena operada | **Excluido** |
| **Microbus** | Consumo real bruto | Incluido | **Excluido** |
| **Redistribución** | No aplica | Sí aplica | Sí aplica |
| **Uso recomendado** | Control diario y mantenimiento | Análisis de costos por faena | Eficiencia de la operación productiva |

---

## Casos donde las vistas se ven similares

### "Total Ajustado" ≈ "Operacional" en el mismo período

Ocurre cuando la faena **no registra consumo de Camion Tolva ni Microbus** en ese período.
Si esas categorías tienen 0 litros, excluirlas no cambia el resultado.

**Ejemplo:** Catemu en Febrero 2026 — el Camion Tolva no operó en esa faena ese mes,
por lo tanto ambas vistas muestran el mismo valor. **No es un error, es el dato correcto.**

### Variación pequeña entre vistas

Si el Camion Tolva o Microbus representan un porcentaje pequeño del consumo total
(ej: 2-6%), la diferencia visual en el gráfico de torta puede ser difícil de percibir,
aunque los números sí difieren.

---

## Glosario

| Término | Definición |
|---|---|
| **Redistribución** | Proceso de distribuir el 50% del consumo de camionetas de una faena entre las demás, según sus porcentajes de participación asignados |
| **Factor 50/50** | Porcentaje fijo definido en el código del sistema que determina cuánto se atribuye a la faena propia y cuánto se redistribuye. No es configurable desde la base de datos |
| **% de participación** | Porcentaje asignado a cada faena que determina qué proporción del 50% redistribuido le corresponde recibir. Se configura en la tabla `faenas` del sistema |
| **Consumo ajustado** | Consumo calculado después de aplicar la redistribución |
| **Consumo crudo** | Consumo real registrado en el sistema, sin ningún ajuste |
| **Período anterior** | El gráfico compacto muestra automáticamente el mismo período del mes anterior para comparación |
| **Chincolco / Laboratorio (0%)** | Faenas con 0% de participación — no reciben redistribución de otras faenas, pero sí redistribuyen el 50% de su propio consumo hacia las demás |

---

*Documento generado para uso interno — Sistema de Gestión de Combustible v3.1.0*
*Minera 3H © 2026*
