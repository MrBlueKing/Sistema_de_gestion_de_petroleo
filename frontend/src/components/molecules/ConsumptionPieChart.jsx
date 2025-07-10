import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ConsumptionPieChart = () => {
  const [categorias, setCategorias] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [viewMode, setViewMode] = useState('categorias'); // 'categorias' o 'maquinas'
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo basados en tu estructura de BD
  const datosEjemplo = {
    categorias: [
      { id: 1, nombre: 'Dumper', consumo_total: 1250.5, maquinas_count: 3 },
      { id: 2, nombre: 'Camion', consumo_total: 2100.8, maquinas_count: 5 },
      { id: 3, nombre: 'Excavadora', consumo_total: 1800.2, maquinas_count: 4 },
      { id: 4, nombre: 'Cargador Frontal', consumo_total: 950.3, maquinas_count: 2 },
      { id: 8, nombre: 'Pala', consumo_total: 1400.7, maquinas_count: 4 }
    ],
    maquinasPorCategoria: {
      1: [
        { id: 1, nombre: 'DUMPER 1', patente: 'ABC123', consumo: 450.2 },
        { id: 2, nombre: 'DUMPER 2', patente: 'DEF456', consumo: 380.1 },
        { id: 3, nombre: 'DUMPER 3', patente: 'GHI789', consumo: 420.2 }
      ],
      2: [
        { id: 4, nombre: 'CAMION 1', patente: 'JKL012', consumo: 520.3 },
        { id: 5, nombre: 'CAMION 2', patente: 'MNO345', consumo: 480.8 },
        { id: 6, nombre: 'CAMION 3', patente: 'PQR678', consumo: 410.5 },
        { id: 7, nombre: 'CAMION 4', patente: 'STU901', consumo: 390.2 },
        { id: 8, nombre: 'CAMION 5', patente: 'VWX234', consumo: 299.0 }
      ],
      3: [
        { id: 9, nombre: 'EXCAVADORA 1', patente: 'YZA567', consumo: 480.1 },
        { id: 10, nombre: 'EXCAVADORA 2', patente: 'BCD890', consumo: 450.3 },
        { id: 11, nombre: 'EXCAVADORA 3', patente: 'EFG123', consumo: 420.8 },
        { id: 12, nombre: 'EXCAVADORA 4', patente: 'HIJ456', consumo: 449.0 }
      ],
      4: [
        { id: 13, nombre: 'CARGADOR 1', patente: 'KLM789', consumo: 480.1 },
        { id: 14, nombre: 'CARGADOR 2', patente: 'NOP012', consumo: 470.2 }
      ],
      8: [
        { id: 15, nombre: 'CARGADOR 5', patente: 'XCMG LW200KV', consumo: 350.2 },
        { id: 22, nombre: 'CARGADOR 7', patente: 'XCMG LW200KV_7', consumo: 360.1 },
        { id: 23, nombre: 'CARGADOR 8', patente: 'XCMG LW200KV_8', consumo: 340.4 },
        { id: 35, nombre: 'SCOOP 6', patente: 'SANDVICK EJC145D', consumo: 350.0 }
      ]
    }
  };

  // Colores para el piechart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCategorias(datosEjemplo.categorias);
      setLoading(false);
    }, 1000);
  }, []);

  // Función para cargar datos reales desde tu API
  const cargarDatosReales = async (fechaInicio, fechaFin) => {
    try {
      setLoading(true);
      // Aquí harías la llamada a tu endpoint
      const response = await fetch('/api/consumo-categorias/analizar-general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          incluir_simulacion: true,
          incluir_sabados: true,
          incluir_domingos: false
        })
      });
      
      const data = await response.json();
      
      // Procesar datos de la respuesta
      const categoriasData = data.categorias.map(cat => ({
        id: cat.categoria.id,
        nombre: cat.categoria.nombre,
        consumo_total: cat.resumen_categoria.consumo_total_litros,
        maquinas_count: cat.resumen_categoria.maquinas_procesadas
      }));
      
      setCategorias(categoriasData);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };

  const handleCategoriaClick = (data) => {
    setSelectedCategoria(data);
    setMaquinas(datosEjemplo.maquinasPorCategoria[data.id] || []);
    setViewMode('maquinas');
  };

  const handleBackToCategories = () => {
    setSelectedCategoria(null);
    setMaquinas([]);
    setViewMode('categorias');
  };

  const formatearTooltip = (value, name, props) => {
    if (viewMode === 'categorias') {
      return [
        `${value.toFixed(1)} L`,
        `${name} (${props.payload.maquinas_count} máquinas)`
      ];
    } else {
      return [
        `${value.toFixed(1)} L`,
        `${name} - ${props.payload.patente}`
      ];
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold text-gray-800">
            {viewMode === 'categorias' ? data.payload.nombre : data.payload.nombre}
          </p>
          <p className="text-blue-600">
            Consumo: {data.value.toFixed(1)} L
          </p>
          {viewMode === 'categorias' && (
            <p className="text-gray-600">
              Máquinas: {data.payload.maquinas_count}
            </p>
          )}
          {viewMode === 'maquinas' && (
            <p className="text-gray-600">
              Patente: {data.payload.patente}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos de consumo...</p>
        </div>
      </div>
    );
  }

  const currentData = viewMode === 'categorias' 
    ? categorias.map(cat => ({
        ...cat,
        name: cat.nombre,
        value: cat.consumo_total
      }))
    : maquinas.map(maq => ({
        ...maq,
        name: maq.nombre,
        value: maq.consumo
      }));

  return (
    <div className="w-full  p-6 bg-white rounded-lg shadow-lg">
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
              ← Volver a Categorías
            </button>
          )}
        </div>

        {/* Información del conjunto de datos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold text-blue-800">Total Consumo</h3>
            <p className="text-2xl font-bold text-blue-600">
              {currentData.reduce((sum, item) => sum + item.value, 0).toFixed(1)} L
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold text-green-800">
              {viewMode === 'categorias' ? 'Categorías' : 'Máquinas'}
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {currentData.length}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-semibold text-purple-800">Promedio</h3>
            <p className="text-2xl font-bold text-purple-600">
              {currentData.length > 0 
                ? (currentData.reduce((sum, item) => sum + item.value, 0) / currentData.length).toFixed(1)
                : 0
              } L
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Torta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onClick={viewMode === 'categorias' ? handleCategoriaClick : undefined}
                style={{ cursor: viewMode === 'categorias' ? 'pointer' : 'default' }}
              >
                {currentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
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
                          {viewMode === 'maquinas' && (
                            <span className="text-gray-500 text-xs">
                              ({item.patente})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {item.value.toFixed(1)}
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

      {/* Instrucciones */}
      {viewMode === 'categorias' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            💡 <strong>Tip:</strong> Haz clic en cualquier categoría del gráfico o la tabla para ver el detalle de las máquinas que la componen.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConsumptionPieChart;