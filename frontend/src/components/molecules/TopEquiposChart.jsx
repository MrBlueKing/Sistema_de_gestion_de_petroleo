// TopEquiposChart.jsx - Mejorado para ancho completo

import React, { useState, useEffect, useRef } from "react";
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
import { FiTruck, FiAlertTriangle, FiRefreshCw, FiBarChart2, FiActivity } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

const TopEquiposChart = ({ faenaSeleccionada, fechaDesde, fechaHasta, refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [equiposData, setEquiposData] = useState([]);
  const [error, setError] = useState(null);
  const [totalConsumo, setTotalConsumo] = useState(0);
  const [totalHoras, setTotalHoras] = useState(0);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);
  
  // Usar useRef para evitar llamadas innecesarias a la API
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({ faenaSeleccionada, fechaDesde, fechaHasta, refreshKey });
  
  const NARANJA_PRINCIPAL = "#f97316"; // Orange-500
  const AZUL_SECUNDARIO = "#3b82f6"; // Blue-500 - cambiado para mejor contraste
  
  // Función para verificar si los filtros han cambiado realmente
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed = prevF.faenaSeleccionada !== faenaSeleccionada || 
                   prevF.fechaDesde !== fechaDesde ||
                   prevF.fechaHasta !== fechaHasta ||
                   prevF.refreshKey !== refreshKey ||
                   !initialLoadDone.current;
    
    // Actualizar los filtros previos
    prevFilters.current = { faenaSeleccionada, fechaDesde, fechaHasta, refreshKey };
    return changed;
  };
  
  useEffect(() => {
    // Establecer el ref a true cuando se monta el componente
    isMounted.current = true;
    
    // Limpiar cuando se desmonta
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // 🆕 Función para renderizar etiquetas personalizadas
  const renderCustomLabel = (props, tipo) => {
    const { x, y, width, height, value } = props;
    
    if (!value || value === 0) return null;
    
    const labelX = x + width / 2;
    const labelY = y - 5; // Posición sobre la barra
    
    return (
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="bottom"
        fill={tipo === 'consumo' ? '#dc2626' : '#1e40af'}
        fontSize="11"
        fontWeight="600"
      >
        {value.toLocaleString('es-CL')}{tipo === 'consumo' ? 'L' : 'h'}
      </text>
    );
  };
  // 🔧 FUNCIÓN AUXILIAR: Formatear números grandes de manera elegante
  const formatearNumero = (numero) => {
    if (numero >= 1000000) {
      return `${(numero / 1000000).toFixed(1)}M`;
    }
    if (numero >= 1000) {
      return `${(numero / 1000).toFixed(1)}k`;
    }
    return numero.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  };
  
  // Función para cargar los datos
  const loadData = async () => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      
      // Verificar que las fechas estén presentes
      if (!fechaDesde || !fechaHasta) {
        setError("Por favor, seleccione un rango de fechas válido.");
        setEquiposData([]);
        setLoading(false);
        return;
      }

      // Asegúrate de que la fecha 'Hasta' no sea anterior a 'Desde'
      if (new Date(fechaDesde) > new Date(fechaHasta)) {
        setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
        setEquiposData([]);
        setLoading(false);
        return;
      }

      console.log("TopEquiposChart: Llamando a la API con filtros:", { faenaSeleccionada, fechaDesde, fechaHasta });
      
      // Llamada al servicio con los filtros aplicados
      const data = await consumoService.getTopEquipos(faenaSeleccionada, fechaDesde, fechaHasta);
      
      // Solo actualizar el estado si el componente sigue montado
      if (!isMounted.current) return;
      
      // Verificar si hay datos
      if (data && data.length > 0) {
        // 🆕 MEJORA: Formateo de datos con validación, redondeo y ORDENAMIENTO DE MAYOR A MENOR
        const formattedData = data
          .map(item => ({
            name: item.nombre || (item.name || 'Sin nombre'),
            patente: item.patente || 'S/P',
            consumo: Math.round((item.consumo || item.litros_consumidos || 0) * 100) / 100,
            horas: Math.round((item.horas || item.horas_trabajadas || 0) * 100) / 100,
            eficiencia: (item.horas && item.consumo) 
              ? parseFloat((item.consumo / item.horas).toFixed(2)) 
              : null,
            id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`
          }))
          // 🆕 ORDENAMIENTO: De mayor a menor consumo
          .sort((a, b) => b.consumo - a.consumo)
          // 🆕 LIMITAR A TOP 15 PARA MEJOR VISUALIZACIÓN
          .slice(0, 15);

        const total = formattedData.reduce((sum, item) => sum + item.consumo, 0);
        const totalH = formattedData.reduce((sum, item) => sum + item.horas, 0);
        
        setTotalConsumo(total);
        setTotalHoras(totalH);
        setFechaActualizacion(new Date());
        setEquiposData(formattedData);
        setError(null);
      } else {
        setEquiposData([]);
        setError("No hay datos disponibles para mostrar");
      }
    } catch (err) {
      console.error("Error al cargar datos de equipos:", err);
      if (isMounted.current) {
        setEquiposData([]);
        setError("No se pudieron cargar los datos de equipos. Por favor verifica la conexión con el servidor.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  };

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
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <p className="text-sm text-gray-600 mb-1">Patente: {data.patente}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{entry.dataKey === 'consumo' ? 'Consumo' : 'Horas'}:</span>
                </div>
                <span className="font-medium ml-2">
                  {entry.dataKey === 'consumo' 
                    ? `${entry.value.toLocaleString()} L` 
                    : `${entry.value.toLocaleString()} hrs`
                  }
                </span>
              </div>
            ))}
            {data.eficiencia && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Eficiencia:</span>
                  <span className="font-medium text-orange-600">{data.eficiencia} L/hr</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 🆕 Estadísticas resumidas en la parte superior
  const StatCard = ({ icon: Icon, title, value, color = "text-gray-700", bgColor = "bg-gray-50" }) => (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center">
        <Icon className={`${color} mr-3`} size={20} />
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-lg font-semibold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      
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
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Reintentar
          </button>
        </div>
      ) : equiposData.length === 0 ? (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <FiTruck size={40} className="text-gray-400 mb-4 mx-auto" />
            <p className="text-gray-500">No hay datos disponibles para el período seleccionado</p>
            <p className="text-sm text-gray-400 mt-2">Intente modificar los filtros de fecha o faena</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 🆕 GRÁFICO MEJORADO: Valores más claros y etiquetas sobre barras */}
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={equiposData}
                margin={{ top: 40, right: 30, left: 20, bottom: 100 }}
                barGap={10}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="2 2" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                  tickLine={{ stroke: '#d1d5db' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                {/* 🆕 EJE Y MÁS CLARO con mejor contraste */}
                <YAxis 
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                  tickLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    }
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}k`;
                    }
                    return value.toLocaleString('es-CL');
                  }}
                  width={80}
                  domain={[0, 'dataMax + 200']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="rect"
                  wrapperStyle={{
                    paddingBottom: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                />
                {/* 🆕 BARRAS CON ETIQUETAS DE VALORES USANDO LABELLIST */}
                <Bar 
                  dataKey="consumo" 
                  fill={NARANJA_PRINCIPAL}
                  name="Consumo (Litros)"
                  maxBarSize={65}
                  radius={[3, 3, 0, 0]}
                >
                  <LabelList 
                    dataKey="consumo" 
                    position="top" 
                    content={(props) => renderCustomLabel(props, 'consumo')}
                  />
                </Bar>
                <Bar 
                  dataKey="horas" 
                  fill={AZUL_SECUNDARIO}
                  name="Horas Trabajadas"
                  maxBarSize={65}
                  radius={[3, 3, 0, 0]}
                >
                  <LabelList 
                    dataKey="horas" 
                    position="top" 
                    content={(props) => renderCustomLabel(props, 'horas')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 🆕 INFORMACIÓN ADICIONAL - SIMPLIFICADA */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Período: {new Date(fechaDesde).toLocaleDateString('es-CL')} - {new Date(fechaHasta).toLocaleDateString('es-CL')}
              </span>
              <span className="text-gray-600">
                Mostrando top {equiposData.length} equipos
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopEquiposChart;