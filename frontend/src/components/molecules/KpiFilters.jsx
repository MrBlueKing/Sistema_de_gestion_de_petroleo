// src/components/molecules/KpiFilters.js
import React from "react";
import { FiCalendar, FiRefreshCw, FiFilter, FiMapPin, FiInfo } from "react-icons/fi";
import { useFilterContext } from "../molecules/filterContext";

/**
 * Componente de filtros para los KPIs
 * Este componente permite seleccionar faena, fechas y periodo para filtrar los datos
 */
const KpiFilters = ({ refrescarDatos, cargando, ultimaActualizacion }) => {
  // Obtener los filtros del contexto
  const {
    faenaSeleccionada,
    setFaenaSeleccionada,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    periodoSeleccionado,
    setPeriodoSeleccionado,
    resetearFiltros
  } = useFilterContext();

  // Obtener faenas disponibles
  const faenas = [
    { id: "todas", nombre: "Todas las faenas" },
    { id: "1", nombre: "Cabildo" },
    { id: "2", nombre: "Catemu" },
    { id: "3", nombre: "Chincolco" },
    { id: "4", nombre: "Tiltil" }
  ];

  // Función para formatear fecha de última actualización
  const formatearFechaUltimaActualizacion = () => {
    if (!ultimaActualizacion) return "Nunca";
    return ultimaActualizacion.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700 flex items-center">
          <FiFilter className="mr-2 text-blue-500" />
          Filtrar información
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Actualizado: {formatearFechaUltimaActualizacion()}
          </span>
          <button
            onClick={refrescarDatos}
            disabled={cargando}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`mr-1 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={resetearFiltros}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            Resetear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selector de faena */}
        <div>
          <label htmlFor="selectFaena" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiMapPin className="mr-1 text-blue-500" /> Faena
          </label>
          <select
            id="selectFaena"
            value={faenaSeleccionada}
            onChange={(e) => setFaenaSeleccionada(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {faenas.map((faena) => (
              <option key={faena.id} value={faena.id}>
                {faena.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de fecha desde */}
        <div>
          <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiCalendar className="mr-1 text-blue-500" /> Desde
          </label>
          <input
            type="date"
            id="fechaDesde"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Selector de fecha hasta */}
        <div>
          <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiCalendar className="mr-1 text-blue-500" /> Hasta
          </label>
          <input
            type="date"
            id="fechaHasta"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-500 flex items-start">
        <FiInfo className="mr-1 mt-0.5 flex-shrink-0" />
        <span>
          Los filtros se aplican a todos los datos mostrados. Para la calculadora de KPIs, solo se utiliza
          la selección de faena.
        </span>
      </div>
    </div>
  );
};

export default KpiFilters;