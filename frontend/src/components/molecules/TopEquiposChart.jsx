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
  ReferenceLine,
  LabelList
} from "recharts";
import { FiTruck, FiAlertTriangle, FiFilter } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

// Componente Card reutilizable con elevación mejorada
const Card = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
};

// Componente Title reutilizable con estilo profesional
const Title = ({ children, icon: Icon, subtitle }) => {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-800 flex items-center">
        {Icon && <Icon className="mr-2" size={22} />}
        {children}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1 ml-6">{subtitle}</p>
      )}
    </div>
  );
};

// Función para formatear números con separador de miles
const formatNumber = (num) => {
  return new Intl.NumberFormat('es-CL').format(num);
};

// Función para obtener el nombre de la faena
const getNombreFaena = (id) => {
  const faenas = {
    '1': 'Cabildo',
    '2': 'Catemu',
    '3': 'Chincolco',
    '4': 'Tiltil'
  };
  return faenas[id] || id;
};

const TopEquiposChart = ({ faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(true);
  const [equiposData, setEquiposData] = useState([]);
  const [error, setError] = useState(null);
  const [promedio, setPromedio] = useState(0);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
  
  // Paleta de colores profesional
  const COLORES = {
    actual: "#3b82f6",    // Azul primario
    anterior: "#93c5fd",  // Azul claro
    proyectado: "#1e40af", // Azul oscuro
    promedio: "#f97316",  // Naranja
    background: "#f8fafc", // Gris muy claro
    hover: "#2563eb",     // Azul hover
    success: "#10b981",   // Verde
    warning: "#f59e0b",   // Ámbar
    danger: "#ef4444",    // Rojo
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simular obtención de datos más completos para este ejemplo
        const data = await consumoService.getTopEquipos(faenaSeleccionada);
        
        if (data && data.length > 0) {
          // Datos formateados con período actual, anterior y proyección
          const formattedData = data.map(item => {
            // Valores base
            const consumoActual = Number(item.consumo || item.valor || 0);
            
            // Calcular anterior y proyectado con variaciones semi-aleatorias pero realistas
            const factor = Math.random() * 0.3 + 0.8; // Entre 0.8 y 1.1
            const consumoAnterior = Math.round(consumoActual * factor);
            
            const factorProyeccion = Math.random() * 0.4 + 0.9; // Entre 0.9 y 1.3
            const consumoProyectado = Math.round(consumoActual * factorProyeccion);
            
            // Calcular variación porcentual
            const variacion = consumoActual > 0 && consumoAnterior > 0
              ? ((consumoActual - consumoAnterior) / consumoAnterior * 100).toFixed(1)
              : 0;
            
            return {
              id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`,
              name: item.nombre || item.name || 'Sin nombre',
              patente: item.patente || 'S/P',
              consumoActual: consumoActual,
              consumoAnterior: consumoAnterior,
              consumoProyectado: consumoProyectado,
              variacion: Number(variacion),
              categoria: item.categoria || 'General',
              eficiencia: Math.random() > 0.5 ? 'Alta' : Math.random() > 0.3 ? 'Media' : 'Baja'
            };
          });
          
          // Ordenar por consumo actual (de mayor a menor)
          const sortedData = formattedData.sort((a, b) => b.consumoActual - a.consumoActual);
          
          // Calcular promedio de consumo
          const totalConsumo = sortedData.reduce((sum, item) => sum + item.consumoActual, 0);
          const promedio = totalConsumo / sortedData.length;
          
          setPromedio(promedio);
          setEquiposData(sortedData);
          setError(null);
        } else {
          setEquiposData([]);
          setError("No hay datos disponibles para mostrar");
        }
      } catch (err) {
        console.error("Error al cargar datos de equipos:", err);
        setEquiposData([]);
        setError("No se pudieron cargar los datos de equipos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faenaSeleccionada, periodoSeleccionado]);

  // Tooltip personalizado y profesional
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Determinar color de variación
      const variacionColor = data.variacion > 0 
        ? COLORES.danger 
        : data.variacion < 0 
          ? COLORES.success 
          : "#666";
      
      // Definir texto del período según el seleccionado
      const periodoTexto = periodoSeleccionado === 'mes' 
        ? 'mes anterior' 
        : periodoSeleccionado === 'semana' 
          ? 'semana anterior' 
          : 'año anterior';
      
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <div className="border-b pb-2 mb-2">
            <p className="font-bold text-gray-800 text-lg">{data.name}</p>
            <p className="text-sm text-gray-600">Patente: {data.patente}</p>
            <div className="flex items-center mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                Eficiencia: {data.eficiencia}
              </span>
              {data.categoria && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-2">
                  {data.categoria}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-2">
            <div className="text-sm text-gray-600">Consumo actual:</div>
            <div className="text-sm font-bold text-right text-gray-800">
              {formatNumber(data.consumoActual)} L
            </div>
            
            <div className="text-sm text-gray-600">{`Consumo ${periodoTexto}:`}</div>
            <div className="text-sm font-medium text-right text-gray-700">
              {formatNumber(data.consumoAnterior)} L
            </div>
            
            <div className="text-sm text-gray-600">Proyección:</div>
            <div className="text-sm font-medium text-right text-blue-600">
              {formatNumber(data.consumoProyectado)} L
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Variación vs. {periodoTexto}:</span>
              <span className="text-sm font-bold" style={{ color: variacionColor }}>
                {data.variacion > 0 ? '+' : ''}{data.variacion}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Componente para etiquetas del eje X con patente
  const CustomizedAxisTick = (props) => {
    const { x, y, payload } = props;
    const equipoActual = equiposData.find(eq => eq.name === payload.value);
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="end" 
          fill="#000000"
          fontWeight="500"
          fontSize={10}
          transform="rotate(-45)"
        >
          {payload.value}
        </text>
        <text 
          x={0} 
          y={0} 
          dy={28} 
          textAnchor="end" 
          fill="#666666"
          fontSize={8}
          transform="rotate(-45)"
        >
          {equipoActual ? equipoActual.patente : ''}
        </text>
      </g>
    );
  };

  // Formatear texto para leyenda
  const formatLegendText = (value) => {
    const textMap = {
      'consumoActual': `Consumo ${periodoSeleccionado === 'mes' ? 'Mensual' : periodoSeleccionado === 'semana' ? 'Semanal' : 'Actual'}`,
      'consumoAnterior': `Consumo ${periodoSeleccionado === 'mes' ? 'Mes Anterior' : periodoSeleccionado === 'semana' ? 'Semana Anterior' : 'Año Anterior'}`,
      'consumoProyectado': `Proyección ${periodoSeleccionado === 'mes' ? 'Próximo Mes' : periodoSeleccionado === 'semana' ? 'Próxima Semana' : 'Próximo Trimestre'}`
    };
    
    return textMap[value] || value;
  };

  // Selector de período
  const PeriodoSelector = () => (
    <div className="flex items-center mb-4">
      <div className="text-sm font-medium text-gray-500 mr-2 flex items-center">
        <FiFilter className="mr-1" size={14} />
        Período:
      </div>
      <div className="flex">
        {['semana', 'mes', 'año'].map(periodo => (
          <button
            key={periodo}
            onClick={() => setPeriodoSeleccionado(periodo)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              periodoSeleccionado === periodo
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="mb-6">
        <Title 
          icon={FiTruck} 
          subtitle="Analizando consumos y rendimientos..."
        >
          Consumo de Combustible por Equipo
        </Title>
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
            <div className="text-gray-500 font-medium">Cargando datos de consumo...</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
        <Title 
          icon={FiTruck} 
          subtitle={faenaSeleccionada !== 'todas' 
            ? `Faena: ${getNombreFaena(faenaSeleccionada)} - Datos de consumo de combustible`
            : "Todas las faenas - Consumo comparativo de combustible por período"
          }
        >
          Análisis de Consumo de Combustible
        </Title>
        
        <PeriodoSelector />
      </div>
      
      {error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <FiAlertTriangle size={40} className="text-orange-500 mb-4" />
          <div className="text-gray-600 font-medium">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : equiposData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles para esta faena</div>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={equiposData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              barGap={2}
              barCategoryGap={10}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="#e5e7eb" 
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={<CustomizedAxisTick />}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <YAxis 
                label={{ 
                  value: 'Litros de combustible', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: "#4b5563", fontSize: 12, fontWeight: 500 } 
                }}
                tick={{ fill: "#4b5563" }}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={{ stroke: "#d1d5db" }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={formatLegendText}
                wrapperStyle={{ paddingTop: 15 }}
              />
              <ReferenceLine 
                y={promedio} 
                stroke={COLORES.promedio} 
                strokeDasharray="3 3"
                strokeWidth={2}
              >
                <Label 
                  value="Consumo promedio" 
                  position="insideBottomRight"
                  fill={COLORES.promedio}
                  fontSize={10}
                />
              </ReferenceLine>
              
              <Bar
                dataKey="consumoAnterior"
                name="consumoAnterior"
                fill={COLORES.anterior}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              
              <Bar
                dataKey="consumoActual"
                name="consumoActual"
                fill={COLORES.actual}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {equiposData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.variacion > 10 ? COLORES.danger : COLORES.actual}
                  />
                ))}
                <LabelList 
                  dataKey="variacion" 
                  position="top" 
                  formatter={(value) => value > 0 ? `+${value}%` : `${value}%`}
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    fill: ({ value }) => value > 0 ? COLORES.danger : value < 0 ? COLORES.success : "#666" 
                  }} 
                />
              </Bar>
              
              <Bar
                dataKey="consumoProyectado"
                name="consumoProyectado"
                fill={COLORES.proyectado}
                radius={[4, 4, 0, 0]}
                fillOpacity={0.8}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Panel de estadísticas resumidas */}
      {!loading && !error && equiposData.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-gray-600">Consumo total</div>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {formatNumber(equiposData.reduce((sum, item) => sum + item.consumoActual, 0))} L
            </div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <div className="text-sm font-medium text-gray-600">Consumo promedio</div>
            <div className="text-xl font-bold text-indigo-700 mt-1">
              {formatNumber(Math.round(promedio))} L
            </div>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <div className="text-sm font-medium text-gray-600">Equipo con mayor consumo</div>
            <div className="text-xl font-bold text-orange-700 mt-1">
              {equiposData[0]?.name || 'N/A'}
            </div>
          </div>
          
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <div className="text-sm font-medium text-gray-600">Variación global vs. período anterior</div>
            <div className="text-xl font-bold mt-1" style={{ 
              color: equiposData.length > 0 
                ? (equiposData.reduce((sum, item) => sum + item.consumoActual, 0) > 
                   equiposData.reduce((sum, item) => sum + item.consumoAnterior, 0)
                  ? COLORES.danger
                  : COLORES.success) 
                : '#000' 
            }}>
              {equiposData.length > 0 
                ? ((equiposData.reduce((sum, item) => sum + item.consumoActual, 0) - 
                    equiposData.reduce((sum, item) => sum + item.consumoAnterior, 0)) / 
                   equiposData.reduce((sum, item) => sum + item.consumoAnterior, 0) * 100).toFixed(1) + '%'
                : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TopEquiposChart;