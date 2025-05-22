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

  // Actualizar la hora actual cada segundo para que funcione como reloj
  useEffect(() => {
    // Establecer la hora inicial
    setCurrentTime(new Date());
    
    // Crear el intervalo para actualizar cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Limpiar el intervalo cuando el componente se desmonte
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
        {/* Barra superior con fecha y hora - Solo visible en desktop */}
        <div className="hidden sm:block bg-gray-800 text-white py-1 px-4">
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

        {/* Contenido principal del header - Responsivo */}
        <div className="px-3 sm:px-4 py-2">
          {/* Layout para móviles */}
          <div className="flex sm:hidden items-center justify-between min-h-[60px]">
            {/* Columna izquierda - Botón home y título compacto */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <IconButton
                icono={<FaHome size={18} className="text-blue-600" />}
                onClick={() => navigate("/bombero")}
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-gray-800 leading-tight">
                  Encargado de<br />
                  Operaciones
                </h1>
                {faena && (
                  <div className="flex items-center text-xs mt-0.5">
                    <FaMapMarkerAlt className={`text-${faena.color} mr-1 flex-shrink-0`} size={10} />
                    <span className="font-medium truncate">{faena.ubicacion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha - Hora y perfil */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Hora en móvil */}
              <div className="text-right">
                <div className="text-xs text-gray-600 leading-tight font-mono">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(currentTime)}
                </div>
              </div>
              <UserProfileDropdown
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                handleLogout={handleLogout}
              />
            </div>
          </div>

          {/* Layout para tablets */}
          <div className="hidden sm:flex lg:hidden items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <IconButton
                icono={<FaHome size={20} className="text-blue-600" />}
                onClick={() => navigate("/bombero")}
              />
              <div className="flex flex-col min-w-0">
                <h1 className="text-base font-bold text-gray-800 leading-tight">
                  Encargado de Operaciones
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
              <UserProfileDropdown
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                handleLogout={handleLogout}
              />
            </div>
          </div>

          {/* Layout para desktop */}
          <div className="hidden lg:flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <IconButton
                icono={<FaHome size={20} className="text-blue-600" />}
                onClick={() => navigate("/bombero")}
              />
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-800">
                  Encargado de Operaciones de Combustible
                </h1>
                {faena && (
                  <div className="flex items-center text-sm">
                    <FaMapMarkerAlt className={`text-${faena.color} mr-1`} size={12} />
                    <span className="font-medium">{faena.ubicacion}</span>
                    <span className="text-gray-500 ml-1">• {faena.detalle}</span>
                  </div>
                )}
              </div>
            </div>

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

      {/* Espacio para que el contenido no quede detrás del header - Responsivo */}
      <div className="pt-16 sm:pt-20 lg:pt-20"></div>
    </>
  );
};

export default Header;