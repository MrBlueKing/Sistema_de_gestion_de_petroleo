import React from "react";
import { FaHome, FaUser, FaCog, FaTimes } from "react-icons/fa"; // Importa el icono de la "X"
import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar, menuItems}) => {
  return (
    <>
      {/* Overlay para el fondo cuando el sidebar está abierto */}
      <div
        className={`fixed inset-0 bg-gray-800/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}  // Cierra el sidebar si se hace clic fuera de él
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6.5 border-s shadow-md border-gray-200 flex justify-between items-center ">
          <h2 className="text-xl font-bold text-gray-800">Panel</h2>
          {/* Botón de cierre */}
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={toggleSidebar}
          >
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-2">
          {/* Mapeo dinámico de los botones */}
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer"
            >
              {item.icon} {/* Puedes agregar un ícono dinámico o estático */}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

