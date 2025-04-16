import React, { useState, useContext } from "react";
import { FaBars, FaHome, FaUser, FaCog } from "react-icons/fa";
import NotificationDropdown from "../../molecules/NotificationDropdown";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import IconButton from "../../atoms/Button/IconButton";
import Sidebar from "../../molecules/SideBard"; // ✅ Corrige el nombre del archivo importado (SideBard → Sidebar)
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext"; // ✅ Asegúrate de importar el contexto

const Header = () => {
  const [notifications] = useState([
    { id: 1, message: "Nuevo usuario registrado", time: "5 min" },
    { id: 2, message: "Ingreso Petróleo", time: "10 min" },
  ]);
  const menuItems = [
    { name: "Inicio", link: "/inicio", icon: <FaHome /> },
    { name: "Registrar Usuarios", link: "/registroUsuario", icon: <FaUser /> },
    { name: "Configuración", link: "/configuracion", icon: <FaCog /> },
  ];

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // ✅ Obtener función para actualizar el usuario

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setUser(null); // ✅ Limpiar estado global
    navigate("/");
  };

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} menuItems={menuItems} />

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between bg-white shadow-md px-4 py-3">
          <div className="flex items-center gap-4">
            <IconButton
              icono={<FaBars size={20} className="text-gray-600" />}
              onClick={toggleSidebar}
            />
            <h1 className="text-xl font-bold text-gray-800">Administrador</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown notifications={notifications} />
            <UserProfileDropdown
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              handleLogout={handleLogout}
            />
          </div>
        </header>
      </div>
    </div>
  );
};

export default Header;
