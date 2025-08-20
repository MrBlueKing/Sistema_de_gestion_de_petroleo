import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FiBarChart2,
  FiPieChart,
  FiLoader,
  FiAlertTriangle,
  FiRefreshCw,
  FiInfo,
  FiDroplet,
  FiDollarSign,
  FiActivity,
} from "react-icons/fi";
import { consumoService } from "../../context/apiService";

// 🎨 CONFIGURACIÓN DE COLORES POR FAENA - VIBRA SIMILAR A HistorialMaquinasView
const FAENA_COLORS = {
  'Cabildo': {
    id: 1,
    color: '#059669', // green-600 - más vibrante
    lightColor: '#d1fae5', // green-100
    darkColor: '#047857', // green-700
    gradientFrom: '#059669', // green-600
    gradientTo: '#047857', // green-700
    icon: '🌿',
  },
  'Tiltil': {
    id: 4,
    color: '#dc2626', // red-600 - más vibrante  
    lightColor: '#fee2e2', // red-100
    darkColor: '#b91c1c', // red-700
    gradientFrom: '#dc2626', // red-600
    gradientTo: '#b91c1c', // red-700
    icon: '🏔️',
  },
  // Colores por defecto para otras faenas - más vibrantes
  'default': {
    color: '#ea580c', // orange-600 - más vibrante
    lightColor: '#fed7aa', // orange-100
    darkColor: '#c2410c', // orange-700
    gradientFrom: '#ea580c', // orange-600
    gradientTo: '#c2410c', // orange-700
    icon: '🏢',
  }
};

// Función para obtener el color de una faena
const getColorForFaena = (faenaName) => {
  // Normalizar el nombre de la faena para la búsqueda
  const normalizedName = faenaName?.trim();
  
  // Buscar configuración específica de la faena
  const faenaConfig = FAENA_COLORS[normalizedName] || FAENA_COLORS['default'];
  
  return faenaConfig.color;
};

const ConsumoPorFaenaChart = ({
  fechaDesde,
  fechaHasta,
  faenaSeleccionada = "todas",
  refreshKey = 0,
}) => {
  // Estados principales
  const [datosConsumo, setDatosConsumo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("bar"); // 'bar' o 'pie'

  // Ref para verificar si el componente está montado
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const prevFilters = useRef({
    faenaSeleccionada,
    fechaDesde,
    fechaHasta,
    refreshKey,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Función para verificar si los filtros han cambiado realmente (igual que TopEquiposChart)
  const filtersChanged = () => {
    const prevF = prevFilters.current;
    const changed =
      prevF.faenaSeleccionada !== faenaSeleccionada ||
      prevF.fechaDesde !== fechaDesde ||
      prevF.fechaHasta !== fechaHasta ||
      prevF.refreshKey !== refreshKey ||
      !initialLoadDone.current;

    prevFilters.current = {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
      refreshKey,
    };
    return changed;
  };

const cargarDatosConsumoFaena = async () => {
  if (!isMounted.current) return;

  try {
    setLoading(true);
    setError(null);

    console.log("🔍 ConsumoPorFaenaChart: Llamando a la API con filtros:", {
      faenaSeleccionada,
      fechaDesde,
      fechaHasta,
    });

    // 📡 Usar el mismo patrón que TopEquiposChart con apiService
    const response = await consumoService.getConsumoFaenas(
      faenaSeleccionada,
      fechaDesde,
      fechaHasta
    );

    if (!isMounted.current) return;

    console.log("📊 Respuesta de consumo por faenas:", response);

    // Procesar respuesta igual que TopEquiposChart
    const data = response || [];

    if (data && data.length > 0) {
      // 🛠️ MAPEO CORRECTO PARA LA ESTRUCTURA DE TU BACKEND
      const datosFormateados = data
        .filter(faena => parseFloat(faena.consumo || 0) > 0) // Filtrar por 'consumo' no 'litros_consumidos'
        .sort((a, b) => parseFloat(b.consumo || 0) - parseFloat(a.consumo || 0)) // Ordenar por 'consumo'
        .map((faena) => {
          // 🎯 MAPEO ESPECÍFICO PARA TU ESTRUCTURA BACKEND
          const litrosConsumidos = parseFloat(faena.consumo || 0); // ← Tu backend usa 'consumo'
          const nombreFaena = faena.name || 'Sin Nombre'; // ← Tu backend usa 'name'
          const idFaena = faena.id || 0; // ← Tu backend usa 'id'
          const sumaKms = parseFloat(faena.suma_kms || 0);
          const rendimiento = parseFloat(faena.rendimiento_estimado || 0);

          // 💰 CALCULAR VALOR ESTIMADO (tu backend no devuelve valor_total)
          // Puedes ajustar el precio por litro según tu empresa
          const precioEstimadoPorLitro = 800; // CLP por litro (ajusta según corresponda)
          const valorTotal = litrosConsumidos * precioEstimadoPorLitro;

          console.log(`✅ Procesando faena: ${nombreFaena}`, {
            id: idFaena,
            litros: litrosConsumidos,
            kms: sumaKms,
            rendimiento: rendimiento
          });

          return {
            faena: nombreFaena,
            id_faena: idFaena,
            litrosConsumidos: litrosConsumidos,
            valorTotal: valorTotal, // Valor estimado
            totalConsumos: 1, // Tu backend no devuelve este campo, usar valor por defecto
            sumaKms: sumaKms,
            rendimientoEstimado: rendimiento,
            
            // 🎨 USAR COLORES ESPECÍFICOS POR FAENA
            color: getColorForFaena(nombreFaena),
            
            // Formatear valores para mostrar
            litrosFormateados: litrosConsumidos.toLocaleString("es-ES", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
            valorFormateado: valorTotal.toLocaleString("es-ES", {
              style: "currency",
              currency: "CLP",
              minimumFractionDigits: 0,
            }),
            kmsFormateados: sumaKms.toLocaleString("es-ES", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
            rendimientoFormateado: rendimiento ? `${rendimiento.toFixed(2)} km/L` : 'N/A',
            
            // Promedio por consumo (no disponible en tu backend)
            promedioLitrosPorConsumo: litrosConsumidos.toFixed(0)
          };
        });

      setDatosConsumo(datosFormateados);
      setError(null);
      initialLoadDone.current = true;

      console.log("✅ Datos de consumo por faenas cargados exitosamente:", datosFormateados.length, "faenas");
      console.log("📊 Datos formateados:", datosFormateados);
      
    } else {
      setDatosConsumo([]);
      setError("No hay datos disponibles para el período seleccionado");
    }
    
  } catch (err) {
    console.error("❌ Error al cargar consumos por faena:", err);
    if (isMounted.current) {
      setDatosConsumo([]);
      setError("No se pudieron cargar los datos de consumo por faena. Intente nuevamente.");
    }
  } finally {
    if (isMounted.current) {
      setLoading(false);
    }
  }
};

  // Cargar datos cuando cambien los filtros (igual que TopEquiposChart)
  useEffect(() => {
    if (filtersChanged()) {
      cargarDatosConsumoFaena();
    }
  }, [faenaSeleccionada, fechaDesde, fechaHasta, refreshKey]);

  // Función de reintentar
  const handleRetry = () => {
    cargarDatosConsumoFaena();
  };

  // 🏷️ ETIQUETAS DE DATOS PERSONALIZADAS PARA GRÁFICO DE BARRAS
  const CustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    
    // Solo mostrar etiqueta si hay espacio suficiente
    if (height < 30) return null;
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="600"
        className="drop-shadow-sm"
      >
        {value > 1000 ? `${(value / 1000).toFixed(0)}K` : value.toLocaleString()}
      </text>
    );
  };

  // 🏷️ ETIQUETAS DE DATOS PERSONALIZADAS PARA PIE CHART
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
    // Solo mostrar etiquetas para segmentos mayores al 5%
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="11"
        fontWeight="600"
        className="drop-shadow-lg"
      >
        {value > 1000 ? `${(value / 1000).toFixed(0)}K L` : `${value.toLocaleString()} L`}
      </text>
    );
  };

  // 🏷️ PEQUEÑO LABEL PERSONALIZADO PARA CADA GRÁFICO
  const SmallLabel = ({ title, icon, color = "text-gray-600" }) => (
    <div className={`flex items-center text-xs ${color} mb-2`}>
      {icon && <span className="mr-1">{icon}</span>}
      <span className="font-medium">{title}</span>
    </div>
  );

  // Formatter personalizado para tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              <FiDroplet className="inline mr-1" />
              Litros: {data.litrosFormateados} L
            </p>
            <p className="text-green-600">
              <FiActivity className="inline mr-1" />
              Rendimiento: {data.rendimientoEstimado ? `${data.rendimientoEstimado.toFixed(2)} km/L` : 'No disponible'}
            </p>
            <p className="text-orange-600">
              <FiInfo className="inline mr-1" />
              Total KM: {data.sumaKms ? data.sumaKms.toLocaleString() : 'No disponible'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Datos para el pie chart (usar value como litrosConsumidos)
  const pieChartData = useMemo(() => {
    return datosConsumo.map(item => ({
      name: item.faena,
      value: item.litrosConsumidos,
      litros: item.litrosFormateados,
      valor: item.valorFormateado,
      consumos: item.totalConsumos,
    }));
  }, [datosConsumo]);

  // Estados de carga y error
  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consumos por faena...</p>
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

  if (datosConsumo.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <FiActivity size={40} className="text-gray-400 mb-4 mx-auto" />
          <p className="text-gray-500">
            No hay consumos registrados para el período seleccionado
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Intente modificar los filtros de fecha o faena
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100">
      {/* Header con controles simplificado */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiActivity className="text-orange-600 mr-2" />
              Consumo por Faena
            </h3>
            {/* 🏷️ PEQUEÑO LABEL CON VIBRA MEJORADA */}
            <SmallLabel 
              title="Consumo de combustible por ubicación" 
              icon="⛽"
              color="text-gray-500"
            />
          </div>
          
          {/* Selector de vista con colores más vibrantes */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("bar")}
              className={`px-3 py-2 rounded-md flex items-center transition-all duration-200 ${
                viewMode === "bar"
                  ? "bg-white text-orange-600 shadow-md transform scale-105"
                  : "text-gray-600 hover:text-orange-600 hover:bg-white/50"
              }`}
            >
              <FiBarChart2 className="mr-1" size={16} />
              Barras
            </button>
            <button
              onClick={() => setViewMode("pie")}
              className={`px-3 py-2 rounded-md flex items-center transition-all duration-200 ${
                viewMode === "pie"
                  ? "bg-white text-orange-600 shadow-md transform scale-105"
                  : "text-gray-600 hover:text-orange-600 hover:bg-white/50"
              }`}
            >
              <FiPieChart className="mr-1" size={16} />
              Circular
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico principal con etiquetas de datos */}
      <div className="p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "bar" ? (
              <BarChart 
                data={datosConsumo} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="faena" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K L`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="litrosConsumidos" 
                  radius={[6, 6, 0, 0]}
                  label={<CustomBarLabel />}
                >
                  {/* 🎨 USAR COLORES ESPECÍFICOS PARA CADA BARRA CON GRADIENTES */}
                  {datosConsumo.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                    />
                  ))}
                </Bar>
                
                {/* 🎨 DEFINIR GRADIENTES PARA CADA BARRA */}
                <defs>
                  {datosConsumo.map((entry, index) => {
                    const faenaConfig = FAENA_COLORS[entry.faena] || FAENA_COLORS['default'];
                    return (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`gradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={faenaConfig.gradientFrom} stopOpacity={1} />
                        <stop offset="100%" stopColor={faenaConfig.gradientTo} stopOpacity={0.8} />
                      </linearGradient>
                    );
                  })}
                </defs>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={<CustomPieLabel />}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {/* 🎨 USAR COLORES ESPECÍFICOS PARA CADA SECTOR */}
                  {pieChartData.map((entry, index) => {
                    const faenaData = datosConsumo.find(f => f.faena === entry.name);
                    const faenaConfig = FAENA_COLORS[entry.name] || FAENA_COLORS['default'];
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={faenaData?.color || faenaConfig.color}
                      />
                    );
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value.toLocaleString("es-ES")} L`,
                    'Litros Consumidos'
                  ]}
                  labelFormatter={(label) => `Faena: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px'
                  }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ConsumoPorFaenaChart;