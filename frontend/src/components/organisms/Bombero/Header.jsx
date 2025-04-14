import React, { useState } from "react";
import { FaBars, FaSun } from "react-icons/fa";
import NotificationDropdown from "../../molecules/NotificationDropdown";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import IconButton from "../../atoms/Button/IconButton";
import SidebarBombero from "../../molecules/SideBardBombero";
import { useNavigate } from "react-router-dom"; // Para redirigir al login

const Header = () => {
  const [notifications] = useState([
    { id: 1, message: 'Nuevo usuario registrado', time: '5 min' },
    { id: 2, message: 'Ingreso Petróleo ', time: '10 nashe min' },
  ]);
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
      {/* Sidebar */}
      <SidebarBombero isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow-md px-4 py-3">
          {/* Botón hamburguesa para abrir el sidebar */}
          <div className="flex items-center gap-4">
            <IconButton 
              icono={<FaBars size={20} className="text-gray-600" />} 
              onClick={toggleSidebar}  // Llamar a la función para abrir el Sidebar
            />
            <h1
              className={`text-xl font-bold text-gray-800 transition-all duration-300 ${
                sidebarOpen ? 'ml-64' : 'ml-0'
              }`}
            >
              Bombero
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <div className="flex items-center gap-4">
              <NotificationDropdown notifications={notifications} />
            </div>

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
