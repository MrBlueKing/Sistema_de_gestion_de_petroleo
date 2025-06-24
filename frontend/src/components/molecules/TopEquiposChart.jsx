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

const TopEquiposChart = ({ faenaSeleccionada, fechaDesde, fechaHasta, refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [equiposData, setEquiposData] = useState([]);
  const [error, setError] = useState(null);
  const [totalConsumo, setTotalConsumo] = useState(0);
  const [fechaActualizacion, setFechaActualizacion] = useState(null);
  
  // Usar useRef para evitar llamadas innecesarias a la API
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({ faenaSeleccionada, fechaDesde, fechaHasta, refreshKey });
  
  const NARANJA_PRINCIPAL = "#f97316"; // Orange-500
  const AZUL_SECUNDARIO = "#60a5fa"; // Blue-400
  
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
          .sort((a, b) => b.consumo - a.consumo);

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
        initialLoadDone.current = true;
      }
    }
  };
  
  useEffect(() => {
    // Siempre cargar datos en la primera renderización o cuando los filtros cambien
    if (filtersChanged()) {
      loadData();
    }
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // 🔧 TOOLTIP MEJORADO con formateo consistente para números grandes
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">Patente: {data.patente}</p>
          <p className="text-orange-500">
            Consumo: {formatearNumero(data.consumo)} litros
          </p>
          {payload.length > 1 && data.horas > 0 && (
            <p className="text-blue-500">
              Horas: {formatearNumero(data.horas)} hrs
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
    loadData();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <FiTruck className="mr-2" size={20} />
          Equipos con Mayor Consumo de Diésel
        </div>
        <div className="h-80 flex items-center justify-center">
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
            {/* 🆕 GRÁFICO MEJORADO: Barras más grandes, altura aumentada, mejor espaciado */}
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={equiposData}
                margin={{ top: 20, right: 20, left: 30, bottom: 60 }}
                barGap={6} // 🆕 Poco más de espacio entre barras
                barCategoryGap="20%" // 🆕 Mejor espaciado entre categorías
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 11 }}
                  axisLine={{ stroke: '#ddd' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80} // 🆕 Más altura para labels inclinados
                />
                {/* 🆕 EJE Y MEJORADO con formateo para números grandes */}
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#ddd' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    }
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}k`;
                    }
                    return value.toLocaleString('es-CL');
                  }}
                  width={80} // 🆕 Más ancho para números grandes
                  domain={[0, 'dataMax + 50']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                {/* 🆕 BARRAS MÁS GRANDES */}
                <Bar 
                  dataKey="consumo" 
                  fill={NARANJA_PRINCIPAL}
                  maxBarSize={50} // 🆕 Barras más anchas (antes era automático)
                />
                <Bar 
                  dataKey="horas" 
                  fill={AZUL_SECUNDARIO}
                  maxBarSize={50} // 🆕 Barras más anchas (antes era automático)
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default TopEquiposChart;