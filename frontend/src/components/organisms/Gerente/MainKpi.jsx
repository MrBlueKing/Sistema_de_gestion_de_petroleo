import { useState } from "react";
import KpiCard from "../../molecules/KpiCard";
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";

const MainGerente = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const kpis = [
    {
      title: "Producción Total",
      value: "45.200 ton",
      change: "+5%",
      unit: "ton",
    },
    {
      title: "Ley Promedio",
      value: "1.23%",
      change: "-0.1%",
      unit: "%",
    },
    {
      title: "Camionadas",
      value: "820",
      change: "+12",
      unit: "",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar toggle podría ir aquí */}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header podría ir aquí */}

        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Dashboard Gerencial
            </h1>

            {/* KPI Cards Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Indicadores Clave
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, i) => (
                  <KpiCard
                    key={i}
                    title={kpi.title}
                    value={kpi.value}
                    change={kpi.change}
                    unit={kpi.unit}
                  />
                ))}
              </div>
            </section>

            {/* Charts Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Análisis Operacional
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <TopEquiposChart />
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <FaenasChart />
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <ConsumoTendenciaChart />
                </div>
              </div>
            </section>

            {/* Additional Content */}
            <section>{children}</section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainGerente;
