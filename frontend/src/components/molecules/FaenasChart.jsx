import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import Card from "../atoms/Gerente/Card";
import Title from "../atoms/Gerente/Tittle";
import { FiPieChart } from "react-icons/fi";

const FaenasChart = () => {
  // Datos de consumo por faena
  const data = [
    { name: "Catemu", value: 420, color: "#ff7b00" },
    { name: "Cabildo", value: 310, color: "#3b82f6" },
    { name: "Til Til", value: 180, color: "#10b981" },
    { name: "Oficina Central", value: 90, color: "#8b5cf6" },
  ];

  // Colores para las secciones del pie
  const COLORS = data.map(item => item.color);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, payload: { color } } = payload[0];
      const percentage = Math.round((value / data.reduce((sum, item) => sum + item.value, 0)) * 100);
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-bold text-gray-800">{name}</p>
          <div className="flex items-center mt-1">
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: color }}
            ></span>
            <p className="text-gray-700">
              {value} litros ({percentage}%)
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Renderizado de etiquetas personalizadas
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const totalConsumo = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Title icon={FiPieChart}>Consumo de Diésel por Faena</Title>
      </div>

      <div className="bg-white rounded-lg p-2 flex-grow">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ paddingTop: 20 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 px-2">
        <p className="text-xs text-gray-500">
          Consumo total: <span className="font-medium text-gray-700">{totalConsumo} litros</span>
          <span className="mx-2">•</span>
          <span className="text-green-500">(Actualizado: hoy)</span>
        </p>
      </div>
    </Card>
  );
};

export default FaenasChart;