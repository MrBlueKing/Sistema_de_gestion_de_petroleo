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
} from "recharts";
import { FiTruck, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

const TopEquiposChart = ({ faenaSeleccionada, fechaDesde, fechaHasta }) => {
  const [loading, setLoading] = useState(true);
  const [equiposData, setEquiposData] = useState([]);
  const [error, setError] = useState(null);
  const [totalConsumo, setTotalConsumo] = useState(0);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);
  
  // Usar useRef para evitar llamadas innecesarias a la API
  const isMounted = useRef(true);
  const prevFilters = useRef({ faenaSeleccionada, fechaDesde, fechaHasta });
  
  const NARANJA_PRINCIPAL = "#f97316"; // Orange-500
  const AZUL_SECUNDARIO = "#60a5fa"; // Blue-400
  
  // Función para verificar si los filtros han cambiado realmente
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed = prevF.faenaSeleccionada !== faenaSeleccionada || 
                   prevF.fechaDesde !== fechaDesde ||
                   prevF.fechaHasta !== fechaHasta;
    
    // Actualizar los filtros previos
    prevFilters.current = { faenaSeleccionada, fechaDesde, fechaHasta };
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
  
  useEffect(() => {
    // Verificar si los filtros cambiaron realmente y si el componente está montado
    if (!isMounted.current || !filtersChanged()) return;

    const fetchData = async () => {
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
          const formattedData = data.map(item => ({
            name: item.nombre || (item.name || 'Sin nombre'),
            patente: item.patente || 'S/P',
            consumo: item.consumo || (item.litros_consumidos || 0),
            horas: item.horas || (item.horas_trabajadas || 0),
            eficiencia: (item.horas && item.consumo) 
              ? parseFloat((item.consumo / item.horas).toFixed(2)) 
              : null,
            id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`
          }));
  
          const total = formattedData.reduce((sum, item) => sum + item.consumo, 0);
          setTotalConsumo(total);
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
        }
      }
    };
  
    fetchData();
  }, [faenaSeleccionada, fechaDesde, fechaHasta]); // Mantener estas dependencias

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
    // Forzar un cambio en los filtros almacenados para garantizar una nueva llamada
    prevFilters.current = { 
      faenaSeleccionada: null, 
      fechaDesde: null, 
      fechaHasta: null 
    };
    // Usar el setTimeout para asegurar que el estado se actualice antes de recargar
    setTimeout(() => {
      // Evitar window.location.reload() ya que recarga toda la página
      // En su lugar, activamos el useEffect cambiando los filtros
      filtersChanged();
      // Llamar a la API directamente
      const fetchData = async () => {
        try {
          const data = await consumoService.getTopEquipos(faenaSeleccionada, fechaDesde, fechaHasta);
          if (data && data.length > 0) {
            const formattedData = data.map(item => ({
              name: item.nombre || (item.name || 'Sin nombre'),
              patente: item.patente || 'S/P',
              consumo: item.consumo || (item.litros_consumidos || 0),
              horas: item.horas || (item.horas_trabajadas || 0),
              eficiencia: (item.horas && item.consumo) 
                ? parseFloat((item.consumo / item.horas).toFixed(2)) 
                : null,
              id: item.id || `EQ-${Math.floor(Math.random() * 1000)}`
            }));
            setEquiposData(formattedData);
            setError(null);
          } else {
            setError("No hay datos disponibles para mostrar");
          }
        } catch (err) {
          setError("Error al recargar los datos. Intente de nuevo.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, 500);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <FiTruck className="mr-2" size={20} />
          Equipos con Mayor Consumo de Diésel
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin text-orange-500 mb-3">
              <FiRefreshCw size={30} />
            </div>
            <div className="text-gray-500">Cargando datos...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold text-gray-800 flex items-center">
          <FiTruck className="mr-2" size={20} />
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
        </div>
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
          <div className="bg-white rounded-lg">
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
                  axisLine={{ stroke: '#ddd' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#ddd' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="consumo" fill={NARANJA_PRINCIPAL} />
                <Bar dataKey="horas" fill={AZUL_SECUNDARIO} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default TopEquiposChart;