import { useState, useEffect, useContext } from "react";
import KpiCard from "../../molecules/KpiCard";
import TopEquiposChart from "../../molecules/TopEquiposChart";
import FaenasChart from "../../molecules/FaenasChart";
import ConsumoTendenciaChart from "../../molecules/ConsumoTendenciaChart";
import BarrilesTrabajoChart from "../../molecules/HorasTrabajoChart";
import SimpleKpiCalculator from "../../molecules/KpiSimpleCalculator";
import axios from '../../../lib/axios';

import {
    FiDroplet, FiTruck, FiActivity, FiTarget, FiX, FiLoader,
    FiAlertCircle, FiCheckCircle, FiDownload, FiFileText,
    FiRefreshCw, FiCalendar
} from "react-icons/fi";
import { FaFlask, FaHardHat, FaCalculator, FaFileAlt, FaChartLine } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const MainGerente = ({ children }) => {
    // Estados existentes
    const periodoSeleccionado = "mensual"; // Fijo como "mensual", sin opción a cambiar
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [mostrarAlertas, setMostrarAlertas] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
    const { user } = useContext(UserContext);

    // Nuevos estados para mejoras
    const [mostrarInformes, setMostrarInformes] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);

    // Inicializar fechaDesde al primer día del mes actual
    const [fechaDesde, setFechaDesde] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );

    // Inicializar fechaHasta al día actual
    const [fechaHasta, setFechaHasta] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [formatoInforme, setFormatoInforme] = useState('pdf');
    const [tipoInforme, setTipoInforme] = useState('resumen');
    const [datosConsumo, setDatosConsumo] = useState(null);
    const [balanceCombustible, setBalanceCombustible] = useState(null);

    // KPIs con valores inicializados a cero
    const [kpis, setKpis] = useState([
        { title: "Producción Total", value: "0", change: "+0%", unit: "ton", subtext: "Toneladas extraídas", icon: FiTruck, isPositive: true, color: "blue" },
        { title: "Camionadas", value: "0", change: "+0", unit: "", subtext: "Número de viajes realizados", icon: FiTruck, isPositive: true, color: "indigo" },
        { title: "Costo Petróleo / Ton", value: "$0", change: "0%", unit: "", subtext: "Costo por tonelada producida", icon: FiDroplet, isPositive: false, color: "red" },
        { title: "Costo Petróleo / Hora", value: "$0", change: "0%", unit: "", subtext: "Costo por hora de operación", icon: FiDroplet, isPositive: true, color: "teal" },
        { title: "Costo Petróleo / Km", value: "$0", change: "0%", unit: "", subtext: "Costo por kilómetro recorrido", icon: FiDroplet, isPositive: false, color: "purple" },
    ]);

    // Estados para datos de la API
    const [equiposData, setEquiposData] = useState([]);
    const [faenasData, setFaenasData] = useState([]);
    const [consumoMensualData, setConsumoMensualData] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [datosDisponibles, setDatosDisponibles] = useState(false);
    const [datosApiCargados, setDatosApiCargados] = useState(false);

    // Función para obtener datos reales
    const obtenerDatosReales = async () => {
        setCargando(true);
        setError(null);

        try {
            // Cargar datos para los 3 gráficos en paralelo
            const [equiposRes, faenasRes, mensualRes] = await Promise.all([
                axios.get(`/api/informes-kpi?tipo=consumo_equipos&faena=${faenaSeleccionada}&periodo=mensual`),
                axios.get(`/api/informes-kpi?tipo=consumo_faenas&faena=${faenaSeleccionada}`),
                axios.get(`/api/informes-kpi?tipo=consumo_mensual&faena=${faenaSeleccionada}`)
            ]);

            let hayDatosGraficos = false;

            // Usar los datos si están disponibles, establecer arrays vacíos si no hay datos
            if (equiposRes.data && equiposRes.data.data && equiposRes.data.data.length > 0) {
                setEquiposData(equiposRes.data.data);
                hayDatosGraficos = true;
            } else {
                setEquiposData([]);
            }

            if (faenasRes.data && faenasRes.data.data && faenasRes.data.data.length > 0) {
                setFaenasData(faenasRes.data.data);
                hayDatosGraficos = true;
            } else {
                setFaenasData([]);
            }

            if (mensualRes.data && mensualRes.data.data && mensualRes.data.data.length > 0) {
                setConsumoMensualData(mensualRes.data.data);
                hayDatosGraficos = true;
            } else {
                setConsumoMensualData([]);
            }

            // Intentar cargar los KPIs
            try {
                const kpisRes = await axios.get(`/api/informes-kpi?tipo=kpis_consumo&faena=${faenaSeleccionada}&periodo=mensual`);

                if (kpisRes.data && kpisRes.data.data) {
                    actualizarKpisDesdeAPI(kpisRes.data.data);
                    hayDatosGraficos = true;
                }
            } catch (kpisError) {
                console.warn('Error al cargar KPIs:', kpisError);
                // No hacemos nada con los KPIs si hay error, mantenemos los valores por defecto
            }

            setUltimaActualizacion(new Date());
            setDatosApiCargados(true);

            // No actualizamos datosDisponibles aquí, lo haremos después de cargar datosConsumo
        } catch (err) {
            console.error('Error al obtener datos reales:', err);
            setError('Error al cargar datos de la base de datos. Por favor verifique la conexión o contacte a soporte técnico.');
            setDatosApiCargados(false);
        } finally {
            setCargando(false);
        }
    };

    // Función para actualizar KPIs desde datos de API
    const actualizarKpisDesdeAPI = (datosAPI) => {
        try {
            const updatedKpis = [...kpis];

            // Actualizar cada KPI según los datos disponibles
            if (datosAPI.toneladas_extraidas !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Producción Total");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: datosAPI.toneladas_extraidas.toLocaleString('es-CL'),
                        change: datosAPI.cambio_produccion || updatedKpis[index].change
                    };
                }
            }

            if (datosAPI.viajes !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Camionadas");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: datosAPI.viajes.toString(),
                        change: datosAPI.cambio_viajes || updatedKpis[index].change
                    };
                }
            }

            // Actualizar KPIs de costos si están disponibles
            if (datosAPI.costo_tonelada !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Ton");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: '$' + datosAPI.costo_tonelada.toLocaleString('es-CL'),
                        change: datosAPI.cambio_costo_ton || updatedKpis[index].change,
                        isPositive: !(datosAPI.cambio_costo_ton && datosAPI.cambio_costo_ton.startsWith('+'))
                    };
                }
            }

            if (datosAPI.costo_hora !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Hora");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: '$' + datosAPI.costo_hora.toLocaleString('es-CL'),
                        change: datosAPI.cambio_costo_hora || updatedKpis[index].change,
                        isPositive: !(datosAPI.cambio_costo_hora && datosAPI.cambio_costo_hora.startsWith('+'))
                    };
                }
            }

            if (datosAPI.costo_km !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Km");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: '$' + datosAPI.costo_km.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        change: datosAPI.cambio_costo_km || updatedKpis[index].change,
                        isPositive: !(datosAPI.cambio_costo_km && datosAPI.cambio_costo_km.startsWith('+'))
                    };
                }
            }

            setKpis(updatedKpis);
        } catch (error) {
            console.error('Error al actualizar KPIs desde API:', error);
        }
    };

    // Función para cargar datos de consumo de petróleo
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

                // Actualizar los KPIs con los datos de consumo
                actualizarKpisDesdeConsumo(datosConsumo);

                // Si hay datos de consumo, tenemos datos disponibles
                setDatosDisponibles(true);
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

    // Función para cargar balance de combustible
    const cargarBalanceCombustible = async () => {
        try {
            const response = await axios.get('/api/informes-kpi/balance-combustible', {
                params: {
                    fecha_inicio: fechaDesde,
                    fecha_fin: fechaHasta + ' 23:59:59', // Incluir todo el día
                    faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
                }
            });

            if (response.data && response.data.status === 'success') {
                const balanceData = response.data.data;

                // Guardar los datos de balance
                setBalanceCombustible(balanceData);

                // Actualizar el balance de combustible en los KPIs
                actualizarBalanceCombustible(balanceData);
            }
        } catch (err) {
            console.error('Error al cargar balance de combustible:', err);
        }
    };

    // Función para actualizar KPIs desde datos de consumo
    const actualizarKpisDesdeConsumo = (datosConsumo) => {
        try {
            if (!datosConsumo || !datosConsumo.resumen_financiero) {
                console.warn('Datos de consumo inválidos o sin resumen financiero');
                return;
            }

            const updatedKpis = [...kpis];
            const resumen = datosConsumo.resumen_financiero;

            // Actualizar "Balance Petróleo" con datos del resumen financiero
            const indexBalance = updatedKpis.findIndex(kpi => kpi.title === "Balance Petróleo");
            if (indexBalance !== -1 && resumen) {
                updatedKpis[indexBalance] = {
                    ...updatedKpis[indexBalance],
                    value: `${resumen.balance_litros.toLocaleString('es-CL')}`,
                    change: resumen.balance_litros > 0 ? "+litros" : "-litros",
                    unit: "lts",
                    subtext: `${Math.abs(resumen.porcentaje_utilizado).toFixed(1)}% utilizado`,
                    icon: FiDroplet,
                    isPositive: resumen.balance_litros >= 0,
                    color: resumen.balance_litros >= 0 ? "green" : "red"
                };
            }

            // Buscar datos de rendimientos por tipo para actualizar KPIs
            if (datosConsumo.rendimiento_por_tipo && datosConsumo.rendimiento_por_tipo.length > 0) {
                // Procesar rendimientos por tipo
                datosConsumo.rendimiento_por_tipo.forEach(rendimiento => {
                    // Solo procesar si hay unidades positivas y datos válidos
                    if (rendimiento.total_unidades > 0 && rendimiento.litros_consumidos > 0) {
                        if (rendimiento.tipo_medicion === 'Horometro') {
                            const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Hora");
                            if (index !== -1) {
                                updatedKpis[index] = {
                                    ...updatedKpis[index],
                                    value: '$' + rendimiento.costo_por_unidad.toLocaleString('es-CL', { maximumFractionDigits: 0 }),
                                    subtext: `${rendimiento.litros_por_unidad.toFixed(2)} litros/hora`,
                                    isPositive: false
                                };
                            }
                        } else if (rendimiento.tipo_medicion === 'Kilometraje') {
                            const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Km");
                            if (index !== -1) {
                                updatedKpis[index] = {
                                    ...updatedKpis[index],
                                    value: '$' + rendimiento.costo_por_unidad.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                    subtext: `${rendimiento.litros_por_unidad.toFixed(2)} litros/km`,
                                    isPositive: false
                                };
                            }
                        }
                    }
                });
            }

            // Calcular costo por tonelada si hay datos de producción (toneladas)
            const indexProduccion = updatedKpis.findIndex(kpi => kpi.title === "Producción Total");
            if (indexProduccion !== -1 && resumen && resumen.litros_consumidos > 0 && resumen.valor_consumos > 0) {
                // Convertir el valor de toneladas a número
                const toneladasValue = updatedKpis[indexProduccion].value.replace(/\./g, '').replace(',', '.');
                const toneladas = parseFloat(toneladasValue);

                if (!isNaN(toneladas) && toneladas > 0) {
                    const costoPorTonelada = resumen.valor_consumos / toneladas;
                    const litrosPorTonelada = resumen.litros_consumidos / toneladas;

                    const indexCostoTon = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Ton");
                    if (indexCostoTon !== -1) {
                        updatedKpis[indexCostoTon] = {
                            ...updatedKpis[indexCostoTon],
                            value: '$' + costoPorTonelada.toLocaleString('es-CL', { maximumFractionDigits: 0 }),
                            subtext: `${litrosPorTonelada.toFixed(2)} litros/ton`,
                            isPositive: false
                        };
                    }
                }
            }

            setKpis(updatedKpis);
        } catch (error) {
            console.error('Error al actualizar KPIs desde datos de consumo:', error);
        }
    };

    // Función para actualizar KPIs con datos del balance de combustible
    const actualizarBalanceCombustible = (balanceData) => {
        try {
            if (!balanceData || !Array.isArray(balanceData) || balanceData.length === 0) {
                console.warn('Datos de balance inválidos');
                return;
            }

            // Si hay una faena seleccionada, buscar sus datos específicos
            let balanceInfo = null;

            if (faenaSeleccionada !== 'todas') {
                balanceInfo = balanceData.find(item => item.id_faena.toString() === faenaSeleccionada);
            } else {
                // Si es "todas", calcular totales
                balanceInfo = {
                    stock_inicial: 0,
                    total_ingresos: balanceData.reduce((sum, item) => sum + parseFloat(item.total_ingresos || 0), 0),
                    total_consumos: balanceData.reduce((sum, item) => sum + parseFloat(item.total_consumos || 0), 0),
                    stock_final_teorico: balanceData.reduce((sum, item) => sum + parseFloat(item.stock_final_teorico || 0), 0),
                    stock_actual: balanceData.reduce((sum, item) => sum + parseFloat(item.stock_actual || 0), 0),
                    diferencia: balanceData.reduce((sum, item) => sum + parseFloat(item.diferencia || 0), 0)
                };
            }

            if (balanceInfo) {
                const updatedKpis = [...kpis];
                const indexBalance = updatedKpis.findIndex(kpi => kpi.title === "Balance Petróleo");

                if (indexBalance !== -1) {
                    // Calcular porcentaje utilizado
                    const porcentajeUtilizado = balanceInfo.total_ingresos > 0
                        ? (balanceInfo.total_consumos / balanceInfo.total_ingresos) * 100
                        : 0;

                    updatedKpis[indexBalance] = {
                        ...updatedKpis[indexBalance],
                        value: `${parseFloat(balanceInfo.stock_final_teorico).toLocaleString('es-CL')}`,
                        change: parseFloat(balanceInfo.stock_final_teorico) > 0 ? "+litros" : "-litros",
                        unit: "lts",
                        subtext: `${Math.abs(porcentajeUtilizado).toFixed(1)}% utilizado`,
                        icon: FiDroplet,
                        isPositive: parseFloat(balanceInfo.stock_final_teorico) >= 0,
                        color: parseFloat(balanceInfo.stock_final_teorico) >= 0 ? "green" : "red"
                    };

                    setKpis(updatedKpis);
                }
            }
        } catch (error) {
            console.error('Error al actualizar balance de combustible:', error);
        }
    };

    // Verificar si tenemos datos disponibles
    useEffect(() => {
        const hayDatos = datosApiCargados && datosConsumo;
        setDatosDisponibles(hayDatos);
    }, [datosApiCargados, datosConsumo]);

    // Cargar datos cuando cambie la faena o las fechas
    useEffect(() => {
        obtenerDatosReales();
        cargarDatosConsumo();
        cargarBalanceCombustible();
    }, [faenaSeleccionada, fechaDesde, fechaHasta]);

    // Función para cargar datos de consumo con el parámetro toneladas
    const cargarDatosConsumoConToneladas = async (toneladas) => {
        try {
            setCargando(true);

            const response = await axios.get('/api/informes-kpi/consumo-maquinas', {
                params: {
                    fecha_inicio: fechaDesde,
                    fecha_fin: fechaHasta + ' 23:59:59', // Incluir todo el día
                    faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null,
                    toneladas: toneladas
                }
            });

            if (response.data && response.data.status === 'success') {
                const datosConsumo = response.data.data;

                // Guardar todos los datos
                setDatosConsumo(datosConsumo);

                // Actualizar los KPIs con los datos de consumo
                actualizarKpisDesdeConsumo(datosConsumo);

                setDatosDisponibles(true);
            } else {
                console.warn('No se pudieron cargar los datos de consumo de máquinas');
            }
        } catch (err) {
            console.error('Error al cargar datos de consumo:', err);
            setError('Error al cargar datos de consumo de máquinas');
        } finally {
            setCargando(false);
        }
    };

    // Función para manejar KPIs calculados desde la calculadora
    const handleCalculatedKpis = (kpisCalculados) => {
        // Verificar que kpisCalculados tenga datos y estructura correcta
        if (!kpisCalculados || !kpisCalculados.data) {
            setError('Los KPIs calculados no tienen un formato válido');
            return;
        }

        try {
            const datos = kpisCalculados.data;

            // Actualizar los KPIs básicos con los valores de la calculadora
            const updatedKpis = [...kpis];

            // Actualizar "Producción Total" (toneladas)
            if (datos.toneladas !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Producción Total");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: datos.toneladas.toLocaleString('es-CL'),
                        change: kpisCalculados.cambios?.produccion || '+0%',
                        isPositive: !(kpisCalculados.cambios?.produccion?.startsWith('-'))
                    };
                }
            }

            // Actualizar "Camionadas"
            if (datos.camionadas !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Camionadas");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: datos.camionadas.toString(),
                        change: kpisCalculados.cambios?.camionadas || '+0%',
                        isPositive: !(kpisCalculados.cambios?.camionadas?.startsWith('-'))
                    };
                }
            }

            // Actualizar el estado de KPIs
            setKpis(updatedKpis);

            // Cargar datos con el nuevo valor de toneladas para recalcular KPIs relacionados
            if (datos.toneladas) {
                cargarDatosConsumoConToneladas(datos.toneladas);
            }

            // Mostrar mensaje de éxito
            setMensajeExito("KPIs actualizados correctamente");
            setTimeout(() => setMensajeExito(null), 3000);

            // Actualizar timestamp
            setUltimaActualizacion(new Date());

            // Cerrar calculadora
            setMostrarCalculadora(false);

        } catch (err) {
            console.error('Error al procesar KPIs calculados:', err);
            setError('Error al procesar los resultados calculados');
        }
    };

    // Función para refrescar datos manualmente
    const refrescarDatos = () => {
        obtenerDatosReales();
        cargarDatosConsumo();
        cargarBalanceCombustible();
    };

    // Obtener el nombre de la faena según su ID
    const getNombreFaena = (id) => {
        switch (id) {
            case '1': return 'Cabildo';
            case '2': return 'Catemu';
            case '3': return 'Chincolco';
            case '4': return 'Tiltil';
            default: return id;
        }
    };

    // Obtener el nombre del periodo
    const getNombrePeriodo = (periodo) => {
        switch (periodo) {
            case 'diario': return 'Hoy';
            case 'semanal': return 'Esta semana';
            case 'mensual': return 'Este periodo';
            default: return 'Periodo actual';
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
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

                {/* Calculadora de KPIs */}
                {mostrarCalculadora && (
                    <SimpleKpiCalculator
                        onCalculate={handleCalculatedKpis}
                        periodo={periodoSeleccionado}
                        faena={faenaSeleccionada}
                        setFaena={setFaenaSeleccionada}
                    />
                )}

                {/* Sección de KPIs */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FaChartLine className="mr-2 text-blue-500" />
                            Indicadores Clave
                        </h2>
                    </div>
                    {/* Encabezado con filtros y última actualización */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 text-sm text-gray-500">
                        <div className="flex items-center mb-3 md:mb-0">
                            <FiCalendar className="mr-2 text-blue-500" />
                            Mostrando datos para: <span className="font-medium text-gray-700 ml-1">
                                Este mes
                            </span>
                            {faenaSeleccionada !== 'todas' && (
                                <span className="ml-2"> | Faena: <span className="font-medium text-gray-700 ml-1">
                                    {getNombreFaena(faenaSeleccionada)}
                                </span></span>
                            )}
                        </div>
                    </div>

                    {/* Controles principales */}
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-6">

                        {/* Acciones principales */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
                                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors shadow-sm"
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                {/* Sección para el reporte de consumo de máquinas - Mostrar solo cuando tenemos datos de consumo */}
                {datosConsumo && datosDisponibles && (
                    <section className="mb-8">
                        <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <FiDroplet className="mr-2 text-blue-500" />
                                Consumo de Petróleo
                            </h2>
                        </div>

                        {/* Selector de faena y rango de fechas */}
                        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar Faena:
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        value={faenaSeleccionada}
                                        onChange={(e) => setFaenaSeleccionada(e.target.value)}
                                    >
                                        <option value="todas">Todas las faenas</option>
                                        <option value="1">Cabildo</option>
                                        <option value="2">Catemu</option>
                                        <option value="3">Chincolco</option>
                                        <option value="4">Tiltil</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Desde:
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => setFechaDesde(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hasta:
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => setFechaHasta(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resumen financiero */}
                        {datosConsumo.resumen_financiero && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                                    <h3 className="text-sm font-medium text-gray-500">Total Ingresado</h3>
                                    <p className="text-2xl font-semibold">{datosConsumo.resumen_financiero.litros_ingresados.toLocaleString('es-CL')} lts</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Valor: ${datosConsumo.resumen_financiero.valor_ingresos.toLocaleString('es-CL')}
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                                    <h3 className="text-sm font-medium text-gray-500">Total Consumido</h3>
                                    <p className="text-2xl font-semibold">{datosConsumo.resumen_financiero.litros_consumidos.toLocaleString('es-CL')} lts</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Valor: ${datosConsumo.resumen_financiero.valor_consumos.toLocaleString('es-CL')}
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
                                    <h3 className="text-sm font-medium text-gray-500">Balance</h3>
                                    <p className="text-2xl font-semibold">
                                        {datosConsumo.resumen_financiero.balance_litros.toLocaleString('es-CL')} lts
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {datosConsumo.resumen_financiero.porcentaje_utilizado.toFixed(1)}% utilizado
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                                    <h3 className="text-sm font-medium text-gray-500">Precio Promedio</h3>
                                    <p className="text-2xl font-semibold">
                                        ${datosConsumo.resumen_financiero.precio_promedio_compra.toLocaleString('es-CL')}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Varianza: {datosConsumo.resumen_financiero.varianza_precios.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tabla de consumo por máquina */}
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto mb-6">
                            <h3 className="text-md font-medium text-gray-800 p-4 border-b">Consumo por Máquina</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Máquina</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faena</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {datosConsumo.consumo_por_maquina.map((maquina, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{maquina.nombre_maquina}</div>
                                                <div className="text-sm text-gray-500">{maquina.patente}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${maquina.tipo_medicion === 'Horometro' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {maquina.tipo_medicion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {maquina.nombre_faena}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                {Number(maquina.litros_consumidos).toLocaleString('es-CL')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                                ${maquina.valor_consumo?.toLocaleString('es-CL') || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                {maquina.litros_por_unidad?.toFixed(2) || '-'} lts/{maquina.unidad}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Consumo por faena */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                                <h3 className="text-md font-medium text-gray-800 p-4 border-b">Consumo por Faena</h3>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faena</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Máquinas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {datosConsumo.consumo_por_faena.map((faena, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                    {faena.nombre_faena}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                    {Number(faena.litros_consumidos).toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                                    ${Number(faena.valor_consumo).toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    {faena.total_maquinas}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                                <h3 className="text-md font-medium text-gray-800 p-4 border-b">Ingresos por Faena</h3>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faena</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Prom.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {datosConsumo.ingresos_por_faena.map((faena, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                    {faena.nombre_faena}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                    {Number(faena.litros_recibidos).toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                                    ${Number(faena.valor_ingreso).toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    ${Number(faena.precio_promedio).toLocaleString('es-CL')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* Sección de gráficos - Mostrar mensaje cuando no hay datos */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FiTarget className="mr-2 text-blue-500" />
                            Análisis Operacional
                        </h2>
                    </div>

                    {!datosDisponibles ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-100">
                            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay datos disponibles</h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                No se encontraron datos para mostrar. Por favor utilice la calculadora de KPIs para ingresar datos manualmente o verifique la conexión con la base de datos.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setMostrarCalculadora(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm mr-3"
                                >
                                    <FaCalculator className="mr-2" />
                                    Usar Calculadora
                                </button>
                                <button
                                    onClick={refrescarDatos}
                                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
                                >
                                    <FiRefreshCw className="mr-2" />
                                    Actualizar Datos
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Pasar los datos reales y la faena seleccionada a los componentes de gráficos */}
                            <TopEquiposChart
                                data={equiposData}
                                faenaSeleccionada={faenaSeleccionada}
                            />
                            <FaenasChart
                                data={faenasData}
                                faenaSeleccionada={faenaSeleccionada}
                            />
                            <ConsumoTendenciaChart
                                data={consumoMensualData}
                                faenaSeleccionada={faenaSeleccionada}
                            />

                            <div className="rounded-lg shadow-md lg:col-span-3 p-4 border border-gray-200 bg-white">
                                <div className="flex justify-between items-center mb-3 border-b pb-2">
                                    <h3 className="text-md font-medium text-gray-800 flex items-center">
                                        <FaHardHat className="mr-2 text-blue-500" />
                                        Control de Horas y Mantenimiento
                                    </h3>
                                </div>
                                <BarrilesTrabajoChart faenaSeleccionada={faenaSeleccionada} />
                            </div>
                        </div>
                    )}
                </section>

                {/* Sección para contenido hijo (si existe) */}
                <section>{children}</section>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
                <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
                    <div>
                        &copy; {new Date().getFullYear()} Minería Analytics. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2">Versión 2.1.0</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
                        <span>Soporte técnico: soporte@mineriaanalytics.cl</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;