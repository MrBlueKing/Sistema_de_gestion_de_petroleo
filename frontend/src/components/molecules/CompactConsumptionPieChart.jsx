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
  allowParallelLoad = true,
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
    compactChartCanLoad = true,
    handleCompactChartLoad = () => {},
    getColorForCategory: contextGetColor = null,
    hasValidColorMapping = false,
    isInitialized = false, // ✅ INCLUIDO Y CON VALOR POR DEFECTO
    categoryColorMapping = {},
    
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


 
// 🚨 SOLUCIÓN INMEDIATA: Reemplaza la función obtenerDatosCompletos en tu CompactConsumptionPieChart.jsx

const obtenerDatosCompletos = async () => {
  const requestBody = {
    fecha_inicio: fechaDesde,
    fecha_fin: fechaHasta,
    modo: "categorias",
    incluir_redistribucion: true,
    tipo_chart: "compact",
  };

  if (faenaSeleccionada && faenaSeleccionada !== "todas") {
    requestBody.id_faena = faenaSeleccionada;
  }

  console.log("📊 [CRÍTICO] Request enviado:", requestBody);

  const response = await axios.post(
    "/api/categorias-chart/categorias",
    requestBody
  );

  console.log("🔍 [CRÍTICO] Response COMPLETA:", response.data);

  // 🚨 PUNTO CRÍTICO: Verificar estructura exacta de la respuesta
  if (response.data && response.data.success) {
    console.log("✅ [CRÍTICO] Response es success, analizando data...");
    
    const data = response.data.data;
    console.log("🔍 [CRÍTICO] response.data.data:", data);

    if (!data) {
      console.error("❌ [CRÍTICO] response.data.data es undefined/null");
      throw new Error("No hay data en la respuesta");
    }

    // 🔍 ANÁLISIS DETALLADO DE LO QUE RECIBIMOS
    console.log("🔍 [CRÍTICO] Claves en data:", Object.keys(data));
    console.log("🔍 [CRÍTICO] categoriasIniciales:", data.categoriasIniciales);
    console.log("🔍 [CRÍTICO] categoriasFinales:", data.categoriasFinales);

    // 🚨 VERIFICACIÓN CRÍTICA: ¿Son arrays?
    const categoriasIniciales = Array.isArray(data.categoriasIniciales) ? data.categoriasIniciales : [];
    const categoriasFinales = Array.isArray(data.categoriasFinales) ? data.categoriasFinales : [];
    
    console.log("✅ [CRÍTICO] Arrays verificados:", {
      inicialesLength: categoriasIniciales.length,
      finalesLength: categoriasFinales.length,
      primeraInicial: categoriasIniciales[0],
      primeraFinal: categoriasFinales[0]
    });

    // 🔍 SI NO HAY DATOS, MOSTRAR INFORMACIÓN DETALLADA
    if (categoriasIniciales.length === 0 && categoriasFinales.length === 0) {
      console.error("❌ [CRÍTICO] NO HAY CATEGORÍAS EN LA RESPUESTA");
      console.error("🔍 Estructura completa de data:", data);
      console.error("🔍 Tal vez las categorías están en otra ubicación?");
      
      // Buscar categorías en otros lugares de la respuesta
      if (response.data.categorias) {
        console.log("🔍 [ALTERNATIVO] Encontré data.categorias:", response.data.categorias);
      }
      if (data.categorias) {
        console.log("🔍 [ALTERNATIVO] Encontré data.data.categorias:", data.categorias);
      }
    }

    // 🔍 ANÁLISIS DEL PERÍODO ANTERIOR
    let periodoAnterior = {
      categoriasIniciales: [],
      categoriasFinales: [],
      descripcion: "Mes anterior"
    };

    if (data.periodoAnterior) {
      console.log("🔍 [CRÍTICO] Período anterior encontrado:", data.periodoAnterior);
      periodoAnterior = {
        categoriasIniciales: Array.isArray(data.periodoAnterior.categoriasIniciales) 
          ? data.periodoAnterior.categoriasIniciales : [],
        categoriasFinales: Array.isArray(data.periodoAnterior.categoriasFinales) 
          ? data.periodoAnterior.categoriasFinales : [],
        descripcion: data.periodoAnterior.descripcion || "Mes anterior"
      };
    } else {
      console.warn("⚠️ [CRÍTICO] No hay período anterior en la respuesta");
    }

    const resultado = {
      categoriasIniciales: categoriasIniciales,
      categoriasFinales: categoriasFinales,
      periodoAnterior: periodoAnterior,
      descripcionPeriodoAnterior: periodoAnterior.descripcion,
    };

    console.log("🎯 [CRÍTICO] RESULTADO FINAL que se retorna:", {
      categoriasInicialesCount: resultado.categoriasIniciales.length,
      categoriasFinalesCount: resultado.categoriasFinales.length,
      periodoAnteriorInicialesCount: resultado.periodoAnterior.categoriasIniciales.length,
      periodoAnteriorFinalesCount: resultado.periodoAnterior.categoriasFinales.length,
    });

    return resultado;
  }

  console.error("❌ [CRÍTICO] Response no es success:", response.data);
  throw new Error("Respuesta no exitosa del servidor");
};

// 🚨 TAMBIÉN REEMPLAZA la función cargarDatos con debugging mejorado:

const cargarDatos = async () => {
  if (!isMounted.current) return;

  try {
    setLoading(true);
    setError(null);

    console.log("🚀 [CRÍTICO] INICIANDO cargarDatos...");
    console.log("🔍 [CRÍTICO] Parámetros:", {
      fechaDesde,
      fechaHasta,
      faenaSeleccionada,
      modoVisualizacion,
    });

    // 🚀 Obtener datos del backend
    const datosCompletos = await obtenerDatosCompletos();

    console.log("📊 [CRÍTICO] datosCompletos recibidos:", datosCompletos);

    if (!isMounted.current) return;

    // ✅ EXTRAER datos según el modo actual
    const categoriasParaUsar = modoVisualizacion === "finales"
        ? datosCompletos.categoriasFinales
        : datosCompletos.categoriasIniciales;

    const categoriasAnterioresParaUsar = modoVisualizacion === "finales"
        ? datosCompletos.periodoAnterior.categoriasFinales
        : datosCompletos.periodoAnterior.categoriasIniciales;

    console.log("🔍 [CRÍTICO] Categorías extraídas:", {
      modo: modoVisualizacion,
      actuales: categoriasParaUsar.length,
      anteriores: categoriasAnterioresParaUsar.length,
      primeraActual: categoriasParaUsar[0],
      primeraAnterior: categoriasAnterioresParaUsar[0],
    });

    // Crear lista unificada con colores
    const todasCategorias = new Map();

    categoriasParaUsar.forEach((cat, index) => {
      console.log(`🎨 [CRÍTICO] Procesando categoría actual ${index}:`, cat);
      const color = obtenerColor(cat, index);
      todasCategorias.set(cat.name, {
        name: cat.name,
        actual: cat.value,
        anterior: 0,
        color: color,
      });
    });

    categoriasAnterioresParaUsar.forEach((cat, index) => {
      console.log(`🎨 [CRÍTICO] Procesando categoría anterior ${index}:`, cat);
      if (todasCategorias.has(cat.name)) {
        todasCategorias.get(cat.name).anterior = cat.value;
      } else {
        const color = obtenerColorInteligente(cat, index);
        todasCategorias.set(cat.name, {
          name: cat.name,
          actual: 0,
          anterior: cat.value,
          color: color,
        });
      }
    });

    const categoriasUnificadas = Array.from(todasCategorias.values()).sort(
      (a, b) => b.actual + b.anterior - (a.actual + a.anterior)
    );

    console.log("🎯 [CRÍTICO] CATEGORÍAS UNIFICADAS FINALES:", categoriasUnificadas);

    // ✅ GUARDAR TODO procesado
    setDatosCompletoActuales({
      categoriasIniciales: datosCompletos.categoriasIniciales,
      categoriasFinales: datosCompletos.categoriasFinales,
    });

    setDatosCompletoAnteriores({
      categoriasIniciales: datosCompletos.periodoAnterior.categoriasIniciales,
      categoriasFinales: datosCompletos.periodoAnterior.categoriasFinales,
    });

    setCategorias(categoriasUnificadas);
    setPeriodoAnteriorDescripcion(datosCompletos.descripcionPeriodoAnterior);

    console.log("✅ [CRÍTICO] Estados actualizados. categoriasUnificadas.length:", categoriasUnificadas.length);

    handleCompactChartLoad();

  } catch (error) {
    console.error("❌ [CRÍTICO] Error en cargarDatos:", error);
    if (isMounted.current) {
      setError("Error al cargar datos: " + error.message);
      setCategorias([]);
    }
  } finally {
    if (isMounted.current) {
      setLoading(false);
    }
  }
};

// 🚨 DEBUGGING ADICIONAL: Agrega este useEffect para monitorear cambios en categorias
useEffect(() => {
  console.log("🔍 [MONITOR] Estado 'categorias' cambió:", {
    length: categorias.length,
    items: categorias.map(c => ({ name: c.name, actual: c.actual, anterior: c.anterior }))
  });
}, [categorias]);

// 📋 INSTRUCCIONES PARA EL USUARIO:
// 1. Reemplaza las funciones obtenerDatosCompletos y cargarDatos en tu archivo
// 2. Agrega el useEffect de monitoreo
// 3. Ejecuta la aplicación y revisa la consola
// 4. Busca los logs que empiezan con [CRÍTICO] 
// 5. Compárteme esos logs para identificar exactamente dónde se pierden los datos

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

 

  useEffect(() => {
  const shouldLoad = filtersChanged();
  const shouldLoadForTributedData = compactChartCanLoad && !shouldLoad;

  if (shouldLoad || shouldLoadForTributedData) {
    if (waitForColors) {
      if (compactChartCanLoad) {
        console.log("🚀 CompactChart: Iniciando carga");
        cargarDatos();
      }
    } else {
      cargarDatos();
    }
  }
}, [
  faenaSeleccionada,
  fechaDesde,
  fechaHasta,
  refreshKey,
  compactChartCanLoad, // Esta dependencia hace que se ejecute cuando cambia
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

  const formatearFecha = (fecha) => {
    const [year, month, day] = fecha.split("T")[0].split("-");
    return `${day}-${month}-${year}`;
  };

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
                {formatearFecha(fechaDesde)} al {formatearFecha(fechaHasta)}
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
