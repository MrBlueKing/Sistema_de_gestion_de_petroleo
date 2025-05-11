import React from "react";
import { Link } from "react-router-dom";
import {
  FiPieChart,
  FiBarChart2,
  FiTruck,
  FiSettings,
  FiFileText,
  FiUsers,
  FiDroplet
} from "react-icons/fi";

const Main = () => {
  const navigationItems = [
    {
      title: "Ingreso de Indicadores Clave",
      description: "Ingreso de Toneladas y Camionadas",
      icon: <FiTruck className="w-10 h-10 text-blue-500" />,
      path: "/gerente/ingreso-datos",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
    },
    {
      title: "Panel Gerente",
      description: "Administración y toma de decisiones",
      icon: <FiBarChart2 className="w-10 h-10 text-indigo-500" />,
      path: "/gerente",
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
    },
    {
      title: "Gestión de Consumo",
      description: "Control de consumo de combustible",
      icon: <FiDroplet className="w-10 h-10 text-cyan-500" />,
      path: "/consumo",
      color: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Panel de Control Minera 3H
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Seleccione una sección para administrar los recursos y visualizar la información de operaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationItems.map((item, index) => (
          <Link 
            to={item.path} 
            key={index}
            className={`flex flex-col items-center p-6 rounded-lg shadow-md border ${item.color} 
                        transition-all duration-300 transform hover:scale-105`}
          >
            <div className="p-3 rounded-full mb-4">
              {item.icon}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h2>
            <p className="text-gray-600 text-center">{item.description}</p>
          </Link>
        ))}
      </div>
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.</p>
        <p className="mt-1">Versión 0.0.1</p>
      </footer>
    </div>
  );
};

export default Main;