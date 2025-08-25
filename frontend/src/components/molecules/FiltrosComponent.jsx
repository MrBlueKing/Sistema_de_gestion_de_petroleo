import React, { useState, useEffect, useCallback } from "react";
import { FiCalendar, FiClock, FiSearch, FiX } from "react-icons/fi";
import { FaBuilding, FaTruck, FaMapMarkerAlt } from "react-icons/fa";

const FiltrosComponent = ({
  // Props básicas (MANTENIENDO COMPATIBILIDAD con la API existente)
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  faenaSeleccionada = "todas",
  setFaenaSeleccionada,
  faenas = [],
  
  // 🆕 Props para el nuevo sistema de onChange (OPCIONAL - para ConsumoView)
  onChange,
  
  // 🆕 Props específicas para ConsumoView
  mostrarEquipoFilter = false,
  equipoFilter = "",
  placeholderEquipo = "Buscar equipo...",
  
  // 🆕 NUEVA PROP: Modo de operación
  modo = "faenas", // "faenas" o "ubicaciones"
  
  // Props de configuración (mantenidas para compatibilidad)
  incluirHoras = false,
  horaDesde = "08:00",
  setHoraDesde,
  horaHasta = "18:00",
  setHoraHasta,
  mostrarFaenas = true,
  tituloPersonalizado = null,
  mostrarTitulo = true,
  mostrarResumen = true, // Para compatibilidad con VerificacionIngresos
  
  // Props de estado
  cargando = false,
  
  // 🆕 Props adicionales para personalización
  className = "",
  compacto = false,
}) => {
  // 🆕 Estado interno para el filtro de equipo
  const [equipoFilterInterno, setEquipoFilterInterno] = useState(equipoFilter);

  // Estado interno para validación
  const [estadoValidacion, setEstadoValidacion] = useState({
    valido: true,
    mensaje: ""
  });

  // 🆕 Configuración dinámica basada en el modo
  const configuracion = {
    faenas: {
      icono: FaBuilding,
      iconoColor: "text-orange-500",
      label: "Faena",
      placeholder: "Todas las faenas",
      todasLabel: "Todas las faenas"
    },
    ubicaciones: {
      icono: FaMapMarkerAlt,
      iconoColor: "text-blue-500", 
      label: "Ubicación",
      placeholder: "Todas las ubicaciones",
      todasLabel: "Todas las ubicaciones"
    }
  };

  const config = configuracion[modo] || configuracion.faenas;
  const IconoFaena = config.icono;

  // Sincronizar estado interno con prop externa
  useEffect(() => {
    setEquipoFilterInterno(equipoFilter);
  }, [equipoFilter]);

  // ✅ CORREGIDO: Establecer valores iniciales más robustos
  useEffect(() => {
    // Solo establecer fechas si ambas están vacías y tenemos setters
    if (setFechaDesde && setFechaHasta && (!fechaDesde || !fechaHasta)) {
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

  // Validar fechas y horas
  useEffect(() => {
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setEstadoValidacion({
        valido: false,
        mensaje: "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'"
      });
    } else if (incluirHoras && horaDesde && horaHasta && fechaDesde === fechaHasta && horaDesde >= horaHasta) {
      setEstadoValidacion({
        valido: false,
        mensaje: "La hora 'Desde' debe ser anterior a la hora 'Hasta' cuando es el mismo día"
      });
    } else {
      setEstadoValidacion({
        valido: true,
        mensaje: ""
      });
    }
  }, [fechaDesde, fechaHasta, horaDesde, horaHasta, incluirHoras]);

  // 🆕 Función para manejar cambios usando el nuevo sistema onChange
  const notificarCambio = useCallback((nuevosCambios) => {
    if (onChange) {
      const cambiosCompletos = {
        fechaDesde,
        fechaHasta,
        horaDesde,
        horaHasta,
        faenaSeleccionada,
        ...(mostrarEquipoFilter && { equipoFilter: equipoFilterInterno }),
        ...nuevosCambios
      };
      
      onChange(cambiosCompletos);
    }
  }, [onChange, fechaDesde, fechaHasta, horaDesde, horaHasta, faenaSeleccionada, equipoFilterInterno, mostrarEquipoFilter]);

  // Manejadores de cambio - COMPATIBLES CON AMBOS SISTEMAS
  const handleFechaDesdeChange = (valor) => {
    if (setFechaDesde) {
      setFechaDesde(valor); // Sistema antiguo
    }
    if (onChange) {
      notificarCambio({ fechaDesde: valor }); // Sistema nuevo
    }
  };

  const handleFechaHastaChange = (valor) => {
    if (setFechaHasta) {
      setFechaHasta(valor); // Sistema antiguo
    }
    if (onChange) {
      notificarCambio({ fechaHasta: valor }); // Sistema nuevo
    }
  };

  const handleHoraDesdeChange = (valor) => {
    if (setHoraDesde) {
      setHoraDesde(valor); // Sistema antiguo
    }
    if (onChange) {
      notificarCambio({ horaDesde: valor }); // Sistema nuevo
    }
  };

  const handleHoraHastaChange = (valor) => {
    if (setHoraHasta) {
      setHoraHasta(valor); // Sistema antiguo
    }
    if (onChange) {
      notificarCambio({ horaHasta: valor }); // Sistema nuevo
    }
  };

  const handleFaenaChange = (valor) => {
    if (setFaenaSeleccionada) {
      setFaenaSeleccionada(valor); // Sistema antiguo
    }
    if (onChange) {
      notificarCambio({ faenaSeleccionada: valor }); // Sistema nuevo
    }
  };

  // 🆕 Manejador para el filtro de equipo
  const handleEquipoFilterChange = (valor) => {
    setEquipoFilterInterno(valor);
    if (onChange) {
      notificarCambio({ equipoFilter: valor });
    }
  };

  // 🆕 Función para limpiar filtro de equipo
  const limpiarEquipoFilter = () => {
    setEquipoFilterInterno("");
    if (onChange) {
      notificarCambio({ equipoFilter: "" });
    }
  };

  // Función para formatear fecha y hora
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return "";
    const fechaObj = new Date(fecha + (hora ? `T${hora}` : ""));
    return fechaObj.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(incluirHoras && hora ? {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      } : {})
    });
  };

  // 🆕 Función para obtener nombre según el modo
  const getNombreOpcion = (id) => {
    if (id === "todas") return config.todasLabel;
    const opcion = faenas.find(f => f.value === id || f.value === id.toString());
    return opcion ? opcion.label : `${config.label} ${id}`;
  };

  // Determinar si hay filtros activos
  const hayFiltrosActivos = fechaDesde || fechaHasta || (mostrarEquipoFilter && equipoFilterInterno) || (mostrarFaenas && faenaSeleccionada !== "todas");

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ✅ Warning de validación */}
      {!estadoValidacion.valido && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-700 font-medium">
            {estadoValidacion.mensaje}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Los datos no se cargarán hasta que se corrija este problema.
          </div>
        </div>
      )}

      {/* Contenedor de filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className={`grid gap-4 ${
          incluirHoras
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
            : compacto
              ? 'grid-cols-1 md:grid-cols-2'
              : mostrarFaenas && mostrarEquipoFilter
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                : mostrarFaenas || mostrarEquipoFilter
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2'
        }`}>

          {/* 🆕 MEJORADO: Faena/Ubicación - Dinámico según el modo */}
          {mostrarFaenas && (
            <div className={incluirHoras ? "" : "md:col-span-1"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <IconoFaena className={`inline mr-2 ${config.iconoColor}`} />
                {config.label}
              </label>
              <select
                value={faenaSeleccionada}
                onChange={(e) => handleFaenaChange(e.target.value)}
                disabled={cargando}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  cargando ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="todas">{config.todasLabel}</option>
                {faenas.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
              
              {/* 🆕 Indicador del modo activo */}
              {modo === "ubicaciones" && faenas.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  📍 Modo ubicaciones activo ({faenas.length} disponibles)
                </div>
              )}
            </div>
          )}

          {/* 🆕 Filtro por Equipo - Solo si está habilitado */}
          {mostrarEquipoFilter && (
            <div className={incluirHoras ? "" : "md:col-span-1"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaTruck className="inline mr-2 text-green-500" />
                Filtrar por Equipo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={equipoFilterInterno}
                  onChange={(e) => handleEquipoFilterChange(e.target.value)}
                  placeholder={placeholderEquipo}
                  disabled={cargando}
                  className={`w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    cargando ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {equipoFilterInterno && (
                  <button
                    onClick={limpiarEquipoFilter}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Limpiar filtro"
                  >
                    <FiX />
                  </button>
                )}
              </div>
              {equipoFilterInterno && (
                <div className="text-xs text-green-600 mt-1">
                  Buscando: "{equipoFilterInterno}"
                </div>
              )}
            </div>
          )}

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-2 text-orange-500" />
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => handleFechaDesdeChange(e.target.value)}
              disabled={cargando}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                cargando ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-2 text-orange-500" />
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => handleFechaHastaChange(e.target.value)}
              disabled={cargando}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                cargando ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Horas - Solo si incluirHoras está habilitado */}
          {incluirHoras && (
            <>
              {/* Hora Desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-2 text-purple-500" />
                  Hora Desde
                </label>
                <input
                  type="time"
                  value={horaDesde}
                  onChange={(e) => handleHoraDesdeChange(e.target.value)}
                  disabled={cargando}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    cargando ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Hora Hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-2 text-purple-500" />
                  Hora Hasta
                </label>
                <input
                  type="time"
                  value={horaHasta}
                  onChange={(e) => handleHoraHastaChange(e.target.value)}
                  disabled={cargando}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    cargando ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </>
          )}
        </div>

        {/* Estado de validación en la parte inferior */}
        {!estadoValidacion.valido && (
          <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            ⚠️ {estadoValidacion.mensaje}
          </div>
        )}

        {/* Indicador de carga */}
        {cargando && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
              Aplicando filtros...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltrosComponent;