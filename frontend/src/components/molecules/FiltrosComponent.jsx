import React, { useEffect } from "react";
import { FiCalendar, FiClock } from "react-icons/fi";

const FiltrosComponent = ({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  faenaSeleccionada,
  setFaenaSeleccionada,
  faenas = [],
  // ✅ NUEVAS PROPS OPCIONALES para horas
  incluirHoras = false,
  horaDesde,
  setHoraDesde,
  horaHasta,
  setHoraHasta,
  // ✅ PROPS OPCIONALES para personalización
  tituloPersonalizado,
  mostrarResumen = true
}) => {
  // ✅ CORREGIDO: Establecer valores iniciales más robustos
  useEffect(() => {
    // Solo establecer fechas si ambas están vacías
    if (!fechaDesde || !fechaHasta) {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      if (!fechaDesde) {
        setFechaDesde(primerDiaMes.toISOString().slice(0, 10));
      }
      if (!fechaHasta) {
        setFechaHasta(hoy.toISOString().slice(0, 10));
      }
    }

    // ✅ Establecer horas por defecto solo si están habilitadas y vacías
    if (incluirHoras) {
      if (setHoraDesde && !horaDesde) setHoraDesde("08:00");
      if (setHoraHasta && !horaHasta) setHoraHasta("18:00");
    }
  }, [fechaDesde, fechaHasta, setFechaDesde, setFechaHasta, incluirHoras, horaDesde, horaHasta, setHoraDesde, setHoraHasta]);

  // Obtener el nombre de la faena según su ID
  const getNombreFaena = (id) => {
    const faenaEncontrada = faenas.find(f => f.value === id);
    return faenaEncontrada ? faenaEncontrada.label : id;
  };

  // ✅ FUNCIÓN: Formatear fecha con hora para mostrar
  const formatearFechaHora = (fecha, hora) => {
    if (!incluirHoras || !hora) return fecha;
    return `${fecha} ${hora}`;
  };

  // ✅ FUNCIÓN CORREGIDA: Validar fechas y horas más estricta
  const validarFechaHasta = (nuevaFechaHasta, nuevaHoraHasta = horaHasta) => {
    if (!fechaDesde || !nuevaFechaHasta) return true; // Permitir si falta alguna fecha

    if (!incluirHoras) {
      // Solo comparar fechas
      return nuevaFechaHasta >= fechaDesde;
    }

    // Comparar fechas + horas
    const horaDesdeSegura = horaDesde || "00:00";
    const horaHastaSegura = nuevaHoraHasta || "23:59";

    const fechaHoraDesde = new Date(`${fechaDesde}T${horaDesdeSegura}:00`);
    const fechaHoraHasta = new Date(`${nuevaFechaHasta}T${horaHastaSegura}:00`);

    return fechaHoraHasta >= fechaHoraDesde;
  };

  // ✅ FUNCIÓN CORREGIDA: Manejar cambio de fecha desde con validación
  const manejarCambioFechaDesde = (nuevaFechaDesde) => {
    setFechaDesde(nuevaFechaDesde);

    // ✅ CORRECCIÓN CRÍTICA: Si fecha_desde > fecha_hasta, ajustar fecha_hasta
    if (fechaHasta && nuevaFechaDesde > fechaHasta) {
      console.log('🔧 Ajustando fecha_hasta porque fecha_desde es mayor');
      setFechaHasta(nuevaFechaDesde);

      // Si incluye horas y están en el mismo día, ajustar hora también
      if (incluirHoras && setHoraHasta && horaDesde && nuevaFechaDesde === fechaHasta) {
        if (horaDesde > (horaHasta || "00:00")) {
          setHoraHasta(horaDesde);
        }
      }
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Manejar cambio de fecha hasta con validación
  const manejarCambioFechaHasta = (nuevaFechaHasta) => {
    if (!fechaDesde) {
      setFechaHasta(nuevaFechaHasta);
      return;
    }

    // ✅ VALIDACIÓN ESTRICTA: No permitir fecha_hasta < fecha_desde
    if (nuevaFechaHasta < fechaDesde) {
      const mensaje = incluirHoras
        ? "La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'"
        : "La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'";

      alert(mensaje);
      return; // ✅ NO actualizar el estado si la validación falla
    }

    // ✅ Si pasa la validación, actualizar
    setFechaHasta(nuevaFechaHasta);
  };

  // ✅ FUNCIÓN CORREGIDA: Manejar cambio de hora desde
  const manejarCambioHoraDesde = (nuevaHoraDesde) => {
    if (!setHoraDesde) return;

    setHoraDesde(nuevaHoraDesde);

    // ✅ Si están en el mismo día y hora_desde > hora_hasta, ajustar hora_hasta
    if (fechaDesde === fechaHasta && horaHasta && nuevaHoraDesde > horaHasta) {
      console.log('🔧 Ajustando hora_hasta porque hora_desde es mayor');
      if (setHoraHasta) {
        setHoraHasta(nuevaHoraDesde);
      }
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Manejar cambio de hora hasta con validación estricta
  const manejarCambioHoraHasta = (nuevaHoraHasta) => {
    if (!setHoraHasta) return;

    // ✅ VALIDACIÓN ESTRICTA solo si están en el mismo día
    if (fechaDesde === fechaHasta && horaDesde && nuevaHoraHasta < horaDesde) {
      alert("La hora 'Hasta' no puede ser anterior a la hora 'Desde' en el mismo día");
      return; // ✅ NO actualizar el estado si la validación falla
    }

    // ✅ Si pasa la validación, actualizar
    setHoraHasta(nuevaHoraHasta);
  };

  // ✅ NUEVA FUNCIÓN: Validar estado actual para mostrar warnings
  const obtenerEstadoValidacion = () => {
    if (!fechaDesde || !fechaHasta) return { valido: true, mensaje: null };

    if (!incluirHoras) {
      if (fechaHasta < fechaDesde) {
        return {
          valido: false,
          mensaje: "⚠️ Fecha 'Hasta' es anterior a fecha 'Desde'"
        };
      }
    } else {
      const horaDesdeSegura = horaDesde || "00:00";
      const horaHastaSegura = horaHasta || "23:59";

      const fechaHoraDesde = new Date(`${fechaDesde}T${horaDesdeSegura}:00`);
      const fechaHoraHasta = new Date(`${fechaHasta}T${horaHastaSegura}:00`);

      if (fechaHoraHasta < fechaHoraDesde) {
        return {
          valido: false,
          mensaje: "⚠️ Fecha/hora 'Hasta' es anterior a fecha/hora 'Desde'"
        };
      }
    }

    return { valido: true, mensaje: null };
  };

  const estadoValidacion = obtenerEstadoValidacion();

  return (
    <>
      {/* Encabezado con información del período */}
      {mostrarResumen && (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 text-sm text-gray-500">
          <div className="flex items-center mb-3 md:mb-0">
            {incluirHoras ? (
              <FiClock className="mr-2 text-blue-500" />
            ) : (
              <FiCalendar className="mr-2 text-blue-500" />
            )}
            {tituloPersonalizado || "Mostrando datos para"}:{" "}
            <span className="font-medium text-gray-700 ml-1">
              {formatearFechaHora(fechaDesde, horaDesde)} hasta {formatearFechaHora(fechaHasta, horaHasta)}
            </span>
            {faenaSeleccionada !== "todas" && (
              <span className="ml-2">
                | Faena:{" "}
                <span className="font-medium text-gray-700 ml-1">
                  {getNombreFaena(faenaSeleccionada)}
                </span>
              </span>
            )}
          </div>

          {/* ✅ INDICADOR de modo con horas */}
          {incluirHoras && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              🕐 Filtro con precisión horaria activado
            </div>
          )}
        </div>
      )}

      {/* ✅ NUEVO: Warning de validación */}
      {!estadoValidacion.valido && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700 font-medium">
            {estadoValidacion.mensaje}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Los datos no se cargarán hasta que se corrija este problema.
          </div>
        </div>
      )}

      {/* Contenedor de filtros */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className={`grid gap-4 ${incluirHoras
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
            : 'grid-cols-1 md:grid-cols-3'
          }`}>

          {/* Faena */}
          <div className={incluirHoras ? 'lg:col-span-1' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Faena:
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={faenaSeleccionada}
              onChange={(e) => setFaenaSeleccionada(e.target.value)}
            >
              <option value="todas">Todas las faenas</option>
              {faenas.map(faena => (
                <option key={faena.value} value={faena.value}>
                  {faena.label}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ CORREGIDO: Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde:
            </label>
            <input
              type="date"
              value={fechaDesde || ''}
              onChange={(e) => manejarCambioFechaDesde(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ✅ CORREGIDO: Hora Desde */}
          {incluirHoras && setHoraDesde && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Desde:
              </label>
              <input
                type="time"
                value={horaDesde || "08:00"}
                onChange={(e) => manejarCambioHoraDesde(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* ✅ CORREGIDO: Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta:
            </label>
            <input
              type="date"
              value={fechaHasta || ''}
              onChange={(e) => manejarCambioFechaHasta(e.target.value)}
              min={fechaDesde} // ✅ IMPORTANTE: Restricción nativa del navegador
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${!estadoValidacion.valido ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
            />
          </div>

          {/* ✅ CORREGIDO: Hora Hasta */}
          {incluirHoras && setHoraHasta && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Hasta:
              </label>
              <input
                type="time"
                value={horaHasta || "18:00"}
                onChange={(e) => manejarCambioHoraHasta(e.target.value)}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${!estadoValidacion.valido ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
              />
            </div>
          )}
        </div>

        {/* ✅ ATAJOS rápidos para horarios comunes */}
        {incluirHoras && setHoraDesde && setHoraHasta && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Atajos de horario:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setHoraDesde("08:00");
                  setHoraHasta("18:00");
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Horario Laboral (8:00 - 18:00)
              </button>
              <button
                type="button"
                onClick={() => {
                  setHoraDesde("06:00");
                  setHoraHasta("22:00");
                }}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Horario Extendido (6:00 - 22:00)
              </button>
              <button
                type="button"
                onClick={() => {
                  setHoraDesde("00:00");
                  setHoraHasta("23:59");
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Todo el Día
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FiltrosComponent;