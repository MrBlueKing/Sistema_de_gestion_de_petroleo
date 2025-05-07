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
} from "recharts";
import { FiTruck, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
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

const TopEquiposChart = ({ faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(true);
  const [equiposData, setEquiposData] = useState([]);
  const [error, setError] = useState(null);
  const [totalConsumo, setTotalConsumo] = useState(0);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);
  
  const NARANJA_PRINCIPAL = "#f97316"; // Orange-500
  const AZUL_SECUNDARIO = "#60a5fa"; // Blue-400
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Usamos el parámetro faenaSeleccionada para filtrar los datos
        const data = await consumoService.getTopEquipos(faenaSeleccionada);
        
        // Verificar si hay datos
        if (data && data.length > 0) {
          // Formatear los datos con consumo y horas (si están disponibles)
          const formattedData = data.map(item => ({
            name: item.nombre || (item.name || 'Sin nombre'),
            patente: item.patente || 'S/P',
            consumo: item.consumo || (item.litros_consumidos || 0),
            horas: item.horas || (item.horas_trabajadas || 0),
            // Calcular eficiencia si tenemos ambos valores
            eficiencia: (item.horas && item.consumo) 
              ? parseFloat((item.consumo / item.horas).toFixed(2)) 
              : null,
            id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`
          }));
          
          // Calcular el consumo total
          const total = formattedData.reduce((sum, item) => sum + item.consumo, 0);
          setTotalConsumo(total);
          
          // Establecer fecha de actualización
          setFechaActualizacion(new Date());
          
          setEquiposData(formattedData);
          setError(null);
        } else {
          setEquiposData([]);
          setError("No hay datos disponibles para mostrar");
        }
      } catch (err) {
        console.error("Error al cargar datos de equipos:", err);
        setEquiposData([]);
        setError("No se pudieron cargar los datos de equipos. Por favor verifica la conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faenaSeleccionada]);

  // Tooltip personalizado mejorado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">Patente: {data.patente}</p>
          <p className="text-orange-500">
            Consumo: {data.consumo.toLocaleString()} litros
          </p>
          {payload.length > 1 && data.horas > 0 && (
            <p className="text-blue-500">
              Horas: {data.horas.toLocaleString()} hrs
            </p>
          )}
          {data.eficiencia && (
            <p className="text-green-600 text-sm mt-1">
              Eficiencia: {data.eficiencia} L/hr
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Forzar recarga de datos
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 mb-4 overflow-hidden">
        <Title icon={FiTruck}>Equipos con Mayor Consumo de Diésel</Title>
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
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 mb-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <Title icon={FiTruck}>
          Equipos con Mayor Consumo de Diésel
          {faenaSeleccionada !== 'todas' && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Faena: {
                faenaSeleccionada === '1' ? 'Cabildo' :
                faenaSeleccionada === '2' ? 'Catemu' :
                faenaSeleccionada === '3' ? 'Chincolco' :
                faenaSeleccionada === '4' ? 'Tiltil' : faenaSeleccionada
              })
            </span>
          )}
        </Title>
        {!error && equiposData.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
            <span className="text-xs text-gray-600">Consumo (litros)</span>
            
            <span className="inline-block w-3 h-3 bg-blue-400 rounded-full ml-2"></span>
            <span className="text-xs text-gray-600">Horas operadas</span>
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
      ) : equiposData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={equiposData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                barGap={0}
                barCategoryGap={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }} 
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Legend wrapperStyle={{ bottom: 0 }} />
                <Bar 
                  dataKey="consumo" 
                  fill={NARANJA_PRINCIPAL} 
                  radius={[4, 4, 0, 0]}
                  name="Consumo (litros)"
                />
                {equiposData.some(item => item.horas > 0) && (
                  <Bar 
                    dataKey="horas" 
                    fill={AZUL_SECUNDARIO} 
                    radius={[4, 4, 0, 0]} 
                    name="Horas operadas"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-3 px-2">
            <p className="text-xs text-gray-500">
              Consumo total de diésel: <span className="font-medium text-gray-700">{totalConsumo.toLocaleString()} litros</span>
              {fechaActualizacion && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-green-500">
                    (Actualizado: {fechaActualizacion.toLocaleDateString()})
                  </span>
                </>
              )}
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default TopEquiposChart;