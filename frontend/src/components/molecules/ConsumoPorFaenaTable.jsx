import React from "react";

const ConsumoPorFaenaTable = ({ consumoPorFaena }) => {
  if (!consumoPorFaena || consumoPorFaena.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <h3 className="text-md font-medium text-gray-800 p-4 border-b">
        Consumo por Faena
      </h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Faena
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Litros
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Máquinas
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {consumoPorFaena.map((faena, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                {faena.nombre_faena}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                {Number(faena.litros_consumidos).toLocaleString("es-CL")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                ${Number(faena.valor_consumo).toLocaleString("es-CL")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {faena.total_maquinas}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConsumoPorFaenaTable;