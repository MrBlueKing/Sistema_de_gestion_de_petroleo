import React, { useState } from "react";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import { useNavigate } from "react-router-dom"; // Para redirigir al login

const Header = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);  // Estado para abrir/cerrar el Sidebar
  const navigate = useNavigate(); // Hook para redirigir al login

  // Función para abrir/cerrar el Sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);  // Cambiar el estado de visibilidad del Sidebar
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('authToken');  // Eliminar el token de localStorage
    navigate('/');  // Redirigir al login utilizando useNavigate
  };

  return (
    <div className="flex">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow-md px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">
            Panel de Control de Mantención
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Dropdown de usuario */}
            <UserProfileDropdown 
              userMenuOpen={userMenuOpen} 
              setUserMenuOpen={setUserMenuOpen} 
              handleLogout={handleLogout}  // Pasamos la función de cerrar sesión
            />
          </div>
        </header>
      </div>
    </div>
  );
};

export default Header;