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
import { FiTruck, FiAlertTriangle } from "react-icons/fi";
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
  
  const NARANJA_PRINCIPAL = "#ff7b00";
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Usamos el parámetro faenaSeleccionada para filtrar los datos
        const data = await consumoService.getTopEquipos(faenaSeleccionada);
        
        // Verificar si hay datos
        if (data && data.length > 0) {
          // Formatear los datos (ajuste de nombre de propiedades si es necesario)
          const formattedData = data.map(item => ({
            name: item.nombre || (item.name || 'Sin nombre'),
            patente: item.patente || 'S/P', // Agregamos la patente pero la mostraremos en el tooltip
            consumo: item.consumo || (item.valor || 0),
            id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`
          }));
          
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
  }, [faenaSeleccionada]); // Añadimos faenaSeleccionada como dependencia

  // Tooltip personalizado para mostrar nombre y patente
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">Patente: {data.patente}</p>
          <p className="mt-1 font-semibold">
            Consumo: {data.consumo.toLocaleString()} litros
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Title icon={FiTruck}>Equipos con Mayor Consumo de Diésel</Title>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Cargando datos...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
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
      ) : equiposData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer
            width="100%"
            height={equiposData.length > 5 ? "auto" : "100%"}
          >
            <BarChart data={equiposData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="consumo"
                name="Consumo (litros)"
                fill={NARANJA_PRINCIPAL}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default TopEquiposChart; 