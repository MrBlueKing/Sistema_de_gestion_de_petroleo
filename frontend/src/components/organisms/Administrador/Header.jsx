import React, { useState, useContext } from "react";
import { FaBars, FaHome, FaUserCog } from "react-icons/fa";
import { TbCategoryPlus } from "react-icons/tb";
import { FaTruckDroplet } from "react-icons/fa6";
import { HiUserAdd } from "react-icons/hi";
import NotificationDropdown from "../../molecules/NotificationDropdown";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import IconButton from "../../atoms/Button/IconButton";
import Sidebar from "../../molecules/SideBard";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";

const Header = () => {
  const [notifications] = useState([
    { id: 1, message: "Nuevo usuario registrado", time: "5 min" },
    { id: 2, message: "Ingreso Petróleo", time: "10 min" },
  ]);
  
  const menuItems = [
    { name: "Inicio", link: "/inicio", icon: <FaHome size={30}/> },
    { name: "Registrar Usuarios", link: "/registroUsuario", icon: <HiUserAdd size={30}/> },
    { name: "Añadir Tipo Maquina", link: "/AñadirTipoMaquina", icon: <TbCategoryPlus size={30}/> },
    { name: "Categorización de Equipos", link: "/GestionarMaquinaCategoria", icon: <FaTruckDroplet size={30}/> },
    { name: "Gestionar Personal", link: "/GestionarPersonalInterno", icon: <FaUserCog size={30}/> },
  ];
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} menuItems={menuItems}/>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between bg-white shadow-md px-4 py-2 h-14 fixed top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-2">
            <IconButton
              icono={<FaBars size={24} className="text-gray-600" />}
              onClick={toggleSidebar}
            />
            <h1 className="text-lg font-bold text-gray-800">Administrador</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationDropdown notifications={notifications} />
            <UserProfileDropdown
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              handleLogout={handleLogout}
            />
          </div>
        </header>
        
        <main className="flex-1 overflow-auto pt-14 bg-gray-50">
          {/* Contenido principal aquí */}
        </main>
      </div>
    </div>
  );
};

export default Header;
