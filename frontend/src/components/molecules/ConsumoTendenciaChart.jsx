import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,Legend } from "recharts";
import Card from "../atoms/Gerente/Card";
import Title from "../atoms/Gerente/Tittle";
import { FiTrendingUp } from "react-icons/fi";


const COLORS = ['#ff7b00', '#ff9a3d', '#ffb366', '#ffcc8f', '#ffe5cc'];
const NARANJA_PRINCIPAL = '#ff7b00';
const NARANJA_SECUNDARIO = '#ff9a3d';


const ConsumoTendenciaChart = () => {
  const data = [
    { fecha: "2024-01", consumo: 850 },
    { fecha: "2024-02", consumo: 750 },
    { fecha: "2024-03", consumo: 620 },
    { fecha: "2024-04", consumo: 870 },
  ];

  return (
    <Card className="mb-4">
      <Title icon={FiTrendingUp}>Tendencia Mensual de Consumo</Title>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
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
    </Card>
  );
};

export default ConsumoTendenciaChart;
