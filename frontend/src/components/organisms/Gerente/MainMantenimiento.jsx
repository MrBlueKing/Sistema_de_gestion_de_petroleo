import { useState, useEffect, useContext, useCallback } from "react";
import BarrilesTrabajoChart from "../../molecules/HorasTrabajoChart";
import SimpleKpiCalculator from "../../molecules/KpiSimpleCalculator";
import axios from '../../../lib/axios';

import {
    FiDroplet, FiTruck, FiActivity, FiX, FiLoader,
    FiAlertCircle, FiCheckCircle, 
    FiRefreshCw, 
} from "react-icons/fi";
import { FaCalculator } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const MainGerente = ({ children }) => {
    // Estados existentes
    const periodoSeleccionado = "mensual"; // Fijo como "mensual", sin opción a cambiar
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [mostrarCalculadora, setMostrarCalculadora] = useState(false);

    // Nuevos estados para mejoras
    const [mensajeExito, setMensajeExito] = useState(null);

    // Inicializar fechaDesde al primer día del mes actual
    const [fechaDesde, setFechaDesde] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );

    // Inicializar fechaHasta al día actual
    const [fechaHasta, setFechaHasta] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [datosConsumo, setDatosConsumo] = useState(null);
    const [balanceCombustible, setBalanceCombustible] = useState(null);

    // Estados para datos de la API
    const [equiposData, setEquiposData] = useState([]);
    const [faenasData, setFaenasData] = useState([]);
    const [consumoMensualData, setConsumoMensualData] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [datosDisponibles, setDatosDisponibles] = useState(false);
    const [datosApiCargados, setDatosApiCargados] = useState(false);

    // Datos principales
    const [datosPetroleo, setDatosPetroleo] = useState(null);
    const [datosProduccion, setDatosProduccion] = useState({
        toneladas: 0,
        camionadas: 0
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

    // Función para cargar datos de petróleo
    const cargarDatosPetroleo = useCallback(async () => {
        try {
            const response = await axios.get('/api/kpis-getCostoPetroleoSinUltimosConsumos', {
                params: {
                    faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
                }
            });

            if (response.data && response.data.status === 'success') {
                setDatosPetroleo(response.data.data);
                return response.data.data;
            }
            return null;
        } catch (err) {
            console.error('Error al cargar datos de petróleo:', err);
            return null;
        }
    }, [faenaSeleccionada]);

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
                        change: datosAPI.cambio_produccion || updatedKpis[index].change,
                        subtext: `Toneladas extraídas en ${obtenerNombreMesAnterior()}`
                    };
                }
            }

            if (datosAPI.viajes !== undefined) {
                const index = updatedKpis.findIndex(kpi => kpi.title === "Camionadas");
                if (index !== -1) {
                    updatedKpis[index] = {
                        ...updatedKpis[index],
                        value: datosAPI.viajes.toString(),
                        change: datosAPI.cambio_viajes || updatedKpis[index].change,
                        subtext: `Viajes realizados en ${obtenerNombreMesAnterior()}`
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
                        isPositive: !(datosAPI.cambio_costo_ton && datosAPI.cambio_costo_ton.startsWith('+')),
                        subtext: `Costo por tonelada en ${obtenerNombreMesAnterior()}`
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
                        isPositive: !(datosAPI.cambio_costo_hora && datosAPI.cambio_costo_hora.startsWith('+')),
                        subtext: `Costo por hora en ${obtenerNombreMesAnterior()}`
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
                        isPositive: !(datosAPI.cambio_costo_km && datosAPI.cambio_costo_km.startsWith('+')),
                        subtext: `Costo por kilómetro en ${obtenerNombreMesAnterior()}`
                    };
                }
            }

            setKpis(updatedKpis);
        } catch (error) {
            console.error('Error al actualizar KPIs desde API:', error);
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
                    subtext: `${Math.abs(resumen.porcentaje_utilizado).toFixed(1)}% utilizado en ${obtenerNombreMesAnterior()}`,
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
                                    subtext: `${rendimiento.litros_por_unidad.toFixed(2)} litros/hora en ${obtenerNombreMesAnterior()}`,
                                    isPositive: false
                                };
                            }
                        } else if (rendimiento.tipo_medicion === 'Kilometraje') {
                            const index = updatedKpis.findIndex(kpi => kpi.title === "Costo Petróleo / Km");
                            if (index !== -1) {
                                updatedKpis[index] = {
                                    ...updatedKpis[index],
                                    value: '$' + rendimiento.costo_por_unidad.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                    subtext: `${rendimiento.litros_por_unidad.toFixed(2)} litros/km en ${obtenerNombreMesAnterior()}`,
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
                            subtext: `${litrosPorTonelada.toFixed(2)} litros/ton en ${obtenerNombreMesAnterior()}`,
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
                        subtext: `${Math.abs(porcentajeUtilizado).toFixed(1)}% utilizado en ${obtenerNombreMesAnterior()}`,
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
        cargarDatosPetroleo();
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
    const handleCalculatedKpis = (resultado) => {
        if (!resultado || !resultado.data) {
            setError('Los datos calculados no tienen formato válido');
            return;
        }

        try {
            // Datos completos con producción y consumo
            const datosCompletos = resultado.data;
            const nombreMesAnterior = obtenerNombreMesAnterior();

            // Actualizar datos de producción
            setDatosProduccion({
                toneladas: datosCompletos.toneladas || 0,
                camionadas: datosCompletos.camionadas || 0
            });

            // Actualizar KPIs utilizando los datos combinados
            const kpisActualizados = [...kpis];

            // Actualizar "Producción Total" (toneladas)
            const indexProduccion = kpisActualizados.findIndex(k => k.title === "Producción Total");
            if (indexProduccion !== -1) {
                kpisActualizados[indexProduccion] = {
                    ...kpisActualizados[indexProduccion],
                    value: datosCompletos.toneladas.toLocaleString('es-CL'),
                    subtext: `Toneladas extraídas en ${nombreMesAnterior}`
                };
            }

            // Actualizar Rendimiento si hay datos
            if (datosCompletos.camionadas > 0) {
                const rendimientoCalculado = datosCompletos.toneladas / datosCompletos.camionadas;
                const indexRendimiento = kpisActualizados.findIndex(k => k.title === "Rendimiento");

                if (indexRendimiento !== -1) {
                    kpisActualizados[indexRendimiento] = {
                        ...kpisActualizados[indexRendimiento],
                        value: rendimientoCalculado.toFixed(2),
                        subtext: `Toneladas por viaje en ${nombreMesAnterior}`
                    };
                }
            }

            // Actualizar Camionadas
            const indexCamionadas = kpisActualizados.findIndex(k => k.title === "Camionadas");
            if (indexCamionadas !== -1) {
                kpisActualizados[indexCamionadas] = {
                    ...kpisActualizados[indexCamionadas],
                    value: datosCompletos.camionadas.toLocaleString('es-CL'),
                    subtext: `Viajes realizados en ${nombreMesAnterior}`
                };
            }

            // Actualizar Costo por Tonelada si hay datos suficientes
            if (datosCompletos.costo_por_tonelada > 0) {
                const indexCostoTon = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Ton");
                if (indexCostoTon !== -1) {
                    kpisActualizados[indexCostoTon] = {
                        ...kpisActualizados[indexCostoTon],
                        value: '$' + datosCompletos.costo_por_tonelada.toLocaleString('es-CL', { maximumFractionDigits: 0 }),
                        subtext: `Costo por tonelada en ${nombreMesAnterior}`
                    };
                }
            }

            // Actualizar Costo por Hora si hay datos suficientes
            if (datosCompletos.costo_por_hora > 0) {
                const indexCostoHora = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Hora");
                if (indexCostoHora !== -1) {
                    kpisActualizados[indexCostoHora] = {
                        ...kpisActualizados[indexCostoHora],
                        value: '$' + datosCompletos.costo_por_hora.toLocaleString('es-CL', { maximumFractionDigits: 0 }),
                        subtext: `${datosCompletos.medicion_horometro.toLocaleString('es-CL')} horas en ${nombreMesAnterior}`
                    };
                }
            }

            // Actualizar Costo por Km si hay datos suficientes
            if (datosCompletos.costo_por_km > 0) {
                const indexCostoKm = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Km");
                if (indexCostoKm !== -1) {
                    kpisActualizados[indexCostoKm] = {
                        ...kpisActualizados[indexCostoKm],
                        value: '$' + datosCompletos.costo_por_km.toLocaleString('es-CL', { maximumFractionDigits: 2 }),
                        subtext: `${datosCompletos.medicion_kilometraje.toLocaleString('es-CL')} km en ${nombreMesAnterior}`
                    };
                }
            }

            // Actualizar KPIs
            setKpis(kpisActualizados);

            // Cargar datos con el nuevo valor de toneladas para recalcular KPIs relacionados
            if (datosCompletos.toneladas) {
                cargarDatosConsumoConToneladas(datosCompletos.toneladas);
            }

            // Mensajes de éxito y actualizar timestamp
            setMensajeExito(`KPIs actualizados correctamente para ${nombreMesAnterior}`);
            setTimeout(() => setMensajeExito(null), 3000);
            setUltimaActualizacion(new Date());

            // Ocultar calculadora
            setMostrarCalculadora(false);
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
        obtenerDatosReales();
        cargarDatosConsumo();
        cargarBalanceCombustible();
        cargarDatosPetroleo();
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

                {/* Sección para el reporte de consumo de máquinas - Mostrar solo cuando tenemos datos de consumo */}
                {datosConsumo && datosDisponibles && (
                    <section className="mb-8">
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
                    </section>
                )}

                {/* Sección de gráficos */}
                <section className="mb-8">
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
                            <div className="rounded-lg shadow-md lg:col-span-3 p-4 border border-gray-200 bg-white">
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
                        &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2">Versión 0.0.1</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;