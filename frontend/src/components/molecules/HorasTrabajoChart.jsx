import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Sector
} from "recharts";
import {
  FiClock,
  FiAlertTriangle,
  FiTool,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiChevronDown
} from "react-icons/fi";
import { consumoService } from "../../context/apiServiceS";

const HorasTrabajoChart = ({ faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [viewMode, setViewMode] = useState('barras'); // 'barras' o 'pastel'
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState('all'); // 'week', 'month', 'all'
  const [sortOrder, setSortOrder] = useState('estado'); // 'estado', 'horas', 'alfabetico'

  // Tema de colores profesional
  const theme = {
    primary: "#2563eb",       // blue-600
    primaryLight: "#dbeafe",  // blue-100
    primaryDark: "#1e40af",   // blue-800
    secondary: "#475569",     // slate-600
    secondaryLight: "#f1f5f9", // slate-100
    secondaryDark: "#334155",  // slate-700
    success: "#16a34a",       // green-600
    successLight: "#dcfce7",  // green-100
    warning: "#ca8a04",       // yellow-600
    warningLight: "#fef9c3",  // yellow-100
    danger: "#dc2626",        // red-600
    dangerLight: "#fee2e2",   // red-100
    textPrimary: "#1e293b",   // slate-800
    textSecondary: "#64748b", // slate-500
    border: "#e2e8f0"         // slate-200
  };

  // Colores para las barras del gráfico
  const barColors = {
    horasProgramadas: theme.secondary,
    horasActuales: theme.primary,
    diferencia: theme.success,
    critical: theme.danger,
    caution: theme.warning,
    normal: theme.success
  };

  // Colores de texto para estados
  const textColors = {
    crítico: theme.danger,
    advertencia: theme.warning,
    normal: theme.success
  };

  // Datos para gráfico de pastel
  const getPieData = () => {
    return [
      { name: 'Crítico', valor: equiposCriticos, color: theme.danger },
      { name: 'Advertencia', valor: equiposAdvertencia, color: theme.warning },
      { name: 'Normal', valor: equiposNormal, color: theme.success }
    ];
  };

  // Obtener nombres de faenas
  const getNombreFaena = (id) => {
    const faenas = {
      '1': 'Cabildo',
      '2': 'Catemu',
      '3': 'Chincolco',
      '4': 'Tiltil'
    };
    return faenas[id] || 'Faena Seleccionada';
  };

  // Filtrar datos según el filtro de tiempo seleccionado
  const filterDataByTime = (data) => {
    if (timeFilter === 'all') return data;

    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    const daysToFilter = timeFilter === 'week' ? 7 : 30;

    return data.filter(item => {
      // Calcular proximidad al mantenimiento basado en horas restantes y horas programadas
      const porcentajeRestante = item.diferencia / item.horasProgramadas;

      // Si está en estado crítico o advertencia, mostrar siempre
      if (item.estado === 'crítico' || item.estado === 'advertencia') return true;

      // Para equipos normales, mostrar solo los que necesitarán mantenimiento próximamente
      return porcentajeRestante < (timeFilter === 'week' ? 0.25 : 0.5);
    });
  };

  // Ordenar datos según el criterio seleccionado
  const sortData = (data) => {
    if (sortOrder === 'estado') {
      // Ordenar por estado (crítico primero, luego advertencia, luego normal)
      const estadoOrden = { "crítico": 0, "advertencia": 1, "normal": 2 };
      return [...data].sort((a, b) => estadoOrden[a.estado] - estadoOrden[b.estado]);
    } else if (sortOrder === 'horas') {
      // Ordenar por horas disponibles (ascendente)
      return [...data].sort((a, b) => a.diferencia - b.diferencia);
    } else {
      // Ordenar alfabéticamente por nombre de equipo
      return [...data].sort((a, b) => a.equipo.localeCompare(b.equipo));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        //console.log("HorasTrabajoChart: Fetching data for faena:", faenaSeleccionada);

        const data = await consumoService.getHorasTrabajo(faenaSeleccionada);
        //console.log("HorasTrabajoChart: Data received:", data);

        if (!data) {
          setError("No se recibieron datos del servicio");
          setChartData([]);
        } else if (Array.isArray(data) && data.length === 0) {
          setError("No hay datos disponibles para esta faena");
          setChartData([]);
        } else if (Array.isArray(data)) {
          // Verificar estructura mínima necesaria
          const validData = data.every(item =>
            'equipo' in item &&
            'horasProgramadas' in item &&
            'horasActuales' in item &&
            'tipo_medicion' in item
          );

          if (validData) {
            // Procesar y enriquecer los datos
            const processedData = data.map(item => {
              // Garantizar que los valores sean números válidos
              const horasProgramadas = Number(item.horasProgramadas) || 0;
              const horasActuales = Number(item.horasActuales) || 0;

              // Calcular horas disponibles hasta el siguiente mantenimiento
              const diferencia = Math.max(0, horasProgramadas - horasActuales);

              // Calcular estado (para código de colores)
              let estado = "normal";
              let proximaMantencion = "";

              // Definir la unidad según el tipo de medición
              const unidad = item.tipo_medicion === 'Horometro' ? 'h' : 'km';

              if (horasProgramadas === 0) {
                estado = "normal";
                proximaMantencion = `No hay ${unidad} programados`;
              } else if (diferencia <= 0) {
                estado = "crítico";
                proximaMantencion = "Mantenimiento requerido";
              } else if (diferencia <= horasProgramadas * 0.1) {
                estado = "advertencia";
                proximaMantencion = `${diferencia.toFixed(1)}${unidad} restantes`;
              } else {
                proximaMantencion = `${diferencia.toFixed(1)}${unidad} restantes`;
              }

              // Calcular porcentaje de uso (evitando división por cero)
              let porcentajeUso = "0%";
              if (horasProgramadas > 0) {
                porcentajeUso = `${Math.min(100, (horasActuales / horasProgramadas * 100)).toFixed(0)}%`;
              }

              // Agregar fecha ficticia de último mantenimiento para fines de demostración
              const lastMaintDate = new Date();
              lastMaintDate.setDate(lastMaintDate.getDate() - Math.floor(Math.random() * 90));
              const lastMaintenance = lastMaintDate.toLocaleDateString('es-ES');

              return {
                ...item,
                horasProgramadas,
                horasActuales,
                diferencia,
                estado,
                proximaMantencion,
                porcentajeUso,
                unidad,
                lastMaintenance
              };
            });

            setChartData(processedData);
          } else {
            console.warn("Los datos recibidos no tienen la estructura esperada:", data);
            setError("Los datos recibidos no tienen el formato correcto");
            setChartData([]);
          }
        } else {
          console.warn("Los datos recibidos no son un array:", data);
          setError("Formato de datos incorrecto");
          setChartData([]);
        }
      } catch (error) {
        console.error("Error general en HorasTrabajoChart:", error);
        setError("Error al cargar datos. Por favor intente nuevamente.");
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faenaSeleccionada]);

  // Datos filtrados y ordenados
  const filteredData = sortData(filterDataByTime(chartData));

  // Renderizado cuando está cargando
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex justify-between mb-6">
          <div className="flex items-center">
            <FiClock className="text-blue-600 mr-3" size={22} />
            <h3 className="text-xl font-semibold text-gray-800">Panel de Control de Mantenimiento</h3>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
            <div className="text-gray-500 font-medium">Cargando datos de mantenimiento...</div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado cuando hay error
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex justify-between mb-6">
          <div className="flex items-center">
            <FiClock className="text-blue-600 mr-3" size={22} />
            <h3 className="text-xl font-semibold text-gray-800">Panel de Control de Mantenimiento</h3>
          </div>
        </div>
        <div className="h-96 flex flex-col items-center justify-center text-center">
          <FiAlertTriangle size={48} className="text-red-500 mb-4" />
          <div className="text-gray-700 font-medium mb-3">{error}</div>
          <p className="text-gray-500 mb-4 max-w-lg">No se pudieron cargar los datos de mantenimiento. Por favor verifique su conexión e intente nuevamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizado cuando no hay datos
  if (chartData.length === 0 && !error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex justify-between mb-6">
          <div className="flex items-center">
            <FiClock className="text-blue-600 mr-3" size={22} />
            <h3 className="text-xl font-semibold text-gray-800">
              Panel de Control de Mantenimiento
              {faenaSeleccionada !== 'todas' ? ` - ${getNombreFaena(faenaSeleccionada)}` : ''}
            </h3>
          </div>
        </div>
        <div className="h-96 flex flex-col items-center justify-center">
          <FiTool size={48} className="text-gray-400 mb-4" />
          <div className="text-gray-500 font-medium">No hay datos de mantenimiento disponibles para esta faena</div>
          <p className="text-gray-400 text-sm mt-2">Intente seleccionar otra faena o contacte al administrador</p>
        </div>
      </div>
    );
  }

  // Tooltip personalizado para el gráfico de barras
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const unidad = data.tipo_medicion === 'Horometro' ? 'horas' : 'kilómetros';

      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <h4 className="font-bold text-lg border-b pb-2 mb-2 text-gray-800">{data.equipo}</h4>

          <div className="grid grid-cols-2 gap-y-2 mb-3">
            <div className="text-sm text-gray-600 font-medium">{unidad.charAt(0).toUpperCase() + unidad.slice(1)} Programados:</div>
            <div className="text-sm font-semibold text-right">{data.horasProgramadas} {data.unidad}</div>

            <div className="text-sm text-gray-600 font-medium">{unidad.charAt(0).toUpperCase() + unidad.slice(1)} Actuales:</div>
            <div className="text-sm font-semibold text-right">{data.horasActuales} {data.unidad}</div>

            <div className="text-sm text-gray-600 font-medium">{unidad.charAt(0).toUpperCase() + unidad.slice(1)} Disponibles:</div>
            <div className="text-sm font-semibold text-right">{data.diferencia} {data.unidad}</div>

            <div className="text-sm text-gray-600 font-medium">Último mantenimiento:</div>
            <div className="text-sm font-semibold text-right">{data.lastMaintenance}</div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Uso actual:</span>
              <span className="text-sm font-bold">{data.porcentajeUso}</span>
            </div>

            <div className="mt-2 bg-gray-100 p-2 rounded text-sm">
              <span className={`font-medium ${data.estado === 'crítico' ? 'text-red-600' :
                  data.estado === 'advertencia' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                {data.proximaMantencion}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Renderizador de sector activo para gráfico de pastel
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={theme.textPrimary} className="text-lg font-medium">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={theme.textSecondary} className="text-sm">
          {`${value} equipos`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={theme.textSecondary} className="text-sm">
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  // Calcular cuántos equipos están en cada estado
  const equiposCriticos = chartData.filter(item => item.estado === 'crítico').length;
  const equiposAdvertencia = chartData.filter(item => item.estado === 'advertencia').length;
  const equiposNormal = chartData.filter(item => item.estado === 'normal').length;
  const totalEquipos = chartData.length;

  // Función personalizada para formatear las etiquetas del eje X con colores según estado
  const CustomAxisTick = (props) => {
    const { x, y, payload, dataKey, data } = props;
    const equipoData = data.find(item => item[dataKey] === payload.value);

    // Color basado en el estado
    const textColor = equipoData ? textColors[equipoData.estado] : theme.textPrimary;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill={textColor}
          fontWeight="500"
          fontSize={11}
          transform="rotate(-45)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Función para obtener la unidad de medida adecuada para el eje Y
  const getYAxisLabel = () => {
    // Verificar si todos los elementos son del mismo tipo
    const primerTipo = filteredData.length > 0 ? filteredData[0].tipo_medicion : null;
    const todosMismoTipo = filteredData.every(item => item.tipo_medicion === primerTipo);

    if (todosMismoTipo) {
      return filteredData[0].tipo_medicion === 'Horometro' ? 'Horas' : 'Kilómetros';
    } else {
      return 'Horas/Kilómetros';
    }
  };

  // Exportar a CSV
  const exportToCSV = () => {
    // Crear encabezados
    const headers = ['Equipo', 'Patente', 'Tipo de Medición', 'Programado', 'Actual', 'Disponible', 'Estado', 'Próximo Mantenimiento', 'Último Mantenimiento'];

    // Crear filas de datos
    const rows = chartData.map(item => [
      item.equipo,
      item.patente || 'N/A',
      item.tipo_medicion,
      `${item.horasProgramadas} ${item.unidad}`,
      `${item.horasActuales} ${item.unidad}`,
      `${item.diferencia} ${item.unidad}`,
      item.estado,
      item.proximaMantencion,
      item.lastMaintenance
    ]);

    // Combinar todo en formato CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `reporte_mantenimiento_${faenaSeleccionada}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      {/* Header con título y controles */}
      <div className="flex flex-col md:flex-row md:justify-between mb-4">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <FiClock className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              Panel de Control de Mantenimiento
            </h3>
            <p className="text-sm text-gray-500">
              {faenaSeleccionada !== 'todas'
                ? `Faena: ${getNombreFaena(faenaSeleccionada)} | Total: ${totalEquipos} equipos`
                : `Total de equipos: ${totalEquipos}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Selector de vista */}
          <div className="flex">
            <button
              onClick={() => setViewMode('barras')}
              className={`px-3 py-1.5 border border-r-0 rounded-l-md text-sm font-medium flex items-center transition-colors ${viewMode === 'barras'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M20 6H4m16 12H4" />
              </svg>
              Barras
            </button>
            <button
              onClick={() => setViewMode('pastel')}
              className={`px-3 py-1.5 border rounded-r-md text-sm font-medium flex items-center transition-colors ${viewMode === 'pastel'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Resumen
            </button>
          </div>

          {/* Filtro de tiempo */}
          <div className="relative">
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-10 hidden">
              <div className="py-1">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`block w-full text-left px-4 py-2 text-sm ${timeFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Todos los equipos
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`block w-full text-left px-4 py-2 text-sm ${timeFilter === 'week' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Mantenimiento esta semana
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`block w-full text-left px-4 py-2 text-sm ${timeFilter === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Mantenimiento este mes
                </button>
              </div>
            </div>
          </div>

          {/* Exportar datos */}
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium flex items-center hover:bg-gray-50 transition-colors"
          >
            <FiDownload className="mr-1.5" size={14} />
            Exportar
          </button>

          {/* Botón de detalles */}
          <button
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${mostrarDetalles
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            <FiTool className="mr-1.5" size={14} />
            {mostrarDetalles ? 'Ocultar detalles' : 'Mostrar detalles'}
          </button>
        </div>
      </div>

      {/* Tarjetas de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Equipos Críticos</p>
              <h4 className="text-2xl font-bold text-red-600 mt-1">{equiposCriticos}</h4>
            </div>
            <div className="bg-white p-2 rounded-full border border-red-200">
              <FiAlertTriangle className="text-red-500" size={20} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Equipos que requieren mantenimiento inmediato</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Equipos en Advertencia</p>
              <h4 className="text-2xl font-bold text-yellow-600 mt-1">{equiposAdvertencia}</h4>
            </div>
            <div className="bg-white p-2 rounded-full border border-yellow-200">
              <svg className="text-yellow-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Próximos a requerir mantenimiento (menos del 10% restante)</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Equipos en Operación Normal</p>
              <h4 className="text-2xl font-bold text-green-600 mt-1">{equiposNormal}</h4>
            </div>
            <div className="bg-white p-2 rounded-full border border-green-200">
              <svg className="text-green-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Equipos operando con normalidad</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
        {viewMode === 'barras' ? (
          /* Gráfico de barras */
          <div className="h-96">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  barSize={30}
                  barGap={4}
                  onMouseMove={(data) => {
                    if (data && data.activeTooltipIndex !== undefined) {
                      setHoveredBar(data.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="equipo"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={<CustomAxisTick dataKey="equipo" data={filteredData} />}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    label={{
                      value: getYAxisLabel(),
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: "#334155", fontSize: 12 }
                    }}
                    tick={{ fill: "#334155" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={45}
                    iconType="circle"
                    formatter={(value) => {
                      const valueMapping = {
                        "horasProgramadas": "Programado",
                        "horasActuales": "Actual",
                        "diferencia": "Disponible"
                      };
                      return <span className="text-sm font-medium">{valueMapping[value] || value}</span>;
                    }}
                  />

                  <Bar
                    dataKey="horasProgramadas"
                    fill={barColors.horasProgramadas}
                    name="horasProgramadas"
                    radius={[4, 4, 0, 0]}
                    opacity={0.9}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell
                        key={`programadas-${index}`}
                        fill={barColors.horasProgramadas}
                        opacity={hoveredBar === index ? 1 : 0.8}
                        stroke={hoveredBar === index ? '#000' : 'none'}
                        strokeWidth={hoveredBar === index ? 1 : 0}
                      />
                    ))}
                  </Bar>

                  <Bar
                    dataKey="horasActuales"
                    fill={barColors.horasActuales}
                    name="horasActuales"
                    radius={[4, 4, 0, 0]}
                    opacity={0.9}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell
                        key={`actuales-${index}`}
                        fill={barColors.horasActuales}
                        opacity={hoveredBar === index ? 1 : 0.8}
                        stroke={hoveredBar === index ? '#000' : 'none'}
                        strokeWidth={hoveredBar === index ? 1 : 0}
                      />
                    ))}
                    <LabelList dataKey="porcentajeUso" position="top" style={{ fontSize: 10, fill: "#334155" }} />
                  </Bar>

                  <Bar
                    dataKey="diferencia"
                    fill={barColors.diferencia}
                    name="diferencia"
                    radius={[4, 4, 0, 0]}
                    opacity={0.9}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell
                        key={`diferencia-${index}`}
                        fill={
                          entry.estado === 'crítico' ? barColors.critical :
                            entry.estado === 'advertencia' ? barColors.caution :
                              barColors.diferencia
                        }
                        opacity={hoveredBar === index ? 1 : 0.8}
                        stroke={hoveredBar === index ? '#000' : 'none'}
                        strokeWidth={hoveredBar === index ? 1 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No hay datos disponibles con los filtros seleccionados</p>
              </div>
            )}
          </div>
        ) : (
          /* Gráfico de pastel */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="valor"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Estado de la Flota de Equipos</h4>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                    <span className="font-medium">Equipos Críticos</span>
                    <span className="ml-auto font-bold text-red-600">{equiposCriticos}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${(equiposCriticos / totalEquipos) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Equipos que requieren atención inmediata. Prioridad alta.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="font-medium">Equipos en Advertencia</span>
                    <span className="ml-auto font-bold text-yellow-600">{equiposAdvertencia}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${(equiposAdvertencia / totalEquipos) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Equipos que necesitarán mantenimiento próximamente. Prioridad media.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="font-medium">Equipos en Operación Normal</span>
                    <span className="ml-auto font-bold text-green-600">{equiposNormal}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(equiposNormal / totalEquipos) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Equipos en operación regular sin necesidad de mantenimiento próximo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel detallado de equipos con problemas */}
      {mostrarDetalles && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Detalle de Mantenimiento por Equipo</h4>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Ordenar por:</span>
              <select
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="estado">Estado (crítico primero)</option>
                <option value="horas">Horas disponibles</option>
                <option value="alfabetico">Nombre del equipo</option>
              </select>
            </div>
          </div>

          {/* Tabla responsiva */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Mantenimiento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={`row-${index}`} className={
                    item.estado === 'crítico' ? 'bg-red-50' :
                      item.estado === 'advertencia' ? 'bg-yellow-50' : ''
                  }>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.equipo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.patente || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.tipo_medicion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.horasProgramadas} {item.unidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.horasActuales} {item.unidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium"
                        style={{
                          color:
                            item.estado === 'crítico' ? theme.danger :
                              item.estado === 'advertencia' ? theme.warning :
                                theme.success
                        }}
                      >
                        {parseFloat(item.diferencia).toFixed(2)} {item.unidad}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.estado === 'crítico'
                          ? 'bg-red-100 text-red-800'
                          : item.estado === 'advertencia'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastMaintenance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recomendaciones para toma de decisiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Acciones Prioritarias
          </h4>
          <ul className="space-y-2">
            {equiposCriticos > 0 ? (
              <li className="text-sm text-gray-600 flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Programar mantenimiento inmediato para los {equiposCriticos} equipos en estado crítico</span>
              </li>
            ) : (
              <li className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>No hay equipos en estado crítico que requieran atención inmediata</span>
              </li>
            )}
            {equiposAdvertencia > 0 ? (
              <li className="text-sm text-gray-600 flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Planificar mantenimiento preventivo para {equiposAdvertencia} equipos en estado de advertencia</span>
              </li>
            ) : null}
            <li className="text-sm text-gray-600 flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Revisar historial de mantenimiento para equipos con uso intensivo</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Indicadores Clave
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Índice de disponibilidad:</span>
                <span className="text-sm font-medium text-gray-800">
                  {Math.round((equiposNormal / totalEquipos) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(equiposNormal / totalEquipos) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Índice de mantenimiento pendiente:</span>
                <span className="text-sm font-medium text-gray-800">
                  {Math.round(((equiposCriticos + equiposAdvertencia) / totalEquipos) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${((equiposCriticos + equiposAdvertencia) / totalEquipos) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2 border-t pt-2">
              <p>Recomendación: {
                equiposCriticos > 0
                  ? 'Atender equipos críticos para mejorar disponibilidad operativa.'
                  : equiposAdvertencia > (totalEquipos * 0.2)
                    ? 'Programar mantenimientos preventivos para evitar estados críticos.'
                    : 'La flota se encuentra en buen estado operativo.'
              }</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorasTrabajoChart;