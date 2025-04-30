import React from "react";
import { FaUser } from "react-icons/fa";

// Componente que renderiza una lista de opciones para seleccionar en el formulario de Bombero
const OptionsFormBombero = ({ items, onItemSelect, buttonStyle = false, mostrarApellido = false, tipoElemento = "personal" }) => {
  // Validar que items sea un array
  if (!Array.isArray(items)) {
    console.error("Se esperaba un array en OptionsFormBombero:", items);
    return (
      <div className="text-red-500 p-3">
        Error: Formato de datos incorrecto
      </div>
    );
  }

  // Función para formatear el nombre completo según sea necesario
  const formatearNombreCompleto = (item) => {
    if (tipoElemento === "personal" && mostrarApellido && item.nombre && item.apellido) {
      return `${item.nombre} ${item.apellido}`;
    } else if (item.nombre) {
      return item.nombre;
    } else {
      return "Sin nombre";
    }
  };

  return (
    <div className={`w-full ${buttonStyle ? 'grid grid-cols-1 gap-2' : 'divide-y divide-gray-200'}`}>
      {items.map((item) => (
        <button
          key={item.id || item.id_personal_interno || item.id_personal_externo || `item-${Math.random()}`}
          onClick={() => onItemSelect(item)}
          className={`w-full text-left transition-all duration-200 flex items-center justify-between group
            ${buttonStyle 
              ? 'bg-white hover:bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow border border-gray-200' 
              : 'py-3 px-4 hover:bg-gray-50'
            }`}
        >
          <div className="flex items-center">
            {/* Avatar o icono condicional SOLO para personal */}
            {tipoElemento === "personal" && (
              <div className={`${buttonStyle ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'} rounded-full w-10 h-10 flex items-center justify-center mr-3`}>
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={formatearNombreCompleto(item)}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <FaUser size={20} />
                )}
              </div>
            )}
            
            {/* Información del elemento */}
            <div className="text-left">
              <p className={`font-medium ${buttonStyle ? 'text-gray-800' : 'text-gray-700'}`}>
                {formatearNombreCompleto(item)}
              </p>
              
              {tipoElemento === "personal" && (
                <div className="text-xs text-gray-500 mt-1">
                  {/* Información adicional basada en la respuesta de la API */}
                  {item.rut && (
                    <p className="mb-0.5">RUT: {item.rut}</p>
                  )}
                  {item.cargo && (
                    <p className="mb-0.5">Cargo: {item.cargo}</p>
                  )}
                  {item.ubicacion && (
                    <p className="mb-0.5">Ubicación: {item.ubicacion}</p>
                  )}
                  {item.empresa && (
                    <p className="mb-0.5">Empresa: {item.empresa}</p>
                  )}
                </div>
              )}
              
              {tipoElemento === "maquinaria" && item.descripcion && (
                <p className="text-xs text-gray-500 mt-1">{item.descripcion}</p>
              )}
            </div>
          </div>

          {/* Icono de selección */}
          <div className={`${buttonStyle ? 'text-gray-400 group-hover:text-orange-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'} transition-all duration-200`}>
            {buttonStyle ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default OptionsFormBombero;