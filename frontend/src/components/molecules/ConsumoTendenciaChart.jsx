import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { FiTrendingUp } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

const Card = ({ children, className }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
    {children}
  </div>
);

const Title = ({ children, icon: Icon }) => (
  <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
    {Icon && <Icon className="mr-2" size={20} />}
    {children}
  </h2>
);

const ConsumoTendenciaChart = ({ data = [], faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(true);
  const [consumoMensual, setConsumoMensual] = useState([]);
  const [error, setError] = useState(null);

  const nombresMeses = {
    1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr', 5: 'May', 6: 'Jun',
    7: 'Jul', 8: 'Ago', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic'
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await consumoService.getConsumoMensual(faenaSeleccionada);
        const formatted = (fetched || []).map(item => {
          const month = nombresMeses[parseInt(item.month)] || item.month;
          return {
            month: month || 'Sin mes',
            consumo: item.consumo || item.valor || 0
          };
        });
        setConsumoMensual(formatted.length > 0 ? formatted : generarDemoData());
      } catch (err) {
        console.error("Error al obtener datos de consumo:", err);
        setError("No se pudieron cargar los datos del gráfico.");
        setConsumoMensual([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faenaSeleccionada]);

  const generarDemoData = () => ([
    { month: 'Ene', consumo: 12500 }, { month: 'Feb', consumo: 14200 },
    { month: 'Mar', consumo: 13800 }, { month: 'Abr', consumo: 15300 },
    { month: 'May', consumo: 16200 }, { month: 'Jun', consumo: 14900 },
    { month: 'Jul', consumo: 15600 }, { month: 'Ago', consumo: 16500 },
    { month: 'Sep', consumo: 15800 }, { month: 'Oct', consumo: 16300 },
    { month: 'Nov', consumo: 15900 }
  ]);

  const { minValue, maxValue } = useMemo(() => {
    if (!consumoMensual.length) return { minValue: 0, maxValue: 100 };
    const consumos = consumoMensual.map(d => d.consumo);
    const min = Math.min(...consumos);
    const max = Math.max(...consumos);
    return {
      minValue: Math.max(0, min * 0.9),
      maxValue: max * 1.1
    };
  }, [consumoMensual]);

  const sortedData = useMemo(() => {
    const orden = { 'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12 };
    return [...consumoMensual].sort((a, b) => (orden[a.month] || 0) - (orden[b.month] || 0));
  }, [consumoMensual]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { month, consumo } = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{month}</p>
          <p className="text-sm text-gray-600">Consumo: {consumo.toLocaleString('es-CL')} litros</p>
        </div>
      );
    }
    return null;
  };

  const chartTitle = faenaSeleccionada !== 'todas'
    ? `Tendencia Mensual - ${{
        '1': 'Cabildo', '2': 'Catemu', '3': 'Chincolco', '4': 'Tiltil'
      }[faenaSeleccionada] || 'Faena'}`
    : "Tendencia Mensual de Consumo";

  return (
    <Card className="mb-4">
      <Title icon={FiTrendingUp}>{chartTitle}</Title>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Cargando datos...</div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500 font-semibold">{error}</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[minValue, maxValue]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="consumo"
              stroke="#ff7b00"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ConsumoTendenciaChart;
