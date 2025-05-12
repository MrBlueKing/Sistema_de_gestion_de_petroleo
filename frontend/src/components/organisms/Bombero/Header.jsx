import React, { useState, useContext, useEffect } from "react";
import { FaHome, FaMapMarkerAlt, FaUser, FaBars, FaTimes } from "react-icons/fa";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import IconButton from "../../atoms/Button/IconButton";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";

const Header = () => {
  const { user, loading } = useContext(UserContext);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const FAENAS = {
    1: {
      ubicacion: "Cabildo",
      detalle: "Región de Valparaíso",
      color: "blue-600"
    },
    2: {
      ubicacion: "Catemu",
      detalle: "Región de Valparaíso",
      color: "green-600"
    },
    3: {
      ubicacion: "Chincolco",
      detalle: "Región de Valparaíso",
      color: "purple-600"
    },
    4: {
      ubicacion: "Tiltil",
      detalle: "Región Metropolitana",
      color: "orange-500"
    },
  };

  const faena = user?.id_faena ? FAENAS[user.id_faena] : null;

  // Actualizar la hora actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Detectar scroll para cambiar estilo del header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  // Formatear hora
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Header principal */}
      <header
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-white shadow-md'
          }`}
      >
        {/* Barra superior con fecha y hora */}
        <div className="bg-gray-800 text-white py-1 px-4 flex justify-between items-center text-xs">
          <div>
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div>{formatTime(currentTime)}</div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 h-14">
          <div className="flex items-center gap-4">
            {/* Botón de inicio */}
            <IconButton
              icono={<FaHome size={20} className="text-blue-600" />}
              onClick={() => navigate("/bombero")}
            />

            {/* Título y ubicación */}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-800">
                Encargado de Operaciones de Combustible
              </h1>

              {faena && (
                <div className="flex items-center text-sm">
                  <FaMapMarkerAlt className={`text-${faena.color} mr-1`} size={12} />
                  <span className="font-medium">{faena.ubicacion}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Perfil de usuario */}
            <div className="flex items-center gap-4">
              <UserProfileDropdown
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>
      {/* Espacio para que el contenido no quede detrás del header */}
      <div className="pt-20"></div>
    </>
  );
};

export default Header;