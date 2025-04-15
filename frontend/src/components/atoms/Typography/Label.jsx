import React, { useState } from "react";

/**
 * Componente Label mejorado para formularios con funcionalidades adicionales
 * 
 * @param {string} label - Texto principal del label
 * @param {string} htmlFor - ID del input al que está asociado
 * @param {boolean} required - Indica si el campo es requerido
 * @param {React.ReactNode} icon - Ícono opcional para mostrar junto al label
 * @param {string} tooltip - Texto de ayuda para mostrar en un tooltip
 * @param {string} badge - Texto para mostrar en una badge (ej: "Nuevo", "Beta")
 * @param {string} badgeColor - Color de la badge (default, success, warning, error, info)
 * @param {boolean} disabled - Estado deshabilitado
 * @param {boolean} active - Estado activo/focus del input asociado
 * @param {string} className - Clases adicionales para el componente
 * @param {Function} onHelpClick - Función para ejecutar al hacer clic en el ícono de ayuda
 */
const Label = ({
  label,
  htmlFor,
  required = false,
  icon: Icon = null,
  tooltip = "",
  badge = "",
  badgeColor = "default",
  disabled = false,
  active = false,
  className = "",
  onHelpClick = null
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Configuraciones de color para badges
  const badgeColors = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  };

  return (
    <div className={`flex items-center justify-between mb-2 ${disabled ? 'opacity-60' : ''} ${className}`}>
      <div className="flex items-center gap-1.5">
        {/* Label principal con ícono opcional */}
        <div className="flex items-center gap-1">
          {Icon && (
            <Icon className={`h-4 w-4 ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`} />
          )}
          <label
            htmlFor={disabled ? undefined : htmlFor}
            className={`font-semibold text-sm select-none transition-colors duration-200 
              ${active 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-800 dark:text-gray-200"}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {label}
            
            {/* Indicador de campo requerido */}
            {required && (
              <span className="ml-0.5 text-red-500 dark:text-red-400">*</span>
            )}
          </label>
        </div>
        
        {/* Badge opcional */}
        {badge && (
          <span className={`${badgeColors[badgeColor]} text-xs px-1.5 py-0.5 ml-1.5 rounded-full font-medium`}>
            {badge}
          </span>
        )}
        
        {/* Tooltip opcional */}
        {tooltip && (
          <div className="relative inline-block ml-1">
            <button
              type="button"
              aria-label="Mostrar información"
              onClick={onHelpClick}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="flex items-center justify-center w-4 h-4 text-xs rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute z-10 w-64 p-2 mt-1 text-xs text-left text-white bg-gray-800 rounded-md shadow-lg dark:bg-gray-900">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Slot para botón de ayuda */}
      {onHelpClick && !tooltip && (
        <button
          type="button"
          onClick={onHelpClick}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          disabled={disabled}
        >
          Ayuda
        </button>
      )}
    </div>
  );
};

export default Label;