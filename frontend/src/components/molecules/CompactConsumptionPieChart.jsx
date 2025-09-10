import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useChartColors } from "./../../context/ChartColorsContext";
import {
  FiPieChart,
  FiLoader,
  FiAlertTriangle,
  FiRefreshCw,
  FiActivity,
  FiEye,
  FiFilter,
  FiToggleRight,
  FiToggleLeft,
  FiInfo,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from "react-icons/fi";
import axios from "../../lib/axios";

const CompactConsumptionPieChart = ({
  faenaSeleccionada = "todas",
  fechaDesde,
  fechaHasta,
  refreshKey = 0,
  allowParallelLoad = false,
  waitForColors = true,
  getColorForCategory = null,
  chartColors = [
    "#f97316", // orange-500
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#f43f5e", // rose-500
    "#6366f1", // indigo-500
    "#64748b", // slate-500
  ],
  titulo = "Análisis Comparativo Mensual",
  // ✅ NUEVAS PROPS PARA CARGA PARALELA:
}) => {
  // 🔧 VERSIÓN SEGURA - con destructuring defensivo
  const chartColorsContext = useChartColors();

  const {
    compactChartCanLoad = false,
    handleCompactChartLoad = () => {},
    getColorForCategory: contextGetColor = null,
    hasValidColorMapping = false,
    isInitialized = false, // ✅ INCLUIDO Y CON VALOR POR DEFECTO
    categoryColorMapping = {},
    mainChartLoaded = false,
  } = chartColorsContext || {};

  const [modoVisualizacion, setModoVisualizacion] = useState("iniciales");
  const [periodoActual, setPeriodoActual] = useState([]);
  const [periodoAnterior, setPeriodoAnterior] = useState([]);
  // Estados para almacenar los datos completos (ambos tipos de categorías)
  const [datosCompletoActuales, setDatosCompletoActuales] = useState({
    categoriasIniciales: [],
    categoriasFinales: [],
  });

  const [datosCompletoAnteriores, setDatosCompletoAnteriores] = useState({
    categoriasIniciales: [],
    categoriasFinales: [],
  });

  // 🔄 FUNCIÓN PARA CAMBIAR ENTRE MODOS DE VISUALIZACIÓN - CON VERIFICACIÓN DEFENSIVA
  const alternarModoVisualizacion = () => {
    const nuevoModo =
      modoVisualizacion === "iniciales" ? "finales" : "iniciales";

    console.log(
      `🔄 CompactChart: Cambiando de ${modoVisualizacion} a ${nuevoModo}`
    );
    setModoVisualizacion(nuevoModo);

    // 🛡️ VERIFICACIÓN DEFENSIVA: Asegurarse de que los objetos existen
    const actualesIniciales =
      datosCompletoActuales?.categoriasIniciales?.length || 0;
    const actualesFinales =
      datosCompletoActuales?.categoriasFinales?.length || 0;

    // 🔄 ACTUALIZAR INMEDIATAMENTE LAS CATEGORÍAS MOSTRADAS
    if (actualesIniciales > 0 || actualesFinales > 0) {
      console.log("📊 Datos disponibles, actualizando vista...");
      actualizarCategoriasSegunModo(nuevoModo);
    } else {
      console.log("⚠️ No hay datos disponibles para cambiar la vista");
      console.log("🔍 Estado de datos completos:", {
        datosCompletoActuales,
        datosCompletoAnteriores,
        actualesIniciales,
        actualesFinales,
      });
    }
  };

  const actualizarCategoriasSegunModo = (modo) => {
    console.log(
      `📊 [actualizarCategoriasSegunModo] Iniciando actualización a modo: ${modo}`
    );

    // 🛡️ VERIFICACIÓN MÁS ROBUSTA
    if (!datosCompletoActuales || !datosCompletoAnteriores) {
      console.warn(
        "⚠️ [actualizarCategoriasSegunModo] Los datos completos no están disponibles:",
        {
          tieneActuales: !!datosCompletoActuales,
          tieneAnteriores: !!datosCompletoAnteriores,
        }
      );
      return;
    }

    // 🔍 DEBUGGING: Mostrar estructura de los datos
    console.log(
      "🔍 [actualizarCategoriasSegunModo] Estructura de datos recibida:",
      {
        actuales: {
          keys: Object.keys(datosCompletoActuales),
          inicialesCount:
            datosCompletoActuales.categoriasIniciales?.length || 0,
          finalesCount: datosCompletoActuales.categoriasFinales?.length || 0,
        },
        anteriores: {
          keys: Object.keys(datosCompletoAnteriores),
          inicialesCount:
            datosCompletoAnteriores.categoriasIniciales?.length || 0,
          finalesCount: datosCompletoAnteriores.categoriasFinales?.length || 0,
        },
      }
    );

    // Seleccionar las categorías según el modo CON VERIFICACIÓN
    const categoriasParaUsar =
      modo === "finales"
        ? datosCompletoActuales.categoriasFinales || []
        : datosCompletoActuales.categoriasIniciales || [];

    const categoriasAnterioresParaUsar =
      modo === "finales"
        ? datosCompletoAnteriores.categoriasFinales || []
        : datosCompletoAnteriores.categoriasIniciales || [];

    console.log(
      `📊 [actualizarCategoriasSegunModo] Categorías seleccionadas para modo ${modo}:`,
      {
        actuales: categoriasParaUsar.length,
        anteriores: categoriasAnterioresParaUsar.length,
        tipoCategoriasActuales:
          categoriasParaUsar.length > 0 ? categoriasParaUsar[0] : "sin datos",
        tipoCategoriasAnteriores:
          categoriasAnterioresParaUsar.length > 0
            ? categoriasAnterioresParaUsar[0]
            : "sin datos",
      }
    );

    // Verificar que tenemos datos
    if (
      categoriasParaUsar.length === 0 &&
      categoriasAnterioresParaUsar.length === 0
    ) {
      console.warn(
        `⚠️ [actualizarCategoriasSegunModo] No hay datos para mostrar en modo ${modo}`
      );
      return;
    }

    // Recrear la lista unificada con las nuevas categorías
    const todasCategorias = new Map();

    // Procesar categorías actuales
    categoriasParaUsar.forEach((cat, index) => {
      const color = obtenerColor(cat, index);
      console.log(
        `🎨 [actualizarCategoriasSegunModo] Color para ${cat.name}: ${color}`
      );

      todasCategorias.set(cat.name, {
        name: cat.name,
        nombre: cat.name, // 🔧 ASEGURAR COMPATIBILIDAD
        actual: cat.value,
        anterior: 0,
        color: color,
        id: cat.id || index,
      });
    });

    // Procesar categorías anteriores
    categoriasAnterioresParaUsar.forEach((cat, index) => {
      if (todasCategorias.has(cat.name)) {
        todasCategorias.get(cat.name).anterior = cat.value;
      } else {
        const color = obtenerColor(cat, index + categoriasParaUsar.length);
        todasCategorias.set(cat.name, {
          name: cat.name,
          nombre: cat.name, // 🔧 ASEGURAR COMPATIBILIDAD
          actual: 0,
          anterior: cat.value,
          color: color,
          id: cat.id || index,
        });
      }
    });

    // Convertir a array y actualizar estados
    const categoriasFinales = Array.from(todasCategorias.values()).sort(
      (a, b) => b.actual + b.anterior - (a.actual + a.anterior)
    );

    console.log(
      `📊 [actualizarCategoriasSegunModo] Categorías unificadas creadas:`,
      {
        total: categoriasFinales.length,
        conActuales: categoriasFinales.filter((c) => c.actual > 0).length,
        conAnteriores: categoriasFinales.filter((c) => c.anterior > 0).length,
        muestra: categoriasFinales.slice(0, 3).map((c) => ({
          name: c.name,
          actual: c.actual,
          anterior: c.anterior,
        })),
      }
    );

    // 🔄 ACTUALIZAR LOS ESTADOS
    setCategorias(categoriasFinales);
    setPeriodoActual(categoriasFinales.filter((cat) => cat.actual > 0));
    setPeriodoAnterior(categoriasFinales.filter((cat) => cat.anterior > 0));

    console.log(
      `✅ [actualizarCategoriasSegunModo] Estados actualizados para modo ${modo}`
    );
  };

  // 🔧 DEBUGGING ADICIONAL: Agregar este useEffect para monitorear cambios
  useEffect(() => {
    console.log("🔍 [MONITOR] Estados actualizados:", {
      categoriasLength: categorias.length,
      periodoActualLength: periodoActual.length,
      periodoAnteriorLength: periodoAnterior.length,
      modoVisualizacion,
      tieneDatosCompletos: !!(datosCompletoActuales && datosCompletoAnteriores),
    });
  }, [
    periodoActual,
    periodoAnterior,
    modoVisualizacion,
    datosCompletoActuales,
    datosCompletoAnteriores,
  ]);

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodoAnteriorDescripcion, setPeriodoAnteriorDescripcion] =
    useState("");
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
  });

  const formatearPeriodo = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return "";

    // 🔧 PARSEAR MANUALMENTE para evitar problemas de zona horaria
    const [añoInicio, mesInicio, diaInicio] = fechaInicio
      .split("-")
      .map(Number);
    const [añoFin, mesFin, diaFin] = fechaFin.split("-").map(Number);

    const fechaInicioFormateada = `${diaInicio
      .toString()
      .padStart(2, "0")}/${mesInicio.toString().padStart(2, "0")}/${añoInicio}`;
    const fechaFinFormateada = `${diaFin.toString().padStart(2, "0")}/${mesFin
      .toString()
      .padStart(2, "0")}/${añoFin}`;

    return `${fechaInicioFormateada} al ${fechaFinFormateada}`;
  };

  useEffect(() => {
    console.log(
      "🔍 CompactConsumptionPieChart: useEffect de montaje ejecutado"
    );
    isMounted.current = true;
    return () => {
      console.log("🔍 CompactConsumptionPieChart: Componente desmontándose");
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    console.log("🔍 CompactConsumptionPieChart: Contexto de colores cambió:", {
      hasGetColorForCategory: !!getColorForCategory,
      categoryColorMappingKeys: Object.keys(categoryColorMapping || {}),
      categoryColorMappingLength: Object.keys(categoryColorMapping || {}),
      hasValidColorMapping,
      isInitialized,
    });
  }, [
    getColorForCategory,
    categoryColorMapping,
    hasValidColorMapping,
    isInitialized,
  ]);

  // Función para verificar si los filtros han cambiado realmente
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed =
      prevF.faenaSeleccionada !== faenaSeleccionada ||
      prevF.fechaDesde !== fechaDesde ||
      prevF.fechaHasta !== fechaHasta ||
      prevF.refreshKey !== refreshKey ||
      !initialLoadDone.current;

    console.log(
      "🔍 CompactConsumptionPieChart: Verificando cambios de filtros:",
      {
        changed,
        prevFilters: prevF,
        currentFilters: {
          faenaSeleccionada,
          fechaDesde,
          fechaHasta,
          refreshKey,
        },
        initialLoadDone: initialLoadDone.current,
      }
    );

    prevFilters.current = {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      refreshKey,
    };
    return changed;
  };

  // 🎨 FUNCIÓN MEJORADA PARA OBTENER COLORES CONSISTENTES
  const obtenerColor = (categoria, index) => {
    const categoryName = categoria.name || categoria.nombre || "Sin categoría";

    console.log(`🎨 CompactChart: Obteniendo color para "${categoryName}"`);

    // 1. Usar la función del padre si está disponible (PRIORIDAD 1)
    if (getColorForCategory && typeof getColorForCategory === "function") {
      const color = getColorForCategory(categoryName);
      console.log(
        `🎨 CompactChart: Color desde función padre para "${categoryName}": ${color}`
      );
      return color;
    }

    // 3. Usar el mapeo de colores del padre si está disponible (PRIORIDAD 3)
    if (categoryColorMapping && Object.keys(categoryColorMapping).length > 0) {
      const mappedColor = categoryColorMapping[categoryName];
      if (mappedColor) {
        console.log(
          `🎨 CompactChart: Color desde mapeo para "${categoryName}": ${mappedColor}`
        );
        return mappedColor;
      }
    }

    // 4. Fallback al array de colores (PRIORIDAD 4)
    const fallbackColor = chartColors[index % chartColors.length];
    console.log(
      `🎨 CompactChart: Color fallback para "${categoryName}": ${fallbackColor}`
    );
    return fallbackColor;
  };

  // 🔧 SOLUCIÓN COMPLETA: Función calcularPeriodoAnterior que maneja correctamente los días por mes

  const calcularPeriodoAnterior = () => {
    if (!fechaDesde || !fechaHasta) {
      return {
        fechaDesde: "",
        fechaHasta: "",
        descripcion: "Fechas inválidas",
      };
    }

    // 📅 FUNCIÓN AUXILIAR: Obtener días en un mes específico
    const getDiasEnMes = (year, month) => {
      // month es 1-12 (enero = 1, diciembre = 12)
      return new Date(year, month, 0).getDate();
    };

    // Parsear fechas de entrada
    const [yearDesde, monthDesde, dayDesde] = fechaDesde.split("-").map(Number);
    const [yearHasta, monthHasta, dayHasta] = fechaHasta.split("-").map(Number);

    // Calcular mes anterior para fecha inicio
    let yearAnteriorDesde = yearDesde;
    let monthAnteriorDesde = monthDesde - 1;
    if (monthAnteriorDesde < 1) {
      monthAnteriorDesde = 12;
      yearAnteriorDesde -= 1;
    }

    // Calcular mes anterior para fecha fin
    let yearAnteriorHasta = yearHasta;
    let monthAnteriorHasta = monthHasta - 1;
    if (monthAnteriorHasta < 1) {
      monthAnteriorHasta = 12;
      yearAnteriorHasta -= 1;
    }

    // 🔧 CORRECCIÓN CRÍTICA: Ajustar días si el mes anterior tiene menos días
    let dayAnteriorDesde = dayDesde;
    let dayAnteriorHasta = dayHasta;

    // Verificar días máximos para el mes anterior de la fecha inicio
    const maxDiasAnteriorDesde = getDiasEnMes(
      yearAnteriorDesde,
      monthAnteriorDesde
    );
    if (dayAnteriorDesde > maxDiasAnteriorDesde) {
      dayAnteriorDesde = maxDiasAnteriorDesde;
      console.log(
        `🔧 Ajuste fecha inicio: Día ${dayDesde} → ${dayAnteriorDesde} (mes ${monthAnteriorDesde} solo tiene ${maxDiasAnteriorDesde} días)`
      );
    }

    // Verificar días máximos para el mes anterior de la fecha fin
    const maxDiasAnteriorHasta = getDiasEnMes(
      yearAnteriorHasta,
      monthAnteriorHasta
    );
    if (dayAnteriorHasta > maxDiasAnteriorHasta) {
      dayAnteriorHasta = maxDiasAnteriorHasta;
      console.log(
        `🔧 Ajuste fecha fin: Día ${dayHasta} → ${dayAnteriorHasta} (mes ${monthAnteriorHasta} solo tiene ${maxDiasAnteriorHasta} días)`
      );
    }

    // Formatear fechas como YYYY-MM-DD
    const fechaInicioAnterior = `${yearAnteriorDesde}-${monthAnteriorDesde
      .toString()
      .padStart(2, "0")}-${dayAnteriorDesde.toString().padStart(2, "0")}`;
    const fechaFinAnterior = `${yearAnteriorHasta}-${monthAnteriorHasta
      .toString()
      .padStart(2, "0")}-${dayAnteriorHasta.toString().padStart(2, "0")}`;

    // 🎨 NUEVA PARTE VISUAL: Sumar 1 día SOLO para mostrar al usuario
    const fechaVisualInicio = new Date(fechaInicioAnterior);
    fechaVisualInicio.setDate(fechaVisualInicio.getDate() + 1);

    const fechaVisualFin = new Date(fechaFinAnterior);
    fechaVisualFin.setDate(fechaVisualFin.getDate() + 1);

    // 🎨 FORMATO VISUAL: dd/mm/yyyy como requested
    const formatearFechaVisual = (fecha) => {
      const dia = fecha.getDate().toString().padStart(2, "0");
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const año = fecha.getFullYear();
      return `${dia}/${mes}/${año}`;
    };

    // Generar descripción
  const descripcion = `${formatearFechaVisual(fechaVisualInicio)} al ${formatearFechaVisual(fechaVisualFin)}`;


    // Logging para debugging
    console.log("🔍 Cálculo período anterior:", {
      entrada: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
      calculado: {
        desde: fechaInicioAnterior,
        hasta: fechaFinAnterior,
      },
      ajustes: {
        diaDesdeAjustado: dayDesde !== dayAnteriorDesde,
        diaHastaAjustado: dayHasta !== dayAnteriorHasta,
        diasMaximosEnMesAnterior: {
          inicio: maxDiasAnteriorDesde,
          fin: maxDiasAnteriorHasta,
        },
      },
      descripcion,
    });

    return {
      fechaDesde: fechaInicioAnterior,
      fechaHasta: fechaFinAnterior,
      descripcion,
      // 🆕 METADATOS ADICIONALES para debugging
      metadatos: {
        ajusteDiaInicio: dayDesde !== dayAnteriorDesde,
        ajusteDiaFin: dayHasta !== dayAnteriorHasta,
        diasOriginales: { inicio: dayDesde, fin: dayHasta },
        diasAjustados: { inicio: dayAnteriorDesde, fin: dayAnteriorHasta },
      },
    };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // 🔍 Detectar cuál gráfico estamos mostrando basado en el dataKey del Pie
      const dataKey = payload[0].dataKey; // Será 'actual' o 'anterior'

      let valorCategoria = 0;
      let total = 0;
      let periodo = "";

      if (dataKey === "actual") {
        // Gráfico del período actual
        valorCategoria = data.actual || 0;
        total = categorias.reduce((sum, item) => sum + (item.actual || 0), 0);
        periodo = "Período Actual";
      } else if (dataKey === "anterior") {
        // Gráfico del período anterior
        valorCategoria = data.anterior || 0;
        total = categorias.reduce((sum, item) => sum + (item.anterior || 0), 0);
        periodo = "Período Anterior";
      } else {
        // Fallback para otros casos
        valorCategoria = data.value || 0;
        total = currentData
          ? currentData.reduce((sum, item) => sum + item.value, 0)
          : valorCategoria;
        periodo = "Datos";
      }

      // Calcular el porcentaje
      const percentage =
        total > 0 ? ((valorCategoria / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">
            {data.name || data.nombre || label}
          </p>
          <p className="text-orange-600 font-medium">
            Consumo: {valorCategoria.toLocaleString("es-CL")} L
          </p>
          <p className="text-gray-600 text-sm font-medium">
            {percentage}% del total
          </p>
          {/* 📊 Indicador visual del período */}
          <p className="text-xs text-blue-600 mt-1">{periodo}</p>
        </div>
      );
    }

    return null;
  };

  // 🔄 FUNCIÓN DE PROCESAMIENTO (copiada del código anterior)
  const procesarDatosBackend = (data) => {
    console.log("🔧 Procesando datos del backend...", data);

    // Paso 1: Procesar datos iniciales (TODO - sin filtros ni agrupaciones)
    let categoriasIniciales = data.categorias
      .map((item, index) => ({
        id: item.id || index,
        name: item.name || item.nombre || "Sin categoría",
        nombre: item.name || item.nombre || "Sin categoría",
        value: Math.round((item.value || 0) * 100) / 100,
        maquinas_count: item.maquinas_count || 0,
        originalData: item,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    console.log("📊 Categorías iniciales (TODO):", categoriasIniciales);

    // Paso 2: Procesar categorías finales (OPERACIONALES)
    const categoriasExcluidas = ["Microbus", "Microbús", "MICROBUS"];
    const categoriasFiltradas = categoriasIniciales.filter((categoria) => {
      const nombreLimpio = categoria.name.trim();
      const esExcluida = categoriasExcluidas.some((excluida) =>
        nombreLimpio.toLowerCase().includes(excluida.toLowerCase())
      );
      return !esExcluida;
    });

    // Agrupar camionetas
    const categoriasAgrupadas = [];
    let camionetasAgrupadas = {
      name: "Camionetas",
      nombre: "Camionetas",
      value: 0,
      maquinas_count: 0,
      categorias_originales: [],
    };

    categoriasFiltradas.forEach((categoria) => {
      const nombreLimpio = categoria.name.trim().toLowerCase();
      const esCamioneta =
        nombreLimpio.includes("camioneta") ||
        nombreLimpio.includes("camionetas") ||
        nombreLimpio === "camioneta";

      if (esCamioneta) {
        camionetasAgrupadas.value += categoria.value;
        camionetasAgrupadas.maquinas_count += categoria.maquinas_count;
        camionetasAgrupadas.categorias_originales.push(categoria.name);
      } else {
        categoriasAgrupadas.push(categoria);
      }
    });

    // Aplicar factor de 0.3% a camionetas si existen
    if (camionetasAgrupadas.value > 0) {
      const valorOriginal = camionetasAgrupadas.value;
      camionetasAgrupadas.value = camionetasAgrupadas.value * 0.3;
      camionetasAgrupadas.value =
        Math.round(camionetasAgrupadas.value * 100) / 100;
      categoriasAgrupadas.push(camionetasAgrupadas);
    }

    const categoriasFinales = categoriasAgrupadas
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      categoriasIniciales: categoriasIniciales,
      categoriasFinales: categoriasFinales,
    };
  };

  // Función para obtener datos del backend
  const obtenerDatosPeriodo = async (fechaInicio, fechaFin) => {
    const requestBody = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      modo: "categorias",
    };

    if (faenaSeleccionada && faenaSeleccionada !== "todas") {
      requestBody.id_faena = faenaSeleccionada;
    }

    console.log("📊 [CompactChart] Request body para período:", requestBody);

    const response = await axios.post(
      "/api/categorias-chart/categorias",
      requestBody
    );
    const data = response.data;

    return procesarDatosBackend(data);
  };

  // Función mejorada de validación de fechas
  const validarPeriodoAnterior = (fechaInicioAnterior, fechaFinAnterior) => {
    const inicio = new Date(fechaInicioAnterior);
    const fin = new Date(fechaFinAnterior);
    const ahora = new Date();

    // Verificar que las fechas sean válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      console.error("❌ Fechas del período anterior inválidas");
      return false;
    }

    // Verificar que el inicio sea anterior al fin
    if (inicio > fin) {
      console.error(
        "❌ Fecha de inicio del período anterior es posterior a la fecha de fin"
      );
      return false;
    }

    // Advertir si las fechas son muy antigas (más de 2 años)
    const dosAñosAtras = new Date();
    dosAñosAtras.setFullYear(dosAñosAtras.getFullYear() - 2);

    if (inicio < dosAñosAtras) {
      console.warn(
        "⚠️ El período anterior es de hace más de 2 años, es posible que no haya datos"
      );
    }

    // Advertir si las fechas son futuras
    if (inicio > ahora) {
      console.warn(
        "⚠️ El período anterior es en el futuro, es posible que no haya datos"
      );
    }

    return true;
  };

  // 🔧 MEJORAR la función obtenerColorInteligente existente:
  const obtenerColorInteligente = useCallback(
    (item, index) => {
      const categoryName = item.name || item.nombre || "Sin categoría";

      console.log(`🎨 CompactChart: Obteniendo color para "${categoryName}"`);

      // 🔑 PRIORIDAD 1: Color del contexto (datos del gráfico principal)
      if (hasValidColorMapping) {
        const colorDelContexto = contextGetColor(categoryName);
        if (colorDelContexto) {
          console.log(
            `✅ CompactChart: Color del contexto para "${categoryName}": ${colorDelContexto}`
          );
          return colorDelContexto;
        }
      }

      // PRIORIDAD 2: Color del prop categoryColorMapping (legacy)
      if (
        categoryColorMapping &&
        Object.keys(categoryColorMapping).length > 0
      ) {
        const mappedColor = categoryColorMapping[categoryName];
        if (mappedColor) {
          console.log(
            `🎨 CompactChart: Color desde mapeo para "${categoryName}": ${mappedColor}`
          );
          return mappedColor;
        }
      }

      // PRIORIDAD 3: Función getColorForCategory (legacy)
      if (getColorForCategory && typeof getColorForCategory === "function") {
        const functionColor = getColorForCategory(categoryName);
        if (functionColor) {
          console.log(
            `🎨 CompactChart: Color desde función para "${categoryName}": ${functionColor}`
          );
          return functionColor;
        }
      }

      // PRIORIDAD 4: Fallback al array de colores
      const fallbackColor = chartColors[index % chartColors.length];
      console.log(
        `⚠️ CompactChart: Color fallback para "${categoryName}": ${fallbackColor}`
      );
      return fallbackColor;
    },
    [
      contextGetColor,
      hasValidColorMapping,
      categoryColorMapping,
      getColorForCategory,
      chartColors,
    ]
  );

  // 🔄 FUNCIÓN CARGAR DATOS ACTUALIZADA
  const cargarDatos = async () => {
    console.log("🔍 CompactConsumptionPieChart: cargarDatos() iniciando...");

    // 🆕 NUEVO: Verificar si puede cargar
    if (waitForColors && !compactChartCanLoad) {
      console.log(
        "⏳ CompactChart: Esperando que termine el gráfico principal..."
      );
      return; // No cargar aún
    }

    if (!isMounted.current) {
      console.log(
        "🔍 CompactConsumptionPieChart: Componente no montado, abortando carga"
      );
      return;
    }

    setLoading(true);
    setError(null);
    console.log(
      "🔍 CompactConsumptionPieChart: Estado loading=true establecido"
    );

    try {
      if (!fechaDesde || !fechaHasta) {
        console.error("🔍 CompactConsumptionPieChart: Fechas faltantes:", {
          fechaDesde,
          fechaHasta,
        });
        throw new Error("Las fechas son requeridas");
      }

      console.log(
        "🔍 CompactConsumptionPieChart: Fechas válidas, calculando período anterior..."
      );

      // Calcular período anterior (un mes atrás)
      const periodoAnteriorFechas = calcularPeriodoAnterior();

      // Validar el período anterior
      if (
        !validarPeriodoAnterior(
          periodoAnteriorFechas.fechaDesde,
          periodoAnteriorFechas.fechaHasta
        )
      ) {
        console.error(
          "🔍 CompactConsumptionPieChart: Período anterior inválido"
        );
        throw new Error("El período anterior calculado no es válido");
      }

      console.log(
        "🔍 CompactConsumptionPieChart: Períodos calculados correctamente, iniciando carga de datos..."
      );

      console.log("📊 Períodos a consultar:", {
        actual: `${fechaDesde} al ${fechaHasta}`,
        anterior: `${periodoAnteriorFechas.fechaDesde} al ${periodoAnteriorFechas.fechaHasta}`,
        descripcion: periodoAnteriorFechas.descripcion,
      });

      // Cargar ambos períodos en paralelo
      console.log(
        "🔍 CompactConsumptionPieChart: Iniciando carga paralela de datos..."
      );

      const [datosActuales, datosAnteriores] = await Promise.all([
        obtenerDatosPeriodo(fechaDesde, fechaHasta),
        obtenerDatosPeriodo(
          periodoAnteriorFechas.fechaDesde,
          periodoAnteriorFechas.fechaHasta
        ),
      ]);

      // 🔄 NUEVO: Determinar qué categorías usar según el modo actual
      // Por defecto mostraremos las categorías iniciales (TODO)
      const categoriasParaUsar =
        modoVisualizacion === "finales"
          ? datosActuales.categoriasFinales
          : datosActuales.categoriasIniciales;

      const categoriasAnterioresParaUsar =
        modoVisualizacion === "finales"
          ? datosAnteriores.categoriasFinales
          : datosAnteriores.categoriasIniciales;

      console.log("🔍 CompactConsumptionPieChart: Datos cargados exitosamente");
      console.log(`🔄 Modo actual: ${modoVisualizacion}`);
      console.log("📊 Categorías seleccionadas:", {
        actuales: categoriasParaUsar.length,
        anteriores: categoriasAnterioresParaUsar.length,
        tipoActuales:
          modoVisualizacion === "finales" ? "Operacionales" : "Todo",
      });

      if (!isMounted.current) {
        console.log(
          "🔍 CompactConsumptionPieChart: Componente desmontado durante la carga, abortando"
        );
        return;
      }

      // Logging de resultados actualizados
      console.log("📈 Datos cargados:", {
        actual: {
          categorias: categoriasParaUsar.length,
          total: categoriasParaUsar.reduce((sum, cat) => sum + cat.value, 0),
          datos: categoriasParaUsar,
        },
        anterior: {
          categorias: categoriasAnterioresParaUsar.length,
          total: categoriasAnterioresParaUsar.reduce(
            (sum, cat) => sum + cat.value,
            0
          ),
          datos: categoriasAnterioresParaUsar,
        },
        // 🆕 NUEVO: Información adicional sobre ambos tipos
        datosCompletos: {
          actuales: {
            iniciales: datosActuales.categoriasIniciales.length,
            finales: datosActuales.categoriasFinales.length,
          },
          anteriores: {
            iniciales: datosAnteriores.categoriasIniciales.length,
            finales: datosAnteriores.categoriasFinales.length,
          },
        },
      });

      console.log("Periodo antes del set", periodoAnteriorFechas.descripcion);
      // Guardar la descripción del período para mostrar en la UI
      setPeriodoAnteriorDescripcion(periodoAnteriorFechas.descripcion);
      handleCompactChartLoad();
      console.log("Periodo despues del set", periodoAnteriorFechas.descripcion);

      // 🔄 NUEVO: Almacenar TODOS los datos para poder cambiar entre modos
      // Guardamos tanto las categorías iniciales como las finales
      setDatosCompletoActuales(datosActuales); // { categoriasIniciales: [...], categoriasFinales: [...] }
      setDatosCompletoAnteriores(datosAnteriores); // { categoriasIniciales: [...], categoriasFinales: [...] }

      // Crear lista unificada de todas las categorías SEGÚN EL MODO ACTUAL
      const todasCategorias = new Map();

      console.log(
        "🔍 CompactConsumptionPieChart: Procesando datos actuales..."
      );

      categoriasParaUsar.forEach((cat, index) => {
        const color = obtenerColor(cat, index);
        console.log(
          `🎨 CompactConsumptionPieChart: Color para ${cat.name}: ${color}`
        );

        todasCategorias.set(cat.name, {
          name: cat.name,
          actual: cat.value,
          anterior: 0,
          color: color, // 🎨 USAR FUNCIÓN CONSISTENTE
        });
      });

      console.log(
        "🔍 CompactConsumptionPieChart: Procesando datos anteriores..."
      );

      categoriasAnterioresParaUsar.forEach((cat, index) => {
        if (todasCategorias.has(cat.name)) {
          todasCategorias.get(cat.name).anterior = cat.value;
        } else {
          const color = obtenerColorInteligente(cat, index);

          console.log(
            `🎨 CompactConsumptionPieChart: Color para ${cat.name} (solo anterior): ${color}`
          );

          todasCategorias.set(cat.name, {
            name: cat.name,
            actual: 0,
            anterior: cat.value,
            color: color, // 🎨 USAR FUNCIÓN CONSISTENTE
          });
        }
      });

      const categoriasUnificadas = Array.from(todasCategorias.values()).sort(
        (a, b) => b.actual + b.anterior - (a.actual + a.anterior)
      );

      console.log(
        "🔍 CompactConsumptionPieChart: Categorías unificadas:",
        categoriasUnificadas
      );

      // 🔄 ACTUALIZADO: Ahora guardamos las categorías según el modo actual
      // ✅ CORRECTO: Guardar los datos completos procesados
      setDatosCompletoActuales(datosActuales); // datosActuales ya tiene { categoriasIniciales: [...], categoriasFinales: [...] }
      setDatosCompletoAnteriores(datosAnteriores); // datosAnteriores también
      setCategorias(categoriasUnificadas);
      initialLoadDone.current = true;

      console.log(
        "✅ CompactConsumptionPieChart: Comparación cargada exitosamente"
      );
    } catch (error) {
      console.error(
        "❌ CompactConsumptionPieChart: Error al cargar datos de comparación:",
        error
      );
      if (isMounted.current) {
        setError(
          error.message || "Error al cargar datos del gráfico de comparación"
        );
        setDatosCompletoActuales([]);
        setDatosCompletoAnteriores([]);
        setCategorias([]);

        // 🔄 NUEVO: Limpiar también los datos completos en caso de error
        setDatosCompletoActuales({
          categoriasIniciales: [],
          categoriasFinales: [],
        });
        setDatosCompletoAnteriores({
          categoriasIniciales: [],
          categoriasFinales: [],
        });
      }
    } finally {
      if (isMounted.current) {
        console.log(
          "🔍 CompactConsumptionPieChart: Estableciendo loading=false"
        );
        setLoading(false);
      }
    }
  };

  // 🔧 MODIFICAR el useEffect principal:
  useEffect(() => {
    const shouldLoad = filtersChanged();

    if (shouldLoad) {
      if (waitForColors) {
        // 🔑 ESPERAR COORDINACIÓN: Solo cargar si el gráfico principal terminó
        if (compactChartCanLoad) {
          console.log(
            "🚀 CompactChart: Gráfico principal listo, iniciando carga"
          );
          cargarDatos();
        } else {
          console.log("⏳ CompactChart: Esperando al gráfico principal...");
        }
      } else {
        // Carga tradicional
        cargarDatos();
      }
    }
  }, [
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
    compactChartCanLoad, // 🆕 NUEVA DEPENDENCIA
    waitForColors,
  ]);

  // 🆕 NUEVO: useEffect adicional para reaccionar cuando se habilite la carga
  useEffect(() => {
    if (
      waitForColors &&
      compactChartCanLoad &&
      categorias.length === 0 &&
      !loading
    ) {
      console.log("🔄 CompactChart: Habilitado para cargar, iniciando...");
      cargarDatos();
    }
  }, [compactChartCanLoad, waitForColors]);

  // ✅ AÑADIR ESTE useEffect NUEVO (después del anterior):
  useEffect(() => {
    // Re-procesar datos cuando los colores del contexto estén disponibles
    if (waitForColors && hasValidColorMapping && categorias.length > 0) {
      console.log(
        "🎨 CompactChart: Colores disponibles, re-procesando datos..."
      );

      // Re-procesar categorías con nuevos colores
      const categoriasConNuevosColores = categorias.map((cat, index) => ({
        ...cat,
        color: obtenerColorInteligente(cat, index),
      }));

      const igual = categorias.every(
        (c, i) => c.color === categoriasConNuevosColores[i].color
      );

      if (!igual) {
        setCategorias(categoriasConNuevosColores);
      }
    }
  }, [
    waitForColors,
    hasValidColorMapping,
    obtenerColorInteligente,
    categorias,
  ]);

  // 🔧 SOLUCIÓN: Corrigiendo el useEffect que maneja el cambio de modo

  // REEMPLAZA este useEffect (líneas ~1005-1035):
  useEffect(() => {
    console.log(`🔄 Modo de visualización cambió a: ${modoVisualizacion}`);

    // 🛡️ VERIFICACIÓN DEFENSIVA CORREGIDA:
    // El problema era que estabas verificando si los objetos tenían las propiedades
    // pero no verificabas si los objetos en sí existían primero

    console.log("🔍 Estado completo de los datos:", {
      datosCompletoActuales,
      datosCompletoAnteriores,
      tieneActuales: !!datosCompletoActuales,
      tieneAnteriores: !!datosCompletoAnteriores,
    });

    // VERIFICACIÓN PASO A PASO para debugging
    if (!datosCompletoActuales) {
      console.log("⚠️ datosCompletoActuales es null/undefined");
      return;
    }

    if (!datosCompletoAnteriores) {
      console.log("⚠️ datosCompletoAnteriores es null/undefined");
      return;
    }

    // Ahora sí verificar las propiedades internas
    const actualesIniciales =
      datosCompletoActuales.categoriasIniciales?.length || 0;
    const actualesFinales =
      datosCompletoActuales.categoriasFinales?.length || 0;
    const anterioresIniciales =
      datosCompletoAnteriores.categoriasIniciales?.length || 0;
    const anterioresFinales =
      datosCompletoAnteriores.categoriasFinales?.length || 0;

    console.log("📊 Estado de los datos completos DETALLADO:", {
      iniciales: actualesIniciales,
      finales: actualesFinales,
      anterioresIniciales: anterioresIniciales,
      anterioresFinales: anterioresFinales,
      // 🆕 DEBUGGING ADICIONAL
      estructuraActuales: Object.keys(datosCompletoActuales),
      estructuraAnteriores: Object.keys(datosCompletoAnteriores),
      modoActual: modoVisualizacion,
    });

    // Verificar que tenemos datos relevantes para el modo actual
    const tieneDatosParaModo =
      modoVisualizacion === "finales"
        ? actualesFinales > 0 || anterioresFinales > 0
        : actualesIniciales > 0 || anterioresIniciales > 0;

    if (tieneDatosParaModo) {
      console.log(
        "📊 Datos disponibles para el modo actual, actualizando categorías..."
      );
      actualizarCategoriasSegunModo(modoVisualizacion);
    } else {
      console.log(`⚠️ No hay datos para el modo ${modoVisualizacion}`);
      console.log("🔍 Detalle de disponibilidad:", {
        modoSolicitado: modoVisualizacion,
        datosParaFinales: {
          actuales: actualesFinales,
          anteriores: anterioresFinales,
        },
        datosParaIniciales: {
          actuales: actualesIniciales,
          anteriores: anterioresIniciales,
        },
      });
    }
  }, [modoVisualizacion, datosCompletoActuales, datosCompletoAnteriores]);

  // 🔍 LOG ADICIONAL PARA VER EL ESTADO ACTUAL
  useEffect(() => {
    console.log(
      "🔍 CompactConsumptionPieChart: Estado actual del componente:",
      {
        loading,
        error,
        categoriasLength: categorias.length,
        periodoActualLength: periodoActual.length,
        periodoAnteriorLength: periodoAnterior.length,
        periodoAnteriorDescripcion,
      }
    );
  }, [
    loading,
    error,
    categorias,
    periodoActual,
    periodoAnterior,
    periodoAnteriorDescripcion,
  ]);

  const HeaderGerencia = () => {
    const esIniciales = modoVisualizacion === "iniciales";
    const categoriasActuales = esIniciales
      ? datosCompletoActuales?.categoriasIniciales?.length || 0
      : datosCompletoActuales?.categoriasFinales?.length || 0;

    return (
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiPieChart className="text-orange-600 mr-2" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
              <p className="text-sm text-gray-600">
                {esIniciales
                  ? "Vista: TODO (sin filtros)"
                  : "Vista: OPERACIONAL (filtradas)"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {esIniciales
                  ? "Mostrando todas las categorías"
                  : "Mostrando categorías operacionales"}
              </p>
              <p className="text-xs font-medium text-gray-700">
                Datos: {categoriasActuales} categorías
              </p>
            </div>

            <button
              onClick={alternarModoVisualizacion}
              disabled={loading}
              className={`
    relative grid grid-cols-2 h-9 w-44 rounded-full border border-black
    transition-colors duration-300 text-xs font-medium overflow-hidden
    ${loading ? "opacity-50 cursor-not-allowed" : ""}
  `}
            >
              {/* Fondo deslizante */}
              <span
                className={`
      absolute inset-y-0 w-1/2 rounded-full bg-gray-100 shadow-md transition-transform duration-300
      ${esIniciales ? "translate-x-0" : "translate-x-full"}
    `}
              />

              {/* Texto Todas */}
              <span
                className={`
      flex items-center justify-center z-10 transition-colors duration-300
      ${esIniciales ? "text-blue-600 font-semibold" : "text-white"}
    `}
              >
                Todas
              </span>

              {/* Texto Operacional */}
              <span
                className={`
      flex items-center justify-center z-10 transition-colors duration-300
      ${!esIniciales ? "text-orange-600 font-semibold" : "text-white"}
    `}
              >
                Operacional
              </span>
            </button>
          </div>
        </div>

        {/* 🔄 INFORMACIÓN ADICIONAL DEL MODO */}
        <div
          className={`
        text-xs p-2 rounded-lg border-l-4 
        ${
          esIniciales
            ? "bg-blue-50 border-blue-400 text-blue-800"
            : "bg-orange-50 border-orange-400 text-orange-800"
        }
      `}
        >
          <div className="flex items-start space-x-2">
            <FiInfo className="mt-0.5 flex-shrink-0" />
            <div>
              {esIniciales ? (
                <div>
                  <p className="font-medium">
                    Modo: TODO (Categorías Iniciales)
                  </p>
                  <p>
                    Muestra todas las categorías sin aplicar filtros,
                    exclusiones o agrupaciones.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    Modo: OPERACIONAL (Categorías Finales)
                  </p>
                  <p>
                    Categorías filtradas: excluye microbuses, agrupa camionetas
                    y aplica factor de 30%.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Función para renderizar etiquetas personalizadas COMPACTAS (para dual pie charts)
  const renderCustomLabel = (props, isActual = true) => {
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

    // Solo mostrar si es mayor al 3% para evitar saturación en espacio compacto
    if (percent < 0.03) return null;

    const RADIAN = Math.PI / 180;
    const normalizedAngle = ((((midAngle * 180) / Math.PI) % 360) + 360) % 360;

    // Distancia más corta para gráficos compactos - REDUCIDA AÚN MÁS
    let labelDistance;
    if (percent > 0.4) {
      labelDistance = outerRadius + 20; // REDUCIDO de 35 a 20
    } else if (percent > 0.15) {
      labelDistance = outerRadius + 18; // REDUCIDO de 30 a 18
    } else {
      labelDistance = outerRadius + 15; // REDUCIDO de 25 a 15
    }

    const baseX = cx + labelDistance * Math.cos(-midAngle * RADIAN);
    const baseY = cy + labelDistance * Math.sin(-midAngle * RADIAN);

    let finalX = baseX;
    let finalY = baseY;

    // Ajustar posición para evitar traslapes en la zona inferior
    const isBottomRegion = normalizedAngle > 180 && normalizedAngle < 360;
    if (isBottomRegion && percent < 0.2) {
      finalY = finalY + (index % 2) * 12; // Escalonar ligeramente
    }

    const isLeftSide = finalX < cx;
    const value = isActual ? payload.actual : payload.anterior;

    // Nombre de categoría con truncado inteligente
    const itemName = payload?.nombre || payload?.name || "Sin nombre";
    let displayName;
    const maxLength = percent > 0.3 ? 16 : percent > 0.15 ? 14 : 12;

    if (itemName.length > maxLength) {
      // Buscar espacio para cortar palabra completa
      const spaceIndex = itemName.substring(0, maxLength - 1).lastIndexOf(" ");
      if (spaceIndex > maxLength - 5) {
        displayName = itemName.substring(0, spaceIndex);
      } else {
        displayName = itemName.substring(0, maxLength - 1) + "...";
      }
    } else {
      displayName = itemName;
    }

    // Línea de conexión desde el borde del segmento
    const startX = cx + (outerRadius - 1) * Math.cos(-midAngle * RADIAN);
    const startY = cy + (outerRadius - 1) * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        {/* Línea de conexión */}
        <path
          d={`M ${startX} ${startY} L ${finalX} ${finalY}`}
          stroke="#9ca3af"
          strokeWidth={percent > 0.2 ? 1.5 : 1}
          strokeOpacity={0.7}
          fill="none"
        />

        {/* Punto de conexión */}
        <circle
          cx={finalX}
          cy={finalY}
          r={percent > 0.2 ? 2.5 : 2}
          fill="#9ca3af"
          opacity={0.8}
        />

        {/* Nombre de la categoría */}
        <text
          x={finalX + (isLeftSide ? -8 : 8)}
          y={finalY - 6}
          textAnchor={isLeftSide ? "end" : "start"}
          dominantBaseline="central"
          fill="#374151"
          fontSize={percent > 0.3 ? "11" : percent > 0.15 ? "10" : "9"}
          fontWeight="600"
          className="drop-shadow-sm"
        >
          {displayName}
        </text>

        {/* Valor en litros Y porcentaje en la MISMA línea */}
        <text
          x={finalX + (isLeftSide ? -8 : 8)}
          y={finalY + 6}
          textAnchor={isLeftSide ? "end" : "start"}
          dominantBaseline="central"
          fill="#6b7280"
          fontSize={percent > 0.3 ? "10" : percent > 0.15 ? "9" : "8"}
          fontWeight="600"
        >
          {value >= 1000
            ? `${(value / 1000).toFixed(1)}k L • ${(percent * 100).toFixed(1)}%`
            : `${Math.round(value)} L • ${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100">
        <HeaderGerencia />
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            {/* 🎨 LOADING MEJORADO CON ESTADO DE SINCRONIZACIÓN */}
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>

              {/* ✅ INDICADOR DE SINCRONIZACIÓN MEJORADO */}
              {allowParallelLoad && (
                <div className="absolute -top-1 -right-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-500 ${
                      waitForColors && hasValidColorMapping
                        ? "bg-green-500 scale-110"
                        : "bg-yellow-500 animate-pulse"
                    }`}
                  >
                    {waitForColors && hasValidColorMapping && (
                      <div className="w-full h-full rounded-full bg-white animate-ping"></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-base font-semibold text-gray-700 mb-2">
              {allowParallelLoad
                ? "Carga Paralela Activa"
                : "Cargando Análisis Comparativo"}
            </h3>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {allowParallelLoad && waitForColors && hasValidColorMapping
                  ? "🎨 Colores sincronizados - Procesando datos..."
                  : allowParallelLoad
                  ? "⏳ Esperando sincronización de colores..."
                  : "Consultando datos del mes anterior"}
              </p>

              {/* 📊 Barra de progreso visual */}
              {allowParallelLoad && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      waitForColors && hasValidColorMapping
                        ? "bg-gradient-to-r from-green-400 to-blue-500 w-full"
                        : "bg-gradient-to-r from-yellow-400 to-orange-500 w-3/4 animate-pulse"
                    }`}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log(
      "🔍 CompactConsumptionPieChart: Mostrando estado de error:",
      error
    );
    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100">
        <HeaderGerencia />
        <div className="h-96 flex flex-col items-center justify-center text-center bg-red-50 rounded-lg border border-red-200 m-4">
          <FiAlertTriangle size={40} className="text-red-500 mb-4" />
          <div className="text-red-700 mb-4">{error}</div>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Reintentar Análisis
          </button>
        </div>
      </div>
    );
  }

  if (categorias.length === 0) {
    console.log("🔍 CompactConsumptionPieChart: Mostrando estado sin datos");
    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100">
        <HeaderGerencia />
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 m-4">
          <div className="text-center">
            <FiActivity size={40} className="text-gray-400 mb-4 mx-auto" />
            <p className="text-gray-500 mb-2">
              No hay datos para el análisis comparativo
            </p>
            <p className="text-sm text-gray-400">
              Verifique que existan registros tanto para el período actual como
              el anterior
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log(
    "🔍 CompactConsumptionPieChart: Renderizando componente completo con datos:",
    {
      categoriasLength: categorias.length,
      loading,
      error,
    }
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100">
      <HeaderGerencia />

      <div className="p-4">
        {/* Resumen ejecutivo para la gerencia */}
        {categorias.length > 0 &&
          (() => {
            const totalActual = categorias.reduce(
              (sum, cat) => sum + cat.actual,
              0
            );
            const totalAnterior = categorias.reduce(
              (sum, cat) => sum + cat.anterior,
              0
            );
            const cambioTotal = totalActual - totalAnterior;
            const porcentajeCambioTotal =
              totalAnterior > 0 ? (cambioTotal / totalAnterior) * 100 : 0;

            return (
              <div
                className={`mb-4 p-3 rounded-lg border ${
                  cambioTotal < 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {/* Iconos invertidos con colores: Flecha hacia abajo = bueno (verde), hacia arriba = malo (rojo) */}
                  {cambioTotal < 0 ? (
                    <FiTrendingDown className="text-green-700" />
                  ) : (
                    <FiTrendingUp className="text-red-700" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      cambioTotal < 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {/* Mensaje invertido: Mostrar reducción como positivo */}
                    {cambioTotal < 0 ? "Reducción de " : "Aumento de "}
                    {Math.abs(cambioTotal).toLocaleString("es-CL")} L (
                    {Math.abs(porcentajeCambioTotal).toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })()}

        {/* Gráficos lado a lado con leyenda en el centro */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          {/* Período Anterior */}
          <div className="col-span-2 text-center">
            <div className="h-80">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                📈 Período Anterior
              </h4>
              <p className="text-xs text-gray-500">
                {periodoAnteriorDescripcion}
              </p>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                  <Pie
                    data={categorias.filter((cat) => cat.anterior > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="anterior"
                    label={(props) => renderCustomLabel(props, false)}
                    labelLine={false}
                  >
                    {categorias
                      .filter((cat) => cat.anterior > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-anterior-${index}`}
                          fill={entry.color} // 🎨 USAR COLOR CONSISTENTE DEL PADRE
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    offset={35} // 👈 Mueve el tooltip 50px a la derecha
                    position={{ x: undefined, y: undefined }}
                  />
                  {/* Texto central con cálculo directo */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fontWeight="800"
                    fill="#374151"
                  >
                    {categorias
                      .reduce((sum, cat) => sum + cat.anterior, 0)
                      .toLocaleString("es-CL")}{" "}
                    L
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leyenda en el centro con valores de ambos períodos */}
          <div className="col-span-1 flex items-center">
            <div className="w-full">
              <div className="max-h-90 overflow-y-auto bg-white rounded-lg">
                <div className="space-y-2">
                  {categorias.map((categoria, index) => {
                    const diferencia = categoria.actual - categoria.anterior;
                    const porcentajeCambio =
                      categoria.anterior > 0
                        ? (diferencia / categoria.anterior) * 100
                        : categoria.actual > 0
                        ? 100
                        : 0;

                    const tieneCambio = Math.abs(porcentajeCambio) >= 5;
                    const esMejor = diferencia < 0; // Menos consumo es mejor

                    return (
                      <div
                        key={categoria.name}
                        className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm"
                      >
                        {/* Nombre de categoría con color */}
                        <div className="flex items-center mb-1">
                          <div
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: categoria.color }} // 🎨 USAR COLOR CONSISTENTE
                          ></div>
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {categoria.name}
                          </span>
                        </div>

                        {/* Valores actuales y anteriores */}
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div>
                            Actual: {categoria.actual.toLocaleString("es-CL")} L
                          </div>
                          <div>
                            Anterior:{" "}
                            {categoria.anterior.toLocaleString("es-CL")} L
                          </div>
                        </div>

                        {/* Indicador de cambio */}
                        {tieneCambio && (
                          <div
                            className={`flex items-center justify-between pt-1 border-t border-gray-200 mt-1 text-xs ${
                              esMejor ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <span>Cambio:</span>
                            <div className="flex items-center">
                              {esMejor ? (
                                <FiTrendingDown size={10} className="mr-1" />
                              ) : (
                                <FiTrendingUp size={10} className="mr-1" />
                              )}
                              <span>
                                {Math.abs(porcentajeCambio).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Período Actual */}
          <div className="col-span-2 text-center">
            <div className="h-80">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                📊 Período Actual
              </h4>

              <p className="text-xs text-gray-500">
                {formatearPeriodo(fechaDesde, fechaHasta)}
              </p>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                  <Pie
                    data={categorias.filter((cat) => cat.actual > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="actual"
                    label={(props) => renderCustomLabel(props, true)}
                    labelLine={false}
                  >
                    {categorias
                      .filter((cat) => cat.actual > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-actual-${index}`}
                          fill={entry.color} // 🎨 USAR COLOR CONSISTENTE DEL PADRE
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  {/* Texto central con cálculo directo */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fontWeight="800"
                    fill="#374151"
                  >
                    {categorias
                      .reduce((sum, cat) => sum + cat.actual, 0)
                      .toLocaleString("es-CL")}{" "}
                    L
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>
              Comparando {categorias.filter((c) => c.actual > 0).length}{" "}
              categorías activas
            </span>
            <span>Actualizado: {new Date().toLocaleTimeString("es-CL")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactConsumptionPieChart;
