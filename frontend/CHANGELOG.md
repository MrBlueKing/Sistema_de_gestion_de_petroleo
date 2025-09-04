# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Convenciones internas

Usamos las siguientes etiquetas para organizar los cambios en desarrollo:

- [Queued]= Aprobado y en espera de ser desarrollado.
- [WIP] = Work In Progress: ya se está desarrollando, aún no está terminado.
- [Planned] = Planificado para una futura versión.
- [Idea] = Propuesta aún no aprobada.
- [Blocked] = En pausa, depende de otro cambio.
- [Testing:DevName] = En fase de QA/validación.
- [Refactor] = Cambios internos que no afectan la funcionalidad.
- [Ready] = Completado, probado y listo para entrar en la próxima versión estable

---

## [Unrelesed] -

### Added

- [Queued] Administrador Operador Vehiculos --> Consumos View --> Agregar totales para la tabla consumos y mejorar el filtro de usuarios. 

- [Queued] Global --> Centralizar un controlador de colores por faena reutilizable.

- [Queued] Rol Jefe Mina --> Visualización similar a gerente, pero con el filtro fijo a su user.id_faena.

- [Queued] Gerente --> Gestión Ingresos --> Añadir Información de la feana y paginación de la lista.

- [Queued] Gerente --> ConsumosView --> Mejorar a Historial Maquina y corregir pdf.


### Changed

- [Queued] Gerente --> ConsumoPureTable --> Centralizado en la máquina más que en la Faena.

- [Testing:Sebastian] Gerente --> Dashboard --> Agregar en la comparativa todas las categorias y la opción de ver el costo operacional.

- [Queued] Gerente --> Dashboard --> Agregar en la comparativa todas las categorias y la opción de ver el costo operacional.


### Depecrated

- Ninguno

### Removed

- [Queued] Administrador Operador Vehiculos --> Eliminar Asignación Usuario Maquina y Guardar Drag & Drop.

- [Queued] Recepciones Movil --> Eliminar Información repetida (detalles de recepción).

- [Queued] Hostorial Maqiuna Bombero --> Eliminar Acumulado por registro.


### Fixed

- [Queued] Administrador Operador Vehiculos --> Crear Users --> Agregar Todas las validaciones correspondientes y ver que hacer con guion.

- [Testing:Nico] Operador Vehiculos --> Historial --> Reemplazar historial antiguo por uno nuevo centrado en el user que traiga las estadisticas de las maquinas que el cargo.

- [WIP] Administrador Operador Vehiculos --> Consumos View / Panel Principal --> Corregir acción de "Rendir" a un Consumo.

- [Queued] Gerente --> Dashboard  --> Al presionar rapido dos veces el filtro, se bugea.

### Security

- Ninguno



## [3.0] - 2025-09-02

### Added

- [Ready] Encargado de Operaciones de Combustible: Se añadira un nuevo boton en el panel de control inicial, este boton tendra la funcionalidad de poder visualizar los consumos o trayectoria de las maquinas filtradas.

- [Ready] ADMINISTRADOR: Se añadirá una nueva funcionalidad que permitirá una gestión más eficiente de los permisos asociados a las máquinas.

- [Queued] Advertencia por diferencia de mediciones: Se debe implementar una advertencia visual (como cambio de color) cuando la diferencia entre mediciones exceda los límites definidos.

- [Queued] Rol de jefe de mina.

- [Ready] Encargado de Operaciones de Combustible: A traves de la solicitud de gerencia, ahora el rol "Encargado de Operaciones de Combustible" debe ser dividio en dos roles, manteniendo el rol "bombero" como rol principal y que tendra privilegios como realizar la recepcion de petroleo. mientras que el nuevo rol "asistente_bombero" sera restringido, solo pudiendo hacer ingresos de consumos.

- [Ready] Se agregaron filtros por columnas y ordenamiento

- [Testing] Agregar Hover para detalle de costo día / km. Para tendencia de más de un mes.

- [Testing] Agregar graficos comparativos con periodos anteriores de consumo para la operación.

- [Queued] Agregar graficos comparativos con periodos anteriores para consumos por Total / Faena/ Maquinas.

- [Testing] Operador vehiculo:Implementación de un nuevo rol destinado a registrar el consumo de combustible de las camionetas internas. Ademas de realizar la validación del kilometraje ingresado y la visualización de las dos últimas cargas realizadas.

- [Testing] Administrador Operador: desarrollo de rol + interfaz completa para gestión de cargas y asignaciones de vehículos.

- [Testing] Graficos: Implementar graficos comparativos por Total / Faena / Categorias / Maquinas.

- [Testing] Sistema General: Se agregaron colores a todas las vistas de consumos segun leyenda establecida.

        Gerente.ConsumoView
        Gerente.Table Consumos por faena
        Gerente.Table Ingreso por faena
        Gerente.Table Rendimiento Maquinas
        Bombero.ConsumoView

- [Testing] Admin Operador Vehiculos: Visualización general del sistema con funcionalidades.
        - Consumos View con integración de boletas.
        - Asignar Maquina a Operador(Users).
        - Ingresar Maquinas.

- [WIP] Administración General: Se agrega la opcion de crear Maquinas.


### Changed

- [Ready] Encargado de Operaciones de Combustible: Anteriormente solo se mostraba la última medición registrada. Ahora se implementará un mini historial que muestre los dos últimos consumos, incluyendo la siguiente información: quién realizó el consumo, en qué lugar, cuánta cantidad se utilizó y cuándo ocurrió.

- [Planned] Advertencia por diferencia de mediciones: Se debe implementar una advertencia visual (como cambio de color) cuando la diferencia entre mediciones exceda los límites definidos.

-[ready] Mejorar visualización de gráficos de torta en Gerente: optimizar la distribución y legibilidad de los nombres de las máquinas.En Bombero: ajustar la presentación para mejorar la distribución y comprensión del consumo.

-[WIP] Administrador de Operador de Vehiculos: Se modifica datos visuales(por rendir y rendido) en el panel administrativo como tambien se añadirá más información como litros mes vs mes anterior, ademas se modificara el mensaje de "error" para cuando se quiera desactivar un usuario(Operador vehiculo) que tenga una máquina asignada.

### Depecrated

- Ninguno

### Removed

- [Ready] Gerente : Graficos.jsx --> Tabla --> Análisis por Máquina - ConsumoCategoriasController --> La columna Valor Total, muestra abajo un valor de precio / l promedio, el cual es un valor repetido en la columna Precio Específico, por lo que se decide eliminar.

### Fixed

- [Ready] Gerente : Graficos.jsx --> Consumo_PieChart --> Se filtra mal cuando uno selecciona todas las faenas, Se modificara el metodo para que entienda como se debe filtrar si se selecciona todas las faenas.

- [Ready] Gerente : Graficos.jsx --> Tabla --> Análisis por Máquina - ConsumoCategoriasController --> La columna Precio Específico se calcula en base al valor promedio de los precios, y debiese calcularse de forma ponderada entre el precio y el valor de cada consumo, dividido en el total de listros consumidos.

- [Ready] Gerente : Graficos.jsx --> Se corrige ToolTip para que no cubra la Barra/Sección a la cual se le ve el detalle.

- [Testing] Administrador Vehiculos : ConsumosView.jsx --> Agregar tabla que liste los consumos con sus respectivos datos de interes.

- [Testing] Gerente : Graficos.jsx → Optimización en la obtención de datos para mejorar la velocidad de carga y evitar recursión de recursos, reduciendo tiempos de espera excesivos.

### Security

- Ninguno

---

## [2.1.0] - 2025-07-30

### Added

- [Ready] Medición visible: Ahora, en el registro de consumo, la etiqueta de la máquina mostrará su última medición registrada.

- [Ready] Numeral inicial preestablecido: El numeral inicial ahora se sugiere automáticamente como valor preestablecido (no definitivo) para facilitar el ingreso del consumo. En consumos desde estanques móviles, este valor será 0 por defecto.

- [Ready] Validación de medición actual: Se ha implementado una nueva restricción: la medición actual no puede ser menor que la última registrada, evitando así inconsistencias en los datos.

- [Ready] Mensaje de confirmación por diferencia de medición: Si la medición actual supera la anterior por más de 12 horas (en horómetro) o 1000 km (en kilometraje), se mostrará un mensaje de advertencia que solicita confirmar o cancelar el ingreso.

- [Ready] Se mejoró la generación de PDF, añadiendo la opción de filtrado por faenas y la adaptación dinámica del ícono según la ubicación seleccionada.

- [Ready] Advertencia por diferencia de mediciones: Se debe implementar una advertencia visual (como cambio de color) cuando la diferencia entre mediciones exceda los límites definidos.

- [Queued] Rol de jefe de mina, bombero 2 y operador vehiculo.

### Changed

- [Ready] Mejoras en perfil de Gerente: Se actualizó la presentación visual del perfil de Gerente, incluyendo cambios en los recuadros informativos.
- [Ready] Gestión de Consumo Gerente: Se actualizó el módulo de Gestión de Consumo para incluir datos de la faena de Tiltil, además de los de Cabildo. Anteriormente, esta sección mostraba únicamente información relacionada con Cabildo.
- [Ready] Dashboard Operacional Gerente: Se mejoró la visualización general, con nuevos gráficos de barras, ajustes visuales en los gráficos de torta (pie chart) y se añadió una sección de "Tendencias". Esta nueva vista permite, a través de un modal, observar tendencias por equipos de la misma categoría, su historial de consumos y un resumen por máquina.

### Depecrated

- Ninguno

### Removed

- Ninguno

### Fixed

- [Ready] Filtrado de solicitantes por ubicación: Ahora se muestran únicamente los solicitantes correspondientes a la faena del usuario. Anteriormente, se listaban todos los solicitantes sin considerar su ubicación.

### Security

- Ninguno

---

-

## [2.0.0] - 2025-07-01

### Added

- Versión Oficial En Producción.
