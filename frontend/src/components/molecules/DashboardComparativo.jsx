import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  Rectangle,
} from "recharts";
import {
  FiPieChart,
  FiLoader,
  FiAlertTriangle,
  FiRefreshCw,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiSettings,
  FiMinus,
} from "react-icons/fi";
import { GiFactory, GiGears, GiTruck } from "react-icons/gi";
import axios from "../../lib/axios";

const DashboardComparativo = ({
  faenaSeleccionada = "todas",
  fechaDesde,
  fechaHasta,
  refreshKey,
}) => {
  // Estados principales para los 4 gráficos
  const [datosTotal, setDatosTotal] = useState({ actual: 0, anterior: 0 });
  const [datosFaenas, setDatosFaenas] = useState([]);
  const [datosCategorias, setDatosCategorias] = useState([]);
  const [datosEquipos, setDatosEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodoAnteriorDescripcion, setPeriodoAnteriorDescripcion] =
    useState("");
  const [periodoAnteriorDescripcionActual, setPeriodoAnteriorDescripcionActual] =
    useState("");

  // NUEVO: Estado para filtrar equipos
  const [mostrarEquiposSinDatos, setMostrarEquiposSinDatos] = useState(false);

  // 🚀 OPTIMIZACIÓN: Control de requests con AbortController
  const abortControllerRef = useRef(null);
  const isMounted = useRef(true);
  const loadingRef = useRef(false); // Prevenir cargas duplicadas
  const lastFiltersRef = useRef({
    faenaSeleccionada: null,
    fechaDesde: null,
    fechaHasta: null,
    refreshKey: null,
  });
  // 🚀 OPTIMIZACIÓN: Cache de datos para evitar re-consultas innecesarias
  const cacheRef = useRef(new Map());
  const isFirstLoad = useRef(true); // 🆕 Para manejar la carga inicial

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

    // 🎨 ====== NUEVA SECCIÓN VISUAL ======
    // Sumar 1 día SOLO para mostrar al usuario
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

    function formatearFecha(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}-${mes}-${anio}`;
}

    // Generar descripción
    
    const descripcion = `${formatearFechaVisual(fechaVisualInicio)} al ${formatearFechaVisual(fechaVisualFin)}`;
    const descripcionActual = `${formatearFecha(fechaDesde)} al ${formatearFecha(fechaHasta)}`;


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
      descripcionActual,
    });

    return {
      fechaDesde: fechaInicioAnterior,
      fechaHasta: fechaFinAnterior,
      descripcion,
      descripcionActual,
      // 🆕 METADATOS ADICIONALES para debugging
      metadatos: {
        ajusteDiaInicio: dayDesde !== dayAnteriorDesde,
        ajusteDiaFin: dayHasta !== dayAnteriorHasta,
        diasOriginales: { inicio: dayDesde, fin: dayHasta },
        diasAjustados: { inicio: dayAnteriorDesde, fin: dayAnteriorHasta },
      },
    };
  };

  const obtenerDatosPeriodo = async (fechaInicio, fechaFin, signal) => {
    const cacheKey = `${fechaInicio}_${fechaFin}_${faenaSeleccionada}`;

    if (cacheRef.current.has(cacheKey)) {
      console.log("📦 Usando datos del cache:", cacheKey);
      return cacheRef.current.get(cacheKey);
    }

    console.log("📊 DashboardComparativo: Consultando período:", {
      fechaInicio,
      fechaFin,
      faenaSeleccionada,
      timestamp: Date.now(),
    });

    const params = {
      desde: fechaInicio,
      hasta: fechaFin,
      faena: faenaSeleccionada,
    };

    try {
      const [totalResponse, faenasResponse, equiposResponse] =
        await Promise.all([
          axios.get("/api/informes-kpi", {
            params: { ...params, tipo: "kpis_consumo" },
            signal,
          }),
          axios.get("/api/informes-kpi", {
            params: { ...params, tipo: "consumo_faenas" },
            signal,
          }),
          axios.get("/api/informes-kpi", {
            params: { ...params, tipo: "consumo_equipos" },
            signal,
          }),
        ]);

      if (signal.aborted) {
        console.log("🚫 Request cancelada");
        return null;
      }

      const totalConsumo = totalResponse.data?.data?.consumo_total_mes || 0;
      const faenas = faenasResponse.data?.data || [];
      const equipos = equiposResponse.data?.data || [];

      const categoriasMap = new Map();
      equipos.forEach((equipo) => {
        const categoria = equipo.categoria || "Sin categoría";
        const consumo = parseFloat(equipo.consumo || 0);
        categoriasMap.set(
          categoria,
          (categoriasMap.get(categoria) || 0) + consumo
        );
      });

      const categoriasArray = Array.from(categoriasMap.entries()).map(
        ([categoria, consumo]) => ({
          categoria,
          litros_consumidos: consumo,
        })
      );

      // ✅ Mantener todos los equipos, incluso si su consumo es 0
      const todosEquipos = equipos.map((equipo) => ({
        nombre_equipo: equipo.nombre || "Sin nombre",
        patente: equipo.patente || "",
        categoria: equipo.categoria || "Sin categoría",
        litros_consumidos: parseFloat(equipo.consumo || 0),
      }));

      // Ordenamiento: primero por consumo descendente, pero los 0 quedan al final
      const topEquipos = todosEquipos.sort((a, b) => {
        if (b.litros_consumidos === 0 && a.litros_consumidos !== 0) return 1;
        if (a.litros_consumidos === 0 && b.litros_consumidos !== 0) return -1;
        return b.litros_consumidos - a.litros_consumidos;
      });

      console.log("📊 DashboardComparativo: Datos procesados:", {
        totalConsumo,
        faenasCount: faenas.length,
        categoriasCount: categoriasArray.length,
        equiposCount: topEquipos.length,
      });

      const resultado = {
        total: totalConsumo,
        faenas: faenas.map((f) => ({
          faena: f.name || f.nombre || "Sin nombre",
          litros_consumidos: parseFloat(f.consumo || 0),
        })),
        categorias: categoriasArray,
        equipos: topEquipos,
      };

      cacheRef.current.set(cacheKey, resultado);

      return resultado;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("🚫 Request abortada por el usuario");
        return null;
      }

      console.error("❌ DashboardComparativo: Error en consulta:", error);
      return { total: 0, faenas: [], categorias: [], equipos: [] };
    }
  };

  useEffect(() => {
    if (!fechaDesde || !fechaHasta) return;

    const currentFilters = {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      refreshKey,
    };
    const lastFilters = lastFiltersRef.current;

    const hasRealChanges =
      currentFilters.faenaSeleccionada !== lastFilters.faenaSeleccionada ||
      currentFilters.fechaDesde !== lastFilters.fechaDesde ||
      currentFilters.fechaHasta !== lastFilters.fechaHasta ||
      currentFilters.refreshKey !== lastFilters.refreshKey ||
      isFirstLoad.current;

    if (!hasRealChanges) return;

    lastFiltersRef.current = currentFilters;
    isFirstLoad.current = false;

    const cargarDatosSeguro = async () => {
      setLoading(true);
      setError(null);
      setDatosTotal({ actual: 0, anterior: 0 });
      setDatosFaenas([]);
      setDatosCategorias([]);
      setDatosEquipos([]);
      setPeriodoAnteriorDescripcion("");

      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        console.log("🔄 Cancelando request anterior");
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      loadingRef.current = true;

      try {
        const periodoAnterior = calcularPeriodoAnterior();
        if (!periodoAnterior) return;

        setPeriodoAnteriorDescripcion(periodoAnterior.descripcion);
        setPeriodoAnteriorDescripcionActual(periodoAnterior.descripcionActual);

        console.log("📊 DashboardComparativo: Períodos calculados:", {
          actual: `${fechaDesde} al ${fechaHasta}`,
          anterior: `${periodoAnterior.fechaDesde} al ${periodoAnterior.fechaHasta}`,
        });

        const [datosActuales, datosAnteriores] = await Promise.all([
          obtenerDatosPeriodo(fechaDesde, fechaHasta, signal),
          obtenerDatosPeriodo(
            periodoAnterior.fechaDesde,
            periodoAnterior.fechaHasta,
            signal
          ),
        ]);

        if (signal.aborted || !datosActuales || !datosAnteriores) {
          console.log("🚫 Carga cancelada o datos nulos");
          return;
        }

        if (!isMounted.current) return;

        // ✅ Total general
        setDatosTotal({
          actual: datosActuales.total,
          anterior: datosAnteriores.total,
        });

        // 📊 Faenas
        const todasFaenas = new Map();
        datosActuales.faenas.forEach((faena, index) => {
          todasFaenas.set(faena.faena, {
            name: faena.faena,
            actual: faena.litros_consumidos,
            anterior: 0,
          });
        });
        datosAnteriores.faenas.forEach((faena) => {
          if (todasFaenas.has(faena.faena)) {
            todasFaenas.get(faena.faena).anterior = faena.litros_consumidos;
          } else {
            todasFaenas.set(faena.faena, {
              name: faena.faena,
              actual: 0,
              anterior: faena.litros_consumidos,
            });
          }
        });
        setDatosFaenas(Array.from(todasFaenas.values()));

        // 📊 Categorías con incidencia y cambio porcentual
        const todasCategorias = new Map();
        datosActuales.categorias.forEach((cat) => {
          todasCategorias.set(cat.categoria, {
            name: cat.categoria,
            actual: cat.litros_consumidos,
            anterior: 0,
          });
        });
        datosAnteriores.categorias.forEach((cat) => {
          if (todasCategorias.has(cat.categoria)) {
            todasCategorias.get(cat.categoria).anterior = cat.litros_consumidos;
          } else {
            todasCategorias.set(cat.categoria, {
              name: cat.categoria,
              actual: 0,
              anterior: cat.litros_consumidos,
            });
          }
        });

        const categoriasConIncidencia = Array.from(todasCategorias.values())
          .filter((cat) => cat.actual > 0 || cat.anterior > 0)
          .map((cat) => ({
            ...cat,
            incidenciaTotal: (cat.actual || 0) + (cat.anterior || 0),
            cambioPorc:
              cat.anterior > 0
                ? ((cat.actual - cat.anterior) / cat.anterior) * 100
                : cat.actual > 0
                ? 100
                : 0,
          }))
          .sort((a, b) => b.incidenciaTotal - a.incidenciaTotal);

        setDatosCategorias(categoriasConIncidencia);

        // 📊 Top equipos por categoría e incidencia
        const todosEquipos = new Map();
        datosActuales.equipos.forEach((equipo) => {
          const key = `${
            equipo.nombre_equipo || equipo.patente || "Sin nombre"
          }`;
          todosEquipos.set(key, {
            name: key,
            patente: equipo.patente,
            categoria: equipo.categoria || "Sin categoría",
            actual: equipo.litros_consumidos,
            anterior: 0,
          });
        });
        datosAnteriores.equipos.forEach((equipo) => {
          const key = `${
            equipo.nombre_equipo || equipo.patente || "Sin nombre"
          }`;
          if (todosEquipos.has(key)) {
            todosEquipos.get(key).anterior = equipo.litros_consumidos;
          } else {
            todosEquipos.set(key, {
              name: key,
              patente: equipo.patente,
              categoria: equipo.categoria || "Sin categoría",
              actual: 0,
              anterior: equipo.litros_consumidos,
            });
          }
        });

        const equiposArray = Array.from(todosEquipos.values());
        const incidenciaPorCategoria = equiposArray.reduce((acc, equipo) => {
          const cat = equipo.categoria || "Sin categoría";
          acc[cat] =
            (acc[cat] || 0) + (equipo.actual || 0) + (equipo.anterior || 0);
          return acc;
        }, {});

        const equiposOrdenados = equiposArray.sort((a, b) => {
          const incCatA = incidenciaPorCategoria[a.categoria] || 0;
          const incCatB = incidenciaPorCategoria[b.categoria] || 0;
          if (incCatB !== incCatA) return incCatB - incCatA;
          const incA = (a.actual || 0) + (a.anterior || 0);
          const incB = (b.actual || 0) + (b.anterior || 0);
          return incB - incA;
        });

        setDatosEquipos(equiposOrdenados);

        console.log("✅ DashboardComparativo: Datos cargados exitosamente");
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("🚫 Carga abortada");
          return;
        }
        console.error("❌ DashboardComparativo: Error cargando datos:", error);
        if (isMounted.current) {
          setError(
            `Error al cargar los datos: ${
              error.response?.data?.message || error.message
            }`
          );
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };

    const timeoutId = setTimeout(cargarDatosSeguro, 300);
    return () => clearTimeout(timeoutId);
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // 🚀 OPTIMIZACIÓN: Limpiar cache cuando cambien filtros importantes
  useEffect(() => {
    // Limpiar cache cuando cambien filtros importantes
    cacheRef.current.clear();
  }, [faenaSeleccionada]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        abortControllerRef.current.abort();
      }
      lastFiltersRef.current = {
        faenaSeleccionada: null,
        fechaDesde: null,
        fechaHasta: null,
        refreshKey: null,
      };
      isFirstLoad.current = true;
    };
  }, []);

  // 🚀 MEMOIZAR TOOLTIPS para evitar re-renders costosos
  const CustomTooltipCombinado = useMemo(
    () =>
      ({ active, payload, label }) => {
        if (active && payload && payload.length) {
          const actual =
            payload.find((p) => p.dataKey === "actual")?.value || 0;
          const anterior =
            payload.find((p) => p.dataKey === "anterior")?.value || 0;
          const esTotal = payload[0]?.payload?.esTotal;

          const cambio =
            anterior > 0
              ? ((actual - anterior) / anterior) * 100
              : actual > 0
              ? 100
              : 0;
          const esPositivo = cambio >= 0;

          return (
            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
              <p className="font-semibold text-gray-800 mb-2 flex items-center">
                {esTotal && <span className="mr-2">🎯</span>}
                {label}
              </p>
              <div className="space-y-1">
                <p className="text-orange-600 font-medium">
                  Actual: {actual.toLocaleString("es-CL")} L
                </p>
                <p className="text-blue-600 font-medium">
                  Anterior: {anterior.toLocaleString("es-CL")} L
                </p>
                <div
                  className={`flex items-center text-sm font-medium ${
                    esPositivo ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {esPositivo ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {Math.abs(cambio).toFixed(1)}%
                </div>
                {esTotal && (
                  <p className="text-xs text-purple-600 mt-2 font-medium">
                    ✨ Suma de todas las faenas
                  </p>
                )}
              </div>
            </div>
          );
        }

        return null;
      },
    []
  );

  // Tooltip específico para categorías
  const CustomTooltipCategorias = useMemo(
    () =>
      ({ active, payload, label }) => {
        if (active && payload && payload.length) {
          const actual =
            payload.find((p) => p.dataKey === "actual")?.value || 0;
          const anterior =
            payload.find((p) => p.dataKey === "anterior")?.value || 0;
          const incidenciaTotal = (actual || 0) + (anterior || 0);

          const cambio =
            anterior > 0
              ? ((actual - anterior) / anterior) * 100
              : actual > 0
              ? 100
              : 0;
          const esPositivo = cambio >= 0;

          return (
            <div className="bg-white p-3 border border-green-300 rounded-lg shadow-lg">
              <p className="font-semibold text-gray-800 mb-2 flex items-center">
                {label}
              </p>
              <div className="space-y-1">
                <p className="text-orange-600 font-medium">
                  Actual: {actual.toLocaleString("es-CL")} L
                </p>
                <p className="text-blue-600 font-medium">
                  Anterior: {anterior.toLocaleString("es-CL")} L
                </p>
                <p className="text-green-600 font-medium border-t pt-1">
                  📊 Total Categoría: {incidenciaTotal.toLocaleString("es-CL")}{" "}
                  L
                </p>
                <div
                  className={`flex items-center text-sm font-medium ${
                    esPositivo ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {esPositivo ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {Math.abs(cambio).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        }

        return null;
      },
    []
  );

  // Tooltip específico para equipos/máquinas
  const CustomTooltipEquipos = useMemo(
    () =>
      ({ active, payload, label }) => {
        if (active && payload && payload.length) {
          const actual =
            payload.find((p) => p.dataKey === "actual")?.value || 0;
          const anterior =
            payload.find((p) => p.dataKey === "anterior")?.value || 0;
          const categoria = payload[0]?.payload?.categoria;
          const incidenciaTotal = (actual || 0) + (anterior || 0);

          const cambio =
            anterior > 0
              ? ((actual - anterior) / anterior) * 100
              : actual > 0
              ? 100
              : 0;
          const esPositivo = cambio >= 0;

          return (
            <div className="bg-white p-3 border border-purple-300 rounded-lg shadow-lg">
              <p className="font-semibold text-gray-800 mb-2 flex items-center">
                <GiTruck className="text-purple-600 mr-1" />
                {label}
              </p>
              {categoria && (
                <p className="text-xs text-purple-600 font-medium mb-2">
                  📂 {categoria}
                </p>
              )}
              <div className="space-y-1">
                <p className="text-orange-600 font-medium">
                  Actual: {actual.toLocaleString("es-CL")} L
                </p>
                <p className="text-blue-600 font-medium">
                  Anterior: {anterior.toLocaleString("es-CL")} L
                </p>
                <p className="text-purple-600 font-medium border-t pt-1">
                  🔥 Incidencia Total: {incidenciaTotal.toLocaleString("es-CL")}{" "}
                  L
                </p>
                <div
                  className={`flex items-center text-sm font-medium ${
                    esPositivo ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {esPositivo ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {Math.abs(cambio).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        }

        return null;
      },
    []
  );

  // 🚀 MEMOIZAR: Componente para gráfico combinado Total + Faenas
  const GraficoCombinado = useMemo(() => {
    // Combinar datos: Total como primera barra, luego faenas
    const datosCombinados = [
      {
        name: "TOTAL GENERAL",
        actual: datosTotal.actual,
        anterior: datosTotal.anterior,
        esTotal: true,
      },
      ...datosFaenas.map((faena) => ({
        ...faena,
        esTotal: false,
      })),
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
            <FiPieChart className="text-orange-600 mr-2" />
            <span>Consumo Total y por Faenas</span>
          </h4>
          

<p className="text-xs text-gray-900">
  ➤ Anterior: {periodoAnteriorDescripcion}  
  <br />
  ➤ Actual: {periodoAnteriorDescripcionActual} 
</p>

        </div>

        <div className="h-[25rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosCombinados}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 15, fill: "#000000" }}
                angle={-0}
                textAnchor="middle"
                height={70}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(value) => value}
                domain={[0, "dataMax + 500"]}
              />
              <Tooltip
                content={CustomTooltipCombinado}
                offset={100}
                position={{ x: undefined, y: undefined }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconType="rect"
                verticalAlign="top"
                height={36}
              />
              <Bar
                dataKey="anterior"
                fill="#3b82f6"
                name="Período Anterior"
                radius={[2, 2, 0, 0]}
              >
                <LabelList
                  dataKey="anterior"
                  position="top"
                  fontSize={10}
                  fill="#333"
                  formatter={(value) => Math.round(value)}
                />
              </Bar>
              <Bar
                dataKey="actual"
                fill="#f97316"
                name="Período Actual"
                radius={[2, 2, 0, 0]}
              >
                <LabelList
                  dataKey="actual"
                  position="top"
                  fontSize={10}
                  fill="#333"
                  formatter={(value) => Math.round(value)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }, [
    datosTotal,
    datosFaenas,
    periodoAnteriorDescripcion,
    CustomTooltipCombinado,
  ]);

  // 📊 Componente específico para gráfico de categorías
  const GraficoCategorias = useMemo(() => {
    // 🎯 ORDENAR DATOS POR INCIDENCIA TOTAL (MAYOR A MENOR CONSUMO)
    const datosOrdenados = [...datosCategorias]
      .map((cat) => ({
        ...cat,
        incidenciaTotal: (cat.actual || 0) + (cat.anterior || 0),
      }))
      .sort((a, b) => b.incidenciaTotal - a.incidenciaTotal);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
            <GiFactory className="text-green-600 mr-2" />
            <span>Por Categorías de Equipos</span>
          </h4>
          
<p className="text-xs text-gray-900">
  ➤ Anterior: {periodoAnteriorDescripcion}  
  <br />
  ➤ Actual: {periodoAnteriorDescripcionActual} 
</p>
        </div>

        <div className="h-[25rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosOrdenados}
              margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                angle={-45}
                textAnchor="end"
                height={95}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(value) => value}
                domain={[0, "dataMax + 500"]}
              />
              <Tooltip
                content={CustomTooltipCategorias}
                offset={35}
                position={{ x: undefined, y: undefined }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconType="rect"
                verticalAlign="top"
                height={36}
              />
              <Bar
                dataKey="anterior"
                fill="#3b82f6"
                name="Período Anterior"
                radius={[2, 2, 0, 0]}
              >
                <LabelList
                  dataKey="anterior"
                  position="top"
                  fontSize={10}
                  fill="#333"
                  formatter={(value) => Math.round(value)}
                />
              </Bar>
              <Bar
                dataKey="actual"
                fill="#f97316"
                name="Período Actual"
                radius={[2, 2, 0, 0]}
              >
                <LabelList
                  dataKey="actual"
                  position="top"
                  fontSize={10}
                  fill="#333"
                  formatter={(value) => Math.round(value)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }, [datosCategorias, periodoAnteriorDescripcion, CustomTooltipCategorias]);

  // 📊 Componente específico para gráfico de equipos/máquinas con scroll horizontal
  const GraficoEquipos = useMemo(() => {
    // 🔍 Filtrar datos según el estado
    const datosFiltrados = mostrarEquiposSinDatos
      ? datosEquipos
      : datosEquipos.filter((item) => item.actual > 0 || item.anterior > 0);

    // 🔹 Definir colores por categoría automáticamente
    const categoriaColorMap = {};
    const coloresCategorias = [
      "#fef3c7",
      "#e0f2fe",
      "#d1fae5",
      "#fee2e2",
      "#ede9fe",
    ]; // colores pastel
    let colorIndex = 0;

    // Asignar un color a cada categoría única en tus datos filtrados
    datosFiltrados.forEach((item) => {
      if (!categoriaColorMap[item.categoria]) {
        categoriaColorMap[item.categoria] =
          coloresCategorias[colorIndex % coloresCategorias.length];
        colorIndex++;
      }
    });

    // 🎯 Calcular ancho dinámico: más datos = más ancho
    const anchoMinimo = Math.max(datosFiltrados.length * 100, 800); // 100px por barra, mínimo 800px

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
            <GiTruck className="text-purple-600 mr-2" />
            <span>
              Equipos con Consumo (Ordenados por Incidencia de Categoría)
            </span>
          </h4>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarEquiposSinDatos}
                onChange={(e) => setMostrarEquiposSinDatos(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-xs text-gray-700 font-medium">
                Mostrar equipos sin datos (
                {datosEquipos.length - datosFiltrados.length})
              </span>
            </label>

            
<p className="text-xs text-gray-900">
  ➤ Anterior: {periodoAnteriorDescripcion}  
  <br />
  ➤ Actual: {periodoAnteriorDescripcionActual} 
</p>
          </div>
        </div>

        {/* 🚀 Container con scroll horizontal */}
        <div className="h-96 overflow-x-auto overflow-y-hidden">
          <div style={{ width: `${anchoMinimo}px`, height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosFiltrados}
                margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  angle={-45}
                  textAnchor="end"
                  height={95}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(value) => value}
                  domain={[0, "dataMax + 500"]}
                />
                <Tooltip content={CustomTooltipEquipos} offset={50} />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  iconType="rect"
                  verticalAlign="top"
                  height={36}
                />

                {/* Aquí agregamos las líneas separadoras */}
                {(() => {
                  const separadores = [];
                  let lastCategoria = null;
                  datosFiltrados.forEach((d, i) => {
                    if (lastCategoria && d.categoria !== lastCategoria) {
                      // Dibujar línea entre categorías
                      separadores.push(
                        <ReferenceLine
                          key={`sep-${i}`}
                          x={i - 0.5}
                          stroke="#9ca3af"
                          strokeDasharray="3 3"
                        />
                      );
                    }
                    lastCategoria = d.categoria;
                  });
                  return separadores;
                })()}

                <Bar
                  dataKey="anterior"
                  fill="#3b82f6"
                  name="Período Anterior"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={60}
                >
                  <LabelList
                    dataKey="anterior"
                    position="top"
                    fontSize={10}
                    fill="#333"
                    formatter={(value) => Math.round(value)}
                  />
                </Bar>
                <Bar
                  dataKey="actual"
                  fill="#f97316"
                  name="Período Actual"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={60}
                >
                  <LabelList
                    dataKey="actual"
                    position="top"
                    fontSize={10}
                    fill="#333"
                    formatter={(value) => Math.round(value)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 💡 Indicador de scroll si hay muchos datos */}
        {datosFiltrados.length > 8 && (
          <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              ← Desliza horizontalmente para ver más equipos →
            </span>
          </div>
        )}
      </div>
    );
  }, [
    datosEquipos,
    mostrarEquiposSinDatos,
    periodoAnteriorDescripcion,
    CustomTooltipEquipos,
  ]);

  // Estados de loading y error
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Fila 1: Total+Faenas | Categorías */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: Total + Faenas combinados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-center h-[25rem]">
              <FiLoader className="animate-spin h-8 w-8 text-orange-500" />
            </div>
          </div>

          {/* Columna derecha: Categorías */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-center h-[25rem]">
              <FiLoader className="animate-spin h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Fila 2: Equipos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-center h-96">
            <FiLoader className="animate-spin h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 FILA 1: (Total + Faenas combinados) | Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Total + Faenas en UN SOLO gráfico */}
        {GraficoCombinado}

        {/* Columna derecha: Categorías con estilos propios */}
        {GraficoCategorias}
      </div>

      {/* 📊 FILA 2: Todos los Equipos con estilos propios - Ancho completo */}
      {GraficoEquipos}
    </div>
  );
};

export default React.memo(DashboardComparativo);
