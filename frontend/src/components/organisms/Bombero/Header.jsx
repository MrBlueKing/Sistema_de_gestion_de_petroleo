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

  // Actualizar la hora actual cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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

  // Formatear hora con segundos
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Formatear fecha como dd-mm-yyyy
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Header principal */}
      <header
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-lg' : 'bg-white shadow-md'
        }`}
      >
        {/* Barra superior con fecha y hora - Oculta en móvil */}
        <div className="hidden md:block bg-gray-800 text-white py-1 px-4">
          <div className="flex justify-between items-center text-xs">
            <div>
              {currentTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="font-mono">{formatTime(currentTime)}</div>
          </div>
        </div>

        {/* Contenido principal - USANDO LA ESTRUCTURA QUE FUNCIONA */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2 min-h-[56px] md:h-14">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Botón de inicio */}
            <IconButton
              icono={<FaHome size={18} className="text-blue-600 md:w-5 md:h-5" />}
              onClick={() => navigate("/bombero")}
              className="flex-shrink-0"
            />

            {/* Título y ubicación - Responsivo */}
            <div className="flex flex-col min-w-0 flex-1">
              {/* Título adaptativo */}
              <h1 className="text-sm md:text-lg font-bold text-gray-800 leading-tight">
                <span className="md:hidden">
                  Encargado de<br />
                  Operaciones
                </span>
                <span className="hidden md:inline">
                  Encargado de Operaciones de Combustible
                </span>
              </h1>

              {/* Ubicación */}
              {faena && (
                <div className="flex items-center text-xs md:text-sm mt-0.5 md:mt-0">
                  <FaMapMarkerAlt className={`text-${faena.color} mr-1 flex-shrink-0`} size={10} />
                  <span className="font-medium truncate">{faena.ubicacion}</span>
                  <span className="hidden md:inline text-gray-500 ml-1">• {faena.detalle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lado derecho */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Hora en móvil */}
            <div className="md:hidden text-right">
              <div className="text-xs text-gray-600 leading-tight font-mono">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Perfil de usuario - EXACTAMENTE COMO EN EL CÓDIGO QUE FUNCIONA */}
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
      <div className="pt-14 md:pt-20"></div>
    </>
  );
};

export default Header;