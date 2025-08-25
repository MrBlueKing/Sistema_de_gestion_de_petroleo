import React, { useState, useEffect, useContext } from "react";
import {
  FaGasPump,
  FaSpinner,
  FaExclamationTriangle,
  FaHome,
  FaCalendarAlt,
  FaTruck,
  FaUser,
  FaChartLine,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import axios from "../../../lib/axios";
import { UserContext } from "../../../context/userContext";
import FiltrosComponent from '../../molecules/FiltrosComponent';
import Header from "../Gerente/Header";
import UniversalHeader from "../Todos/UniversalHeader";

// Importar componente desde pdf/components
import PDFGenerator from '../../../pdf/components/PDFGenerator';

// 🎨 CONFIGURACIÓN DE COLORES POR FAENA - IGUAL QUE HistorialMaquinasView
const FAENA_COLORS = {
    'Cabildo': {
        id: 1,
        primary: 'from-green-700 to-green-800',
        light: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-800',
        icon: '🌿',
        gradient: 'bg-gradient-to-r from-green-600 to-green-700'
    },
    'Tiltil': {
        id: 4,
        primary: 'from-red-700 to-red-800',
        light: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800',
        icon: '🏔️',
        gradient: 'bg-gradient-to-r from-red-600 to-red-700'
    }
};

// 🛠️ Función para obtener colores de una faena
const getFaenaColors = (faenaName) => {
    if (!faenaName || typeof faenaName !== 'string') {
        return {
            primary: 'from-gray-600 to-gray-700',
            light: 'bg-gray-50',
            border: 'border-gray-200',
            text: 'text-gray-800',
            badge: 'bg-gray-100 text-gray-800',
            icon: '🏢',
            gradient: 'bg-gradient-to-r from-gray-500 to-gray-600'
        };
    }

    const normalizedName = faenaName.trim();
    
    for (const [key, colors] of Object.entries(FAENA_COLORS)) {
        if (key.toLowerCase() === normalizedName.toLowerCase()) {
            return colors;
        }
    }

    // Color por defecto para faenas desconocidas (naranja)
    return {
        primary: 'from-orange-600 to-orange-700',
        light: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        badge: 'bg-orange-100 text-orange-800',
        icon: '🏢',
        gradient: 'bg-gradient-to-r from-orange-500 to-orange-600'
    };
};

// Configuración de paginación
const ITEMS_PER_PAGE = 10;

// Componente de paginación
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemsPerPage = ITEMS_PER_PAGE
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
      {/* Información de elementos */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{startItem}</span> a{" "}
        <span className="font-medium">{endItem}</span> de{" "}
        <span className="font-medium">{totalItems}</span> resultados
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-300"
            }`}
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        {/* Números de página */}
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage
              ? "bg-orange-600 text-white"
              : page === '...'
                ? "text-gray-400 cursor-default"
                : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-300"
              }`}
          >
            {page}
          </button>
        ))}

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-300"
            }`}
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const DateFilter = ({
  onFilterChange,
  initialDateFrom = "",
  initialDateTo = "",
  initialEquipoFilter = "",
  initialFaenaSeleccionada = "todas",
  showQuickFilters = true,
  showFaenaFilter = true,
  className = "",
}) => {
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [equipoFilter, setEquipoFilter] = useState(initialEquipoFilter);
  const [faenas, setFaenas] = useState([]);
  const [faenaSeleccionada, setFaenaSeleccionada] = useState(initialFaenaSeleccionada);

  // Cargar faenas disponibles
  useEffect(() => {
    const cargarFaenas = async () => {
      if (!showFaenaFilter) return;
      
      try {
        const response = await axios.get('/api/faenas');
        const faenasData = response.data.data || response.data;

        if (Array.isArray(faenasData)) {
          const faenasFormateadas = faenasData.map(faena => ({
            value: faena.id_faena.toString(),
            label: faena.ubicacion || faena.nombre || `Faena ${faena.id_faena}`
          }));
          setFaenas(faenasFormateadas);
        }
      } catch (error) {
        console.error('Error al cargar faenas:', error);
        setFaenas([]);
      }
    };

    cargarFaenas();
  }, [showFaenaFilter]);

  useEffect(() => {
    if (faenas.length > 0 && showFaenaFilter) {
      console.log('📢 DateFilter: Faenas cargadas, notificando al padre...', faenas.length);
      notifyChange(dateFrom, dateTo, equipoFilter, faenaSeleccionada);
    }
  }, [faenas]);

  const notifyChange = (newDateFrom, newDateTo, newEquipoFilter, newFaenaSeleccionada) => {
    if (onFilterChange) {
      onFilterChange({
        dateFrom: newDateFrom,
        dateTo: newDateTo,
        equipoFilter: newEquipoFilter,
        faenas: faenas,
        ...(showFaenaFilter && { faenaSeleccionada: newFaenaSeleccionada })
      });
    }
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    notifyChange(value, dateTo, equipoFilter, faenaSeleccionada);
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    notifyChange(dateFrom, value, equipoFilter, faenaSeleccionada);
  };

  const handleEquipoFilterChange = (value) => {
    setEquipoFilter(value);
    notifyChange(dateFrom, dateTo, value, faenaSeleccionada);
  };

  const handleFaenaChange = (value) => {
    setFaenaSeleccionada(value);
    notifyChange(dateFrom, dateTo, equipoFilter, value);
  };

  const handleFiltrosChange = ({
    fechaDesde,
    fechaHasta,
    equipoFilter: newEquipoFilter,
    faenaSeleccionada: newFaenaSeleccionada
  }) => {
    setDateFrom(fechaDesde || '');
    setDateTo(fechaHasta || '');
    setEquipoFilter(newEquipoFilter || '');
    
    if (showFaenaFilter) {
      setFaenaSeleccionada(newFaenaSeleccionada || 'todas');
    }
    
    notifyChange(
      fechaDesde || '', 
      fechaHasta || '', 
      newEquipoFilter || '', 
      showFaenaFilter ? newFaenaSeleccionada || 'todas' : 'todas'
    );
  };

  const applyQuickFilter = (filterType) => {
    const today = new Date();
    let from, to;

    switch (filterType) {
      case "today":
        from = to = today.toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        from = to = yesterday.toISOString().split("T")[0];
        break;
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        from = startOfWeek.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
      case "lastWeek":
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        from = lastWeekStart.toISOString().split("T")[0];
        to = lastWeekEnd.toISOString().split("T")[0];
        break;
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        from = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        to = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        break;
      default:
        return;
    }

    setDateFrom(from);
    setDateTo(to);
    notifyChange(from, to, equipoFilter, faenaSeleccionada);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setEquipoFilter("");
    setFaenaSeleccionada("todas");
    notifyChange("", "", "", "todas");
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-4 sm:p-6 mb-6 ${className}`}>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FaSearch className="text-orange-600" />
          Filtros de Búsqueda
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            Filtra por fecha{showFaenaFilter ? ", faena" : ""} y nombre de equipo
          </p>
        </div>
      </div>

      {/* FiltrosComponent integrado */}
      <FiltrosComponent
        fechaDesde={dateFrom}
        modo="faenas"
        fechaHasta={dateTo}
        faenaSeleccionada={faenaSeleccionada}
        faenas={faenas}
        onChange={handleFiltrosChange}
        
        // Props específicas para mostrar filtros
        mostrarEquipoFilter={true}
        equipoFilter={equipoFilter}
        placeholderEquipo="Ejemplo: Excavadora, Camión, patente, etc..."
        mostrarFaenas={showFaenaFilter}
        
        // Props de configuración para que se vea como DateFilter
        incluirHoras={false}
        mostrarTitulo={false}
        mostrarResumen={false}
        
        // Estilo compacto
        compacto={true}
      />

      {/* Filtros rápidos originales */}
      {showQuickFilters && (
        <div className="mb-3 sm:mb-4">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 block">
            🚀 Filtros Rápidos de Fecha
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
              onClick={() => applyQuickFilter("thisWeek")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Esta Semana
            </button>
            <button
              onClick={() => applyQuickFilter("lastWeek")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Semana Pasada
            </button>
            <button
              onClick={() => applyQuickFilter("thisMonth")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Este Mes
            </button>
            <button
              onClick={() => applyQuickFilter("lastMonth")}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
            >
              Mes Pasado
            </button>
          </div>
        </div>
      )}

      {/* Botón limpiar filtros */}
      <div className="flex justify-end">
        <button
          onClick={clearFilters}
          className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
        >
          <FaTimes className="text-xs" />
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

// Componente Button
const Button = ({
  text,
  onClick,
  color = "blue",
  disabled = false,
  size = "medium",
  icon = null,
}) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-300 transform";
  
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-2 text-sm sm:text-base",
    large: "px-6 py-3 text-base sm:text-lg",
  };

  const colorClasses = {
    blue: disabled
      ? "bg-blue-300 text-blue-100 cursor-not-allowed"
      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:scale-105 shadow-lg hover:shadow-xl group",
    orange: disabled
      ? "bg-orange-300 text-orange-100 cursor-not-allowed"
      : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg hover:shadow-xl group",
    green: disabled
      ? "bg-green-300 text-green-100 cursor-not-allowed"
      : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-xl group",
    red: disabled
      ? "bg-red-300 text-red-100 cursor-not-allowed"
      : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg hover:shadow-xl group",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} flex items-center gap-2 justify-center`}
    >
      {icon && (
        <span
          className={`transition-transform duration-300 ${
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
        <FaSpinner className="text-orange-400 text-3xl sm:text-4xl opacity-20" />
      </div>
    </div>
    <span className="ml-3 sm:ml-4 text-gray-600 font-medium text-base sm:text-lg">{message}</span>
  </div>
);

// Componente de tarjeta móvil para consumos CON COLORES
const ConsumoCard = ({ consumo, formatearFecha, formatNumber }) => {
  const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
  
  // 🆕 AGREGAR: Obtener colores de la faena
  const faenaColors = getFaenaColors(consumo.faena);

  return (
    <div className={`${faenaColors.light} border ${faenaColors.border} border-l-4 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative`}>
      {/* 🆕 AGREGAR: Badge de faena en la esquina superior derecha */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${faenaColors.badge} shadow-md transform group-hover:scale-105 transition-transform duration-200`}>
          <span className="text-xs">{faenaColors.icon}</span>
          {consumo.faena}
        </span>
      </div>

      {/* Header con fecha y litros */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-orange-600 text-sm" />
          <div>
            <div className="font-bold text-gray-800 text-sm">{fecha}</div>
            <div className="text-xs text-gray-500">{hora}</div>
          </div>
        </div>
        <div className="text-right mr-16"> {/* Margen para no solapar con badge */}
          <div className="text-xs text-gray-500 mb-1">Litros</div>
          <div className="font-bold text-lg text-orange-600">
            {formatNumber(consumo.litros_consumidos)} L
          </div>
        </div>
      </div>

      {/* Información principal: Equipo */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <FaTruck className="text-green-600 text-sm" />
          <span className="text-xs font-medium text-gray-600 uppercase">EQUIPO</span>
        </div>
        <div className="font-bold text-gray-800 text-sm">{consumo.nombre_maquina || "N/A"}</div>
        <div className="text-xs text-gray-600">Patente: {consumo.patente || "N/A"}</div>
      </div>

      {/* Información adicional en grid compacto */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaUser className="text-purple-600 text-xs" />
            <span className="text-xs font-medium text-gray-600 uppercase">Solicitante</span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {consumo.solicitante_nombre || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            {consumo.id_dotacion || "N/A"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaGasPump className="text-orange-600 text-xs" />
            <span className="text-xs font-medium text-gray-600 uppercase">Estanque</span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {consumo.estanque || "N/A"}
          </div>
        </div>

        {consumo.medicion && (
          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-1">
              <FaChartLine className="text-indigo-600 text-xs" />
              <span className="text-xs font-medium text-gray-600 uppercase">Medición</span>
            </div>
            <div className="font-medium text-gray-800 text-xs">
              {formatNumber(consumo.medicion)} {consumo.tipo_medicion === "Kilometraje" ? "km" : "hrs"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConsumosView = () => {
  const { user, loading } = useContext(UserContext);

  const [consumos, setConsumos] = useState([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    equipoFilter: "",
    faenaSeleccionada: "todas"
  });

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Estados para estadísticas de la API
  const [stats, setStats] = useState({
    total_consumos: 0,
    total_litros: 0,
    promedio_consumo: 0,
    costo_total: 0,
    equipo_mas_usado: "N/A",
    consumos_simples: 0,
    consumos_multiples: 0,
    porcentaje_multiples: 0
  });

  // Formatear números
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return parseFloat(num).toLocaleString("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Formatear fecha
  const formatearFecha = (fechaString) => {
    if (!fechaString) return { fecha: "N/A", hora: "N/A" };
    
    const fecha = new Date(fechaString);
    const fechaFormateada = fecha.toLocaleDateString("es-CL");
    const horaFormateada = fecha.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    return { fecha: fechaFormateada, hora: horaFormateada };
  };

  // Calcular número total de páginas
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Función para obtener consumos de la API
  const fetchConsumos = async (filterParams = {}, page = 1) => {
    setLoadingConsumos(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: ITEMS_PER_PAGE.toString(),
      });

      // Validación crítica: Solo continuar si hay faenas válidas
      if (filterParams.faenaSeleccionada === 'todas') {
        const todasLasFaenas = filterParams.faenas || [];
        
        if (todasLasFaenas.length === 0) {
          console.log("❌ [FETCH] No hay faenas disponibles - cancelando consulta");
          setLoadingConsumos(false);
          return;
        }
        
        const idsTodasFaenas = todasLasFaenas.map(f => f.value).join(',');
        params.append('faenas', idsTodasFaenas);
        console.log("🌍 [FETCH] Consultando todas las faenas:", idsTodasFaenas);
        
      } else if (filterParams.faenaSeleccionada && filterParams.faenaSeleccionada !== 'todas') {
        params.append('faena', filterParams.faenaSeleccionada);
        console.log("🎯 [FETCH] Consultando faena específica:", filterParams.faenaSeleccionada);
        
      } else {
        console.log("❌ [FETCH] No hay configuración válida de faenas - cancelando consulta");
        setLoadingConsumos(false);
        return;
      }

      // Agregar otros filtros
      if (filterParams.dateFrom) {
        params.append('dateFrom', filterParams.dateFrom);
      }
      if (filterParams.dateTo) {
        params.append('dateTo', filterParams.dateTo);
      }
      if (filterParams.equipoFilter) {
        params.append('equipoFilter', filterParams.equipoFilter);
      }

      console.log("📤 [FETCH] URL final:", `/api/consumos?${params.toString()}`);

      const response = await axios.get(`/api/consumos?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data && response.data.success) {
        const { data: consumosData, stats, pagination } = response.data;
        
        setConsumos(Array.isArray(consumosData) ? consumosData : []);
        setStats(stats || {
          total_consumos: 0,
          total_litros: 0,
          promedio_consumo: 0,
          costo_total: 0,
          equipo_mas_usado: "N/A",
          consumos_simples: 0,
          consumos_multiples: 0,
          porcentaje_multiples: 0
        });
        setTotalItems(pagination?.total || 0);

        if (isFirstLoad) {
          setIsFirstLoad(false);
          console.log("✅ [FETCH] Primera carga completada");
        }

        console.log("✅ [FETCH] Éxito:", consumosData.length, "consumos cargados");

      } else {
        throw new Error(response.data?.message || 'Error en respuesta');
      }

    } catch (error) {
      console.error("❌ [FETCH] Error:", error.message);
      setError(error.response?.data?.message || error.message);
      setConsumos([]);
      setTotalItems(0);
    } finally {
      setLoadingConsumos(false);
    }
  };

  // Manejar cambios de filtros
  const handleFilterChange = (newFilters) => {
    console.log("🔄 Aplicando filtros:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
    
    if (newFilters.faenas && newFilters.faenas.length > 0) {
      fetchConsumos(newFilters, 1);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchConsumos(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // useEffect para cargar datos cuando cambien los filtros
  useEffect(() => {
    if (filters.faenas && filters.faenas.length > 0) {
      console.log("🔄 [useEffect] Filtros cambiaron, recargando datos...");
      fetchConsumos(filters, currentPage);
    }
  }, [filters]);

  if (loading) {
    return <LoadingSpinner message="Verificando acceso..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para acceder a esta sección.
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 mb-2">
      
      <UniversalHeader type="gerente" />

      <DateFilter
        onFilterChange={handleFilterChange}
        initialDateFrom={filters.dateFrom}
        initialDateTo={filters.dateTo}
        initialEquipoFilter={filters.equipoFilter}
        initialFaenaSeleccionada={filters.faenaSeleccionada}
        showFaenaFilter={true}
      />

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Consumos</p>
              <p className="text-2xl font-bold">{stats.total_consumos.toLocaleString()}</p>
            </div>
            <FaGasPump className="text-3xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Litros</p>
              <p className="text-2xl font-bold">{formatNumber(stats.total_litros)} L</p>
            </div>
            <FaChartLine className="text-3xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Promedio Consumo</p>
              <p className="text-2xl font-bold">{formatNumber(stats.promedio_consumo)} L</p>
            </div>
            <FaTruck className="text-3xl text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Equipo + Usado</p>
              <p className="text-lg font-bold truncate">{stats.equipo_mas_usado || "N/A"}</p>
            </div>
            <FaUser className="text-3xl text-orange-200" />
          </div>
        </div>
      </div>

      {/* Contenedor de Consumos */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-8 mb-6 sm:mb-8 overflow-hidden">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
              <FaGasPump className="text-white text-xl sm:text-2xl" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                Consumos de Combustible
              </h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">
                {totalItems} registros encontrados
                {(filters.dateFrom || filters.dateTo || filters.equipoFilter || 
                  (filters.faenaSeleccionada && filters.faenaSeleccionada !== 'todas')) &&
                " con filtros aplicados"}
              </p>

              {/* INFORMACIÓN ADICIONAL DE TIPOS DE CONSUMO */}
              {stats.consumos_multiples > 0 && (
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Simples: {stats.consumos_simples}</span>
                  <span>Múltiples: {stats.consumos_multiples}</span>
                  <span>({stats.porcentaje_multiples}% múltiples)</span>
                </div>
              )}
              
              {/* Indicador de que se están mostrando todas las faenas */}
              {filters.faenaSeleccionada === 'todas' && filters.faenas && filters.faenas.length > 1 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                  <span className="bg-orange-100 px-2 py-1 rounded-full">
                    🌍 Mostrando todas las faenas ({filters.faenas.length} faenas)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <PDFGenerator
              consumos={consumos}
              stats={stats}
              filters={filters}
              totalItems={totalItems}
              currentPage={currentPage}
              user={user}
              size="small"
              disabled={loadingConsumos}
            />
            <Button
              color="orange"
              text="🔄 Actualizar"
              onClick={() => fetchConsumos(filters, currentPage)}
              disabled={loadingConsumos}
              size="small"
            />
          </div>
        </div>

        {/* Loading o error */}
        {(loadingConsumos || (isFirstLoad && (!filters.faenas || filters.faenas.length === 0))) ? (
          <LoadingSpinner message={
            isFirstLoad && (!filters.faenas || filters.faenas.length === 0) 
              ? "Cargando faenas disponibles..." 
              : "Cargando consumos..."
          } />
        ) : error ? (
          <div className="text-center py-12">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              color="orange"
              text="🔄 Reintentar"
              onClick={() => fetchConsumos(filters, currentPage)}
            />
          </div>
        ) : (
          <>
            {/* Contenido principal - Vista móvil y escritorio */}
            {(!filters.faenas || filters.faenas.length === 0) ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg font-medium">
                  🏗️ Configurando faenas disponibles...
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Espere mientras se cargan las faenas del sistema
                </p>
              </div>
            ) : (
              <>
                {/* Vista móvil - Cards */}
                <div className="block lg:hidden">
                  <div className="space-y-4">
                    {consumos.length > 0 ? (
                      consumos.map((consumo, index) => (
                        <ConsumoCard
                          key={consumo.id_consumo || index}
                          consumo={consumo}
                          formatearFecha={formatearFecha}
                          formatNumber={formatNumber}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-3">📭</div>
                        <div className="text-gray-500 text-base sm:text-lg font-medium">
                          📭 No hay consumos para mostrar
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          {filters.dateFrom || filters.dateTo || filters.equipoFilter
                            ? "Intenta ajustar los filtros de búsqueda"
                            : "No se han registrado consumos aún"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vista escritorio - Tabla CON COLORES */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto rounded-2xl shadow-inner">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                            📅 Fecha/Hora
                          </th>
                          <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                            🚛 Equipo
                          </th>
                          <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                            ⛽ Litros
                          </th>
                          <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                            👤 Solicitante
                          </th>
                          <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                            🛢️ Estanque
                          </th>
                          <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base">
                            📊 Medición
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {consumos.length > 0 ? (
                          consumos.map((consumo, index) => {
                            const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
                            
                            // 🆕 OBTENER COLORES DE LA FAENA
                            const faenaColors = getFaenaColors(consumo.faena);

                            return (
                              <tr
                                key={consumo.id_consumo || index}
                                className={`relative ${faenaColors.light} border-l-4 ${faenaColors.border} hover:shadow-lg hover:bg-opacity-80 transition-all duration-200 group`}
                              >
                                {/* 🆕 CELDA CON BADGE DE FAENA */}
                                <td className="relative py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                  {/* Badge de faena en la esquina superior derecha */}
                                  <div className="absolute top-1 right-1 z-10">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${faenaColors.badge} shadow-md transform group-hover:scale-105 transition-transform duration-200`}>
                                      <span className="text-xs">{faenaColors.icon}</span>
                                      {consumo.faena}
                                    </span>
                                  </div>
                                  
                                  {/* Contenido original de fecha */}
                                  <div className="font-bold text-gray-800">
                                    {fecha}
                                  </div>
                                  <div className="text-xs text-gray-500 font-medium">
                                    {hora}
                                  </div>
                                </td>

                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm font-semibold text-gray-800">
                                  <div className="font-bold">
                                    {consumo.nombre_maquina || "N/A"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Patente: {consumo.patente || "N/A"}
                                  </div>
                                </td>
                                
                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                  <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    {formatNumber(consumo.litros_consumidos)} L
                                  </span>
                                  {consumo.costo_total && (
                                    <div className="text-xs text-gray-500">
                                      ${formatNumber(consumo.costo_total)}
                                    </div>
                                  )}
                                </td>
                                
                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                  <div className="font-semibold text-gray-800">
                                    {consumo.solicitante_nombre || "N/A"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    RUT: {consumo.id_dotacion || "N/A"}
                                  </div>
                                  {consumo.solicitante_tipo && (
                                    <div className="text-xs text-orange-600">
                                      {consumo.solicitante_tipo}
                                    </div>
                                  )}
                                </td>
                                
                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-gray-600 font-medium">
                                  {consumo.estanque || "N/A"}
                                  {consumo.cantidad_estanques > 1 && (
                                    <div className="text-xs text-purple-600 font-semibold">
                                      ({consumo.cantidad_estanques} estanques)
                                    </div>
                                  )}
                                </td>
                                
                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-gray-600">
                                  {consumo.medicion ? (
                                    <span className="font-medium">
                                      {formatNumber(consumo.medicion)}
                                      <span className="text-xs ml-1">
                                        {consumo.tipo_medicion === "Kilometraje" ? "km" : "hrs"}
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
                            <td colSpan="6" className="py-12 text-center">
                              <div className="text-gray-500 text-lg font-medium">
                                📭 No hay consumos para mostrar
                              </div>
                              <p className="text-gray-400 text-sm mt-2">
                                {filters.dateFrom || filters.dateTo || filters.equipoFilter || 
                                 (filters.faenaSeleccionada && filters.faenaSeleccionada !== 'todas')
                                  ? "Intenta ajustar los filtros de búsqueda"
                                  : "No se han registrado consumos aún en ninguna faena"}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Componente de paginación inferior (principal) */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
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
  );
};

export default ConsumosView;