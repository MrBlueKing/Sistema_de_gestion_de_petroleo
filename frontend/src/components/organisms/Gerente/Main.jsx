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
const Main = () => {
  const navigationItems = [
    // ÁREA DE COMBUSTIBLE
    {
      title: "Control de Combustible",
      description: "Stock, ingresos y consumo de petróleo",
      icon: <FiDroplet className="w-10 h-10 text-cyan-500" />,
      path: "/gerente/graficos",
      color: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
    },
    // ÁREA DE PRODUCCIÓN
    {
      title: "Gestión de Producción",
      description: "Tonelajes, padrones, plantas y metas de producción",
      icon: <FiTruck className="w-10 h-10 text-blue-500" />,
      path: "/gerente/produccion",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
    },
    // ÁREA OPERACIONAL
    {
      title: "Gestión de Equipos",
      description: "Estado, mantenimiento y disponibilidad de maquinaria",
      icon: <FiTool className="w-10 h-10 text-orange-500" />,
      path: "/gerente/equipos",
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200"
    },
    // ÁREA FINANCIERA Y ANÁLISIS
    {
      title: "Reportes y KPIs",
      description: "Dashboards ejecutivos y métricas clave",
      icon: <FiFileText className="w-10 h-10 text-violet-500" />,
      path: "/gerente/reportes",
      color: "bg-violet-50 hover:bg-violet-100 border-violet-200"
    },
    {
      title: "Simulacion Consumos",
      description: "Simulacion de consumo de combustible",
      icon: <FiSettings className="w-10 h-10 text-green-500" />,
      path: "/gerente/simulacion",
      color: "bg-green-50 hover:bg-green-100 border-green-200"
    },
  ];

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
            {navigationItems.slice(0, 5).map((item, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center p-6 rounded-lg shadow-md border ${item.color} 
                           transition-all duration-300 transform hover:scale-105 cursor-pointer`}
              >
                <div className="p-3 rounded-full mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">{item.title}</h3>
                <p className="text-gray-600 text-center text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.</p>
        <p className="mt-1">Sistema de Gestión Integral - Versión 2.0.1</p>
      </footer>
    </div>
  );
};

export default Main;