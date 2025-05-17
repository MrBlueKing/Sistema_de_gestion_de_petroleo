import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

// 👇 Este componente recibe los datos como props
const GraficoStock = ({ datosReal, datosSimulados }) => {
  // Combina los datos reales y simulados, y marca cuáles son reales
  const graficoData = [...datosReal, ...datosSimulados].map((dato, index) => ({
    ...dato,
    dia: index + 1,
    real: index < datosReal.length,
  }));

  const CustomDot = ({ cx, cy, payload, fill }) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.real ? 6 : 4}
      fill={payload.real ? "#4338ca" : "#6366f1"}
    />
  );
};

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-blue-700 mb-2">
        📈 Gráfico de Stock vs Día
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          width={800}
          height={300}
          data={graficoData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dia" />
          <YAxis />
          <Tooltip />
          <Legend />

          {/* Línea de Stock Inicial (igual a la carga) */}
          <Line
            type="monotone"
            dataKey="stockInicial"
            stroke="#6366f1"
            strokeWidth={2}
            name="Stock Inicial"
             dot={<CustomDot />}
          />

          {/* Línea de Consumo */}
          <Line
            type="monotone"
            dataKey="consumo"
            stroke="#f97316"
            strokeWidth={2}
            name="Consumo"
            strokeDasharray="5 5"
             dot={<CustomDot />}
          />

          {/* Línea de Horas */}
          <Line
            type="monotone"
            dataKey="horas"
            stroke="#10b981"
            strokeWidth={2}
            name="Horas"
            strokeDasharray="3 4 5 2"
            dot={<CustomDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoStock;
