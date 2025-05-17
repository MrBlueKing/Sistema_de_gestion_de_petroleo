import React from 'react';

const TablaResumen = ({
  horometro,
  horasTrabajadas,
  cargas,
  consumoReal,
  totalHoras,
  totalConsumo,
  rendimiento,
  promedioHoras,
  consumoSimuladoDiario,
  simulacion,
}) => {
  const renderTable = (headers, rows) => (
    <div className="overflow-x-auto mt-4 shadow rounded">
      <table className="min-w-full text-sm text-center border border-gray-300">
        <thead className="bg-gray-100 text-gray-800 uppercase text-xs">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-2">{h}</th>)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-2">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-blue-700 mt-6 mb-2">📊 Datos y Cálculos</h2>
      {renderTable(
        ["Día", "Horómetro", "Carga (L)", "Horas Trabajadas", "Consumo Real (L)"],
        horometro.map((h, i) => [
          i + 1,
          h,
          cargas[i],
          horasTrabajadas[i] ?? "—",
          consumoReal[i],
        ])
      )}

      <div className="text-sm mt-4 space-y-1">
        <p><strong>Total horas trabajadas:</strong> {totalHoras} h</p>
        <p><strong>Total consumo real:</strong> {totalConsumo} L</p>
        <p><strong>Rendimiento:</strong> {rendimiento.toFixed(3)} h/L</p>
        <p><strong>Promedio horas/día:</strong> {promedioHoras.toFixed(2)} h/d</p>
        <p><strong>Consumo simulado diario:</strong> {consumoSimuladoDiario.toFixed(2)} L</p>
      </div>

      <h2 className="text-lg font-semibold text-blue-700 mt-6 mb-2">🔁 Simulación desde Día 5</h2>
      {renderTable(
        ["Día", "Horas Simuladas", "Consumo Simulado (L)", "Stock Inicial (L)", "Stock Final (L)"],
        simulacion.map(row => [
          row.dia,
          row.horas.toFixed(2),
          row.consumo,
          row.stockInicial,
          row.stockFinal,
        ])
      )}
    </div>
  );
};

export default TablaResumen;
