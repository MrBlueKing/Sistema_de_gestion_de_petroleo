
import { useState, useEffect, useContext } from "react";
import KpiCard from "../../molecules/KpiCard";
import SimpleKpiCalculator from "../../molecules/KpiSimpleCalculator";
import axios from '../../../lib/axios';
import Header from "../../organisms/Gerente/Header";
import KpiDashboard from "../../molecules/KpiDashboard"; // Importamos el nuevo componente

import {
    FiDroplet, FiTruck, FiActivity, FiX, FiLoader,
    FiAlertCircle, FiCheckCircle, FiRefreshCw, FiCalendar, FiInfo, FiChevronRight
} from "react-icons/fi";
import { FaCalculator, FaChartLine, FaHistory } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const MainGerente = ({ children }) => {
    // Estados principales
    const periodoSeleccionado = "mensual";
    const { user } = useContext(UserContext);
    const [mensajeExito, setMensajeExito] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

    // Estados para las pestañas
    const [activeTab, setActiveTab] = useState("kpis"); // "kpis" o "calculadora"

    // Estado para KPIs
    const [kpisNeedRefresh, setKpisNeedRefresh] = useState(false);

    // Estados para KPIs (panel principal)
    const [kpiFaenaSeleccionada, setKpiFaenaSeleccionada] = useState("todas");
    const [kpiFechaDesde, setKpiFechaDesde] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [kpiFechaHasta, setKpiFechaHasta] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Estado para datos
    const [datosConsumo, setDatosConsumo] = useState(null);
    const [balanceCombustible, setBalanceCombustible] = useState(null);
    const [equiposData, setEquiposData] = useState([]);
    const [faenasData, setFaenasData] = useState([]);
    const [consumoMensualData, setConsumoMensualData] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [datosDisponibles, setDatosDisponibles] = useState(false);
    const [datosApiCargados, setDatosApiCargados] = useState(false);
    const [datosPetroleo, setDatosPetroleo] = useState(null);
    const [datosProduccion, setDatosProduccion] = useState({
        toneladas: 0,
        camionadas: 0
    });

    // Datos de consumo por tipo de máquina
    const [datosMaquinas, setDatosMaquinas] = useState({
        horometro: [],
        kilometraje: []
    });

    // KPIs con valores inicializados a cero
    const [kpis, setKpis] = useState([
        { title: "Producción Total", value: "0", change: "+0%", unit: "ton", subtext: "Toneladas extraídas", icon: FiTruck, isPositive: true, color: "blue" },
        { title: "Camionadas", value: "0", change: "+0", unit: "", subtext: "Número de viajes realizados", icon: FiTruck, isPositive: true, color: "indigo" },
        { title: "Rendimiento", value: "0", change: "0%", unit: "ton/viaje", subtext: "Toneladas por viaje", icon: FiActivity, isPositive: true, color: "green" },
        { title: "Costo Petróleo / Ton", value: "$0", change: "0%", unit: "", subtext: "Costo por tonelada producida", icon: FiDroplet, isPositive: false, color: "red" },
        { title: "Costo Petróleo / Hora", value: "$0", change: "0%", unit: "", subtext: "Costo por hora de operación", icon: FiDroplet, isPositive: true, color: "teal" },
        { title: "Costo Petróleo / Km", value: "$0", change: "0%", unit: "", subtext: "Costo por kilómetro recorrido", icon: FiDroplet, isPositive: false, color: "purple" },
    ]);

    // Cambiar entre pestañas
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Función para obtener datos reales
    const obtenerDatosReales = async () => {
        setCargando(true);
        setError(null);

        try {
            console.log("Obteniendo datos para faena:", kpiFaenaSeleccionada);

            // Cargar datos para los 3 gráficos en paralelo
            const [equiposRes, faenasRes, mensualRes] = await Promise.all([
                axios.get(`/api/informes-kpi?tipo=consumo_equipos&faena=${kpiFaenaSeleccionada}&periodo=mensual`),
                axios.get(`/api/informes-kpi?tipo=consumo_faenas&faena=${kpiFaenaSeleccionada}`),
                axios.get(`/api/informes-kpi?tipo=consumo_mensual&faena=${kpiFaenaSeleccionada}`)
            ]);

            let hayDatosGraficos = false;

            // Usar los datos si están disponibles, establecer arrays vacíos si no hay datos
            if (equiposRes.data?.data?.length > 0) {
                setEquiposData(equiposRes.data.data);
                hayDatosGraficos = true;
            } else {
                setEquiposData([]);
            }

            if (faenasRes.data?.data?.length > 0) {
                setFaenasData(faenasRes.data.data);
                hayDatosGraficos = true;
            } else {
                setFaenasData([]);
            }

            if (mensualRes.data?.data?.length > 0) {
                setConsumoMensualData(mensualRes.data.data);
                hayDatosGraficos = true;
            } else {
                setConsumoMensualData([]);
            }

            // Intentar cargar los KPIs
            try {
                const kpisRes = await axios.get(`/api/informes-kpi?tipo=kpis_consumo&faena=${kpiFaenaSeleccionada}&periodo=mensual`);

                if (kpisRes.data?.data) {
                    actualizarKpisDesdeAPI(kpisRes.data.data);
                    hayDatosGraficos = true;
                }
            } catch (kpisError) {
                console.warn('Error al cargar KPIs:', kpisError);
            }

            setUltimaActualizacion(new Date());
            setDatosApiCargados(true);
        } catch (err) {
            console.error('Error al obtener datos reales:', err);
            setError('Error al cargar datos de la base de datos. Por favor verifique la conexión o contacte a soporte técnico.');
            setDatosApiCargados(false);
        } finally {
            setCargando(false);
        }
    };

    // Función para manejar KPIs calculados desde la calculadora
    const handleCalculatedKpis = (resultado) => {
        if (!resultado?.data) {
            setError('Los datos calculados no tienen formato válido');
            return;
        }

        try {
            // Mensajes de éxito y actualizar timestamp
            setMensajeExito(`KPIs actualizados correctamente para ${obtenerNombreMesAnterior()}`);
            setTimeout(() => setMensajeExito(null), 3000);
            setUltimaActualizacion(new Date());

            // Marcar que los KPIs necesitan actualizarse
            setKpisNeedRefresh(true);

            // Cambiar a la pestaña de KPIs después de registrar datos
            setActiveTab("kpis");
        } catch (err) {
            console.error('Error al procesar KPIs calculados:', err);
            setError('Error al procesar los resultados calculados');
        }
    };

    // Función auxiliar para obtener el nombre del mes anterior
    const obtenerNombreMesAnterior = () => {
        const fechaActual = new Date();
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        return fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    // Función para refrescar datos manualmente
    const refrescarDatos = () => {
        setKpisNeedRefresh(true);
    };

    // Actualización cuando se marca que los KPIs necesitan actualizar
    useEffect(() => {
        if (kpisNeedRefresh) {
            // Si estamos en la pestaña del nuevo dashboard, no necesitamos ejecutar la lógica antigua
            if (activeTab !== 'kpis') {
                obtenerDatosReales();
            }
            setKpisNeedRefresh(false);
        }
    }, [kpisNeedRefresh]);

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-6">
                {/* Mensajes de estado */}
                {cargando && (
                    <div className="text-center py-4 bg-white rounded-lg shadow-md mb-4">
                        <FiLoader className="animate-spin mx-auto h-8 w-8 text-blue-500" />
                        <p className="mt-2 text-gray-600">Cargando datos...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md shadow-sm">
                        <div className="flex">
                            <div className="py-1"><FiX className="h-6 w-6 text-red-500 mr-4" /></div>
                            <div>
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {mensajeExito && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-r-md shadow-sm">
                        <div className="flex">
                            <div className="py-1"><FiCheckCircle className="h-6 w-6 text-green-500 mr-4" /></div>
                            <div>
                                <p className="font-bold">Éxito</p>
                                <p>{mensajeExito}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs para KPIs y Calculadora */}
                <div className="mb-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`px-6 py-3 font-medium text-sm ${activeTab === 'kpis'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => handleTabChange('kpis')}
                        >
                            <FaChartLine className="inline mr-2" />
                            Indicadores de Desempeño (KPIs)
                        </button>
                        <button
                            className={`px-6 py-3 font-medium text-sm ${activeTab === 'calculadora'
                                ? 'border-b-2 border-orange-500 text-orange-600'
                                : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => handleTabChange('calculadora')}
                        >
                            <FaCalculator className="inline mr-2" />
                            Ingresar Datos
                        </button>
                    </div>
                </div>

                {/* Panel de KPIs con el nuevo componente */}
                {activeTab === 'kpis' && (
                    <KpiDashboard />
                )}

                {/* Calculadora de KPIs */}
                {activeTab === 'calculadora' && (
                    <SimpleKpiCalculator
                        onCalculate={handleCalculatedKpis}
                        periodo={periodoSeleccionado}
                    />
                )}
            </div>
            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
                <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
                    <div>
                        &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2">Versión 1.0.0</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;