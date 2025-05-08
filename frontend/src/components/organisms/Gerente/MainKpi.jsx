import React, { useState, useEffect } from "react";
import FiltrosComponent from "./FiltrosComponents";
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";

const Dashboard = () => {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFechaDesdeChange = (newFechaDesde) => {
    setFechaDesde(newFechaDesde);
    if (fechaHasta < newFechaDesde) {
      setFechaHasta(newFechaDesde);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fechaDesde && fechaHasta) {
        setRefreshTrigger((prev) => prev + 1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fechaDesde, fechaHasta, faenaSeleccionada]);

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          Filtros de Visualización
        </h2>
        <FiltrosComponent
          fechaDesde={fechaDesde}
          setFechaDesde={handleFechaDesdeChange}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          faenaSeleccionada={faenaSeleccionada}
          setFaenaSeleccionada={setFaenaSeleccionada}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <TopEquiposChart
            faenaSeleccionada={faenaSeleccionada}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            refreshKey={refreshTrigger}
          />
        </div>
        <div>
          <FaenasChart
            faenaSeleccionada={faenaSeleccionada}
            setFaenaSeleccionada={null}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            refreshKey={refreshTrigger}
          />
        </div>
        <div>
          <ConsumoTendenciaChart
            faenaSeleccionada={faenaSeleccionada}
            refreshKey={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
