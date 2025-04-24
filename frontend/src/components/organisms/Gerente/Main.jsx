import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  FiCalendar, // Calendar
  FiClock, // Clock
  FiTrendingUp, // TrendingUp
  FiTruck, // Truck
  FiMapPin, // MapPin
  FiDroplet, // Droplet
  FiMenu, // Menu
  FiX, // X (close icon)
} from "react-icons/fi";

// Datos simulados (en producción vendrían de tu API de Laravel)
const equiposData = [
  { name: "Camión Minero 777F", consumo: 450, id: "CM-001" },
  { name: "Excavadora 390F", consumo: 380, id: "EX-002" },
  { name: "Cargador 994K", consumo: 320, id: "CA-003" },
  { name: "Perforadora D45KS", consumo: 290, id: "PD-004" },
  { name: "Bulldozer D9T", consumo: 270, id: "BD-005" },
];

const faenasData = [
  { name: "Catemu", value: 1250 },
  { name: "Tiltil", value: 980 },
  { name: "Cabildo", value: 1450 },
];

const consumoMensual = [
  { month: "Ene", consumo: 3200 },
  { month: "Feb", consumo: 3100 },
  { month: "Mar", consumo: 3400 },
  { month: "Abr", consumo: 3050 },
  { month: "May", consumo: 3680 },
  { month: "Jun", consumo: 3580 },
  { month: "Jul", consumo: 3700 },
  { month: "Ago", consumo: 3680 },
  { month: "Sep", consumo: 3700 },
  { month: "Oct", consumo: 3520 },
  { month: "Nov", consumo: 3650 },
  { month: "Dic", consumo: 3800 },
];

// Colores
const COLORS = ["#ff7b00", "#ff9a3d", "#ffb366", "#ffcc8f", "#ffe5cc"];
const NARANJA_PRINCIPAL = "#ff7b00";
const NARANJA_SECUNDARIO = "#ff9a3d";

// Componentes Atómicos
const Card = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

const Title = ({ children, icon: Icon }) => {
  return (
    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
      {Icon && <Icon className="mr-2" size={20} />}
      {children}
    </h2>
  );
};

const Badge = ({ children }) => {
  return (
    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
      {children}
    </span>
  );
};

// Componentes Moleculares
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

  const TopEquiposChart = () => {
    return (
      <Card className="mb-4">
        <Title icon={FiTruck}>Equipos con Mayor Consumo de Diésel</Title>
        <div className="h-64">
          <ResponsiveContainer
            width="100%"
            height={equiposData.length > 5 ? "auto" : "100%"}
          >
            <BarChart data={equiposData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="consumo"
                name="Consumo (litros)"
                fill={NARANJA_PRINCIPAL}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

const FaenasChart = () => {
  return (
    <Card className="mb-4">
      <Title icon={FiMapPin}>Consumo por Faena</Title>
      <div className="h-64 flex justify-center">
        <ResponsiveContainer width="80%" height="100%">
          <PieChart>
            <Pie
              data={faenasData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {faenasData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} litros`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const ConsumoTendenciaChart = () => {
  return (
    <Card className="mb-4">
      <Title icon={FiTrendingUp}>Tendencia Mensual de Consumo</Title>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={consumoMensual}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="consumo"
              name="Consumo Total (litros)"
              stroke={NARANJA_PRINCIPAL}
              strokeWidth={2}
              dot={{ fill: NARANJA_PRINCIPAL, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const KpiCard = ({ title, value, subtext, icon: Icon }) => {
  return (
    <Card className="flex items-center p-6">
      <div className="bg-orange-100 p-4 rounded-full mr-4">
        <Icon size={24} className="text-orange-600" />
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{subtext}</p>
      </div>
    </Card>
  );
};

// Componente Organismo - Dashboard
const DieselDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <KpiCard
              title="Consumo Total"
              value="3,680 L"
              subtext="Último mes"
              icon={FiDroplet}
            />
            <KpiCard
              title="Mayor Consumidor"
              value="Camión 777F"
              subtext="450 L promedio diario"
              icon={FiTruck}
            />
            <KpiCard
              title="Faena Principal"
              value="Cabildo"
              subtext="40% del consumo total"
              icon={FiMapPin}
            />
            <KpiCard
              title="Tendencia"
              value="+2.8%"
              subtext="vs mes anterior"
              icon={FiTrendingUp}
            />
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
