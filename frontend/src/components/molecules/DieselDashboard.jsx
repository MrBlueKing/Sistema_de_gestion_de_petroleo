import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiClock,
  FiTruck,
  FiMapPin,
  FiDroplet,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiAlertTriangle,
  FiRefreshCw
} from "react-icons/fi";
import TopEquiposChart from "./TopEquiposChart";
import FaenasChart from "./FaenasChart";
import ConsumoTendenciaChart from "./ConsumoTendenciaChart";
import KpiCard from "./KpiCard";
import { consumoService } from "../services/ApiService";

// Componente Badge
const Badge = ({ children }) => {
  return (
    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
      {children}
    </span>
  );
};

// Componente Header
const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-4 shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <FiDroplet size={32} className="mr-3" />
          <h1 className="text-2xl font-bold">
            Panel de Control | Consumo de Diésel
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FiCalendar size={18} className="mr-1" />
            <span>{currentTime.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <FiClock size={18} className="mr-1" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente Sidebar
const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div
      className={`bg-gray-800 text-white h-full fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-0"
      } overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xl font-bold">Minera S.A.</span>
          <button onClick={toggleSidebar} className="text-white">
            <FiX size={24} />
          </button>
        </div>
        <nav>
          <ul className="space-y-2">
            <li className="bg-orange-600 rounded p-2">
              <a href="#" className="flex items-center">
                <FiTrendingUp size={20} className="mr-2" />
                Dashboard
              </a>
            </li>
            <li className="hover:bg-gray-700 rounded p-2">
              <a href="#" className="flex items-center">
                <FiTruck size={20} className="mr-2" />
                Equipos
              </a>
            </li>
            <li className="hover:bg-gray-700 rounded p-2">
              <a href="#" className="flex items-center">
                <FiMapPin size={20} className="mr-2" />
                Faenas
              </a>
            </li>
            <li className="hover:bg-gray-700 rounded p-2">
              <a href="#" className="flex items-center">
                <FiDroplet size={20} className="mr-2" />
                Consumos
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

// Estado de carga para KPI
const KpiCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex items-center">
      <div className="bg-gray-200 rounded-full h-12 w-12 mr-4"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

// Componente de error para KPI
const KpiErrorState = ({ onRetry }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex flex-col items-center justify-center text-center">
      <FiAlertTriangle size={30} className="text-orange-500 mb-2" />
      <div className="text-gray-600 mb-3">No se pudieron cargar los datos</div>
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center"
      >
        <FiRefreshCw className="mr-1" /> Reintentar
      </button>
    </div>
  </div>
);

// Componente Dashboard principal
const DieselDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    consumoTotal: "0 L",
    mayorConsumidor: "Sin datos",
    faenaPrincipal: "Sin datos",
    tendencia: "0%"
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchKpiData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consumoService.getKpisConsumo();
      
      if (data) {
        setKpis({
          consumoTotal: `${data.consumoTotal || 0} L`,
          mayorConsumidor: data.mayorConsumidor || "Sin datos",
          faenaPrincipal: data.faenaPrincipal || "Sin datos",
          tendencia: data.tendencia || "0%"
        });
        setLastUpdated(new Date());
      } else {
        setError("No se pudieron obtener los KPIs");
      }
    } catch (err) {
      console.error("Error al cargar KPIs:", err);
      setError("Error al cargar los datos principales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiData();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Overlay para cuando el sidebar está abierto en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <div className="flex">
        {/* Espacio para el sidebar cuando está expandido */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        ></div>

        <main className="flex-1 p-4">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-md bg-white shadow"
            >
              <FiMenu size={24} />
            </button>
            <Badge>Dashboard Gerencial</Badge>
            
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            
            <button
              onClick={fetchKpiData}
              className="p-2 rounded-md bg-white shadow hover:bg-gray-50 text-gray-600"
              title="Actualizar datos"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <FiAlertTriangle className="mr-2" />
              {error}
              <button 
                onClick={fetchKpiData} 
                className="ml-auto px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 transition-colors flex items-center"
              >
                <FiRefreshCw className="mr-1" size={14} />
                Reintentar
              </button>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {loading ? (
              Array(4).fill().map((_, index) => (
                <KpiCardSkeleton key={index} />
              ))
            ) : error ? (
              Array(4).fill().map((_, index) => (
                <KpiErrorState key={index} onRetry={fetchKpiData} />
              ))
            ) : (
              <>
                <KpiCard
                  title="Consumo Total"
                  value={kpis.consumoTotal}
                  subtext="Último mes"
                  icon={FiDroplet}
                />
                <KpiCard
                  title="Mayor Consumidor"
                  value={kpis.mayorConsumidor}
                  subtext="Promedio diario"
                  icon={FiTruck}
                />
                <KpiCard
                  title="Faena Principal"
                  value={kpis.faenaPrincipal}
                  subtext="% del consumo total"
                  icon={FiMapPin}
                />
                <KpiCard
                  title="Tendencia"
                  value={kpis.tendencia}
                  subtext="vs mes anterior"
                  icon={FiTrendingUp}
                />
              </>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopEquiposChart />
            <FaenasChart />
            <div className="lg:col-span-2">
              <ConsumoTendenciaChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DieselDashboard;