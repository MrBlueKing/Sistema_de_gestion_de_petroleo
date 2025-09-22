import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  FaMapMarkerAlt,
  FaIndustry,
  FaEye,
  FaEyeSlash,
  FaHistory,
} from "react-icons/fa";
import { MdOutlineAnalytics } from "react-icons/md";
import axios from "../../../lib/axios";
import { UserContext } from "../../../context/userContext";
import UniversalHeader from "../Todos/UniversalHeader";
import VisualizacionesConsumoMaquina from "../Bombero/VisualizacionesConsumoMaquina";
import PDFGenerator from "../../../pdf/components/PDFGenerator";
import FiltroMaquinasMobileFriendly from "../../molecules/FiltroMaquinasMobileFriendly";
import { FAENA_COLORS } from "../../../context/faenaColor";
import { getFaenaColors } from "../../../context/faenaColor";

// 🔧 CONFIGURACIÓN
const DEBUG = true;
const ITEMS_PER_PAGE = 10;

const formatearFecha = (fechaString) => {
  try {
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) throw new Error("Fecha inválida");

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
  } catch (error) {
    return { fecha: "Fecha inválida", hora: "Hora inválida" };
  }
};

const formatNumber = (num) => {
  const numero = parseFloat(num || 0);
  if (isNaN(numero)) return "0.00";

  return numero.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 📄 COMPONENTE DE PAGINACIÓN
const Pagination = React.memo(
  ({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    itemsPerPage = ITEMS_PER_PAGE,
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = useMemo(() => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, "...");
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push("...", totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    }, [currentPage, totalPages]);

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{startItem}</span> a{" "}
          <span className="font-medium">{endItem}</span> de{" "}
          <span className="font-medium">{totalItems}</span> resultados
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
              }`}
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>

          {getPageNumbers.map((page, index) => (
            <button
              key={
                typeof page === "number" ? `page-${page}` : `ellipsis-${index}`
              }
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                ? "bg-blue-600 text-white"
                : page === "..."
                  ? "text-gray-400 cursor-default"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
              }`}
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
);

// 🔧 COMPONENTE DE FILTROS OPTIMIZADO
const DateFilter = React.memo(
  ({
    isFiltering = false, // ← AGREGAR ESTO
    onFilterChange,
    initialDateFrom = "",
    initialDateTo = "",
    initialEquipoFilter = "",
    showQuickFilters = true,
    className = "",
    selectedFaenas = [],
    onFaenaToggle,
    stats = {},
    pestanaActiva = "historial",
    maquinasDisponibles = [],
  }) => {
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [equipoFilter, setEquipoFilter] = useState(initialEquipoFilter);
    const [faenasExpanded, setFaenasExpanded] = useState(true);

    // 🚀 OPTIMIZACIÓN: Debounce para filtros
    const [filterTimeout, setFilterTimeout] = useState(null);

    const debouncedFilterChange = useCallback(
      (newFilters) => {
        if (filterTimeout) clearTimeout(filterTimeout);

        const timeout = setTimeout(() => {
          onFilterChange?.(newFilters);
        }, 300);

        setFilterTimeout(timeout);
      },
      [filterTimeout, onFilterChange]
    );

    const getQuickDates = useMemo(() => {
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
    }, []);

    const handleDateFromChange = useCallback(
      (value) => {
        setDateFrom(value);
        const newFilters = { dateFrom: value, dateTo, equipoFilter };
        debouncedFilterChange(newFilters);
      },
      [dateTo, equipoFilter, debouncedFilterChange]
    );

    const handleDateToChange = useCallback(
      (value) => {
        setDateTo(value);
        const newFilters = { dateFrom, dateTo: value, equipoFilter };
        debouncedFilterChange(newFilters);
      },
      [dateFrom, equipoFilter, debouncedFilterChange]
    );

    const handleEquipoFilterChange = useCallback(
      (value) => {
        setEquipoFilter(value);
        const newFilters = { dateFrom, dateTo, equipoFilter: value };
        onFilterChange?.(newFilters);
      },
      [dateFrom, dateTo, onFilterChange]
    );

    const applyQuickFilter = useCallback(
      (period) => {
        let newDateFrom = "";
        let newDateTo = "";

        switch (period) {
          case "today":
            newDateFrom = getQuickDates.today;
            newDateTo = getQuickDates.today;
            break;
          case "yesterday":
            newDateFrom = getQuickDates.yesterday;
            newDateTo = getQuickDates.yesterday;
            break;
          case "week":
            newDateFrom = getQuickDates.weekStart;
            newDateTo = getQuickDates.today;
            break;
          case "month":
            newDateFrom = getQuickDates.monthStart;
            newDateTo = getQuickDates.today;
            break;
          case "lastMonth":
            newDateFrom = getQuickDates.lastMonth;
            newDateTo = getQuickDates.lastMonthEnd;
            break;
          default:
            break;
        }

        setDateFrom(newDateFrom);
        setDateTo(newDateTo);
        const newFilters = {
          dateFrom: newDateFrom,
          dateTo: newDateTo,
          equipoFilter,
        };
        onFilterChange?.(newFilters);
      },
      [getQuickDates, equipoFilter, onFilterChange]
    );

    const clearFilters = useCallback(() => {
      setDateFrom("");
      setDateTo("");
      setEquipoFilter("");
      onFilterChange?.({ dateFrom: "", dateTo: "", equipoFilter: "" });
    }, [onFilterChange]);

    useEffect(() => {
      return () => {
        if (filterTimeout) clearTimeout(filterTimeout);
      };
    }, [filterTimeout]);

    const hasActiveFilters = dateFrom || dateTo || equipoFilter;
    const totalFaenas = Object.keys(FAENA_COLORS).length;

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
              Filtros Compartidos
            </h3>
            {/* ← AGREGAR ESTO */}
            {isFiltering && (
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <FaSpinner className="animate-spin" />
                <span>Procesando filtros...</span>
              </div>
            )}
            <p className="text-gray-600 text-xs sm:text-sm">
              {pestanaActiva === "historial"
                ? "Filtra la tabla de consumos"
                : "Filtra los datos para gráficos"}
            </p>
          </div>

          <div className="ml-auto">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${pestanaActiva === "historial"
                ? "bg-green-100 text-green-800"
                : "bg-purple-100 text-purple-800"
                }`}
            >
              {pestanaActiva === "historial" ? (
                <FaHistory />
              ) : (
                <MdOutlineAnalytics />
              )}
              {pestanaActiva === "historial" ? "Tabla" : "Gráficos"}
            </span>
          </div>
        </div>

        {/* Fechas */}
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

        {/* Filtros rápidos */}
        {showQuickFilters && (
          <div className="mb-4 sm:mb-6">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 block">
              🚀 Filtros Rápidos de Fecha
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "today", label: "Hoy" },
                { key: "yesterday", label: "Ayer" },
                { key: "week", label: "Esta Semana" },
                { key: "month", label: "Este Mes" },
                { key: "lastMonth", label: "Mes Anterior" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => applyQuickFilter(key)}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de faenas */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg shadow-sm">
                <FaIndustry className="text-white text-sm" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-gray-800">
                  🏭 Selector de Faenas
                </h4>
                <p className="text-gray-600 text-xs">
                  {selectedFaenas.length}/{totalFaenas} faenas seleccionadas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFaenasExpanded(!faenasExpanded)}
                  className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs"
                >
                  {faenasExpanded ? "▲" : "▼"}
                </button>
              </div>
            </div>

            <div className={`${faenasExpanded ? "block" : "hidden"} sm:block`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(FAENA_COLORS).map(([id, colors]) => {
                  const isSelected = selectedFaenas.includes(colors.name);

                  return (
                    <button
                      key={id}
                      onClick={() => onFaenaToggle?.(colors.name, !isSelected)}
                      className={`relative overflow-hidden p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 transform active:scale-95 ${isSelected
                        ? `${colors.border} ${colors.badge} shadow-md scale-105`
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                    >
                      <div
                        className={`absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-300 ${isSelected ? "bg-green-500 shadow-lg" : "bg-gray-300"
                          }`}
                      />

                      <div className="text-left">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs sm:text-lg">
                            {colors.emoji}
                          </span>
                          <h5
                            className={`font-bold text-xs sm:text-sm truncate ${isSelected ? colors.text : "text-gray-600"
                              }`}
                          >
                            {colors.name}
                          </h5>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${colors.primary} opacity-60`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-600">
                  <span className="font-medium">Activas:</span>
                  {selectedFaenas.length === 0 ? (
                    <span className="text-red-600 font-medium">Ninguna</span>
                  ) : (
                    selectedFaenas.map((faena) => {
                      const colors = getFaenaColors(faena);
                      return (
                        <span
                          key={faena}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
                        >
                          <span className="text-xs">{colors.emoji}</span>
                          <span className="hidden sm:inline">{faena}</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Filtro por equipo */}
        <FiltroMaquinasMobileFriendly
          maquinasDisponibles={maquinasDisponibles}
          equipoFilter={equipoFilter}
          handleEquipoFilterChange={handleEquipoFilterChange}
        />

        {/* Botón limpiar filtros */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTimes className="mr-1" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    );
  }
);

// 🏷️ COMPONENTE DE TARJETA MÓVIL
const ConsumoCard = React.memo(({ consumo, formatearFecha, formatNumber }) => {
  const fechaFormateada = useMemo(() => {
    if (!consumo.fecha_consumo) return { fecha: "Sin fecha", hora: "Sin hora" };
    return formatearFecha(consumo.fecha_consumo);
  }, [consumo.fecha_consumo, formatearFecha]);

  const faenaColors = useMemo(
    () => getFaenaColors(consumo.faena),
    [consumo.faena]
  );

  const litrosFormateados = useMemo(() => {
    return formatNumber(consumo.litros_consumidos);
  }, [consumo.litros_consumidos, formatNumber]);

  return (
    <div
      className={`relative bg-white border-l-4 ${faenaColors.border} rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 ${faenaColors.bg}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${faenaColors.badge}`}
        >
          <span className="text-xs">{faenaColors.emoji}</span>
          {consumo.faena}
        </span>
        <div className="text-right">
          <div className="font-bold text-lg text-orange-600">
            {litrosFormateados} L
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
        <FaCalendarAlt className="text-blue-500 flex-shrink-0" />
        <span className="font-medium">{fechaFormateada.fecha}</span>
        <span className="text-gray-400">•</span>
        <span>{fechaFormateada.hora}</span>
      </div>

      <div className="mb-2">
        <div className="flex items-center gap-1 mb-1">
          <FaTruck className="text-green-600 text-xs flex-shrink-0" />
          <span className="font-bold text-sm text-gray-800 truncate">
            {consumo.nombre_maquina || "N/A"}
          </span>
        </div>
        <div className="text-xs text-gray-500 ml-4">
          {consumo.patente || "Sin patente"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-start gap-1">
          <FaUser className="text-purple-600 text-xs mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-800 truncate text-xs">
              {consumo.solicitante_nombre || "N/A"}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {consumo.id_dotacion || "Sin RUT"}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1">
          <FaGasPump className="text-blue-600 text-xs mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-800 truncate text-xs">
              {consumo.estanque || "N/A"}
            </div>
            {consumo.cantidad_estanques > 1 && (
              <div className="text-xs text-purple-600 font-semibold">
                {consumo.cantidad_estanques} estanques
              </div>
            )}
          </div>
        </div>

        {consumo.medicion && (
          <div className="flex flex-col col-span-2">
            {/* Medición principal */}
            <div className="flex items-center gap-1">
              <FaChartLine className="text-indigo-600 text-xs flex-shrink-0" />
              <span className="font-medium text-gray-800 text-xs">
                {formatNumber(consumo.medicion)}{" "}
                {consumo.tipo_medicion === "Kilometraje" ? "km" : "hrs"}
              </span>
            </div>

            {/* Diferencia debajo */}
            <span
              className={`text-xs mt-0.5 ${consumo.anomalo ? "text-red-600 font-semibold" : "text-gray-900"
                }`}
            >
              Δ {formatNumber(consumo.diferencia_medicion)}
            </span>

            {/* Badge de anomalía en mobile */}
            {consumo.anomalo && (
              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold shadow-sm w-fit">
                <FaExclamationTriangle className="w-3 h-3 text-red-500" />
                <span>Medición anómala</span>
              </div>
            )}
          </div>
        )}

        {consumo.costo_total && (
          <div className="flex items-center gap-1 col-span-2">
            <span className="text-xs text-gray-500">💰</span>
            <span className="text-xs text-gray-600 font-medium">
              ${formatNumber(consumo.costo_total)}
            </span>
          </div>
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${faenaColors.primary} opacity-60 rounded-b-lg`}
      />
    </div>
  );
});

// 🎯 COMPONENTE PRINCIPAL
const HistorialMaquinasView = () => {
  //Extracción del contexto del usaurio
  const { user, loading: userLoading } = useContext(UserContext);
  //Cargando filtros de faena
  const [isUpdatingFaenas, setIsUpdatingFaenas] = useState(false);
  const [isFilteringFaenas, setIsFilteringFaenas] = useState(false);

  // Estados unificados
  const [pestanaActiva, setPestanaActiva] = useState("historial");
  const [consumos, setConsumos] = useState([]);
  const [maquinasDisponibles, setMaquinasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🆕 ESTADOS SEPARADOS PARA GRÁFICOS
  const [loadingGraficos, setLoadingGraficos] = useState(false);
  const [consumosParaGraficos, setConsumosParaGraficos] = useState([]);

  // 🎯 DETERMINAR EL TIPO DE HEADER BASADO EN EL ROL DEL USUARIO
  const getHeaderType = useMemo(() => {
    if (!user || !user.rol) return null; // fallback

    const userRole = user.rol.rol; // Acceder al rol desde el objeto rol
    console.log("User Role:", userRole);

    switch (userRole) {
      case "bombero":
      case "asistente_bombero":
        return "bombero";

      case "gerente":
        return "gerente";

      case "admin_operador":
        return null; // 🚫 no mostrar header

      default:
        return null;
    }
  }, [user]);


  // Estados de filtros
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    equipoFilter: "",
  });

  // Estado para faenas seleccionadas
  const [selectedFaenas, setSelectedFaenas] = useState(() => {
    // Inicializar con todas las faenas disponibles
    return Object.values(FAENA_COLORS).map(faena => faena.name);
  });

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para estadísticas
  const [stats, setStats] = useState({
    total_consumos: 0,
    total_litros: 0,
    promedio_consumo: 0,
    costo_total: 0,
    equipo_mas_usado: "N/A",
    consumos_simples: 0,
    consumos_multiples: 0,
    porcentaje_multiples: 0,
    faenas: {},
  });

  // 🚀 HOOK PERSONALIZADO PARA API CALLS
  const useAPICall = useCallback(async (apiCallFunction) => {
    try {
      setError(null);
      return await apiCallFunction();
    } catch (error) {
      const errorMessage = handleAPIError(error);
      setError(errorMessage);
      DEBUG && console.error("❌ API Error:", error);
      throw error;
    }
  }, []);

  // Función para convertir selectedFaenas al formato correcto para PDF
  const prepareFiltersForPDF = useMemo(() => {
    if (selectedFaenas.length === 0) {
      return {
        ...filters,
        faenaSeleccionada: null,
      };
    }

    return {
      ...filters,
      selectedFaenas: selectedFaenas, // Pasar las faenas seleccionadas
      faenaSeleccionada: "selectedFaenas", // Indicador especial
    };
  }, [filters, selectedFaenas]);

  // 🛡️ FUNCIÓN PARA MANEJO DE ERRORES
  const handleAPIError = useCallback((error) => {
    if (error.response?.status === 401) {
      return "Sesión expirada. Por favor, inicie sesión nuevamente.";
    } else if (error.response?.status === 403) {
      return "No tiene permisos para acceder a esta información.";
    } else if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    }
    return "Error al procesar la solicitud";
  }, []);

  // 🔧 FUNCIÓN AUXILIAR PARA OBTENER TOKEN (si no existe ya)
  const getAuthToken = useCallback(() => {
    try {
      const authData = JSON.parse(localStorage.getItem("authToken"));
      if (authData?.token) {
        return authData.token;
      }

      // Fallback: buscar token directo
      const directToken = localStorage.getItem('access_token');
      if (directToken) {
        return directToken;
      }

      return null;
    } catch (error) {
      DEBUG && console.warn("Error obteniendo token:", error);
      return localStorage.getItem('access_token');
    }
  }, []);

  // 🔧 FUNCIÓN PARA VALIDAR DATOS
  const validateConsumosData = useCallback((data) => {
    if (!Array.isArray(data)) {
      DEBUG && console.warn("⚠️ Datos de consumos no es un array:", data);
      return [];
    }

    return data.filter((consumo, index) => {
      // Validación más permisiva
      const isValid =
        consumo &&
        typeof consumo === 'object' &&
        (consumo.fecha_consumo || consumo.fecha) && // Más flexible con nombres de campo
        (consumo.litros_consumidos !== undefined && consumo.litros_consumidos !== null) &&
        (consumo.faena || consumo.nombre_faena); // Más flexible con nombres de campo

      if (!isValid) {
        DEBUG && console.warn(`⚠️ Consumo ${index} inválido filtrado:`, {
          consumo,
          validaciones: {
            tieneObjetoConsumo: !!consumo,
            esObjeto: typeof consumo === 'object',
            tieneFecha: !!(consumo.fecha_consumo || consumo.fecha),
            tieneLitros: consumo.litros_consumidos !== undefined && consumo.litros_consumidos !== null,
            tieneFaena: !!(consumo.faena || consumo.nombre_faena)
          }
        });
      }

      return isValid;
    });
  }, []);

  // 🚀 FUNCIÓN PRINCIPAL OPTIMIZADA: fetchAllData
  // ✅ REEMPLAZA las 3 llamadas anteriores por 1 sola llamada optimizada
  const fetchAllData = useCallback(
    async (filterParams = filters, page = currentPage, faenasSeleccionadas = selectedFaenas) => {
      if (faenasSeleccionadas.length === 0) {
        DEBUG && console.warn("⚠️ No hay faenas seleccionadas");
        setConsumos([]);
        setMaquinasDisponibles([]);
        setConsumosParaGraficos([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      try {
        setLoading(true);
        setLoadingGraficos(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          throw new Error("Token de autenticación no disponible");
        }

        // 🗺️ MAPEAR FAENAS A IDS
        const getFaenaId = (name) => {
          for (const [id, faenaConfig] of Object.entries(FAENA_COLORS)) {
            if (faenaConfig.name === name) {
              return id;
            }
          }
          return null;
        };

        const faenaIds = faenasSeleccionadas
          .map(getFaenaId)
          .filter(Boolean)
          .join(",");

        if (!faenaIds) {
          throw new Error("No se pudieron mapear las faenas seleccionadas");
        }

        // 🎯 PARÁMETROS PARA LA LLAMADA OPTIMIZADA
        const params = new URLSearchParams({
          faenas: faenaIds,
          page: page.toString(),
          per_page: ITEMS_PER_PAGE.toString(),
          // 🔑 PARÁMETROS CLAVE PARA UNA SOLA LLAMADA
          include_machines: 'true',
          include_chart_data: pestanaActiva === 'graficos' ? 'true' : 'false',
          include_stats: 'true',
          chart_limit: '1000',
        });

        // Agregar filtros adicionales con soporte para arrays
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value) {
            if (key === 'equipoFilter' && Array.isArray(value) && value.length > 0) {
              // 🎯 ARRAY DE MÁQUINAS: Enviar como múltiples parámetros
              value.forEach(maquina => {
                if (maquina && maquina.trim()) {
                  params.append('equipoFilter[]', maquina.trim());
                }
              });
            } else if (key === 'equipoFilter' && Array.isArray(value) && value.length === 0) {
              // 🔄 ARRAY VACÍO: No enviar nada (todas las máquinas)
              // No hacer nada, equivale a sin filtro
            } else if (value.toString().trim()) {
              // 🔄 OTROS FILTROS: Como antes
              params.append(key, value.toString().trim());
            }
          }
        });

        DEBUG && console.log("🚀 Llamada única optimizada:", {
          url: `/api/consumosFecha?${params.toString()}`,
          pestanaActiva,
          faenasSeleccionadas,
          page
        });

        // 🎯 LLAMADA AL BACKEND OPTIMIZADO
        const response = await axios.get(`/api/consumosFecha?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Error en la respuesta del servidor"
          );
        }

        // 📦 EXTRAER TODOS LOS DATOS DE UNA SOLA RESPUESTA
        const {
          data: consumosData = [],
          machines = [],
          chart_data = [],
          stats = null,
          pagination = {},
          performance = {},
          anomalas_stats = null
        } = response.data;

        DEBUG && console.log("📊 Datos recibidos del backend optimizado:", {
          consumos: consumosData.length,
          machines: machines.length,
          chart_data: chart_data.length,
          stats: !!stats,
          pagination,
          performance,
          anomalas_stats
        });

        // 🔍 DEBUG: Mostrar estructura de un consumo de muestra
        if (consumosData.length > 0) {
          DEBUG && console.log("🔍 Estructura del primer consumo:", {
            consumo: consumosData[0],
            keys: Object.keys(consumosData[0] || {}),
            fecha_consumo: consumosData[0]?.fecha_consumo,
            fecha: consumosData[0]?.fecha,
            litros_consumidos: consumosData[0]?.litros_consumidos,
            faena: consumosData[0]?.faena,
            nombre_faena: consumosData[0]?.nombre_faena
          });
        }

        // ✅ PROCESAR Y VALIDAR CONSUMOS CON FUNCIÓN MEJORADA
        const consumosValidados = validateConsumosData(consumosData);

        DEBUG && console.log("✅ Resultado de validación:", {
          total_recibidos: consumosData.length,
          total_validados: consumosValidados.length,
          porcentaje_validados: consumosData.length > 0 ? Math.round((consumosValidados.length / consumosData.length) * 100) : 0
        });

        setConsumos(consumosValidados);

        // ✅ PROCESAR MÁQUINAS DISPONIBLES
        if (machines && machines.length > 0) {
          const maquinasFormateadas = machines
            .map(maq => maq.display_name || maq.nombre || maq.nombre_maquina)
            .filter(Boolean)
            .filter((nombre, index, array) => array.indexOf(nombre) === index) // Eliminar duplicados
            .sort();

          setMaquinasDisponibles(maquinasFormateadas);
          DEBUG && console.log(`✅ ${maquinasFormateadas.length} máquinas cargadas desde backend optimizado`);
        }

        // ✅ PROCESAR DATOS PARA GRÁFICOS
        if (pestanaActiva === 'graficos') {
          if (chart_data && chart_data.length > 0) {
            setConsumosParaGraficos(chart_data);
            DEBUG && console.log(`📊 ${chart_data.length} registros para gráficos cargados`);
          } else {
            // Si no hay chart_data pero hay consumos, usar consumos para gráficos
            setConsumosParaGraficos(consumosValidados);
            DEBUG && console.log(`📊 Usando ${consumosValidados.length} consumos para gráficos (fallback)`);
          }
        }

        // ✅ PROCESAR ESTADÍSTICAS
        if (stats) {
          const statsFormateadas = {
            total_consumos: stats.total_consumos || 0,
            total_litros: stats.total_litros || 0,
            promedio_consumo: stats.promedio_consumo || 0,
            costo_total: stats.costo_total || 0,
            equipo_mas_usado: stats.equipo_mas_usado || "N/A",
            consumos_simples: stats.consumos_simples || 0,
            consumos_multiples: stats.consumos_multiples || 0,
            porcentaje_multiples: stats.porcentaje_multiples || 0,
            faenas: {}
          };

          // Calcular estadísticas por faena con datos más flexibles
          faenasSeleccionadas.forEach((name) => {
            const consumosFaena = consumosValidados.filter(
              (c) => (c.nombre_faena === name || c.faena === name)
            );
            statsFormateadas.faenas[name] = {
              consumos: consumosFaena.length,
              litros: consumosFaena.reduce(
                (sum, c) => sum + parseFloat(c.litros_consumidos || 0),
                0
              ),
            };
          });

          // Agregar estadísticas anómalas si existen
          if (anomalas_stats) {
            statsFormateadas.anomalas_stats = anomalas_stats;
          }

          setStats(statsFormateadas);
        }

        // ✅ PROCESAR PAGINACIÓN CORRECTAMENTE
        const total = pagination?.total || stats?.total_consumos || consumosValidados.length;
        const totalPgs = pagination?.total_pages || Math.ceil(total / ITEMS_PER_PAGE);

        setTotalItems(total);
        setTotalPages(Math.max(1, totalPgs)); // ✅ Usar setTotalPages como estado

        DEBUG && console.log("✅ fetchAllData completado exitosamente:", {
          consumos: consumosValidados.length,
          totalItems: total,
          totalPages: totalPgs,
          machines: machines.length,
          performance: performance?.total_time || 'N/A',
          anomalas: anomalas_stats
        });

        return consumosValidados;

      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Error desconocido";
        setError(errorMessage);
        DEBUG && console.error("❌ Error en fetchAllData:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      } finally {
        setLoading(false);
        setLoadingGraficos(false);
        setIsFilteringFaenas(false);
        // 🔍 DEBUG: Agregar esto temporalmente
        console.log("🔄 Finally ejecutado - Loading desactivado");
      }
    },
    [filters, selectedFaenas, pestanaActiva, currentPage, getAuthToken, validateConsumosData]
  );

  const faenaTimeoutRef = useRef(null);
  // 🔄 MANEJAR selección/deselección de faenas
  const handleFaenaToggle = useCallback((name, isSelected) => {

    setIsUpdatingFaenas(true); // Activar flag

    if (!isFilteringFaenas) {
      setIsFilteringFaenas(true);
    }

    setSelectedFaenas((prev) => {
      const newSelected = isSelected
        ? [...prev, name]
        : prev.filter((f) => f !== name);

      DEBUG &&
        console.log("🏭 Cambiando faenas:", {
          anterior: prev,
          nueva: newSelected,
          faena: name,
          accion: isSelected ? "AGREGAR" : "QUITAR",
        });

      // Reset página cuando cambian las faenas
      setCurrentPage(1);

      // Limpiar timeout anterior si existe
      if (faenaTimeoutRef.current) {
        clearTimeout(faenaTimeoutRef.current);
      }

      // Crear nuevo timeout
      faenaTimeoutRef.current = setTimeout(() => {
        setIsUpdatingFaenas(false); // Esto disparará el useEffect
      }, 500); // Esperar 500ms después del último cambio


      return newSelected;
    });
  }, [isFilteringFaenas]);

  // 🔧 FUNCIÓN ACTUALIZADA PARA MANEJAR CAMBIOS EN FILTROS
  const handleFilterChange = useCallback((newFilters) => {
    DEBUG && console.log("🔧 Aplicando filtros:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
    // fetchAllData se ejecutará automáticamente por el useEffect
  }, []);

  // 📄 FUNCIÓN ACTUALIZADA PARA MANEJAR CAMBIO DE PÁGINA
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // fetchAllData se ejecutará automáticamente por el useEffect
  }, []);

  // 🎯 FUNCIÓN OPCIONAL: Refrescar datos manualmente
  const refreshData = useCallback(async () => {
    DEBUG && console.log("🔄 Refrescando datos manualmente...");
    await fetchAllData(filters, currentPage, selectedFaenas);
  }, [fetchAllData, filters, currentPage, selectedFaenas]);

  // 📊 FUNCIÓN OPCIONAL: Cambiar a pestaña gráficos y cargar datos
  const switchToGraphicsAndLoad = useCallback(async () => {
    setPestanaActiva("graficos");
    // El useEffect se encargará de recargar con chart_data incluido
  }, []);

  // 🔄 EFECTOS

  // Efecto para cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (!userLoading && user) {
      DEBUG && console.log("👤 Usuario disponible, cargando datos...", user);
      fetchAllData();
    }
  }, [user, userLoading, fetchAllData]);

  // Efecto para recargar cuando cambien filtros o faenas
  //useEffect(() => {
  //  if (user && selectedFaenas.length > 0 && !isUpdatingFaenas) {
  //    fetchAllData(filters, 1, selectedFaenas);
  //  }
  //}, [filters, selectedFaenas, user, fetchAllData, isUpdatingFaenas]);

  //. CLEANUP DEL TIMEOUT
  useEffect(() => {
    return () => {
      if (faenaTimeoutRef.current) {
        clearTimeout(faenaTimeoutRef.current);
      }
    };
  }, []);

  // Efecto para cambio de página
  useEffect(() => {
    if (user && currentPage > 1) {
      fetchAllData(filters, currentPage, selectedFaenas);
    }
  }, [currentPage, user, fetchAllData]);

  // 🆕 EFECTO PARA CAMBIO DE PESTAÑA (recargar datos si cambia a gráficos)
  useEffect(() => {
    if (pestanaActiva === "graficos" && user && selectedFaenas.length > 0) {
      DEBUG && console.log("📊 Cambio a pestaña gráficos, recargando datos...");
      fetchAllData(filters, currentPage, selectedFaenas);
    }
  }, [pestanaActiva, user, selectedFaenas, fetchAllData, filters, currentPage]);

  // 🎨 COMPONENTES DE LOADING Y ERROR
  const LoadingSpinner = useCallback(
    ({ message = "Cargando..." }) => (
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
    ),
    []
  );

  const ErrorDisplay = useCallback(
    ({ error, onRetry }) => (
      <div className="text-center py-12 sm:py-16">
        <div className="text-red-500 text-3xl sm:text-4xl mb-4">
          <FaExclamationTriangle className="mx-auto" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
          Error al cargar datos
        </h3>
        <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Reintentar
        </button>
      </div>
    ),
    []
  );

  const EmptyState = useCallback(
    ({ message, subMessage }) => (
      <div className="text-center py-12 sm:py-16">
        <div className="text-gray-400 text-4xl mb-3">📭</div>
        <div className="text-gray-500 text-base sm:text-lg font-medium">
          {message}
        </div>
        <p className="text-gray-400 text-sm mt-2">{subMessage}</p>
      </div>
    ),
    []
  );

  // 🚨 GUARDS TEMPRANOS
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md mx-4">
          <LoadingSpinner message="Obteniendo información del usuario..." />
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            🔐 Ir a Login
          </button>
        </div>
      </div>
    );
  }

  // 🎨 RENDER PRINCIPAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 py-4 sm:py-6 px-3 sm:px-4">
      <div className=" mx-auto">
        <UniversalHeader
          type={getHeaderType}
        />
        {/* FILTROS COMPARTIDOS */}
        <DateFilter
          isFiltering={isFilteringFaenas}
          onFilterChange={handleFilterChange}
          initialDateFrom={filters.dateFrom}
          initialDateTo={filters.dateTo}
          initialEquipoFilter={filters.equipoFilter}
          selectedFaenas={selectedFaenas}
          onFaenaToggle={handleFaenaToggle}
          stats={stats}
          pestanaActiva={pestanaActiva}
          maquinasDisponibles={maquinasDisponibles}
        />

        {/* SELECTOR DE PESTAÑAS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden z-5">
          <div className="flex">
            <button
              onClick={() => setPestanaActiva("historial")}
              className={`flex-1 flex items-center justify-center gap-3 py-5 px-4 text-base font-semibold transition-all duration-300 relative ${pestanaActiva === "historial"
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-orange-600 hover:bg-gray-50"
                }`}
            >
              <FaHistory className="text-lg" />
              <span className="hidden sm:inline">Historial de Consumos</span>
              <span className="sm:hidden">Historial</span>

              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs ml-2">
                {totalItems}
              </span>

              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-orange-600 transition-all duration-300 ${pestanaActiva === "historial" ? "opacity-100" : "opacity-0"
                  }`}
              ></div>
            </button>

            <div className="w-px bg-gray-200"></div>

            <button
              onClick={() => setPestanaActiva("graficos")}
              className={`flex-1 flex items-center justify-center gap-3 py-5 px-4 text-base font-semibold transition-all duration-300 relative ${pestanaActiva === "graficos"
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-orange-600 hover:bg-gray-50"
                }`}
            >
              <MdOutlineAnalytics className="text-lg" />
              <span className="hidden sm:inline">Análisis y Gráficos</span>
              <span className="sm:hidden">Análisis</span>

              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs ml-2">
                {totalItems}
              </span>

              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-orange-600 transition-all duration-300 ${pestanaActiva === "graficos" ? "opacity-100" : "opacity-0"
                  }`}
              ></div>
            </button>
          </div>
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}
        {pestanaActiva === "historial" && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-3 sm:p-8 mb-4 sm:mb-8 overflow-hidden">
            {/* TARJETAS DE ESTADÍSTICAS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-100 text-xs sm:text-sm truncate">
                      Consumos
                    </p>
                    <p className="text-lg sm:text-2xl font-bold truncate">
                      {stats.total_consumos?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <FaGasPump className="text-xl sm:text-3xl text-blue-200 flex-shrink-0 ml-2" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-green-100 text-xs sm:text-sm truncate">
                      Litros
                    </p>
                    <p className="text-lg sm:text-2xl font-bold truncate">
                      {formatNumber(stats.total_litros)} L
                    </p>
                  </div>
                  <FaChartLine className="text-xl sm:text-3xl text-green-200 flex-shrink-0 ml-2" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-purple-100 text-xs sm:text-sm truncate">
                      Promedio
                    </p>
                    <p className="text-lg sm:text-2xl font-bold truncate">
                      {formatNumber(stats.promedio_consumo)} L
                    </p>
                  </div>
                  <FaTruck className="text-xl sm:text-3xl text-purple-200 flex-shrink-0 ml-2" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-orange-100 text-xs sm:text-sm truncate">
                      Faenas
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {selectedFaenas.length}/{Object.keys(FAENA_COLORS).length}
                    </p>
                  </div>
                  <FaIndustry className="text-xl sm:text-3xl text-orange-200 flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>
            {/* HEADER COMPACTO */}
            <div className="flex items-start justify-between mb-4 sm:mb-8 gap-3">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg flex-shrink-0">
                  <FaGasPump className="text-white text-lg sm:text-2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1 truncate">
                    Consumos Globales
                  </h3>
                  <p className="text-gray-600 font-medium text-xs sm:text-base leading-tight">
                    {totalItems} registros
                    {(filters.dateFrom ||
                      filters.dateTo ||
                      filters.equipoFilter) &&
                      " filtrados"}
                  </p>

                  {/* FAENAS SELECCIONADAS */}
                  <div className="flex flex-wrap gap-1 mt-2 sm:mt-3 max-w-full">
                    {selectedFaenas.length === 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        ⚠️ Sin faenas seleccionadas
                      </span>
                    ) : (
                      selectedFaenas.map((faena) => {
                        const colors = getFaenaColors(faena);
                        return (
                          <span
                            key={faena}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.badge} whitespace-nowrap`}
                          >
                            <span className="text-xs">{colors.emoji}</span>
                            <span>{faena}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* BOTONES COMPACTOS */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <PDFGenerator
                  consumos={consumos}
                  stats={stats}
                  filters={prepareFiltersForPDF} // ✅ Usar filtros preparados
                  totalItems={totalItems}
                  currentPage={currentPage}
                  user={user}
                  size="small"
                  disabled={loading || selectedFaenas.length === 0}
                />
              </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            {(loading || isFilteringFaenas) ? (
              <LoadingSpinner message={
                isFilteringFaenas ? "Aplicando filtros de faenas..." : "Cargando consumos..."
              } />
            ) : error ? (
              <ErrorDisplay
                error={error}
                onRetry={() =>
                  fetchAllData(filters, currentPage, selectedFaenas)
                }
              />
            ) : selectedFaenas.length === 0 ? (
              <EmptyState
                message="No hay faenas seleccionadas"
                subMessage="Selecciona al menos una faena para ver los consumos"
              />
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
                      <EmptyState
                        message="📭 No hay consumos para mostrar"
                        subMessage={
                          filters.dateFrom ||
                            filters.dateTo ||
                            filters.equipoFilter
                            ? "Intenta ajustar los filtros de búsqueda"
                            : "No se han registrado consumos aún"
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Vista escritorio - Tabla */}
                <div className="hidden lg:block relative">
                  <div className="overflow-hidden rounded-2xl shadow-inner">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                              📅 Fecha/Hora
                            </th>
                            <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                              🚛 Equipo
                            </th>
                            <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                              ⛽ Litros
                            </th>
                            <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                              👤 Solicitante
                            </th>
                            <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                              🛢️ Estanque
                            </th>
                            <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                              📊 Medición
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {consumos.length > 0 ? (
                            consumos.map((consumo, index) => {
                              const fechaFormateada = formatearFecha(
                                consumo.fecha_consumo
                              );
                              console.log("Datos consumo:", consumo);
                              const faenaColors = getFaenaColors(consumo.nombre_faena);
                              console.log("Datos color:", faenaColors);
                              return (
                                <tr
                                  key={consumo.id_consumo || index}
                                  className={`relative ${faenaColors.bg} border-l-4 ${faenaColors.border} hover:shadow-lg hover:bg-opacity-80 transition-all duration-200 group`}
                                >
                                  <td className="relative py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                    <div className="absolute top-1 right-1 z-10">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${faenaColors.badge} shadow-md transform group-hover:scale-105 transition-transform duration-200`}
                                      >
                                        <span className="text-xs">
                                          {faenaColors.emoji}
                                        </span>
                                        {consumo.faena}
                                      </span>
                                    </div>

                                    <div className="font-bold text-gray-800 pt-4">
                                      {fechaFormateada.fecha}
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      {fechaFormateada.hora}
                                    </div>
                                  </td>

                                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm font-semibold text-gray-800">
                                    <div className="font-bold">
                                      {consumo.nombre_maquina || "N/A"}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Patente: {consumo.patente || "N/A"}
                                    </div>
                                  </td>

                                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                    <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                      {formatNumber(consumo.litros_consumidos)}{" "}
                                      L
                                    </span>
                                    {consumo.costo_total && (
                                      <div className="text-xs text-gray-600">
                                        ${formatNumber(consumo.costo_total)}
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                    <div className="font-semibold text-gray-800">
                                      {consumo.solicitante_nombre || "N/A"}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      RUT: {consumo.id_dotacion || "N/A"}
                                    </div>
                                    {consumo.solicitante_tipo && (
                                      <div className="text-xs text-blue-700 font-medium">
                                        {consumo.solicitante_tipo}
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-gray-700 font-medium">
                                    {consumo.estanque || "N/A"}
                                    {consumo.cantidad_estanques > 1 && (
                                      <div className="text-xs text-purple-700 font-semibold">
                                        ({consumo.cantidad_estanques} estanques)
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-gray-700">
                                    {consumo.medicion ? (
                                      <span className="font-medium">
                                        {formatNumber(consumo.medicion)}
                                        <span className="text-xs ml-1">
                                          {consumo.tipo_medicion ===
                                            "Kilometraje"
                                            ? "km"
                                            : "hrs"}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">N/A</span>
                                    )}

                                    {/* Sección debajo de medición */}
                                    <div className="flex flex-col items-start mt-1 space-y-1">
                                      {/* Diferencia: siempre se muestra */}
                                      <span
                                        className={`text-sm ${consumo.anomalo
                                          ? "text-red-600 font-semibold"
                                          : "text-gray-500"
                                          }`}
                                      >
                                        Δ{" "}
                                        {formatNumber(
                                          consumo.diferencia_medicion
                                        )}
                                      </span>

                                      {/* Badge de anomalía más notorio */}
                                      {consumo.anomalo && (
                                        <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold shadow-sm">
                                          <FaExclamationTriangle className="text-red-500 w-3 h-3" />
                                          <span>Medición anómala</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  <td className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none">
                                    <div
                                      className={`h-full bg-gradient-to-r ${faenaColors.primary} opacity-60 group-hover:opacity-80 transition-opacity duration-200`}
                                    ></div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-12 text-center">
                                <EmptyState
                                  message="📭 No hay consumos para mostrar"
                                  subMessage={
                                    filters.dateFrom ||
                                      filters.dateTo ||
                                      filters.equipoFilter
                                      ? "Intenta ajustar los filtros de búsqueda"
                                      : "No se han registrado consumos aún"
                                  }
                                />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {(loading || isFilteringFaenas) && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="text-center">
                        <FaSpinner className="animate-spin text-blue-600 text-3xl mx-auto mb-2" />
                        <p className="text-gray-600">
                          {isFilteringFaenas ? "Aplicando cambios..." : "Cargando..."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Paginación */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </div>
        )}

        {/* PESTAÑA DE GRÁFICOS CON VALIDACIONES MEJORADAS */}

        {pestanaActiva === "graficos" && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-3 sm:p-8 mb-4 sm:mb-8">
            {/* VALIDACIONES PARA GRÁFICOS */}
            {loadingGraficos ? (
              <LoadingSpinner message="Preparando gráficos..." />
            ) : error ? (
              <ErrorDisplay
                error={error}
                onRetry={() => {
                  const cargarDatos = async () => {
                    setLoadingGraficos(true);
                    try {
                      const datos = await fetchAllData(
                        filters,
                        selectedFaenas
                      );
                      console.log("Datos para graficar cargas:", datos);
                      setConsumosParaGraficos(datos);
                    } finally {
                      setLoadingGraficos(false);
                    }
                  };
                  cargarDatos();
                }}
              />
            ) : selectedFaenas.length === 0 ? (
              <EmptyState
                message="🏭 Selecciona faenas para ver gráficos"
                subMessage="Los análisis requieren al menos una faena seleccionada"
              />
            ) : consumosParaGraficos.length === 0 ? (
              <>
                {console.log(
                  "🛠 consumosParaGraficos vacíos:",
                  consumosParaGraficos
                )}
                <EmptyState
                  message="📊 Sin datos para graficar"
                  subMessage={
                    filters.dateFrom || filters.dateTo || filters.equipoFilter
                      ? "Intenta ajustar los filtros para obtener más datos"
                      : "No hay consumos disponibles en las faenas seleccionadas"
                  }
                />
              </>
            ) : (
              <React.Suspense
                fallback={
                  <LoadingSpinner message="Cargando componente de gráficos..." />
                }
              >
                <VisualizacionesConsumoMaquina
                  consumos={consumosParaGraficos}
                  stats={stats}
                  filters={filters}
                  selectedFaenas={selectedFaenas}
                  loading={loadingGraficos}
                  error={null} // Ya manejamos errores aquí
                  formatearFecha={formatearFecha}
                  formatNumber={formatNumber}
                  user={user}
                  maquinasDisponibles={maquinasDisponibles}
                />
              </React.Suspense>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center mt-8 sm:mt-12 py-6 sm:py-8 border-t border-gray-200/50">
          <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
            Sistema de Gestión de Combustible v2.1
          </p>
          <div className="flex justify-center flex-wrap gap-2 mt-2">
            {Object.entries(FAENA_COLORS).map(([faena, colors]) => (
              <span
                key={colors.name}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colors.badge}`}
              >
                <span>{colors.emoji}</span>
                {colors.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🏷️ DISPLAY NAMES PARA DEBUGGING
DateFilter.displayName = "DateFilter";
Pagination.displayName = "Pagination";
ConsumoCard.displayName = "ConsumoCard";

export default HistorialMaquinasView;