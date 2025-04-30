import React from "react";

const TabProgressBar = ({ activeTab }) => {
  // Definimos los tabs en orden
  const tabs = [
    { id: "tipoSolicitante", name: "Tipo", icon: "👤" },
    { id: "solicitante", name: "Solicitante", icon: "👥" },
    { id: "maquinaria", name: "Maquinaria", icon: "🚜" },
    { id: "patente", name: "Patente", icon: "🔢" },
    { id: "consumo", name: "Consumo", icon: "⛽" },
  ];

  // Encontrar el índice del tab activo
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <div className="w-full relative z-0"> {/* z-index 0 para que esté por debajo del header */}
      {/* Barra de progreso principal */}
      <div className="relative flex items-center justify-between mb-8 xs:mb-10 sm:mb-12">
        {/* Línea de conexión base - ajustada para dar espacio a los nombres */}
        <div className="absolute h-1 bg-white/40 rounded-full w-full top-5 xs:top-6 sm:top-8 md:top-9 z-0"></div>

        {/* Línea de progreso actual */}
        <div 
          className="absolute h-1 bg-white rounded-full w-full top-5 xs:top-6 sm:top-8 md:top-9 transition-all duration-500 ease-in-out z-0"
          style={{
            width: `${activeIndex === 0 ? 0 : ((activeIndex) / (tabs.length - 1)) * 100}%`,
          }}
        ></div>

        {/* Puntos de paso con íconos */}
        {tabs.map((tab, index) => (
          <div 
            key={tab.id}
            className="flex flex-col items-center relative z-0 transition-all duration-300" /* z-index 0 */
            style={{ 
              // Asegurar que cada elemento ocupe la misma cantidad de espacio
              width: `${100 / tabs.length}%`,
              maxWidth: "100px" 
            }}
          >
            {/* Círculo de fondo con ícono */}
            <div 
              className={`
                w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 md:w-[70px] md:h-[70px] rounded-full 
                flex items-center justify-center
                transition-all duration-300 ease-out 
                border-2 relative
                ${index < activeIndex 
                  ? "bg-white border-white text-orange-500" 
                  : index === activeIndex
                    ? "bg-white border-white text-orange-500 scale-110 shadow-md" 
                    : "bg-white/20 border-white/40 text-white"
                }
              `}
            >
              {/* Estado completado (check) o icono normal */}
              {index < activeIndex ? (
                <div className="text-orange-500 text-base xs:text-lg sm:text-xl md:text-2xl transition-all font-bold">
                  ✓
                </div>
              ) : (
                <div className={`text-lg xs:text-xl sm:text-2xl md:text-3xl ${index === activeIndex ? "scale-105" : "opacity-70"} transition-all`}>
                  {tab.icon}
                </div>
              )}
              
              {/* Número de paso encima del círculo */}
              <div 
                className={`
                  absolute -top-2 -right-2 w-5 h-5 xs:w-6 xs:h-6 rounded-full 
                  flex items-center justify-center 
                  text-xs xs:text-sm font-bold
                  border border-white/80
                  ${index <= activeIndex 
                    ? "bg-orange-500 text-white" 
                    : "bg-white/30 text-white"
                  }
                `}
              >
                {index + 1}
              </div>
            </div>
            
            {/* Nombre del paso debajo del círculo */}
            <div className="mt-2 w-full flex flex-col items-center">
              <span 
                className={`
                  text-[10px] xs:text-xs sm:text-sm md:text-base 
                  transition-all duration-300 drop-shadow-sm 
                  font-medium text-center leading-tight
                  mx-auto px-1
                  ${index <= activeIndex 
                    ? "text-white" 
                    : "text-white/70"
                  }
                `}
              >
                {tab.name}
              </span>
              
              {/* Indicador para el paso activo */}
              {index === activeIndex && (
                <div className="w-4 h-1 bg-white rounded-full mt-1 hidden xs:block"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Información contextual del paso - ajustada más abajo */}
      <div className="flex justify-center -mt-6 xs:-mt-5 sm:-mt-4">
        <div 
          className={`
            text-white text-xs xs:text-sm md:text-base 
            font-medium drop-shadow-sm py-1 px-3 
            rounded-full transition-all duration-300
            ${activeIndex <= tabs.length / 2 ? 'bg-orange-600/40' : 'bg-orange-700/40'}
          `}
        >
          {activeIndex === 0 && "Seleccione tipo de solicitante"}
          {activeIndex === 1 && "Seleccione usuario de la lista"}
          {activeIndex === 2 && "Elija el tipo de maquinaria"}
          {activeIndex === 3 && "Seleccione la patente del vehículo"}
          {activeIndex === 4 && "Complete los detalles del consumo"}
        </div>
      </div>
    </div>
  );
};

export default TabProgressBar;