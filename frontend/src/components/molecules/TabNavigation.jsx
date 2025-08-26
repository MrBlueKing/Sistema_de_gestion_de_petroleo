import React from 'react';
import {
    FaListAlt,
    FaUsers,
    FaTruckPickup ,
    FaPlus,
    FaCogs,
    FaGasPump // ✅ Agregado el import
} from 'react-icons/fa';

// 🎨 Mapeo de iconos por nombre
const iconMap = {
    FaListAlt: FaListAlt,
    FaTruckPickup : FaTruckPickup ,
    FaUsers: FaUsers,
    FaPlus: FaPlus,
    FaCogs: FaCogs,
    FaGasPump: FaGasPump // ✅ Agregado el nuevo icono
};

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
                {/* Navegación principal */}
                <div className="flex h-16">
                    {tabs.map((tab, index) => {
                        const IconComponent = iconMap[tab.icon];
                        const isActive = activeTab === tab.id;
                        
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                                    relative flex-1 flex items-center justify-center gap-3 px-6 py-4 
                                    text-sm font-medium transition-all duration-300 ease-in-out
                                    hover:bg-gray-50 group
                                    ${isActive
                                        ? 'text-orange-600 bg-gradient-to-b from-orange-50/50 to-orange-50/20'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                                `}
                                title={tab.description}
                            >
                                {/* Icono con efecto */}
                                <span className={`
                                    text-lg transition-all duration-300 transform
                                    ${isActive 
                                        ? 'text-orange-600 scale-110' 
                                        : 'text-gray-500 group-hover:text-orange-500 group-hover:scale-105'
                                    }
                                `}>
                                    {IconComponent && <IconComponent />}
                                </span>
                                
                                {/* Texto */}
                                <span className="font-semibold tracking-wide">
                                    {tab.label}
                                </span>

                                {/* Contador de sección mejorado */}
                                <span className={`
                                    ml-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-300
                                    ${isActive
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                                        : 'bg-gray-200 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                                    }
                                `}>
                                    {index + 1}
                                </span>

                                {/* Indicador activo superior */}
                                <div className={`
                                    absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-300
                                    ${isActive 
                                        ? 'w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full shadow-lg shadow-orange-500/40' 
                                        : 'w-0 h-1 bg-orange-500'
                                    }
                                `}></div>

                                {/* Efecto de brillo sutil para botón activo */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent opacity-50"></div>
                                )}

                                {/* Separador entre botones */}
                                {index < tabs.length - 1 && (
                                    <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gray-200"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TabNavigation;