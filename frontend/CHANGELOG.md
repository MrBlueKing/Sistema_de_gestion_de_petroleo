# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Convenciones internas

Usamos las siguientes etiquetas para organizar los cambios en desarrollo:

- `[WIP]` = *Work In Progress*: ya se está desarrollando, aún no está terminado.
- `[Planned]` = Planificado para una futura versión.
- `[Idea]` = Propuesta aún no aprobada.
- `[Blocked]` = En pausa, depende de otro cambio.
- `[Testing]` = En fase de pruebas, pendiente de validación.
- `[Refactor]` = Cambios internos que no afectan la funcionalidad.
- `[Ready]` = Completado, probado y listo para entrar en la próxima versión estable
---

## [Unreleased]

### Added
- [Testing] Medición visible: Ahora, en el registro de consumo, la etiqueta de la máquina mostrará su última medición registrada.
- [Testing] Numeral inicial preestablecido: El numeral inicial ahora se sugiere automáticamente como valor preestablecido (no definitivo) para facilitar el ingreso del consumo. En consumos desde estanques móviles, este valor será 0 por defecto.
- [Testing] Validación de medición actual: Se ha implementado una nueva restricción: la medición actual no puede ser menor que la última registrada, evitando así inconsistencias en los datos.
- [Testing] Mensaje de confirmación por diferencia de medición: Si la medición actual supera la anterior por más de 12 horas (en horómetro) o 1000 km (en kilometraje), se mostrará un mensaje de advertencia que solicita confirmar o cancelar el ingreso.
- [Ready] Se mejoró la generación de PDF, añadiendo la opción de filtrado por faenas y la adaptación dinámica del ícono según la ubicación seleccionada.

- [WIP] Advertencia por diferencia de mediciones: Se debe implementar una advertencia visual (como cambio de color) cuando la diferencia entre mediciones exceda los límites definidos.
- [WIP] Rol de jefe de mina, bombero 2 y operador vehiculo.

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
