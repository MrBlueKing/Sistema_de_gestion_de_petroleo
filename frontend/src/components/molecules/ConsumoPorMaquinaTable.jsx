import React from "react";

const ConsumoPorMaquinaTable = ({ consumoPorMaquina }) => {
  if (!consumoPorMaquina || consumoPorMaquina.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto mb-6">
      <h3 className="text-md font-medium text-gray-800 p-4 border-b">
        Consumo por Máquina
      </h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Máquina
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
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
              Rendimiento
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {consumoPorMaquina.map((maquina, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  {maquina.nombre_maquina}
                </div>
                <div className="text-sm text-gray-500">{maquina.patente}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    maquina.tipo_medicion === "Horometro"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {maquina.tipo_medicion}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {maquina.nombre_faena}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                {Number(maquina.litros_consumidos).toLocaleString("es-CL")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                ${maquina.valor_consumo?.toLocaleString("es-CL") || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {maquina.litros_por_unidad?.toFixed(2) || "-"} lts/
                {maquina.unidad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConsumoPorMaquinaTable;
