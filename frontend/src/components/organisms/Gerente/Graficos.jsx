import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../../../lib/axios";

import UniversalHeader from "../Todos/UniversalHeader";

import {
  FiDroplet,
  FiLoader,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
  FiLock ,
  FiBarChart2,
  FiArrowLeft,
  FiArrowRight,
  FiPieChart,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

// 🎨 IMPORTAR EL CONTEXTO DE COLORES
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

// 🔧 COMPONENTE INTERNO QUE USA EL CONTEXTO
const GraficosContent = ({ children }) => {
  // 🎨 USAR EL CONTEXTO DE COLORES
  const {
    categoryColorMapping,
    mainChartLoaded,
    isInitialized,
    getColorForCategory,
    handleMainChartLoad,
    resetColorMapping,
    hasValidColorMapping,
    categoryCount,
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

  // Estados para fechas - CONFIGURACIÓN POR DEFECTO MEMOIZADA
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

    return {
      fechaActual: fechaActual.toISOString().split("T")[0],
      primerDiaMesActual: primerDiaMesActual.toISOString().split("T")[0],
      diaActual: diaActual.toISOString().split("T")[0],
      mesActual: fechaActual.getMonth() + 1,
      añoActual: fechaActual.getFullYear(),
    };
  }, []);

  console.log("📅 Graficos: Configurando fechas por defecto:", defaultDates);

  const [fechaDesde, setFechaDesde] = useState(defaultDates.primerDiaMesActual);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.diaActual);

  // 🔄 RESETEAR COLORES CUANDO CAMBIAN FILTROS - OPTIMIZADO
  useEffect(() => {
    console.log("🔄 Graficos: Detectando cambio de filtros importantes");
    resetColorMapping();
  }, [faenaSeleccionada, fechaDesde, fechaHasta]); // REMOVIDO refreshTrigger para evitar resets innecesarios

  // 🔧 CARGAR FAENAS - FUNCIÓN MEMOIZADA CON MANEJO ROBUSTO
  const cargarFaenas = useCallback(async () => {
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

      // Verificar diferentes estructuras de respuesta
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

      console.log(
        `🏭 Procesando ${faenasData.length} faenas encontradas:`,
        faenasData
      );

      if (faenasData && faenasData.length > 0) {
        const faenasFormateadas = faenasData.map((faena) => {
          console.log("🏭 Procesando faena:", {
            id_faena: faena.id_faena,
            ubicacion: faena.ubicacion,
            detalle: faena.detalle,
            fecha_creacion: faena.fecha_creacion,
          });

          return {
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
          };
        });

        console.log(
          "✅ Faenas formateadas para el selector:",
          faenasFormateadas
        );
        setFaenas(faenasFormateadas);

        // Seleccionar automáticamente la primera faena si solo hay una
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
  }, [faenaSeleccionada]);

  // Cargar faenas al montar el componente
  useEffect(() => {
    cargarFaenas();
  }, [cargarFaenas]);

  // 🔧 FUNCIONES DE MANEJO DE FILTROS COMPATIBLES CON LA VERSIÓN ORIGINAL
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

  // 🔄 FUNCIÓN DE REFRESH MEJORADA
  const manejarRefresh = useCallback(() => {
    console.log("🔄 Graficos: Disparando refresh manual");
    setCargando(true);
    setError(null);

    setRefreshTrigger((prev) => prev + 1);
    setUltimaActualizacion(new Date());

    // Simular tiempo de carga
    setTimeout(() => {
      setCargando(false);
      setMensajeExito("Datos actualizados correctamente");
      setTimeout(() => setMensajeExito(null), 3000);
    }, 1000);
  }, []);

  // 🔧 DATOS FINALES COMPATIBLES CON AMBAS VERSIONES
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

  // 🎨 PROPS MEMOIZADAS PARA COMPONENTES
  const chartCommonProps = useMemo(
    () => ({
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      refreshKey: refreshTrigger,
    }),
    [
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      refreshTrigger,
    ]
  );

  // 🔧 PROPS ESTABILIZADAS PARA CONSUMPTION PIE CHART
  const consumptionPieChartProps = useMemo(
    () => ({
      ...chartCommonProps,
      onCategoriesLoad: handleMainChartLoad, // Nombre correcto del callback
      handleMainChartLoad: handleMainChartLoad,
      getColorForCategory: getColorForCategory,
      categoryColorMapping: categoryColorMapping,
    }),
    [
      chartCommonProps,
      handleMainChartLoad,
      getColorForCategory,
      categoryColorMapping,
    ]
  );

  const compactChartProps = useMemo(
    () => ({
      ...chartCommonProps,
      titulo: (
        <div className="text-center">
          <div className="font-semibold text-gray-800">
            Comparación de Consumo por Categoría de Operación
          </div>
          <div className="text-xs text-gray-500 font-normal mt-1">
            Sin considerar Micro y considerando el 30% del consumo de las
            camionetas
          </div>
        </div>
      ),
      getColorForCategory: getColorForCategory,
      categoryColorMapping: categoryColorMapping,
    }),
    [chartCommonProps, getColorForCategory, categoryColorMapping]
  );

  // 🔧 CONDICIÓN MEJORADA PARA RENDERIZAR COMPACTO
  const shouldRenderCompact =
    mainChartLoaded && hasValidColorMapping && categoryCount > 0;

  console.log("🔍 Graficos: Evaluando renderizado de CompactChart:", {
    mainChartLoaded: mainChartLoaded,
    hasValidColorMapping: hasValidColorMapping,
    categoryCount: categoryCount,
    shouldRenderCompact: shouldRenderCompact,
    isInitialized: isInitialized,
  });

  // 🎨 JSX PRINCIPAL
  return (
    <div className="flex-1 overflow-auto bg-gray-50 mt-12">
      <UniversalHeader type="gerente" />

      <div className="py-6">
        {/* 🔧 MENSAJES DE ESTADO (RECUPERADOS DE LA VERSIÓN ORIGINAL) */}
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

        {/* 🔧 HEADER PRINCIPAL (ESTILO VERSIÓN ORIGINAL) */}
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
                      if (bloqueado) return; // Si está bloqueado, no hace nada
                      setVistaActiva(key); // Cambiar vista
                      setBloqueado(true); // Bloquear botones
                      setTimeout(() => setBloqueado(false), 10000); // Desbloquear en 10 seg
                    }}
                    disabled={bloqueado}
                    className={`px-3 py-1 rounded-md flex items-center justify-center transition-colors ${
                      vistaActiva === key
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

          {/* 🔧 FILTROS COMPONENT CON PROPS COMPATIBLES */}
          <div className="mb-6">
            <FiltrosComponent
              // Props en formato de la versión original
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
              // Props adicionales en formato de la versión optimizada
              onFaenaChange={manejarCambioFaena}
              onFechaChange={manejarCambioFecha}
              onHoraChange={manejarCambioHora}
            />
          </div>

          {/* 🎯 CONTENIDO SEGÚN VISTA ACTIVA */}
          {vistaActiva === "graficos" && (
            <div className="mt-6">
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <FiBarChart2 className="mr-2" style={{ color: "#F67029" }} />
                  Visualización de Datos
                </h3>

                {/* 🎨 TOP EQUIPOS CHART */}
                <div className="mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Top Equipos por Consumo
                    </h4>
                    <TopEquiposChart
                      {...chartCommonProps}
                      getColorForCategory={getColorForCategory}
                    />
                  </div>
                </div>

                {/* 🎨 GRÁFICO PRINCIPAL (ConsumptionPieChart) */}
                <div className="mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Consumo por Categoría de Máquinas
                    </h4>
                    <ConsumptionPieChart
                      {...consumptionPieChartProps}
                      key={`main-chart-${refreshTrigger}`}
                    />
                  </div>
                </div>

                {/* 🎨 GRÁFICO COMPACTO */}
                {shouldRenderCompact ? (
                  <div className="mb-6">
                    <CompactConsumptionPieChart
                      {...compactChartProps}
                      key={`compact-chart-${refreshTrigger}`}
                    />
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 mr-2"></div>
                        <p className="text-sm text-amber-700">
                          Esperando que el gráfico principal cargue los
                          colores...
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-amber-600 text-center">
                        Estado: mainChartLoaded={String(mainChartLoaded)},
                        categorías={categoryCount}
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎨 DASHBOARD COMPARATIVO */}
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

                    {fechaDesde && fechaHasta ? (
                      <DashboardComparativo {...chartCommonProps} />
                    ) : (
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

                {/* 🎨 TENDENCIA CHART */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Tendencia de Consumo
                  </h4>
                  <ConsumoTendenciaChart {...chartCommonProps} />
                </div>
              </div>
            </div>
          )}

          {/* 🔧 VISTA DE TABLAS (RECUPERADA DE LA VERSIÓN ORIGINAL) */}
          {vistaActiva === "tablas" && (
            <div className="space-y-6">
              {/* Tabla de consumo por máquina - ANCHO COMPLETO */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <FiBarChart2 className="mr-2" style={{ color: "#F67029" }} />
                  Consumo por Máquina
                </h3>
                <ConsumoPorMaquinaPureTable {...datosFinales} />
              </div>

              {/* Contenedor para las dos tablas en mitad y mitad */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tabla de consumo por faena - MITAD */}
                <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                  <ConsumoPorFaenaTable {...datosFinales} />
                </div>

                {/* Tabla de ingresos por faena - MITAD */}
                <div className="bg-white p-6 rounded-lg h-full">
                  <IngresosPorFaenaTable {...datosFinales} />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sección para contenido hijo (si existe) */}
        <section>{children}</section>
      </div>

      {/* 🔧 FOOTER (RECUPERADO DE LA VERSIÓN ORIGINAL) */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
        <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos
            reservados.
          </div>
          <div className="flex items-center">
            <span className="mr-2">Versión 0.0.1</span>
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

// 🎨 COMPONENTE PRINCIPAL CON PROVIDER
const Graficos = ({ children }) => {
  return (
    <ChartColorsProvider>
      <GraficosContent>{children}</GraficosContent>
    </ChartColorsProvider>
  );
};

export default React.memo(Graficos);
