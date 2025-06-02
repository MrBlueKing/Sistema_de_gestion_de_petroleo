import { useState, useEffect } from "react";
import axios from '../../../lib/axios';
import Header from '../Gerente/Header';

import {
    FiDroplet, FiLoader, FiX, FiCheckCircle,
    FiRefreshCw, FiBarChart2, FiPieChart
} from "react-icons/fi";

// Importación de componentes moleculares para filtros y tablas
import FiltrosComponent from "../../molecules/FiltrosComponent";
import ConsumoPorMaquinaTable from "../../molecules/ConsumoPorMaquinaTable";
import ConsumoPorFaenaTable from "../../molecules/ConsumoPorFaenaTable";
import IngresosPorFaenaTable from "../../molecules/IngresosPorFaenaTable";

// Importación de componentes moleculares para gráficos
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";

const Graficos = ({ children }) => {
    // Estados básicos necesarios
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const [datosConsumo, setDatosConsumo] = useState(null);
    const [datosDisponibles, setDatosDisponibles] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Estado para controlar la vista activa
    const [vistaActiva, setVistaActiva] = useState("tablas"); // tablas | graficos

    // Inicializar fechaDesde al primer día del mes actual
    const [fechaDesde, setFechaDesde] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );

    // Inicializar fechaHasta al día actual
    const [fechaHasta, setFechaHasta] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Función para manejar el cambio de fecha desde
    const handleFechaDesdeChange = (newFechaDesde) => {
        setFechaDesde(newFechaDesde);
        if (fechaHasta < newFechaDesde) {
            setFechaHasta(newFechaDesde);
        }
    };

    // Función para cargar datos de consumo
    const cargarDatosConsumo = async () => {
        try {
            setCargando(true);

            const response = await axios.get('/api/informes-kpi/consumo-maquinas', {
                params: {
                    fecha_inicio: fechaDesde,
                    fecha_fin: fechaHasta + ' 23:59:59', // Incluir todo el día
                    faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
                }
            });

            if (response.data && response.data.status === 'success') {
                const datosConsumo = response.data.data;

                // Guardar todos los datos
                setDatosConsumo(datosConsumo);
                setDatosDisponibles(true);
                setUltimaActualizacion(new Date());
                setRefreshTrigger(prev => prev + 1); // Actualizar gráficos
            } else {
                console.warn('No se pudieron cargar los datos de consumo de máquinas');
                setDatosDisponibles(false);
            }
        } catch (err) {
            console.error('Error al cargar datos de consumo:', err);
            setError('Error al cargar datos de consumo de máquinas');
            setDatosDisponibles(false);
        } finally {
            setCargando(false);
        }
    };

    // Cargar datos cuando cambie la faena o las fechas (con debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fechaDesde && fechaHasta) {
                cargarDatosConsumo();
                // También actualizar el refreshTrigger para forzar la actualización de los gráficos
                setRefreshTrigger(prev => prev + 1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [faenaSeleccionada, fechaDesde, fechaHasta]);

    // Función para refrescar datos manualmente
    const refrescarDatos = () => {
        cargarDatosConsumo();
    };

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

                {/* Sección principal */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FiDroplet className="mr-2 text-blue-500" />
                            Control de Petróleo 
                        </h2>

                        <div className="flex items-center space-x-4">
                            {/* Selector de vista */}
                            <div className="bg-gray-100 rounded-lg p-1 flex">
                                <button
                                    onClick={() => setVistaActiva("tablas")}
                                    className={`px-3 py-1 rounded-md transition-colors ${vistaActiva === "tablas"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    Tablas
                                </button>
                                <button
                                    onClick={() => setVistaActiva("graficos")}
                                    className={`px-3 py-1 rounded-md transition-colors ${vistaActiva === "graficos"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    Gráficos
                                </button>
                            </div>

                            {/* Botón refrescar */}
                            <button
                                onClick={refrescarDatos}
                                className="flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                disabled={cargando}
                            >
                                <FiRefreshCw className={`mr-1 ${cargando ? 'animate-spin' : ''}`} />
                                Actualizar
                            </button>
                        </div>
                    </div>

                    {/* Componente de filtros reutilizable */}
                    <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                        <h3 className="text-md font-medium text-gray-800 mb-4">Filtros de Visualización</h3>
                        <FiltrosComponent
                            fechaDesde={fechaDesde}
                            setFechaDesde={handleFechaDesdeChange}
                            fechaHasta={fechaHasta}
                            setFechaHasta={setFechaHasta}
                            faenaSeleccionada={faenaSeleccionada}
                            setFaenaSeleccionada={setFaenaSeleccionada}
                        />
                    </div>

                    {/* Vista de tablas */}
                    {vistaActiva === "tablas" && (
                        <>

                            {/* Componente de tabla de consumo por máquina */}
                            {datosConsumo && datosConsumo.consumo_por_maquina && (
                                <ConsumoPorMaquinaTable
                                    consumoPorMaquina={datosConsumo.consumo_por_maquina}
                                />
                            )}

                            {/* Componentes de tablas de consumo e ingresos por faena */}
                            {datosConsumo && datosConsumo.consumo_por_faena && datosConsumo.ingresos_por_faena && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <ConsumoPorFaenaTable
                                        consumoPorFaena={datosConsumo.consumo_por_faena}
                                    />
                                    <IngresosPorFaenaTable
                                        ingresosPorFaena={datosConsumo.ingresos_por_faena}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Vista de gráficos */}
                    {vistaActiva === "graficos" && (
                        <>

                            {/* Contenedor de gráficos */}
                            <div className="mt-6">
                                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                                    <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                                        <FiBarChart2 className="mr-2 text-blue-500" />
                                        Visualización de Datos
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Top Equipos - Renderizar siempre que tengamos fechas */}
                                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                Top Equipos por Consumo
                                            </h4>
                                            {(fechaDesde && fechaHasta) && (
                                                <TopEquiposChart
                                                    faenaSeleccionada={faenaSeleccionada}
                                                    fechaDesde={fechaDesde}
                                                    fechaHasta={fechaHasta}
                                                    refreshKey={refreshTrigger}
                                                />
                                            )}
                                        </div>

                                        {/* Faenas - Renderizar siempre que tengamos fechas */}
                                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                Consumo por Faena
                                            </h4>
                                            {(fechaDesde && fechaHasta) && (
                                                <FaenasChart
                                                    faenaSeleccionada={faenaSeleccionada}
                                                    setFaenaSeleccionada={setFaenaSeleccionada}
                                                    fechaDesde={fechaDesde}
                                                    fechaHasta={fechaHasta}
                                                    refreshKey={refreshTrigger}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Tendencia de Consumo - Renderizar siempre que tenemos faena */}
                                    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                                            Tendencia de Consumo
                                        </h4>
                                        {faenaSeleccionada && (
                                            <ConsumoTendenciaChart
                                                faenaSeleccionada={faenaSeleccionada}
                                                fechaDesde={fechaDesde}
                                                fechaHasta={fechaHasta}
                                                refreshKey={refreshTrigger}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* Sección para contenido hijo (si existe) */}
                <section>{children}</section>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
                <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
                    <div>
                        &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2">Versión 0.0.1</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
                        <span>Última actualización: {ultimaActualizacion.toLocaleString()}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Graficos;