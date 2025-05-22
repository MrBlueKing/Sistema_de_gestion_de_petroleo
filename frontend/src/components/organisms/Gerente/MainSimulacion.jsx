import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "../../../lib/axios";
import Header from "../../organisms/Gerente/Header";
import KpiDashboardAdapter from "../../molecules/KpiAdapter";
import KpiToggleSection from "../../atoms/Button/KpiToggleSection";
import { FaChartBar } from "react-icons/fa";
import {
  FiTruck, FiDroplet, FiClock, FiCalendar,
  FiFilter, FiRefreshCw, FiInfo, FiAlertTriangle
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
  // Extraer fecha del formato "Día X (yyyy-mm-dd)"
  const match = payload.value.match(/\((.*?)\)/);
  const fecha = match ? match[1] : payload.value;

  // Formato de fecha corto
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
        fill="#666"
        fontSize={12}
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

      // Intentar diferentes formas de acceder a los datos
      let faenasData = response.data;

      // Si los datos están en response.data.data
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        faenasData = response.data.data;
      }
      // Si los datos están directamente en response.data
      else if (Array.isArray(response.data)) {
        faenasData = response.data;
      }
      // Si los datos están en response.data.faenas
      else if (response.data && response.data.faenas && Array.isArray(response.data.faenas)) {
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

        // Preparar opciones de máquinas para el selector
        const opcionesMaquinas = response.data.data.maquinas.map(maquina => ({
          value: maquina.id,
          label: `${maquina.nombre} (${maquina.patente || "Sin patente"})`,
          tipo: maquina.tipo_medicion,
          datos: maquina
        }));

        setTodasLasMaquinas(opcionesMaquinas);

        // Si no hay máquina seleccionada o ya no está en la lista, seleccionar la primera
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

  // Cálculos para la máquina seleccionada - MEJORADO
  const calculos = useMemo(() => {
    if (!maquinaDetalles) return null;

    const safeGetValue = (obj, path, defaultValue = 0) => {
      const value = path.split('.').reduce((o, p) => o && o[p], obj);
      return isValidNumber(value) ? value : defaultValue;
    };

    return {
      // Datos históricos
      mediciones: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'medicion')) || [],
      cargas: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'carga')) || [],
      diferenciaMedicionDiaria: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'diferencia_medicion_diaria')) || [],
      consumoRealDiario: maquinaDetalles.detalle_historico?.map(d => safeGetValue(d, 'consumo_real_diario')) || [],
      
      // Totales
      totalDiferenciaMedicion: safeGetValue(maquinaDetalles, 'datos_totales.total_diferencia_medicion'),
      totalConsumo: safeGetValue(maquinaDetalles, 'datos_totales.total_consumo_real'),
      rendimiento: safeGetValue(maquinaDetalles, 'datos_totales.rendimiento'),
      promedioDiferenciaMedicionDiaria: safeGetValue(maquinaDetalles, 'datos_totales.promedio_diferencia_medicion_diaria'),
      consumoSimuladoDiario: safeGetValue(maquinaDetalles, 'datos_totales.consumo_simulado_diario'),
      
      // Proyección
      simulacion: maquinaDetalles.detalle_proyeccion || [],
      diasRegistrados: safeGetValue(maquinaDetalles, 'datos_totales.total_registros', 0) - 1,

      // Datos en rango
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

  // Datos para gráficos con formato mejorado - ACTUALIZADO
  const datosGrafico = useMemo(() => {
    if (!calculos || !maquinaDetalles) return [];

    // Datos históricos para el gráfico
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

    // Datos de proyección para el gráfico
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
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-semibold">{data.fecha}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
          <p className="text-xs mt-1 text-gray-500">
            {data.esReal ? 'Datos Reales' : 'Datos Proyectados'}
          </p>
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
    <div className="flex-1 overflow-auto bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* Encabezado */}
        <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center">
          <FiDroplet className="mr-2" /> Proyección de Consumo de Combustible
        </h1>

        {/* Filtros */}
        <FiltrosComponent
          fechaDesde={fechaDesde}
          setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          faenaSeleccionada={faenaSeleccionada}
          setFaenaSeleccionada={setFaenaSeleccionada}
          faenas={faenas}
        />

        {/* Control para días de proyección */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiCalendar className="mr-2 text-blue-500" />
              <label className="block text-sm font-medium text-gray-700 mr-3">Días de Proyección:</label>
              <input
                type="number"
                value={diasProyeccion}
                onChange={(e) => setDiasProyeccion(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                min="1"
                max="30"
                className="w-20 p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <button
              onClick={cargarDatosProyeccion}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center text-sm transition-colors"
              disabled={cargando || !fechaDesde || !fechaHasta}
            >
              <FiRefreshCw className={`mr-2 ${cargando ? 'animate-spin' : ''}`} />
              {cargando ? 'Cargando...' : 'Actualizar Datos'}
            </button>
          </div>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta cuando no hay fechas seleccionadas */}
        {(!fechaDesde || !fechaHasta) && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-md">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <FiInfo className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Por favor, seleccione un rango de fechas para ver la proyección de consumo.
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

        {/* Selector de máquina y estadísticas generales */}
        {datosProyeccion && datosProyeccion.kpis_globales && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <FiTruck className="mr-2 text-blue-500" /> Seleccionar Máquina
            </h2>

            <div className="mb-4">
              <select
                value={maquinaSeleccionada?.value || ''}
                onChange={(e) => {
                  const seleccionada = todasLasMaquinas.find(m => m.value === parseInt(e.target.value));
                  handleChangeMaquina(seleccionada || todasLasMaquinas[0]);
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {todasLasMaquinas.map(maquina => (
                  <option key={maquina.value} value={maquina.value}>{maquina.label}</option>
                ))}
              </select>
            </div>

            {/* Estadísticas generales - MEJORADAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Máquinas</h3>
                <p className="text-2xl font-bold text-blue-800">{datosProyeccion.total_maquinas || 0}</p>
                <div className="text-xs text-blue-600 mt-1">
                  <span>{datosProyeccion.maquinas_con_consumo_real || 0} con consumo real</span> •
                  <span className="ml-1">{datosProyeccion.maquinas_con_proyeccion || 0} con proyección</span>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-700 mb-1">Consumo Total en Período</h3>
                <p className="text-2xl font-bold text-green-800">{formatNumber(datosProyeccion.kpis_globales.consumo_total)} L</p>
                <div className="text-xs text-green-600 mt-1">
                  <span>{formatNumber(datosProyeccion.kpis_globales.consumo_total_real)} L reales</span> •
                  <span className="ml-1">{formatNumber(datosProyeccion.kpis_globales.consumo_total_proyectado)} L proyectados</span>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-700 mb-1">Rendimiento Promedio</h3>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xl font-bold text-purple-800">
                      {formatNumber(datosProyeccion.kpis_globales.rendimiento_promedio_horometro)} h/L
                    </p>
                    <div className="text-xs text-purple-600">Horómetro</div>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-purple-800">
                      {formatNumber(datosProyeccion.kpis_globales.rendimiento_promedio_kilometraje)} km/L
                    </p>
                    <div className="text-xs text-purple-600">Kilometraje</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detalles de máquina seleccionada - ACTUALIZADO */}
        {maquinaDetalles && calculos && (
          <div className="mb-6">
            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <FiClock className="mr-2 text-blue-500" /> Detalles de Proyección: {maquinaSeleccionada.label}
              </h2>
            </div>

            {/* Información sobre consumo real vs proyectado - MEJORADA */}
            <div className="bg-blue-50 p-4 mb-4 rounded-lg border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">Consumo Real</h3>
                  <p className="text-2xl font-bold text-blue-700">{formatNumber(calculos.datosEnRango.consumoReal)} L</p>
                  <p className="text-xs text-blue-600">
                    {formatNumber(calculos.datosEnRango.diferenciaMedicion)} {getUnidadMedicion()} trabajadas
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-indigo-800 mb-1">Consumo Proyectado</h3>
                  <p className="text-2xl font-bold text-indigo-700">{formatNumber(calculos.datosEnRango.consumoProyectado)} L</p>
                  <p className="text-xs text-indigo-600">
                    {formatNumber(calculos.datosEnRango.diferenciaMedicionProyectada)} {getUnidadMedicion()} proyectadas
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-purple-800 mb-1">Consumo Total</h3>
                  <p className="text-2xl font-bold text-purple-700">{formatNumber(calculos.datosEnRango.consumoTotal)} L</p>
                  <p className="text-xs text-purple-600">
                    {formatNumber(calculos.datosEnRango.diferenciaMedicionTotal)} {getUnidadMedicion()} totales
                  </p>
                </div>
              </div>

              {/* Barra de progreso - MEJORADA */}
              {calculos.datosEnRango.consumoTotal > 0 && (
                <div className="mt-4">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${((calculos.datosEnRango.consumoReal || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100}%`,
                        transition: "width 0.5s ease-in-out"
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Real: {(((calculos.datosEnRango.consumoReal || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100).toFixed(1)}%</span>
                    <span>Proyectado: {(((calculos.datosEnRango.consumoProyectado || 0) / (calculos.datosEnRango.consumoTotal || 1)) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen de datos y cálculos - ACTUALIZADO */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información de la máquina */}
                <div>
                  <h3 className="text-md font-semibold mb-3 pb-2 border-b border-gray-200">Información de la Máquina</h3>
                  <table className="min-w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Último Registro:</td>
                        <td className="py-1">
                          {maquinaDetalles.detalle_historico && maquinaDetalles.detalle_historico.length > 0
                            ? maquinaDetalles.detalle_historico[maquinaDetalles.detalle_historico.length - 1].fecha
                            : 'No disponible'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Resultados de cálculos - MEJORADOS */}
                <div>
                  <h3 className="text-md font-semibold mb-3 pb-2 border-b border-gray-200">Resultados de Cálculos</h3>
                  <table className="min-w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Total {getNombreMedicion()}:</td>
                        <td className="py-1">{formatNumber(calculos.totalDiferenciaMedicion)} {getUnidadMedicion()}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Total Consumo:</td>
                        <td className="py-1">{formatNumber(calculos.totalConsumo)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Rendimiento:</td>
                        <td className="py-1">{calculos.rendimiento?.toFixed(3) || '0.000'} {getUnidadMedicion()}/L</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Promedio Diario:</td>
                        <td className="py-1">{calculos.promedioDiferenciaMedicionDiaria?.toFixed(2) || '0.00'} {getUnidadMedicion()}/día</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Consumo Simulado Diario:</td>
                        <td className="py-1">{calculos.consumoSimuladoDiario?.toFixed(2) || '0.00'} L/día</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Días Proyectados:</td>
                        <td className="py-1">{calculos.simulacion?.length || 0}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-600">Stock Actual:</td>
                        <td className="py-1">
                          {calculos.simulacion && calculos.simulacion.length > 0
                            ? formatNumber(calculos.simulacion[0].stock_inicial)
                            : formatNumber(calculos.cargas && calculos.cargas.length > 0 ? calculos.cargas[calculos.cargas.length - 1] : 0)
                          } L
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráfico mejorado - ACTUALIZADO */}
              <div ref={graficoRef} className="mt-6 p-4 bg-white rounded-lg border border-gray-100">
                <h3 className="text-md font-semibold mb-4 flex items-center">
                  <FaChartBar className="mr-2 text-blue-500" />
                  Gráfico de Consumo y Proyección
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={datosGrafico}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="dia"
                        height={60}
                        tick={<CustomizedAxisTick />}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 10 }} />

                      {/* Línea de separación entre datos históricos y proyectados */}
                      {indiceSeparacion > 0 && (
                        <ReferenceLine
                          x={datosGrafico[indiceSeparacion - 1]?.dia}
                          stroke="#888"
                          strokeDasharray="5 5"
                          label={{
                            value: 'Inicio Proyección',
                            position: 'top',
                            fill: '#888',
                            fontSize: 12
                          }}
                        />
                      )}

                      <Line
                        type="monotone"
                        dataKey="diferenciaMedicion"
                        name={`${getNombreMedicion()} Trabajadas`}
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="consumo"
                        name="Consumo (L)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="stockInicial"
                        name="Stock Inicial (L)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center mt-4 text-sm text-gray-500">
                  <div className="flex items-center mr-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span>{getNombreMedicion()} Trabajadas</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span>Consumo (L)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span>Stock Inicial (L)</span>
                  </div>
                </div>
              </div>

              {/* Tabs para datos históricos y proyección */}
              <div className="mt-6">
                <ul className="flex border-b border-gray-200">
                  <li className="mr-1">
                    <button
                      className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-medium border-l border-t border-r rounded-t focus:outline-none"
                      onClick={() => document.getElementById('tab-historico').scrollIntoView({ behavior: 'smooth' })}
                    >
                      Datos Históricos
                    </button>
                  </li>
                  <li className="mr-1">
                    <button
                      className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-medium border-l border-t border-r rounded-t focus:outline-none"
                      onClick={() => document.getElementById('tab-proyeccion').scrollIntoView({ behavior: 'smooth' })}
                    >
                      Proyección
                    </button>
                  </li>
                </ul>
              </div>

              {/* Tabla de datos históricos - ACTUALIZADA */}
              <div id="tab-historico" className="mt-6">
                <h3 className="text-md font-semibold mb-3 pb-2 border-b border-gray-200">Datos Históricos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {maquinaDetalles.tipo_medicion === 'Kilometraje' ? 'Kilometraje' : 'Horómetro'}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga (L)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getNombreMedicion()} Trabajadas
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo Real (L)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {maquinaDetalles.detalle_historico?.map((d, index) => (
                        <tr key={`hist-${index}`} className={index === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-3 py-2">{d.dia || index + 1}</td>
                          <td className="px-3 py-2">{d.fecha || '-'}</td>
                          <td className="px-3 py-2">{formatNumber(d.medicion)}</td>
                          <td className="px-3 py-2">{formatNumber(d.carga)}</td>
                          <td className="px-3 py-2">
                            {index === 0 ? '-' : formatNumber(d.diferencia_medicion_diaria)}
                          </td>
                          <td className="px-3 py-2">
                            {index === 0 ? '-' : formatNumber(d.consumo_real_diario)}
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla de proyección - ACTUALIZADA */}
              <div id="tab-proyeccion" className="mt-6">
                <h3 className="text-md font-semibold mb-3 pb-2 border-b border-gray-200">Proyección</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getNombreMedicion()} Simuladas
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo Simulado (L)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Inicial (L)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Final (L)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calculos.simulacion?.map((sim, index) => (
                        <tr key={`sim-${index}`} className={parseFloat(sim.stock_final || 0) <= 0 ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2">{sim.dia}</td>
                          <td className="px-3 py-2">{sim.fecha}</td>
                          <td className="px-3 py-2">{formatNumber(sim.medicion_diaria_proyectada)}</td>
                          <td className="px-3 py-2">{formatNumber(sim.consumo_proyectado_diario)}</td>
                          <td className="px-3 py-2">{formatNumber(sim.stock_inicial)}</td>
                          <td className="px-3 py-2">
                            {parseFloat(sim.stock_final || 0) <= 0 ? (
                              <span className="text-red-600 font-medium flex items-center">
                                <FiAlertTriangle className="mr-1" />
                                {formatNumber(sim.stock_final)}
                              </span>
                            ) : (
                              formatNumber(sim.stock_final)
                            )}
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug: Mostrar información de depuración en desarrollo */}
        {process.env.NODE_ENV === 'development' && maquinaDetalles && (
          <div className="mb-6 bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Información de Depuración:</h3>
            <div className="text-xs">
              <p><strong>Tiene consumo real:</strong> {maquinaDetalles.tiene_consumo_real ? 'Sí' : 'No'}</p>
              <p><strong>Tiene proyección:</strong> {maquinaDetalles.tiene_proyeccion ? 'Sí' : 'No'}</p>
              <p><strong>Registros históricos:</strong> {maquinaDetalles.detalle_historico?.length || 0}</p>
              <p><strong>Registros de proyección:</strong> {maquinaDetalles.detalle_proyeccion?.length || 0}</p>
              <p><strong>Datos en rango disponibles:</strong> {maquinaDetalles.datos_en_rango ? 'Sí' : 'No'}</p>
            </div>
          </div>
        )}

        {/* Sin datos seleccionados */}
        {(!maquinaDetalles || !calculos) && !cargando && datosProyeccion && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Seleccione una máquina para ver su proyección de consumo.
            </p>
          </div>
        )}

        {/* Cargando */}
        {cargando && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <svg className="animate-spin mx-auto h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Cargando datos...</h3>
            <p className="mt-1 text-xs text-gray-500">Esto puede tardar unos momentos</p>
          </div>
        )}

        {/* Sin datos cargados */}
        {!datosProyeccion && !cargando && fechaDesde && fechaHasta && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos para el periodo seleccionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Intente seleccionar un rango de fechas diferente o haga clic en "Actualizar Datos".
            </p>
            <button
              onClick={cargarDatosProyeccion}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <FiRefreshCw className="inline mr-2" />
              Actualizar Datos
            </button>
          </div>
        )}

        {/* Pie de página */}
        <footer className="mt-8 text-center text-xs text-gray-500 py-4 border-t border-gray-200">
          <p>Sistema de Proyección de Consumo • © {new Date().getFullYear()}</p>
          <p className="mt-1">Versión 1.0.0</p>
        </footer>
      </div>
    </div>
  );
}

export default MainSimulacion;