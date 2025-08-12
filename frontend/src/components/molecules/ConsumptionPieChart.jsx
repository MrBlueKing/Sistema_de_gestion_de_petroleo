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

      // 🔑 CONSTRUIR PARÁMETROS como en ConsumosView
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      // 🔧 SIEMPRE AGREGAR FAENA (temporal mientras se actualiza el controlador)
      if (faenaSeleccionada && faenaSeleccionada !== "todas") {
        params.append("faena", faenaSeleccionada);
      } else {
        // 🚨 TEMPORAL: Agregar faena por defecto para evitar error 400
        params.append("faena", "1"); // O usar cualquier ID de faena válido
      }

      // Agregar filtros de fecha
      if (fechaDesde) {
        params.append("dateFrom", fechaDesde);
      }
      if (fechaHasta) {
        params.append("dateTo", fechaHasta);
      }

      // 🆕 AGREGAR ID DE CATEGORÍA como parámetro principal
      params.append("id_categoria", categoria.id.toString());

      console.log(
        "🔍 Buscando consumos para categoría:",
        categoria.nombre,
        "ID:",
        categoria.id
      );

      // 🆕 USAR LA NUEVA RUTA ESPECÍFICA PARA CONSUMOS POR CATEGORÍA
      const response = await axios.get(`/api/consumos-categoria?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // 🎯 DATOS YA FILTRADOS POR CATEGORÍA en el backend
        const consumosData = response.data.data || [];

        setConsumos(consumosData);
        setStats(response.data.stats);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(
          Math.ceil((response.data.pagination?.total || 0) / itemsPerPage)
        );

        console.log("✅ Consumos de categoría cargados:", {
          categoria: categoria.nombre,
          total_consumos: consumosData.length,
          total_items: response.data.pagination?.total,
        });
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

  // Cargar consumos cuando se abre el modal o cambia la página
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

  // Resetear página cuando se abre el modal
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

        {/* Estadísticas rápidas - Versión compacta */}
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
                        className={`p-2 rounded-lg ${currentPage === 1
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
                        className={`p-2 rounded-lg ${currentPage === totalPages
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

// Componente Principal ConsumptionPieChart (mantenido exactamente igual)
const ConsumptionPieChart = ({
  faenaSeleccionada = "todas",
  fechaDesde,
  fechaHasta,
  horaDesde,
  horaHasta,
  refreshKey = 0,
}) => {
  const [categorias, setCategorias] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [viewMode, setViewMode] = useState("categorias"); // 'categorias' o 'maquinas'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalConsumo, setTotalConsumo] = useState(0);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);

  // 🆕 ESTADOS PARA MODALES
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCategoriaForDetails, setSelectedCategoriaForDetails] =
    useState(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);

  // 🔑 IGUAL QUE TopEquiposChart: useRef para filtros
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
  });

  // Colores para el piechart
  const COLORS = [
    "#f97316", // Orange-500 (principal)
    "#3b82f6", // Blue-500
    "#10b981", // Emerald-500
    "#f59e0b", // Amber-500
    "#8b5cf6", // Violet-500
    "#ef4444", // Red-500
    "#06b6d4", // Cyan-500
    "#84cc16", // Lime-500
    "#f43f5e", // Rose-500
    "#6366f1", // Indigo-500
  ];

  // 🔑 IGUAL QUE TopEquiposChart: Función para verificar cambios de filtros
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed =
      prevF.faenaSeleccionada !== faenaSeleccionada ||
      prevF.fechaDesde !== fechaDesde ||
      prevF.fechaHasta !== fechaHasta ||
      prevF.refreshKey !== refreshKey ||
      !initialLoadDone.current;

    // Actualizar los filtros previos
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

  // 🆕 CALCULAR TOTAL DINÁMICO BASADO EN LOS DATOS ACTUALES
  const totalActual = currentData.reduce((sum, item) => sum + item.value, 0);

  // 🆕 FUNCIÓN PARA OBTENER EL TÍTULO DINÁMICO
  const getTitleText = () => {
    if (viewMode === "categorias") {
      return "Total General";
    } else {
      return selectedCategoria?.nombre || "Total Categoría";
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 🚀 Función optimizada para mostrar TODAS las etiquetas en espacio limitado
  const renderCustomLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload } = props;

    // Mostrar TODAS las etiquetas, incluso las muy pequeñas
    if (percent < 0.003) return null; // Solo ocultar si es menor a 0.3%

    const RADIAN = Math.PI / 180;

    // Determinar posición angular
    const normalizedAngle = ((midAngle * 180 / Math.PI) % 360 + 360) % 360;

    console.log(`Segmento ${index}: ${payload?.nombre || payload?.name} - ${(percent * 100).toFixed(2)}% - Ángulo: ${normalizedAngle.toFixed(2)}°`);

    // 🎯 ESTRATEGIA DE DISTRIBUCIÓN MEJORADA
    let labelDistance, labelOffset;

    // 🔧 SOLUCIÓN PARA SEGMENTOS GRANDES: Darles más distancia para evitar solapamiento
    if (percent > 0.50) {
      // Segmentos MUY grandes: MÁS lejos para que no interfieran con otros
      labelDistance = outerRadius + 60; // Era 45, ahora 60
      labelOffset = 25; // Era 20, ahora 25
    } else if (percent > 0.15) {
      // Segmentos grandes: distancia media-alta
      labelDistance = outerRadius + 60; // Era 35, ahora 50
      labelOffset = 10; // Era 15, ahora 20
    } else if (percent > 0.08) {
      // Segmentos medianos: distancia media
      labelDistance = outerRadius + 45; // Nueva categoría
      labelOffset = 18;
    } else {
      // Segmentos pequeños: la mayor distancia para evitar solapamiento
      labelDistance = outerRadius + 40; // Mantener 65 para pequeños
      labelOffset = 12; // Era 20, ahora 22
    }

    // 📐 Calcular posición base
    const baseX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
    const baseY = cy + labelDistance * Math.sin(-midAngle * RADIAN);

    // 🔄 DISTRIBUCIÓN ESPECIAL PARA SEGMENTOS MUY PEQUEÑOS
    let finalX = baseX;
    let finalY = baseY;
    let useSpecialLine = false;

    // 🆕 MEJORA: Solo usar líneas especiales para segmentos REALMENTE pequeños
    if (percent < 0.03) { // Era 0.04, ahora 0.03 - más restrictivo
      useSpecialLine = true;

      // Crear niveles horizontales para evitar solapamiento
      const levelHeight = 30; // Era 25, ahora 30 - más separación
      const horizontalOffset = 50; // Era 40, ahora 50 - más distancia horizontal

      // Determinar en qué nivel colocar esta etiqueta
      const level = index % 3; // Máximo 3 niveles
      const baseLevel = cy - 80; // Era -60, ahora -80 - más arriba

      // Calcular posición final
      finalY = baseLevel + (level * levelHeight);

      // Determinar lado (izquierda o derecha del círculo)
      if (baseX < cx) {
        // Lado izquierdo
        finalX = cx - outerRadius - horizontalOffset - (level * 15); // Era 10, ahora 15
      } else {
        // Lado derecho  
        finalX = cx + outerRadius + horizontalOffset + (level * 15); // Era 10, ahora 15
      }
    }

    // 🆕 AJUSTE ESPECIAL PARA ETIQUETAS EN LA PARTE INFERIOR
    // Detectar si la etiqueta está en la parte inferior del círculo
    const isBottomRegion = normalizedAngle > 180 && normalizedAngle < 360;
    const isLargeSegment = percent > 0.30;

    if (isBottomRegion && !useSpecialLine) {
      if (isLargeSegment) {
        labelDistance = labelDistance + 15; // aumentar distancia
        finalX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
        finalY = cy + labelDistance * Math.sin(-midAngle * RADIAN) + 20; // desplazar hacia abajo
      } else {
        finalX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
        finalY = cy + labelDistance * Math.sin(-midAngle * RADIAN) + 10;
      }
    }


    // 🆕 PREVENCIÓN DE SOLAPAMIENTO INTELIGENTE
    // Para segmentos grandes, asegurar separación mínima
    if (percent > 0.40 && !useSpecialLine) {
      const minSeparation = 25;
      // Ajustar posición según el índice para evitar solapamiento
      if (isBottomRegion) {
        finalY = finalY + (index * minSeparation * 0.3);
      }
    }

    const x = finalX;
    const y = finalY;
    const isLeftSide = x < cx;

    // Truncado inteligente con soporte para múltiples líneas
    let displayName, secondLine = null;
    const maxLength = 22; // Máximo 12 caracteres por línea

    // 🔧 OBTENER DATOS
    const itemName = payload?.nombre || payload?.name || 'Sin nombre';
    const itemValue = payload?.value || 0;

    if (itemName.length > maxLength) {
      // Buscar un buen punto de corte (preferiblemente un espacio)
      let breakPoint = maxLength;
      const spaceIndex = itemName.substring(0, maxLength + 3).lastIndexOf(' ');

      if (spaceIndex > maxLength - 3 && spaceIndex < maxLength + 3) {
        breakPoint = spaceIndex;
      }

      displayName = itemName.substring(0, breakPoint);
      const remaining = itemName.substring(breakPoint).trim();

      // Si queda texto, crear segunda línea (máximo 15 caracteres más)
      if (remaining.length > 0) {
        secondLine = remaining.length > 8 ? `${remaining.substring(0, 15)}` : remaining;
      }
    } else {
      displayName = itemName;
    }

    // 📍 LÍNEA CONECTORA CON FORMA "L" PARA SEGMENTOS PEQUEÑOS
    const startX = cx + (outerRadius - 1) * Math.cos(-midAngle * RADIAN);
    const startY = cy + (outerRadius - 1) * Math.sin(-midAngle * RADIAN);

    let linePath;

    if (useSpecialLine) {
      // Línea en forma de "L" para segmentos muy pequeños
      const intermediateX = startX;
      const intermediateY = y; // Subir verticalmente hasta el nivel de la etiqueta
      const endX = x - (isLeftSide ? 8 : -8); // Punto antes de llegar a la etiqueta

      linePath = `M ${startX} ${startY} L ${x - (isLeftSide ? 8 : 5)} ${intermediateY} L ${endX} ${intermediateY}`;
    } else {
      // Línea simple y directa para otros segmentos
      linePath = `M ${startX} ${startY} L ${x} ${y}`;
    }

    // 🎨 COLORES Y ESTILOS OPTIMIZADOS
    const textColor = "#1f2937";
    const percentColor = COLORS[index % COLORS.length];
    const lineColor = percent < 0.013 ? percentColor : "#6b7280";

    return (
      <g>
        {/* 🔗 Línea conectora (simple o en "L") */}
        <path
          d={linePath}
          stroke={lineColor}
          strokeWidth={percent > 0.1 ? 2 : 1.5}
          strokeOpacity={0.8}
          fill="none"
        />

        {/* 🎯 Punto de conexión al final de la línea */}
        <circle
          cx={useSpecialLine ? (x - (isLeftSide ? 8 : -8)) : x}
          cy={y}
          r={percent > 0.1 ? 3 : 2}
          fill={percentColor}
          opacity={0.9}
        />

        {/* 📦 Fondo para etiquetas pequeñas con línea en "L" */}
        {useSpecialLine && (
          <rect
            x={x + (isLeftSide ? -50 : -5)} // Era -45, ahora -50
            y={y - 20} // Era -18, ahora -20
            width={55} // Era 50, ahora 55
            height={35} // Era 30, ahora 35
            fill="rgba(255, 255, 255, 0.95)"
            stroke="#e5e7eb"
            strokeWidth={0.5}
            rx={3}
            opacity={0.1} // Mantener muy sutil
          />
        )}

        {/* 📦 Fondo sutil para otras etiquetas pequeñas */}
        {!useSpecialLine && percent < 0.06 && (
          <rect
            x={x + (isLeftSide ? -labelOffset - 40 : labelOffset - 5)} // Era -35, ahora -40
            y={y - 22} // Era -20, ahora -22
            width={45} // Era 40, ahora 45
            height={40} // Era 35, ahora 40
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#e5e7eb"
            strokeWidth={0.5}
            rx={3}
            opacity={0.1} // Mantener muy sutil
          />
        )}

        {/* 📝 Nombre de la categoría con soporte para múltiples líneas */}
        <text
          x={x + (isLeftSide ? -labelOffset : labelOffset)}
          y={y - (secondLine ? 8 : 4)} // Ajustar posición si hay segunda línea
          textAnchor={isLeftSide ? 'end' : 'start'}
          dominantBaseline="central"
          fill={textColor}
          fontSize={useSpecialLine ? "15" : (percent > 0.1 ? "15" : percent > 0.05 ? "15" : "15")}
          fontWeight="650"
        >
          {/* Primera línea */}
          <tspan x={x + (isLeftSide ? -labelOffset : labelOffset)} dy="0">
            {displayName}
          </tspan>
          {/* Segunda línea si existe */}
          {secondLine && (
            <tspan x={x + (isLeftSide ? -labelOffset : labelOffset)} dy="12">
              {secondLine}
            </tspan>
          )}
        </text>

        {/* 📊 Porcentaje - POSICIÓN BASE HORIZONTAL */}
        <text
          x={x + (isLeftSide ? -labelOffset : labelOffset)}
          y={y + (secondLine ? 19 : 9)} // Misma Y base para porcentaje y litros
          textAnchor={isLeftSide ? 'end' : 'start'}
          dominantBaseline="central"
          fill={percentColor}
          fontSize={useSpecialLine ? "10" : (percent > 0.1 ? "11" : percent > 0.05 ? "10" : "10")}
          fontWeight="700"
        >
          {(percent * 100).toFixed(1)}%
        </text>

        {/* 💧 Valor en litros - SEPARACIÓN HORIZONTAL PARA ETIQUETAS NORMALES */}
        {!useSpecialLine && (
          <text
            x={x + (isLeftSide ? -labelOffset - 40 : labelOffset + 40)} // ← SEPARACIÓN HORIZONTAL: ±50 píxeles
            y={y + (secondLine ? 19 : 9)} // ← MISMA Y QUE EL PORCENTAJE
            textAnchor={isLeftSide ? 'end' : 'start'}
            dominantBaseline="central"
            fill="#6b7280"
            fontSize={useSpecialLine ? "11" : (percent > 0.1 ? "11" : percent > 0.05 ? "10" : "9")}
            fontWeight="700"
          >
            {itemValue >= 1000 ?
              `${(itemValue / 1000).toFixed(1)}k L` :
              `${Math.round(itemValue)} L`}
          </text>
        )}

        {/* 💧 Valor en litros - SEPARACIÓN HORIZONTAL PARA LÍNEAS EN "L" */}
        {useSpecialLine && (
          <text
            x={x + (isLeftSide ? -labelOffset - 20 : labelOffset + 30)} // ← MISMA SEPARACIÓN HORIZONTAL
            y={y + (secondLine ? 19 : 9)} // ← MISMA Y QUE EL PORCENTAJE
            textAnchor={isLeftSide ? 'end' : 'start'}
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

  // 🎯 Función auxiliar para calcular distribución óptima hacia arriba
  const optimizeLabelPositions = (data) => {
    return data.map((item, index) => {
      const baseAngle = (item.startAngle + item.endAngle) / 2;
      const percent = (item.endAngle - item.startAngle) / (2 * Math.PI);

      // Normalizar ángulo para determinar posición
      const normalizedAngle = ((baseAngle * 180 / Math.PI) % 360 + 360) % 360;
      const isUpperRegion = normalizedAngle > 135 && normalizedAngle < 225;

      return {
        ...item,
        optimizedAngle: baseAngle,
        labelTier: percent > 0.15 ? 1 : percent > 0.08 ? 2 : 3,
        priority: percent,
        preferUpward: isUpperRegion && percent < 0.1 // Marcar para mover hacia arriba
      };
    });
  };
  // 🔑 CARGAR DATOS DE CATEGORÍAS con nueva API que incluye internas + externas
  const cargarDatosCategorias = async () => {
    if (!isMounted.current) return;

    try {
      setLoading(true);
      setError(null);

      // 🔑 IGUAL QUE TopEquiposChart: Validaciones
      if (!fechaDesde || !fechaHasta) {
        setError("Por favor, seleccione un rango de fechas válido.");
        setCategorias([]);
        setLoading(false);
        return;
      }

      if (new Date(fechaDesde) > new Date(fechaHasta)) {
        setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
        setCategorias([]);
        setLoading(false);
        return;
      }

      console.log(
        "ConsumptionPieChart: Llamando con MISMOS FILTROS que TopEquiposChart:",
        {
          faenaSeleccionada,
          fechaDesde,
          fechaHasta,
        }
      );

      // 🆕 USAR TU API ACTUALIZADA con internas + externas
      const requestBody = {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
        modo: "categorias",
      };

      // 🔑 FILTRO DE FAENA igual que TopEquiposChart
      if (faenaSeleccionada && faenaSeleccionada !== "todas") {
        requestBody.id_faena = faenaSeleccionada;
      }

      console.log("ConsumptionPieChart: Request body enviado:", requestBody);

      // 🆕 LLAMAR A TU API de categorías ACTUALIZADA
      const response = await axios.post(
        "/api/categorias-chart/categorias",
        requestBody
      );

      console.log("ConsumptionPieChart: Respuesta completa:", response.data);

      // Solo actualizar el estado si el componente sigue montado
      if (!isMounted.current) return;

      // 🆕 PROCESAR RESPUESTA con nuevos campos de internas/externas
      if (response.data && response.data.success && response.data.categorias) {
        const formattedData = response.data.categorias
          .map((item) => ({
            id: item.id,
            nombre: item.name || item.nombre || "Sin categoría",
            name: item.name || item.nombre || "Sin categoría", // Para compatibilidad con el gráfico
            value: Math.round((item.value || 0) * 100) / 100,
            maquinas_count: item.maquinas_count || 0,
            maquinas_internas: item.maquinas_internas || 0, // 🆕 NUEVO
            maquinas_externas: item.maquinas_externas || 0, // 🆕 NUEVO
            tipo_medicion: item.tipo_medicion,
            promedio_consumo: item.promedio_consumo || 0,
            total_registros: item.total_registros || 0,
          }))
          .filter((item) => item.value > 0) // Solo categorías con consumo
          .sort((a, b) => b.value - a.value); // 🔑 IGUAL QUE TopEquiposChart: ordenar desc

        console.log("🔍 DATOS FORMATEADOS CON NOMBRES:", formattedData);
        setCategorias(formattedData);

        // 🆕 CALCULAR TOTALES igual que TopEquiposChart
        const metadata = response.data.resumen || response.data.metadata;
        const total =
          metadata?.total_consumo_litros ||
          formattedData.reduce((sum, item) => sum + item.value, 0);

        setTotalConsumo(total);
        setFechaActualizacion(new Date());

        // 🔑 IGUAL QUE TopEquiposChart: marcar como cargado
        initialLoadDone.current = true;

        console.log("ConsumptionPieChart: Datos formateados:", formattedData);
        console.log("ConsumptionPieChart: Total:", total);
      } else {
        setCategorias([]);
        setTotalConsumo(0);
        console.log("ConsumptionPieChart: No hay datos disponibles");
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

  // 🆕 CARGAR MÁQUINAS con datos de internas + externas
  const cargarMaquinasPorCategoria = async (categoria) => {
    if (!isMounted.current) return;

    try {
      setLoading(true);
      setError(null);

      console.log(
        "ConsumptionPieChart: Cargando máquinas para categoría:",
        categoria
      );

      // 🆕 USAR TU API con MISMOS FILTROS que TopEquiposChart
      const requestBody = {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
      };

      // 🔑 FILTRO DE FAENA igual que TopEquiposChart
      if (faenaSeleccionada && faenaSeleccionada !== "todas") {
        requestBody.id_faena = faenaSeleccionada;
      }

      console.log("ConsumptionPieChart: Request para máquinas:", requestBody);

      // 🆕 LLAMAR A TU API para máquinas por categoría ACTUALIZADA
      const response = await axios.post(
        `/api/categorias-chart/categorias/${categoria.id}/maquinas`,
        requestBody
      );

      console.log("ConsumptionPieChart: Respuesta de máquinas:", response.data);

      if (!isMounted.current) return;

      if (response.data && response.data.success && response.data.maquinas) {
        const maquinasData = response.data.maquinas
          .map((maquina) => ({
            id: maquina.id,
            nombre: maquina.name || maquina.nombre || "Sin nombre",
            name: maquina.name || maquina.nombre || "Sin nombre", // Para compatibilidad con el gráfico
            patente: maquina.patente || "S/P",
            value: Math.round((maquina.value || 0) * 100) / 100,
            estado: maquina.estado,
            tipo_maquina: maquina.tipo_maquina || "N/A", // 🆕 NUEVO: Interna/Externa
            promedio_consumo: maquina.promedio_consumo || 0,
            total_registros: maquina.total_registros || 0,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value); // 🔑 IGUAL QUE TopEquiposChart: ordenar desc

        console.log("🔍 MÁQUINAS FORMATEADAS CON NOMBRES:", maquinasData);
        setMaquinas(maquinasData);
        setError(null);

        console.log("ConsumptionPieChart: Máquinas procesadas:", maquinasData);
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

  // 🔑 IGUAL QUE TopEquiposChart: Effect para cargar datos cuando cambian filtros
  useEffect(() => {
    if (filtersChanged()) {
      cargarDatosCategorias();
      // Reset al modo de categorías cuando cambian los filtros
      setViewMode("categorias");
      setSelectedCategoria(null);
      setMaquinas([]);
    }
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]); // 🔑 MISMOS DEPS que TopEquiposChart

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

  // 🔑 IGUAL QUE TopEquiposChart: Función para reintentar
  const handleRetry = () => {
    setError(null);
    if (viewMode === "categorias") {
      cargarDatosCategorias();
    } else if (selectedCategoria) {
      cargarMaquinasPorCategoria(selectedCategoria);
    }
  };

  // 🆕 FUNCIONES PARA MOSTRAR MODALES
  const handleShowDetails = (categoria) => {
    setSelectedCategoriaForDetails(categoria);
    setShowDetailsModal(true);
  };

  const handleShowEnhancedDetails = (categoria) => {
    setSelectedCategoriaForDetails(categoria);
    setShowEnhancedModal(true);
  };

  // 🆕 TOOLTIP MEJORADO con información de internas/externas
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

  // 🔑 IGUAL QUE TopEquiposChart: Estados de carga y error
  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de consumo...</p>
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
      {/* 🆕 MODAL DE DETALLES ORIGINAL */}
      <ConsumoDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        categoria={selectedCategoriaForDetails}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        faenaSeleccionada={faenaSeleccionada}
      />

      {/* 🆕 MODAL MEJORADO CON TENDENCIAS */}
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
                ? "Consumo por Categoría de Máquinas"
                : `Consumo por Máquina - ${selectedCategoria?.nombre}`}
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
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />

                {/* 🆕 TEXTO CENTRAL SOLO CON EL NÚMERO */}
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

          {/* Tabla de datos - MÁS ANCHA */}
          <div className="lg:col-span-2 overflow-hidden">
            <h3 className="text-lg font-semibold mb-3">Detalle de Consumo</h3>
            <div className="max-h-95  overflow-y-auto border border-gray-200 rounded">
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
                        className={`border-b border-gray-100 hover:bg-gray-50 ${viewMode === "categorias" ? "cursor-pointer" : ""
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
                                backgroundColor: COLORS[index % COLORS.length],
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
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.tipo_maquina === "Interna"
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
                        {/* 🆕 NUEVA COLUMNA DE ACCIONES PARA CATEGORÍAS CON AMBOS BOTONES */}
                        {viewMode === "categorias" && (
                          <td className="p-2 text-center">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar que se active el click de la fila
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
        {/* 🆕 INFORMACIÓN DEL PERÍODO - MOBILE FRIENDLY */}
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
