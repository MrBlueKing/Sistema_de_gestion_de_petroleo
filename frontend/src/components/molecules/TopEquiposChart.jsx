// TopEquiposChart.jsx - Con Rendimiento Sencillo

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
import { FiTruck, FiAlertTriangle, FiRefreshCw, FiBarChart2, FiDroplet  } from "react-icons/fi";
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
  const AZUL_SECUNDARIO = "#3b82f6"; // Blue-500
  const VERDE_RENDIMIENTO = "#10b981"; // Green-500 para rendimiento
  
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
    
    let color, unidad;
    switch(tipo) {
      case 'consumo':
        color = '#dc2626';
        unidad = 'L';
        break;
      case 'medicion':
        color = '#1e40af';
        unidad = ''; // Se determinará dinámicamente
        break;
      case 'rendimiento':
        color = '#059669';
        unidad = 'L/h';
        break;
      default:
        color = '#374151';
        unidad = '';
    }
    
    return (
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="bottom"
        fill={color}
        fontSize="11"
        fontWeight="600"
      >
        {tipo === 'rendimiento' 
          ? value.toFixed(1) + unidad
          : value.toLocaleString('es-CL') + unidad
        }
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
        // 🆕 MEJORA: Formateo de datos incluyendo rendimiento_sencillo y tipo de medición
        const formattedData = data
          .map(item => ({
            name: item.nombre || (item.name || 'Sin nombre'),
            patente: item.patente || 'S/P',
            consumo: Math.round((item.consumo || item.litros_consumidos || 0) * 100) / 100,
            // 🆕 Detectar si es KM o Horas basado en los datos
            medicion: Math.round((item.horas_reales || item.horas || item.km || item.medicion || 0) * 100) / 100,
            tipo_medicion: item.tipo_medicion || (item.km ? 'Kilometraje' : 'Horometro'),
            // 🆕 NUEVO: Rendimiento sencillo
            rendimiento_sencillo: item.rendimiento_sencillo !== null && item.rendimiento_sencillo !== undefined 
              ? parseFloat(item.rendimiento_sencillo) 
              : null,
            litros_confirmados: parseFloat(item.litros_confirmados || 0),
            horas_reales: parseFloat(item.horas_reales || 0),
            total_consumos: item.total_consumos || 0,
            interpretacion_rendimiento: item.interpretacion_rendimiento || '',
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
        const totalMedicion = formattedData.reduce((sum, item) => sum + item.medicion, 0);
        
        setTotalConsumo(total);
        setTotalHoras(totalMedicion); // Reutilizar para almacenar total de medición (km o horas)
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

  // 🆕 Tooltip personalizado mejorado CON RENDIMIENTO SENCILLO Y DETECCIÓN DE TIPO
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const esMedicionKm = data.tipo_medicion === 'Kilometraje';
      const unidadMedicion = esMedicionKm ? 'km' : 'hrs';
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <p className="text-sm text-gray-600 mb-2">Patente: {data.patente}</p>
          
          {/* Datos principales de las barras */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: '#f97316' }}
                ></div>
                <span className="text-sm text-gray-700">Consumo:</span>
              </div>
              <span className="font-medium ml-2">
                {data.consumo.toLocaleString()} L
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: '#3b82f6' }}
                ></div>
                <span className="text-sm text-gray-700">
                  {esMedicionKm ? 'Kilómetros' : 'Horas'} reales:
                </span>
              </div>
              <span className="font-medium ml-2">
                {data.horas_reales.toFixed(1)} {unidadMedicion}
              </span>
            </div>
          </div>

          {/* 🆕 SECCIÓN DE RENDIMIENTO SENCILLO */}
          <div className="pt-3 border-t border-gray-200">
            <div className="space-y-2">
              {/* Rendimiento sencillo */}
              {data.rendimiento_sencillo !== null ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                    Rendimiento:
                  </span>
                  <span className="font-medium text-green-600">
                    {data.rendimiento_sencillo.toFixed(2)} L/{esMedicionKm ? 'km' : 'h'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Rendimiento:</span>
                  <span className="text-sm text-gray-400 italic">No calculable</span>
                </div>
              )}
              
              {/* Interpretación */}
              {data.interpretacion_rendimiento && (
                <div className="text-xs text-gray-500 italic">
                  {data.interpretacion_rendimiento}
                </div>
              )}
              
              {/* Datos adicionales */}
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <div>Litros confirmados: {data.litros_confirmados.toLocaleString()} L</div>
                <div>{esMedicionKm ? 'Kilómetros' : 'Horas'} reales: {data.horas_reales.toFixed(1)} {esMedicionKm ? 'km' : 'h'}</div>
                <div>Total consumos: {data.total_consumos}</div>
              </div>
            </div>
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
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles para el período seleccionado</div>
        </div>
      ) : (
        <>
          {/* 🆕 ESTADÍSTICAS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={FiTruck}
              title="Equipos"
              value={equiposData.length}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={FiDroplet}
              title="Consumo Total"
              value={`${formatearNumero(totalConsumo)} L`}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
            <StatCard
              icon={FiBarChart2}
              title="Rendimiento"
              value={equiposData.filter(e => e.rendimiento_sencillo !== null).length > 0 
                ? `${formatearNumero(totalConsumo)}L/${(equiposData.filter(e => e.rendimiento_sencillo !== null)
                    .reduce((sum, e) => sum + e.rendimiento_sencillo, 0) / 
                    equiposData.filter(e => e.rendimiento_sencillo !== null).length).toFixed(1)} acordado`
                : `${formatearNumero(totalConsumo)}L/N.A rendimiento`
              }
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </div>

          {/* 🆕 GRÁFICO PRINCIPAL */}
          <div style={{ width: "100%", height: 500 }}>
            <ResponsiveContainer>
              <BarChart
                data={equiposData}
                margin={{
                  top: 30,
                  right: 30,
                  left: 20,
                  bottom: 50,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#374151', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
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
                {/* 🆕 SOLO UNA BARRA: Consumo */}
                <Bar 
                  dataKey="consumo" 
                  fill={NARANJA_PRINCIPAL}
                  name="Consumo (Litros)"
                  maxBarSize={80}
                  radius={[3, 3, 0, 0]}
                >
                  <LabelList 
                    dataKey="consumo" 
                    position="top" 
                    content={(props) => renderCustomLabel(props, 'consumo')}
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