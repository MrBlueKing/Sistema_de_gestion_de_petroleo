import React, { useState, useEffect, useContext } from "react";
import {
  FaGasPump,
  FaArrowCircleDown,
  FaChartLine,
  FaHistory,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaHome,
  FaEye,
  FaPlus,
  FaCalendarAlt,
  FaUser,
  FaTruck
} from "react-icons/fa";
import axios from "../../../lib/axios";
import StockEstanquesFAB from "../../molecules/StockEstanquesFAB";
import { UserContext } from "../../../context/userContext";

// 🎨 COLORES POR FAENA (igual que en las otras tablas)
const FAENA_COLORS = {
  1: { // Cabildo
    name: "Cabildo",
    bg: "bg-green-50/30",
    border: "border-l-green-400",
    badge: "bg-green-100 text-green-800",
    icon: "text-green-600",
    emoji: "🌿"
  },
  4: { // Tiltil
    name: "Tiltil",
    bg: "bg-red-50/30", 
    border: "border-l-red-400",
    badge: "bg-red-100 text-red-800",
    icon: "text-red-600",
    emoji: "🏔️"
  }
};

// 🛠️ Función para obtener colores de faena por ID
const getFaenaColorsById = (faenaId) => {
  const faenaInfo = FAENA_COLORS[faenaId];
  
  if (faenaInfo) {
    return faenaInfo;
  }

  // Color por defecto para faenas desconocidas
  return {
    name: "Faena Desconocida",
    bg: "bg-blue-50/25",
    border: "border-l-blue-400", 
    badge: "bg-blue-100 text-blue-800",
    icon: "text-blue-600",
    emoji: "🏢"
  };
};

// 🔧 ALIAS para compatibilidad (por si se usa en otro lugar)
const getFaenaColors = getFaenaColorsById;

// Componente Button - Más sobrio con paleta de colores
const Button = ({
  to,
  color,
  icon,
  text,
  className = "",
  size = "normal",
  disabled = false,
  onClick
}) => {
  const baseClasses = "flex items-center justify-center gap-2 sm:gap-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeClasses = {
    small: "px-3 sm:px-4 py-2 text-xs sm:text-sm",
    normal: "px-4 sm:px-6 py-3 sm:py-3 text-sm sm:text-base",
    large: "px-6 sm:px-8 py-4 sm:py-4 text-base sm:text-lg"
  };

  const colorClasses = {
    orange: "bg-[#F67029] hover:bg-[#e55a1a] text-white shadow-sm hover:shadow-md focus:ring-orange-500",
    red: "bg-[#AB201A] hover:bg-[#9a1c17] text-white shadow-sm hover:shadow-md focus:ring-red-500",
    blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md focus:ring-blue-500",
    green: "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md focus:ring-green-500",
    purple: "bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md focus:ring-purple-500",
    gray: "bg-gray-400 text-gray-600 cursor-not-allowed opacity-60"
  };

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (to) {
      window.location.href = to;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${sizeClasses[size]} ${disabled ? colorClasses.gray : colorClasses[color]} ${className}`}
      disabled={disabled}
    >
      {icon && (
        <span className="text-sm sm:text-base">
          {icon}
        </span>
      )}
      <span className="font-medium">
        {text}
      </span>
    </button>
  );
};

// Componente LoadingSpinner
const LoadingSpinner = ({ message = "Cargando..." }) => (
  <div className="flex justify-center items-center py-12 sm:py-16">
    <div className="relative">
      <FaSpinner className="animate-spin text-gray-400 text-3xl sm:text-4xl" />
      <div className="absolute inset-0 animate-ping">
        <FaSpinner className="text-blue-400 text-3xl sm:text-4xl opacity-20" />
      </div>
    </div>
    <span className="ml-3 sm:ml-4 text-gray-600 font-medium text-base sm:text-lg">{message}</span>
  </div>
);

// 🎨 Componente de tarjeta móvil para consumos recientes CON COLORES POR FAENA
const ConsumoRecenteCard = ({ consumo, formatearFecha, userFaenaId }) => {
  const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
  // 👈 Obtener colores según el ID de faena del usuario
  const colores = getFaenaColorsById(userFaenaId);

  return (
    <div className={`${colores.bg} ${colores.border} border-l-4 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* Header con fecha y litros */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className={`${colores.icon} text-sm`} />
          <div>
            <div className="font-bold text-gray-800 text-sm">{fecha}</div>
            <div className="text-xs text-gray-500">{hora}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Litros</div>
          <div className={`font-bold text-base ${colores.icon}`}>
            {parseFloat(consumo.litros_consumidos).toFixed(2)} L
          </div>
        </div>
      </div>

      {/* Información en grid compacto */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaUser className={`${colores.icon} text-xs`} />
            <span className="text-xs font-medium text-gray-600 uppercase">Solicitante</span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {consumo.solicitante_nombre || "N/A"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaTruck className={`${colores.icon} text-xs`} />
            <span className="text-xs font-medium text-gray-600 uppercase">Equipo</span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {consumo.nombre_maquina || "N/A"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs">{colores.emoji}</span>
            <span className="text-xs font-medium text-gray-600 uppercase">Faena</span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {colores.name}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaGasPump className={`${colores.icon} text-xs`} />
            <span className="text-xs font-medium text-gray-600 uppercase">Estanque</span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {consumo.estanque || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

const Main = () => {
  const { user, loading } = useContext(UserContext);
  const activo = false;
  const [consumosRecientes, setConsumosRecientes] = useState([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [error, setError] = useState(null);

  // 🆕 FUNCIÓN PARA VERIFICAR PERMISOS
  const tienePermisoRecepciones = () => {
    // Si el usuario tiene rol id_rol = 7 (asistente_bombero), NO puede ver recepciones
    return user?.rol?.id_rol !== 7;
  };

  // Función para obtener consumos recientes
  const fetchConsumosRecientes = async () => {
    if (!user?.id_faena) {
      activo && console.log('Usuario sin faena asignada:', user);
      return;
    }

    setLoadingConsumos(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      activo && console.log('Obteniendo consumos para faena:', user.id_faena);

      const response = await axios.get(`/api/consumos/recientes?faena=${user.id_faena}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      activo && console.log('Consumos recibidos:', response.data);
      setConsumosRecientes(response.data.data || []);

    } catch (error) {
      console.error('Error al cargar consumos recientes:', error);

      let errorMessage = 'Error al cargar consumos recientes';
      if (error.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tiene permisos para acceder a esta información.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

    } finally {
      setLoadingConsumos(false);
    }
  };

  // useEffect para cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (!loading && user?.id_faena) {
      activo && console.log('Usuario disponible, cargando consumos...', user);
      fetchConsumosRecientes();
    }
  }, [user, loading]);

  // Función para formatear fecha
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    const fechaFormateada = fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaFormateada = fecha.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { fecha: fechaFormateada, hora: horaFormateada };
  };

  // Loading state del usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md mx-4">
          <LoadingSpinner message="Obteniendo información del usuario..." />
        </div>
      </div>
    );
  }

  // Error state si no hay usuario
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-4 border-2 border-red-200">
          <div className="text-red-500 text-5xl sm:text-6xl mb-4">
            <FaExclamationTriangle className="mx-auto animate-bounce" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">No se pudo cargar la información del usuario.</p>
          <Button
            color="orange"
            text="🔐 Ir a Login"
            onClick={() => window.location.href = "/login"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 ">
      {/* Contenido unificado con fondo blanco */}
      <div className="max-w-7xl mx-auto bg-white shadow-lg min-h-screen">
        <div className="px-2 sm:px-4 py-6 sm:py-8">

          {/* Header integrado */}
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 bg-clip-text text-transparent mb-2 sm:mb-4">
              Sistema de Gestión de Combustible
            </h3>
          </div>

          {/* Cards de acciones principales - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Card de Registros */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="bg-[#F67029] p-2 sm:p-3 rounded-lg shadow-md">
                  <FaPlus className="text-white text-base sm:text-lg" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Registrar Movimientos</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Ingresa nuevos datos al sistema</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* 🆕 BOTÓN DE RECEPCIÓN - SOLO VISIBLE PARA ROLES PERMITIDOS */}
                {tienePermisoRecepciones() && (
                  <Button
                    to="/BomberoRecepcion"
                    color="orange"
                    icon={<FaArrowCircleDown />}
                    text="Registrar Recepción"
                    className="w-full"
                    disabled={!user?.id_faena}
                  />
                )}

                {/* BOTÓN DE CONSUMO - SIEMPRE VISIBLE */}
                <Button
                  to="/BomberoNavigation"
                  color="orange"
                  icon={<FaGasPump />}
                  text="Registrar Consumo"
                  className="w-full"
                  disabled={!user?.id_faena}
                />
              </div>
            </div>

            {/* Card de Consultas */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="bg-green-600 p-2 sm:p-3 rounded-lg shadow-md">
                  <FaEye className="text-white text-base sm:text-lg" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Consultar Históricos</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Revisa los registros anteriores</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* 🆕 BOTÓN DE HISTORIAL RECEPCIONES - SOLO VISIBLE PARA ROLES PERMITIDOS */}
                {tienePermisoRecepciones() && (
                  <Button
                    to="/bombero/recepciones"
                    color="green"
                    icon={<FaHistory />}
                    text="Historial Recepciones"
                    className="w-full"
                  />
                )}

                {/* BOTÓN DE HISTORIAL CONSUMOS - SIEMPRE VISIBLE */}
                <Button
                  to="/bombero/consumos"
                  color="green"
                  icon={<FaChartLine />}
                  text="Historial Consumos"
                  className="w-full"
                />

                {/* BOTÓN DE HISTORIAL CONSUMOS - SIEMPRE VISIBLE */}
                {tienePermisoRecepciones() && (
                  <Button
                    to="/bombero/historial-maquinas"
                    color="green"
                    icon={<FaTruck />}
                    text="Historial De Máquinas"
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Error display optimizado */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-600 text-lg sm:text-xl flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-800 text-sm sm:text-base">⚠️ Error de Conexión</h4>
                  <p className="text-xs sm:text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Consumos Recientes - Optimizada CON COLORES */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-purple-600 p-2 sm:p-3 rounded-lg shadow-md">
                <FaHistory className="text-white text-base sm:text-lg" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Consumos Recientes</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Últimas 5 cargas de combustible registradas</p>
              </div>
            </div>

            {loadingConsumos ? (
              <LoadingSpinner message="Cargando consumos recientes..." />
            ) : (
              <>
                {/* Vista móvil - Cards CON COLORES POR FAENA */}
                <div className="block lg:hidden">
                  <div className="space-y-4">
                    {consumosRecientes.length > 0 ? (
                      consumosRecientes.map((consumo, index) => (
                        <ConsumoRecenteCard
                          key={index}
                          consumo={consumo}
                          formatearFecha={formatearFecha}
                          userFaenaId={user?.id_faena} // 👈 Pasar ID de faena del usuario
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaInfoCircle className="mx-auto text-3xl mb-2 text-gray-400" />
                        <p className="font-medium text-gray-600">No hay consumos recientes</p>
                        <p className="text-sm text-gray-500">Los datos aparecerán cuando se registren nuevos consumos</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vista escritorio - Tabla CON COLORES POR FAENA */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">📅 Fecha</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">🏢 Faena</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">👤 Solicitante</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">🚛 Equipo</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">⛽ Litros</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">🛢️ Estanque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumosRecientes.length > 0 ? (
                          consumosRecientes.map((consumo, index) => {
                            const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
                            const colores = getFaenaColorsById(user?.id_faena); // 👈 Obtener colores por ID de faena del usuario
                            
                            return (
                              <tr
                                key={index}
                                className={`${colores.bg} ${colores.border} border-l-4 border-b border-gray-100 hover:shadow-sm transition-all duration-200`}
                              >
                                <td className="py-3 px-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{fecha}</div>
                                    <div className="text-gray-500">{hora}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{colores.emoji}</span>
                                    <span className="text-sm font-medium text-gray-900">{colores.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {consumo.solicitante_nombre || 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {consumo.nombre_maquina || 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colores.badge}`}>
                                    {parseFloat(consumo.litros_consumidos).toFixed(2)} L
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {consumo.estanque || 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-8 text-center">
                              <div className="text-gray-500">
                                <FaInfoCircle className="mx-auto text-3xl mb-2" />
                                <p className="font-medium">No hay consumos recientes</p>
                                <p className="text-sm">Los datos aparecerán cuando se registren nuevos consumos</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Botón de actualizar */}
            <div className="flex justify-end mt-4">
              <Button
                color="purple"
                text="🔄 Actualizar Lista"
                onClick={fetchConsumosRecientes}
                disabled={loadingConsumos || !user?.id_faena}
                size="small"
              />
            </div>
          </div>

          {/* Footer integrado */}
          <div className="text-center pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-xs sm:text-sm">
              Sistema de Gestión de Combustible v2.1 | Usuario: {user?.nombre} {user?.apellido}
            </p>
          </div>
        </div>
      </div>
      {/* Componente FAB para Stock de Estanques */}
      <StockEstanquesFAB />
    </div>
  );
};

export default Main;