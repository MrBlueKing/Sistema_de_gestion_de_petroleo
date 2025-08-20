import React, { useRef, useEffect, useContext } from "react";
import { FaChevronDown } from "react-icons/fa";
import { UserContext } from "../../context/userContext";

const UserProfileDropdown = ({ 
  userMenuOpen, 
  setUserMenuOpen, 
  handleLogout,
  faenaColors = null // 🎨 NUEVA PROP PARA COLORES
}) => {
  const { user, loading } = useContext(UserContext);
  const dropdownRef = useRef(null);

  // 🎨 CONFIGURACIÓN LOCAL DE COLORES POR FAENA - INDEPENDIENTE DEL PADRE
  const FAENAS_COLORS = {
    1: { 
      bgColor: "bg-green-700",    // Cabildo - Verde Oliva
      textColor: "text-green-600" // Para texto "Cargando..."
    },   
    2: { 
      bgColor: "bg-yellow-600",   // Catemu - Amarillo Mostaza
      textColor: "text-yellow-600"
    },  
    3: { 
      bgColor: "bg-blue-700",     // Chincolco - Azul Piedra
      textColor: "text-blue-600"
    },    
    4: { 
      bgColor: "bg-red-700",      // Tiltil - Rojo Arcilla
      textColor: "text-red-600"
    },     
  };

  // 🎨 FUNCIÓN PARA DETERMINAR SI EL ROL DEBE TENER COLORES PERSONALIZADOS
  const shouldUseCustomColors = () => {
    if (!user || !user.id_rol) return false;
    
    // Solo aplicar colores personalizados para bombero (1) y asistente_bombero (7)  
    return (user.id_rol === 1 || user.id_rol === 7) && (faenaColors || user.id_faena);
  };

  // 🎨 OBTENER COLOR DEL TEXTO "CARGANDO..." - USANDO PROP DEL PADRE PRIMERO
  const getLoadingTextColor = () => {
    // 1. PRIORIDAD: Usar faenaColors del padre si está disponible
    if (faenaColors && user && user.id_rol && (user.id_rol === 1 || user.id_rol === 7)) {
      // Convertir bgColor a textColor (ej: bg-green-700 -> text-green-600)
      const textColor = faenaColors.bgColor.replace('bg-', 'text-').replace('-700', '-600');
      return textColor;
    }

    // 2. FALLBACK: Intentar obtener de localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData && userData.id_rol && (userData.id_rol === 1 || userData.id_rol === 7) && userData.id_faena) {
          const faenaColor = FAENAS_COLORS[userData.id_faena];
          if (faenaColor) {
            return faenaColor.textColor;
          }
        }
      }
    } catch (e) {
      // Fallback silencioso
    }
    
    return "text-gray-500"; // Color por defecto
  };
  // 🎨 OBTENER COLOR DEL CÍRCULO DEL PERFIL - USANDO PROP DEL PADRE PRIMERO
  const getProfileCircleColor = () => {
    // 1. PRIORIDAD: Usar faenaColors del padre si está disponible
    if (faenaColors && user && user.id_rol && (user.id_rol === 1 || user.id_rol === 7)) {
      return faenaColors.bgColor;
    }
    
    // 2. FALLBACK: Usar colores locales
    if (user && user.id_rol && (user.id_rol === 1 || user.id_rol === 7) && user.id_faena) {
      const faenaColor = FAENAS_COLORS[user.id_faena];
      if (faenaColor) {
        return faenaColor.bgColor;
      }
    }
    
    return "bg-blue-200"; // Color por defecto
  };

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
      7: "Encargado de Operaciones de Combustible", // Asistente bombero
      8: "Administrador"
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

  // 🎨 RENDERIZADO MEJORADO PARA LAS INICIALES - NO MÁS FLASH AZUL
  const renderInitials = () => {
    if (loading && (!user || !user.nombre || !user.apellido)) {
      // Solo mostrar "..." si realmente no tenemos datos del usuario
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

  // 🎨 OBTENER INFORMACIÓN DE LA FAENA PARA DEBUG (OPCIONAL)  
  const getFaenaInfo = () => {
    if (!shouldUseCustomColors()) return null;
    
    const faenaNames = {
      1: "Cabildo",
      2: "Catemu", 
      3: "Chincolco",
      4: "Tiltil"
    };
    
    return user?.id_faena ? faenaNames[user.id_faena] : null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setUserMenuOpen((prev) => !prev)}
        className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        title={shouldUseCustomColors() ? `Faena: ${getFaenaInfo()}` : undefined}
      >
        {/* 🎨 CÍRCULO CON COLOR DINÁMICO - INCLUSO DURANTE LA CARGA */}
        <div className={`w-10 h-10 rounded-full ${getProfileCircleColor()} flex items-center justify-center transition-colors shadow-sm`}>
          {renderInitials()}
        </div>
        
        {/* 🎨 INFORMACIÓN DEL USUARIO - CON "CARGANDO..." DE COLOR FAENA */}
        <div className="hidden md:block text-left">
          {!user ? (
            <p className={`text-xs font-medium ${getLoadingTextColor()}`}>
              Cargando...
            </p>
          ) : (
            <>
              <h3 className="font-medium text-gray-800">
                {user.nombre || 'Usuario'} {user.apellido || ''}
              </h3>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500">
                  {user.id_rol ? getRoleName(user.id_rol) : "Rol desconocido"}
                </p>
                {/* Mostrar indicador de carga si está loading pero ya tenemos datos */}
                {loading && (
                  <span className={`text-xs ${getLoadingTextColor()}`}>•</span>
                )}
              </div>
            </>
          )}
        </div>
        <FaChevronDown size={16} className="text-gray-500 hidden md:block" />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
          <button
            onClick={handleLogout}
            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;