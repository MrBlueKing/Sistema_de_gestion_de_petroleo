import React, { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from "recharts";
import { FiMapPin, FiAlertTriangle, FiFilter, FiRefreshCw } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

// Componente Card reutilizable
const Card = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

// Componente Title reutilizable
const Title = ({ children, icon: Icon }) => {
  return (
    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
      {Icon && <Icon className="mr-2" size={20} />}
      {children}
    </h2>
  );
};

const FaenasChart = ({ 
  data = [], 
  faenaSeleccionada = 'todas', 
  setFaenaSeleccionada, 
  fechaDesde, 
  fechaHasta,
  refreshKey = 0 // Nueva prop para controlar refrescos explícitos
}) => {
  const [loading, setLoading] = useState(true);
  const [faenasData, setFaenasData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Ref para almacenar datos de la última consulta exitosa
  const lastSuccessfulData = useRef(null);
  
  // Ref para la última solicitud realizada
  const lastRequest = useRef({ faenaSeleccionada, fechaDesde, fechaHasta, refreshKey });
  
  const COLORS = ["#FF7B00", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];

  const getNombreFaena = (id) => {
    const faenas = {
      '1': 'Cabildo',
      '2': 'Catemu',
      '3': 'Chincolco',
      '4': 'Tiltil'
    };
    return faenas[id] || 'Faena Seleccionada';
  };
  
  // Función optimizada para verificar si debemos hacer una nueva solicitud a la API
  const shouldFetchData = () => {
    const curr = { faenaSeleccionada, fechaDesde, fechaHasta, refreshKey };
    const prev = lastRequest.current;
    
    // Verificar si alguno de los filtros cambió o si refreshKey cambió
    const changed = prev.faenaSeleccionada !== curr.faenaSeleccionada || 
                    prev.fechaDesde !== curr.fechaDesde ||
                    prev.fechaHasta !== curr.fechaHasta ||
                    prev.refreshKey !== curr.refreshKey;
                    
    // Actualizar la última solicitud
    if (changed) {
      lastRequest.current = curr;
    }
    
    return changed;
  };

  useEffect(() => {
    // Solo cargar datos cuando los filtros cambien o cuando refreshKey cambie
    if (!shouldFetchData()) {
      // Si tenemos datos en caché y no necesitamos actualizar, usarlos
      if (lastSuccessfulData.current) {
        setFaenasData(lastSuccessfulData.current);
        setLoading(false);
        return;
      }
    }
    
    const processProvidedData = () => {
      if (data && data.length > 0) {
        const processedData = data.map(item => ({
          name: item.name || item.nombre || 'Faena sin nombre',
          value: Number(item.value || item.consumo || 0),
          id: item.id || item.id_faena
        }));
        setFaenasData(processedData);
        lastSuccessfulData.current = processedData; // Guardar en caché
        setLoading(false);
        return true;
      }
      return false;
    };

    // Intentar usar datos proporcionados directamente
    if (processProvidedData()) return;

    // Si no hay datos proporcionados o si están vacíos, hacer la llamada a la API
    const fetchData = async () => {
      if (!fechaDesde || !fechaHasta) {
        setError("Por favor, seleccione un rango de fechas válido.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log("FaenasChart: Llamando a la API con filtros:", { 
          faenaSeleccionada, 
          fechaDesde, 
          fechaHasta,
          refreshKey // Log para depuración
        });
        
        // Incluye fechaDesde y fechaHasta en la llamada a la API
        const fetchedData = await consumoService.getConsumoFaenas(faenaSeleccionada, fechaDesde, fechaHasta);
        
        if (fetchedData && fetchedData.length > 0) {
          const formattedData = fetchedData.map(item => ({
            name: item.name || (item.nombre || 'Faena sin nombre'),
            value: Number(item.value || item.consumo || 0),
            id: item.id || item.id_faena
          }));
          formattedData.sort((a, b) => b.value - a.value);
          setFaenasData(formattedData);
          lastSuccessfulData.current = formattedData; // Guardar en caché
          setError(null);
        } else {
          setFaenasData([]);
          setError("No hay datos disponibles para las faenas");
        }
      } catch (err) {
        console.error("Error al cargar datos de faenas:", err);
        setFaenasData([]);
        setError("Error al cargar datos de faenas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [data, faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  useEffect(() => {
    if (faenasData && faenasData.length > 0) {
      if (faenaSeleccionada !== 'todas') {
        const filtered = faenasData.filter(faena =>
          faena.id === parseInt(faenaSeleccionada) || faena.id === faenaSeleccionada
        );
        setFilteredData(filtered.length > 0 ? filtered : [{
          name: getNombreFaena(faenaSeleccionada),
          value: 100,
          id: faenaSeleccionada
        }]);
      } else {
        setFilteredData(faenasData);
      }
    } else {
      setFilteredData([]);
      if (!loading) setError("No hay datos disponibles para las faenas");
    }
  }, [faenasData, faenaSeleccionada, loading]);

  const totalValue = filteredData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const dataWithPercentages = filteredData.map(item => {
    const value = Number(item.value) || 0;
    const percentage = totalValue > 0 ? (value / totalValue) : 0;
    return { ...item, value, percentage };
  });

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    const originalItem = dataWithPercentages.find(item => item.name === payload.name);
    const percent = originalItem ? originalItem.percentage : 0;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
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
          outerRadius={outerRadius + 8}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{payload.name}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={15} textAnchor={textAnchor} fill="#666" fontSize={11}>
          {`${value.toLocaleString('es-CL')} litros (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const itemName = payload[0].name;
      const originalItem = dataWithPercentages.find(item => item.name === itemName);
      const percent = originalItem ? originalItem.percentage : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{itemName}</p>
          <p className="text-sm text-gray-600"><span className="font-medium">Consumo:</span> {Number(payload[0].value).toLocaleString('es-CL')} litros</p>
          <p className="text-sm text-gray-600"><span className="font-medium">Porcentaje:</span> {(percent * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Cambiar manualmente la última solicitud para forzar una nueva llamada
    lastRequest.current = {
      ...lastRequest.current,
      refreshKey: lastRequest.current.refreshKey + 1
    };
    // Pequeño delay para permitir que el estado de carga se actualice visualmente
    setTimeout(() => {
      shouldFetchData(); // Este llamado actualizará la referencia
    }, 100);
  };

  const chartTitle = faenaSeleccionada !== 'todas' ? `Consumo de ${getNombreFaena(faenaSeleccionada)}` : "Consumo por Faena";
  
  // Función para formatear fecha en formato dd-mm-yyyy
const formatearFecha = (fechaStr) => fechaStr.split('-').reverse().join('-');

 // Añadir información de fechas si están disponibles
const fechasInfo = fechaDesde && fechaHasta 
  ? `Del ${formatearFecha(fechaDesde)} al ${formatearFecha(fechaHasta)}`
  : "";

  if (loading) {
    return (
      <Card className="mb-4">
        <div className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <FiMapPin className="mr-2" size={20} />
          {chartTitle}
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin text-orange-500 mb-3">
              <FiRefreshCw size={30} />
            </div>
            <div className="text-gray-500">Cargando datos...</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title icon={FiMapPin}>{chartTitle}</Title>
          {fechasInfo && <p className="text-sm text-gray-500 mt-1">{fechasInfo}</p>}
        </div>
        {faenaSeleccionada !== 'todas' && (
          <div className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            <FiFilter className="mr-1" size={14} />
            <span>{getNombreFaena(faenaSeleccionada)}</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <FiAlertTriangle size={40} className="text-orange-500 mb-4" />
          <div className="text-gray-600">{error}</div>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Reintentar
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={dataWithPercentages}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default FaenasChart;