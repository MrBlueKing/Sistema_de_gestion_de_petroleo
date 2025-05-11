// 1. Componente para las tarjetas de resumen financiero
import React from "react";

const ResumenFinancieroCards = ({ resumenFinanciero }) => {
  if (!resumenFinanciero) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
        <h3 className="text-sm font-medium text-gray-500">Total Ingresado</h3>
        <p className="text-2xl font-semibold">
          {resumenFinanciero.litros_ingresados.toLocaleString("es-CL")} lts
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Valor: ${resumenFinanciero.valor_ingresos.toLocaleString("es-CL")}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
        <h3 className="text-sm font-medium text-gray-500">Total Consumido</h3>
        <p className="text-2xl font-semibold">
          {resumenFinanciero.litros_consumidos.toLocaleString("es-CL")} lts
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Valor: ${resumenFinanciero.valor_consumos.toLocaleString("es-CL")}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
        <h3 className="text-sm font-medium text-gray-500">Balance</h3>
        <p className="text-2xl font-semibold">
          {resumenFinanciero.balance_litros.toLocaleString("es-CL")} lts
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {resumenFinanciero.porcentaje_utilizado.toFixed(1)}% utilizado
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
        <h3 className="text-sm font-medium text-gray-500">Precio Promedio</h3>
        <p className="text-2xl font-semibold">
          ${resumenFinanciero.precio_promedio_compra.toLocaleString("es-CL")}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Varianza: {resumenFinanciero.varianza_precios.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default ResumenFinancieroCards;