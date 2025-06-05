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
  FaTimesCircle
} from "react-icons/fa";
import axios from "../../../lib/axios";
import { UserContext } from "../../../context/userContext";

// Componente Button simplificado para navegación
const Button = ({ 
  to, 
  color, 
  icon, 
  text, 
  className = "", 
  variant = "primary", 
  size = "normal", 
  disabled = false,
  onClick 
}) => {
  const baseClasses = "relative overflow-hidden flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-300 transform group";
  
  const sizeClasses = {
    small: "px-4 py-2 text-sm",
    normal: "px-6 py-4",
    large: "px-8 py-5 text-lg"
  };

  const colorClasses = {
    orange: variant === "primary" 
      ? "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl hover:shadow-orange-200/50 hover:scale-105" 
      : "bg-white border-2 border-orange-500 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:border-orange-600",
    blue: variant === "primary"
      ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-200/50 hover:scale-105"
      : "bg-white border-2 border-blue-500 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-600",
    green: variant === "primary"
      ? "bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl hover:shadow-green-200/50 hover:scale-105"
      : "bg-white border-2 border-green-500 text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-600",
    gray: "bg-gray-500 text-white cursor-not-allowed opacity-50"
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

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
      className={`${baseClasses} ${sizeClasses[size]} ${disabled ? colorClasses.gray : colorClasses[color]} ${disabledClasses} ${className}`}
      disabled={disabled}
    >
      {/* Efecto de brillo en hover */}
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      )}
      
      {icon && (
        <span className={`text-xl transition-transform duration-300 z-10 ${!disabled ? 'group-hover:rotate-6' : ''}`}>
          {icon}
        </span>
      )}
      <span className={`font-medium z-10 transition-all duration-300 ${!disabled ? 'group-hover:tracking-wide' : ''}`}>
        {text}
      </span>
    </button>
  );
};

// Componente de alerta simple
const AlertCard = ({ type, title, message, onDismiss }) => {
  const alertClasses = {
    warning: "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 text-yellow-800",
    danger: "bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-800",
    info: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-800",
    success: "bg-gradient-to-r from-green-50 to-green-100 border-green-300 text-green-800"
  };

  const iconClasses = {
    warning: <FaExclamationTriangle className="text-xl" />,
    danger: <FaTimesCircle className="text-xl" />,
    info: <FaInfoCircle className="text-xl" />,
    success: <FaCheckCircle className="text-xl" />
  };

  return (
    <div className={`${alertClasses[type]} border-2 rounded-xl p-4 mb-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {iconClasses[type]}
          <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm opacity-90">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="hover:opacity-70 transition-opacity p-1 rounded-full hover:bg-black/10"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// Componente de loading state
const LoadingSpinner = ({ message = "Cargando..." }) => (
  <div className="flex justify-center items-center py-16">
    <div className="relative">
      <FaSpinner className="animate-spin text-gray-400 text-4xl" />
      <div className="absolute inset-0 animate-ping">
        <FaSpinner className="text-blue-400 text-4xl opacity-20" />
      </div>
    </div>
    <span className="ml-4 text-gray-600 font-medium text-lg">{message}</span>
  </div>
);

const Main = () => {
  // Usar UserContext como en FormRecepcion
  const { user, loading } = useContext(UserContext);
  
  const [consumosRecientes, setConsumosRecientes] = useState([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Función para obtener consumos recientes siguiendo el patrón de FormRecepcion
  const fetchConsumosRecientes = async () => {
    if (!user?.id_faena) {
      console.log('Usuario sin faena asignada:', user);
      return;
    }

    setLoadingConsumos(true);
    setError(null);

    try {
      // Obtener token como en FormRecepcion
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      console.log('Obteniendo consumos para faena:', user.id_faena);

      const response = await axios.get(`/api/consumos/recientes?faena=${user.id_faena}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Consumos recibidos:', response.data);
      setConsumosRecientes(response.data.data || []);
      setLastUpdate(new Date());

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
      console.log('Usuario disponible, cargando consumos...', user);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4">
          <LoadingSpinner message="Obteniendo información del usuario..." />
        </div>
      </div>
    );
  }

  // Error state si no hay usuario
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 border-2 border-red-200">
          <div className="text-red-500 text-6xl mb-4">
            <FaExclamationTriangle className="mx-auto animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar la información del usuario.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section simplificado */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 bg-clip-text text-transparent mb-4">
            Sistema de Gestión de Combustible
          </h1>
        </div>

        {/* Mostrar errores si los hay */}
        {error && (
          <AlertCard
            type="danger"
            title="⚠️ Error de Conexión"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Botones principales simplificados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Button
            to="/BomberoRecepcion"
            color="orange"
            icon={<FaArrowCircleDown />}
            text="📥 Ingresar Recepción"
            size="large"
            disabled={!user?.id_faena}
          />
          
          <Button
            to="/BomberoNavigation"
            color="orange"
            icon={<FaGasPump />}
            text="⛽ Registrar Consumo"
            size="large"
            disabled={!user?.id_faena}
          />
          
         <Button
  to="/bombero/recepciones"
  color="blue"
  icon={<FaArrowCircleDown />}
  text="📋 Ver Recepciones"
/>
          
        <Button
  to="/bombero/consumos"
  color="green"
  icon={<FaGasPump />}
  text="⛽ Ver Consumos"
/>
        </div>

        {/* Tabla de Consumos Recientes */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-4 rounded-2xl shadow-lg">
                <FaGasPump className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">🕒 Consumos Recientes</h3>
                <p className="text-gray-600 font-medium">Últimas cargas realizadas</p>
              </div>
            </div>
            
            <Button
              color="blue"
              text="🔄 Actualizar"
              onClick={fetchConsumosRecientes}
              disabled={loadingConsumos || !user?.id_faena}
              size="small"
            />
          </div>
          
          {loadingConsumos ? (
            <LoadingSpinner message="Cargando consumos recientes..." />
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-red-500 text-4xl mb-4">
                <FaExclamationTriangle className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar datos</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                color="blue"
                text="🔄 Reintentar"
                onClick={fetchConsumosRecientes}
              />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl shadow-inner">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="text-left py-5 px-6 font-bold text-gray-700">📅 Fecha/Hora</th>
                    <th className="text-left py-5 px-6 font-bold text-gray-700">👤 Solicitante</th>
                    <th className="text-left py-5 px-6 font-bold text-gray-700">🚛 Equipo</th>
                    <th className="text-left py-5 px-6 font-bold text-gray-700">⛽ Litros</th>
                    <th className="text-left py-5 px-6 font-bold text-gray-700">🛢️ Estanque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consumosRecientes.length > 0 ? (
                    consumosRecientes.map((consumo, index) => {
                      const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
                      return (
                        <tr 
                          key={index} 
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                        >
                          <td className="py-5 px-6 text-sm">
                            <div className="font-bold text-gray-800">{fecha}</div>
                            <div className="text-xs text-gray-500 font-medium">{hora}</div>
                          </td>
                          <td className="py-5 px-6 text-sm font-semibold text-gray-800">
                            {consumo.solicitante_nombre || 'N/A'}
                          </td>
                          <td className="py-5 px-6 text-sm font-semibold text-gray-800">
                            {consumo.nombre_maquina || 'N/A'}
                          </td>
                          <td className="py-5 px-6 text-sm">
                            <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                              {parseFloat(consumo.litros_consumidos).toFixed(2)} L
                            </span>
                          </td>
                          <td className="py-5 px-6 text-sm text-gray-600 font-medium">
                            {consumo.estanque || 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="text-gray-500 text-lg font-medium">
                          📭 No hay consumos recientes para mostrar
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          Los datos se actualizarán cuando se registren nuevos consumos
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer simplificado */}
        <div className="text-center mt-12 py-8 border-t border-gray-200/50">
          <p className="text-gray-600 font-medium mb-2">
            Sistema de Gestión de Combustible v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;