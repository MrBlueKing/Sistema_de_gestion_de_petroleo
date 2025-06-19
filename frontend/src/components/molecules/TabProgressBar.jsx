import React from "react";
// Importamos los iconos relevantes para industria minera/petróleo
import { 
  FaHardHat, // Para tipo de solicitante (trabajador con casco)
  FaUsers, // Para solicitante (grupo de usuarios)
  FaTruck, // Para maquinaria (camión minero)
  FaIdCard, // Para patente (identificación)
  FaGasPump, // Para consumo (bomba de combustible)
  FaCheck // Para pasos completados
} from "react-icons/fa";

const TabProgressBar = ({ activeTab }) => {
  // Definimos los tabs en orden con iconos más contextualizados y textos mejorados
  const tabs = [
    { 
      id: "tipoSolicitante", 
      name: "Tipo", 
      fullName: "Tipo de Solicitante",
      icon: <FaHardHat />,
      description: "Seleccione si es personal interno o externo"
    },
    { 
      id: "solicitante", 
      name: "Personal", 
      fullName: "Seleccionar Personal",
      icon: <FaUsers />,
      description: "Elija a la persona que solicita el combustible"
    },
    { 
      id: "maquinaria", 
      name: "Operación", 
      fullName: "Tipo de Operación",
      icon: <FaTruck />,
      description: "Seleccione el tipo de maquinaria"
    },
    { 
      id: "patente", 
      name: "Máquina", 
      fullName: "Seleccionar Máquina",
      icon: <FaIdCard />,
      description: "Elija la máquina que realizará la operación"
    },
    { 
      id: "consumo", 
      name: "Consumo", 
      fullName: "Registrar Consumo",
      icon: <FaGasPump />,
      description: "Complete los detalles del combustible"
    },
  ];

  // Encontrar el índice del tab activo
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const progressPercentage = activeIndex === 0 ? 0 : ((activeIndex) / (tabs.length - 1)) * 100;

  return (
    <div className="w-full relative z-0 px-2">
      {/* Contenedor principal del progreso */}
      <div className="relative flex items-start justify-between mb-6 sm:mb-8">
        
        {/* ✅ LÍNEA DE PROGRESO MEJORADA PARA FONDO NARANJA */}
        <div className="absolute h-2 bg-white/20 rounded-full w-full top-6 sm:top-8 z-0 shadow-inner"></div>
        
        {/* Línea de progreso activa optimizada para fondo naranja */}
        <div 
          className="absolute h-2 bg-white rounded-full top-6 sm:top-8 transition-all duration-700 ease-out z-0 shadow-lg"
          style={{ width: `${progressPercentage}%` }}
        ></div>

        {/* ✅ PASOS MEJORADOS */}
        {tabs.map((tab, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div 
              key={tab.id}
              className="flex flex-col items-center relative z-10 transition-all duration-500"
              style={{ width: `${100 / tabs.length}%` }}
            >
              {/* ✅ CÍRCULO PRINCIPAL CON ESTADOS MEJORADOS */}
              <div className="relative group">
                <div 
                  className={`
                    w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full 
                    flex items-center justify-center
                    transition-all duration-500 ease-out 
                    border-3 relative transform
                    ${isCompleted 
                      ? "bg-white border-white text-green-600 scale-100 shadow-xl" 
                      : isActive
                        ? "bg-white border-white text-orange-600 scale-110 shadow-2xl ring-4 ring-white/30" 
                        : "bg-orange-400/30 border-white/60 text-white scale-90 hover:scale-95 hover:bg-orange-400/40"
                    }
                  `}
                >
                  {/* ✅ ICONOS CON ANIMACIONES */}
                  {isCompleted ? (
                    <div className="text-green-600 text-lg sm:text-xl md:text-2xl transition-all duration-300 animate-bounce-once">
                      <FaCheck />
                    </div>
                  ) : (
                    <div className={`
                      text-lg sm:text-xl md:text-2xl transition-all duration-300
                      ${isActive ? "animate-pulse-slow" : ""}
                    `}>
                      {tab.icon}
                    </div>
                  )}
                  
                  {/* ✅ NÚMERO DE PASO OPTIMIZADO PARA FONDO NARANJA */}
                  <div 
                    className={`
                      absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full 
                      flex items-center justify-center 
                      text-xs sm:text-sm font-bold
                      border-2 border-white transition-all duration-300
                      ${isCompleted
                        ? "bg-green-500 text-white shadow-lg" 
                        : isActive
                          ? "bg-orange-600 text-white shadow-xl scale-110 ring-2 ring-white/50" 
                          : "bg-orange-400/60 text-white border-white/80"
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  {/* ✅ EFECTO DE RESPLANDOR SUTIL PARA FONDO NARANJA */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-75"></div>
                  )}
                </div>

                {/* ✅ TOOLTIP MEJORADO PARA FONDO NARANJA */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap hidden md:block z-20 shadow-xl border border-white/20">
                  {tab.fullName}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
                </div>
              </div>
              
              {/* ✅ NOMBRE DEL PASO CON MEJOR RESPONSIVE */}
              <div className="mt-3 w-full flex flex-col items-center">
                <span 
                  className={`
                    text-xs sm:text-sm md:text-base 
                    transition-all duration-300 drop-shadow-sm 
                    font-semibold text-center leading-tight
                    px-1 max-w-full
                    ${isCompleted
                      ? "text-white" 
                      : isActive
                        ? "text-white text-shadow-lg" 
                        : "text-white/60"
                    }
                  `}
                >
                  {tab.name}
                </span>
                
                {/* ✅ INDICADOR ACTIVO OPTIMIZADO */}
                {isActive && (
                  <div className="w-8 h-1 bg-white rounded-full mt-2 shadow-lg animate-fade-in"></div>
                )}

                {/* ✅ ESTADO COMPLETADO VISIBLE */}
                {isCompleted && (
                  <div className="w-2 h-2 bg-white rounded-full mt-1 animate-fade-in shadow-sm"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ INFORMACIÓN CONTEXTUAL OPTIMIZADA PARA FONDO NARANJA */}
      <div className="flex justify-center mt-2">
        <div 
          className={`
            text-white text-xs sm:text-sm md:text-base 
            font-semibold drop-shadow-lg py-2 px-4 
            rounded-full transition-all duration-500
            backdrop-blur-sm border border-white/30
            bg-orange-700/60 shadow-lg
            hover:scale-105 transform hover:bg-orange-700/70
          `}
        >
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {tabs[activeIndex]?.description || "Paso no definido"}
          </span>
        </div>
      </div>

      {/* ✅ INDICADOR DE PROGRESO NUMÉRICO MEJORADO */}
      <div className="flex justify-center mt-3">
        <div className="text-white/90 text-xs sm:text-sm font-semibold bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
          {activeIndex + 1} de {tabs.length} pasos
        </div>
      </div>
    </div>
  );
};

export default TabProgressBar;