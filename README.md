# Sistema de Gestión de Combustible

![Logo del Sistema](https://via.placeholder.com/150x150.png?text=GCL)

## Descripción General

El Sistema de Gestión de Combustible es una plataforma integral diseñada para controlar y gestionar el inventario de combustible en faenas industriales. Permite monitorear en tiempo real los niveles de combustible en estanques, registrar movimientos (recepciones y consumos), y generar informes detallados para una toma de decisiones eficiente.

## Características Principales

### 🛢️ Gestión de Estanques
- Registro y monitoreo de múltiples estanques por faena
- Control de capacidad y niveles actuales
- Alertas de niveles críticos
- Medición por altura convertida automáticamente a litros

### 📊 Movimientos de Combustible
- **Recepciones**: Registro de ingresos de combustible con guías de despacho
- **Consumos**: Control de extracciones para equipos y maquinaria
- Validación automática para prevenir inconsistencias
- Cálculo de diferencias entre cantidades documentadas y medidas

### 👥 Gestión de Usuarios
- Roles y permisos configurables
- Trazabilidad de operaciones por usuario
- Interfaz adaptada según nivel de acceso

### 📈 Reportes y Análisis
- Consumo por equipos
- Histórico de movimientos
- Proyecciones de consumo
- Exportación en múltiples formatos

## Manual de Usuario

### Recepción de Combustible

1. **Acceda al formulario de recepción**
   - Navegue a la sección "Bombero" del menú principal
   - Seleccione "Registrar Recepción"

2. **Ingrese datos básicos de la recepción**
   - N° Guía de Despacho
   - Litros recibidos según guía
   - Precio por litro

3. **Registro de alturas**
   - Haga clic en "Ingresar Alturas"
   - Mida la altura actual de cada estanque después de la recepción
   - Ingrese los valores en centímetros (cm)
   - **Nota importante**: Ingrese la altura real medida después de la recepción, incluso si es 0
   - Haga clic en "Calcular" para procesar las mediciones

4. **Verificación y confirmación**
   - Revise la diferencia calculada entre guía y medición
   - Verifique el monto total
   - Ingrese observaciones si es necesario
   - Haga clic en "Ingresar Recepción"

### Registro de Consumo

1. **Acceda al formulario de consumo**
   - Navegue a la sección "Operaciones"
   - Seleccione "Registrar Consumo"

2. **Seleccione equipo y cantidades**
   - Equipo o maquinaria
   - Litros a consumir
   - Operador/Solicitante

3. **Seleccione origen del combustible**
   - Seleccione estanque específico o use stock total
   - El sistema calculará automáticamente la disponibilidad

4. **Confirmación**
   - Verifique los datos ingresados
   - Confirme la operación

## Preguntas Frecuentes (FAQ)

### Recepción de Combustible

**P: ¿Qué debo hacer si un estanque está vacío?**  
R: Ingrese "0" como valor de altura. El sistema reconoce este valor como válido y lo procesará correctamente.

**P: ¿Qué significa la diferencia calculada?**  
R: Es la diferencia entre los litros declarados en la guía y los litros calculados según las alturas medidas. Permite detectar posibles discrepancias en la entrega.

**P: ¿Puedo modificar una recepción ya registrada?**  
R: No, por motivos de trazabilidad y auditoría. Si hay un error, contacte al administrador del sistema.

### Consumo de Combustible

**P: ¿Cómo se registra un consumo desde múltiples estanques?**  
R: El sistema ahora genera automáticamente un único registro de consumo, independientemente de cuántos estanques se utilicen como fuente. Los detalles de cada estanque se mantienen en los registros internos.

**P: ¿Qué significa "usar stock total"?**  
R: Cuando esta opción está activada, el sistema distribuye el consumo proporcionalmente entre todos los estanques disponibles según sus niveles actuales.

## Soporte Técnico

Para problemas técnicos o consultas sobre el funcionamiento del sistema:

📧 Email: soporte@gestioncombustible.cl  
📞 Teléfono: +56 2 2123 4567  
💬 Chat en línea: Disponible en horario laboral (Lu-Vi 8:30-18:00)

---

## Para Desarrolladores

### Tecnologías Utilizadas

- **Backend**: PHP, Laravel
- **Frontend**: React.js, Tailwind CSS
- **Base de Datos**: MySQL/MariaDB
- **API**: RESTful con autenticación JWT

### Estructura del Proyecto

```
/
├── app/                 # Lógica de la aplicación (controladores, modelos)
├── config/              # Configuraciones
├── database/            # Migraciones y seeders
├── public/              # Archivos públicos
├── resources/           # Assets, vistas y componentes React
├── routes/              # Definición de rutas
└── tests/               # Tests automatizados
```

### Modelos de Datos Principales

- **Estanque**: Representa un contenedor físico de combustible
- **EstanqueStock**: Almacena el nivel actual de cada estanque
- **StockPetroleo**: Registro consolidado del stock por faena
- **IngresoPetroleo**: Registros de recepciones de combustible
- **Consumo**: Registros de consumos de combustible
- **MovimientoPetroleo**: Tabla de auditoría con todos los movimientos

### Convención de Código

Este proyecto sigue las convenciones de código de Laravel y PSR-12.

---

© 2025 Sistema de Gestión de Combustible | Todos los derechos reservados
