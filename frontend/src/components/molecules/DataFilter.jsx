import React, { useState } from "react";
import { FaCalendarAlt, FaSearch, FaEraser, FaFilter } from "react-icons/fa";

const DateFilter = ({ 
  onFilterChange, 
  initialDateFrom = "", 
  initialDateTo = "",
  showQuickFilters = true,
  className = ""
}) => {
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  // Función para obtener fechas rápidas
  const getQuickDates = () => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    return {
      today: formatDate(today),
      yesterday: formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
      weekStart: formatDate(new Date(today.setDate(today.getDate() - today.getDay()))),
      monthStart: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      lastMonth: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      lastMonthEnd: formatDate(new Date(today.getFullYear(), today.getMonth(), 0))
    };
  };

  const quickDates = getQuickDates();

  // Manejar cambio de fecha desde
  const handleDateFromChange = (value) => {
    setDateFrom(value);
    if (onFilterChange) {
      onFilterChange({ dateFrom: value, dateTo });
    }
  };

  // Manejar cambio de fecha hasta
  const handleDateToChange = (value) => {
    setDateTo(value);
    if (onFilterChange) {
      onFilterChange({ dateFrom, dateTo: value });
    }
  };

  // Aplicar filtro rápido
  const applyQuickFilter = (period) => {
    let newDateFrom = "";
    let newDateTo = "";

    switch (period) {
      case "today":
        newDateFrom = quickDates.today;
        newDateTo = quickDates.today;
        break;
      case "yesterday":
        newDateFrom = quickDates.yesterday;
        newDateTo = quickDates.yesterday;
        break;
      case "week":
        newDateFrom = quickDates.weekStart;
        newDateTo = quickDates.today;
        break;
      case "month":
        newDateFrom = quickDates.monthStart;
        newDateTo = quickDates.today;
        break;
      case "lastMonth":
        newDateFrom = quickDates.lastMonth;
        newDateTo = quickDates.lastMonthEnd;
        break;
      default:
        break;
    }

    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
    
    if (onFilterChange) {
      onFilterChange({ dateFrom: newDateFrom, dateTo: newDateTo });
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    if (onFilterChange) {
      onFilterChange({ dateFrom: "", dateTo: "" });
    }
  };

  // Aplicar filtros manualmente
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange({ dateFrom, dateTo });
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8 ${className}`}>
      {/* Header del filtro */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
          <FaFilter className="text-white text-lg" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">📅 Filtros de Fecha</h3>
          <p className="text-gray-600 text-sm">Selecciona el rango de fechas para filtrar los resultados</p>
        </div>
      </div>

      {/* Campos de fecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            Fecha Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" />
            Fecha Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Filtros rápidos */}
      {showQuickFilters && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            🚀 Filtros Rápidos
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyQuickFilter("today")}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Hoy
            </button>
            <button
              onClick={() => applyQuickFilter("yesterday")}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Ayer
            </button>
            <button
              onClick={() => applyQuickFilter("week")}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Esta Semana
            </button>
            <button
              onClick={() => applyQuickFilter("month")}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Este Mes
            </button>
            <button
              onClick={() => applyQuickFilter("lastMonth")}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Mes Anterior
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={applyFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          <FaSearch className="text-sm" />
          Aplicar Filtro
        </button>
        
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
        >
          <FaEraser className="text-sm" />
          Limpiar
        </button>
      </div>

      {/* Indicador de filtro activo */}
      {(dateFrom || dateTo) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <FaFilter className="text-blue-500" />
            <span className="font-medium">Filtro activo:</span>
            {dateFrom && (
              <span>Desde: <strong>{new Date(dateFrom).toLocaleDateString('es-CL')}</strong></span>
            )}
            {dateFrom && dateTo && <span>•</span>}
            {dateTo && (
              <span>Hasta: <strong>{new Date(dateTo).toLocaleDateString('es-CL')}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;