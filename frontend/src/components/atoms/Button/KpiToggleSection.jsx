// Componente de interruptor para mostrar/ocultar KPI en MainSimulacion
import React, { useState } from "react";
import { FaChartBar, FaAngleDown, FaAngleUp } from "react-icons/fa";
import KpiDashboardAdapter from "../../molecules/KpiAdapter";

const KpiToggleSection = ({ 
  fechaDesde, 
  fechaHasta, 
  faenaSeleccionada, 
  faenas 
}) => {
  const [mostrarKpi, setMostrarKpi] = useState(false);

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
      <button
        onClick={() => setMostrarKpi(!mostrarKpi)}
        className="w-full flex items-center justify-between py-2 focus:outline-none"
      >
        <div className="flex items-center">
          <FaChartBar className="text-blue-500 mr-2" />
          <span className="font-medium text-gray-800">Indicadores KPI</span>
        </div>
        
        {mostrarKpi ? (
          <FaAngleUp className="text-gray-500" />
        ) : (
          <FaAngleDown className="text-gray-500" />
        )}
      </button>

      {mostrarKpi && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <KpiDashboardAdapter
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            faenaSeleccionada={faenaSeleccionada}
            faenas={faenas}
          />
        </div>
      )}
    </div>
  );
};

export default KpiToggleSection;