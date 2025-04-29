// Modificación para el componente ConsumoTendenciaChart.jsx:
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import Card from "../atoms/Gerente/Card";
import Title from "../atoms/Gerente/Tittle";
import { FiTrendingUp } from "react-icons/fi";

const NARANJA_PRINCIPAL = '#ff7b00';

const ConsumoTendenciaChart = () => {
  const data = [
    { fecha: "2024-01", consumo: 850 },
    { fecha: "2024-02", consumo: 750 },
    { fecha: "2024-03", consumo: 620 },
    { fecha: "2024-04", consumo: 870 },
  ];

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Title icon={FiTrendingUp}>Tendencia Mensual de Consumo</Title>
      </div>

      <div className="bg-white rounded-lg p-2 flex-grow">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ bottom: 0 }} />
            <Line
              type="monotone"
              dataKey="consumo"
              name="Consumo Total (litros)"
              stroke={NARANJA_PRINCIPAL}
              strokeWidth={2}
              dot={{ fill: NARANJA_PRINCIPAL, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 px-2">
        <p className="text-xs text-gray-500">
          Tendencia basada en datos mensuales. <span className="text-green-500">(Actualizado: hoy)</span>
        </p>
      </div>
    </Card>
  );
};

export default ConsumoTendenciaChart;