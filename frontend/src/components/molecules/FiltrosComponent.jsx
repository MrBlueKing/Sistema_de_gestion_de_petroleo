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
  // Establecer valores iniciales
  useEffect(() => {
    if (!fechaDesde && !fechaHasta) {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaDesde(primerDiaMes.toISOString().slice(0, 10));
      setFechaHasta(hoy.toISOString().slice(0, 10));
    }

    // ✅ NUEVO: Establecer horas por defecto si están habilitadas
    if (incluirHoras && setHoraDesde && setHoraHasta) {
      if (!horaDesde) setHoraDesde("08:00"); // Inicio laboral
      if (!horaHasta) setHoraHasta("18:00"); // Fin laboral
    }
  }, [fechaDesde, fechaHasta, setFechaDesde, setFechaHasta, incluirHoras, horaDesde, horaHasta, setHoraDesde, setHoraHasta]);

  // Obtener el nombre de la faena según su ID
  const getNombreFaena = (id) => {
    const faenaEncontrada = faenas.find(f => f.value === id);
    return faenaEncontrada ? faenaEncontrada.label : id;
  };

  // ✅ NUEVA FUNCIÓN: Formatear fecha con hora para mostrar
  const formatearFechaHora = (fecha, hora) => {
    if (!incluirHoras || !hora) return fecha;
    return `${fecha} ${hora}`;
  };

  // ✅ NUEVA FUNCIÓN: Validar que la fecha/hora hasta no sea menor que desde
  const validarFechaHasta = (nuevaFechaHasta, nuevaHoraHasta = horaHasta) => {
    if (!incluirHoras) {
      return nuevaFechaHasta >= fechaDesde;
    }
    
    const fechaHoraDesde = new Date(`${fechaDesde}T${horaDesde || "00:00"}`);
    const fechaHoraHasta = new Date(`${nuevaFechaHasta}T${nuevaHoraHasta || "00:00"}`);
    
    return fechaHoraHasta >= fechaHoraDesde;
  };

  // ✅ NUEVA FUNCIÓN: Manejar cambio de fecha hasta
  const manejarCambioFechaHasta = (nuevaFechaHasta) => {
    if (validarFechaHasta(nuevaFechaHasta)) {
      setFechaHasta(nuevaFechaHasta);
    } else {
      const mensaje = incluirHoras 
        ? "La fecha y hora 'Hasta' no puede ser menor que 'Desde'"
        : "La fecha 'Hasta' no puede ser menor que 'Desde'";
      alert(mensaje);
    }
  };

  // ✅ NUEVA FUNCIÓN: Manejar cambio de hora hasta
  const manejarCambioHoraHasta = (nuevaHoraHasta) => {
    if (validarFechaHasta(fechaHasta, nuevaHoraHasta)) {
      setHoraHasta(nuevaHoraHasta);
    } else {
      alert("La hora 'Hasta' no puede ser menor que la hora 'Desde' en el mismo día");
    }
  };

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
          
          {/* ✅ NUEVO: Indicador de modo con horas */}
          {incluirHoras && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              🕐 Filtro con precisión horaria activado
            </div>
          )}
        </div>
      )}

      {/* Contenedor de filtros */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className={`grid gap-4 ${
          incluirHoras 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' // Más columnas cuando hay horas
            : 'grid-cols-1 md:grid-cols-3' // Layout original
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

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde:
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                const nuevaFechaDesde = e.target.value;
                setFechaDesde(nuevaFechaDesde);
                // Ajustar fechaHasta si quedó menor que la nueva fechaDesde
                if (!validarFechaHasta(fechaHasta)) {
                  setFechaHasta(nuevaFechaDesde);
                  if (incluirHoras && setHoraHasta && horaDesde) {
                    setHoraHasta(horaDesde);
                  }
                }
              }}
              max={fechaHasta}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ✅ NUEVA SECCIÓN: Hora Desde (solo si incluirHoras = true) */}
          {incluirHoras && setHoraDesde && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Desde:
              </label>
              <input
                type="time"
                value={horaDesde || "08:00"}
                onChange={(e) => {
                  setHoraDesde(e.target.value);
                  // Validar hora hasta si están en el mismo día
                  if (fechaDesde === fechaHasta && horaHasta && e.target.value > horaHasta) {
                    setHoraHasta(e.target.value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta:
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => manejarCambioFechaHasta(e.target.value)}
              min={fechaDesde}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ✅ NUEVA SECCIÓN: Hora Hasta (solo si incluirHoras = true) */}
          {incluirHoras && setHoraHasta && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Hasta:
              </label>
              <input
                type="time"
                value={horaHasta || "18:00"}
                onChange={(e) => manejarCambioHoraHasta(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* ✅ NUEVA SECCIÓN: Atajos rápidos para horarios comunes (solo con horas) */}
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