import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from "recharts";
import { FiMapPin, FiAlertTriangle, FiFilter } from "react-icons/fi";
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

const FaenasChart = ({ data = [], faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(!data || data.length === 0);
  const [faenasData, setFaenasData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0); // Para el sector activo
  
  // Colores para el gráfico de pastel - Más contrastantes y vivos
  const COLORS = ["#FF7B00", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];
  
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
    // Si hay datos pasados como prop, usarlos
    if (data && data.length > 0) {
      // Asegurarse de que los valores sean números para prevenir NaN
      const processedData = data.map(item => ({
        name: item.name || item.nombre || 'Faena sin nombre',
        value: Number(item.value || item.consumo || 0),
        id: item.id || item.id_faena
      }));
      
      setFaenasData(processedData);
      setLoading(false);
    } else {
      const fetchData = async () => {
        try {
          setLoading(true);
          // Modificamos para pasar el parámetro de faena seleccionada
          const fetchedData = await consumoService.getConsumoFaenas(faenaSeleccionada);
          
          // Verificar si hay datos
          if (fetchedData && fetchedData.length > 0) {
            // Formatear los datos con valores de consumo más significativos
            const formattedData = fetchedData.map(item => ({
              name: item.name || (item.nombre || 'Faena sin nombre'),
              value: Number(item.value || item.consumo || 0),
              id: item.id || item.id_faena
            }));
            
            // Ordenar por valor de mayor a menor para mejor visualización
            formattedData.sort((a, b) => b.value - a.value);
            
            setFaenasData(formattedData);
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
    }
  }, [data, faenaSeleccionada]);
  
  // Filtrar datos cuando cambia la faena seleccionada o los datos
  useEffect(() => {
    if (faenasData && faenasData.length > 0) {
      if (faenaSeleccionada !== 'todas') {
        // Filtrar por la faena seleccionada
        const filtered = faenasData.filter(faena => 
          faena.id === parseInt(faenaSeleccionada) || 
          faena.id === faenaSeleccionada
        );
        
        if (filtered.length > 0) {
          setFilteredData(filtered);
          setError(null);
        } else {
          // Si no hay datos específicos para esta faena, crear un placeholder
          setFilteredData([{
            name: getNombreFaena(faenaSeleccionada),
            value: 100,
            id: faenaSeleccionada
          }]);
        }
      } else {
        // Mostrar todos los datos
        setFilteredData(faenasData);
        setError(null);
      }
    } else {
      setFilteredData([]);
      if (!loading) {
        setError("No hay datos disponibles para las faenas");
      }
    }
  }, [faenasData, faenaSeleccionada, loading]);

  // Calcular el total de los valores para el porcentaje
  const totalValue = filteredData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  
  // Preparar los datos con porcentajes precalculados
  const dataWithPercentages = filteredData.map(item => {
    const value = Number(item.value) || 0;
    const percentage = totalValue > 0 ? (value / totalValue) : 0;
    return {
      ...item,
      value,
      percentage
    };
  });

  // Función para renderizar el sector activo con animación
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { 
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, value 
    } = props;
    
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    // Encontrar el ítem original con los datos de porcentaje
    const originalItem = dataWithPercentages.find(item => item.name === payload.name);
    const percent = originalItem ? originalItem.percentage : 0;
  
    return (
      <g>
        {/* Sector principal */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5} // Aumentar el tamaño del sector activo
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        {/* Borde exterior */}
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 8}
          fill={fill}
        />
        {/* Línea que conecta al texto */}
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        {/* Círculo en el final de la línea */}
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        {/* Texto con el nombre */}
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          fontSize={12}
        >{payload.name}</text>
        {/* Texto con el valor */}
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={15}
          textAnchor={textAnchor}
          fill="#666"
          fontSize={11}
        >
          {`${value.toLocaleString('es-CL')} litros (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  // Personalizar tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      // Buscar el porcentaje en nuestros datos precalculados
      const itemName = payload[0].name;
      const originalItem = dataWithPercentages.find(item => item.name === itemName);
      const percent = originalItem ? originalItem.percentage : 0;
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{itemName}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Consumo:</span> {Number(payload[0].value).toLocaleString('es-CL')} litros
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Porcentaje:</span> {(percent * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Función para manejar el cambio de sector activo
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Title icon={FiMapPin}>Consumo por Faena</Title>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Cargando datos...</div>
        </div>
      </Card>
    );
  }

  // Ajustar título según si estamos filtrando por una faena específica
  const chartTitle = faenaSeleccionada !== 'todas' 
    ? `Consumo de ${getNombreFaena(faenaSeleccionada)}`
    : "Consumo por Faena";

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <Title icon={FiMapPin}>{chartTitle}</Title>
        
        {faenaSeleccionada !== 'todas' && (
          <div className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            <FiFilter className="mr-1" size={14} />
            <span>
              {getNombreFaena(faenaSeleccionada)}
            </span>
          </div>
        )}
      </div>
      
      {error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <FiAlertTriangle size={40} className="text-orange-500 mb-4" />
          <div className="text-gray-600">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      ) : (
        <div className="h-64 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={dataWithPercentages}
                cx="50%"
                cy="50%"
                innerRadius={faenaSeleccionada !== 'todas' ? 0 : 30} // Sin hueco central si solo hay una faena
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                isAnimationActive={true}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => {
                  // Formatear la leyenda para mostrar valor y porcentaje
                  if (index < dataWithPercentages.length) {
                    const item = dataWithPercentages[index];
                    const percent = (item.percentage * 100).toFixed(1);
                    return `${value} (${percent}%)`;
                  }
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default FaenasChart;