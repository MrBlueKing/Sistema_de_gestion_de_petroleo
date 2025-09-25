import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import axios from "../../../lib/axios";
import UniversalHeader from "../Todos/UniversalHeader";
import { UserContext } from "../../../context/userContext";

import {
  FiDroplet,
  FiLoader,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
  FiLock,
  FiBarChart2,
  FiArrowLeft,
  FiArrowRight,
  FiPieChart,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

// IMPORTAR EL CONTEXTO DE COLORES
import {
  ChartColorsProvider,
  useChartColors,
} from "./../../../context/ChartColorsContext";

// Importación de componentes moleculares para filtros y tablas
import FiltrosComponent from "../../molecules/FiltrosComponent";
import ConsumoPorMaquinaPureTable from "../../molecules/ConsumoPorMaquinaTable";
import ConsumoPorFaenaTable from "../../molecules/ConsumoPorFaenaTable";
import IngresosPorFaenaTable from "../../molecules/IngresosPorFaenaTable";

// Importación de componentes moleculares para gráficos
import TopEquiposChart from "../../molecules/TopEquiposChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";
import ConsumptionPieChart from "../../molecules/ConsumptionPieChart";
import CompactConsumptionPieChart from "../../molecules/CompactConsumptionPieChart";
import DashboardComparativo from "../../molecules/DashboardComparativo";

// COMPONENTE INTERNO OPTIMIZADO
const GraficosContent = ({ children }) => {
  // USAR EL CONTEXTO DE COLORES
  const {
    categoryColorMapping,
    mainChartLoaded,
    mainChartCompleted,       // 🆕 NUEVO
  mainChartHasData,         // 🆕 NUEVO
  allowTributedDataLoad,    // 🆕 NUEVO
    isInitialized,
    getColorForCategory,
    handleMainChartLoad,
      handleMainChartNoData,    // 🆕 NUEVO
    resetColorMapping,
    hasValidColorMapping,
    categoryCount,
    // 🆕 NUEVAS propiedades de coordinación
    loadingCoordination,
    compactChartCanLoad,
    allChartsLoaded,
    setMainChartLoading,
    handleCompactChartLoad,

  } = useChartColors();

  // Estados básicos necesarios
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [faenas, setFaenas] = useState([]);

  // Estados para las horas
  const [horaDesde, setHoraDesde] = useState("08:00");
  const [horaHasta, setHoraHasta] = useState("18:00");

  // Estado para controlar la vista activa
  const [vistaActiva, setVistaActiva] = useState("graficos");
  const [bloqueado, setBloqueado] = useState(false);

  const { user, loading: userLoading } = useContext(UserContext);

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

  // OPTIMIZACION 1: MEMOIZAR defaultDates para evitar recálculos constantes
  const defaultDates = useMemo(() => {
    const fechaActual = new Date();
    const primerDiaMesActual = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1
    );
    const diaActual = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      fechaActual.getDate()
    );

    const result = {
      fechaActual: fechaActual.toISOString().split("T")[0],
      primerDiaMesActual: primerDiaMesActual.toISOString().split("T")[0],
      diaActual: diaActual.toISOString().split("T")[0],
      mesActual: fechaActual.getMonth() + 1,
      añoActual: fechaActual.getFullYear(),
    };

    console.log("📅 Graficos: Configurando fechas por defecto:", result);
    return result;
  }, []); // Sin dependencias - se calcula solo UNA vez

  // Estados para fechas inicializados con valores memoizados
  const [fechaDesde, setFechaDesde] = useState(defaultDates.primerDiaMesActual);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.diaActual);
  // 🆕 NUEVO: Estados para claves de refresh coordinado
  const [refreshKeys, setRefreshKeys] = useState({
    main: 0,
    compact: 0,
  });

  const resetColorsOptimizado = useCallback(() => {
    console.log("🔄 Graficos: Reseteando colores y coordinación");
    resetColorMapping();

    // 🆕 NUEVO: Incrementar claves de refresh para forzar recarga
    setRefreshKeys((prev) => ({
      main: prev.main + 1,
      compact: prev.compact + 1,
    }));
  }, [resetColorMapping]);

  // 🆕 NUEVO: Callback cuando el gráfico principal termina
  const onMainChartComplete = useCallback((categorias) => {
    console.log("✅ Graficos: Gráfico principal completado");
    // El contexto ya maneja la lógica, solo logging aquí
  }, []);

  // 🆕 NUEVO: Callback cuando el gráfico compacto termina
  const onCompactChartComplete = useCallback(() => {
    console.log("✅ Graficos: Gráfico compacto completado");
    // Opcional: realizar acciones adicionales cuando ambos gráficos terminen
  }, []);

  // useEffect existente actualizado
  useEffect(() => {
    resetColorsOptimizado();
  }, [faenaSeleccionada, fechaDesde, fechaHasta, resetColorsOptimizado]);

  // OPTIMIZACION 3: CARGAR FAENAS - versión ultra optimizada con prevención de cargas duplicadas
  const cargarFaenas = useCallback(async () => {
    // Prevenir múltiples cargas simultaneas
    if (cargando) {
      console.log("🚫 Carga de faenas ya en progreso, omitiendo...");
      return;
    }

    try {
      console.log("🏭 Iniciando carga de faenas...");
      setCargando(true);
      setError(null);

      const response = await axios.get("/api/faenas");
      console.log(
        "📊 Respuesta completa del endpoint /api/faenas:",
        response.data
      );

      let faenasData = [];

      // Procesamiento optimizado de diferentes estructuras de respuesta
      if (response.data?.success && Array.isArray(response.data.data)) {
        console.log(
          "✅ Estructura encontrada: response.data.data (con wrapper)"
        );
        faenasData = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log("✅ Estructura encontrada: response.data (directo)");
        faenasData = response.data;
      } else if (response.data?.faenas && Array.isArray(response.data.faenas)) {
        console.log("✅ Estructura encontrada: response.data.faenas");
        faenasData = response.data.faenas;
      } else {
        console.warn("⚠️ Estructura de respuesta inesperada:", response.data);
        faenasData = [];
      }

      console.log("📊 Datos de faenas encontrados:", faenasData);

      if (faenasData && faenasData.length > 0) {
        // Mapear una sola vez con procesamiento optimizado
        const faenasFormateadas = faenasData.map((faena) => ({
          value: (faena.id_faena || faena.id || 0).toString(),
          label:
            faena.ubicacion ||
            faena.nombre ||
            faena.name ||
            `Faena ${faena.id_faena || faena.id}`,
          id_faena: faena.id_faena || faena.id,
          ubicacion: faena.ubicacion || faena.nombre,
          detalle: faena.detalle,
          activo: faena.activo !== false,
        }));

        console.log(
          "✅ Faenas formateadas para el selector:",
          faenasFormateadas
        );
        setFaenas(faenasFormateadas);

        // Selección automática optimizada
        if (faenaSeleccionada === "todas" && faenasFormateadas.length === 1) {
          console.log("🎯 Solo hay una faena, seleccionándola automáticamente");
          setFaenaSeleccionada(faenasFormateadas[0].value);
        }
      } else {
        console.warn("⚠️ No se encontraron faenas válidas");
        setFaenas([]);
      }
    } catch (error) {
      console.error("❌ Error cargando faenas:", error);
      setError(
        "Error al cargar las faenas disponibles. Verifique su conexión."
      );
      setFaenas([]);
    } finally {
      setCargando(false);
    }
  }, [cargando, faenaSeleccionada]); // Solo depende de estados críticos


  
// 1. Crear un useMemo para obtener la faena completa seleccionada
const faenaSeleccionadaCompleta = useMemo(() => {
  if (faenaSeleccionada === "todas") {
    return { 
      id: "todas", 
      nombre: "Todas las faenas" 
    };
  }
  
  const faena = faenas.find(f => f.value === faenaSeleccionada);
  return faena ? {
    id: faenaSeleccionada,
    nombre: faena.label,
    ubicacion: faena.ubicacion
  } : { 
    id: faenaSeleccionada, 
    nombre: `Faena ${faenaSeleccionada}` 
  };
}, [faenaSeleccionada, faenas]);



  // OPTIMIZACION 4: Cargar faenas solo una vez al montar
  useEffect(() => {
    cargarFaenas();
  }, []); // Sin dependencias - se ejecuta solo al montar

  // OPTIMIZACION 5: Funciones de manejo optimizadas con useCallback
  const manejarCambioFecha = useCallback((campo, valor) => {
    console.log(`📅 Graficos: Cambiando ${campo} a:`, valor);
    if (campo === "fechaDesde") {
      setFechaDesde(valor);
    } else if (campo === "fechaHasta") {
      setFechaHasta(valor);
    }
  }, []);

  const manejarCambioFaena = useCallback((nuevaFaena) => {
    console.log("🏭 Graficos: Cambiando faena a:", nuevaFaena);
    setFaenaSeleccionada(nuevaFaena);
  }, []);

  const manejarCambioHora = useCallback((campo, valor) => {
    console.log(`⏰ Graficos: Cambiando ${campo} a:`, valor);
    if (campo === "horaDesde") {
      setHoraDesde(valor);
    } else if (campo === "horaHasta") {
      setHoraHasta(valor);
    }
  }, []);

  // OPTIMIZACION 6: Función de refresh optimizada
  const manejarRefresh = useCallback(() => {
    console.log("🔄 Graficos: Disparando refresh manual");
    setCargando(true);
    setError(null);

    setRefreshTrigger((prev) => prev + 1);
    setUltimaActualizacion(new Date());

    // Simular tiempo de carga más rápido
    setTimeout(() => {
      setCargando(false);
      setMensajeExito("Datos actualizados correctamente");
      setTimeout(() => setMensajeExito(null), 2000); // Reducido de 3000 a 2000
    }, 500); // Reducido de 1000 a 500
  }, []);

  // OPTIMIZACION 7: Memoizar datos finales para evitar recálculos
  const datosFinales = useMemo(() => {
    const fechaInicioFormateada = `${fechaDesde} ${horaDesde}:00`;
    const fechaFinFormateada = `${fechaHasta} ${horaHasta}:00`;

    return {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      fechaInicioFormateada,
      fechaFinFormateada,
      refreshKey: refreshTrigger,
    };
  }, [
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    horaDesde,
    horaHasta,
    refreshTrigger,
  ]);

  // OPTIMIZACION 8: Props memoizadas para componentes
  const chartCommonProps = useMemo(
    () => ({
      faenaSeleccionada,
      nombreFaena: faenaSeleccionadaCompleta.nombre, 
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      refreshKey: refreshTrigger,
    }),
    [
      faenaSeleccionada,
      faenaSeleccionadaCompleta.nombre,
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      refreshTrigger,
    ]
  );

  // OPTIMIZACION 9: Props estabilizadas para consumption pie chart
  const consumptionPieChartProps = useMemo(
    () => ({
      ...chartCommonProps,
      onCategoriesLoad: handleMainChartLoad,
    }),
    [chartCommonProps, handleMainChartLoad]
  );

  const compactChartProps = useMemo(
    () => ({
      ...chartCommonProps,
      titulo: (
        <div className="text-center">
          <div className="font-semibold text-gray-800">
            Comparación de Consumo por Categoría de Operación
          </div>

        </div>
      ),
    }),
    [chartCommonProps]
  );

  // MODIFICAR la condición shouldRenderCompact
const shouldRenderCompact = useMemo(() => {
  // 🆕 NUEVA LÓGICA: Renderizar si el principal completó (con o sin datos)
  const result = mainChartCompleted && isInitialized;

  console.log("🔍 Graficos: Evaluando renderizado de CompactChart:", {
    mainChartLoaded,
    mainChartCompleted,       // 🆕 NUEVO
    mainChartHasData,         // 🆕 NUEVO
    allowTributedDataLoad,    // 🆕 NUEVO
    hasValidColorMapping,
    categoryCount,
    shouldRenderCompact: result,
    isInitialized,
    motivo: result ? 
      (mainChartHasData ? "Datos principales disponibles" : "Buscando datos tributados") : 
      "Principal aún no completado"
  });

  return result;
}, [
  mainChartLoaded, 
  mainChartCompleted,     // 🆕 NUEVO
  mainChartHasData,       // 🆕 NUEVO
  allowTributedDataLoad,  // 🆕 NUEVO
  hasValidColorMapping, 
  categoryCount, 
  isInitialized
]);



  // OPTIMIZACION 11: Memoizar componentes pesados para evitar re-renders
  const MemoizedTopEquipos = useMemo(
    () => (
      <TopEquiposChart
        {...chartCommonProps}
        getColorForCategory={getColorForCategory}
      />
    ),
    [chartCommonProps, getColorForCategory]
  );

  const MemoizedConsumptionPie = useMemo(
    () => (
      <ConsumptionPieChart
        {...consumptionPieChartProps}
        key={`main-chart-${refreshTrigger}`}
      />
    ),
    [consumptionPieChartProps, refreshTrigger]
  );

  // OPTIMIZACIÓN CRÍTICA: Evitar key dinámico que causa desmontaje
  const MemoizedCompactChart = useMemo(
    () =>
      shouldRenderCompact ? (
        <CompactConsumptionPieChart
          {...compactChartProps}
        // Removido key dinámico para evitar re-mount
        />
      ) : null,
    [shouldRenderCompact, compactChartProps]
  );

  const MemoizedDashboardComparativo = useMemo(
    () =>
      fechaDesde && fechaHasta ? (
        <DashboardComparativo {...chartCommonProps} />
      ) : null,
    [fechaDesde, fechaHasta, chartCommonProps]
  );

  const MemoizedConsumoTendencia = useMemo(
    () => <ConsumoTendenciaChart {...chartCommonProps} />,
    [chartCommonProps]
  );

  // OPTIMIZACION 12: Memoizar tablas para evitar re-renders innecesarios
  const MemoizedConsumoPorMaquinaTable = useMemo(
    () => <ConsumoPorMaquinaPureTable {...datosFinales} />,
    [datosFinales]
  );

  const MemoizedConsumoPorFaenaTable = useMemo(
    () => <ConsumoPorFaenaTable {...datosFinales} />,
    [datosFinales]
  );

  const MemoizedIngresosPorFaenaTable = useMemo(
    () => <IngresosPorFaenaTable {...datosFinales} />,
    [datosFinales]
  );

  // JSX PRINCIPAL OPTIMIZADO
  return (
    <div className="flex-1 overflow-auto bg-gray-50 mt-12">

      <div className="py-6">
        {/* MENSAJES DE ESTADO */}
        {cargando && (
          <div className="text-center py-4 bg-white rounded-lg shadow-md mb-4">
            <FiLoader
              className="animate-spin mx-auto h-8 w-8"
              style={{ color: "#F67029" }}
            />
            <p className="mt-2 text-gray-600">Cargando datos...</p>
          </div>
        )}

        {error && (
          <div
            className="border-l-4 text-red-700 p-4 mb-4 rounded-r-md shadow-sm"
            style={{ backgroundColor: "#FEF2F2", borderColor: "#AB201A" }}
          >
            <div className="flex">
              <div className="py-1">
                <FiX className="h-5 w-6 mr-4" style={{ color: "#AB201A" }} />
              </div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {mensajeExito && (
          <div
            className="border-l-4 p-4 mb-4 rounded-r-md shadow-sm"
            style={{ backgroundColor: "#F0EDEA", borderColor: "#9A0000" }}
          >
            <div className="flex">
              <div className="py-1">
                <FiCheckCircle
                  className="h-5 w-5 mr-4"
                  style={{ color: "#9A0000" }}
                />
              </div>
              <div>
                <p className="font-bold" style={{ color: "#9A0000" }}>
                  Éxito
                </p>
                <p style={{ color: "#9A0000" }}>{mensajeExito}</p>
              </div>
            </div>
          </div>
        )}

        {/* HEADER PRINCIPAL */}
        <section className="">
          <div className="flex justify-between items-center mb-3 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDroplet className="mr-2" style={{ color: "#F67029" }} />
              Dashboard Operacional
            </h2>

            <div className="flex items-center space-x-4">
              {/* Selector de vista */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                {[
                  { key: "graficos", label: "Gráficos", icon: FiPieChart },
                  { key: "tablas", label: "Tablas", icon: FiBarChart2 },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (bloqueado) return;
                      setVistaActiva(key);
                      setBloqueado(true);
                      setTimeout(() => setBloqueado(false), 5000); // Reducido de 8000 a 5000
                    }}
                    disabled={bloqueado}
                    className={`px-3 py-1 rounded-md flex items-center justify-center transition-colors ${vistaActiva === key
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-200"
                      } ${bloqueado ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={
                      vistaActiva === key ? { backgroundColor: "#F67029" } : {}
                    }
                  >
                    {label}
                    {bloqueado && <FiLock className="ml-2 h-4 w-4" />}
                  </button>
                ))}
              </div>

              {/* Botón de refrescar */}
              <button
                onClick={manejarRefresh}
                disabled={cargando}
                className="flex items-center px-3 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#F67029" }}
              >
                <FiRefreshCw
                  className={`mr-2 ${cargando ? "animate-spin" : ""}`}
                />
                {cargando ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {/* FILTROS COMPONENT OPTIMIZADO */}
          <div className="mb-6">
            <FiltrosComponent
              fechaDesde={fechaDesde}
              setFechaDesde={setFechaDesde}
              fechaHasta={fechaHasta}
              setFechaHasta={setFechaHasta}
              faenaSeleccionada={faenaSeleccionada}
              setFaenaSeleccionada={setFaenaSeleccionada}
              faenas={faenas}
              incluirHoras={true}
              horaDesde={horaDesde}
              setHoraDesde={setHoraDesde}
              horaHasta={horaHasta}
              setHoraHasta={setHoraHasta}
              cargando={cargando}
              onFaenaChange={manejarCambioFaena}
              onFechaChange={manejarCambioFecha}
              onHoraChange={manejarCambioHora}
            />
          </div>

          {/* CONTENIDO SEGÚN VISTA ACTIVA */}
          {vistaActiva === "graficos" && (
            <div className="mt-6">
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <FiBarChart2 className="mr-2" style={{ color: "#F67029" }} />
                  Visualización de Datos
                </h3>

                {/* TOP EQUIPOS CHART MEMOIZADO */}
                <div className="mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Top Equipos por Consumo
                    </h4>
                    {MemoizedTopEquipos}
                  </div>
                </div>

                {/* GRÁFICO PRINCIPAL MEMOIZADO */}
                <div className="mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Consumo por Categoría de Máquinas
                    </h4>
                    {MemoizedConsumptionPie}
                  </div>
                </div>

                {/* GRÁFICO COMPACTO MEMOIZADO */}
                {shouldRenderCompact ? (
                  <div className="mb-6">{MemoizedCompactChart}</div>
                ) : (
                  <div className="mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-center">
                        <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <p className="text-sm text-blue-700">
                          Sincronizando colores del gráfico principal...
                        </p>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (categoryCount / 5) * 100,
                              90
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DASHBOARD COMPARATIVO MEMOIZADO */}
                <div className="mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <span className="ml-2">Dashboard Comparativo</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Comparando con:</p>
                        <p className="text-sm font-medium text-blue-600">
                          Mes Anterior
                        </p>
                      </div>
                    </div>

                    {MemoizedDashboardComparativo || (
                      <div className="text-center py-12">
                        <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">
                          Seleccione un rango de fechas para ver el dashboard
                          comparativo
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* TENDENCIA CHART MEMOIZADO */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Tendencia de Consumo
                  </h4>
                  {MemoizedConsumoTendencia}
                </div>
              </div>
            </div>
          )}

          {/* VISTA DE TABLAS MEMOIZADA */}
          {vistaActiva === "tablas" && (
            <div className="space-y-6">
              {/* Tabla de consumo por máquina */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <FiBarChart2 className="mr-2" style={{ color: "#F67029" }} />
                  Consumo por Máquina
                </h3>
                {MemoizedConsumoPorMaquinaTable}
              </div>

              {/* Grid para las dos tablas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                  {MemoizedConsumoPorFaenaTable}
                </div>

                <div className="bg-white p-6 rounded-lg h-full">
                  {MemoizedIngresosPorFaenaTable}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sección para contenido hijo */}
        <section>{children}</section>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
        <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos
            reservados.
          </div>
          <div className="flex items-center">
            <span className="mr-2">Versión 3.1.0</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
            <span>
              Última actualización: {ultimaActualizacion.toLocaleString()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// COMPONENTE PRINCIPAL CON PROVIDER MEMOIZADO
const Graficos = ({ children }) => {
  return (
    <ChartColorsProvider>
      <GraficosContent>{children}</GraficosContent>
    </ChartColorsProvider>
  );
};

export default React.memo(Graficos);
