import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FiFilter,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";

const UniversalTableFilter = ({
  // Props básicas
  titulo,
  columna,
  tipo = "select", // "text", "select", "number", "multiselect"
  
  // Para filtros
  valorFiltro = "",
  onFiltroChange,
  opciones = [], // Para tipo "select" y "multiselect"
  placeholder = "",
  
  // Para ordenamiento
  onOrdenamientoChange,
  ordenColumna = null,
  direccionOrden = null,
  
  // Configuración visual
  className = "",
  disabled = false,
  anchoMinimo = "200px",
  
  // Configuración adicional
  permitirLimpiar = true,
  mostrarBusqueda = false, // Para filtros select con muchas opciones
  caseSensitive = false, // Para filtros de texto
  
  // 🆕 NUEVO: Para multiselect
  esMultiple = false, // Habilitar selección múltiple
  separadorMultiple = ",", // Separador para valores múltiples
}) => {
  // Estados locales
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [valorTemporal, setValorTemporal] = useState(valorFiltro);
  const [busquedaSelect, setBusquedaSelect] = useState("");
  
  // Refs
  const filtroRef = useRef(null);
  const inputRef = useRef(null);

  // Cerrar filtro al hacer click fuera
  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (filtroRef.current && !filtroRef.current.contains(event.target)) {
        setMostrarFiltro(false);
        setBusquedaSelect("");
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  // Sincronizar valor temporal con valor externo
  useEffect(() => {
    setValorTemporal(valorFiltro);
  }, [valorFiltro]);

  // Enfocar input al abrir filtro
  useEffect(() => {
    if (mostrarFiltro && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mostrarFiltro]);

  // Manejar ordenamiento
  const manejarOrdenamiento = () => {
    if (disabled || !onOrdenamientoChange) return;
    
    let nuevoEstado = "asc";
    if (ordenColumna === columna) {
      if (direccionOrden === "asc") nuevoEstado = "desc";
      else if (direccionOrden === "desc") nuevoEstado = null;
    }
    
    onOrdenamientoChange(columna, nuevoEstado);
  };

  // Aplicar filtro
  const aplicarFiltro = (valorEspecifico = null) => {
    const valorFinal = valorEspecifico !== null ? valorEspecifico : valorTemporal;
    if (onFiltroChange) {
      onFiltroChange(columna, valorFinal);
    }
    setMostrarFiltro(false);
    setBusquedaSelect("");
  };

  // Limpiar filtro
  const limpiarFiltro = () => {
    setValorTemporal("");
    if (onFiltroChange) {
      onFiltroChange(columna, "");
    }
    setMostrarFiltro(false);
    setBusquedaSelect("");
  };

  // Manejar Enter en inputs
  const manejarKeyPress = (e) => {
    if (e.key === "Enter") {
      aplicarFiltro();
    } else if (e.key === "Escape") {
      setMostrarFiltro(false);
      setBusquedaSelect("");
    }
  };

  // Filtrar opciones del select
  const opcionesFiltradas = useMemo(() => {
    if (!mostrarBusqueda || !busquedaSelect) return opciones;
    
    return opciones.filter(opcion => 
      opcion.toString().toLowerCase().includes(busquedaSelect.toLowerCase())
    );
  }, [opciones, busquedaSelect, mostrarBusqueda]);

  // 🆕 Estados para multiselect
  const valoresSeleccionados = useMemo(() => {
    if (!esMultiple || !valorFiltro) return [];
    return valorFiltro.split(separadorMultiple).filter(v => v.trim() !== "");
  }, [valorFiltro, esMultiple, separadorMultiple]);

  // 🆕 Función para manejar selección múltiple
  const manejarSeleccionMultiple = (opcion) => {
    let nuevosValores;
    
    if (valoresSeleccionados.includes(opcion)) {
      // Quitar si ya está seleccionado
      nuevosValores = valoresSeleccionados.filter(v => v !== opcion);
    } else {
      // Agregar si no está seleccionado
      nuevosValores = [...valoresSeleccionados, opcion];
    }
    
    const valorFinal = nuevosValores.join(separadorMultiple);
    if (onFiltroChange) {
      onFiltroChange(columna, valorFinal);
    }
  };

  // Renderizar ícono de ordenamiento
  const renderIconoOrdenamiento = () => {
    if (!onOrdenamientoChange) return null;
    
    if (ordenColumna !== columna) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return direccionOrden === "asc" ? (
      <FiChevronUp className="inline ml-1 text-blue-600" />
    ) : (
      <FiChevronDown className="inline ml-1 text-blue-600" />
    );
  };

  // Renderizar contenido del filtro según tipo
  const renderContenidoFiltro = () => {
    switch (tipo) {
      case "text":
        return (
          <div>
            <input
              ref={inputRef}
              type="text"
              value={valorTemporal}
              onChange={(e) => setValorTemporal(e.target.value)}
              onKeyPress={manejarKeyPress}
              placeholder={placeholder || `Buscar ${titulo.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case "number":
        return (
          <div>
            <input
              ref={inputRef}
              type="number"
              value={valorTemporal}
              onChange={(e) => setValorTemporal(e.target.value)}
              onKeyPress={manejarKeyPress}
              placeholder={placeholder || `Filtrar ${titulo.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case "select":
        return (
          <div className="max-h-64 overflow-hidden">
            {/* 🆕 Indicador de selección múltiple */}
            {esMultiple && valoresSeleccionados.length > 0 && (
              <div className="pb-2 mb-2 border-b">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  {valoresSeleccionados.length} seleccionado{valoresSeleccionados.length !== 1 ? 's' : ''}
                </div>
               
              </div>
            )}

            {/* Búsqueda dentro del select */}
            {mostrarBusqueda && opciones.length > 10 && (
              <div className="pb-2 mb-2 border-b">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={busquedaSelect}
                    onChange={(e) => setBusquedaSelect(e.target.value)}
                    placeholder="Buscar opción..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            {/* Opciones */}
            <div className="max-h-48 overflow-y-auto">
              {/* Opción "Todos" - Solo para selección simple */}
              {!esMultiple && (
                <div
                  className={`p-2 text-sm cursor-pointer hover:bg-gray-100 rounded ${
                    valorFiltro === "" ? "bg-blue-50 text-blue-600 font-medium" : ""
                  }`}
                  onClick={() => {
                    if (onFiltroChange) {
                      onFiltroChange(columna, "");
                    }
                    setMostrarFiltro(false);
                    setBusquedaSelect("");
                  }}
                >
                  Todos
                </div>
              )}

              {/* 🆕 Opción "Limpiar" para multiselect */}
              {esMultiple && valoresSeleccionados.length > 0 && (
                <div
                  className="p-2 text-sm cursor-pointer hover:bg-red-50 rounded text-red-600 border-b mb-2"
                  onClick={() => {
                    if (onFiltroChange) {
                      onFiltroChange(columna, "");
                    }
                  }}
                >
                  🗑️ Limpiar selección
                </div>
              )}
              
              {/* Opciones filtradas */}
              {opcionesFiltradas.length > 0 ? (
                opcionesFiltradas.map((opcion, index) => {
                  const estaSeleccionado = esMultiple 
                    ? valoresSeleccionados.includes(opcion)
                    : valorFiltro === opcion;
                    
                  return (
                    <div
                      key={`${opcion}-${index}`}
                      className={`p-2 text-sm cursor-pointer hover:bg-gray-100 rounded flex items-center justify-between ${
                        estaSeleccionado ? "bg-blue-50 text-blue-600 font-medium" : ""
                      }`}
                      onClick={() => {
                        if (esMultiple) {
                          manejarSeleccionMultiple(opcion);
                        } else {
                          if (onFiltroChange) {
                            onFiltroChange(columna, opcion);
                          }
                          setMostrarFiltro(false);
                          setBusquedaSelect("");
                        }
                      }}
                    >
                      <span>{opcion}</span>
                      {esMultiple && (
                        <span className="ml-2">
                          {estaSeleccionado ? "✓" : ""}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-2 text-sm text-gray-500 italic">
                  No se encontraron opciones
                </div>
              )}
            </div>

            {/* 🆕 Footer para multiselect */}
            {esMultiple && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={() => {
                    setMostrarFiltro(false);
                    setBusquedaSelect("");
                  }}
                  className="w-full px-3 py-1.5 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                >
                  Aplicar ({valoresSeleccionados.length})
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Verificar si hay valor en el filtro
  const tieneValorFiltro = valorFiltro && valorFiltro !== "";
  const conteoSeleccionados = esMultiple ? valoresSeleccionados.length : 0;

  return (
    <div className={`relative ${className}`} ref={filtroRef}>
      {/* Header de la columna */}
      <div className="flex items-center justify-between">
        {/* Título con ordenamiento */}
        <div
          className={`flex items-center ${
            onOrdenamientoChange ? "cursor-pointer hover:text-blue-600" : ""
          } ${disabled ? "opacity-50" : ""}`}
          onClick={onOrdenamientoChange ? manejarOrdenamiento : undefined}
        >
          <span className="select-none">{titulo}</span>
          {renderIconoOrdenamiento()}
        </div>

        {/* Botón de filtro */}
        {onFiltroChange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMostrarFiltro(!mostrarFiltro);
            }}
            disabled={disabled}
            className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors relative ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${tieneValorFiltro ? "text-blue-600" : "text-gray-400"}`}
            title={`Filtrar ${titulo}`}
          >
            <FiFilter size={12} />
            {/* 🆕 Badge con conteo para multiselect */}
            {esMultiple && conteoSeleccionados > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {conteoSeleccionados > 9 ? '9+' : conteoSeleccionados}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Dropdown de filtro */}
      {mostrarFiltro && onFiltroChange && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          style={{ minWidth: anchoMinimo, maxWidth: "320px" }}
        >
          <div className="p-3">
            {/* Header del dropdown */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Filtrar {titulo}
              </span>
              <button
                onClick={() => {
                  setMostrarFiltro(false);
                  setBusquedaSelect("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Contenido del filtro */}
            {renderContenidoFiltro()}

            {/* Botones de acción (solo para text y number) */}
            {(tipo === "text" || tipo === "number") && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalTableFilter;