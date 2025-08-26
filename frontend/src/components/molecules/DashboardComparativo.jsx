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

  // NUEVO: Estado para filtrar equipos
  const [mostrarEquiposSinDatos, setMostrarEquiposSinDatos] = useState(false);

  // NUEVAS PROTECCIONES CONTRA CARGAS MÚLTIPLES
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Refs para verificar si el componente está montado
  const isMounted = useRef(true);


 
  // Función para calcular período anterior (mes anterior)
  const calcularPeriodoAnterior = () => {
    const inicioActual = new Date(fechaDesde);
    const finActual = new Date(fechaHasta);

    const inicioAnterior = new Date(inicioActual);
    inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);

    const finAnterior = new Date(finActual);
    finAnterior.setMonth(finAnterior.getMonth() - 1);

    const descripcion = `${inicioAnterior.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })} - ${finAnterior.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })}`;

    return {
      fechaDesde: inicioAnterior.toISOString().split("T")[0],
      fechaHasta: finAnterior.toISOString().split("T")[0],
      descripcion,
    };
  };

  // FUNCIÓN OPTIMIZADA: Obtener datos de un período específico
  const obtenerDatosPeriodo = async (fechaInicio, fechaFin, signal) => {
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
      // Realizar las 4 consultas en paralelo con cancelación
      const [totalResponse, faenasResponse, equiposResponse, kpisResponse] =
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
          axios.get("/api/informes-kpi", {
            params: { ...params, tipo: "kpis_consumo" },
            signal,
          }),
        ]);

      // Verificar si la request fue cancelada
      if (signal.aborted) {
        console.log("🚫 Request cancelada");
        return null;
      }

      console.log("📊 DashboardComparativo: Respuestas recibidas:", {
        total: totalResponse.data,
        faenas: faenasResponse.data,
        equipos: equiposResponse.data,
        kpis: kpisResponse.data,
      });

      // PROCESAR LOS DATOS SEGÚN LA ESTRUCTURA DE LA API

      // 1. Total general
      const totalConsumo = totalResponse.data?.data?.consumo_total_mes || 0;

      // 2. Por faenas
      const faenas = faenasResponse.data?.data || [];

      // 3. Por categorías (extraer de equipos)
      const equipos = equiposResponse.data?.data || [];
      const categorias = equipos.reduce((acc, equipo) => {
        const categoria = equipo.categoria || "Sin categoría";
        if (!acc[categoria]) {
          acc[categoria] = 0;
        }
        acc[categoria] += parseFloat(equipo.consumo || 0);
        return acc;
      }, {});

      const categoriasArray = Object.entries(categorias).map(
        ([nombre, consumo]) => ({
          categoria: nombre,
          litros_consumidos: consumo,
        })
      );

      // 4. Top equipos con categoría incluida
      const topEquipos = equipos
        .sort((a, b) => parseFloat(b.consumo || 0) - parseFloat(a.consumo || 0))
        .map((equipo) => ({
          nombre_equipo: equipo.nombre || "Sin nombre",
          patente: equipo.patente || "",
          categoria: equipo.categoria || "Sin categoría",
          litros_consumidos: parseFloat(equipo.consumo || 0),
        }));

      console.log("📊 DashboardComparativo: Datos procesados:", {
        totalConsumo,
        faenasCount: faenas.length,
        categoriasCount: categoriasArray.length,
        equiposCount: topEquipos.length,
      });

      return {
        total: totalConsumo,
        faenas: faenas.map((f) => ({
          faena: f.name || f.nombre || "Sin nombre",
          litros_consumidos: parseFloat(f.consumo || 0),
        })),
        categorias: categoriasArray,
        equipos: topEquipos,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("🚫 Request abortada por el usuario");
        return null;
      }

      console.error("❌ DashboardComparativo: Error en consulta:", error);

      // FALLBACK: Devolver datos vacíos pero válidos
      return {
        total: 0,
        faenas: [],
        categorias: [],
        equipos: [],
      };
    }
  };

  // FUNCIÓN PRINCIPAL CON TODAS LAS PROTECCIONES
  const cargarTodosLosDatos = async () => {
    // Validaciones iniciales
    if (!isMounted.current || !fechaDesde || !fechaHasta) {
      console.log(
        "🚫 Carga cancelada: componente desmontado o fechas faltantes"
      );
      return;
    }

    // Prevenir cargas concurrentes
    if (isLoading) {
      console.log("🚫 Carga cancelada: ya hay una carga en progreso");
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    console.log("🚀 DashboardComparativo: Iniciando carga única:", {
      timestamp: Date.now(),
      fechaDesde,
      fechaHasta,
      faenaSeleccionada,
      refreshKey,
    });

    setIsLoading(true);
    setLoading(true);
    setError(null);

    try {
      // Calcular período anterior
      const periodoAnterior = calcularPeriodoAnterior();
      setPeriodoAnteriorDescripcion(periodoAnterior.descripcion);

      console.log("📊 DashboardComparativo: Períodos calculados:", {
        actual: `${fechaDesde} al ${fechaHasta}`,
        anterior: `${periodoAnterior.fechaDesde} al ${periodoAnterior.fechaHasta}`,
      });

      // Cargar ambos períodos en paralelo
      const [datosActuales, datosAnteriores] = await Promise.all([
        obtenerDatosPeriodo(fechaDesde, fechaHasta, signal),
        obtenerDatosPeriodo(
          periodoAnterior.fechaDesde,
          periodoAnterior.fechaHasta,
          signal
        ),
      ]);

      // Verificar si fue cancelado o hay datos nulos
      if (signal.aborted || !datosActuales || !datosAnteriores) {
        console.log("🚫 Carga cancelada o datos nulos");
        return;
      }

      if (!isMounted.current) return;

      console.log("📊 DashboardComparativo: Datos obtenidos:", {
        actuales: datosActuales,
        anteriores: datosAnteriores,
      });

      // GRÁFICO 1: Total general
      setDatosTotal({
        actual: datosActuales.total,
        anterior: datosAnteriores.total,
      });

      // GRÁFICO 2: Por faenas - unificar datos para gráfico de barras
      const todasFaenas = new Map();

      datosActuales.faenas.forEach((faena, index) => {
        todasFaenas.set(faena.faena, {
          name: faena.faena,
          actual: faena.litros_consumidos,
          anterior: 0,
        });
      });

      datosAnteriores.faenas.forEach((faena, index) => {
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

      // GRÁFICO 3: Por categorías - unificar datos para gráfico de barras
      const todasCategorias = new Map();

      datosActuales.categorias.forEach((cat, index) => {
        todasCategorias.set(cat.categoria, {
          name: cat.categoria,
          actual: cat.litros_consumidos,
          anterior: 0,
        });
      });

      datosAnteriores.categorias.forEach((cat, index) => {
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

      // APLICAR ORDENAMIENTO POR INCIDENCIA TOTAL
      const categoriasConIncidencia = Array.from(todasCategorias.values())
        .filter((cat) => cat.actual > 0 || cat.anterior > 0)
        .map((cat) => ({
          ...cat,
          // CALCULAR INCIDENCIA TOTAL (suma de ambos períodos)
          incidenciaTotal: (cat.actual || 0) + (cat.anterior || 0),
          // CALCULAR CAMBIO PORCENTUAL
          cambioPorc:
            cat.anterior > 0
              ? ((cat.actual - cat.anterior) / cat.anterior) * 100
              : cat.actual > 0
              ? 100
              : 0,
        }));

      setDatosCategorias(categoriasConIncidencia);

      // GRÁFICO 4: Top equipos - unificar datos para gráfico de barras
      const todosEquipos = new Map();

      datosActuales.equipos.forEach((equipo) => {
        const key = `${equipo.nombre_equipo || equipo.patente || "Sin nombre"}`;
        todosEquipos.set(key, {
          name: key,
          patente: equipo.patente,
          categoria: equipo.categoria || "Sin categoría",
          actual: equipo.litros_consumidos,
          anterior: 0,
        });
      });

      datosAnteriores.equipos.forEach((equipo) => {
        const key = `${equipo.nombre_equipo || equipo.patente || "Sin nombre"}`;
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

      // ORDENAR POR CATEGORÍA (SEGÚN INCIDENCIA) Y LUEGO POR CONSUMO DENTRO DE CADA CATEGORÍA
      const equiposOrdenados = Array.from(todosEquipos.values());

      // 1. Calcular incidencia total por categoría
      const incidenciaPorCategoria = equiposOrdenados.reduce((acc, equipo) => {
        const categoria = equipo.categoria || "Sin categoría";
        const incidenciaEquipo = (equipo.actual || 0) + (equipo.anterior || 0);

        if (!acc[categoria]) {
          acc[categoria] = 0;
        }
        acc[categoria] += incidenciaEquipo;
        return acc;
      }, {});

      // 2. Ordenar equipos: primero por incidencia de categoría, luego por incidencia individual
      const equiposOrdenadosPorIncidencia = equiposOrdenados.sort((a, b) => {
        const categoriaA = a.categoria || "Sin categoría";
        const categoriaB = b.categoria || "Sin categoría";

        // Primero ordenar por incidencia total de la categoría (mayor a menor)
        const incidenciaCategoriaA = incidenciaPorCategoria[categoriaA];
        const incidenciaCategoriaB = incidenciaPorCategoria[categoriaB];

        if (incidenciaCategoriaA !== incidenciaCategoriaB) {
          return incidenciaCategoriaB - incidenciaCategoriaA;
        }

        // Dentro de la misma categoría, ordenar por incidencia individual (mayor a menor)
        const incidenciaA = (a.actual || 0) + (a.anterior || 0);
        const incidenciaB = (b.actual || 0) + (b.anterior || 0);
        return incidenciaB - incidenciaA;
      });

      setDatosEquipos(equiposOrdenadosPorIncidencia);

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
        setIsLoading(false);
      }
    }
  };

  // USEEFFECT CON DEBOUNCE Y PROTECCIÓN
  useEffect(() => {

    // Validación rápida
    if (!fechaDesde || !fechaHasta) {
      console.log("🚫 Fechas faltantes, no cargando datos");
      return;
    }

    console.log("⏱️ DashboardComparativo: Programando carga con debounce");

    // Debounce de 500ms
    debounceTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && !isLoading) {
        cargarTodosLosDatos();
      }
    }, 0);

    // Cleanup del timeout
    return () => {
      if (debounceTimeoutRef.current) {
        (debounceTimeoutRef.current);
      }
    };
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // Tooltip para el gráfico combinado (Total + Faenas)
  const CustomTooltipCombinado = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const actual = payload.find((p) => p.dataKey === "actual")?.value || 0;
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
  };

  // Tooltip específico para categorías
  const CustomTooltipCategorias = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const actual = payload.find((p) => p.dataKey === "actual")?.value || 0;
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
              📊 Total Categoría: {incidenciaTotal.toLocaleString("es-CL")} L
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
  };

  // Tooltip específico para equipos/máquinas
  const CustomTooltipEquipos = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const actual = payload.find((p) => p.dataKey === "actual")?.value || 0;
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
              🔥 Incidencia Total: {incidenciaTotal.toLocaleString("es-CL")} L
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
  };

  // Función para calcular cambio porcentual
  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  };

  // Componente para gráfico combinado Total + Faenas
  const GraficoCombinado = ({ datosTotal, datosFaenas }) => {
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
          <p className="text-xs text-gray-500">
            vs {periodoAnteriorDescripcion}
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
                content={<CustomTooltipCombinado />}
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
  };

  // 📊 Componente específico para gráfico de categorías
  const GraficoCategorias = ({ datos }) => {
    // 🎯 ORDENAR DATOS POR INCIDENCIA TOTAL (MAYOR A MENOR CONSUMO)
    const datosOrdenados = useMemo(() => {
      return [...datos]
        .map((cat) => ({
          ...cat,
          incidenciaTotal: (cat.actual || 0) + (cat.anterior || 0),
        }))
        .sort((a, b) => b.incidenciaTotal - a.incidenciaTotal);
    }, [datos]);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
            <GiFactory className="text-green-600 mr-2" />
            <span>Por Categorías de Equipos</span>
          </h4>
          <p className="text-xs text-gray-500">
            vs {periodoAnteriorDescripcion}
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
                content={<CustomTooltipCategorias />}
                offset={35} // 👈 Mueve el tooltip 50px a la derecha
                position={{ x: undefined, y: undefined }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconType="rect"
                verticalAlign="top"
                height={36} // 🎯 Esto crea el espacio
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
  };

  // 📊 Componente específico para gráfico de equipos/máquinas con scroll horizontal
  const GraficoEquipos = ({ datos }) => {
    // 🔍 Filtrar datos según el estado
    const datosFiltrados = useMemo(() => {
      if (mostrarEquiposSinDatos) {
        return datos;
      } else {
        return datos.filter((item) => item.actual > 0 || item.anterior > 0);
      }
    }, [datos, mostrarEquiposSinDatos]);

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
                {datos.length - datosFiltrados.length})
              </span>
            </label>

            <p className="text-xs text-gray-500">
              vs {periodoAnteriorDescripcion}
            </p>
          </div>
        </div>

        {/* 🚀 NUEVO: Container con scroll horizontal */}
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
                <Tooltip
                  content={<CustomTooltipEquipos />}
                  offset={50} // 👈 Mueve el tooltip 50px a la derecha
                  position={{ x: undefined, y: undefined }} // Permite que offset funcione
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
                  maxBarSize={60} // 🎯 Ancho máximo de barras
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
                  maxBarSize={60} // 🎯 Ancho máximo de barras
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
  };

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
        <GraficoCombinado datosTotal={datosTotal} datosFaenas={datosFaenas} />

        {/* Columna derecha: Categorías con estilos propios */}
        <GraficoCategorias datos={datosCategorias} />
      </div>

      {/* 📊 FILA 2: Todos los Equipos con estilos propios - Ancho completo */}
      <GraficoEquipos datos={datosEquipos} />
    </div>
  );
};

export default DashboardComparativo;
