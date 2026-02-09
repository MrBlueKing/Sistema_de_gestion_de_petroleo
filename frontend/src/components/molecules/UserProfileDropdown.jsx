import React, { useRef, useEffect, useContext, useState } from "react";
import { FaChevronDown, FaExchangeAlt, FaSpinner } from "react-icons/fa";
import { UserContext } from "../../context/userContext";
import axios from "../../lib/axios";

const UserProfileDropdown = ({
  userMenuOpen,
  setUserMenuOpen,
  handleLogout,
  faenaColors = null // 🎨 NUEVA PROP PARA COLORES
}) => {
  const { user, loading, refreshUser } = useContext(UserContext);
  const dropdownRef = useRef(null);
  const [displayUser, setDisplayUser] = useState(null);

  // 🆕 Estados para cambio de rol
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [cambiandoRol, setCambiandoRol] = useState(false);
  const [errorRoles, setErrorRoles] = useState(null);

  // 🆕 CARGAR DATOS INMEDIATAMENTE DE LOCALSTORAGE MIENTRAS SE CARGA EL CONTEXTO
  useEffect(() => {
    if (user) {
      // Si el contexto ya tiene el usuario, usarlo
      setDisplayUser(user);
    } else {
      // Si no, intentar cargar de localStorage para mostrar algo inmediatamente
      try {
        const storedAuth = localStorage.getItem('authToken');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.userName && authData.userLastName) {
            // Crear un objeto de usuario temporal desde localStorage
            const tempUser = {
              nombre: authData.userName,
              apellido: authData.userLastName,
              id_rol: authData.roleId || null,
              id_faena: authData.faenaId || null
            };
            setDisplayUser(tempUser);
          }
        }
      } catch (e) {
        // Fallback silencioso
        console.error('Error al cargar usuario desde localStorage:', e);
      }
    }
  }, [user]);

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
    6: {
      bgColor: "bg-yellow-50/40",      // Tiltil - Rojo Arcilla
      textColor: "text-yellow -600"
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
      5: "Taller Mecánico",
      6: "Operador de Vehículo",
      7: "Encargado de Operaciones de Combustible", // Asistente bombero
      8: "Administrador",
      9: "Operaciones",
    };

    // Si el ID existe en nuestro mapeo, devolvemos el nombre del rol
    // Si no, mostramos el ID como fallback
    return roles[idRol] || `Rol ${idRol}`;
  };

  // 🆕 Función para obtener ID de rol desde nombre del sistema centralizado
  const getRoleId = (rolNombre) => {
    const mapeo = {
      'bombero': 1,
      'gerente': 2,
      'administrador': 3,
      'admin': 3,
      'toneladas': 4,
      'planificador': 5,
      'operador_vehiculo': 6,
      'asistente_bombero': 7,
      'admin_operador': 8,
      'jefe_mina': 9
    };
    return mapeo[rolNombre?.toLowerCase()] || null;
  };

  // 🆕 Función para obtener nombre display amigable del rol
  const getRoleDisplayName = (rolNombre) => {
    const nombres = {
      'bombero': 'Bombero',
      'gerente': 'Gerente',
      'administrador': 'Administrador',
      'admin': 'Administrador',
      'toneladas': 'Distpach',
      'planificador': 'Taller Mecánico',
      'operador_vehiculo': 'Operador Vehículo',
      'asistente_bombero': 'Asistente Bombero',
      'admin_operador': 'Admin Operador',
      'jefe_mina': 'Jefe Mina'
    };
    return nombres[rolNombre?.toLowerCase()] || rolNombre;
  };

  // 🆕 Cargar roles disponibles cuando se abre el dropdown
  useEffect(() => {
    if (userMenuOpen && user) {
      cargarRolesDisponibles();
    }
  }, [userMenuOpen, user]);

  // 🆕 Función para cargar roles disponibles desde el backend
  const cargarRolesDisponibles = async () => {
    setLoadingRoles(true);
    setErrorRoles(null);
    try {
      const response = await axios.get('/api/roles-disponibles');
      if (response.data.success) {
        setRolesDisponibles(response.data.roles_disponibles || []);
      }
    } catch (error) {
      console.error('Error cargando roles disponibles:', error);
      setErrorRoles('No se pudieron cargar los roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  // 🆕 Función para cambiar de rol
  const handleCambiarRol = async (nuevoRol) => {
    if (cambiandoRol) return; // Evitar múltiples clicks

    setCambiandoRol(true);
    try {
      console.log('🔄 Cambiando a rol:', nuevoRol);

      const response = await axios.post('/api/cambiar-rol', {
        rol_nuevo: nuevoRol
      });

      if (response.data.success) {
        console.log('✅ Rol cambiado exitosamente');

        // Refrescar el contexto del usuario
        await refreshUser();

        // Cerrar el dropdown
        setUserMenuOpen(false);

        // Redirigir a la página principal del nuevo rol
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error cambiando de rol:', error);
      alert(error.response?.data?.message || 'Error al cambiar de rol');
    } finally {
      setCambiandoRol(false);
    }
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

  // 🎨 RENDERIZADO MEJORADO PARA LAS INICIALES - USA displayUser
  const renderInitials = () => {
    if (loading && (!displayUser || !displayUser.nombre || !displayUser.apellido)) {
      // Solo mostrar "..." si realmente no tenemos datos del usuario
      return <span className="font-semibold text-white">...</span>;
    }

    if (!displayUser || !displayUser.nombre || !displayUser.apellido) {
      return <span className="font-semibold text-white">N/A</span>;
    }

    return (
      <span className="font-semibold text-white">
        {displayUser.nombre.charAt(0)}{displayUser.apellido.charAt(0)}
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
          {!displayUser ? (
            <p className={`text-xs font-medium ${getLoadingTextColor()}`}>
              Cargando...
            </p>
          ) : (
            <>
              <h3 className="font-medium text-gray-800">
                {displayUser.nombre || 'Usuario'} {displayUser.apellido || ''}
              </h3>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500">
                  {displayUser.id_rol ? getRoleName(displayUser.id_rol) : "Rol desconocido"}
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
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
          {/* 🆕 Sección de roles disponibles */}
          {rolesDisponibles.length > 1 && (
            <>
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-2">
                  Cambiar rol:
                </p>
                {loadingRoles ? (
                  <div className="flex items-center justify-center py-2">
                    <FaSpinner className="animate-spin text-gray-400" />
                  </div>
                ) : errorRoles ? (
                  <p className="text-xs text-red-500">{errorRoles}</p>
                ) : (
                  <div className="space-y-1">
                    {rolesDisponibles.map((rol) => {
                      const esRolActual = user?.rol === rol ||
                                         user?.id_rol === getRoleId(rol);

                      return (
                        <button
                          key={rol}
                          onClick={() => !esRolActual && handleCambiarRol(rol)}
                          disabled={esRolActual || cambiandoRol}
                          className={`
                            w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2
                            ${esRolActual
                              ? 'bg-blue-50 text-blue-700 font-medium cursor-default'
                              : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
                            }
                            ${cambiandoRol ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {cambiandoRol && !esRolActual ? (
                            <FaSpinner className="animate-spin text-sm" />
                          ) : esRolActual ? (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          ) : (
                            <FaExchangeAlt className="text-xs text-gray-400" />
                          )}
                          <span className="capitalize">
                            {getRoleDisplayName(rol)}
                            {esRolActual && <span className="text-xs ml-1">(actual)</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Botón de cerrar sesión */}
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