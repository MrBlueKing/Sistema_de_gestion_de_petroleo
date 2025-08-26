import React, { useState, useContext, useEffect } from "react";
import { FaHome, FaMapMarkerAlt, FaUser, FaBars, FaTimes } from "react-icons/fa";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import NotificationDropdown from "../../molecules/NotificationDropdown";
import IconButton from "../../atoms/Button/IconButton";
import Sidebar from "../../molecules/SideBard";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";

const UniversalHeader = ({
  // Configuración básica
  type = "simple", // "admin", "bombero", "dispatch", "gerente", "home", "simple"
  title = "Sistema",

  // Configuración de layout
  hasSidebar = false,
  hasTopBar = false,
  isFixed = true,
  showSpacer = true,

  // Configuración de navegación
  homeRoute = "/",
  showHomeButton = false,

  // Configuración de sidebar
  menuItems = [],

  // Configuración de notificaciones
  notifications = [],

  // Configuración de logo/icono
  logo = null,
  logoSize = "w-32 h-40",

  // Props adicionales
  className = "",
  onCustomAction = null,
  customRightContent = null,
  customLeftContent = null,

  // Control de visibilidad de elementos
  showNotifications = false,
  showUserProfile = true,
  showClock = false,
}) => {
  const { user, setUser, loading } = useContext(UserContext);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // 🎨 CONFIGURACIÓN DE COLORES POR FAENA - ACTUALIZADA
  const FAENAS = {
    1: {
      ubicacion: "Cabildo",
      detalle: "Región de Valparaíso",
      color: "text-green-700",         // Para iconos de ubicación
      bgColor: "bg-green-700",         // Para fondos del perfil
      lightBg: "bg-green-100",         // Para fondos claros
      hex: "#708238"                   // Verde Oliva
    },
    2: {
      ubicacion: "Catemu",
      detalle: "Región de Valparaíso",
      color: "text-yellow-600",        // Amarillo Mostaza
      bgColor: "bg-yellow-600",
      lightBg: "bg-yellow-100",
      hex: "#D4A017"
    },
    3: {
      ubicacion: "Chincolco",
      detalle: "Región de Valparaíso",
      color: "text-blue-700",          // Azul Piedra
      bgColor: "bg-blue-700",
      lightBg: "bg-blue-100",
      hex: "#336699"
    },
    4: {
      ubicacion: "Tiltil",
      detalle: "Región Metropolitana",
      color: "text-red-700",           // Rojo Arcilla
      bgColor: "bg-red-700",
      lightBg: "bg-red-100",
      hex: "#A23E2A"
    },
  };

  // Obtener información de faena si existe
  const faena = user?.id_faena ? FAENAS[user.id_faena] : null;

  // 🎨 FUNCIÓN PARA OBTENER COLORES DINÁMICOS
  const getFaenaColors = () => {
    if (!faena) {
      return {
        iconColor: "text-gray-600",
        bgColor: "bg-blue-500",    // Color por defecto para perfil
        lightBg: "bg-gray-100",
        hex: "#6B7280"
      };
    }

    return {
      iconColor: faena.color,
      bgColor: faena.bgColor,
      lightBg: faena.lightBg,
      hex: faena.hex
    };
  };

  const colors = getFaenaColors();

  // 🎨 OBTENER COLOR PARA EL ÍCONO DE LA CASITA
  const getHomeIconColor = () => {
    // Si es bombero/operador y tiene faena, usar color de faena
    if ((type === "bombero" || type === "operador") && user && (user.id_rol === 1 || user.id_rol === 7) && faena) {
      return colors.iconColor.replace('-700', '-600'); // Un poco más claro para mejor contraste
    }
    return 'text-gray-200'; // Color por defecto
  };

  // 🎨 FUNCIÓN PARA DETERMINAR SI DEBE USAR COLORES PERSONALIZADOS
  const shouldUseCustomColors = () => {
    if (!user || !user.id_rol || !faena) return false;
    return user.id_rol === 1 || user.id_rol === 7; // bombero y asistente_bombero
  };

  // Actualizar reloj
  useEffect(() => {
    if (showClock || type === "bombero" || type === "operador") {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showClock, type]);

  // Efecto de scroll solo para tipos que lo necesiten
  useEffect(() => {
    if (type === "bombero" || type === "operador") {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [type]);

  // Función de logout universal
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    if (setUser) setUser(null);
    navigate('/');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Funciones de formateo de fecha/hora
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Configuración específica por tipo
  const getTypeConfig = () => {
    switch (type) {
      case "admin":
        return {
          title: "Administrador",
           hasTopBar: true,
          hasSidebar: false,
          isFixed: true,
          showHomeButton: true,
          homeRoute: "/administrador",
          showNotifications: false,
          headerHeight: "",
          spacerClass: "pt-4 md:pt-20",
          layout: "admin"
        };

      case "bombero":
        return {
          title: "Encargado de Operaciones de Combustible",
          mobileTitle: "Encargado de\nOperaciones",
          hasTopBar: true,
          hasSidebar: false,
          isFixed: true,
          showHomeButton: true,
          homeRoute: "/bombero",
          showNotifications: false,
          headerHeight: "",
          spacerClass: "pt-14 md:pt-20",
          layout: "bombero"
        };

      case "operador":
        return {
          title: "Operador de Vehículo",
          mobileTitle: "Operador de\nVehículo",
          hasTopBar: true,
          hasSidebar: false,
          isFixed: true,
          showHomeButton: true,
          homeRoute: "/OperadorVehiculo",
          showNotifications: false,
          headerHeight: "",
          spacerClass: "pt-14 md:pt-20",
          layout: "bombero" // ⭐ Usa el mismo layout que bombero
        };
      case "AdminOperador":
        return {
          title: "Administrador Operadores de Vehículos",
          mobileTitle: "Operador de\nVehículo",
          hasTopBar: true,
          hasSidebar: false,
          isFixed: true,
          showHomeButton: true,
          homeRoute: "/AdministradorOPeradorVehiculo",
          showNotifications: false,
          headerHeight: "",
          spacerClass: "pt-14 md:pt-20",
          layout: "bombero" // ⭐ Usa el mismo layout que bombero
        };

      case "dispatch":
        return {
          title: "Dispatch",
          hasTopBar: false,
          hasSidebar: false,
          isFixed: true,
          showHomeButton: false,
          showNotifications: false,
          headerHeight: "h-14",
          spacerClass: "pt-14",
          layout: "dispatch"
        };

      case "gerente":
        return {
          title: "Gerente",
          hasTopBar: false,
          hasSidebar: false,
          isFixed: true,
          showHomeButton: true,
          homeRoute: "/gerente",
          showNotifications: false,
          headerHeight: "",
          spacerClass: "",
          layout: "gerente"
        };

      case "home":
        return {
          title: "",
          hasTopBar: false,
          hasSidebar: false,
          isFixed: false,
          showHomeButton: false,
          showNotifications: false,
          showUserProfile: false,
          headerHeight: "",
          spacerClass: "",
          layout: "home"
        };

      default:
        return {
          title: title,
          hasTopBar: hasTopBar,
          hasSidebar: hasSidebar,
          isFixed: isFixed,
          showHomeButton: showHomeButton,
          showNotifications: showNotifications,
          headerHeight: "h-14",
          spacerClass: "pt-14",
          layout: "simple"
        };
    }
  };

  const config = getTypeConfig();

  // Contenido del lado izquierdo
  const renderLeftContent = () => {
    if (customLeftContent) return customLeftContent;

    return (
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Botón hamburguesa para sidebar */}
        {config.hasSidebar && (
          <IconButton
            icono={<FaBars size={24} className="text-gray-600" />}
            onClick={toggleSidebar}
          />
        )}

        {/* 🏠 BOTÓN HOME CON COLOR DINÁMICO SEGÚN LA FAENA */}
        {config.showHomeButton && (
          <IconButton
            icono={
              <FaHome
                size={18}
                className={`${getHomeIconColor()} md:w-5 md:h-5`}
              />
            }
            onClick={() => navigate(config.homeRoute || homeRoute)}
            className="flex-shrink-0"
          />
        )}

        {/* Título */}
        {config.title && (
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-sm md:text-lg font-bold text-gray-800 leading-tight">
              {config.mobileTitle ? (
                <>
                  <span className="md:hidden">
                    {config.mobileTitle.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < config.mobileTitle.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </span>
                  <span className="hidden md:inline">{config.title}</span>
                </>
              ) : (
                config.title
              )}
            </h1>

            {/* 🎨 UBICACIÓN CON COLOR DINÁMICO - SOLO PARA BOMBERO Y OPERADOR */}
            {(type === "bombero" || type === "operador") && faena && (
              <div className="flex items-center text-xs md:text-sm mt-0.5 md:mt-0">
                <FaMapMarkerAlt
                  className={`${colors.iconColor} mr-1 flex-shrink-0`}
                  size={10}
                />
                <span className="font-medium truncate">{faena.ubicacion}</span>
                <span className="hidden md:inline text-gray-500 ml-1">• {faena.detalle}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Contenido del lado derecho
  const renderRightContent = () => {
    if (customRightContent) return customRightContent;

    return (
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Reloj en móvil para bombero y operador */}
        {(type === "bombero" || type === "operador") && (
          <div className="md:hidden text-right">
            <div className="text-xs text-gray-600 leading-tight font-mono">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(currentTime)}
            </div>
          </div>
        )}

        {/* Logo para home */}
        {type === "home" && logo && (
          <img src={logo} alt="Logo" className={logoSize} />
        )}

        {/* Notificaciones */}
        {config.showNotifications && notifications.length > 0 && (
          <NotificationDropdown notifications={notifications} />
        )}

        {/* 🎨 PERFIL DE USUARIO CON COLORES DINÁMICOS */}
        {(config.showUserProfile ?? showUserProfile) && (
          <UserProfileDropdown
            userMenuOpen={userMenuOpen}
            setUserMenuOpen={setUserMenuOpen}
            handleLogout={handleLogout}
            faenaColors={colors} // 🎨 PASAMOS LOS COLORES AL DROPDOWN
          />
        )}
      </div>
    );
  };

  // Renderizar top bar
  const renderTopBar = () => {
    if (!config.hasTopBar && !hasTopBar) return null;

    return (
      <div className="hidden md:block bg-gray-800 text-white py-1 px-4">
        <div className="flex justify-between items-center text-xs">
          <div>{formatFullDate(currentTime)}</div>
          <div className="font-mono">{formatTime(currentTime)}</div>
        </div>
      </div>
    );
  };

  // Clases del header
  const getHeaderClasses = () => {
    let classes = "transition-all duration-300";

    if (config.isFixed) {
      classes += " fixed top-0 left-0 right-0 z-50"; // ✅ z-50 para modal compatibility
      if ((type === "bombero" || type === "operador") && scrolled) {
        classes += " bg-white shadow-lg";
      } else {
        classes += " bg-white shadow-md";
      }
    } else {
      classes += " bg-white shadow-md";
    }

    if (config.headerHeight) {
      classes += ` ${config.headerHeight}`;
    }

    if (className) {
      classes += ` ${className}`;
    }

    return classes;
  };

  // Layout para tipos que manejan su propio contenedor
  if (config.layout === "admin" || config.layout === "dispatch") {
    return (
      <div className="flex overflow-hidden">
        {/* Sidebar solo para admin */}
        {config.layout === "admin" && (
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            menuItems={menuItems}
          />
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className={`flex items-center justify-between bg-white shadow-md px-4 py-2 ${config.headerHeight} fixed top-0 left-0 right-0 z-10`}>
            {renderLeftContent()}
            {renderRightContent()}
          </header>

          <main className={`flex-1 overflow-auto ${config.spacerClass} bg-gray-50`}>
            {/* El contenido se renderiza fuera de este componente */}
          </main>
        </div>
      </div>
    );
  }

  // Layout normal para otros tipos
  return (
    <>
      <header className={getHeaderClasses()}>
        {renderTopBar()}

        <div className="flex items-center justify-between px-3 md:px-4 py-2 min-h-[56px] md:h-14">
          {renderLeftContent()}
          {renderRightContent()}
        </div>
      </header>

      {/* Espaciador */}
      {config.isFixed && showSpacer && config.spacerClass && (
        <div className={config.spacerClass}></div>
      )}
    </>
  );
};

export default UniversalHeader;