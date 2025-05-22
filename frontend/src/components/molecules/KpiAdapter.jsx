import React from "react";
import KpiDashboard from "../molecules/KpiDashboard";

// Este componente es un adaptador para integrar KpiDashboard en MainSimulacion
const KpiDashboardAdapter = ({ 
  fechaDesde, 
  fechaHasta, 
  faenaSeleccionada, 
  faenas 
}) => {
  return (
    <div className="mb-8">
      <KpiDashboard
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        faenaSeleccionada={faenaSeleccionada}
        faenas={faenas}
      />
    </div>
  );
};

export default KpiDashboardAdapter;