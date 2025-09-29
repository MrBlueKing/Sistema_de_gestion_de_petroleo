import React, { useState, useEffect, useMemo } from "react";
import { getFaenaColors } from "../../context/faenaColor";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import {
  FiTrendingUp,
  FiActivity,
  FiBarChart2,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiFilter,
} from "react-icons/fi";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
  "#dda0dd",
  "#98fb98",
  "#f0e68c",
  "#ff6347",
  "#40e0d0",
  "#ee82ee",
  "#90ee90",
];

const CustomLabel = (props) => {
  const { x, y, value, width, height } = props;

  if (!value || value === 0) return null;

  // Posición del texto
  const labelX = width ? x + width / 2 : x;
  const labelY = y - 8;

  // Formateo del valor
  const displayValue = value >= 1000 ? `${value}L` : `${Math.round(value)}L`;

  return (
    <text
      x={labelX}
      y={labelY}
      
      textAnchor="middle"
      dominantBaseline="bottom"
      fill="#374151"
      fontSize="11"
      fontWeight="600"
      style={{
        textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
        filter: "drop-shadow(0px 1px 1px rgba(255,255,255,0.8))",
      }}
    >
      {displayValue}
    </text>
  );
};

const formatDateForDisplay = (dateStr, groupType, index = null) => {
  let date;
  if (groupType === "cargas") {
    date = new Date(dateStr);
  } else {
    date =
      groupType === "monthly" && dateStr.length === 7
        ? new Date(dateStr + "-01")
        : new Date(dateStr + "T00:00:00");
  }
  switch (groupType) {
    case "weekly": {
      const startOfWeek = new Date(date);
      const endOfWeek = new Date(date);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
      })} - ${endOfWeek.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
      })}`;
    }
    case "monthly":
      return date.toLocaleDateString("es-CL", {
        month: "long",
        year: "numeric",
      });
    case "cargas":
      return `${date.toLocaleDateString("es-CL")} ${date.toLocaleTimeString(
        "es-CL",
        { hour: "2-digit", minute: "2-digit" }
      )} #${index + 1}`;
    default:
      return date.toLocaleDateString("es-CL", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
  }
};

const CustomTooltip = ({ active, payload, label, groupBy }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => (
          <div key={index} className="mb-2 last:mb-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700 truncate max-w-50">
                  {entry.dataKey}
                </span>
              </div>
              <span className="font-medium ml-2">
                {entry.value.toLocaleString("es-CL")} L
              </span>
            </div>
            {groupBy === "cargas" && (
              <div className="mt-1 text-xs text-gray-500 ml-5">
                {entry.payload[`${entry.dataKey}_faena_nomrbe`] && (
                  <div>👤 {entry.payload[`${entry.dataKey}_faena_nombre`]}</div>
                )}

                {entry.payload[`${entry.dataKey}_solicitante`] && (
                  <div>👤 {entry.payload[`${entry.dataKey}_solicitante`]}</div>
                )}

                {entry.payload[`${entry.dataKey}_observacion`] && (
                  <div>📝 {entry.payload[`${entry.dataKey}_observacion`]}</div>
                )}
                {entry.payload.index && (
                  <div>🔢 Carga #{entry.payload.index}</div>
                )}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

// Función para calcular ticks estandarizados del eje Y
const calculateStandardizedYAxis = (
  chartData,
  selectedEquipments,
  uniqueEquipments
) => {
  // Encontrar el valor máximo en los datos
  let maxValue = 0;

  chartData.forEach((item) => {
    uniqueEquipments
      .filter((equipment) => selectedEquipments.has(equipment))
      .forEach((equipment) => {
        if (item[equipment] && item[equipment] > maxValue) {
          maxValue = item[equipment];
        }
      });
  });

  // Si no hay datos, usar un mínimo por defecto
  if (maxValue === 0) {
    return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
  }

  // Determinar el intervalo base según el rango de valores
  let interval;
  if (maxValue <= 50) {
    interval = 10; // Intervalos de 10
  } else if (maxValue <= 100) {
    interval = 25; // Intervalos de 25
  } else if (maxValue <= 500) {
    interval = 50; // Intervalos de 50
  } else if (maxValue <= 1000) {
    interval = 100; // Intervalos de 100
  } else if (maxValue <= 5000) {
    interval = 500; // Intervalos de 500
  } else {
    interval = 1000; // Intervalos de 1000
  }

  // Calcular el máximo del eje: siguiente múltiplo del intervalo + un intervalo extra
  const maxTick = Math.ceil(maxValue / interval) * interval;
  const domainMax = maxTick + interval; // Añadir un intervalo extra para las etiquetas

  // Generar los ticks
  const ticks = [];
  for (let i = 0; i <= domainMax; i += interval) {
    ticks.push(i);
  }

  return { domain: [0, domainMax], ticks };
};

// Componente de Gráfico de Tendencias por Equipo
const EquipmentTrendChart = ({
  consumosData = [],
  categoria,
  fechaDesde,
  fechaHasta,
  isVisible = true,
  showExpandedSelector = false,
  setShowExpandedSelector = () => {},
}) => {
  // Estados para el componente
  const [chartType, setChartType] = useState("line"); // 'line' o 'bar'
  const [groupBy, setGroupBy] = useState("cargas"); // 'daily', 'weekly', 'monthly', 'cargas'
  const [selectedEquipments, setSelectedEquipments] = useState(new Set());
  const [showAllEquipments, setShowAllEquipments] = useState(true);

  // Paleta de colores para las líneas/barras
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
    "#ffb347",
    "#87ceeb",
    "#dda0dd",
    "#98fb98",
    "#f0e68c",
    "#ff6347",
    "#40e0d0",
    "#ee82ee",
    "#90ee90",
  ];

  // 🔧 FUNCIÓN PARA FORMATEAR FECHAS (movida aquí para evitar hoisting error)
  const formatDateForDisplay = (dateStr, groupType, index = null) => {
    let date;

    // 🔧 MANEJAR DIFERENTES FORMATOS DE FECHA
    if (groupType === "cargas") {
      // Para cargas, dateStr viene como timestamp completo
      date = new Date(dateStr);
    } else {
      // Para agrupados, dateStr viene como 'YYYY-MM-DD' o 'YYYY-MM'
      if (groupType === "monthly" && dateStr.length === 7) {
        // Formato 'YYYY-MM' -> agregar día 01
        date = new Date(dateStr + "-01");
      } else {
        // Formato 'YYYY-MM-DD' -> crear fecha directamente
        date = new Date(dateStr + "T00:00:00"); // ✅ Forzar medianoche local
      }
    }

    // 🔍 LOG para debugging
    console.log(
      `📅 [FORMAT] Formateando: ${dateStr} (${groupType}) -> ${date.toISOString()}`
    );

    switch (groupType) {
      case "weekly":
        const startOfWeek = new Date(date);
        const endOfWeek = new Date(date);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        })} - ${endOfWeek.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        })}`;
      case "monthly":
        return date.toLocaleDateString("es-CL", {
          month: "long",
          year: "numeric",
        });
      case "cargas":
        // Para cargas individuales, mostrar fecha + hora + número de carga
        return `${date.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
        })} ${date.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        })} #${index + 1}`;
      default: // daily
        // 🔧 FORMATO MÁS CLARO PARA DÍAS
        return date.toLocaleDateString("es-CL", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
    }
  };

  const chartData = React.useMemo(() => {
    if (!consumosData || consumosData.length === 0) return [];

    console.log("🔍 [GRÁFICO] Procesando datos:", {
      total_registros: consumosData.length,
      groupBy: groupBy,
      equipos_seleccionados: Array.from(selectedEquipments),
    });

    if (groupBy === "cargas") {
      // 🆕 MODO CARGAS: Filtrar por equipos seleccionados ANTES de procesar
      const filteredConsumos = consumosData.filter((consumo) => {
        const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
          consumo.patente || "S/P"
        })`;
        return (
          selectedEquipments.size === 0 || selectedEquipments.has(equipmentKey)
        );
      });

      return filteredConsumos
        .sort((a, b) => new Date(a.fecha_consumo) - new Date(b.fecha_consumo))
        .map((consumo, index) => {
          const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
            consumo.patente || "S/P"
          })`;
          const fechaDisplay = formatDateForDisplay(
            consumo.fecha_consumo,
            "cargas",
            index
          );

          return {
            fecha: consumo.fecha_consumo,
            fechaDisplay: fechaDisplay,
            index: index + 1,
            [equipmentKey]: parseFloat(consumo.litros_consumidos || 0),
            [`${equipmentKey}_consumo_id`]: consumo.id_consumo,
            [`${equipmentKey}_faena_nombre`]: consumo.faena_nombre,
            [`${equipmentKey}_solicitante`]:
              consumo.solicitante_nombre || "N/A",
            [`${equipmentKey}_observacion`]: consumo.observacion || "",
          };
        });
    } else {
      // 🔧 MODO AGRUPADO: CAMBIO CLAVE - PROCESAR TODOS LOS DATOS PRIMERO, FILTRAR DESPUÉS
      const equipmentData = {};

      // 🚀 PASO 1: PROCESAR TODOS LOS CONSUMOS SIN FILTRAR
      consumosData.forEach((consumo) => {
        const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
          consumo.patente || "S/P"
        })`;
        const fecha = new Date(consumo.fecha_consumo);
        let dateKey;

        switch (groupBy) {
          case "weekly":
            const mondayOfWeek = new Date(
              fecha.getFullYear(),
              fecha.getMonth(),
              fecha.getDate()
            );
            mondayOfWeek.setDate(
              mondayOfWeek.getDate() - mondayOfWeek.getDay() + 1
            );
            dateKey = mondayOfWeek.toISOString().split("T")[0];
            break;
          case "monthly":
            dateKey = `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2, "0")}`;
            break;
          default: // daily
            dateKey = `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        }

        if (!equipmentData[dateKey]) {
          equipmentData[dateKey] = { fecha: dateKey };
        }

        if (!equipmentData[dateKey][equipmentKey]) {
          equipmentData[dateKey][equipmentKey] = 0;
        }

        const litros = parseFloat(consumo.litros_consumidos || 0);
        equipmentData[dateKey][equipmentKey] += litros;
      });

      // 🚀 PASO 2: CONVERTIR A ARRAY Y ORDENAR POR FECHA
      const sortedData = Object.values(equipmentData).sort(
        (a, b) => new Date(a.fecha) - new Date(b.fecha)
      );

      // 🚀 PASO 3: FORMATEAR FECHAS Y APLICAR FILTRO DE EQUIPOS EN EL RENDER
      const finalData = sortedData.map((item) => {
        const newItem = {
          fecha: item.fecha,
          fechaDisplay: formatDateForDisplay(item.fecha, groupBy),
        };

        // 🔧 CLAVE: AGREGAR TODOS LOS EQUIPOS, PERO SOLO MOSTRAR LOS SELECCIONADOS
        Object.keys(item).forEach((key) => {
          if (key !== "fecha" && key !== "fechaDisplay") {
            // 🎯 INCLUIR EL EQUIPO SOLO SI ESTÁ SELECCIONADO O NO HAY FILTRO
            if (selectedEquipments.size === 0 || selectedEquipments.has(key)) {
              newItem[key] = item[key];
            }
            // 🔧 CAMBIO: Si no está seleccionado, NO lo incluimos en los datos
            // Esto evita que aparezca en el gráfico pero mantiene la estructura de fechas
          }
        });

        return newItem;
      });

      console.log(
        "✅ [AGRUPADO] Datos finales con filtro aplicado:",
        finalData
      );

      return finalData;
    }
  }, [consumosData, groupBy, selectedEquipments]);

  // 🔧 TAMBIÉN CORREGIR uniqueEquipments PARA QUE SIEMPRE USE LOS DATOS ORIGINALES
  const uniqueEquipments = React.useMemo(() => {
    if (!consumosData || consumosData.length === 0) return [];

    const equipmentSet = new Set();

    // 🚀 CAMBIO: SIEMPRE OBTENER EQUIPOS DE LOS DATOS ORIGINALES, NO DE chartData
    consumosData.forEach((consumo) => {
      const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
        consumo.patente || "S/P"
      })`;
      equipmentSet.add(equipmentKey);
    });

    const result = Array.from(equipmentSet).sort();
    console.log("🔍 [EQUIPOS] Equipos únicos detectados:", result);
    return result;
  }, [consumosData]); // 🔧 SOLO DEPENDER DE consumosData, NO de chartData

  // 🔧 VERSIÓN COMPLETA DE LA FUNCIÓN chartData CORREGIDA:
  const chartDataComplete = React.useMemo(() => {
    if (!consumosData || consumosData.length === 0) return [];

    if (groupBy === "cargas") {
      // MODO CARGAS: Como estaba, funciona bien
      const filteredConsumos = consumosData.filter((consumo) => {
        const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
          consumo.patente || "S/P"
        })`;
        return (
          selectedEquipments.size === 0 || selectedEquipments.has(equipmentKey)
        );
      });

      return filteredConsumos
        .sort((a, b) => new Date(a.fecha_consumo) - new Date(b.fecha_consumo))
        .map((consumo, index) => {
          const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
            consumo.patente || "S/P"
          })`;
          const fechaDisplay = formatDateForDisplay(
            consumo.fecha_consumo,
            "cargas",
            index
          );

          return {
            fecha: consumo.fecha_consumo,
            fechaDisplay: fechaDisplay,
            index: index + 1,
            [equipmentKey]: parseFloat(consumo.litros_consumidos || 0),
            [`${equipmentKey}_consumo_id`]: consumo.id_consumo,
            [`${equipmentKey}_faena_nombre`]: consumo.faena_nombre,
            [`${equipmentKey}_solicitante`]:
              consumo.solicitante_nombre || "N/A",
            [`${equipmentKey}_observacion`]: consumo.observacion || "",
          };
        });
    } else {
      // 🔧 MODO AGRUPADO CORREGIDO: PROCESAR TODO, LUEGO FILTRAR EN LA VISUALIZACIÓN
      const equipmentData = {};

      // Procesar TODOS los consumos (sin filtrar por selección)
      consumosData.forEach((consumo) => {
        const equipmentKey = `${consumo.nombre_maquina || "Sin nombre"} (${
          consumo.patente || "S/P"
        })`;
        const fecha = new Date(consumo.fecha_consumo);
        let dateKey;

        switch (groupBy) {
          case "weekly":
            const mondayOfWeek = new Date(
              fecha.getFullYear(),
              fecha.getMonth(),
              fecha.getDate()
            );
            mondayOfWeek.setDate(
              mondayOfWeek.getDate() - mondayOfWeek.getDay() + 1
            );
            dateKey = mondayOfWeek.toISOString().split("T")[0];
            break;
          case "monthly":
            dateKey = `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2, "0")}`;
            break;
          default: // daily
            dateKey = `${fecha.getFullYear()}-${String(
              fecha.getMonth() + 1
            ).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        }

        if (!equipmentData[dateKey]) {
          equipmentData[dateKey] = { fecha: dateKey };
        }

        if (!equipmentData[dateKey][equipmentKey]) {
          equipmentData[dateKey][equipmentKey] = 0;
        }

        const litros = parseFloat(consumo.litros_consumidos || 0);
        equipmentData[dateKey][equipmentKey] += litros;
      });

      // Convertir a array y ordenar
      const sortedData = Object.values(equipmentData).sort(
        (a, b) => new Date(a.fecha) - new Date(b.fecha)
      );

      // 🎯 APLICAR FILTRO DE EQUIPOS AQUÍ (como en modo cargas)
      const finalData = sortedData.map((item) => {
        const filteredItem = {
          fecha: item.fecha,
          fechaDisplay: formatDateForDisplay(item.fecha, groupBy),
        };

        // Solo incluir equipos seleccionados
        Object.keys(item).forEach((key) => {
          if (key !== "fecha" && key !== "fechaDisplay") {
            if (selectedEquipments.size === 0 || selectedEquipments.has(key)) {
              filteredItem[key] = item[key];
            }
          }
        });

        return filteredItem;
      });

      return finalData;
    }
  }, [consumosData, groupBy, selectedEquipments]);

  // Calcular estadísticas por equipo
  const equipmentStats = React.useMemo(() => {
    const stats = {};

    uniqueEquipments.forEach((equipment) => {
      if (groupBy === "cargas") {
        // Para modo cargas, cada punto es una carga individual
        const cargas = chartData
          .map((item) => item[equipment] || 0)
          .filter((val) => val > 0);

        if (cargas.length > 0) {
          const total = cargas.reduce((sum, val) => sum + val, 0);
          const avg = total / cargas.length;
          const max = Math.max(...cargas);
          const min = Math.min(...cargas);

          stats[equipment] = {
            total: Math.round(total * 100) / 100,
            average: Math.round(avg * 100) / 100,
            max: Math.round(max * 100) / 100,
            min: Math.round(min * 100) / 100,
            registros: cargas.length,
            tipo: "cargas",
          };
        }
      } else {
        // Para modo agrupado, como estaba antes
        const values = chartData
          .map((item) => item[equipment] || 0)
          .filter((val) => val > 0);

        if (values.length > 0) {
          const total = values.reduce((sum, val) => sum + val, 0);
          const avg = total / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);

          stats[equipment] = {
            total: Math.round(total * 100) / 100,
            average: Math.round(avg * 100) / 100,
            max: Math.round(max * 100) / 100,
            min: Math.round(min * 100) / 100,
            registros: values.length,
            tipo: "agrupado",
          };
        }
      }
    });

    return stats;
  }, [chartData, uniqueEquipments, groupBy]);

  // 🆕 AGREGAR AQUÍ - Configuración del eje Y estandarizado
  const yAxisConfig = useMemo(
    () =>
      calculateStandardizedYAxis(
        chartData,
        selectedEquipments,
        uniqueEquipments
      ),
    [chartData, selectedEquipments, uniqueEquipments]
  );

  // Inicializar equipos seleccionados
  useEffect(() => {
    if (uniqueEquipments.length > 0 && selectedEquipments.size === 0) {
      // Seleccionar los primeros 5 equipos por defecto
      const defaultEquipments = new Set(uniqueEquipments.slice(0, 15));
      setSelectedEquipments(defaultEquipments);
      setShowAllEquipments(uniqueEquipments.length <= 0);
    }
  }, [uniqueEquipments]);

  // Manejar selección de equipos
  const toggleEquipment = (equipment) => {
    const newSelected = new Set(selectedEquipments);
    if (newSelected.has(equipment)) {
      newSelected.delete(equipment);
    } else {
      newSelected.add(equipment);
    }
    setSelectedEquipments(newSelected);
    setShowAllEquipments(newSelected.size === uniqueEquipments.length);
  };

  const toggleAllEquipments = () => {
    if (showAllEquipments) {
      setSelectedEquipments(new Set());
      setShowAllEquipments(false);
    } else {
      setSelectedEquipments(new Set(uniqueEquipments));
      setShowAllEquipments(true);
    }
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload
            .filter((entry) => entry.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => {
              const equipmentName = entry.dataKey;
              const consumoData = entry.payload;

              return (
                <div key={index} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-gray-700 truncate max-w-80">
                        {equipmentName}
                      </span>
                    </div>
                    <span className="font-medium ml-2">
                      {entry.value.toLocaleString("es-CL")} L
                    </span>
                  </div>
                  {groupBy === "cargas" && (
                    <div className="mt-1 text-xs text-gray-500 ml-5">
                      {consumoData[`${equipmentName}_faena_nombre`] && (
                        <div>
                          {/* 🎯 AQUÍ ESTÁ EL CAMBIO: usa el emoji dinámico según la faena */}
                          {getFaenaColors(
                            consumoData[`${equipmentName}_faena_nombre`]
                          )?.emoji || "👤"}{" "}
                          {consumoData[`${equipmentName}_faena_nombre`]}
                        </div>
                      )}
                      {consumoData[`${equipmentName}_solicitante`] && (
                        <div>
                          👤 {consumoData[`${equipmentName}_solicitante`]}
                        </div>
                      )}
                      {consumoData[`${equipmentName}_observacion`] && (
                        <div>
                          📝 {consumoData[`${equipmentName}_observacion`]}
                        </div>
                      )}
                      {consumoData.index && (
                        <div>🔢 Carga #{consumoData.index}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header compacto y mobile-friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiTrendingUp className="mr-2 text-blue-600 flex-shrink-0" />
              Tendencia por Equipo
            </h3>
            {categoria && (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {categoria.nombre}
              </span>
            )}
          </div>

          {/* Fila horizontal compacta con información y controles */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Información del gráfico como badges */}
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {uniqueEquipments.length} equipos
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {chartData.length} {groupBy === "cargas" ? "cargas" : "puntos"}
              </span>
              <div className="relative group">
                <FiInfo className="text-blue-600 w-4 h-4 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                  <div className="space-y-1">
                    <p>
                      Período: {fechaDesde} al {fechaHasta}
                    </p>
                    <p>
                      Agrupación:{" "}
                      {groupBy === "cargas"
                        ? "Por Cargas Individuales"
                        : groupBy === "daily"
                        ? "Diaria"
                        : groupBy === "weekly"
                        ? "Semanal"
                        : "Mensual"}
                    </p>
                    {groupBy === "cargas" && (
                      <p className="text-blue-300">
                        💡 Cada punto = una carga individual
                      </p>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>

            {/* Separador visual */}
            <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>

            {/* Selector de equipos compacto */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs whitespace-nowrap">
                Equipos ({selectedEquipments.size}/{uniqueEquipments.length}):
              </span>
              <div className="flex flex-wrap gap-1 max-w-xs sm:max-w-md">
                {uniqueEquipments.slice(0, 15).map((equipment, index) => (
                  <label
                    key={equipment}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEquipments.has(equipment)}
                      onChange={() => toggleEquipment(equipment)}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
                        selectedEquipments.has(equipment)
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="truncate max-w-80" title={equipment}>
                        {equipment.split("(")[0].trim()}
                      </span>
                    </div>
                  </label>
                ))}
                {uniqueEquipments.length > 15 && (
                  <button
                    onClick={() => setShowExpandedSelector(true)}
                    className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-600 hover:bg-gray-200"
                  >
                    +{uniqueEquipments.length - 15}
                  </button>
                )}
              </div>
              {uniqueEquipments.length > 0 && (
                <div className="relative group">
                  <FiInfo className="text-blue-600 w-4 h-4 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="space-y-1">
                      <p>Click para seleccionar/deseleccionar equipos</p>
                      {groupBy === "cargas" && (
                        <p className="text-blue-300">
                          El eje X se recalcula automáticamente
                        </p>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles en el lado derecho */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Tipo de gráfico */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setChartType("line")}
              className={`px-2 py-1 text-sm font-medium transition-colors ${
                chartType === "line"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiActivity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-2 py-1 text-sm font-medium transition-colors ${
                chartType === "bar"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
            </button>
          </div>

          {/* Agrupación temporal */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cargas">Por Cargas</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>

          {/* Toggle todos los equipos */}
          <button
            onClick={toggleAllEquipments}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center"
          >
            {showAllEquipments ? (
              <FiEyeOff className="w-4 h-4 mr-1" />
            ) : (
              <FiEye className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">
              {showAllEquipments ? "Ocultar" : "Mostrar"} todos
            </span>
            <span className="sm:hidden">
              {showAllEquipments ? "Ocultar" : "Mostrar"}
            </span>
          </button>
        </div>
      </div>

      {/* Gráfico con altura optimizada para mobile */}
      {chartData.length > 0 && selectedEquipments.size > 0 ? (
        <div className="h-[50vh] sm:h-[60vh] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="fechaDisplay"
                  stroke="#666"
                  tick={{ fontSize: 10 }}
                  padding={{ left: 20, right: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={groupBy === "cargas" ? "preserveStartEnd" : 0}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  domain={yAxisConfig.domain}
                  ticks={yAxisConfig.ticks}
                  type="number"
                  label={{
                    value: "Litros",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip 
                offset={150}
                content={<CustomTooltip />} />
                
                <Legend />

                {uniqueEquipments
                  .filter((equipment) => selectedEquipments.has(equipment))
                  .map((equipment, index) => (
                    <Line
                      key={equipment}
                      type="monotone"
                      dataKey={equipment}
                      stroke={
                        COLORS[
                          uniqueEquipments.indexOf(equipment) % COLORS.length
                        ]
                      }
                      strokeWidth={2}
                      dot={{
                        r: groupBy === "cargas" ? 4 : 4,
                        fill: COLORS[
                          uniqueEquipments.indexOf(equipment) % COLORS.length
                        ], // ✅ RELLENO con color de línea
                        stroke:
                          COLORS[
                            uniqueEquipments.indexOf(equipment) % COLORS.length
                          ], // ✅ BORDE con color de línea
                        strokeWidth: 1,
                      }}
                      connectNulls={false}
                      name={equipment}
                    >
                      <LabelList
                        dataKey={equipment}
                        content={<CustomLabel />}
                      />
                    </Line>
                  ))}
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="fechaDisplay"
                  stroke="#666"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={groupBy === "cargas" ? "preserveStartEnd" : 0}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  domain={yAxisConfig.domain}
                  ticks={yAxisConfig.ticks}
                  type="number"
                  label={{
                    value: "Litros",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {uniqueEquipments
                  .filter((equipment) => selectedEquipments.has(equipment))
                  .map((equipment, index) => (
                    <Bar
                      key={equipment}
                      dataKey={equipment}
                      fill={
                        COLORS[
                          uniqueEquipments.indexOf(equipment) % COLORS.length
                        ]
                      }
                      name={equipment}
                    >
                      <LabelList
                        dataKey={equipment}
                        content={<CustomLabel />}
                      />
                    </Bar>
                  ))}

                {/* 🆕 ETIQUETAS DE DATOS - Solo para valores > 0 */}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[60vh] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            {chartData.length === 0 ? (
              <>
                <FiTrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de consumo disponibles</p>
                <p className="text-sm">para el período seleccionado</p>
              </>
            ) : (
              <>
                <FiFilter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Seleccione al menos un equipo</p>
                <p className="text-sm">para mostrar en el gráfico</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas por equipo */}
      {Object.keys(equipmentStats).length > 0 &&
        selectedEquipments.size > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Estadísticas de Equipos Seleccionados:
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Total (L)
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Promedio (L)
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Máximo (L)
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      {groupBy === "cargas" ? "Cargas" : "Registros"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from(selectedEquipments)
                    .filter((equipment) => equipmentStats[equipment])
                    .sort(
                      (a, b) =>
                        equipmentStats[b].total - equipmentStats[a].total
                    )
                    .map((equipment, index) => (
                      <tr key={equipment} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                              style={{
                                backgroundColor:
                                  COLORS[
                                    uniqueEquipments.indexOf(equipment) %
                                      COLORS.length
                                  ],
                              }}
                            />
                            <span
                              className="font-medium text-gray-900 truncate"
                              title={equipment}
                            >
                              {equipment}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 font-medium">
                          {equipmentStats[equipment].total.toLocaleString(
                            "es-CL"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {equipmentStats[equipment].average.toLocaleString(
                            "es-CL"
                          )}
                          {groupBy === "cargas" && (
                            <div className="text-xs text-gray-400">
                              por carga
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {equipmentStats[equipment].max.toLocaleString(
                            "es-CL"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {equipmentStats[equipment].registros}
                          {groupBy === "cargas" && (
                            <div className="text-xs text-gray-400">cargas</div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 🆕 INFORMACIÓN MODO CARGAS COMO TOOLTIP */}
            {groupBy === "cargas" && (
              <div className="mt-3 flex items-center">
                <span className="text-sm text-gray-700 mr-2">
                  Modo Por Cargas
                </span>
                <div className="relative group">
                  <FiInfo className="text-yellow-600 w-4 h-4 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-80">
                    <div className="space-y-1">
                      <p>
                        💡 <strong>Modo Por Cargas:</strong> Cada punto en el
                        gráfico representa una carga individual de combustible.
                        Las estadísticas muestran el comportamiento de cada
                        equipo por carga realizada.
                      </p>
                      <p>
                        🔄 <strong>Filtrado dinámico:</strong> Al
                        seleccionar/deseleccionar equipos, el eje X se recalcula
                        automáticamente mostrando solo las cargas de los equipos
                        activos.
                      </p>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default EquipmentTrendChart;
