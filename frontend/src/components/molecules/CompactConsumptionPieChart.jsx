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
  allowParallelLoad = false,
  waitForColors = false,
}) => {
  // ✅ USAR EL HOOK CORRECTO:
  const {
    getColorForCategory,
    categoryColorMapping,
    hasValidColorMapping,
    isInitialized,
  } = useChartColors();

  // Estados principales
  const [periodoActual, setPeriodoActual] = useState([]);
  const [periodoAnterior, setPeriodoAnterior] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodoAnteriorDescripcion, setPeriodoAnteriorDescripcion] =
    useState("");

  // Ref para verificar si el componente está montado
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

  // Función para calcular período anterior
  const calcularPeriodoAnterior = () => {
    const inicioActual = new Date(fechaDesde);
    const finActual = new Date(fechaHasta);

    // Restar exactamente un mes a ambas fechas
    const inicioAnterior = new Date(inicioActual);
    const finAnterior = new Date(finActual);

    inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);
    finAnterior.setMonth(finAnterior.getMonth() - 1);

    // Manejar casos especiales de días que no existen en el mes anterior
    const ultimoDiaMesAnteriorInicio = new Date(
      inicioAnterior.getFullYear(),
      inicioAnterior.getMonth() + 1,
      0
    ).getDate();
    const ultimoDiaMesAnteriorFin = new Date(
      finAnterior.getFullYear(),
      finAnterior.getMonth() + 1,
      0
    ).getDate();

    const diaOriginalInicio = new Date(fechaDesde).getDate();
    const diaOriginalFin = new Date(fechaHasta).getDate();

    // Ajustar fecha de inicio si es necesario
    if (diaOriginalInicio > ultimoDiaMesAnteriorInicio) {
      inicioAnterior.setDate(ultimoDiaMesAnteriorInicio);
      console.log(
        `⚠️ Ajustando fecha inicio: día ${diaOriginalInicio} no existe en ${
          inicioAnterior.getMonth() + 1
        }/${inicioAnterior.getFullYear()}, usando día ${ultimoDiaMesAnteriorInicio}`
      );
    }

    // Ajustar fecha de fin si es necesario
    if (diaOriginalFin > ultimoDiaMesAnteriorFin) {
      finAnterior.setDate(ultimoDiaMesAnteriorFin);
      console.log(
        `⚠️ Ajustando fecha fin: día ${diaOriginalFin} no existe en ${
          finAnterior.getMonth() + 1
        }/${finAnterior.getFullYear()}, usando día ${ultimoDiaMesAnteriorFin}`
      );
    }

    // Logging para verificar el cálculo
    console.log("📅 Cálculo de período anterior:", {
      actual: {
        inicio: fechaDesde,
        fin: fechaHasta,
        descripcion: `${inicioActual.toLocaleDateString(
          "es-ES"
        )} al ${finActual.toLocaleDateString("es-ES")}`,
      },
      anterior: {
        inicio: inicioAnterior.toISOString().split("T")[0],
        fin: finAnterior.toISOString().split("T")[0],
        descripcion: `${inicioAnterior.toLocaleDateString(
          "es-ES"
        )} al ${finAnterior.toLocaleDateString("es-ES")}`,
      },
    });

    return {
      fechaDesde: inicioAnterior.toISOString().split("T")[0],
      fechaHasta: finAnterior.toISOString().split("T")[0],
      tipo: "mes_anterior_fijo",
      descripcion: obtenerDescripcionPeriodoAnterior(
        inicioAnterior,
        finAnterior
      ),
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

  // Función para generar descripción legible del período anterior
  const obtenerDescripcionPeriodoAnterior = (inicio, fin) => {
    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const mesInicio = meses[inicio.getMonth()];
    const mesFin = meses[fin.getMonth()];
    const año = inicio.getFullYear();

    // Si es el mismo mes
    if (inicio.getMonth() === fin.getMonth()) {
      return `${inicio.getDate()}-${fin.getDate()} ${mesInicio} ${año}`;
    } else {
      // Si abarca dos meses
      return `${inicio.getDate()} ${mesInicio} - ${fin.getDate()} ${mesFin} ${año}`;
    }
  };

  const procesarDatosBackend = (data) => {
    if (!data || !data.success || !data.categorias) {
      return [];
    }

    // Paso 1: Procesar datos iniciales
    let categoriasIniciales = data.categorias
      .map((item, index) => ({
        id: item.id || index,
        name: item.name || item.nombre || "Sin categoría",
        nombre: item.name || item.nombre || "Sin categoría",
        value: Math.round((item.value || 0) * 100) / 100,
        maquinas_count: item.maquinas_count || 0,
        originalData: item,
      }))
      .filter((item) => item.value > 0);

    console.log("📊 Datos iniciales antes de procesar:", categoriasIniciales);

    // Paso 2: Excluir categorías no deseadas
    const categoriasExcluidas = ["Microbus", "Microbús", "MICROBUS"];

    const categoriasFiltradas = categoriasIniciales.filter((categoria) => {
      const nombreLimpio = categoria.name.trim();
      const esExcluida = categoriasExcluidas.some((excluida) =>
        nombreLimpio.toLowerCase().includes(excluida.toLowerCase())
      );

      if (esExcluida) {
        console.log(
          `🚫 Excluyendo categoría: ${categoria.name} (${categoria.value} L)`
        );
      }

      return !esExcluida;
    });

    // Paso 3: Agrupar camionetas
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

      // Detectar variaciones de "camionetas"
      const esCamioneta =
        nombreLimpio.includes("camioneta") ||
        nombreLimpio.includes("camionetas") ||
        nombreLimpio === "camioneta";

      if (esCamioneta) {
        console.log(
          `🚚 Agrupando en Camionetas: ${categoria.name} (${categoria.value} L)`
        );

        // Sumar valores
        camionetasAgrupadas.value += categoria.value;
        camionetasAgrupadas.maquinas_count += categoria.maquinas_count;
        camionetasAgrupadas.categorias_originales.push(categoria.name);
      } else {
        // Mantener categoría original
        categoriasAgrupadas.push(categoria);
      }
    });

    // Paso 4: Aplicar factor de 0.3% a camionetas si existen
    if (camionetasAgrupadas.value > 0) {
      const valorOriginal = camionetasAgrupadas.value;
      camionetasAgrupadas.value = camionetasAgrupadas.value * 0.3; // 30% = 0.3

      console.log(
        `🔢 Aplicando factor 0.3% a Camionetas: ${valorOriginal.toLocaleString()} L → ${camionetasAgrupadas.value.toLocaleString()} L`
      );
      console.log(
        `📋 Categorías agrupadas en Camionetas: ${camionetasAgrupadas.categorias_originales.join(
          ", "
        )}`
      );

      // Redondear el resultado
      camionetasAgrupadas.value =
        Math.round(camionetasAgrupadas.value * 100) / 100;

      // Agregar a las categorías finales
      categoriasAgrupadas.push(camionetasAgrupadas);
    }

    // Paso 5: Filtrar valores finales y ordenar
    const categoriesFinales = categoriasAgrupadas
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    console.log("✅ Datos finales procesados:", {
      excluidas: categoriasIniciales.length - categoriasFiltradas.length,
      camionetasAgrupadas: camionetasAgrupadas.value > 0 ? 1 : 0,
      total_final: categoriesFinales.length,
      categorias_finales: categoriesFinales.map((c) => ({
        nombre: c.name,
        valor: c.value,
      })),
    });

    return categoriesFinales;
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

  const obtenerColorInteligente = useCallback(
    (item, index) => {
      // ✅ MEJORADO: Siempre intentar obtener del contexto primero
      if (getColorForCategory) {
        const colorDelContexto = getColorForCategory(item.name || item.nombre);
        if (colorDelContexto) {
          console.log(
            `🎨 Color del contexto para "${item.name}": ${colorDelContexto}`
          );
          return colorDelContexto;
        }
      }

      // ✅ FALLBACK: Si no hay color del contexto, usar array local
      const fallbackColor = chartColors[index % chartColors.length];
      console.log(`🎨 Color fallback para "${item.name}": ${fallbackColor}`);
      return fallbackColor;
    },
    [getColorForCategory, chartColors]
  );

  // Función principal actualizada con validaciones
  const cargarDatos = async () => {
    console.log("🔍 CompactConsumptionPieChart: cargarDatos() iniciando...");

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

      console.log("🔍 CompactConsumptionPieChart: Datos cargados exitosamente");

      if (!isMounted.current) {
        console.log(
          "🔍 CompactConsumptionPieChart: Componente desmontado durante la carga, abortando"
        );
        return;
      }

      // Logging de resultados
      console.log("📈 Datos cargados:", {
        actual: {
          categorias: datosActuales.length,
          total: datosActuales.reduce((sum, cat) => sum + cat.value, 0),
          datos: datosActuales,
        },
        anterior: {
          categorias: datosAnteriores.length,
          total: datosAnteriores.reduce((sum, cat) => sum + cat.value, 0),
          datos: datosAnteriores,
        },
      });

      // Guardar la descripción del período para mostrar en la UI
      setPeriodoAnteriorDescripcion(periodoAnteriorFechas.descripcion);

      // Crear lista unificada de todas las categorías
      const todasCategorias = new Map();

      console.log(
        "🔍 CompactConsumptionPieChart: Procesando datos actuales..."
      );
      datosActuales.forEach((cat, index) => {
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
      datosAnteriores.forEach((cat, index) => {
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

      setPeriodoActual(datosActuales);
      setPeriodoAnterior(datosAnteriores);
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
        setPeriodoActual([]);
        setPeriodoAnterior([]);
        setCategorias([]);
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

  // ✅ NUEVA LÓGICA CON SINCRONIZACIÓN INTELIGENTE:
  useEffect(() => {
    const shouldLoad = filtersChanged();

    if (shouldLoad) {
      if (allowParallelLoad) {
        // 🚀 CARGA PARALELA: Empezar inmediatamente
        cargarDatos();
      } else {
        // 🔄 CARGA TRADICIONAL: Esperar colores
        if (waitForColors && hasValidColorMapping) {
          cargarDatos();
        } else if (!waitForColors) {
          cargarDatos();
        }
      }
    }
  }, [
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
    allowParallelLoad,
    waitForColors,
    hasValidColorMapping,
  ]);

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

      setCategorias(categoriasConNuevosColores);
    }
  }, [waitForColors, hasValidColorMapping, obtenerColorInteligente]);

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

  // Header mejorado para la gerencia
  const HeaderGerencia = () => {
    return (
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <FiPieChart className="text-orange-600 mr-2" />
            {titulo}
          </h3>
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
                {new Date(fechaDesde).toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(fechaHasta).toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                })}
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
