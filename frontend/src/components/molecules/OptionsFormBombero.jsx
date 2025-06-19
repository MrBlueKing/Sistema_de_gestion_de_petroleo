import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaTruck, FaIndustry, FaIdCard } from "react-icons/fa";

// Componente que renderiza una lista de opciones para seleccionar en el formulario de Bombero
// Con altura fija para evitar cambios de tamaño al buscar
const OptionsFormBombero = ({ 
  items, 
  onItemSelect, 
  buttonStyle = false, 
  mostrarApellido = false, 
  tipoElemento = "personal",
  maxHeight = "350px" // Altura fija
}) => {
  // Validar que items sea un array
  if (!Array.isArray(items)) {
    console.error("Se esperaba un array en OptionsFormBombero:", items);
    return (
      <div className="text-red-500 p-3">
        Error: Formato de datos incorrecto
      </div>
    );
  }

  // Estados para funcionalidad de scroll y tracking
  const [isScrollable, setIsScrollable] = useState(false);
  const listRef = useRef(null);
  // ✅ ELIMINADO: showScrollIndicator para evitar salto visual
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Detectar si el contenedor necesita scroll
  useEffect(() => {
    const checkIfScrollable = () => {
      if (listRef.current) {
        const { scrollHeight, clientHeight } = listRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    checkIfScrollable();
    // Re-verificar cuando cambia el tamaño de la ventana
    window.addEventListener('resize', checkIfScrollable);
    
    // Limpiar el event listener
    return () => window.removeEventListener('resize', checkIfScrollable);
  }, [items]);

  // ✅ ELIMINADO: Timer que causaba el salto visual

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

  // 🎨 FUNCIÓN MEJORADA PARA ICONOS CON SOPORTE PERSONALIZADO
  const getIcon = (item) => {
    // 🆕 PRIORIDAD 1: Si el item tiene un icono personalizado, usarlo
    if (item.icon) {
      return React.cloneElement(item.icon, { size: 20 });
    }

    // 🆕 PRIORIDAD 2: Si es tipo maquinaria, usar iconos según el nombre
    if (tipoElemento === "maquinaria" || tipoElemento === "tipo de operación" || tipoElemento === "tipo de camión") {
      const nombre = (item.nombre || '').toLowerCase();
      
      if (nombre.includes('dumper') || nombre.includes('camión')) {
        return <FaTruck size={20} className="text-orange-500" />;
      }
      if (nombre.includes('camioneta')) {
        return <FaTruck size={20} className="text-blue-500" />;
      }
      if (nombre.includes('n/a') || nombre === 'n/a' || nombre.includes('otros')) {
        return <FaIndustry size={20} className="text-slate-600" />;
      }
      if (nombre.includes('estanque')) {
        return <FaIndustry size={20} className="text-green-600" />;
      }
    }

    // 🆕 PRIORIDAD 3: Lógica original según tipoElemento
    const tipo = item.tipo || tipoElemento;

    switch (tipo) {
      case "personal":
        return <FaUser size={20} />;
      case "maquinaria":
      case "tipo de operación":
      case "tipo de camión":
      case "máquina":
        return <FaTruck size={20} />;
      case "patente":
      case "departamento":
        return <FaIdCard size={20} />;
      default:
        return <FaTruck size={20} />;
    }
  };

  // Manejador de selección con feedback visual
  const handleItemSelect = (item) => {
    setSelectedItemId(item.id || item.id_personal_interno || item.id_personal_externo);
    onItemSelect(item);
  };

  return (
    <div className="w-full flex flex-col">
      {/* ✅ CONTENEDOR CON ALTURA FIJA - Sin espacio adicional */}
      <div className="w-full" style={{ height: maxHeight }}>
        {/* Contenedor de la lista con scroll */}
        <div 
          ref={listRef}
          className={`w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${buttonStyle ? 'grid grid-cols-1 gap-2 p-1' : 'divide-y divide-gray-200'}`}
        >
          {items.length > 0 ? (
            items.map((item) => {
              const itemId = item.id || item.id_personal_interno || item.id_personal_externo || `item-${Math.random()}`;
              const isSelected = itemId === selectedItemId;
              
              return (
                <button
                  key={itemId}
                  onClick={() => handleItemSelect(item)}
                  className={`w-full text-left transition-all duration-200 flex items-center justify-between group
                    ${buttonStyle 
                      ? `bg-white hover:bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow border ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}` 
                      : `py-3 px-4 hover:bg-gray-50 ${isSelected ? 'bg-orange-50' : ''}`
                    }`}
                >
                  <div className="flex items-center">
                    {/* Avatar o icono condicional según el tipo de elemento */}
                    <div className={`${buttonStyle ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'} 
                      ${isSelected ? 'bg-orange-200 text-orange-600' : ''}
                      rounded-full w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0`}>
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={formatearNombreCompleto(item)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        getIcon(item)
                      )}
                    </div>
                    
                    {/* Información del elemento */}
                    <div className="text-left min-w-0 flex-1">
                      <p className={`font-medium ${buttonStyle ? 'text-gray-800' : 'text-gray-700'} truncate`}>
                        {formatearNombreCompleto(item)}
                      </p>
                      
                      {tipoElemento === "personal" && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {/* Información adicional basada en la respuesta de la API */}
                          {item.rut && (
                            <p className="truncate">RUT: {item.rut}</p>
                          )}
                          {item.cargo && (
                            <p className="truncate">Cargo: {item.cargo}</p>
                          )}
                          {item.ubicacion && (
                            <p className="truncate">Ubicación: {item.ubicacion}</p>
                          )}
                          {item.empresa && (
                            <p className="truncate">Empresa: {item.empresa}</p>
                          )}
                        </div>
                      )}
                      
                      {/* 🆕 MEJORADO: Mostrar descripción para cualquier tipo que la tenga */}
                      {(tipoElemento === "maquinaria" || tipoElemento === "tipo de operación" || tipoElemento === "tipo de camión" || tipoElemento === "patente" || tipoElemento === "máquina") && item.descripcion && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{item.descripcion}</p>
                      )}
                    </div>
                  </div>

                  {/* Icono de selección */}
                  <div className={`${buttonStyle ? 'text-gray-400 group-hover:text-orange-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'} transition-all duration-200 flex-shrink-0 ml-2`}>
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
              );
            })
          ) : (
            // Estado vacío con mensaje cuando no hay resultados
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center p-4">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p>No se encontraron resultados</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ INDICADOR DE SCROLL FIJO (opcional y sin salto) */}
      {isScrollable && items.length > 5 && (
        <div className="text-center text-gray-400 text-xs mt-1 h-4">
          <div className="flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span>Scroll para ver más</span>
          </div>
        </div>
      )}
      
      {/* ✅ CONTADOR DE ELEMENTOS FIJO (sin salto) */}
      {items.length > 0 && (
        <div className="text-gray-400 text-xs mt-1 text-right h-4">
          {items.length} {tipoElemento === "personal" ? "usuarios" : "elementos"}
        </div>
      )}
    </div>
  );
};

export default OptionsFormBombero;