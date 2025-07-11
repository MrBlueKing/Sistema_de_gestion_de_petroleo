import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FiAlertTriangle, FiRefreshCw, FiPieChart, FiArrowLeft, FiActivity, FiBarChart2 } from "react-icons/fi";
import axios from '../../lib/axios';

const ConsumptionPieChart = ({ 
  faenaSeleccionada = 'todas',
  fechaDesde, 
  fechaHasta, 
  refreshKey = 0 
}) => {
  const [categorias, setCategorias] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [viewMode, setViewMode] = useState('categorias'); // 'categorias' o 'maquinas'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Usar useRef para evitar llamadas innecesarias a la API
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({ faenaSeleccionada, fechaDesde, fechaHasta, refreshKey });

  // Colores para el piechart (usando la paleta de tu app)
  const COLORS = [
    '#f97316', // Orange-500 (principal)
    '#3b82f6', // Blue-500
    '#10b981', // Emerald-500
    '#f59e0b', // Amber-500
    '#8b5cf6', // Violet-500
    '#ef4444', // Red-500
    '#06b6d4', // Cyan-500
    '#84cc16', // Lime-500
    '#f43f5e', // Rose-500
    '#6366f1'  // Indigo-500
  ];

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

  // Datos actuales según el modo de vista
  const currentData = viewMode === 'categorias' ? categorias : maquinas;

  useEffect(() => {
    // Establecer el ref a true cuando se monta el componente
    isMounted.current = true;
    
    // Limpiar cuando se desmonta
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Función para cargar datos de categorías desde tu API
  const cargarDatosCategorias = async () => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que las fechas estén presentes
      if (!fechaDesde || !fechaHasta) {
        setError("Por favor, seleccione un rango de fechas válido.");
        setCategorias([]);
        setLoading(false);
        return;
      }

      // Asegúrate de que la fecha 'Hasta' no sea anterior a 'Desde'
      if (new Date(fechaDesde) > new Date(fechaHasta)) {
        setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
        setCategorias([]);
        setLoading(false);
        return;
      }

      console.log("ConsumptionPieChart: Cargando categorías con filtros:", { 
        faenaSeleccionada, 
        fechaDesde, 
        fechaHasta 
      });
      
      // 🆕 USAR TU ENDPOINT POST DE CATEGORÍAS
      const response = await axios.post('/api/categorias-chart/categorias', {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
        id_faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
      });
      
      // Solo actualizar el estado si el componente sigue montado
      if (!isMounted.current) return;
      
      // Verificar si hay datos en la respuesta
      if (response.data && response.data.success && response.data.categorias) {
        const categoriasData = response.data.categorias.map(categoria => ({
          id: categoria.id,
          nombre: categoria.name,
          consumo_total: parseFloat(categoria.value || 0),
          maquinas_count: parseInt(categoria.maquinas_count || 0),
          tipo_medicion: categoria.tipo_medicion,
          promedio_consumo: parseFloat(categoria.promedio_consumo || 0),
          total_registros: parseInt(categoria.total_registros || 0),
          name: categoria.name,
          value: parseFloat(categoria.value || 0)
        }));

        setCategorias(categoriasData);
        setError(null);
      } else {
        setCategorias([]);
        setError("No hay datos de categorías disponibles para mostrar");
      }
    } catch (err) {
      console.error("Error al cargar datos de categorías:", err);
      if (isMounted.current) {
        setCategorias([]);
        setError("No se pudieron cargar los datos de categorías. Por favor verifica la conexión con el servidor.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  };

  // Función para cargar máquinas de una categoría específica
  const cargarMaquinasPorCategoria = async (categoria) => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("ConsumptionPieChart: Cargando máquinas para categoría:", categoria.nombre);
      
      // 🆕 USAR TU ENDPOINT POST PARA MÁQUINAS DE CATEGORÍA
      const response = await axios.post(`/api/categorias-chart/categorias/${categoria.id}/maquinas`, {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
        id_faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
      });
      
      if (!isMounted.current) return;
      
      if (response.data && response.data.success && response.data.maquinas) {
        const maquinasData = response.data.maquinas.map(maquina => ({
          id: maquina.id,
          nombre: maquina.name,
          patente: maquina.patente || 'S/P',
          consumo: parseFloat(maquina.value || 0),
          estado: maquina.estado,
          promedio_consumo: parseFloat(maquina.promedio_consumo || 0),
          total_registros: parseInt(maquina.total_registros || 0),
          name: maquina.name,
          value: parseFloat(maquina.value || 0)
        }));

        setMaquinas(maquinasData);
        setError(null);
      } else {
        setMaquinas([]);
        setError("No hay máquinas disponibles para esta categoría");
      }
    } catch (err) {
      console.error("Error al cargar datos de máquinas:", err);
      if (isMounted.current) {
        setMaquinas([]);
        setError("No se pudieron cargar los datos de máquinas.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Effect para cargar datos cuando cambian los filtros
  useEffect(() => {
    if (filtersChanged()) {
      cargarDatosCategorias();
      // Reset al modo de categorías cuando cambian los filtros
      setViewMode('categorias');
      setSelectedCategoria(null);
      setMaquinas([]);
    }
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // Función para manejar click en categoría
  const handleCategoriaClick = async (data) => {
    setSelectedCategoria(data);
    setViewMode('maquinas');
    await cargarMaquinasPorCategoria(data);
  };

  // Función para volver a las categorías
  const handleBackToCategories = () => {
    setSelectedCategoria(null);
    setMaquinas([]);
    setViewMode('categorias');
  };

  // Función para reintentar la carga
  const handleRetry = () => {
    setError(null);
    if (viewMode === 'categorias') {
      cargarDatosCategorias();
    } else if (selectedCategoria) {
      cargarMaquinasPorCategoria(selectedCategoria);
    }
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">
            {viewMode === 'categorias' ? data.nombre : data.nombre}
          </p>
          <p className="text-orange-600 font-medium">
            Consumo: {data.value.toLocaleString('es-CL')} L
          </p>
          {viewMode === 'categorias' && data.maquinas_count && (
            <p className="text-gray-600 text-sm">
              Máquinas activas: {data.maquinas_count}
            </p>
          )}
          {viewMode === 'maquinas' && data.patente && (
            <p className="text-gray-600 text-sm">
              Patente: {data.patente}
            </p>
          )}
          {data.valor_consumo && (
            <p className="text-green-600 text-sm">
              Valor: ${data.valor_consumo.toLocaleString('es-CL')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 🆕 Función para renderizar etiquetas personalizadas profesionales
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    // No mostrar etiqueta si es menor al 2%
    if (percent < 0.02) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Posición fuera del gráfico
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Determinar la posición del texto según el ángulo
    const isLeftSide = x < cx;
    
    return (
      <g>
        {/* Línea conectora */}
        <line
          x1={cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)}
          y1={cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
          x2={x}
          y2={y}
          stroke={COLORS[index % COLORS.length]}
          strokeWidth={1}
          strokeOpacity={0.7}
        />
        
        {/* Punto en el extremo de la línea */}
        <circle
          cx={x}
          cy={y}
          r={2}
          fill={COLORS[index % COLORS.length]}
        />
        
        {/* Etiqueta de texto */}
        <text
          x={x + (isLeftSide ? -5 : 5)}
          y={y - 5}
          textAnchor={isLeftSide ? 'end' : 'start'}
          dominantBaseline="central"
          fill="#374151"
          fontSize="11"
          fontWeight="600"
        >
          {name}
        </text>
        
        {/* Porcentaje */}
        <text
          x={x + (isLeftSide ? -5 : 5)}
          y={y + 8}
          textAnchor={isLeftSide ? 'end' : 'start'}
          dominantBaseline="central"
          fill="#6b7280"
          fontSize="10"
        >
          {(percent * 100).toFixed(1)}%
        </text>
        
        {/* Valor en litros */}
        <text
          x={x + (isLeftSide ? -5 : 5)}
          y={y + 20}
          textAnchor={isLeftSide ? 'end' : 'start'}
          dominantBaseline="central"
          fill="#9ca3af"
          fontSize="9"
        >
          {value.toLocaleString('es-CL')} L
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de consumo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (currentData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <FiPieChart size={40} className="text-gray-400 mb-4 mx-auto" />
          <p className="text-gray-500">No hay datos disponibles para el período seleccionado</p>
          <p className="text-sm text-gray-400 mt-2">Intente modificar los filtros de fecha o faena</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {viewMode === 'categorias' 
              ? 'Consumo por Categoría de Máquinas' 
              : `Consumo por Máquina - ${selectedCategoria?.nombre}`}
          </h2>
          
          {viewMode === 'maquinas' && (
            <button
              onClick={handleBackToCategories}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FiArrowLeft /> Volver a Categorías
            </button>
          )}
        </div>

        {/* Información del conjunto de datos */}
     
      </div>

      {/* Gráfico de Torta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Torta con etiquetas profesionales */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={30} // Donut style para mejor legibilidad
                fill="#8884d8"
                dataKey="value"
                onClick={viewMode === 'categorias' ? handleCategoriaClick : undefined}
                style={{ cursor: viewMode === 'categorias' ? 'pointer' : 'default' }}
              >
                {currentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              
              {/* Texto central para el total */}
              <text 
                x="50%" 
                y="48%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                fontSize="14" 
                fontWeight="600" 
                fill="#374151"
              >
                Total
              </text>
              <text 
                x="50%" 
                y="52%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                fontSize="12" 
                fill="#6b7280"
              >
                {currentData.reduce((sum, item) => sum + item.value, 0).toLocaleString('es-CL')} L
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla de datos */}
        <div className="overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Detalle de Consumo</h3>
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">
                    {viewMode === 'categorias' ? 'Categoría' : 'Máquina'}
                  </th>
                  <th className="text-right p-2 font-medium">Consumo (L)</th>
                  <th className="text-right p-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => {
                  const total = currentData.reduce((sum, i) => sum + i.value, 0);
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  
                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        viewMode === 'categorias' ? 'cursor-pointer' : ''
                      }`}
                      onClick={viewMode === 'categorias' ? () => handleCategoriaClick(item) : undefined}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium">{item.name}</span>
                          {viewMode === 'maquinas' && item.patente && (
                            <span className="text-gray-500 text-xs">
                              ({item.patente})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {item.value.toLocaleString('es-CL')}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Información del período */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Período: {new Date(fechaDesde).toLocaleDateString('es-CL')} - {new Date(fechaHasta).toLocaleDateString('es-CL')}
          </span>
          <span className="text-gray-600">
            Faena: {faenaSeleccionada === 'todas' ? 'Todas las faenas' : 
                   faenaSeleccionada === '1' ? 'Cabildo' :
                   faenaSeleccionada === '2' ? 'Catemu' :
                   faenaSeleccionada === '3' ? 'Chincolco' :
                   faenaSeleccionada === '4' ? 'Tiltil' : faenaSeleccionada}
          </span>
        </div>
      </div>

   
    </div>
  );
};

export default ConsumptionPieChart;