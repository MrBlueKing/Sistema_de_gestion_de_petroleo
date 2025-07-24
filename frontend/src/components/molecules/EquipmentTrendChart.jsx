import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { 
  FiTrendingUp, 
  FiBarChart, 
  FiActivity, 
  FiRefreshCw, 
  FiDownload,
  FiFilter,
  FiEye,
  FiEyeOff,
  FiInfo
} from "react-icons/fi";

const EquipmentTrendChart = ({ 
  consumosData = [],
  categoria,
  fechaDesde,
  fechaHasta,
  isVisible = true 
}) => {
  // Estados para el componente
  const [chartType, setChartType] = useState('line'); // 'line' o 'bar'
  const [groupBy, setGroupBy] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedEquipments, setSelectedEquipments] = useState(new Set());
  const [showAllEquipments, setShowAllEquipments] = useState(true);
  const [loading, setLoading] = useState(false);

  // Paleta de colores para las líneas/barras
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
    '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
  ];

  // Procesar datos para el gráfico
  const chartData = useMemo(() => {
    if (!consumosData || consumosData.length === 0) return [];

    // Agrupar consumos por equipo y fecha
    const equipmentData = {};
    
    consumosData.forEach(consumo => {
      const equipmentKey = `${consumo.nombre_maquina || 'Sin nombre'} (${consumo.patente || 'S/P'})`;
      const fecha = new Date(consumo.fecha_consumo);
      let dateKey;

      // Determinar la clave de agrupación según el período seleccionado
      switch (groupBy) {
        case 'weekly':
          // Obtener el lunes de la semana
          const mondayOfWeek = new Date(fecha);
          mondayOfWeek.setDate(fecha.getDate() - fecha.getDay() + 1);
          dateKey = mondayOfWeek.toISOString().split('T')[0];
          break;
        case 'monthly':
          dateKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // daily
          dateKey = fecha.toISOString().split('T')[0];
      }

      if (!equipmentData[dateKey]) {
        equipmentData[dateKey] = { fecha: dateKey };
      }

      if (!equipmentData[dateKey][equipmentKey]) {
        equipmentData[dateKey][equipmentKey] = 0;
      }

      equipmentData[dateKey][equipmentKey] += parseFloat(consumo.litros_consumidos || 0);
    });

    // Convertir a array y ordenar por fecha
    const sortedData = Object.values(equipmentData).sort((a, b) => 
      new Date(a.fecha) - new Date(b.fecha)
    );

    // Formatear fechas para mostrar
    return sortedData.map(item => ({
      ...item,
      fechaDisplay: formatDateForDisplay(item.fecha, groupBy)
    }));
  }, [consumosData, groupBy]);

  // Obtener lista única de equipos
  const uniqueEquipments = useMemo(() => {
    if (!chartData.length) return [];
    
    const equipmentSet = new Set();
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'fecha' && key !== 'fechaDisplay') {
          equipmentSet.add(key);
        }
      });
    });
    
    return Array.from(equipmentSet).sort();
  }, [chartData]);

  // Calcular estadísticas por equipo
  const equipmentStats = useMemo(() => {
    const stats = {};
    
    uniqueEquipments.forEach(equipment => {
      const values = chartData
        .map(item => item[equipment] || 0)
        .filter(val => val > 0);
      
      if (values.length > 0) {
        const total = values.reduce((sum, val) => sum + val, 0);
        const avg = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        stats[equipment] = {
          total: Math.round(total * 100) / 100,
          average: Math.round(avg * 100) / 100,
          max: Math.round(max * 100) / 100,
          min: Math.round(min * 100) / 100,
          registros: values.length
        };
      }
    });
    
    return stats;
  }, [chartData, uniqueEquipments]);

  // Inicializar equipos seleccionados
  useEffect(() => {
    if (uniqueEquipments.length > 0 && selectedEquipments.size === 0) {
      // Seleccionar los primeros 5 equipos por defecto
      const defaultEquipments = new Set(uniqueEquipments.slice(0, 5));
      setSelectedEquipments(defaultEquipments);
      setShowAllEquipments(uniqueEquipments.length <= 5);
    }
  }, [uniqueEquipments]);

  // Función para formatear fechas según el tipo de agrupación
  const formatDateForDisplay = (dateStr, groupType) => {
    const date = new Date(dateStr);
    
    switch (groupType) {
      case 'weekly':
        return `Sem. ${date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}`;
      case 'monthly':
        return date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    }
  };

  // Manejar selección de equipos
  const toggleEquipment = (equipment) => {
    const newSelected = new Set(selectedEquipments);
    if (newSelected.has(equipment)) {
      newSelected.delete(equipment);
    } else {
      newSelected.add(equipment);
    }
    setSelectedEquipments(newSelected);
    setShowAllEquipments(newSelected.size === uniqueEquipments.length);
  };

  const toggleAllEquipments = () => {
    if (showAllEquipments) {
      setSelectedEquipments(new Set());
      setShowAllEquipments(false);
    } else {
      setSelectedEquipments(new Set(uniqueEquipments));
      setShowAllEquipments(true);
    }
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload
            .filter(entry => entry.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-700 truncate max-w-32">
                    {entry.dataKey}
                  </span>
                </div>
                <span className="font-medium ml-2">
                  {entry.value.toLocaleString('es-CL')} L
                </span>
              </div>
            ))}
        </div>
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <FiTrendingUp className="mr-2 text-blue-600" />
            Tendencia por Equipo
          </h3>
          {categoria && (
            <p className="text-sm text-gray-600 mt-1">
              Categoría: <span className="font-medium">{categoria.nombre}</span>
            </p>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-2">
          {/* Tipo de gráfico */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiActivity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiBarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Agrupación temporal */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>

          {/* Toggle todos los equipos */}
          <button
            onClick={toggleAllEquipments}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center"
          >
            {showAllEquipments ? <FiEyeOff className="w-4 h-4 mr-1" /> : <FiEye className="w-4 h-4 mr-1" />}
            {showAllEquipments ? 'Ocultar' : 'Mostrar'} todos
          </button>
        </div>
      </div>

      {/* Información de datos */}
      {chartData.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <FiInfo className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p>
                <strong>{uniqueEquipments.length}</strong> equipos encontrados, 
                <strong> {chartData.length}</strong> puntos de datos temporales.
              </p>
              <p className="mt-1">
                Período: {fechaDesde} al {fechaHasta} • 
                Agrupación: {groupBy === 'daily' ? 'Diaria' : groupBy === 'weekly' ? 'Semanal' : 'Mensual'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selector de equipos */}
      {uniqueEquipments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Equipos a mostrar ({selectedEquipments.size} de {uniqueEquipments.length}):
          </h4>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {uniqueEquipments.map((equipment, index) => (
                <label
                  key={equipment}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedEquipments.has(equipment)}
                    onChange={() => toggleEquipment(equipment)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate" title={equipment}>
                    {equipment}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      {chartData.length > 0 && selectedEquipments.size > 0 ? (
        <div className="h-96 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="fechaDisplay" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Litros', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {uniqueEquipments
                  .filter(equipment => selectedEquipments.has(equipment))
                  .map((equipment, index) => (
                    <Line
                      key={equipment}
                      type="monotone"
                      dataKey={equipment}
                      stroke={COLORS[uniqueEquipments.indexOf(equipment) % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls={false}
                      name={equipment}
                    />
                  ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="fechaDisplay" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Litros', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {uniqueEquipments
                  .filter(equipment => selectedEquipments.has(equipment))
                  .map((equipment, index) => (
                    <Bar
                      key={equipment}
                      dataKey={equipment}
                      fill={COLORS[uniqueEquipments.indexOf(equipment) % COLORS.length]}
                      name={equipment}
                    />
                  ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            {chartData.length === 0 ? (
              <>
                <FiTrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de consumo disponibles</p>
                <p className="text-sm">para el período seleccionado</p>
              </>
            ) : (
              <>
                <FiFilter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Seleccione al menos un equipo</p>
                <p className="text-sm">para mostrar en el gráfico</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas por equipo */}
      {Object.keys(equipmentStats).length > 0 && selectedEquipments.size > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Estadísticas de Equipos Seleccionados:
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                    Total (L)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                    Promedio (L)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                    Máximo (L)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                    Registros
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(selectedEquipments)
                  .filter(equipment => equipmentStats[equipment])
                  .sort((a, b) => equipmentStats[b].total - equipmentStats[a].total)
                  .map((equipment, index) => (
                    <tr key={equipment} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: COLORS[uniqueEquipments.indexOf(equipment) % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-900 truncate" title={equipment}>
                            {equipment}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900 font-medium">
                        {equipmentStats[equipment].total.toLocaleString('es-CL')}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {equipmentStats[equipment].average.toLocaleString('es-CL')}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {equipmentStats[equipment].max.toLocaleString('es-CL')}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {equipmentStats[equipment].registros}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentTrendChart;