import { useState, useEffect, useContext, useMemo } from "react";
import axios from '../../lib/axios';
import { FiDroplet, FiTruck, FiActivity, FiAlertCircle, FiRefreshCw, FiCalendar, FiDownload } from "react-icons/fi";
import { FaChartBar, FaHistory, FaFilter } from "react-icons/fa";
import KpiCard from "../molecules/KpiCard";
import { UserContext } from "../../context/userContext";

// El KpiDashboard ahora recibe los filtros como props
const   KpiDashboard = ({ fechaDesde, fechaHasta, faenaSeleccionada, faenas = [] }) => {
    const { user } = useContext(UserContext);

    // Estados para datos
    const [historialKpi, setHistorialKpi] = useState([]);
    const [estadisticasFaenas, setEstadisticasFaenas] = useState([]);
    const [totalesAcumulados, setTotalesAcumulados] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);

    // KPIs con valores inicializados a cero
    const [kpis, setKpis] = useState([
        { title: "Producción Total", value: "0", change: "+0%", unit: "ton", subtext: "Toneladas extraídas", icon: FiTruck, isPositive: true, color: "blue" },
        { title: "Camionadas", value: "0", change: "+0", unit: "", subtext: "Número de viajes realizados", icon: FiTruck, isPositive: true, color: "indigo" },
        { title: "Rendimiento", value: "0", change: "0%", unit: "ton/viaje", subtext: "Toneladas por viaje", icon: FiActivity, isPositive: true, color: "green" },
        { title: "Costo Petróleo / Ton", value: "$0", change: "0%", unit: "", subtext: "Costo por tonelada producida", icon: FiDroplet, isPositive: false, color: "red" },
        { title: "Costo Petróleo / Hora", value: "$0", change: "0%", unit: "", subtext: "Costo por hora de operación", icon: FiDroplet, isPositive: true, color: "teal" },
        { title: "Costo Petróleo / Km", value: "$0", change: "0%", unit: "", subtext: "Costo por kilómetro recorrido", icon: FiDroplet, isPositive: false, color: "purple" },
    ]);

    // Cargar datos cuando cambian las fechas o faena
    useEffect(() => {
        if (fechaDesde && fechaHasta) {
            cargarTodosDatos();
        }
    }, [fechaDesde, fechaHasta, faenaSeleccionada]);

    // Función para cargar todos los datos
    const cargarTodosDatos = async () => {
        if (!fechaDesde || !fechaHasta) return;
        
        setCargando(true);
        setError(null);

        try {
            await Promise.all([
                cargarEstadisticasPorFaena(),
                cargarTotalesAcumulados(),
                cargarDatosFiltrados()
            ]);

            setUltimaActualizacion(new Date());
            mostrarMensajeExito("Datos cargados correctamente");
        } catch (err) {
            console.error("Error al cargar los datos:", err);
            setError("No se pudieron cargar los datos de los KPI. Por favor, intente nuevamente.");
        } finally {
            setCargando(false);
        }
    };

    // Función para mostrar mensaje de éxito
    const mostrarMensajeExito = (mensaje) => {
        setExito(mensaje);
        setTimeout(() => {
            setExito(null);
        }, 3000);
    };

    // Función para cargar datos filtrados por fecha y faena
    const cargarDatosFiltrados = async () => {
        if (!fechaDesde || !fechaHasta) return;
        
        setCargando(true);
        setError(null);

        try {
            // Hacer la petición con filtros de fecha y faena
            const params = {
                periodo: 'personalizado',
                fecha_inicio: fechaDesde,
                fecha_fin: fechaHasta
            };

            if (faenaSeleccionada !== 'todas') {
                params.faena = faenaSeleccionada;
            }

            // Obtener historial filtrado por periodo y faena
            const response = await axios.get('/api/kpi-valores-entrada-historial-filtrado', {
                params: params
            });

            if (response.data?.success) {
                setHistorialKpi(response.data.data);
                actualizarKPIsDesdeHistorial(response.data.data);
            } else {
                console.warn("La respuesta no tiene el formato esperado:", response.data);
                // Incluso si no hay datos, reiniciamos las tarjetas de KPI
                resetearKPIs();
            }

            setUltimaActualizacion(new Date());
        } catch (err) {
            console.error("Error al cargar los datos filtrados:", err);
            setError("No se pudieron cargar los datos filtrados. Por favor, intente nuevamente.");

            // Resetear KPIs en caso de error
            resetearKPIs();
        } finally {
            setCargando(false);
        }
    };

    // Función para cargar estadísticas por faena
    const cargarEstadisticasPorFaena = async () => {
        try {
            const response = await axios.get('/api/kpi-estadisticas-por-faena', {
                params: {
                    desde: fechaDesde,
                    hasta: fechaHasta,
                    faena: faenaSeleccionada
                }
            });

            if (response.data?.success) {
                setEstadisticasFaenas(response.data.data);
            } else {
                console.warn("La respuesta de estadísticas no tiene el formato esperado:", response.data);
            }
        } catch (err) {
            console.error("Error al cargar las estadísticas por faena:", err);
            throw err;
        }
    };

    // Función para cargar totales acumulados
    const cargarTotalesAcumulados = async () => {
        try {
            const response = await axios.get('/api/kpi-totales-acumulados', {
                params: {
                    desde: fechaDesde,
                    hasta: fechaHasta,
                    faena: faenaSeleccionada
                }
            });

            if (response.data?.success) {
                setTotalesAcumulados(response.data.data);
                if (response.data.ultima_actualizacion) {
                    setUltimaActualizacion(new Date(response.data.ultima_actualizacion));
                }
            } else {
                console.warn("La respuesta de totales no tiene el formato esperado:", response.data);
            }
        } catch (err) {
            console.error("Error al cargar los totales acumulados:", err);
            throw err;
        }
    };

    // Función para actualizar los KPIs a partir del historial
    const actualizarKPIsDesdeHistorial = (historial) => {
        // Si no hay datos, resetear los KPIs
        if (!historial || historial.length === 0) {
            resetearKPIs();
            return;
        }

        try {
            // Tomamos el registro más reciente del historial para el periodo seleccionado
            const registroReciente = historial[0];
            const valoresEntrada = registroReciente.valores_entrada;

            if (!valoresEntrada) {
                resetearKPIs();
                return;
            }

            // Clonamos los KPIs actuales para actualizarlos
            const kpisActualizados = [...kpis];

            // Actualizar Producción Total
            const indexProduccion = kpisActualizados.findIndex(k => k.title === "Producción Total");
            if (indexProduccion !== -1 && valoresEntrada.toneladas_extraidas) {
                const toneladas = parseFloat(valoresEntrada.toneladas_extraidas);
                kpisActualizados[indexProduccion] = {
                    ...kpisActualizados[indexProduccion],
                    value: toneladas.toLocaleString('es-CL'),
                    subtext: `Toneladas extraídas (${fechaDesde} - ${fechaHasta})`
                };
            }

            // Actualizar Camionadas
            const indexCamionadas = kpisActualizados.findIndex(k => k.title === "Camionadas");
            if (indexCamionadas !== -1 && valoresEntrada.camionadas) {
                const camionadas = parseFloat(valoresEntrada.camionadas);
                kpisActualizados[indexCamionadas] = {
                    ...kpisActualizados[indexCamionadas],
                    value: camionadas.toLocaleString('es-CL'),
                    subtext: `Número de viajes (${fechaDesde} - ${fechaHasta})`
                };
            }

            // Actualizar Rendimiento
            const indexRendimiento = kpisActualizados.findIndex(k => k.title === "Rendimiento");
            if (indexRendimiento !== -1 && valoresEntrada.rendimiento) {
                const rendimiento = parseFloat(valoresEntrada.rendimiento);
                kpisActualizados[indexRendimiento] = {
                    ...kpisActualizados[indexRendimiento],
                    value: rendimiento.toFixed(2),
                    subtext: `Toneladas por viaje (${fechaDesde} - ${fechaHasta})`
                };
            }

            // Actualizar Costo Petróleo / Ton
            const indexCostoTon = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Ton");
            if (indexCostoTon !== -1 && valoresEntrada.petroleo_toneladas) {
                const costoTon = parseFloat(valoresEntrada.petroleo_toneladas);
                kpisActualizados[indexCostoTon] = {
                    ...kpisActualizados[indexCostoTon],
                    value: `$${costoTon.toLocaleString('es-CL')}`,
                    subtext: `Costo por tonelada (${fechaDesde} - ${fechaHasta})`
                };
            }

            // Actualizar Costo Petróleo / Hora
            const indexCostoHora = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Hora");
            if (indexCostoHora !== -1 && valoresEntrada.petroleo_horas) {
                const costoHora = parseFloat(valoresEntrada.petroleo_horas);
                kpisActualizados[indexCostoHora] = {
                    ...kpisActualizados[indexCostoHora],
                    value: `$${costoHora.toLocaleString('es-CL')}`,
                    subtext: `Costo por hora (${fechaDesde} - ${fechaHasta})`
                };
            }

            // Actualizar Costo Petróleo / Km
            const indexCostoKm = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Km");
            if (indexCostoKm !== -1 && valoresEntrada.petroleo_kilometros) {
                const costoKm = parseFloat(valoresEntrada.petroleo_kilometros);
                kpisActualizados[indexCostoKm] = {
                    ...kpisActualizados[indexCostoKm],
                    value: `$${costoKm.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    subtext: `Costo por kilómetro (${fechaDesde} - ${fechaHasta})`
                };
            }

            // Aplicar los cambios
            setKpis(kpisActualizados);

        } catch (error) {
            console.error("Error al actualizar los KPIs desde el historial:", error);
            resetearKPIs();
        }
    };

    // Función para resetear los KPIs a valores iniciales
    const resetearKPIs = () => {
        const fechasText = fechaDesde && fechaHasta ? `(${fechaDesde} - ${fechaHasta})` : "";
        
        const kpisReseteados = [
            { title: "Producción Total", value: "0", change: "+0%", unit: "ton", subtext: `Toneladas extraídas ${fechasText}`, icon: FiTruck, isPositive: true, color: "blue" },
            { title: "Camionadas", value: "0", change: "+0", unit: "", subtext: `Número de viajes ${fechasText}`, icon: FiTruck, isPositive: true, color: "indigo" },
            { title: "Rendimiento", value: "0", change: "0%", unit: "ton/viaje", subtext: `Toneladas por viaje ${fechasText}`, icon: FiActivity, isPositive: true, color: "green" },
            { title: "Costo Petróleo / Ton", value: "$0", change: "0%", unit: "", subtext: `Costo por tonelada ${fechasText}`, icon: FiDroplet, isPositive: false, color: "red" },
            { title: "Costo Petróleo / Hora", value: "$0", change: "0%", unit: "", subtext: `Costo por hora ${fechasText}`, icon: FiDroplet, isPositive: true, color: "teal" },
            { title: "Costo Petróleo / Km", value: "$0", change: "0%", unit: "", subtext: `Costo por kilómetro ${fechasText}`, icon: FiDroplet, isPositive: false, color: "purple" },
        ];
        setKpis(kpisReseteados);
    };

    // Función para refrescar todos los datos
    const refrescarDatos = () => {
        if (fechaDesde && fechaHasta) {
            cargarTodosDatos();
        }
    };

    // Función para obtener el nombre completo de una faena
    const obtenerNombreFaena = (idFaena) => {
        const faena = faenas.find(f => f.value === idFaena.toString());
        return faena ? faena.label : 'Desconocida';
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
            {/* Encabezado con título y botón de actualización */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaChartBar className="mr-2 text-blue-600" />
                    Dashboard de Indicadores KPI
                </h2>
                <button
                    onClick={refrescarDatos}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                    disabled={cargando || !fechaDesde || !fechaHasta}
                >
                    <FiRefreshCw className={`mr-1 ${cargando ? 'animate-spin' : ''}`} />
                    {cargando ? 'Cargando...' : 'Actualizar'}
                </button>
            </div>

            {/* Mensajes de estado */}
            {cargando && (
                <div className="text-center py-4 bg-blue-50 rounded-lg mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando datos...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-md">
                    <div className="flex items-center">
                        <FiAlertCircle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {exito && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r-md">
                    <div className="flex items-center">
                        <FiAlertCircle className="h-5 w-5 mr-2" />
                        <span>{exito}</span>
                    </div>
                </div>
            )}

            {/* Tarjetas de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {kpis.map((kpi, index) => (
                    <KpiCard
                        key={index}
                        title={kpi.title}
                        value={kpi.value}
                        change={kpi.change}
                        unit={kpi.unit}
                        subtext={kpi.subtext}
                        icon={kpi.icon}
                        isPositive={kpi.isPositive}
                        color={kpi.color}
                    />
                ))}
            </div>

            {/* Historial reciente */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center">
                        <FaHistory className="mr-2 text-blue-500" />
                        Historial de Registros
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faena</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toneladas</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camionadas</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimiento</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Petróleo/Ton</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Petróleo/Hora</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado por</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {historialKpi.length > 0 ? (
                                historialKpi.map((registro, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {new Date(registro.fecha_fin_periodo).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {registro.faena ? registro.faena.ubicacion : obtenerNombreFaena(registro.id_faena)}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {parseFloat(registro.valores_entrada?.toneladas_extraidas || 0).toLocaleString('es-CL')} ton
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {parseFloat(registro.valores_entrada?.camionadas || 0).toLocaleString('es-CL')}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {parseFloat(registro.valores_entrada?.rendimiento || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            ${parseFloat(registro.valores_entrada?.petroleo_toneladas || 0).toLocaleString('es-CL')}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            ${parseFloat(registro.valores_entrada?.petroleo_horas || 0).toLocaleString('es-CL')}
                                        </td>
                                        <td className="py-2 px-3 text-sm text-gray-500">
                                            {registro.usuario ? registro.usuario.nombre : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-4 text-center text-gray-500">
                                        {!fechaDesde || !fechaHasta 
                                            ? "Seleccione un rango de fechas para ver el historial" 
                                            : "No hay registros para el período seleccionado"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pie de página con fecha de actualización */}
            <div className="text-xs text-gray-500 text-center">
                Última actualización: {ultimaActualizacion.toLocaleString()}
            </div>
        </div>
    );
};

export default KpiDashboard;