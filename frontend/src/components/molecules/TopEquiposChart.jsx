import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, CartesianAxis } from "recharts";
import Card from "../atoms/Gerente/Card";
import Title from "../atoms/Gerente/Tittle";
import { FiTruck } from "react-icons/fi";

const TopEquiposChart = () => {
  // Datos ampliados con información de Litros y Horas para mostrar más métricas
  const data = [
    { name: "Equipo A", consumo: 400, horas: 120, eficiencia: 3.33 },
    { name: "Equipo B", consumo: 300, horas: 100, eficiencia: 3.00 },
    { name: "Equipo C", consumo: 200, horas: 80, eficiencia: 2.50 },
    { name: "Equipo D", consumo: 100, horas: 50, eficiencia: 2.00 },
  ];

  // Formato personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-orange-500">
            Consumo: {payload[0].value} litros
          </p>
          {payload[1] && (
            <p className="text-blue-500">
              Horas: {payload[1].value} hrs
            </p>
          )}
          <p className="text-green-600 text-sm mt-1">
            Eficiencia: {data.find(item => item.name === label).eficiencia} L/hr
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <Title icon={FiTruck}>Equipos con Mayor Consumo de Diésel</Title>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
          <span className="text-xs text-gray-600">Consumo (litros)</span>
          
          <span className="inline-block w-3 h-3 bg-blue-400 rounded-full ml-2"></span>
          <span className="text-xs text-gray-600">Horas operadas</span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            barGap={0}
            barCategoryGap={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#666', fontSize: 12 }} 
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            <Legend wrapperStyle={{ bottom: 0 }} />
            <Bar 
              dataKey="consumo" 
              fill="#f97316" 
              radius={[4, 4, 0, 0]}
              name="Consumo (litros)"
            />
            <Bar 
              dataKey="horas" 
              fill="#60a5fa" 
              radius={[4, 4, 0, 0]} 
              name="Horas operadas"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 px-2">
        <p className="text-xs text-gray-500">
          Consumo total de diésel: <span className="font-medium text-gray-700">1,000 litros</span>
          <span className="mx-2">•</span>
          <span className="text-green-500">(Actualizado: hoy)</span>
        </p>
      </div>
    </Card>
  );
};

export default TopEquiposChart;
