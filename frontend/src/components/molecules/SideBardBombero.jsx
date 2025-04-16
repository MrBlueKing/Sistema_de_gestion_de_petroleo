// src/components/organisms/Sidebar/Sidebar.jsx
import React from "react";
import { FaHome, FaUser, FaCog, FaTimes } from "react-icons/fa"; // Importa el icono de la "X"
import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
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
        <Link to="/home" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaHome />
          <span>Inicio</span>
        </Link>

        <Link to="/registroEquipo" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaCog />
          <span>Registro Equipos</span>
        </Link>

        <Link to="/ingresoPetroleo" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaCog />
          <span>Ingreso Petróleo</span>
        </Link>

        <Link to="/turnos" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaCog />
          <span>Turnos de Guardia</span>
        </Link>

        <Link to="/reportes" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaCog />
          <span>Reportes</span>
        </Link>

        <Link to="/configuracion" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaCog />
          <span>Configuración</span>
        </Link>
      </nav>

    </aside>
  );
};

export default Sidebar;
