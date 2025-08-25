import { useState, useEffect, useMemo } from "react";
import axios from "../../../lib/axios";

import UniversalHeader from "../Todos/UniversalHeader";

import {
  FiDroplet,
  FiLoader,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
  FiBarChart2,
  FiArrowLeft,
  FiArrowRight,
  FiPieChart,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

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

const Graficos = ({ children }) => {
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

  // 🎨 PALETA DE COLORES (para fallback en handleMainChartLoad)
  const CHART_COLORS = [
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
  ];

  // Estados para fechas - MODIFICADO PARA MOSTRAR MES ACTUAL HASTA HOY
  const fechaActual = new Date();

  // 🗓️ OBTENER EL PRIMER DÍA DEL MES ACTUAL
  const primerDiaMesActual = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    1
  );

  // 🗓️ USAR EL DÍA ACTUAL COMO FECHA FINAL
  const diaActual = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    fechaActual.getDate()
  );

  console.log("📅 Graficos: Configurando fechas por defecto:", {
    fechaActual: fechaActual.toISOString().split("T")[0],
    primerDiaMesActual: primerDiaMesActual.toISOString().split("T")[0],
    diaActual: diaActual.toISOString().split("T")[0],
    mesActual: fechaActual.getMonth() + 1,
    añoActual: fechaActual.getFullYear(),
    diaDelMes: fechaActual.getDate(),
  });

  const [fechaDesde, setFechaDesde] = useState(
    primerDiaMesActual.toISOString().split("T")[0]
  );
  const [fechaHasta, setFechaHasta] = useState(
    diaActual.toISOString().split("T")[0]
  );

  // 🎨 ESTADOS PARA MANEJO DE COLORES CONSISTENTES - SIMPLIFICADOS
  const [categoryColorMapping, setCategoryColorMapping] = useState({});
  const [mainChartLoaded, setMainChartLoaded] = useState(false);

  // Función para formatear fecha y hora
  const formatearFechaHora = (fecha, hora) => {
    return `${fecha} ${hora}:00`;
  };

  // Función para formatear periodo
  const formatearPeriodo = () => {
    const inicio = new Date(fechaDesde);
    const fin = new Date(fechaHasta);

    const formatoCorto = { month: "short", day: "numeric" };
    const inicioStr = inicio.toLocaleDateString("es-ES", formatoCorto);
    const finStr = fin.toLocaleDateString("es-ES", formatoCorto);

    return `${inicioStr} - ${finStr}`;
  };

  // 🎨 FUNCIÓN PARA OBTENER COLOR POR NOMBRE DE CATEGORÍA
  const getColorForCategory = (categoryName) => {
    const color = categoryColorMapping[categoryName];

    console.log(`🎨 Graficos: getColorForCategory("${categoryName}")`, {
      found: !!color,
      color: color || "NO ENCONTRADO",
      availableCategories: Object.keys(categoryColorMapping),
      mappingLength: Object.keys(categoryColorMapping).length,
    });

    if (color) {
      console.log(
        `🎨 Graficos: ✅ Color encontrado para "${categoryName}": ${color}`
      );
      return color;
    }

    console.warn(`🎨 Graficos: ❌ No se encontró color para "${categoryName}"`);
    console.warn(
      `🎨 Graficos: Categorías disponibles:`,
      Object.keys(categoryColorMapping)
    );
    return "#64748b"; // Color por defecto (slate-500)
  };

  // 🎨 CALLBACK: Cuando ConsumptionPieChart carga y asigna colores - MEJORADO
  const handleMainChartLoad = (categoriasConColores) => {
    console.log(
      "🎨 Graficos: ConsumptionPieChart notificó categorías con colores:",
      categoriasConColores
    );

    // 🔧 VALIDAR QUE TENEMOS DATOS VÁLIDOS
    if (
      !categoriasConColores ||
      !Array.isArray(categoriasConColores) ||
      categoriasConColores.length === 0
    ) {
      console.warn("🎨 Graficos: Datos de categorías inválidos o vacíos");
      return;
    }

    // 🔧 CREAR MAPEO DE COLORES BASADO EN LO QUE DEVUELVE ConsumptionPieChart
    const newMapping = {};

    categoriasConColores.forEach((categoria, index) => {
      const categoryName =
        categoria.name || categoria.nombre || "Sin categoría";

      // 🎨 OBTENER COLOR DEL ConsumptionPieChart
      // Puede venir en diferentes propiedades según cómo se asigne
      const color =
        categoria.color || categoria.assignedColor || categoria.chartColor;

      if (color) {
        newMapping[categoryName] = color;
        console.log(`🎨 Graficos: Mapeando "${categoryName}" → ${color}`);
      } else {
        // 🔧 FALLBACK: Si no viene color, usar la paleta por índice
        // ConsumptionPieChart debería haber asignado los colores por participación
        console.warn(
          `🎨 Graficos: Sin color para "${categoryName}", generando fallback`
        );
        // Como el array ya viene ordenado por participación, usar el índice
        const fallbackColor = CHART_COLORS[index % CHART_COLORS.length];
        newMapping[categoryName] = fallbackColor;
        console.log(
          `🎨 Graficos: Color fallback para "${categoryName}" → ${fallbackColor}`
        );
      }
    });

    console.log("🎨 Graficos: Mapeo ANTES de guardar:", newMapping);
    console.log(
      "🎨 Graficos: Número de categorías mapeadas:",
      Object.keys(newMapping).length
    );

    // 🔧 SOLO ACTUALIZAR SI REALMENTE HAY CAMBIOS
    const hasValidMapping = Object.keys(newMapping).length > 0;

    if (hasValidMapping) {
      setCategoryColorMapping(newMapping);
      setMainChartLoaded(true);

      console.log("🎨 Graficos: ✅ Mapeo actualizado exitosamente");
      console.log("🎨 Graficos: ✅ mainChartLoaded establecido a true");
      console.log("🎨 Graficos: Mapeo final de colores:", newMapping);
    } else {
      console.warn("🎨 Graficos: ❌ No se pudo crear un mapeo válido");
    }
  };

  // 🎨 RESETEAR cuando cambian filtros importantes - CORREGIDO PARA FECHAS
  useEffect(() => {
    console.log(
      "🔄 Graficos: Detectando cambio de filtros importantes (incluyendo fechas)"
    );
    console.log(
      "🔄 Graficos: Reseteando estados de colores para nueva consulta"
    );

    // 🔧 RESETEAR AMBOS ESTADOS cuando cambian los filtros
    // Esto fuerza a que ConsumptionPieChart notifique nuevos colores
    setCategoryColorMapping({});
    setMainChartLoaded(false);

    console.log(
      "🔄 Graficos: Reset completo - esperando nuevos datos y colores"
    );
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshTrigger]); // 🔧 INCLUIR FECHAS

  // 🔧 USEEFFECT ADICIONAL PARA DEBUGGING DE CAMBIOS DE FECHAS
  useEffect(() => {
    console.log("📅 Graficos: Cambio detectado en fechas:", {
      fechaDesde,
      fechaHasta,
      categoryColorMappingLength: Object.keys(categoryColorMapping).length,
      mainChartLoaded,
    });
  }, [fechaDesde, fechaHasta]);

  // 🔧 USEEFFECT PARA MONITOREAR CAMBIOS EN categoryColorMapping
  useEffect(() => {
    console.log("🎨 Graficos: categoryColorMapping cambió:", {
      length: Object.keys(categoryColorMapping).length,
      mapping: categoryColorMapping,
      mainChartLoaded,
    });
  }, [categoryColorMapping]);

  // Cargar faenas con manejo robusto de la estructura de respuesta
  useEffect(() => {
    const cargarFaenas = async () => {
      try {
        console.log("🏭 Iniciando carga de faenas...");

        const response = await axios.get("/api/faenas");
        console.log(
          "📊 Respuesta completa del endpoint /api/faenas:",
          response.data
        );

        let faenasData = null;

        // Verificar diferentes estructuras de respuesta
        if (response.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            faenasData = response.data.data;
            console.log(
              "✅ Estructura encontrada: response.data.data (con wrapper)"
            );
          } else if (Array.isArray(response.data)) {
            faenasData = response.data;
            console.log(
              "✅ Estructura encontrada: response.data (array directo)"
            );
          } else if (
            response.data.faenas &&
            Array.isArray(response.data.faenas)
          ) {
            faenasData = response.data.faenas;
            console.log("✅ Estructura encontrada: response.data.faenas");
          } else {
            console.warn(
              "⚠️ Estructura de respuesta no reconocida:",
              response.data
            );
            console.log(
              "🔍 Propiedades disponibles:",
              Object.keys(response.data)
            );
          }
        }

        // Procesar las faenas si se encontraron
        if (faenasData && Array.isArray(faenasData) && faenasData.length > 0) {
          console.log(
            `🏭 Procesando ${faenasData.length} faenas encontradas:`,
            faenasData
          );

          // Formatear faenas para el selector
          const faenasFormateadas = faenasData.map((faena) => {
            console.log("🏭 Procesando faena:", faena);

            return {
              id_faena: faena.id_faena || faena.id || 0,
              value: (faena.id_faena || faena.id || 0).toString(),
              ubicacion:
                faena.ubicacion ||
                faena.nombre ||
                faena.name ||
                `Faena ${faena.id_faena || faena.id}`,
              label:
                faena.ubicacion ||
                faena.nombre ||
                faena.name ||
                `Faena ${faena.id_faena || faena.id}`,
              nombre: faena.nombre || faena.ubicacion,
              activo: faena.activo !== false,
            };
          });

          console.log(
            "✅ Faenas formateadas para el selector:",
            faenasFormateadas
          );
          setFaenas(faenasFormateadas);

          // Seleccionar automáticamente la primera faena si no hay ninguna seleccionada
          if (faenaSeleccionada === "todas" && faenasFormateadas.length === 1) {
            console.log(
              "🎯 Solo hay una faena, seleccionándola automáticamente"
            );
            setFaenaSeleccionada(faenasFormateadas[0].value);
          }
        } else {
          console.warn("⚠️ No se encontraron faenas válidas");
          setFaenas([]);
        }
      } catch (error) {
        console.error("❌ Error completo al cargar faenas:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          url: error.config?.url,
        });

        if (error.response) {
          console.error("🔴 Error de respuesta del servidor:", {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else if (error.request) {
          console.error("🔴 Error de red (sin respuesta):", error.request);
        } else {
          console.error("🔴 Error de configuración:", error.message);
        }

        setFaenas([]);
        setError(
          "No se pudieron cargar las faenas disponibles. Verifique su conexión."
        );
      }
    };

    cargarFaenas();
  }, []);

  // Función para refrescar datos
  const refrescarDatos = () => {
    setCargando(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
    setUltimaActualizacion(new Date());

    setTimeout(() => {
      setCargando(false);
      setMensajeExito("Datos actualizados correctamente");
      setTimeout(() => setMensajeExito(null), 3000);
    }, 1000);
  };

  // Datos finales para pasar a los componentes
  const datosFinales = useMemo(() => {
    return {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      horaDesde,
      horaHasta,
      fechaInicioFormateada: formatearFechaHora(fechaDesde, horaDesde),
      fechaFinFormateada: formatearFechaHora(fechaHasta, horaHasta),
    };
  }, [fechaDesde, fechaHasta, horaDesde, horaHasta]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 mt-12">
      <UniversalHeader type="gerente" />
      <div className="py-6">
        {/* Mensajes de estado */}
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
                <FiX className="h-6 w-6 mr-4" style={{ color: "#AB201A" }} />
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
                  className="h-6 w-6 mr-4"
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

        {/* Sección principal */}
        <section className="">
          <div className="flex justify-between items-center mb-3 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDroplet className="mr-2" style={{ color: "#F67029" }} />
              Dashboard Operacional{" "}
            </h2>

            <div className="flex items-center space-x-4">
              {/* Selector de vista */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setVistaActiva("graficos")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    vistaActiva === "graficos"
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    vistaActiva === "graficos"
                      ? { backgroundColor: "#F67029" }
                      : {}
                  }
                >
                  Gráficos
                </button>
                <button
                  onClick={() => setVistaActiva("tablas")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    vistaActiva === "tablas"
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    vistaActiva === "tablas"
                      ? { backgroundColor: "#F67029" }
                      : {}
                  }
                >
                  Tablas
                </button>
              </div>

              {/* Botón de refrescar */}
              <button
                onClick={refrescarDatos}
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

          {/* Filtros */}
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
            />
          </div>

          {/* Vista de tablas */}
          {vistaActiva === "tablas" && (
            <>
              <div className="space-y-6">
                {/* Tabla de consumo por máquina - ANCHO COMPLETO */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                    <FiBarChart2
                      className="mr-2"
                      style={{ color: "#F67029" }}
                    />
                    Consumo por Máquina
                  </h3>
                  <ConsumoPorMaquinaPureTable
                    {...datosFinales}
                    refreshKey={refreshTrigger}
                  />
                </div>

                {/* Contenedor para las dos tablas en mitad y mitad */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
                  {/* Tabla de consumo por faena - MITAD */}
                  <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                    <ConsumoPorFaenaTable
                      {...datosFinales}
                      refreshKey={refreshTrigger}
                    />
                  </div>

                  {/* Tabla de ingresos por faena - MITAD */}
                  <div className="bg-white p-6 rounded-lg   h-full ">
                    <IngresosPorFaenaTable
                      {...datosFinales}
                      refreshKey={refreshTrigger}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {/* Vista de gráficos */}
          {vistaActiva === "graficos" && (
            <>
              <div className="mt-6">
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                    <FiBarChart2
                      className="mr-2"
                      style={{ color: "#F67029" }}
                    />
                    Visualización de Datos
                  </h3>

                  {/* TOP EQUIPOS CHART */}
                  <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Top Equipos por Consumo
                      </h4>
                      {fechaDesde && fechaHasta && (
                        <TopEquiposChart
                          faenaSeleccionada={faenaSeleccionada}
                          fechaDesde={fechaDesde}
                          fechaHasta={fechaHasta}
                          horaDesde={horaDesde}
                          horaHasta={horaHasta}
                          refreshKey={refreshTrigger}
                          // 🎨 PASAR LOS COLORES YA ASIGNADOS
                          getColorForCategory={getColorForCategory}
                        />
                      )}
                    </div>
                  </div>

                  {/* 🎨 GRÁFICO PRINCIPAL - ConsumptionPieChart ASIGNA LOS COLORES */}
                  <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Consumo por Categoría de Máquinas
                      </h4>
                      {fechaDesde && fechaHasta && (
                        <ConsumptionPieChart
                          faenaSeleccionada={faenaSeleccionada}
                          fechaDesde={fechaDesde}
                          fechaHasta={fechaHasta}
                          refreshKey={refreshTrigger}
                          onCategoriesLoad={handleMainChartLoad} // 👈 Recibe colores asignados por participación
                        />
                      )}
                    </div>
                  </div>

                  {/* 🎨 GRÁFICO COMPACTO - USA LOS COLORES ASIGNADOS POR ConsumptionPieChart */}
                  {(() => {
                    // 🔧 CONDICIÓN MEJORADA: Verificar que tenemos datos válidos para renderizar
                    const hasValidColorMapping =
                      Object.keys(categoryColorMapping).length > 0;
                    const shouldRenderCompact = hasValidColorMapping; // Simplificar la condición

                    console.log(
                      "🔍 Graficos: Evaluando renderizado de CompactChart:",
                      {
                        mainChartLoaded,
                        categoryColorMappingKeys:
                          Object.keys(categoryColorMapping),
                        categoryColorMappingLength:
                          Object.keys(categoryColorMapping).length,
                        hasValidColorMapping,
                        shouldRenderCompact,
                        categoryColorMappingObject: categoryColorMapping,
                      }
                    );

                    if (shouldRenderCompact) {
                      console.log(
                        "🔍 Graficos: ✅ RENDERIZANDO CompactConsumptionPieChart con props:",
                        {
                          faenaSeleccionada,
                          fechaDesde,
                          fechaHasta,
                          refreshKey: refreshTrigger,
                          categoryColorMappingKeys:
                            Object.keys(categoryColorMapping),
                          getColorForCategoryFunction: !!getColorForCategory,
                        }
                      );
                      return (
                        <div className="mb-6">
                          
                          <CompactConsumptionPieChart
                            faenaSeleccionada={faenaSeleccionada}
                            fechaDesde={fechaDesde}
                            fechaHasta={fechaHasta}
                            refreshKey={refreshTrigger}
                            titulo={
                              <div className="text-center">
                                <div className="font-semibold text-gray-800">
                                  Comparación de Consumo por Categoría de
                                  Operación
                                </div>
                                <div className="text-xs text-gray-500 font-normal mt-1">
                                  Sin considerar Micro y considerando el 30% del
                                  consumo de las camionetas
                                </div>
                              </div>
                            }
                            // 🎨 PASAR LA FUNCIÓN PARA OBTENER COLORES CONSISTENTES
                            getColorForCategory={getColorForCategory}
                            categoryColorMapping={categoryColorMapping}
                          />
                        </div>
                      );
                    } else {
                      console.log(
                        "🔍 Graficos: ❌ NO renderizando CompactChart. Análisis detallado:",
                        {
                          mainChartLoaded: mainChartLoaded
                            ? "✅ TRUE"
                            : "❌ FALSE",
                          categoryColorMappingLength:
                            Object.keys(categoryColorMapping).length,
                          hasValidColorMapping: hasValidColorMapping
                            ? "✅ TRUE"
                            : "❌ FALSE",
                          categoryColorMappingContent: categoryColorMapping,
                          waitingForColors:
                            Object.keys(categoryColorMapping).length === 0
                              ? "⏳ ESPERANDO COLORES"
                              : "✅ TIENE COLORES",
                        }
                      );

                      // 🔧 MOSTRAR INDICADOR DE CARGA MIENTRAS ESPERAMOS COLORES
                      if (Object.keys(categoryColorMapping).length === 0) {
                        return (
                          <div className="mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                                <p className="text-sm text-blue-700">
                                  Esperando asignación de colores
                                  consistentes...
                                </p>
                              </div>
                              <div className="mt-2 text-xs text-blue-600">
                                Estado: mainChartLoaded=
                                {mainChartLoaded.toString()}, colores=
                                {Object.keys(categoryColorMapping).length}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    }
                  })()}

                  {/* Mensaje informativo solo si no hay colores después de mucho tiempo */}
                  {!mainChartLoaded &&
                    Object.keys(categoryColorMapping).length === 0 && (
                      <div className="mb-6">
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 mr-2"></div>
                            <p className="text-sm text-amber-700">
                              Cargando gráfico principal para análisis
                              comparativo...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  {!mainChartLoaded && (
                    <div className="mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                          <p className="text-sm text-blue-700">
                            Cargando gráfico principal y asignando colores
                            consistentes...
                          </p>
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                          Colores asignados:{" "}
                          {Object.keys(categoryColorMapping).length} categorías
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="ml-2">Dashboard Comparativo</span>
                          </h3>
                        </div>

                        {/* Indicador del período anterior */}
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Comparando con:
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            Mes Anterior
                          </p>
                        </div>
                      </div>

                      {fechaDesde && fechaHasta ? (
                        <DashboardComparativo
                          faenaSeleccionada={faenaSeleccionada}
                          fechaDesde={fechaDesde}
                          fechaHasta={fechaHasta}
                          refreshKey={refreshTrigger}
                          chartColors={CHART_COLORS}
                        />
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

                  {/* TENDENCIA */}
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Tendencia de Consumo
                    </h4>
                    {faenaSeleccionada && (
                      <ConsumoTendenciaChart
                        faenaSeleccionada={faenaSeleccionada}
                        fechaDesde={fechaDesde}
                        fechaHasta={fechaHasta}
                        horaDesde={horaDesde}
                        horaHasta={horaHasta}
                        refreshKey={refreshTrigger}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Sección para contenido hijo (si existe) */}
        <section>{children}</section>
      </div>

      {/* Footer */}
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

export default Graficos;
