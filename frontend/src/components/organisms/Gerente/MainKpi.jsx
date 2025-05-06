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
    FiAlertCircle, FiCheckCircle, FiDownload, FiFileText
} from "react-icons/fi";
import { FaFlask, FaHardHat, FaCalculator, FaFileAlt } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const MainGerente = ({ children }) => {
    // Estados existentes
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mensual");
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [mostrarAlertas, setMostrarAlertas] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
    const { user } = useContext(UserContext);

    // Nuevos estados para mejoras
    const [mostrarInformes, setMostrarInformes] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);
    const [fechaDesde, setFechaDesde] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [fechaHasta, setFechaHasta] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [formatoInforme, setFormatoInforme] = useState('pdf');
    const [tipoInforme, setTipoInforme] = useState('resumen');

    // KPIs por defecto
    const [kpis, setKpis] = useState([
        { title: "Producción Total", value: "45.200", change: "+5%", unit: "ton", subtext: "Toneladas extraídas este mes", icon: FiTruck, isPositive: true, color: "blue" },
        { title: "Ley Promedio", value: "1.23", change: "-0.1%", unit: "%", subtext: "Concentración de mineral promedio", icon: FaFlask, isPositive: false, color: "amber" },
        { title: "Camionadas", value: "820", change: "+12", unit: "", subtext: "Número de viajes realizados", icon: FiTruck, isPositive: true, color: "indigo" },
        { title: "Costo Petróleo / Ton", value: "$15", change: "+3%", unit: "", subtext: "Costo por tonelada producida", icon: FiDroplet, isPositive: false, color: "red" },
        { title: "Costo Petróleo / Hora", value: "$25", change: "-1%", unit: "", subtext: "Costo por hora de operación", icon: FiDroplet, isPositive: true, color: "teal" },
        { title: "Costo Petróleo / Km", value: "$0.50", change: "+0.5%", unit: "", subtext: "Costo por kilómetro recorrido", icon: FiDroplet, isPositive: false, color: "purple" },
    ]);

    // Estados para datos de la API
    const [equiposData, setEquiposData] = useState([]);
    const [faenasData, setFaenasData] = useState([]);
    const [consumoMensualData, setConsumoMensualData] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    // Función para obtener datos de la API de prueba
    const obtenerDatosPrueba = async () => {
        setCargando(true);
        setError(null);
        try {
            const response = await axios.get('/api/test-informes-kpi');

            if (response.data && response.data.datos_demo) {
                let {
                    consumo_equipos,
                    consumo_faenas,
                    consumo_mensual,
                    kpis_consumo
                } = response.data.datos_demo;

                // Si hay una faena seleccionada diferente a "todas", filtramos los datos de demostración
                if (faenaSeleccionada !== 'todas') {
                    // Filtramos los datos de prueba según la faena seleccionada
                    if (consumo_equipos) {
                        consumo_equipos = consumo_equipos.filter(
                            equipo => equipo.id_faena === parseInt(faenaSeleccionada)
                        );
                    }

                    // Para consumo_faenas, podemos mostrar solo la faena seleccionada
                    if (consumo_faenas) {
                        consumo_faenas = consumo_faenas.filter(
                            faena => faena.id_faena === parseInt(faenaSeleccionada) || faena.id === parseInt(faenaSeleccionada)
                        );
                    }

                    // Filtramos datos mensuales por faena si es posible
                    if (consumo_mensual) {
                        consumo_mensual = consumo_mensual.filter(
                            dato => dato.id_faena === parseInt(faenaSeleccionada)
                        );
                    }
                }

                setEquiposData(consumo_equipos || []);
                setFaenasData(consumo_faenas || []);
                setConsumoMensualData(consumo_mensual || []);

                console.log('Datos de prueba cargados:', response.data.datos_demo);
            }

            setUltimaActualizacion(new Date());
        } catch (err) {
            console.error('Error al obtener datos de prueba:', err);
            setError('Error al cargar datos de prueba: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    // Función para obtener datos reales
    const obtenerDatosReales = async () => {
        setCargando(true);
        setError(null);
        try {
            // Cargar datos para los 3 gráficos en paralelo
            const [equiposRes, faenasRes, mensualRes] = await Promise.all([
                axios.get(`/api/informes-kpi?tipo=consumo_equipos&faena=${faenaSeleccionada}&periodo=${periodoSeleccionado}`),
                axios.get(`/api/informes-kpi?tipo=consumo_faenas&faena=${faenaSeleccionada}`), // Agregamos el parámetro faena
                axios.get(`/api/informes-kpi?tipo=consumo_mensual&faena=${faenaSeleccionada}`)
            ]);

            // Usar los datos si están disponibles, o mantener los valores actuales
            if (equiposRes.data && equiposRes.data.data) {
                setEquiposData(equiposRes.data.data);
            } else {
                setEquiposData([]); // Establecer array vacío si no hay datos
            }

            if (faenasRes.data && faenasRes.data.data) {
                setFaenasData(faenasRes.data.data);
            } else {
                setFaenasData([]); // Establecer array vacío si no hay datos
            }

            if (mensualRes.data && mensualRes.data.data) {
                setConsumoMensualData(mensualRes.data.data);
            } else {
                setConsumoMensualData([]); // Establecer array vacío si no hay datos
            }

            // Intentar cargar los KPIs
            try {
                const kpisRes = await axios.get(`/api/informes-kpi?tipo=kpis_consumo&faena=${faenaSeleccionada}&periodo=${periodoSeleccionado}`);

                if (kpisRes.data && kpisRes.data.data) {
                    actualizarKpisDesdeAPI(kpisRes.data.data);
                }
            } catch (kpisError) {
                console.warn('Error al cargar KPIs, usando valores por defecto:', kpisError);
            }

            setUltimaActualizacion(new Date());
        } catch (err) {
            console.error('Error al obtener datos reales:', err);
            setError('Error al cargar datos reales. Usando datos de prueba como respaldo.');

            // Si falla, intentar con datos de prueba
            obtenerDatosPrueba();
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

            if (datosAPI.ley_mineral !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Ley Promedio");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: datosAPI.ley_mineral.toFixed(2),
                        change: datosAPI.cambio_ley || updatedKpis[index].change
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

    // Cargar datos cuando cambie el periodo o la faena
    useEffect(() => {
        obtenerDatosReales();
    }, [periodoSeleccionado, faenaSeleccionada]);

    // Función para manejar KPIs calculados desde la calculadora
    const handleCalculatedKpis = (kpisCalculados) => {
        // Verificar que kpisCalculados tenga datos y estructura correcta
        if (!kpisCalculados || !kpisCalculados.data) {
            setError('Los KPIs calculados no tienen un formato válido');
            return;
        }

        try {
            const datos = kpisCalculados.data;
            // Crear una copia del array de KPIs actual
            const updatedKpis = [...kpis];

            // Actualizar KPI "Producción Total" (toneladas)
            if (datos.toneladas) {
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

            // Actualizar KPI "Camionadas"
            if (datos.camionadas) {
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

            // Recalcular y actualizar otros KPIs que dependen de estos valores
            if (datos.costoTonelada) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Ton");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: '$' + datos.costoTonelada.toLocaleString('es-CL'),
                        isPositive: false
                    };
                }
            }

            if (datos.costoHora) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Hora");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: '$' + datos.costoHora.toLocaleString('es-CL'),
                        isPositive: false
                    };
                }
            }

            if (datos.costoKm) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Km");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: '$' + datos.costoKm.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        isPositive: false
                    };
                }
            }

            // Actualizar el estado con los nuevos KPIs
            setKpis(updatedKpis);

            // Mostrar mensaje de éxito
            setMensajeExito("KPIs actualizados correctamente");
            setTimeout(() => setMensajeExito(null), 3000);

            // Actualizar timestamp de última actualización
            setUltimaActualizacion(new Date());

            // Cerrar calculadora automáticamente tras actualización exitosa
            setMostrarCalculadora(false);
        } catch (err) {
            console.error('Error al procesar KPIs calculados:', err);
            setError('Error al procesar los resultados calculados');
        }
    };

    // Función para generar informes
    const generarInforme = async () => {
        setCargando(true);
        try {
            const response = await axios.get('/api/informes-kpi/generar', {
                params: {
                    tipo: tipoInforme,
                    faena: faenaSeleccionada,
                    periodo: periodoSeleccionado,
                    desde: fechaDesde,
                    hasta: fechaHasta,
                    formato: formatoInforme
                },
                responseType: 'blob'
            });

            // Crear URL para descargar el archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Determinar extensión según formato
            const extension = formatoInforme === 'excel' ? 'xlsx' : 'pdf';

            link.setAttribute('download', `Informe_${tipoInforme}_${periodoSeleccionado}_${faenaSeleccionada}_${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMensajeExito("Informe generado correctamente");
        } catch (error) {
            console.error('Error al generar informe:', error);
            setError('No se pudo generar el informe solicitado');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Encabezado con filtros y última actualización */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 text-sm text-gray-500">
                    <div className="mb-3 md:mb-0">
                        Mostrando datos para: <span className="font-medium text-gray-700">
                            {periodoSeleccionado === 'diario' ? 'Hoy' :
                                periodoSeleccionado === 'semanal' ? 'Esta semana' :
                                    periodoSeleccionado === 'mensual' ? 'Este mes' :
                                        periodoSeleccionado === 'trimestral' ? 'Este trimestre' : 'Este año'}
                        </span>
                        {faenaSeleccionada !== 'todas' && (
                            <span> | Faena: <span className="font-medium text-gray-700">
                                {faenaSeleccionada === '1' ? 'Cabildo' :
                                    faenaSeleccionada === '2' ? 'Catemu' :
                                        faenaSeleccionada === '3' ? 'Chincolco' :
                                            faenaSeleccionada === '4' ? 'Tiltil' : faenaSeleccionada}
                            </span></span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <FiActivity className="mr-1 text-blue-500" />
                        Última actualización: {ultimaActualizacion.toLocaleTimeString()} - {ultimaActualizacion.toLocaleDateString()}
                    </div>
                </div>

                {/* Controles principales */}
                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                    {/* Botones de período */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriodoSeleccionado('diario')}
                            className={`text-sm px-3 py-1 rounded border ${periodoSeleccionado === 'diario'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                                } transition-colors`}
                        >
                            Diario
                        </button>
                        <button
                            onClick={() => setPeriodoSeleccionado('semanal')}
                            className={`text-sm px-3 py-1 rounded border ${periodoSeleccionado === 'semanal'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                                } transition-colors`}
                        >
                            Semanal
                        </button>
                        <button
                            onClick={() => setPeriodoSeleccionado('mensual')}
                            className={`text-sm px-3 py-1 rounded border ${periodoSeleccionado === 'mensual'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-gray-600 border-gray-300 hover:bg-gray-100'
                                } transition-colors`}
                        >
                            Mensual
                        </button>
                    </div>

                    {/* Acciones principales */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMostrarInformes(!mostrarInformes)}
                            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            <FaFileAlt className="mr-2" />
                            {mostrarInformes ? 'Ocultar Informes' : 'Generar Informes'}
                        </button>

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
                </div>

                {/* Selector de faena */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Faena:
                    </label>
                    <select
                        className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
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

                {/* Mensajes de estado */}
                {cargando && (
                    <div className="text-center py-4 bg-white rounded-lg shadow-md mb-4">
                        <FiLoader className="animate-spin mx-auto h-8 w-8 text-blue-500" />
                        <p className="mt-2 text-gray-600">Cargando datos...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
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
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
                        <div className="flex">
                            <div className="py-1"><FiCheckCircle className="h-6 w-6 text-green-500 mr-4" /></div>
                            <div>
                                <p className="font-bold">Éxito</p>
                                <p>{mensajeExito}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Panel de generación de informes */}
                {mostrarInformes && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center mb-4">
                            <FaFileAlt className="text-blue-500 mr-2" size={24} />
                            <h3 className="text-xl font-semibold">Generador de Informes</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Informe
                                </label>
                                <select
                                    value={tipoInforme}
                                    onChange={(e) => setTipoInforme(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="resumen">Resumen General</option>
                                    <option value="detallado">Informe Detallado</option>
                                    <option value="faenas">Comparativa por Faenas</option>
                                    <option value="tendencias">Análisis de Tendencias</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Formato
                                </label>
                                <select
                                    value={formatoInforme}
                                    onChange={(e) => setFormatoInforme(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="excel">Excel</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={generarInforme}
                                disabled={cargando}
                                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                {cargando ? (
                                    <>
                                        <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <FiDownload className="mr-2" />
                                        Generar y Descargar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Calculadora de KPIs - ahora pasamos los valores del estado principal */}
                {mostrarCalculadora && (
                    <SimpleKpiCalculator
                        onCalculate={handleCalculatedKpis}
                        periodo={periodoSeleccionado}
                        faena={faenaSeleccionada}
                        setPeriodo={setPeriodoSeleccionado}
                        setFaena={setFaenaSeleccionada}
                    />
                )}

                {/* Sección de KPIs */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Indicadores Clave
                        </h2>
                        <div className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                            Ver detalle de indicadores
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

                {/* Sección de gráficos - Mostrar mensaje cuando no hay datos */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Análisis Operacional
                        </h2>
                    </div>

                    {equiposData.length === 0 && faenasData.length === 0 && consumoMensualData.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay datos disponibles</h3>
                            <p className="text-gray-600">
                                No se encontraron datos para los filtros seleccionados. Prueba cambiando los filtros o utilizando la calculadora para ingresar nuevos datos.
                            </p>
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

                            <div className="rounded-lg shadow-md lg:col-span-3 p-4 border border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-md font-medium text-gray-800">Control de Horas y Mantenimiento</h3>
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
                <div className="container mx-auto text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;