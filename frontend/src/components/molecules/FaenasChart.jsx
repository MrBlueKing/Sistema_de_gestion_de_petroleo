import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import Card from "../atoms/Gerente/Card";
import Title from "../atoms/Gerente/Tittle";
import { FiMapPin } from "react-icons/fi";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa"];

const FaenasChart = () => {
  const data = [
    { name: "Cabildo", value: 400 },
    { name: "Catemu", value: 300 },
    { name: "Til Til", value: 300 },
    { name: "Oficina", value: 200 },
  ];

  return (
    <Card className="mb-4">
      <Title icon={FiMapPin}>Consumo por Faena</Title>
      <div className="h-64 flex justify-center">
        <ResponsiveContainer width="80%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} litros`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default FaenasChart;
