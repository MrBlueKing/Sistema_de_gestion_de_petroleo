import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "../../../lib/axios";
import Header from "../../organisms/Gerente/Header";
import KpiDashboardAdapter from "../../molecules/KpiAdapter";
import KpiToggleSection from "../../atoms/Button/KpiToggleSection";
import { FaChartBar, FaRocket, FaTachometerAlt } from "react-icons/fa";
import {
  FiTruck, FiDroplet, FiClock, FiCalendar,
  FiFilter, FiRefreshCw, FiInfo, FiAlertTriangle,
  FiTrendingUp, FiActivity, FiTarget
} from "react-icons/fi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

// Importar el componente de filtros
import FiltrosComponent from "../../molecules/FiltrosComponent";

// Función helper para formatear números de forma segura
const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return parseFloat(value).toLocaleString();
};

// Función helper para validar si un valor es válido
const isValidNumber = (value) => {
  return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
};

// Componente personalizado para formatear etiquetas del eje X
const CustomizedAxisTick = ({ x, y, payload }) => {
  const match = payload.value.match(/\((.*?)\)/);
  const fecha = match ? match[1] : payload.value;

  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    } catch (e) {
      return fechaStr;
    }
  };

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#6b7280"
        fontSize={11}
        transform="rotate(-35)"
      >
        {formatearFecha(fecha)}
      </text>
    </g>
  );
};

// Componente principal
function MainSimulacion() {
  // Estados para fechas y selección
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [faenaSeleccionada, setFaenaSeleccionada] = useState('todas');
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
  const [diasProyeccion, setDiasProyeccion] = useState(7);

  // Estados para datos
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [todasLasMaquinas, setTodasLasMaquinas] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [datosProyeccion, setDatosProyeccion] = useState(null);
  const [maquinaDetalles, setMaquinaDetalles] = useState(null);

  // Referencias para el gráfico
  const graficoRef = useRef(null);

  // Efecto para cargar faenas al inicio
  useEffect(() => {
    cargarFaenas();
  }, []);

  // Función para cargar faenas
  const cargarFaenas = async () => {
    try {
      const response = await axios.get("/api/faenas");

      console.log("Respuesta completa:", response);
      console.log("response.data:", response.data);

      let faenasData = response.data;

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        faenasData = response.data.data;
      } else if (Array.isArray(response.data)) {
        faenasData = response.data;
      } else if (response.data && response.data.faenas && Array.isArray(response.data.faenas)) {
        faenasData = response.data.faenas;
      }

      if (Array.isArray(faenasData) && faenasData.length > 0) {
        const opcionesFaenas = [
          { value: "todas", label: "Todas las faenas" },
          ...faenasData.map(faena => ({
            value: faena.id_faena.toString(),
            label: faena.ubicacion
          }))
        ];
        setFaenas(opcionesFaenas);
        console.log("Faenas cargadas correctamente:", opcionesFaenas);
      } else {
        console.error("Los datos no son un array válido:", faenasData);
        console.error("Tipo de datos:", typeof faenasData);
        setError("Formato de respuesta de faenas incorrecto");
      }
    } catch (err) {
      console.error("Error al cargar faenas:", err);
      setError("No se pudieron cargar las faenas. Por favor, intente de nuevo.");
    }
  };

  // Efecto para cargar proyección cuando cambian las fechas o faena
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarDatosProyeccion();
    }
  }, [fechaDesde, fechaHasta, faenaSeleccionada, diasProyeccion]);

  // Función para cargar datos de proyección
  const cargarDatosProyeccion = async () => {
    if (!fechaDesde || !fechaHasta) return;

    setCargando(true);
    setError(null);

    try {
      const response = await axios.get("/api/proyeccion-consumo", {
        params: {
          desde: fechaDesde,
          hasta: fechaHasta,
          faena: faenaSeleccionada,
          dias_proyeccion: diasProyeccion
        }
      });

      console.log("Respuesta de proyección:", response.data);

      if (response.data && response.data.status === "success") {
        setDatosProyeccion(response.data.data);

        const opcionesMaquinas = response.data.data.maquinas.map(maquina => ({
          value: maquina.id,
          label: `${maquina.nombre} (${maquina.patente || "Sin patente"})`,
          tipo: maquina.tipo_medicion,
          datos: maquina
        }));

        setTodasLasMaquinas(opcionesMaquinas);

        if (!maquinaSeleccionada || !opcionesMaquinas.find(m => m.value === maquinaSeleccionada.value)) {
          if (opcionesMaquinas.length > 0) {
            setMaquinaSeleccionada(opcionesMaquinas[0]);
            setMaquinaDetalles(opcionesMaquinas[0].datos);
          } else {
            setMaquinaSeleccionada(null);
            setMaquinaDetalles(null);
          }
        }
      } else {
        console.error("Respuesta inválida:", response.data);
        setError("Respuesta inválida del servidor");
      }
    } catch (err) {
      console.error("Error al cargar proyección:", err);
      setError(`Error: ${err.message || "No se pudo cargar la proyección"}`);
    } finally {
      setCargando(false);
    }
  };

  // Manejar cambio de máquina seleccionada
  const handleChangeMaquina = useCallback((opcion) => {
    setMaquinaSeleccionada(opcion);
    const maquinaData = datosProyeccion?.maquinas.find(m => m.id === opcion.value);
    setMaquinaDetalles(maquinaData);
  }, [datosProyeccion]);

  // Cálculos para la máquina seleccionada
  const calculos = useMemo(() => {
    if (!maquinaDetalles) return null;

    const safeGetValue = (obj, path, defaultValue = 0) => {
      const value = path.split('.').reduce((o, p) => o && o[p], obj);
      return isValidNumber(value) ? value : defaultValue;
    };

    return {
      mediciones: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'medicion')) || [],
      cargas: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'carga')) || [],
      diferenciaMedicionDiaria: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'diferencia_medicion_diaria')) || [],
      consumoRealDiario: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'consumo_real_diario')) || [],
      
      totalDiferenciaMedicion: safeGetValue(maquinaDetalles, 'datos_totales.total_diferencia_medicion'),
      totalConsumo: safeGetValue(maquinaDetalles, 'datos_totales.total_consumo_real'),
      rendimiento: safeGetValue(maquinaDetalles, 'datos_totales.rendimiento'),
      promedioDiferenciaMedicionDiaria: safeGetValue(maquinaDetalles, 'datos_totales.promedio_diferencia_medicion_diaria'),
      consumoSimuladoDiario: safeGetValue(maquinaDetalles, 'datos_totales.consumo_simulado_diario'),
      
      simulacion: maquinaDetalles.detalle_proyeccion || [],
      diasRegistrados: safeGetValue(maquinaDetalles, 'datos_totales.total_registros', 0) - 1,

      datosEnRango: {
        consumoReal: safeGetValue(maquinaDetalles, 'datos_en_rango.consumo_real'),
        diferenciaMedicion: safeGetValue(maquinaDetalles, 'datos_en_rango.diferencia_medicion'),
        consumoProyectado: safeGetValue(maquinaDetalles, 'datos_en_rango.consumo_proyectado'),
        diferenciaMedicionProyectada: safeGetValue(maquinaDetalles, 'datos_en_rango.diferencia_medicion_proyectada'),
        consumoTotal: safeGetValue(maquinaDetalles, 'datos_en_rango.consumo_total'),
        diferenciaMedicionTotal: safeGetValue(maquinaDetalles, 'datos_en_rango.diferencia_medicion_total')
      }
    };
  }, [maquinaDetalles]);

  // Datos para gráficos con formato mejorado
  const datosGrafico = useMemo(() => {
    if (!calculos || !maquinaDetalles) return [];

    const datosHistoricos = maquinaDetalles.detalle_historico?.map((d, index) => {
      const stockInicial = index > 0 ?
        parseFloat(maquinaDetalles.detalle_historico[index - 1].carga || 0) - parseFloat(d.consumo_real_diario || 0) :
        parseFloat(d.carga || 0);

      return {
        dia: `Día ${index + 1} (${d.fecha})`,
        fecha: d.fecha,
        diferenciaMedicion: parseFloat(d.diferencia_medicion_diaria || 0),
        consumo: parseFloat(d.consumo_real_diario || 0),
        medicion: parseFloat(d.medicion || 0),
        carga: parseFloat(d.carga || 0),
        stockInicial: stockInicial,
        esReal: true,
        esTipoHistorico: true
      };
    }) || [];

    const datosProyeccion = maquinaDetalles.detalle_proyeccion?.map(p => ({
      dia: `Día ${p.dia} (${p.fecha})`,
      fecha: p.fecha,
      diferenciaMedicion: parseFloat(p.medicion_diaria_proyectada || 0),
      consumo: parseFloat(p.consumo_proyectado_diario || 0),
      stockInicial: parseFloat(p.stock_inicial || 0),
      stockFinal: parseFloat(p.stock_final || 0),
      esReal: false,
      esTipoHistorico: false
    })) || [];

    return [...datosHistoricos, ...datosProyeccion];
  }, [maquinaDetalles, calculos]);

  // Función para determinar el índice de transición entre datos históricos y proyectados
  const indiceSeparacion = useMemo(() => {
    if (!datosGrafico.length) return 0;
    return datosGrafico.findIndex(d => !d.esTipoHistorico);
  }, [datosGrafico]);

  // Componente para tooltips del gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{data.fecha}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-medium">{formatNumber(entry.value)}</span>
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {data.esReal ? '📊 Datos Reales' : '🔮 Datos Proyectados'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Función para obtener el nombre de la unidad de medición
  const getUnidadMedicion = () => {
    if (!maquinaDetalles) return 'h';
    return maquinaDetalles.tipo_medicion?.toLowerCase() === 'kilometraje' ? 'km' : 'h';
  };

  // Función para obtener el nombre descriptivo de la medición
  const getNombreMedicion = () => {
    if (!maquinaDetalles) return 'Horas';
    return maquinaDetalles.tipo_medicion?.toLowerCase() === 'kilometraje' ? 'Kilómetros' : 'Horas';
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* Encabezado mejorado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FiDroplet className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Proyección de Consumo de Combustible
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Analiza el consumo histórico y proyecta el futuro consumo de combustible de tu flota con precisión avanzada
          </p>
        </div>

        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <FiltrosComponent
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
            faenaSeleccionada={faenaSeleccionada}
            setFaenaSeleccionada={setFaenaSeleccionada}
            faenas={faenas}
          />
        </div>

        {/* Control para días de proyección mejorado */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <FiCalendar className="text-blue-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Configuración de Proyección</h3>
                <p className="text-sm text-gray-600">Establece el número de días a proyectar (1-30)</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Días:</label>
                <input
                  type="number"
                  value={diasProyeccion}
                  onChange={(e) => setDiasProyeccion(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="30"
                  className="w-20 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={cargarDatosProyeccion}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cargando || !fechaDesde || !fechaHasta}
              >
                <FiRefreshCw className={`mr-2 ${cargando ? 'animate-spin' : ''}`} />
                {cargando ? 'Cargando...' : 'Actualizar Datos'}
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes de error mejorados */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                  <FiAlertTriangle className="text-red-600 text-lg" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta cuando no hay fechas seleccionadas mejorada */}
        {(!fechaDesde || !fechaHasta) && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg">
                  <FiInfo className="text-amber-600 text-lg" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Selecciona un rango de fechas</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Para comenzar el análisis, por favor selecciona las fechas de inicio y fin en los filtros superiores.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sección plegable de KPI Dashboard */}
        {fechaDesde && fechaHasta && (
          <KpiToggleSection
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            faenaSeleccionada={faenaSeleccionada}
            faenas={faenas}
          />
        )}

        {/* Estadísticas generales mejoradas */}
        {datosProyeccion && datosProyeccion.kpis_globales && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                  <FiTarget className="text-green-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Resumen General</h2>
                  <p className="text-sm text-gray-600">Métricas globales del período seleccionado</p>
                </div>
              </div>
            </div>

            {/* Selector de máquina mejorado */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Máquina</label>
              <select
                value={maquinaSeleccionada?.value || ''}
                onChange={(e) => {
                  const seleccionada = todasLasMaquinas.find(m => m.value === parseInt(e.target.value));
                  handleChangeMaquina(seleccionada || todasLasMaquinas[0]);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                {todasLasMaquinas.map(maquina => (
                  <option key={maquina.value} value={maquina.value}>{maquina.label}</option>
                ))}
              </select>
            </div>

            {/* Cards de estadísticas mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg">
                    <FiTruck className="text-white text-xl" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-700">{datosProyeccion.total_maquinas || 0}</p>
                    <p className="text-sm font-medium text-blue-600">Total Máquinas</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-blue-600">
                  <span className="bg-blue-200 px-2 py-1 rounded">
                    {datosProyeccion.maquinas_con_consumo_real || 0} con datos reales
                  </span>
                  <span className="bg-blue-200 px-2 py-1 rounded">
                    {datosProyeccion.maquinas_con_proyeccion || 0} con proyección
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-lg">
                    <FiDroplet className="text-white text-xl" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-700">{formatNumber(datosProyeccion.kpis_globales.consumo_total)} L</p>
                    <p className="text-sm font-medium text-emerald-600">Consumo Total</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-emerald-600">
                  <span className="bg-emerald-200 px-2 py-1 rounded">
                    {formatNumber(datosProyeccion.kpis_globales.consumo_total_real)} L reales
                  </span>
                  <span className="bg-emerald-200 px-2 py-1 rounded">
                    {formatNumber(datosProyeccion.kpis_globales.consumo_total_proyectado)} L proyectados
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-lg">
                    <FaTachometerAlt className="text-white text-xl" />
                  </div>
                  <div className="text-right">
                    <div className="space-y-1">
                      <div>
                        <p className="text-lg font-bold text-purple-700">
                          {formatNumber(datosProyeccion.kpis_globales.rendimiento_promedio_horometro)} h/L
                        </p>
                        <p className="text-xs text-purple-600">Horómetro</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-700">
                          {formatNumber(datosProyeccion.kpis_globales.rendimiento_promedio_kilometraje)} km/L
                        </p>
                        <p className="text-xs text-purple-600">Kilometraje</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-purple-600 text-center">Rendimiento Promedio</p>
              </div>
            </div>
          </div>
        )}

        {/* Detalles de máquina seleccionada mejorados */}
        {maquinaDetalles && calculos && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header de la máquina */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg">
                      <FiClock className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {maquinaSeleccionada.label}
                      </h2>
                      <p className="text-indigo-100">
                        Análisis detallado de proyección
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Tipo de medición</p>
                    <p className="text-white font-semibold">{getNombreMedicion()}</p>
                  </div>
                </div>
              </div>

              {/* Métricas principales */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <FiActivity className="text-blue-500 text-2xl" />
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">REAL</span>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-1">Consumo Real</h3>
                    <p className="text-3xl font-bold text-blue-700">{formatNumber(calculos.datosEnRango.consumoReal)} L</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {formatNumber(calculos.datosEnRango.diferenciaMedicion)} {getUnidadMedicion()} trabajadas
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <FaRocket className="text-purple-500 text-2xl" />
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">PROYECTADO</span>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-1">Consumo Proyectado</h3>
                    <p className="text-3xl font-bold text-purple-700">{formatNumber(calculos.datosEnRango.consumoProyectado)} L</p>
                    <p className="text-sm text-purple-600 mt-1">
                      {formatNumber(calculos.datosEnRango.diferenciaMedicionProyectada)} {getUnidadMedicion()} proyectadas
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-3">
                      <FiTarget className="text-emerald-500 text-2xl" />
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">TOTAL</span>
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-800 mb-1">Consumo Total</h3>
                    <p className="text-3xl font-bold text-emerald-700">{formatNumber(calculos.datosEnRango.consumoTotal)} L</p>
                    <p className="text-sm text-emerald-600 mt-1">
                      {formatNumber(calculos.datosEnRango.diferenciaMedicionTotal)} {getUnidadMedicion()} totales
                    </p>
                  </div>
                </div>

                {/* Barra de progreso mejorada */}
                {calculos.datosEnRango.consumoTotal > 0 && (
                  <div className="mb-6 bg-gray-50 p-5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">Distribución del Consumo</h4>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Real: {(((calculos.datosEnRango.consumoReal || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Proyectado: {(((calculos.datosEnRango.consumoProyectado || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                          style={{
                            width: `${((calculos.datosEnRango.consumoReal || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100}%`
                          }}
                        ></div>
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000 ease-out"
                          style={{
                            width: `${((calculos.datosEnRango.consumoProyectado || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100}%`,
                            marginTop: '-24px'
                          }}
                        ></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {formatNumber(calculos.datosEnRango.consumoTotal)} L Total
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información técnica de la máquina */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Información de la máquina */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200 flex items-center">
                      <FiInfo className="mr-2 text-gray-600" />
                      Información de la Máquina
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Último Registro:</span>
                        <span className="font-semibold text-gray-800">
                          {maquinaDetalles.detalle_historico && maquinaDetalles.detalle_historico.length > 0
                            ? new Date(maquinaDetalles.detalle_historico[maquinaDetalles.detalle_historico.length - 1].fecha).toLocaleDateString('es-CL')
                            : 'No disponible'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tipo de Medición:</span>
                        <span className="font-semibold text-gray-800">{getNombreMedicion()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Stock Actual:</span>
                        <span className="font-semibold text-emerald-600">
                          {calculos.simulacion && calculos.simulacion.length > 0
                            ? formatNumber(calculos.simulacion[0].stock_inicial)
                            : formatNumber(calculos.cargas && calculos.cargas.length > 0 ? calculos.cargas[calculos.cargas.length - 1] : 0)
                          } L
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Métricas de rendimiento */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200 flex items-center">
                      <FiTrendingUp className="mr-2 text-gray-600" />
                      Métricas de Rendimiento
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total {getNombreMedicion()}:</span>
                        <span className="font-semibold text-gray-800">{formatNumber(calculos.totalDiferenciaMedicion)} {getUnidadMedicion()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total Consumo:</span>
                        <span className="font-semibold text-gray-800">{formatNumber(calculos.totalConsumo)} L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Rendimiento:</span>
                        <span className="font-semibold text-blue-600">{calculos.rendimiento?.toFixed(3) || '0.000'} {getUnidadMedicion()}/L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Promedio Diario:</span>
                        <span className="font-semibold text-gray-800">{calculos.promedioDiferenciaMedicionDiaria?.toFixed(2) || '0.00'} {getUnidadMedicion()}/día</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Consumo Simulado Diario:</span>
                        <span className="font-semibold text-purple-600">{calculos.consumoSimuladoDiario?.toFixed(2) || '0.00'} L/día</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Días Proyectados:</span>
                        <span className="font-semibold text-gray-800">{calculos.simulacion?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico mejorado */}
                <div ref={graficoRef} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <FaChartBar className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Análisis de Consumo y Proyección
                        </h3>
                        <p className="text-sm text-gray-600">
                          Visualización temporal de datos históricos y proyectados
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-96 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={datosGrafico}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="dia"
                          height={70}
                          tick={<CustomizedAxisTick />}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: 20 }}
                          iconType="circle"
                        />

                        {/* Línea de separación entre datos históricos y proyectados */}
                        {indiceSeparacion > 0 && (
                          <ReferenceLine
                            x={datosGrafico[indiceSeparacion - 1]?.dia}
                            stroke="#f59e0b"
                            strokeDasharray="8 8"
                            strokeWidth={2}
                            label={{
                              value: '🔮 Inicio Proyección',
                              position: 'topLeft',
                              fill: '#f59e0b',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}
                          />
                        )}

                        <Line
                          type="monotone"
                          dataKey="diferenciaMedicion"
                          name={`${getNombreMedicion()} Trabajadas`}
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="consumo"
                          name="Consumo (L)"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="stockInicial"
                          name="Stock Inicial (L)"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Leyenda mejorada del gráfico */}
                  <div className="flex flex-wrap justify-center gap-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">{getNombreMedicion()} Trabajadas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-gray-700">Consumo de Combustible</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">Stock de Combustible</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-1 bg-amber-500" style={{borderStyle: 'dashed'}}></div>
                      <span className="text-sm font-medium text-gray-700">Separación Real/Proyectado</span>
                    </div>
                  </div>
                </div>

                {/* Tabs para datos históricos y proyección mejorados */}
                <div className="mt-8">
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        className="group inline-flex items-center py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600 focus:outline-none"
                        onClick={() => document.getElementById('tab-historico').scrollIntoView({ behavior: 'smooth' })}
                      >
                        <FiActivity className="mr-2" />
                        Datos Históricos
                        <span className="bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-medium ml-3">
                          {maquinaDetalles.detalle_historico?.length || 0}
                        </span>
                      </button>
                      <button
                        className="group inline-flex items-center py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none"
                        onClick={() => document.getElementById('tab-proyeccion').scrollIntoView({ behavior: 'smooth' })}
                      >
                        <FaRocket className="mr-2" />
                        Proyección
                        <span className="bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium ml-3">
                          {calculos.simulacion?.length || 0}
                        </span>
                      </button>
                    </nav>
                  </div>

                  {/* Tabla de datos históricos mejorada */}
                  <div id="tab-historico" className="mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <FiActivity className="mr-2 text-blue-500" />
                          Datos Históricos Registrados
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Información real obtenida de los registros de la máquina
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FiCalendar className="mr-1" />
                                  Día
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {maquinaDetalles.tipo_medicion === 'Kilometraje' ? 'Kilometraje' : 'Horómetro'}
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FiDroplet className="mr-1" />
                                  Carga (L)
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {getNombreMedicion()} Trabajadas
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Consumo Real (L)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {maquinaDetalles.detalle_historico?.map((d, index) => (
                              <tr key={`hist-${index}`} className={`hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                      {d.dia || index + 1}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {d.fecha ? new Date(d.fecha).toLocaleDateString('es-CL') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatNumber(d.medicion)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {formatNumber(d.carga)} L
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {index === 0 ? (
                                    <span className="text-gray-400 italic">Inicial</span>
                                  ) : (
                                    <span className="font-medium">{formatNumber(d.diferencia_medicion_diaria)} {getUnidadMedicion()}</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {index === 0 ? (
                                    <span className="text-gray-400 italic">-</span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      {formatNumber(d.consumo_real_diario)} L
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )) || []}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de proyección mejorada */}
                  <div id="tab-proyeccion" className="mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <FaRocket className="mr-2 text-purple-500" />
                          Proyección de Consumo
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Estimaciones basadas en patrones históricos de consumo
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FiCalendar className="mr-1" />
                                  Día
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {getNombreMedicion()} Simuladas
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Consumo Simulado (L)
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock Inicial (L)
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FiAlertTriangle className="mr-1" />
                                  Stock Final (L)
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {calculos.simulacion?.map((sim, index) => {
                              const stockBajo = parseFloat(sim.stock_final || 0) <= 0;
                              const stockCritico = parseFloat(sim.stock_final || 0) > 0 && parseFloat(sim.stock_final || 0) <= 100;
                              
                              return (
                                <tr 
                                  key={`sim-${index}`} 
                                  className={`hover:bg-gray-50 transition-colors ${
                                    stockBajo ? 'bg-red-50' : stockCritico ? 'bg-yellow-50' : ''
                                  }`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                        {sim.dia}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {sim.fecha ? new Date(sim.fecha).toLocaleDateString('es-CL') : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatNumber(sim.medicion_diaria_proyectada)} {getUnidadMedicion()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {formatNumber(sim.consumo_proyectado_diario)} L
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span className="font-medium">{formatNumber(sim.stock_inicial)} L</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {stockBajo ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <FiAlertTriangle className="mr-1" />
                                        {formatNumber(sim.stock_final)} L - CRÍTICO
                                      </span>
                                    ) : stockCritico ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <FiAlertTriangle className="mr-1" />
                                        {formatNumber(sim.stock_final)} L - BAJO
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {formatNumber(sim.stock_final)} L - OK
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            }) || []}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug: Mostrar información de depuración en desarrollo */}
        {process.env.NODE_ENV === 'development' && maquinaDetalles && (
          <div className="mb-6 bg-gray-800 text-gray-100 p-4 rounded-xl">
            <h3 className="font-semibold mb-3 text-yellow-400">🐛 Información de Depuración (Solo Desarrollo):</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-gray-700 p-3 rounded">
                <p><strong className="text-blue-400">Consumo real:</strong> {maquinaDetalles.tiene_consumo_real ? '✅ Sí' : '❌ No'}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p><strong className="text-purple-400">Proyección:</strong> {maquinaDetalles.tiene_proyeccion ? '✅ Sí' : '❌ No'}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p><strong className="text-green-400">Registros hist.:</strong> {maquinaDetalles.detalle_historico?.length || 0}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p><strong className="text-orange-400">Registros proy.:</strong> {maquinaDetalles.detalle_proyeccion?.length || 0}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p><strong className="text-cyan-400">Datos en rango:</strong> {maquinaDetalles.datos_en_rango ? '✅ Sí' : '❌ No'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sin datos seleccionados */}
        {(!maquinaDetalles || !calculos) && !cargando && datosProyeccion && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
              <p className="text-gray-600 mb-4">
                Seleccione una máquina de la lista superior para ver su análisis detallado de proyección de consumo.
              </p>
              <div className="text-sm text-gray-500">
                💡 <strong>Tip:</strong> Asegúrate de que las fechas seleccionadas contengan datos de la máquina.
              </div>
            </div>
          </div>
        )}

        {/* Cargando mejorado */}
        {cargando && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6">
                <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando datos...</h3>
              <p className="text-gray-600 mb-4">
                Estamos analizando la información y generando las proyecciones. Esto puede tardar unos momentos.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Sin datos cargados mejorado */}
        {!datosProyeccion && !cargando && fechaDesde && fechaHasta && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos para el período seleccionado</h3>
              <p className="text-gray-600 mb-6">
                No se encontraron registros de máquinas para las fechas seleccionadas. Intenta con un rango diferente o verifica que las máquinas tengan datos registrados.
              </p>
              <button
                onClick={cargarDatosProyeccion}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center mx-auto transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FiRefreshCw className="mr-2" />
                Intentar de Nuevo
              </button>
            </div>
          </div>
        )}

        {/* Pie de página mejorado */}
        <footer className="mt-12 text-center py-8 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <FiDroplet className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Sistema de Proyección de Consumo</p>
                  <p className="text-xs text-gray-500">Versión 2.0.0 • © {new Date().getFullYear()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Sistema Operativo</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-1" />
                  <span>Última actualización: {new Date().toLocaleTimeString('es-CL')}</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MainSimulacion;