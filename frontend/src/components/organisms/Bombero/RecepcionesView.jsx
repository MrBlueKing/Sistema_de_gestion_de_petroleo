import React, { useState, useEffect, useContext } from "react";
import {
  FaArrowCircleDown,
  FaSpinner,
  FaExclamationTriangle,
  FaFileAlt,
  FaHome,
  FaDollarSign,
  FaGasPump,
  FaCalendarAlt,
  FaTruck,
  FaUser,
} from "react-icons/fa";
import axios from "../../../lib/axios";
import { UserContext } from "../../../context/userContext";
import Header from "../Bombero/Header";

// Componente DateFilter integrado
const DateFilter = ({
  onFilterChange,
  initialDateFrom = "",
  initialDateTo = "",
  showQuickFilters = true,
  className = "",
}) => {
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  const getQuickDates = () => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split("T")[0];

    return {
      today: formatDate(today),
      yesterday: formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
      weekStart: formatDate(
        new Date(today.setDate(today.getDate() - today.getDay()))
      ),
      monthStart: formatDate(
        new Date(today.getFullYear(), today.getMonth(), 1)
      ),
      lastMonth: formatDate(
        new Date(today.getFullYear(), today.getMonth() - 1, 1)
      ),
      lastMonthEnd: formatDate(
        new Date(today.getFullYear(), today.getMonth(), 0)
      ),
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
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 sm:p-3 rounded-xl shadow-lg">
          <FaCalendarAlt className="text-white text-base sm:text-lg" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            📅 Filtros de Fecha
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            Selecciona el rango de fechas para filtrar los resultados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Fecha Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Fecha Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
          />
        </div>
      </div>

      {showQuickFilters && (
        <div className="mb-3 sm:mb-4">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 block">
            🚀 Filtros Rápidos
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyQuickFilter("today")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Hoy
            </button>
            <button
              onClick={() => applyQuickFilter("yesterday")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Ayer
            </button>
            <button
              onClick={() => applyQuickFilter("week")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Esta Semana
            </button>
            <button
              onClick={() => applyQuickFilter("month")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Este Mes
            </button>
            <button
              onClick={() => applyQuickFilter("lastMonth")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Mes Anterior
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-3 sm:pt-4 border-t border-gray-200">
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-xs sm:text-sm"
        >
          Limpiar
        </button>
      </div>

      {(dateFrom || dateTo) && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-xs sm:text-sm">
            <span className="font-medium">Filtro activo:</span>
            {dateFrom && (
              <span>
                Desde:{" "}
                <strong>
                  {new Date(dateFrom).toLocaleDateString("es-CL")}
                </strong>
              </span>
            )}
            {dateFrom && dateTo && <span>•</span>}
            {dateTo && (
              <span>
                Hasta:{" "}
                <strong>{new Date(dateTo).toLocaleDateString("es-CL")}</strong>
              </span>
            )}
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
  onClick,
}) => {
  const baseClasses =
    "relative overflow-hidden flex items-center justify-center gap-2 sm:gap-3 rounded-xl font-semibold transition-all duration-300 transform group";

  const sizeClasses = {
    small: "px-3 sm:px-4 py-2 text-xs sm:text-sm",
    normal: "px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base",
    large: "px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg",
  };

  const colorClasses = {
    orange:
      "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl hover:shadow-orange-200/50 hover:scale-105",
    blue: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-200/50 hover:scale-105",
    green:
      "bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl hover:shadow-green-200/50 hover:scale-105",
    gray: "bg-gray-500 text-white cursor-not-allowed opacity-50",
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
      className={`${baseClasses} ${sizeClasses[size]} ${
        disabled ? colorClasses.gray : colorClasses[color]
      } ${className}`}
      disabled={disabled}
    >
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      )}

      {icon && (
        <span
          className={`text-lg sm:text-xl transition-transform duration-300 z-10 ${
            !disabled ? "group-hover:rotate-6" : ""
          }`}
        >
          {icon}
        </span>
      )}
      <span
        className={`font-medium z-10 transition-all duration-300 ${
          !disabled ? "group-hover:tracking-wide" : ""
        }`}
      >
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
    <span className="ml-3 sm:ml-4 text-gray-600 font-medium text-base sm:text-lg">
      {message}
    </span>
  </div>
);

// Componente de tarjeta móvil para recepciones
const RecepcionCard = ({
  recepcion,
  formatearFecha,
  formatNumber,
  formatCurrency,
}) => {
  const { fecha, hora } = formatearFecha(recepcion.created_at);
  const diferencia = parseFloat(recepcion.diferencia || 0);
  const esDiferenciaSignificativa = Math.abs(diferencia) > 0.5;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header con fecha y total */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600 text-sm" />
          <div>
            <div className="font-bold text-gray-800 text-sm">{fecha}</div>
            <div className="text-xs text-gray-500">{hora}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="font-bold text-lg text-green-600">
            {formatCurrency(recepcion.precio_total)}
          </div>
        </div>
      </div>

      {/* Información principal: N° Guía */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <FaFileAlt className="text-orange-600 text-sm" />
          <span className="text-xs font-medium text-gray-600 uppercase">
            N° GUÍA
          </span>
        </div>
        <div className="font-bold text-gray-800 text-sm">
          {recepcion.numero_guia || "N/A"}
        </div>
      </div>

      {/* Información adicional en grid compacto */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaGasPump className="text-blue-600 text-xs" />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Litros
            </span>
          </div>
          <div className="font-bold text-gray-800 text-xs">
            {formatNumber(recepcion.litros_documentados)} L
          </div>
          <div className="text-xs text-gray-500">
            Recibidos: {formatNumber(recepcion.litros_recibidos)} L
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaDollarSign className="text-green-600 text-xs" />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Precio/L
            </span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {formatCurrency(recepcion.precio)}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecepcionesView = () => {
  const { user, loading } = useContext(UserContext);

  const [recepciones, setRecepciones] = useState([]);
  const [loadingRecepciones, setLoadingRecepciones] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });
  const [stats, setStats] = useState({
    totalRecepciones: 0,
    totalLitros: 0,
    totalMonto: 0,
    promedioPorRecepcion: 0,
  });

  // Función para obtener recepciones
  const fetchRecepciones = async (filterParams = {}) => {
    if (!user?.id_faena) {
      console.log("Usuario sin faena asignada:", user);
      return;
    }

    setLoadingRecepciones(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Construir parámetros de consulta
      const params = new URLSearchParams({
        faena: user.id_faena,
        ...filterParams,
      });

      console.log(
        "Obteniendo recepciones para faena:",
        user.id_faena,
        "con filtros:",
        filterParams
      );

      const response = await axios.get(`/api/recepcionesFecha?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Recepciones recibidas:", response.data);

      const recepcionesData = response.data.data || [];
      setRecepciones(recepcionesData);

      // Calcular estadísticas
      calculateStats(recepcionesData);
    } catch (error) {
      console.error("Error al cargar recepciones:", error);

      let errorMessage = "Error al cargar recepciones";
      if (error.response?.status === 401) {
        errorMessage = "Sesión expirada. Por favor, inicie sesión nuevamente.";
      } else if (error.response?.status === 403) {
        errorMessage = "No tiene permisos para acceder a esta información.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoadingRecepciones(false);
    }
  };

  // Función para calcular estadísticas
  const calculateStats = (data) => {
    const totalRecepciones = data.length;
    const totalLitros = data.reduce(
      (sum, item) => sum + parseFloat(item.litros_documentados || 0),
      0
    );
    const totalMonto = data.reduce(
      (sum, item) => sum + parseFloat(item.precio_total || 0),
      0
    );
    const promedioPorRecepcion =
      totalRecepciones > 0 ? totalMonto / totalRecepciones : 0;

    setStats({
      totalRecepciones,
      totalLitros,
      totalMonto,
      promedioPorRecepcion,
    });
  };

  // Manejar cambios en filtros
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchRecepciones(newFilters);
  };

  // useEffect para cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (!loading && user?.id_faena) {
      console.log("Usuario disponible, cargando recepciones...", user);
      fetchRecepciones();
    }
  }, [user, loading]);

  // Función para formatear fecha
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    const fechaFormateada = fecha.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaFormateada = fecha.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { fecha: fechaFormateada, hora: horaFormateada };
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });
  };

  // Función para formatear números
  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Error de Autenticación
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            No se pudo cargar la información del usuario.
          </p>
          <Button
            color="orange"
            text="🔐 Ir a Login"
            onClick={() => (window.location.href = "/login")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Filtros de fecha */}
        <DateFilter
          onFilterChange={handleFilterChange}
          initialDateFrom={filters.dateFrom}
          initialDateTo={filters.dateTo}
        />

        {/* Estadísticas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs sm:text-sm font-medium mb-2">
                  Total Recepciones
                </p>
                <div className="text-2xl sm:text-3xl font-bold text-blue-800">
                  {stats.totalRecepciones}
                </div>
              </div>
              <FaFileAlt className="text-blue-600 text-2xl sm:text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-xs sm:text-sm font-medium mb-2">
                  Total Litros
                </p>
                <div className="text-2xl sm:text-3xl font-bold text-green-800">
                  {formatNumber(stats.totalLitros)} L
                </div>
              </div>
              <FaGasPump className="text-green-600 text-2xl sm:text-3xl" />
            </div>
          </div>
        </div>

        {/* Contenedor de Recepciones */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-8 mb-6 sm:mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
                <FaArrowCircleDown className="text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                  📥 Recepciones de Combustible
                </h3>
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  {stats.totalRecepciones} recepciones encontradas
                  {(filters.dateFrom || filters.dateTo) &&
                    " con filtros aplicados"}
                </p>
              </div>
            </div>

            <Button
              color="blue"
              text="🔄 Actualizar"
              onClick={() => fetchRecepciones(filters)}
              disabled={loadingRecepciones || !user?.id_faena}
              size="small"
            />
          </div>

          {loadingRecepciones ? (
            <LoadingSpinner message="Cargando recepciones..." />
          ) : error ? (
            <div className="text-center py-12 sm:py-16">
              <div className="text-red-500 text-3xl sm:text-4xl mb-4">
                <FaExclamationTriangle className="mx-auto" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                Error al cargar datos
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
              <Button
                color="blue"
                text="🔄 Reintentar"
                onClick={() => fetchRecepciones(filters)}
              />
            </div>
          ) : (
            <>
              {/* Vista móvil - Cards */}
              <div className="block lg:hidden">
                <div className="space-y-4">
                  {recepciones.length > 0 ? (
                    recepciones.map((recepcion, index) => (
                      <RecepcionCard
                        key={index}
                        recepcion={recepcion}
                        formatearFecha={formatearFecha}
                        formatNumber={formatNumber}
                        formatCurrency={formatCurrency}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-3">📭</div>
                      <div className="text-gray-500 text-base sm:text-lg font-medium">
                        📭 No hay recepciones para mostrar
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        {filters.dateFrom || filters.dateTo
                          ? "Intenta ajustar los filtros de fecha"
                          : "No se han registrado recepciones aún"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vista escritorio - Tabla con columnas reorganizadas */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto rounded-2xl shadow-inner">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                          📅 Fecha/Hora
                        </th>
                        <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                          📄 N° Guía
                        </th>
                        <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                          ⛽ Litros
                        </th>
                        <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                          💰 Precio/L
                        </th>
                        <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                          💵 Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recepciones.length > 0 ? (
                        recepciones.map((recepcion, index) => {
                          const { fecha, hora } = formatearFecha(
                            recepcion.created_at
                          );
                          const diferencia = parseFloat(
                            recepcion.diferencia || 0
                          );
                          const esDiferenciaSignificativa =
                            Math.abs(diferencia) > 0.5;

                          return (
                            <tr
                              key={index}
                              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                            >
                              <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                <div className="font-bold text-gray-800">
                                  {fecha}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                  {hora}
                                </div>
                              </td>
                              <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm font-semibold text-gray-800">
                                {recepcion.numero_guia || "N/A"}
                              </td>
                              <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                <div className="font-bold text-gray-800">
                                  {formatNumber(recepcion.litros_documentados)}{" "}
                                  L
                                </div>
                                <div className="text-xs text-gray-500">
                                  Recibidos:{" "}
                                  {formatNumber(recepcion.litros_recibidos)} L
                                </div>
                              </td>
                              <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm font-semibold text-gray-800">
                                {formatCurrency(recepcion.precio)}
                              </td>
                              <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                  {formatCurrency(recepcion.precio_total)}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-12 text-center">
                            <div className="text-gray-500 text-lg font-medium">
                              📭 No hay recepciones para mostrar
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                              {filters.dateFrom || filters.dateTo
                                ? "Intenta ajustar los filtros de fecha"
                                : "No se han registrado recepciones aún"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 py-6 sm:py-8 border-t border-gray-200/50">
          <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
            Sistema de Gestión de Combustible v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecepcionesView;
