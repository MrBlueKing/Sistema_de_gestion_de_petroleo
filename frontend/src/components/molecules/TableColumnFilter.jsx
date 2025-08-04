import React, { useState, useRef, useEffect } from "react";
import {
  FaFilter,
  FaTimes,
  FaCheck,
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaChevronDown
} from "react-icons/fa";

const TableColumnFilter = ({
  columna,
  titulo,
  tipo = "text", // "text", "select", "number", "date", "range"
  opciones = [], // Para tipo "select"
  valorFiltro = "",
  onFiltroChange,
  onOrdenamientoChange,
  estadoOrdenamiento = null, // "asc", "desc", null
  placeholder = "Filtrar...",
  className = "",
  disabled = false,
  // Configuraciones adicionales
  mostrarConteo = false,
  conteoTotal = 0,
  conteoFiltrado = 0,
  permitirLimpiar = true,
  anchoMinimo = "200px"
}) => {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [valorTemporal, setValorTemporal] = useState(valorFiltro);
  const [busquedaSelect, setBusquedaSelect] = useState("");
  
  const filtroRef = useRef(null);
  const inputRef = useRef(null);

  // Cerrar filtro al hacer click fuera
  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (filtroRef.current && !filtroRef.current.contains(event.target)) {
        setMostrarFiltro(false);
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  // Enfocar input al abrir filtro
  useEffect(() => {
    if (mostrarFiltro && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mostrarFiltro]);

  // Actualizar valor temporal cuando cambia el filtro externo
  useEffect(() => {
    setValorTemporal(valorFiltro);
  }, [valorFiltro]);

  const manejarOrdenamiento = () => {
    if (disabled) return;
    
    let nuevoEstado = "asc";
    if (estadoOrdenamiento === "asc") nuevoEstado = "desc";
    else if (estadoOrdenamiento === "desc") nuevoEstado = null;
    
    onOrdenamientoChange?.(columna, nuevoEstado);
  };

  const aplicarFiltro = () => {
    onFiltroChange?.(columna, valorTemporal);
    setMostrarFiltro(false);
  };

  const limpiarFiltro = () => {
    setValorTemporal("");
    onFiltroChange?.(columna, "");
    setMostrarFiltro(false);
  };

  const manejarEnter = (e) => {
    if (e.key === "Enter") {
      aplicarFiltro();
    } else if (e.key === "Escape") {
      setMostrarFiltro(false);
      setValorTemporal(valorFiltro);
    }
  };

  // Filtrar opciones del select por búsqueda
  const opcionesFiltradas = opciones.filter(opcion => 
    opcion.label?.toLowerCase().includes(busquedaSelect.toLowerCase()) ||
    opcion.value?.toString().toLowerCase().includes(busquedaSelect.toLowerCase())
  );

  const tieneValorFiltro = valorFiltro && valorFiltro.toString().trim() !== "";

  const renderIconoOrdenamiento = () => {
    if (estadoOrdenamiento === "asc") return <FaSortUp className="text-blue-500" />;
    if (estadoOrdenamiento === "desc") return <FaSortDown className="text-blue-500" />;
    return <FaSort className="text-gray-400 group-hover:text-gray-600" />;
  };

  const renderFiltroContent = () => {
    switch (tipo) {
      case "select":
        return (
          <div className="space-y-2">
            {opciones.length > 10 && (
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Buscar opción..."
                  value={busquedaSelect}
                  onChange={(e) => setBusquedaSelect(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <div className="max-h-40 overflow-y-auto">
              <div
                className={`p-2 hover:bg-gray-100 cursor-pointer text-sm rounded ${
                  !valorTemporal ? "bg-blue-50 text-blue-700" : ""
                }`}
                onClick={() => setValorTemporal("")}
              >
                <span className="flex items-center">
                  {!valorTemporal && <FaCheck className="mr-2 text-blue-500" />}
                  Todos
                </span>
              </div>
              {opcionesFiltradas.map((opcion) => (
                <div
                  key={opcion.value}
                  className={`p-2 hover:bg-gray-100 cursor-pointer text-sm rounded ${
                    valorTemporal === opcion.value ? "bg-blue-50 text-blue-700" : ""
                  }`}
                  onClick={() => setValorTemporal(opcion.value)}
                >
                  <span className="flex items-center">
                    {valorTemporal === opcion.value && <FaCheck className="mr-2 text-blue-500" />}
                    {opcion.label || opcion.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "number":
      case "range":
        return (
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="number"
              placeholder={placeholder}
              value={valorTemporal}
              onChange={(e) => setValorTemporal(e.target.value)}
              onKeyDown={manejarEnter}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="date"
              value={valorTemporal}
              onChange={(e) => setValorTemporal(e.target.value)}
              onKeyDown={manejarEnter}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      default: // text
        return (
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={valorTemporal}
              onChange={(e) => setValorTemporal(e.target.value)}
              onKeyDown={manejarEnter}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`} ref={filtroRef}>
      {/* Header de columna */}
      <div className="flex items-center justify-between group">
        <div className="flex items-center flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
            {titulo}
          </span>
          {mostrarConteo && (
            <span className="ml-1 text-xs text-gray-400">
              ({conteoFiltrado}/{conteoTotal})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 ml-2">
          {/* Botón de filtro */}
          <button
            onClick={() => setMostrarFiltro(!mostrarFiltro)}
            disabled={disabled}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${tieneValorFiltro ? "text-blue-500" : "text-gray-400"}`}
            title="Filtrar columna"
          >
            <FaFilter size={12} />
          </button>

          {/* Botón de ordenamiento */}
          <button
            onClick={manejarOrdenamiento}
            disabled={disabled}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Ordenar columna"
          >
            {renderIconoOrdenamiento()}
          </button>
        </div>
      </div>

      {/* Dropdown de filtro */}
      {mostrarFiltro && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          style={{ minWidth: anchoMinimo, maxWidth: "300px" }}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Filtrar {titulo}
              </span>
              <button
                onClick={() => setMostrarFiltro(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {renderFiltroContent()}

            {/* Botones de acción */}
            <div className="flex justify-between mt-3 gap-2">
              {permitirLimpiar && (
                <button
                  onClick={limpiarFiltro}
                  className="flex-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={aplicarFiltro}
                className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableColumnFilter;