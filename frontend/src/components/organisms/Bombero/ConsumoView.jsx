
import React, { useState, useEffect, useContext } from "react";
import { 
  FaGasPump,
  FaSpinner,
  FaExclamationTriangle,
  FaHome,
  FaCalendarAlt,
  FaTruck,
  FaUser,
  FaChartLine
} from "react-icons/fa";
import axios from "../../../lib/axios";
import { UserContext } from "../../../context/userContext";

// Componente DateFilter integrado
const DateFilter = ({ 
  onFilterChange, 
  initialDateFrom = "", 
  initialDateTo = "",
  showQuickFilters = true,
  className = ""
}) => {
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  const getQuickDates = () => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    return {
      today: formatDate(today),
      yesterday: formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
      weekStart: formatDate(new Date(today.setDate(today.getDate() - today.getDay()))),
      monthStart: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      lastMonth: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      lastMonthEnd: formatDate(new Date(today.getFullYear(), today.getMonth(), 0))
    };
  };

  const quickDates = getQuickDates();

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    if (onFilterChange) {
      onFilterChange({ dateFrom: value, dateTo });
    }
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    if (onFilterChange) {
      onFilterChange({ dateFrom, dateTo: value });
    }
  };

  const applyQuickFilter = (period) => {
    let newDateFrom = "";
    let newDateTo = "";

    switch (period) {
      case "today":
        newDateFrom = quickDates.today;
        newDateTo = quickDates.today;
        break;
      case "yesterday":
        newDateFrom = quickDates.yesterday;
        newDateTo = quickDates.yesterday;
        break;
      case "week":
        newDateFrom = quickDates.weekStart;
        newDateTo = quickDates.today;
        break;
      case "month":
        newDateFrom = quickDates.monthStart;
        newDateTo = quickDates.today;
        break;
      case "lastMonth":
        newDateFrom = quickDates.lastMonth;
        newDateTo = quickDates.lastMonthEnd;
        break;
      default:
        break;
    }

    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
    
    if (onFilterChange) {
      onFilterChange({ dateFrom: newDateFrom, dateTo: newDateTo });
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    if (onFilterChange) {
      onFilterChange({ dateFrom: "", dateTo: "" });
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
          <FaCalendarAlt className="text-white text-lg" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">📅 Filtros de Fecha</h3>
          <p className="text-gray-600 text-sm">Selecciona el rango de fechas para filtrar los resultados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
          />
        </div>
      </div>

      {showQuickFilters && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-3 block">🚀 Filtros Rápidos</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => applyQuickFilter("today")} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
              Hoy
            </button>
            <button onClick={() => applyQuickFilter("yesterday")} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
              Ayer
            </button>
            <button onClick={() => applyQuickFilter("week")} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
              Esta Semana
            </button>
            <button onClick={() => applyQuickFilter("month")} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
              Este Mes
            </button>
            <button onClick={() => applyQuickFilter("lastMonth")} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
              Mes Anterior
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
        <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium">
          Limpiar
        </button>
      </div>

      {(dateFrom || dateTo) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <span className="font-medium">Filtro activo:</span>
            {dateFrom && <span>Desde: <strong>{new Date(dateFrom).toLocaleDateString('es-CL')}</strong></span>}
            {dateFrom && dateTo && <span>•</span>}
            {dateTo && <span>Hasta: <strong>{new Date(dateTo).toLocaleDateString('es-CL')}</strong></span>}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Button
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
  const baseClasses = "relative overflow-hidden flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-300 transform group";
  
  const sizeClasses = {
    small: "px-4 py-2 text-sm",
    normal: "px-6 py-4",
    large: "px-8 py-5 text-lg"
  };

  const colorClasses = {
    orange: "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl hover:shadow-orange-200/50 hover:scale-105",
    blue: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-200/50 hover:scale-105",
    green: "bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl hover:shadow-green-200/50 hover:scale-105",
    gray: "bg-gray-500 text-white cursor-not-allowed opacity-50"
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

// Componente LoadingSpinner
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

const ConsumosView = () => {
  const { user, loading } = useContext(UserContext);
  
  const [consumos, setConsumos] = useState([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });
  const [stats, setStats] = useState({
    totalConsumos: 0,
    totalLitros: 0,
    promedioConsumo: 0,
    equipoMasUsado: "N/A"
  });

  // Función para obtener consumos
  const fetchConsumos = async (filterParams = {}) => {
    if (!user?.id_faena) {
      console.log('Usuario sin faena asignada:', user);
      return;
    }

    setLoadingConsumos(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Construir parámetros de consulta
      const params = new URLSearchParams({
        faena: user.id_faena,
        ...filterParams
      });

      console.log('Obteniendo consumos para faena:', user.id_faena, 'con filtros:', filterParams);

      const response = await axios.get(`/api/consumosFecha?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Consumos recibidos:', response.data);
      
      const consumosData = response.data.data || [];
      setConsumos(consumosData);
      
      // Calcular estadísticas
      calculateStats(consumosData);

    } catch (error) {
      console.error('Error al cargar consumos:', error);
      
      let errorMessage = 'Error al cargar consumos';
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

  // Función para calcular estadísticas
  const calculateStats = (data) => {
    const totalConsumos = data.length;
    const totalLitros = data.reduce((sum, item) => sum + parseFloat(item.litros_consumidos || 0), 0);
    const promedioConsumo = totalConsumos > 0 ? totalLitros / totalConsumos : 0;
    
    // Encontrar equipo más usado
    const equipoCount = {};
    data.forEach(item => {
      const equipo = item.nombre_maquina || 'Sin equipo';
      equipoCount[equipo] = (equipoCount[equipo] || 0) + 1;
    });
    
    const equipoMasUsado = Object.keys(equipoCount).length > 0 
      ? Object.keys(equipoCount).reduce((a, b) => equipoCount[a] > equipoCount[b] ? a : b)
      : "N/A";

    setStats({
      totalConsumos,
      totalLitros,
      promedioConsumo,
      equipoMasUsado
    });
  };

  // Manejar cambios en filtros
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchConsumos(newFilters);
  };

  // useEffect para cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (!loading && user?.id_faena) {
      console.log('Usuario disponible, cargando consumos...', user);
      fetchConsumos();
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

  // Función para formatear números
  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });
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
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 bg-clip-text text-transparent mb-4">
            📈 Historial de Consumos
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Registro completo de cargas de combustible
          </p>
        </div>

        {/* Filtros de fecha */}
        <DateFilter
          onFilterChange={handleFilterChange}
          initialDateFrom={filters.dateFrom}
          initialDateTo={filters.dateTo}
        />

        {/* Estadísticas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium mb-2">Promedio por Consumo</p>
                <div className="text-3xl font-bold text-orange-800">{formatNumber(stats.promedioConsumo)} L</div>
              </div>
              <FaGasPump className="text-orange-600 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium mb-2">Equipo Más Usado</p>
                <div className="text-lg font-bold text-purple-800 truncate">{stats.equipoMasUsado}</div>
              </div>
              <FaTruck className="text-purple-600 text-3xl" />
            </div>
          </div>
        </div>

        {/* Tabla de Consumos */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
                <FaGasPump className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">⛽ Consumos de Combustible</h3>
                <p className="text-gray-600 font-medium">
                  {stats.totalConsumos} consumos encontrados
                  {(filters.dateFrom || filters.dateTo) && " con filtros aplicados"}
                </p>
              </div>
            </div>
            
            <Button
              color="blue"
              text="🔄 Actualizar"
              onClick={() => fetchConsumos(filters)}
              disabled={loadingConsumos || !user?.id_faena}
              size="small"
            />
          </div>
          
          {loadingConsumos ? (
            <LoadingSpinner message="Cargando consumos..." />
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
                onClick={() => fetchConsumos(filters)}
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
                    <th className="text-left py-5 px-6 font-bold text-gray-700">💰 Costo</th>
                    <th className="text-left py-5 px-6 font-bold text-gray-700">📊 Medición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consumos.length > 0 ? (
                    consumos.map((consumo, index) => {
                      const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
                      const costoTotal = (parseFloat(consumo.litros_consumidos) * parseFloat(consumo.precio_litro || 0));
                      
                      return (
                        <tr 
                          key={index} 
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                        >
                          <td className="py-5 px-6 text-sm">
                            <div className="font-bold text-gray-800">{fecha}</div>
                            <div className="text-xs text-gray-500 font-medium">{hora}</div>
                          </td>
                          <td className="py-5 px-6 text-sm">
                            <div className="font-semibold text-gray-800">
                              {consumo.solicitante_nombre || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              RUT: {consumo.id_dotacion || 'N/A'}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-sm font-semibold text-gray-800">
                            <div className="font-bold">{consumo.nombre_maquina || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                              Patente: {consumo.patente || 'N/A'}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-sm">
                            <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                              {formatNumber(consumo.litros_consumidos)} L
                            </span>
                          </td>
                          <td className="py-5 px-6 text-sm text-gray-600 font-medium">
                            {consumo.estanque || 'N/A'}
                          </td>
                          <td className="py-5 px-6 text-sm">
                            {consumo.precio_litro ? (
                              <div>
                                <div className="font-bold text-green-700">
                                  {formatCurrency(costoTotal)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(consumo.precio_litro)}/L
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-sm text-gray-600">
                            {consumo.medicion ? (
                              <span className="font-medium">
                                {formatNumber(consumo.medicion)} 
                                <span className="text-xs ml-1">
                                  {consumo.tipo_medicion === 'Kilometraje' ? 'km' : 'hrs'}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <div className="text-gray-500 text-lg font-medium">
                          📭 No hay consumos para mostrar
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          {(filters.dateFrom || filters.dateTo) 
                            ? "Intenta ajustar los filtros de fecha" 
                            : "No se han registrado consumos aún"
                          }
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón de regreso */}
        <div className="flex justify-center">
          <Button
            to="/bombero"
            color="gray"
            icon={<FaHome />}
            text="🏠 Volver al Inicio"
            className="bg-gray-600 hover:bg-gray-700"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-gray-200/50">
          <p className="text-gray-600 font-medium mb-2">
            Sistema de Gestión de Combustible v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsumosView