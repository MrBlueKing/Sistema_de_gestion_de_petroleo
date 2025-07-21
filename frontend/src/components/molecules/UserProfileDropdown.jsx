import React, { useRef, useEffect, useContext } from "react";
import { FaChevronDown } from "react-icons/fa";
import { UserContext } from "../../context/userContext";

const UserProfileDropdown = ({ userMenuOpen, setUserMenuOpen, handleLogout }) => {
  const { user, loading } = useContext(UserContext);
  const dropdownRef = useRef(null);

  // Función para mapear el ID de rol a su nombre descriptivo
  const getRoleName = (idRol) => {
    // Mapeo de ID de rol a nombre descriptivo
    const roles = {
      1: "Encargado de Operaciones de Combustible",
      2: "Gerente",
      3: "Administrador",
      4: "Distpach",
      5: "Planificador",
      6: "Operador de Vehículo",
    };
    
    // Si el ID existe en nuestro mapeo, devolvemos el nombre del rol
    // Si no, mostramos el ID como fallback
    return roles[idRol] || `Rol ${idRol}`;
  };

  // Manejador para clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Renderizado condicional para las iniciales
  const renderInitials = () => {
    if (loading) {
      return <span className="font-semibold text-white">...</span>;
    }
    
    if (!user || !user.nombre || !user.apellido) {
      return <span className="font-semibold text-white">N/A</span>;
    }
    
    return (
      <span className="font-semibold text-white">
        {user.nombre.charAt(0)}{user.apellido.charAt(0)}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setUserMenuOpen((prev) => !prev)}
        className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          {renderInitials()}
        </div>
        <div className="hidden md:block text-left">
          {loading ? (
            <p className="text-xs text-gray-500">Cargando...</p>
          ) : (
            user && (
              <>
                <h3 className="font-medium text-gray-800">
                  {user.nombre || 'Usuario'} {user.apellido || ''}
                </h3>
                <p className="text-xs text-gray-500">
                  {user.id_rol ? getRoleName(user.id_rol) : "Rol desconocido"}
                </p>
              </>
            )
          )}
        </div>
        <FaChevronDown size={16} className="text-gray-500 hidden md:block" />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
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