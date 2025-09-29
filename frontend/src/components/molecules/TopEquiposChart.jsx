import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import {
  FiTruck,
  FiAlertTriangle,
  FiRefreshCw,
  FiBarChart2,
  FiDroplet,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiFilter,
} from "react-icons/fi";
import { consumoService } from "../../context/apiService";

const TopEquiposChart = ({
  faenaSeleccionada,
  fechaDesde,
  fechaHasta,
  refreshKey,
}) => {
  const [loading, setLoading] = useState(true);
  const [equiposData, setEquiposData] = useState([]);
  const [equiposCompletos, setEquiposCompletos] = useState([]);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({});
  const [fechaActualizacion, setFechaActualizacion] = useState(null);

  // 🆕 Estados para filtros y visualización
  const [mostrarSinDatos, setMostrarSinDatos] = useState(false);
  const [mostrarSoloConRendimiento, setMostrarSoloConRendimiento] =
    useState(false);
  const [filtroTipoMaquina, setFiltroTipoMaquina] = useState("todas"); // 🆕 todas/interna/externa
  const [filtroTipoMedicion, setFiltroTipoMedicion] = useState("todas"); // 🆕 todas/Horometro/Kilometraje
  const [limiteMostrar, setLimiteMostrar] = useState(15);
  const [ordenamiento, setOrdenamiento] = useState("consumo"); // 'consumo', 'rendimiento', 'nombre'

  // Usar useRef para evitar llamadas innecesarias a la API
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
  });

  const NARANJA_PRINCIPAL = "#f97316";
  const AZUL_SECUNDARIO = "#3b82f6";
  const VERDE_RENDIMIENTO = "#10b981";
  const GRIS_SIN_DATOS = "#9ca3af";
  const ROJO_DEFICIENTE = "#dc2626";

  // Función para verificar si los filtros han cambiado realmente
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed =
      prevF.faenaSeleccionada !== faenaSeleccionada ||
      prevF.fechaDesde !== fechaDesde ||
      prevF.fechaHasta !== fechaHasta ||
      prevF.refreshKey !== refreshKey ||
      !initialLoadDone.current;

    prevFilters.current = {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      refreshKey,
    };
    return changed;
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 🔧 NUEVA FUNCIÓN MEJORADA PARA CALCULAR DOMINIO Y - MEMOIZADA
  const calcularDominioY = useMemo(() => {
    if (!equiposData || equiposData.length === 0) {
      console.log("🔍 Dominio Y - Sin datos, usando [0, 100]");
      return [0, 100];
    }

    const consumos = equiposData.map((d) => d.consumo).filter((c) => c > 0);
    if (consumos.length === 0) {
      console.log("🔍 Dominio Y - No hay consumos, usando [0, 100]");
      return [0, 100];
    }

    const maxConsumo = Math.max(...consumos);
    const minConsumo = Math.min(...consumos);

    // 🔧 CÁLCULO MÁS PRECISO DEL MARGEN SUPERIOR
    let margenSuperior;
    if (maxConsumo <= 100) {
      margenSuperior = Math.max(20, maxConsumo * 0.25); // Mínimo 20 para valores muy pequeños
    } else if (maxConsumo <= 1000) {
      margenSuperior = maxConsumo * 0.2; // 20% para valores medianos
    } else {
      margenSuperior = maxConsumo * 0.15; // 15% para valores grandes
    }

    const maxCalculado = Math.ceil(maxConsumo + margenSuperior);

    console.log("🔍 Calculando dominio Y:", {
      equiposCount: equiposData.length,
      maxConsumo,
      minConsumo,
      margenSuperior,
      maxCalculado,
      dominio: [0, maxCalculado],
    });

    return [0, maxCalculado];
  }, [equiposData]); // 🔑 DEPENDENCIA: Se recalcula cuando cambian los datos filtrados

  // 🆕 Función para determinar el color de la barra según el rendimiento Y tipo de máquina
  const getBarColor = (item) => {
    if (item.consumo === 0) return GRIS_SIN_DATOS;

    // 🆕 Diferentes tonos para máquinas externas
    const esExterna = item.tipo_maquina === "externa";

    if (!item.rendimiento_sencillo) {
      return esExterna ? "#fb923c" : NARANJA_PRINCIPAL; // Naranja más claro para externas
    }

    const rendimiento = item.rendimiento_sencillo;
    if (rendimiento < 5) {
      return esExterna ? "#34d399" : VERDE_RENDIMIENTO; // Verde más claro para externas
    }
    if (rendimiento < 10) {
      return esExterna ? "#fb923c" : NARANJA_PRINCIPAL; // Naranja más claro para externas
    }
    return esExterna ? "#f87171" : ROJO_DEFICIENTE; // Rojo más claro para externas
  };

  // 🆕 Función para filtrar y ordenar datos
  const procesarDatos = (data) => {
    if (!data || data.length === 0) return [];

    let datosFiltrados = [...data];

    // Filtrar según opciones
    if (!mostrarSinDatos) {
      datosFiltrados = datosFiltrados.filter((item) => item.consumo > 0);
    }

    if (mostrarSoloConRendimiento) {
      datosFiltrados = datosFiltrados.filter(
        (item) => item.rendimiento_sencillo !== null
      );
    }

    // 🆕 NUEVOS FILTROS: Tipo de máquina y tipo de medición
    if (filtroTipoMaquina !== "todas") {
      datosFiltrados = datosFiltrados.filter(
        (item) => item.tipo_maquina === filtroTipoMaquina
      );
    }

    if (filtroTipoMedicion !== "todas") {
      datosFiltrados = datosFiltrados.filter(
        (item) => item.tipo_medicion === filtroTipoMedicion
      );
    }

    // Ordenar
    switch (ordenamiento) {
      case "rendimiento":
        datosFiltrados.sort((a, b) => {
          if (!a.rendimiento_sencillo && !b.rendimiento_sencillo) return 0;
          if (!a.rendimiento_sencillo) return 1;
          if (!b.rendimiento_sencillo) return -1;
          return b.rendimiento_sencillo - a.rendimiento_sencillo;
        });
        break;
      case "nombre":
        datosFiltrados.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "tipo":
        datosFiltrados.sort((a, b) => {
          if (a.tipo_maquina !== b.tipo_maquina) {
            return a.tipo_maquina === "interna" ? -1 : 1; // Internas primero
          }
          return b.consumo - a.consumo; // Luego por consumo
        });
        break;
      case "consumo":
      default:
        datosFiltrados.sort((a, b) => b.consumo - a.consumo);
        break;
    }

    // Aplicar límite
    return datosFiltrados.slice(0, limiteMostrar);
  };

  // Función para cargar los datos
  const loadData = async () => {
    if (!isMounted.current) return;

    try {
      setLoading(true);

      if (!fechaDesde || !fechaHasta) {
        setError("Por favor, seleccione un rango de fechas válido.");
        setEquiposData([]);
        setLoading(false);
        return;
      }

      if (new Date(fechaDesde) > new Date(fechaHasta)) {
        setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
        setEquiposData([]);
        setLoading(false);
        return;
      }

      console.log("TopEquiposChart: Llamando a la API con filtros:", {
        faenaSeleccionada,
        fechaDesde,
        fechaHasta,
      });

      // Llamada al servicio
      const response = await consumoService.getTopEquipos(
        faenaSeleccionada,
        fechaDesde,
        fechaHasta
      );

      if (!isMounted.current) return;

      // 🆕 Manejar la nueva estructura de respuesta
      const data = response.data || response;
      const stats = response.estadisticas || {};

      if (data && data.length > 0) {
        // Formatear datos
        const formattedData = data.map((item) => ({
          name: item.nombre || "Sin nombre",
          // 🆕 PATENTE: Solo máquinas internas tienen patente
          patente:
            item.tipo_maquina === "interna" ? item.patente || "S/P" : null,
          consumo: parseFloat(item.consumo || 0),
          medicion: parseFloat(item.horas_reales || item.medicion || 0),
          // 🆕 TIPO DE MEDICIÓN REAL DESDE CATEGORÍA (no hardcodeado)
          tipo_medicion: item.tipo_medicion || "Horometro",
          // 🆕 NUEVOS CAMPOS: tipo de máquina y categoría
          tipo_maquina: item.tipo_maquina || "interna",
          categoria: item.categoria || "Sin categoría",
          // 🆕 INFORMACIÓN ADICIONAL DE MÁQUINAS EXTERNAS
          empresa_externa: item.empresa_externa || null,
          nombre_contacto: item.nombre_contacto || null,
          rendimiento_sencillo:
            item.rendimiento_sencillo !== null &&
            item.rendimiento_sencillo !== undefined
              ? parseFloat(item.rendimiento_sencillo)
              : null,
          litros_confirmados: parseFloat(item.litros_confirmados || 0),
          horas_reales: parseFloat(item.horas_reales || 0),
          total_consumos: parseInt(item.total_consumos || 0),
          interpretacion_rendimiento:
            item.interpretacion_rendimiento || "Sin datos",
          id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`,
        }));

        setEquiposCompletos(formattedData);
        setEstadisticas(stats);
        setFechaActualizacion(new Date());
        setError(null);

        console.log(
          "✅ Datos cargados exitosamente:",
          formattedData.length,
          "equipos"
        );
      } else {
        setEquiposCompletos([]);
        setEstadisticas({});
        setError("No hay datos disponibles para mostrar");
      }
    } catch (err) {
      console.error("Error al cargar datos de equipos:", err);
      if (isMounted.current) {
        setEquiposCompletos([]);
        setEstadisticas({});
        setError(
          "No se pudieron cargar los datos de equipos. Por favor verifica la conexión con el servidor."
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  };

  // Procesar datos para mostrar cuando cambien los filtros locales
  useEffect(() => {
    const datosProcesados = procesarDatos(equiposCompletos);
    setEquiposData(datosProcesados);
    console.log(
      "🔄 Datos procesados para visualización:",
      datosProcesados.length,
      "equipos"
    );
  }, [
    equiposCompletos,
    mostrarSinDatos,
    mostrarSoloConRendimiento,
    filtroTipoMaquina,
    filtroTipoMedicion,
    limiteMostrar,
    ordenamiento,
  ]);

  // Effect para cargar datos cuando cambian los filtros
  useEffect(() => {
    if (filtersChanged()) {
      loadData();
    }
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // Función para reintentar la carga
  const handleRetry = () => {
    setError(null);
    loadData();
  };

  // 🆕 Tooltip personalizado mejorado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const esMedicionKm = data.tipo_medicion === "Kilometraje";
      const esExterna = data.tipo_maquina === "externa";

      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg min-w-64 max-w-80">
          <div className="font-semibold text-gray-800 mb-2 border-b pb-2 flex items-center justify-between">
            <span className="truncate">{data.name}</span>
            {/* 🆕 Badge de tipo de máquina */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                esExterna
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {esExterna ? "Externa" : "Propia"}
            </span>
          </div>

          <div className="space-y-2">
            {/* 🆕 PATENTE: Solo mostrar para máquinas internas */}
            {!esExterna && data.patente && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Patente:</span>
                <span className="font-medium">{data.patente}</span>
              </div>
            )}

            {/* 🆕 Información específica según tipo de máquina */}
            {esExterna && data.empresa_externa && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Empresa:</span>
                <span className="font-medium text-purple-700 text-sm truncate">
                  {data.empresa_externa}
                </span>
              </div>
            )}

            {esExterna && data.nombre_contacto && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Contacto:</span>
                <span className="font-medium text-gray-700 text-sm truncate">
                  {data.nombre_contacto}
                </span>
              </div>
            )}

            {/* 🆕 Categoría */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Categoría:</span>
              <span className="font-medium text-gray-700">
                {data.categoria}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Consumo:</span>
              <span className="font-medium text-orange-600">
                {data.consumo.toLocaleString("es-CL")} L
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {esMedicionKm ? "Kilometraje" : "Horometro"}:
              </span>
              <span className="font-medium text-blue-600">
                {data.medicion.toFixed(1)} {esMedicionKm ? "km" : "h"}
              </span>
            </div>

            {data.rendimiento_sencillo !== null ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rendimiento:</span>
                <span className="font-medium text-green-600">
                  {data.rendimiento_sencillo.toFixed(2)} L/
                  {esMedicionKm ? "km" : "h"}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Rendimiento:</span>
                <span className="text-sm text-gray-400 italic">
                  No calculable
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500 italic border-t pt-2">
              {data.interpretacion_rendimiento}
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div>
                Litros confirmados:{" "}
                {data.litros_confirmados.toLocaleString("es-CL")} L
              </div>
              <div>Total consumos: {data.total_consumos}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // 🆕 Componente de estadísticas - MOBILE FRIENDLY
  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "text-gray-700",
    bgColor = "bg-gray-50",
  }) => (
    <div className={`${bgColor} rounded-lg p-3 lg:p-4 border border-gray-200`}>
      <div className="flex items-center">
        <Icon className={`${color} mr-2 lg:mr-3 flex-shrink-0`} size={16} />
        <div className="min-w-0 flex-1">
          <p className="text-xs lg:text-sm text-gray-600 truncate">{title}</p>
          <p className={`text-base lg:text-lg font-semibold ${color} truncate`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  // 🆕 Componente personalizado para etiquetas de datos
  const CustomLabel = (props) => {
    const { x, y, width, height, value } = props;

    if (!value || value === 0) return null;

    const labelX = x + width / 2;
    const labelY = y - 8; // Posición arriba de la barra

    // Formatear el valor para la etiqueta
    let displayValue;
    if (value >= 1000) {
      displayValue = `${value}L`;
    } else {
      displayValue = `${Math.round(value)}L`;
    }

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

  return (
    <div className="w-full space-y-6">
      {loading ? (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de equipos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex flex-col items-center justify-center text-center bg-red-50 rounded-lg border border-red-200">
          <FiAlertTriangle size={40} className="text-red-500 mb-4" />
          <div className="text-red-700 mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* 🆕 ESTADÍSTICAS GENERALES - MOBILE FRIENDLY CON EMPRESAS EXTERNAS */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
            <StatCard
              icon={FiTruck}
              title="Total Equipos"
              value={estadisticas.total_equipos || equiposCompletos.length}
              subtitle="En el sistema"
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={FiBarChart2}
              title="Propias"
              value={
                estadisticas.equipos_internos ||
                equiposCompletos.filter((e) => e.tipo_maquina === "interna")
                  .length
              }
              subtitle="Máquinas internas"
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={FiTruck}
              title="Externas"
              value={
                estadisticas.equipos_externos ||
                equiposCompletos.filter((e) => e.tipo_maquina === "externa")
                  .length
              }
              subtitle="De terceros"
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <StatCard
              icon={FiAlertTriangle}
              title="Sin Datos"
              value={
                estadisticas.equipos_sin_datos ||
                equiposCompletos.filter((e) => e.total_consumos <= 1).length
              }
              subtitle="Requieren más"
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              icon={FiDroplet}
              title="Consumo Total"
              value={`${Number(
                estadisticas.consumo_total_periodo ||
                  equiposCompletos.reduce((sum, e) => sum + e.consumo, 0)
              ).toFixed(2)} L`}
              subtitle="En el período"
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
            {/* 🆕 Nueva estadística: Empresas externas */}
            {estadisticas.empresas_externas > 0 && (
              <StatCard
                icon={FiInfo}
                title="Empresas"
                value={estadisticas.empresas_externas || 0}
                subtitle="Externas"
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
            )}
          </div>

          {/* 🆕 CONTROLES DE FILTRADO Y VISUALIZACIÓN - MOBILE FRIENDLY */}
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center space-x-2">
                <FiFilter className="text-gray-500" size={16} />
                <span className="text-sm font-medium text-gray-700">
                  Filtros:
                </span>
              </div>

              {/* Controles en grid para mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarSinDatos}
                    onChange={(e) => setMostrarSinDatos(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-600">
                    Mostrar equipos sin datos
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarSoloConRendimiento}
                    onChange={(e) =>
                      setMostrarSoloConRendimiento(e.target.checked)
                    }
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-600">
                    Solo con rendimiento
                  </span>
                </label>

                {/* 🆕 NUEVO: Filtro por tipo de máquina */}
                <select
                  value={filtroTipoMaquina}
                  onChange={(e) => setFiltroTipoMaquina(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                >
                  <option value="todas">Todas las máquinas</option>
                  <option value="interna">Solo propias</option>
                  <option value="externa">Solo externas</option>
                </select>

                {/* 🆕 NUEVO: Filtro por tipo de medición */}
                <select
                  value={filtroTipoMedicion}
                  onChange={(e) => setFiltroTipoMedicion(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                >
                  <option value="todas">Todos los tipos</option>
                  <option value="Horometro">Horómetro</option>
                  <option value="Kilometraje">Kilometraje</option>
                </select>

                <select
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                >
                  <option value="consumo">Por Consumo</option>
                  <option value="rendimiento">Por Rendimiento</option>
                  <option value="tipo">Por Tipo</option>
                  <option value="nombre">Por Nombre</option>
                </select>

                <select
                  value={limiteMostrar}
                  onChange={(e) => setLimiteMostrar(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                >
                  <option value={15}>15 equipos</option>
                  <option value={30}>30 equipos</option>
                  <option value={50}>50 equipos</option>
                  <option value={1000}>Todos</option>
                </select>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Mostrando {equiposData.length} de {equiposCompletos.length}{" "}
              equipos
            </div>
          </div>

          {/* 🆕 GRÁFICO PRINCIPAL - MOBILE FRIENDLY */}
          {equiposData.length > 0 ? (
            <div className="w-full">
              {/* Altura dinámica que se adapta al contenido y tamaño de pantalla */}
              <div
                style={{
                  width: "100%",
                  height: Math.max(300, Math.min(600, equiposData.length * 35)),
                  minHeight: "300px",
                }}
                className="overflow-x-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={equiposData}
                    margin={{
                      top: 40,
                      right: 10, // Menos margen en mobile
                      left: 10, // Menos margen en mobile
                      bottom: 60, // Más espacio para labels rotados
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: "#374151", fontSize: 10 }} // Fuente más pequeña en mobile
                      axisLine={{ stroke: "#d1d5db" }}
                      tickLine={{ stroke: "#d1d5db" }}
                      interval={0} // Mostrar todas las etiquetas
                    />
                    {/* 🔧 EJE Y CORREGIDO CON DOMINIO MEMOIZADO */}
                    <YAxis
                      tick={{ fill: "#374151", fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                      tickLine={{ stroke: "#d1d5db" }}
                      tickFormatter={(value) => value}
                      width={60} // Menos ancho en mobile
                      domain={calcularDominioY} // 🔧 USAR EL DOMINIO MEMOIZADO
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(0,0,0,0.1)" }}
                      offset={35} // 👈 Mueve el tooltip 50px a la derecha
                      position={{ x: undefined, y: undefined }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="rect"
                      wrapperStyle={{
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    />

                    <Bar
                      dataKey="consumo"
                      name="Consumo (Litros)"
                      maxBarSize={50} // Barras más delgadas en mobile
                      radius={[2, 2, 0, 0]}
                    >
                      {/* 🆕 ETIQUETAS DE DATOS - Solo para valores > 0 */}
                      <LabelList
                        dataKey="consumo"
                        position="top"
                        content={<CustomLabel />}
                      />
                      {/* Colores dinámicos según rendimiento */}
                      {equiposData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 🆕 Indicador de scroll horizontal en mobile */}
              <div className="sm:hidden mt-2 text-center">
                <p className="text-xs text-gray-500">
                  ← Desliza horizontalmente para ver más equipos →
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <FiInfo size={40} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No hay equipos que mostrar con los filtros actuales
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Intenta ajustar los filtros o mostrar equipos sin datos
                </p>
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
};

export default TopEquiposChart;
