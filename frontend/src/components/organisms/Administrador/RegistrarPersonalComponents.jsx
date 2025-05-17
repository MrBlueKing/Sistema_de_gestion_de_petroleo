import React from "react";
import { FaUser, FaUsers, FaTruck, FaBuilding, FaInfoCircle } from "react-icons/fa";

/**
 * Componente de alerta para mostrar mensajes de éxito o error
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de alerta ('success' o 'error')
 * @param {string} props.message - Mensaje a mostrar
 */
export const Alert = ({ type, message }) => {
  if (!message) return null;
  
  const styles = {
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800"
  };
  
  return (
    <div className={`border-l-4 p-4 ${styles[type]}`} role="alert">
      <p className="font-medium">{message}</p>
    </div>
  );
};

/**
 * Selector de tipo de formulario con iconos
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.tipos - Tipos disponibles
 * @param {string} props.selected - Tipo seleccionado
 * @param {Function} props.onChange - Función a ejecutar al cambiar selección
 * @param {boolean} props.disabled - Indica si el componente está deshabilitado
 */
export const FormTypeSelector = ({ tipos, selected, onChange, disabled }) => {
  const getIcon = (iconName) => {
    switch (iconName) {
      case "user": return <FaUser className="text-gray-600" />;
      case "users": return <FaUsers className="text-gray-600" />;
      case "truck": return <FaTruck className="text-gray-600" />;
      case "building": return <FaBuilding className="text-gray-600" />;
      default: return null;
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Registro <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tipos.map((tipo) => (
          <div
            key={tipo.value}
            className={`
              relative flex items-center space-x-3 rounded-lg border px-5 py-4 shadow-sm focus-within:ring-2 focus-within:ring-orange-500 
              ${selected === tipo.value 
                ? "bg-orange-50 border-orange-400" 
                : "bg-white border-gray-300"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-orange-300"}
            `}
            onClick={() => !disabled && onChange(tipo.value)}
          >
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full">
              {getIcon(tipo.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">{tipo.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Botones de acción del formulario
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onReset - Función para resetear el formulario
 * @param {Function} props.onSubmit - Función para enviar el formulario
 * @param {boolean} props.isSubmitDisabled - Indica si el botón de envío está deshabilitado
 * @param {boolean} props.loading - Indica si hay una operación en curso
 * @param {boolean} props.editable - Indica si el formulario es editable
 */
export const FormButtons = ({ onReset, onSubmit, isSubmitDisabled, loading, editable }) => {
  return (
    <div className="flex justify-end space-x-3 pt-3">
      {editable ? (
        <>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled || loading}
            className={`
              inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
              ${isSubmitDisabled || loading
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"}
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : "Guardar"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Registrar Nuevo
        </button>
      )}
    </div>
  );
};

/**
 * Caja de información contextual
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la información
 * @param {string} props.children - Contenido de la caja
 */
export const InfoBox = ({ title, children }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-md mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <FaInfoCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          {title && (
            <h3 className="text-sm font-medium text-blue-800">{title}</h3>
          )}
          <div className="mt-2 text-sm text-blue-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};