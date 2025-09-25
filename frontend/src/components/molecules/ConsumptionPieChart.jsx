import React, { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { useChartColors } from "./../../context/ChartColorsContext";

import {
  FiAlertTriangle,
  FiRefreshCw,
  FiPieChart,
  FiArrowLeft,
  FiActivity,
  FiBarChart2,
  FiList,
  FiX,
  FiCalendar,
  FiTruck,
  FiDroplet,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiTrendingUp,
  FiFilter,
  FiEye,
  FiEyeOff,
  FiInfo,
} from "react-icons/fi";
import axios from "../../lib/axios";

import EnhancedConsumoDetailsModal from "./EnhancedConsumoDetailsModal";

// Componente Modal Original (mantenido sin cambios)
const ConsumoDetailsModal = ({
  isOpen,
  onClose,
  categoria,
  fechaDesde,
  fechaHasta,
  faenaSeleccionada,
}) => {
  const [consumos, setConsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const fetchConsumosDeCategoria = async (page = 1) => {
    if (!categoria || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (faenaSeleccionada && faenaSeleccionada !== "todas") {
        params.append("faena", faenaSeleccionada);
      } else {
        params.append("faena", "1");
      }

      if (fechaDesde) {
        params.append("dateFrom", fechaDesde);
      }
      if (fechaHasta) {
        params.append("dateTo", fechaHasta);
      }

      params.append("id_categoria", categoria.id.toString());

      const response = await axios.get(`/api/consumos-categoria?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const consumosData = response.data.data || [];

        setConsumos(consumosData);
        setStats(response.data.stats);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(
          Math.ceil((response.data.pagination?.total || 0) / itemsPerPage)
        );
      } else {
        throw new Error(response.data.message || "Error al obtener consumos");
      }
    } catch (err) {
      console.error("Error al cargar consumos de categoría:", err);
      setError(err.message || "Error al cargar detalles de consumos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && categoria) {
      fetchConsumosDeCategoria(currentPage);
    }
  }, [
    isOpen,
    categoria,
    currentPage,
    fechaDesde,
    fechaHasta,
    faenaSeleccionada,
  ]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return {
      fecha: fecha.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      hora: fecha.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiList className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Detalles de Consumos - {categoria?.nombre}
              </h2>
              <p className="text-sm text-gray-600">
                {fechaDesde && fechaHasta
                  ? `Período: ${new Date(fechaDesde).toLocaleDateString(
                      "es-CL"
                    )} - ${new Date(fechaHasta).toLocaleDateString("es-CL")}`
                  : "Todos los períodos"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        {/* Estadísticas rápidas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {stats.total_consumos}
              </div>
              <div className="text-xs text-gray-600">Total Consumos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {formatNumber(stats.total_litros)} L
              </div>
              <div className="text-xs text-gray-600">Total Litros</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatNumber(stats.promedio_consumo)} L
              </div>
              <div className="text-xs text-gray-600">Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {stats.equipo_mas_usado}
              </div>
              <div className="text-xs text-gray-600">Equipo + Usado</div>
            </div>
          </div>
        )}

        {/* Contenido del Modal */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiRefreshCw className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Cargando consumos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiAlertTriangle className="text-4xl text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchConsumosDeCategoria(currentPage)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabla de consumos */}
              <div className="flex-1 overflow-auto p-6">
                {consumos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-semibold text-gray-700 border-b">
                            <FiCalendar className="inline mr-1" /> Fecha/Hora
                          </th>
                          <th className="text-left p-3 font-semibold text-gray-700 border-b">
                            <FiTruck className="inline mr-1" /> Equipo
                          </th>
                          <th className="text-left p-3 font-semibold text-gray-700 border-b">
                            <FiDroplet className="inline mr-1" /> Litros
                          </th>
                          <th className="text-left p-3 font-semibold text-gray-700 border-b">
                            <FiUser className="inline mr-1" /> Solicitante
                          </th>
                          <th className="text-left p-3 font-semibold text-gray-700 border-b">
                            Estanque
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumos.map((consumo, index) => {
                          const { fecha, hora } = formatearFecha(
                            consumo.fecha_consumo
                          );

                          return (
                            <tr
                              key={consumo.id_consumo || index}
                              className="hover:bg-gray-50 border-b"
                            >
                              <td className="p-3">
                                <div className="font-medium text-gray-800">
                                  {fecha}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {hora}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-gray-800">
                                  {consumo.nombre_maquina || "N/A"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Patente: {consumo.patente || "N/A"}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-lg text-orange-600">
                                  {formatNumber(consumo.litros_consumidos)} L
                                </span>
                                {consumo.costo_total && (
                                  <div className="text-sm text-gray-500">
                                    ${formatNumber(consumo.costo_total)}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-gray-800">
                                  {consumo.solicitante_nombre || "N/A"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  RUT: {consumo.id_dotacion || "N/A"}
                                </div>
                                {consumo.solicitante_tipo && (
                                  <div className="text-xs text-blue-600">
                                    {consumo.solicitante_tipo}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="text-gray-700">
                                  {consumo.estanque || "N/A"}
                                </div>
                                {consumo.cantidad_estanques > 1 && (
                                  <div className="text-xs text-purple-600 font-semibold">
                                    ({consumo.cantidad_estanques} estanques)
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiList className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No hay consumos para mostrar
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      No se encontraron consumos para esta categoría en el
                      período seleccionado
                    </p>
                  </div>
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages} ({totalItems} total)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                        }`}
                      >
                        <FiChevronLeft />
                      </button>

                      <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                        {currentPage}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                        }`}
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsumptionPieChart = ({
  faenaSeleccionada = "todas",
  fechaDesde,
  fechaHasta,
  horaDesde,
  horaHasta,
  refreshKey = 0,
  onCategoriesLoad = null, // ✅ SOLO ESTA CALLBACK
  chartColors = [
    "#f97316", // naranja fuerte
    "#3b82f6", // azul medio
    "#10b981", // verde esmeralda
    "#f59e0b", // amarillo/naranja
    "#8b5cf6", // morado
    "#ef4444", // rojo fuerte
    "#06b6d4", // celeste
    "#84cc16", // verde lima
    "#F527DD", // rojo rosado / burdeo
    "#6366f1", // azul violeta
    "#64748b", // gris azulado
  ],

  // 🆕 NUEVA PROP para callback de coordinación
  onLoadComplete = null,
}) => {
  const { setMainChartLoading, handleMainChartLoad } = useChartColors();
  const [categorias, setCategorias] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [viewMode, setViewMode] = useState("categorias");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalConsumo, setTotalConsumo] = useState(0);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);

  // Estados para modales
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCategoriaForDetails, setSelectedCategoriaForDetails] =
    useState(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);

  // useRef para filtros
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
  });

  const getColorForIndex = (item, index) => {
    // Si el objeto ya tiene color (que debería ser siempre después de nuestros cambios)
    if (item.color) {
      return item.color;
    }

    if (item.assignedColor) {
      return item.assignedColor;
    }

    // Fallback solo si algo salió mal
    const fallbackColor = chartColors[index % chartColors.length];
    console.warn(
      `🎨 ConsumptionPieChart: ⚠️ Fallback inesperado para "${
        item.nombre || item.name
      }": ${fallbackColor}`
    );
    return fallbackColor;
  };
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Función para verificar cambios de filtros
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed =
      prevF.faenaSeleccionada !== faenaSeleccionada ||
      prevF.fechaDesde !== fechaDesde ||
      prevF.fechaHasta !== fechaHasta ||
      prevF.refreshKey !== refreshKey ||
      !initialLoadDone.current;

    prevFilters.current = {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      refreshKey,
    };
    return changed;
  };

  // Datos actuales según el modo de vista
  const currentData = viewMode === "categorias" ? categorias : maquinas;
  console.log("View Mode:", viewMode);
  console.log("Categorias:", categorias);
  console.log("Current Data:", currentData);

  // Calcular total dinámico
  const totalActual = currentData.reduce((sum, item) => sum + item.value, 0);

  // Función optimizada para mostrar etiquetas
  const renderCustomLabel = (props) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
      index,
      payload,
    } = props;

    if (percent < 0.003) return null;

    const RADIAN = Math.PI / 180;
    const normalizedAngle = ((((midAngle * 180) / Math.PI) % 360) + 360) % 360;

    let labelDistance, labelOffset;

    if (percent > 0.5) {
      labelDistance = outerRadius + 60;
      labelOffset = 25;
    } else if (percent > 0.15) {
      labelDistance = outerRadius + 60;
      labelOffset = 10;
    } else if (percent > 0.08) {
      labelDistance = outerRadius + 45;
      labelOffset = 18;
    } else {
      labelDistance = outerRadius + 40;
      labelOffset = 12;
    }

    const baseX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
    const baseY = cy + labelDistance * Math.sin(-midAngle * RADIAN);

    let finalX = baseX;
    let finalY = baseY;
    let useSpecialLine = false;

    if (percent < 0.03) {
      useSpecialLine = true;
      const levelHeight = 30;
      const horizontalOffset = 50;
      const level = index % 3;
      const baseLevel = cy - 80;

      finalY = baseLevel + level * levelHeight;

      if (baseX < cx) {
        finalX = cx - outerRadius - horizontalOffset - level * 15;
      } else {
        finalX = cx + outerRadius + horizontalOffset + level * 15;
      }
    }

    const isBottomRegion = normalizedAngle > 180 && normalizedAngle < 360;
    const isLargeSegment = percent > 0.3;

    if (isBottomRegion && !useSpecialLine) {
      if (isLargeSegment) {
        labelDistance = labelDistance + 15;
        finalX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
        finalY = cy + labelDistance * Math.sin(-midAngle * RADIAN) + 20;
      } else {
        finalX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
        finalY = cy + labelDistance * Math.sin(-midAngle * RADIAN) + 10;
      }
    }

    if (percent > 0.4 && !useSpecialLine) {
      const minSeparation = 25;
      if (isBottomRegion) {
        finalY = finalY + index * minSeparation * 0.3;
      }
    }

    const x = finalX;
    const y = finalY;
    const isLeftSide = x < cx;

    let displayName,
      secondLine = null;
    const maxLength = 22;

    const itemName = payload?.nombre || payload?.name || "Sin nombre";
    const itemValue = payload?.value || 0;

    if (itemName.length > maxLength) {
      let breakPoint = maxLength;
      const spaceIndex = itemName.substring(0, maxLength + 3).lastIndexOf(" ");

      if (spaceIndex > maxLength - 3 && spaceIndex < maxLength + 3) {
        breakPoint = spaceIndex;
      }

      displayName = itemName.substring(0, breakPoint);
      const remaining = itemName.substring(breakPoint).trim();

      if (remaining.length > 0) {
        secondLine =
          remaining.length > 8 ? `${remaining.substring(0, 15)}` : remaining;
      }
    } else {
      displayName = itemName;
    }

    const startX = cx + (outerRadius - 1) * Math.cos(-midAngle * RADIAN);
    const startY = cy + (outerRadius - 1) * Math.sin(-midAngle * RADIAN);

    let linePath;

    if (useSpecialLine) {
      const intermediateX = startX;
      const intermediateY = y;
      const endX = x - (isLeftSide ? 8 : -8);

      linePath = `M ${startX} ${startY} L ${
        x - (isLeftSide ? 8 : 5)
      } ${intermediateY} L ${endX} ${intermediateY}`;
    } else {
      linePath = `M ${startX} ${startY} L ${x} ${y}`;
    }

    // 🎨 USAR COLOR CONSISTENTE
    const textColor = "#1f2937";
    const percentColor = getColorForIndex(payload, index);
    const lineColor = percent < 0.013 ? percentColor : "#6b7280";

    return (
      <g>
        <path
          d={linePath}
          stroke={lineColor}
          strokeWidth={percent > 0.1 ? 2 : 1.5}
          strokeOpacity={0.8}
          fill="none"
        />

        <circle
          cx={useSpecialLine ? x - (isLeftSide ? 8 : -8) : x}
          cy={y}
          r={percent > 0.1 ? 3 : 2}
          fill={percentColor}
          opacity={0.9}
        />

        {useSpecialLine && (
          <rect
            x={x + (isLeftSide ? -50 : -5)}
            y={y - 20}
            width={55}
            height={35}
            fill="rgba(255, 255, 255, 0.95)"
            stroke="#e5e7eb"
            strokeWidth={0.5}
            rx={3}
            opacity={0.1}
          />
        )}

        {!useSpecialLine && percent < 0.06 && (
          <rect
            x={x + (isLeftSide ? -labelOffset - 40 : labelOffset - 5)}
            y={y - 22}
            width={45}
            height={40}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#e5e7eb"
            strokeWidth={0.5}
            rx={3}
            opacity={0.1}
          />
        )}

        <text
          x={x + (isLeftSide ? -labelOffset : labelOffset)}
          y={y - (secondLine ? 8 : 4)}
          textAnchor={isLeftSide ? "end" : "start"}
          dominantBaseline="central"
          fill={textColor}
          fontSize={
            useSpecialLine
              ? "15"
              : percent > 0.1
              ? "15"
              : percent > 0.05
              ? "15"
              : "15"
          }
          fontWeight="650"
        >
          <tspan x={x + (isLeftSide ? -labelOffset : labelOffset)} dy="0">
            {displayName}
          </tspan>
          {secondLine && (
            <tspan x={x + (isLeftSide ? -labelOffset : labelOffset)} dy="12">
              {secondLine}
            </tspan>
          )}
        </text>

        <text
          x={x + (isLeftSide ? -labelOffset : labelOffset)}
          y={y + (secondLine ? 19 : 9)}
          textAnchor={isLeftSide ? "end" : "start"}
          dominantBaseline="central"
          fill={percentColor}
          fontSize={
            useSpecialLine
              ? "10"
              : percent > 0.1
              ? "11"
              : percent > 0.05
              ? "10"
              : "10"
          }
          fontWeight="700"
        >
          {(percent * 100).toFixed(1)}%
        </text>

        {!useSpecialLine && (
          <text
            x={x + (isLeftSide ? -labelOffset - 40 : labelOffset + 40)}
            y={y + (secondLine ? 19 : 9)}
            textAnchor={isLeftSide ? "end" : "start"}
            dominantBaseline="central"
            fill="#6b7280"
            fontSize={
              useSpecialLine
                ? "11"
                : percent > 0.1
                ? "11"
                : percent > 0.05
                ? "10"
                : "9"
            }
            fontWeight="700"
          >
            {itemValue >= 1000000
              ? `${(itemValue / 1000).toFixed(1)}k L`
              : `${Math.round(itemValue)} L`}
          </text>
        )}

        {useSpecialLine && (
          <text
            x={x + (isLeftSide ? -labelOffset - 20 : labelOffset + 30)}
            y={y + (secondLine ? 19 : 9)}
            textAnchor={isLeftSide ? "end" : "start"}
            dominantBaseline="central"
            fill="#6b7280"
            fontSize="10"
            fontWeight="700"
          >
            {Math.round(itemValue)}L
          </text>
        )}
      </g>
    );
  };

  // Cargar datos de categorías
  const cargarDatosCategorias = async () => {
    if (!isMounted.current) return;

    try {
      setMainChartLoading(true);
      setLoading(true);
      setError(null);

      if (!fechaDesde || !fechaHasta) {
        setError("Por favor, seleccione un rango de fechas válido.");
        setCategorias([]);
        setLoading(false);
        setMainChartLoading(false); // 🆕 NUEVO
        return;
      }

      if (new Date(fechaDesde) > new Date(fechaHasta)) {
        setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
        setCategorias([]);
        setLoading(false);
        setMainChartLoading(false); // 🆕 NUEVO
        return;
      }

      const requestBody = {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
        modo: "categorias",
        // 🆕 PARÁMETRO CLAVE: Indicar que NO queremos redistribuciones
        incluir_redistribucion: false,
        tipo_chart: "principal", // Para debugging y logs
      };

      if (faenaSeleccionada && faenaSeleccionada !== "todas") {
        requestBody.id_faena = faenaSeleccionada;
      }

      const response = await axios.post(
        "/api/categorias-chart/categorias",
        requestBody
      );

      if (!isMounted.current) return;

      if (response.data && response.data.success && response.data.categorias) {
        // 🔧 ARREGLO: Determinar qué categorías usar según el contexto
        const categoriasParaUsar =
          response.data.categorias.categoriasFinales ||
          response.data.categorias.categoriasIniciales ||
          response.data.categorias ||
          [];

        // Ordenar por valor descendente ANTES de asignar colores
        const datosOrdenados = categoriasParaUsar
          .filter((item) => (item.value || 0) > 0)
          .sort((a, b) => (b.value || 0) - (a.value || 0));

        // Formatear datos CON colores asignados
        const formattedData = datosOrdenados.map((item, index) => {
          const nombre = item.name || item.nombre || "Sin categoría";
          const valor = Math.round((item.value || 0) * 100) / 100;

          // ASIGNAR COLOR POR ÍNDICE (ya que están ordenados por importancia)
          const color = chartColors[index % chartColors.length];

          return {
            id: item.id,
            nombre: nombre,
            name: nombre,
            value: valor,
            maquinas_count: item.maquinas_count || 0,
            maquinas_internas: item.maquinas_internas || 0,
            maquinas_externas: item.maquinas_externas || 0,
            tipo_medicion: item.tipo_medicion,
            promedio_consumo: item.promedio_consumo || 0,
            total_registros: item.total_registros || 0,
            // COLORES INCLUIDOS EN EL OBJETO
            color: color,
            assignedColor: color,
          };
        });

        setCategorias(formattedData);

        const metadata = response.data.resumen || response.data.metadata;
        const total =
          metadata?.total_consumo_litros ||
          formattedData.reduce((sum, item) => sum + item.value, 0);

        setTotalConsumo(total);

        // Callback existente (si existe)
        if (onCategoriesLoad && typeof onCategoriesLoad === "function") {
          onCategoriesLoad(formattedData);
        }

        // 🔑 CRÍTICO: Notificar al contexto que terminamos de cargar
        handleMainChartLoad(formattedData);

        // 🆕 NUEVO: Callback de finalización
        if (onLoadComplete && typeof onLoadComplete === "function") {
          onLoadComplete(formattedData);
        }

        setFechaActualizacion(new Date());
        initialLoadDone.current = true;

        // NOTIFICAR AL CONTEXTO INMEDIATAMENTE CON LOS DATOS QUE YA TIENEN COLORES
        if (handleMainChartLoad && typeof handleMainChartLoad === "function") {
          console.log(
            "Notificando al contexto con",
            formattedData.length,
            "categorías con colores asignados"
          );
          handleMainChartLoad(formattedData);
          console.log("Contexto notificado exitosamente");
        } else {
          console.warn("handleMainChartLoad no está disponible");
        }
      } else {
        setCategorias([]);
        setTotalConsumo(0);
      }
    } catch (err) {
      console.error("Error al cargar datos de categorías:", err);
      if (isMounted.current) {
        setCategorias([]);
        setTotalConsumo(0);
        setError("No se pudieron cargar los datos de consumo por categoría.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Cargar máquinas por categoría
  const cargarMaquinasPorCategoria = async (categoria) => {
    if (!isMounted.current) return;

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
      };

      if (faenaSeleccionada && faenaSeleccionada !== "todas") {
        requestBody.id_faena = faenaSeleccionada;
      }

      const response = await axios.post(
        `/api/categorias-chart/categorias/${categoria.id}/maquinas`,
        requestBody
      );

      if (!isMounted.current) return;

      if (response.data && response.data.success && response.data.maquinas) {
        const maquinasData = response.data.maquinas
          .map((maquina) => ({
            id: maquina.id,
            nombre: maquina.name || maquina.nombre || "Sin nombre",
            name: maquina.name || maquina.nombre || "Sin nombre",
            patente: maquina.patente || "S/P",
            value: Math.round((maquina.value || 0) * 100) / 100,
            estado: maquina.estado,
            tipo_maquina: maquina.tipo_maquina || "N/A",
            promedio_consumo: maquina.promedio_consumo || 0,
            total_registros: maquina.total_registros || 0,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value);

        setMaquinas(maquinasData);
        setError(null);
      } else {
        setMaquinas([]);
        setError("No hay máquinas disponibles para esta categoría");
      }
    } catch (err) {
      console.error("Error al cargar datos de máquinas:", err);
      if (isMounted.current) {
        setMaquinas([]);
        setError("No se pudieron cargar los datos de máquinas.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Effect para cargar datos cuando cambian filtros
  useEffect(() => {
    if (filtersChanged()) {
      cargarDatosCategorias();
      setViewMode("categorias");
      setSelectedCategoria(null);
      setMaquinas([]);
    }
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // Función para manejar click en categoría
  const handleCategoriaClick = async (data) => {
    setSelectedCategoria(data);
    setViewMode("maquinas");
    await cargarMaquinasPorCategoria(data);
  };

  // Función para volver a las categorías
  const handleBackToCategories = () => {
    setSelectedCategoria(null);
    setMaquinas([]);
    setViewMode("categorias");
  };

  // Función para reintentar
  const handleRetry = () => {
    setError(null);
    if (viewMode === "categorias") {
      cargarDatosCategorias();
    } else if (selectedCategoria) {
      cargarMaquinasPorCategoria(selectedCategoria);
    }
  };

  // Funciones para mostrar modales
  const handleShowDetails = (categoria) => {
    setSelectedCategoriaForDetails(categoria);
    setShowDetailsModal(true);
  };

  const handleShowEnhancedDetails = (categoria) => {
    setSelectedCategoriaForDetails(categoria);
    setShowEnhancedModal(true);
  };

  // Tooltip mejorado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = currentData.reduce((sum, item) => sum + item.value, 0);
      const percentage =
        total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">
            {viewMode === "categorias"
              ? data.nombre
              : `${data.nombre} (${data.patente})`}
          </p>
          <p className="text-orange-600 font-medium">
            Consumo: {data.value.toLocaleString("es-CL")} L
          </p>
          <p className="text-gray-600 text-sm">{percentage}% del total</p>
          {viewMode === "categorias" && data.maquinas_count && (
            <div className="text-xs space-y-1 mt-2">
              <p className="text-blue-600">
                {data.maquinas_count} máquinas total
              </p>
              {data.maquinas_internas !== undefined && (
                <p className="text-green-600">
                  🏢 {data.maquinas_internas || 0} internas
                </p>
              )}
              {data.maquinas_externas !== undefined && (
                <p className="text-purple-600">
                  🏭 {data.maquinas_externas || 0} externas
                </p>
              )}
            </div>
          )}
          {viewMode === "maquinas" && data.tipo_maquina && (
            <p className="text-sm text-gray-600">
              Tipo: {data.tipo_maquina === "Interna" ? "🏢" : "🏭"}{" "}
              {data.tipo_maquina}
            </p>
          )}
          {data.total_registros && (
            <p className="text-gray-500 text-xs">
              {data.total_registros} registros
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* 🎨 Skeleton de gráfico pie profesional */}
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className="text-center">
            {/* 🎯 Círculo skeleton animado */}
            <div className="relative mx-auto mb-6">
              <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-200 animate-spin"></div>
              <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>

              {/* 🎯 Icono central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <FiPieChart className="h-8 w-8 text-orange-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700">
                Analizando Categorías de Consumo
              </h3>
              <p className="text-sm text-gray-500">
                Procesando datos y calculando distribuciones...
              </p>

              {/* 🎨 Skeleton de estadísticas */}
              <div className="grid grid-cols-3 gap-4 mt-4 max-w-md mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center bg-red-50 rounded-lg border border-red-200">
        <FiAlertTriangle size={40} className="text-red-500 mb-4" />
        <div className="text-red-700 mb-4">{error}</div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
        >
          <FiRefreshCw className="mr-2" /> Reintentar
        </button>
      </div>
    );
  }

  if (currentData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <FiPieChart size={40} className="text-gray-400 mb-4 mx-auto" />
          <p className="text-gray-500">
            No hay datos disponibles para el período seleccionado
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Intente modificar los filtros de fecha o faena
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modales */}
      <ConsumoDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        categoria={selectedCategoriaForDetails}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        faenaSeleccionada={faenaSeleccionada}
      />

      <EnhancedConsumoDetailsModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        categoria={selectedCategoriaForDetails}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        faenaSeleccionada={faenaSeleccionada}
      />

      <div className="w-full p-2 bg-white rounded-lg shadow-lg">
        <div className="mb-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {viewMode === "categorias"
                ? "Consumo por Categoría de Máquinas (Egreso de Estanques)"
                : `Consumo por Máquina (Egreso de Estanques)- ${selectedCategoria?.nombre}`}
            </h2>

            {viewMode === "maquinas" && (
              <button
                onClick={handleBackToCategories}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <FiArrowLeft /> Volver a Categorías
              </button>
            )}
          </div>
        </div>

        {/* Gráfico de Torta */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Gráfico de Torta con etiquetas mejoradas */}
          <div className="lg:col-span-3 h-110">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 90, bottom: 50, left: 50 }}>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={130}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={
                    viewMode === "categorias" ? handleCategoriaClick : undefined
                  }
                  style={{
                    cursor: viewMode === "categorias" ? "pointer" : "default",
                  }}
                >
                  {currentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColorForIndex(entry, index)} // 🎨 USAR FUNCIÓN CONSISTENTE
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  offset={35} // 👈 Mueve el tooltip 50px a la derecha
                  position={{ x: undefined, y: undefined }}
                />

                <text
                  x="48%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="16"
                  fontWeight="800"
                  fill="#374151"
                >
                  {totalActual.toLocaleString("es-CL")} L
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de datos */}
          <div className="lg:col-span-2 overflow-hidden">
            <h3 className="text-lg font-semibold mb-3">Detalle de Consumo</h3>
            <div className="max-h-95 overflow-y-auto border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">
                      {viewMode === "categorias" ? "Categoría" : "Máquina"}
                    </th>
                    {viewMode === "maquinas" && (
                      <th className="text-left p-2 font-medium">Patente</th>
                    )}
                    {viewMode === "maquinas" && (
                      <th className="text-center p-2 font-medium">Tipo</th>
                    )}
                    <th className="text-right p-2 font-medium">Consumo (L)</th>
                    <th className="text-right p-2 font-medium">%</th>
                    {viewMode === "categorias" && (
                      <th className="text-right p-2 font-medium">Máquinas</th>
                    )}
                    {viewMode === "categorias" && (
                      <th className="text-center p-2 font-medium">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => {
                    const percentage =
                      totalActual > 0
                        ? ((item.value / totalActual) * 100).toFixed(1)
                        : 0;
                    return (
                      <tr
                        key={item.id || index}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          viewMode === "categorias" ? "cursor-pointer" : ""
                        }`}
                        onClick={
                          viewMode === "categorias"
                            ? () => handleCategoriaClick(item)
                            : undefined
                        }
                      >
                        <td className="p-2">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                              style={{
                                backgroundColor: getColorForIndex(item, index), // 🎨 USAR FUNCIÓN CONSISTENTE
                              }}
                            ></div>
                            <span className="font-medium">{item.nombre}</span>
                          </div>
                        </td>
                        {viewMode === "maquinas" && (
                          <td className="p-2 text-gray-600">{item.patente}</td>
                        )}
                        {viewMode === "maquinas" && (
                          <td className="p-2 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.tipo_maquina === "Interna"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {item.tipo_maquina === "Interna" ? "🏢" : "🏭"}{" "}
                              {item.tipo_maquina}
                            </span>
                          </td>
                        )}
                        <td className="p-2 text-right font-medium">
                          {item.value.toLocaleString("es-CL")}
                        </td>
                        <td className="p-2 text-right text-gray-600">
                          {percentage}%
                        </td>
                        {viewMode === "categorias" && (
                          <td className="p-2 text-right">
                            <div className="flex flex-col text-xs">
                              <span className="text-blue-600 font-medium">
                                {item.maquinas_count || 0} total
                              </span>
                              {(item.maquinas_internas !== undefined ||
                                item.maquinas_externas !== undefined) && (
                                <div className="mt-1 space-y-0.5">
                                  {item.maquinas_internas !== undefined && (
                                    <div className="text-green-600">
                                      🏢 {item.maquinas_internas || 0}
                                    </div>
                                  )}
                                  {item.maquinas_externas !== undefined && (
                                    <div className="text-purple-600">
                                      🏭 {item.maquinas_externas || 0}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        {viewMode === "categorias" && (
                          <td className="p-2 text-center">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowEnhancedDetails(item);
                                }}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors flex items-center gap-1 justify-center"
                                title="Ver detalles y tendencias por equipo"
                              >
                                <FiTrendingUp className="text-xs" />
                                Tendencias
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Información del período */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
            <span className="text-gray-600">
              Período: {new Date(fechaDesde).toLocaleDateString("es-CL")} -{" "}
              {new Date(fechaHasta).toLocaleDateString("es-CL")}
            </span>
            <span className="text-gray-600">
              Actualizado: {fechaActualizacion?.toLocaleTimeString("es-CL")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsumptionPieChart;
