import React from "react";
import {
  FiTruck,
  FiBarChart2,
  FiDroplet,
  FiSettings,
  FiFileText,
  FiUsers,
  FiMapPin,
  FiDollarSign,
  FiTool,
  FiActivity,
  FiShield,
  FiClock
} from "react-icons/fi";
import { BsClockHistory } from "react-icons/bs";
import { FaGasPump } from "react-icons/fa";

const Main = () => {
  const navigationItems = [
    // ÁREA DE COMBUSTIBLE - Dashboard principal
    {
      title: "Dashboard Operacional",
      description: "Monitoreo integral de combustible",
      icon: <FiActivity className="w-10 h-10 text-blue-600" />,
      path: "/gerente/graficos",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
      enabled: true
    },
    // ÁREA DE PRODUCCIÓN - DESHABILITADO
    {
      title: "Gestión de Producción",
      description: "Tonelajes, padrones, plantas y metas de producción",
      subtitle: "Próximamente",
      icon: <FiTruck className="w-10 h-10 text-gray-400" />,
      path: "/gerente/produccion",
      color: "bg-gray-50 border-gray-200 cursor-not-allowed",
      enabled: false
    },
    // ÁREA OPERACIONAL RECEPCION PETROLEO
    {
      title: "Gestión de Ingresos",
      description: "Comprobación de Recepción",
      icon: <FaGasPump className="w-10 h-10 text-emerald-600" />,
      path: "/gerente/VerificacionIngresos",
      color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300",
      enabled: true
    },
    {
      title: "Gestión de Consumo",
      description: "Histórico de consumo por máquina",
      icon: <BsClockHistory className="w-10 h-10 text-amber-600" />,
      path: "/gerente/consumo-historial",
      color: "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300",
      enabled: true
    },
  ];

  const handleNavigation = (path, enabled) => {
    if (enabled) {
      window.location.href = path;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Centro de Control Gerencial
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Sistema integral de gestión operacional para supervisión y control de todas las áreas de Minera 3H
        </p>
      </div>

      {/* Áreas organizadas por categorías */}
      <div className="mb-8">
        {/* Producción y Operaciones */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-l-4 border-blue-500 pl-3">
            Producción y Operaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navigationItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(item.path, item.enabled)}
                className={`flex flex-col items-center p-6 rounded-lg shadow-md border ${item.color}
                           ${item.enabled 
                             ? 'transition-all duration-300 transform hover:scale-105 cursor-pointer hover:shadow-lg' 
                             : 'opacity-60'
                           }`}
              >
                <div className="p-3 rounded-full mb-4 relative">
                  {item.icon}
                  {!item.enabled && (
                    <div className="absolute -top-1 -right-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Próximamente
                      </span>
                    </div>
                  )}
                </div>
                
                <h3 className={`text-lg font-bold mb-2 text-center ${
                  item.enabled ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {item.title}
                </h3>
                
                <p className={`text-center text-sm ${
                  item.enabled ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {item.description}
                </p>

                {!item.enabled && (
                  <div className="mt-2 flex items-center">
                    <FiClock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-xs text-orange-600 font-medium">
                      En desarrollo
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.</p>
        <p className="mt-1">Sistema de Gestión Integral - Versión 3.0</p>
      </footer>
    </div>
  );
};

export default Main;