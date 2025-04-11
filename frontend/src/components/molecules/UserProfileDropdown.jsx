import React, { useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

const UserProfileDropdown = ({ userMenuOpen, setUserMenuOpen, handleLogout }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el clic fue fuera del dropdown, cerrarlo
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [userMenuOpen, setUserMenuOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setUserMenuOpen(prev => !prev)}
        className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="font-semibold text-white">JP</span>
        </div>
        <div className="hidden md:block text-left">
          <h3 className="font-medium text-gray-800">Juan Pérez</h3>
          <p className="text-xs text-gray-500">Administrador</p>
        </div>
        <FaChevronDown size={16} className="text-gray-500 hidden md:block" />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Tu perfil</a>
          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Configuración</a>
          <div className="border-t border-gray-100"></div>
          {/* Botón de cerrar sesión */}
          <button 
            onClick={handleLogout} 
            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
