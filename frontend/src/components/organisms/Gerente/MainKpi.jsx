import { useState, useEffect } from "react";
import KpiCard from "../../molecules/KpiCard";
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";
import BarrilesTrabajoChart from "../../molecules/HorasTrabajoChart"; // Usado en lugar de HorasTrabajoChart

import {
    FiDroplet,
    FiTruck,
    FiTrendingUp,
    FiActivity,
    FiTarget,
    FiCalendar,
    FiRefreshCw,
    FiFilter,
    FiDownload,
    FiPrinter,
    FiBell
} from "react-icons/fi";
import { FaFlask, FaHardHat } from "react-icons/fa";

const MainGerente = ({ children }) => {
    // Estados
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mensual");
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [mostrarAlertas, setMostrarAlertas] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

    // Datos de ejemplo para KPIs
    const [kpis, setKpis] = useState([
        {
            title: "Producción Total",
            value: "45.200",
            change: "+5%",
            unit: "ton",
            subtext: "Toneladas extraídas este mes",
            icon: FiTruck,
            isPositive: true,
            color: "blue"
        },
        {
            title: "Ley Promedio",
            value: "1.23",
            change: "-0.1%",
            unit: "%",
            subtext: "Concentración de mineral promedio",
            icon: FaFlask,
            isPositive: false,
            color: "amber"
        },
        {
            title: "Rendimiento Operacional",
            value: "92",
            change: "-2%",
            unit: "%",
            subtext: "Eficiencia de equipos",
            icon: FiActivity,
            isPositive: false,
            color: "green"
        },
        {
            title: "Camionadas",
            value: "820",
            change: "+12",
            unit: "",
            subtext: "Número de viajes realizados",
            icon: FiTruck,
            isPositive: true,
            color: "indigo"
        },
        {
            title: "Costo Petróleo / Ton",
            value: "$15",
            change: "+3%",
            unit: "",
            subtext: "Costo por tonelada producida",
            icon: FiDroplet,
            isPositive: false,
            color: "red"
        },
        {
            title: "Costo Petróleo / Hora",
            value: "$25",
            change: "-1%",
            unit: "",
            subtext: "Costo por hora de operación",
            icon: FiDroplet,
            isPositive: true,
            color: "teal"
        },
        {
            title: "Costo Petróleo / Km",
            value: "$0.50",
            change: "+0.5%",
            unit: "",
            subtext: "Costo por kilómetro recorrido",
            icon: FiDroplet,
            isPositive: false,
            color: "purple"
        },
    ]);

    // Datos de ejemplo para el estado de equipos
    const [estadoEquipos] = useState({
        operativos: 86,
        camiones: { operativos: 32, total: 35 },
        excavadoras: { operativos: 12, total: 15 },
        perforadoras: { operativos: 8, total: 10 },
    });

    // Simular actualización de datos cada vez que cambia el período
    useEffect(() => {
        // Aquí podrías hacer fetch de datos reales basados en el período seleccionado
        setUltimaActualizacion(new Date());
    }, [periodoSeleccionado, faenaSeleccionada]);

    // Funciones
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const actualizarDatos = () => {
        // Simular actualización de datos
        const nuevosKpis = [...kpis];
        // Aquí actualizarías con datos reales
        setKpis(nuevosKpis);
        setUltimaActualizacion(new Date());
    };

    const exportarDatos = (formato) => {
        // Implementación de exportación a PDF, Excel, etc.
        alert(`Exportando en formato ${formato}...`);
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50">


            <div className="container mx-auto px-4 py-6">
                {/* Información de última actualización */}
                <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
                    <div>
                        Mostrando datos para: <span className="font-medium text-gray-700">
                            {periodoSeleccionado === 'diario' ? 'Hoy' :
                                periodoSeleccionado === 'semanal' ? 'Esta semana' :
                                    periodoSeleccionado === 'mensual' ? 'Este mes' :
                                        periodoSeleccionado === 'trimestral' ? 'Este trimestre' : 'Este año'}
                        </span>
                        {faenaSeleccionada !== 'todas' && (
                            <span> | Faena: <span className="font-medium text-gray-700">
                                {faenaSeleccionada === 'norte' ? 'Norte' :
                                    faenaSeleccionada === 'sur' ? 'Sur' : 'Central'}
                            </span></span>
                        )}
                    </div>
                    <div>
                        Última actualización: {ultimaActualizacion.toLocaleTimeString()} - {ultimaActualizacion.toLocaleDateString()}
                    </div>
                </div>
                
                {/* KPI Cards Section */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Indicadores Clave
                        </h2>
                        <div className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                            Ver detalle de indicadores
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpis.map((kpi, i) => (
                            <KpiCard
                                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-${kpi.color}-500`}
                                key={i}
                                title={kpi.title}
                                value={kpi.value}
                                change={kpi.change}
                                unit={kpi.unit}
                                subtext={kpi.subtext}
                                icon={kpi.icon}
                                isPositive={kpi.isPositive}
                            />
                        ))}
                    </div>
                </section>

                {/* Charts Section */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Análisis Operacional
                        </h2>
                        <div className="flex gap-2">
                            <button className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors">
                                Diario
                            </button>
                            <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded border border-blue-600">
                                Semanal
                            </button>
                            <button className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors">
                                Mensual
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <TopEquiposChart />


                        <FaenasChart />


                        <ConsumoTendenciaChart />


                        <div className="rounded-lg shadow-md lg:col-span-3 p-4 border border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-md font-medium text-gray-800">Control de Horas y Mantenimiento</h3>
                                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                    <FiTarget size={14} />
                                    <span>Ver programación completa</span>
                                </button>
                            </div>
                            <BarrilesTrabajoChart />
                        </div>
                    </div>
                </section>


                {/* Additional Content */}
                <section>{children}</section>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
                    <div>© 2025 Sistema de Gestión Minera</div>
                    <div className="flex gap-4 mt-2 sm:mt-0">
                        <a href="#" className="hover:text-blue-600 transition-colors">Ayuda</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Documentación</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Soporte Técnico</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;