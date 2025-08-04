import React from "react";
import { FaTimes, FaFilter, FaTrash } from "react-icons/fa";

/**
 * Componente para mostrar y gestionar filtros activos
 * Se integra perfectamente con useTableFilters
 */
const ActiveFiltersBar = ({
  filtros = {},
  configuracionColumnas = {},
  onRemoverFiltro,
  onLimpiarTodos,
  className = "",
  mostrarSiempre = false
}) => {
  const filtrosActivos = Object.entries(filtros).filter(([columna, valor]) => 
    valor && valor.toString().trim() !== ""
  );

  // No mostrar si no hay filtros activos y no está configurado para mostrar siempre
  if (filtrosActivos.length === 0 && !mostrarSiempre) {
    return null;
  }

  const formatearValorFiltro = (columna, valor) => {
    const config = configuracionColumnas[columna];
    
    if (config?.formatear) {
      return config.formatear(valor);
    }
    
    // Formateo por defecto según tipo
    switch (config?.tipoFiltro) {
      case "number":
        const numero = parseFloat(valor);
        return isNaN(numero) ? valor : numero.toLocaleString("es-CL");
      
      case "select":
        return valor;
        
      default:
        return valor.length > 30 ? `${valor.substring(0, 30)}...` : valor;
    }
  };

  const obtenerTituloColumna = (columna) => {
    const config = configuracionColumnas[columna];
    return config?.titulo || columna.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Icono y título */}
        <div className="flex items-center text-blue-700 font-medium text-sm">
          <FaFilter className="mr-2" size={14} />
          Filtros activos:
        </div>

        {/* Filtros individuales */}
        {filtrosActivos.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {filtrosActivos.map(([columna, valor]) => (
                <div
                  key={columna}
                  className="inline-flex items-center bg-white border border-blue-300 rounded-full px-3 py-1 text-sm"
                >
                  <span className="text-blue-800 font-medium mr-1">
                    {obtenerTituloColumna(columna)}:
                  </span>
                  <span className="text-blue-600 mr-2">
                    {formatearValorFiltro(columna, valor)}
                  </span>
                  <button
                    onClick={() => onRemoverFiltro?.(columna)}
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                    title={`Remover filtro de ${obtenerTituloColumna(columna)}`}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Botón limpiar todos */}
            {filtrosActivos.length > 1 && (
              <button
                onClick={onLimpiarTodos}
                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                title="Limpiar todos los filtros"
              >
                <FaTrash className="mr-1" size={12} />
                Limpiar todos
              </button>
            )}
          </>
        ) : (
          <span className="text-blue-600 text-sm italic">
            No hay filtros aplicados
          </span>
        )}
      </div>

      {/* Información adicional */}
      {filtrosActivos.length > 0 && (
        <div className="mt-2 text-xs text-blue-600">
          💡 Haz clic en los filtros individuales para removerlos, o usa "Limpiar todos" para resetear.
        </div>
      )}
    </div>
  );
};

export default ActiveFiltersBar;