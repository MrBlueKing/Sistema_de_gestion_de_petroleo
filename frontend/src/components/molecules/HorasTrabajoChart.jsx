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
  LabelList
} from "recharts";
import { FiClock, FiAlertTriangle, FiTool } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

const HorasTrabajoChart = ({ faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Colores para las barras del gráfico
  const barColors = {
    horasProgramadas: "#1e293b", // tailwind gray-800
    horasActuales: "#3b82f6",    // tailwind blue-500
    diferencia: "#22c55e",       // tailwind green-500
    critical: "#dc2626",         // tailwind red-600
    caution: "#eab308",          // tailwind yellow-500
    normal: "#22c55e"            // tailwind green-500
  };

  // Colores de texto para estados
  const textColors = {
    crítico: "#dc2626",    // tailwind red-600
    advertencia: "#eab308", // tailwind yellow-500
    normal: "#22c55e"       // tailwind green-500
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("HorasTrabajoChart: Fetching data for faena:", faenaSeleccionada);
        
        const data = await consumoService.getHorasTrabajo(faenaSeleccionada);
        console.log("HorasTrabajoChart: Data received:", data);
        
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
              
              return {
                ...item,
                horasProgramadas,
                horasActuales,
                diferencia,
                estado,
                proximaMantencion,
                porcentajeUso,
                unidad
              };
            });
            
            // Ordenar por estado (crítico primero, luego advertencia, luego normal)
            const sortedData = processedData.sort((a, b) => {
              const estadoOrden = { "crítico": 0, "advertencia": 1, "normal": 2 };
              return estadoOrden[a.estado] - estadoOrden[b.estado];
            });
            
            setChartData(sortedData);
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

  // Renderizado cuando está cargando
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex justify-between mb-6">
          <div className="flex items-center">
            <FiClock className="text-gray-600 mr-3" size={22} />
            <h3 className="text-xl font-semibold text-gray-800">Control de Mantenimiento de Equipos</h3>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
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
            <FiClock className="text-gray-600 mr-3" size={22} />
            <h3 className="text-xl font-semibold text-gray-800">Control de Mantenimiento de Equipos</h3>
          </div>
        </div>
        <div className="h-80 flex flex-col items-center justify-center text-center">
          <FiAlertTriangle size={48} className="text-orange-500 mb-4" />
          <div className="text-gray-700 font-medium mb-3">{error}</div>
          <p className="text-gray-500 mb-4 max-w-lg">No se pudieron cargar los datos de mantenimiento. Por favor verifique su conexión e intente nuevamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
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
            <FiClock className="text-gray-600 mr-3" size={22} />
            <h3 className="text-xl font-semibold text-gray-800">
              Control de Mantenimiento de Equipos 
              {faenaSeleccionada !== 'todas' ? ` - ${getNombreFaena(faenaSeleccionada)}` : ''}
            </h3>
          </div>
        </div>
        <div className="h-80 flex flex-col items-center justify-center">
          <FiTool size={48} className="text-gray-400 mb-4" />
          <div className="text-gray-500 font-medium">No hay datos de mantenimiento disponibles para esta faena</div>
          <p className="text-gray-400 text-sm mt-2">Intente seleccionar otra faena o contacte al administrador</p>
        </div>
      </div>
    );
  }

  // Tooltip personalizado simplificado
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
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Uso actual:</span>
              <span className="text-sm font-bold">{data.porcentajeUso}</span>
            </div>
            
            <div className="mt-2 bg-gray-100 p-2 rounded text-sm">
              <span className={`font-medium ${
                data.estado === 'crítico' ? 'text-red-600' : 
                data.estado === 'advertencia' ? 'text-orange-500' : 'text-green-600'
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

  // Calcular cuántos equipos están en cada estado
  const equiposCriticos = chartData.filter(item => item.estado === 'crítico').length;
  const equiposAdvertencia = chartData.filter(item => item.estado === 'advertencia').length;
  const equiposNormal = chartData.filter(item => item.estado === 'normal').length;

  // Función personalizada para formatear las etiquetas del eje X con colores según estado
  const CustomAxisTick = (props) => {
    const { x, y, payload, dataKey, data } = props;
    const equipoData = data.find(item => item[dataKey] === payload.value);
    
    // Color basado en el estado
    const textColor = equipoData ? textColors[equipoData.estado] : '#000';
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="end" 
          fill={textColor}
          fontWeight="500"
          fontSize={12}
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
    const primerTipo = chartData.length > 0 ? chartData[0].tipo_medicion : null;
    const todosMismoTipo = chartData.every(item => item.tipo_medicion === primerTipo);
    
    if (todosMismoTipo) {
      return chartData[0].tipo_medicion === 'Horometro' ? 'Horas' : 'Kilómetros';
    } else {
      return 'Horas/Kilómetros';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex flex-col md:flex-row md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <FiClock className="text-gray-600 mr-3" size={22} />
          <h3 className="text-xl font-semibold text-gray-800">
            Control de Mantenimiento de Equipos
            {faenaSeleccionada !== 'todas' ? ` - ${getNombreFaena(faenaSeleccionada)}` : ''}
          </h3>
        </div>
        
        <div className="flex gap-4">
          {/* Botón de detalles */}
          <button 
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-200 text-sm font-medium flex items-center hover:bg-blue-100 transition-colors"
          >
            <FiTool className="mr-1.5" size={14} />
            {mostrarDetalles ? 'Ocultar detalles' : 'Mostrar detalles'}
          </button>
        </div>
      </div>

      <div className="h-80 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            barSize={35}
            barGap={2}
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
              tick={<CustomAxisTick dataKey="equipo" data={chartData} />}
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
              {chartData.map((entry, index) => (
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
              {chartData.map((entry, index) => (
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
              {chartData.map((entry, index) => (
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
      </div>
      
      {/* Resumen simple de estados */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center bg-red-50 px-3 py-1.5 rounded-md border border-red-100">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span className="text-gray-700 ml-2">Crítico: {equiposCriticos} equipo(s)</span>
        </div>
        <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-md border border-yellow-100">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-700 ml-2">Advertencia: {equiposAdvertencia} equipo(s)</span>
        </div>
        <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-md border border-green-100">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-700 ml-2">Normal: {equiposNormal} equipo(s)</span>
        </div>
      </div>
      
      {/* Panel detallado de equipos con problemas */}
      {mostrarDetalles && (
        <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-800">Estado de los equipos</h4>
            <button 
              onClick={() => setMostrarDetalles(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Equipos críticos */}
          {equiposCriticos > 0 ? (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                <span className="font-medium text-gray-700">Equipos críticos - Mantenimiento requerido:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-5">
                {chartData
                  .filter(item => item.estado === 'crítico')
                  .map((item, idx) => (
                    <div key={`critical-${idx}`} className="flex items-center text-sm bg-red-50 p-2 rounded border border-red-100">
                      <span className="font-medium">{item.equipo}</span>
                      <span className="ml-2 text-xs text-gray-500">({item.patente || 'Sin patente'})</span>
                      <span className="ml-auto text-xs text-red-600">
                        {item.horasActuales}/{item.horasProgramadas}{item.unidad}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          ) : null}
          
          {/* Equipos en advertencia */}
          {equiposAdvertencia > 0 ? (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="font-medium text-gray-700">Equipos en advertencia - Próximos a mantenimiento:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-5">
                {chartData
                  .filter(item => item.estado === 'advertencia')
                  .map((item, idx) => (
                    <div key={`warning-${idx}`} className="flex items-center text-sm bg-yellow-50 p-2 rounded border border-yellow-100">
                      <span className="font-medium">{item.equipo}</span>
                      <span className="ml-2 text-xs text-gray-500">({item.patente || 'Sin patente'})</span>
                      <span className="ml-auto text-xs text-yellow-600">
                        {item.diferencia}{item.unidad} restantes
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          ) : null}
          
          {/* Equipos normales - agrupado para simplicidad */}
          {equiposNormal > 0 ? (
            <div>
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium text-gray-700">
                  Equipos en operación normal: {equiposNormal} unidades
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-5">
                {chartData
                  .filter(item => item.estado === 'normal')
                  .slice(0, 8) // Solo mostrar los primeros 8 para no sobrecargar la UI
                  .map((item, idx) => (
                    <div key={`normal-${idx}`} className="flex items-center text-sm bg-green-50 p-2 rounded border border-green-100">
                      <span className="font-medium truncate">{item.equipo}</span>
                      <span className="ml-auto text-xs text-green-600">
                        {Math.round(item.diferencia)}{item.unidad}
                      </span>
                    </div>
                  ))
                }
                {equiposNormal > 8 && (
                  <div className="flex items-center justify-center text-sm bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500">+ {equiposNormal - 8} más</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default HorasTrabajoChart;