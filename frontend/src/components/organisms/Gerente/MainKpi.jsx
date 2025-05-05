import { useState, useEffect, useContext } from "react";
import KpiCard from "../../molecules/KpiCard";
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";
import BarrilesTrabajoChart from "../../molecules/HorasTrabajoChart";
import SimpleKpiCalculator from "../../molecules/KpiSimpleCalculator";

import {
    FiDroplet,
    FiTruck,
    FiActivity,
    FiTarget,
    FiX
} from "react-icons/fi";
import { FaFlask, FaHardHat, FaCalculator } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const MainGerente = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mensual");
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [mostrarAlertas, setMostrarAlertas] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
    const { user } = useContext(UserContext); // Asegúrate de que el contexto esté disponible aquí

    const [kpis, setKpis] = useState([
        { title: "Producción Total", value: "45.200", change: "+5%", unit: "ton", subtext: "Toneladas extraídas este mes", icon: FiTruck, isPositive: true, color: "blue" },
        { title: "Ley Promedio", value: "1.23", change: "-0.1%", unit: "%", subtext: "Concentración de mineral promedio", icon: FaFlask, isPositive: false, color: "amber" },
        { title: "Camionadas", value: "820", change: "+12", unit: "", subtext: "Número de viajes realizados", icon: FiTruck, isPositive: true, color: "indigo" },
        { title: "Costo Petróleo / Ton", value: "$15", change: "+3%", unit: "", subtext: "Costo por tonelada producida", icon: FiDroplet, isPositive: false, color: "red" },
        { title: "Costo Petróleo / Hora", value: "$25", change: "-1%", unit: "", subtext: "Costo por hora de operación", icon: FiDroplet, isPositive: true, color: "teal" },
        { title: "Costo Petróleo / Km", value: "$0.50", change: "+0.5%", unit: "", subtext: "Costo por kilómetro recorrido", icon: FiDroplet, isPositive: false, color: "purple" },
    ]);

    useEffect(() => {
        setUltimaActualizacion(new Date());
    }, [periodoSeleccionado, faenaSeleccionada]);

    // Modificación al handleCalculatedKpis en MainGerente.jsx
    const handleCalculatedKpis = (calculatedKpis) => {
        // Procesar los KPIs como antes
        const processedKpis = calculatedKpis.map(kpi => {
            let iconComponent = FiActivity;
            if (kpi.icon === "FiTruck") iconComponent = FiTruck;
            else if (kpi.icon === "FaFlask") iconComponent = FaFlask;
            else if (kpi.icon === "FiActivity") iconComponent = FiActivity;
            else if (kpi.icon === "FiDroplet") iconComponent = FiDroplet;

            return { ...kpi, icon: iconComponent };
        });

        // Actualizar el estado
        setKpis(processedKpis);
        setUltimaActualizacion(new Date());

        // Console log para depuración
        console.log('=== DATOS ACTUALIZADOS ===');
        console.log('Período seleccionado:', periodoSeleccionado);
        console.log('Faena seleccionada:', faenaSeleccionada);
        console.log('Última actualización:', new Date().toLocaleString());
        console.log('KPIs calculados:', processedKpis);
        console.log('DAtos usuario:', user);

        // Mostrar detalles de cada KPI
        console.log('=== DETALLE DE KPIS ===');
        processedKpis.forEach((kpi, index) => {
            console.log(`KPI #${index + 1}: ${kpi.title}`);
            console.log(`  - Valor: ${kpi.value} ${kpi.unit}`);
            console.log(`  - Cambio: ${kpi.change} (${kpi.isPositive ? 'Positivo' : 'Negativo'})`);
        });

        // Estado completo del componente
        console.log('=== ESTADO DEL COMPONENTE ===');
        console.log('Mostrar calculadora:', mostrarCalculadora);
        console.log('Mostrar alertas:', mostrarAlertas);
    };

    // También puedes añadir un useEffect para monitorear los cambios en los KPIs
    useEffect(() => {
        if (kpis.length > 0) {
            console.log('=== KPIS ACTUALIZADOS ===');
            console.log('Nuevos valores de KPIs:', kpis);
        }
    }, [kpis]);

    // Para depurar datos de la API si estás llamando a alguna
    const fetchDataFromAPI = async () => {
        try {
            console.log('Solicitando datos de la API...');
            // Tu llamada a la API aquí

            console.log('Datos recibidos de la API:', /* datos recibidos */);
        } catch (error) {
            console.error('Error al obtener datos:', error);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const actualizarDatos = () => {
        setUltimaActualizacion(new Date());
    };

    const exportarDatos = (formato) => {
        alert(`Exportando en formato ${formato}...`);
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            <div className="container mx-auto px-4 py-6">
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

                <div className="mb-6">
                    <button
                        onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
                        className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                    >
                        {mostrarCalculadora ? (
                            <>
                                <FiX className="mr-2" /> Ocultar Calculadora
                            </>
                        ) : (
                            <>
                                <FaCalculator className="mr-2" /> Calcular KPIs
                            </>
                        )}
                    </button>
                </div>

                {mostrarCalculadora && (
                    <SimpleKpiCalculator onCalculate={handleCalculatedKpis} />
                )}

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
                        {kpis.map((kpi, i) => {
                            const borderColor = {
                                blue: "border-blue-500",
                                amber: "border-amber-500",
                                green: "border-green-500",
                                indigo: "border-indigo-500",
                                red: "border-red-500",
                                teal: "border-teal-500",
                                purple: "border-purple-500",
                            }[kpi.color] || "border-gray-500";

                            return (
                                <KpiCard
                                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 ${borderColor}`}
                                    key={i}
                                    title={kpi.title}
                                    value={kpi.value}
                                    change={kpi.change}
                                    unit={kpi.unit}
                                    subtext={kpi.subtext}
                                    icon={kpi.icon}
                                    isPositive={kpi.isPositive}
                                />
                            );
                        })}
                    </div>
                </section>

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

                <section>{children}</section>
            </div>

            <footer className="bg-white border-t border-gray-200 py-4 px-6">
                <div className="container mx-auto text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;
