import { useState, useEffect, useContext, useMemo } from "react";
import axios from '../../lib/axios';
import { FiDroplet, FiTruck, FiActivity, FiAlertCircle, FiRefreshCw, FiCalendar, FiDownload } from "react-icons/fi";
import { FaChartBar, FaHistory, FaFilter } from "react-icons/fa";
import KpiCard from "../molecules/KpiCard";
import { UserContext } from "../../context/userContext";

const KpiDashboard = () => {
    const { user } = useContext(UserContext);

    // Estado para filtros - Reemplazando fechaDesde/fechaHasta con año/mes
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");

    // Obtener año y mes actual
    const fechaActual = new Date();
    const [anoSeleccionado, setAnoSeleccionado] = useState(fechaActual.getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1); // JavaScript months are 0-based

    // Estados para datos
    const [historialKpi, setHistorialKpi] = useState([]);
    const [estadisticasFaenas, setEstadisticasFaenas] = useState([]);
    const [totalesAcumulados, setTotalesAcumulados] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [faenas] = useState([
        { id_faena: 1, ubicacion: 'Cabildo' },
        { id_faena: 2, ubicacion: 'Catemu' },
        { id_faena: 3, ubicacion: 'Chincolco' },
        { id_faena: 4, ubicacion: 'Tiltil' }
    ]);

    // KPIs con valores inicializados a cero
    const [kpis, setKpis] = useState([
        { title: "Producción Total", value: "0", change: "+0%", unit: "ton", subtext: "Toneladas extraídas", icon: FiTruck, isPositive: true, color: "blue" },
        { title: "Camionadas", value: "0", change: "+0", unit: "", subtext: "Número de viajes realizados", icon: FiTruck, isPositive: true, color: "indigo" },
        { title: "Rendimiento", value: "0", change: "0%", unit: "ton/viaje", subtext: "Toneladas por viaje", icon: FiActivity, isPositive: true, color: "green" },
        { title: "Costo Petróleo / Ton", value: "$0", change: "0%", unit: "", subtext: "Costo por tonelada producida", icon: FiDroplet, isPositive: false, color: "red" },
        { title: "Costo Petróleo / Hora", value: "$0", change: "0%", unit: "", subtext: "Costo por hora de operación", icon: FiDroplet, isPositive: true, color: "teal" },
        { title: "Costo Petróleo / Km", value: "$0", change: "0%", unit: "", subtext: "Costo por kilómetro recorrido", icon: FiDroplet, isPositive: false, color: "purple" },
    ]);

    // Generar array de años para el selector (desde 2020 hasta el año actual)
    const años = useMemo(() => {
        const añoActual = new Date().getFullYear();
        const años = [];
        for (let i = 2020; i <= añoActual; i++) {
            años.push(i);
        }
        return años;
    }, []);

    // Meses para el selector
    const meses = [
        { numero: 1, nombre: "Enero" },
        { numero: 2, nombre: "Febrero" },
        { numero: 3, nombre: "Marzo" },
        { numero: 4, nombre: "Abril" },
        { numero: 5, nombre: "Mayo" },
        { numero: 6, nombre: "Junio" },
        { numero: 7, nombre: "Julio" },
        { numero: 8, nombre: "Agosto" },
        { numero: 9, nombre: "Septiembre" },
        { numero: 10, nombre: "Octubre" },
        { numero: 11, nombre: "Noviembre" },
        { numero: 12, nombre: "Diciembre" }
    ];

    // Obtener el periodo actual formateado para mostrar en la UI
    const periodoFormateado = useMemo(() => {
        const mes = meses.find(m => m.numero === mesSeleccionado);
        return `${mes ? mes.nombre : ''} ${anoSeleccionado}`;
    }, [mesSeleccionado, anoSeleccionado, meses]);

    // Cargar datos iniciales
    useEffect(() => {
        cargarTodosDatos();
    }, []);

    // Cargar datos cuando cambian los filtros
    useEffect(() => {
        cargarDatosFiltrados();
    }, [faenaSeleccionada, mesSeleccionado, anoSeleccionado]);

    // Función para cargar todos los datos
    const cargarTodosDatos = async () => {
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

    // Función para cargar datos filtrados
    const cargarDatosFiltrados = async () => {
        setCargando(true);
        setError(null);

        try {
            // Crear fechas del primer y último día del mes seleccionado
            const primerDiaMes = new Date(anoSeleccionado, mesSeleccionado - 1, 1);
            const ultimoDiaMes = new Date(anoSeleccionado, mesSeleccionado, 0);

            const fechaInicio = primerDiaMes.toISOString().split('T')[0];
            const fechaFin = ultimoDiaMes.toISOString().split('T')[0];

            // Hacer la petición con filtros de fecha y faena
            const params = {
                periodo: 'personalizado',
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
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
                const kpisReseteados = kpis.map(kpi => ({
                    ...kpi,
                    value: kpi.title === "Producción Total" ? "0" :
                        kpi.title === "Camionadas" ? "0" :
                            kpi.title === "Rendimiento" ? "0" :
                                kpi.title.includes("Petróleo") ? "$0" : "0",
                    subtext: `${kpi.subtext.split("en")[0]} en ${periodoFormateado}`
                }));
                setKpis(kpisReseteados);
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
            const response = await axios.get('/api/kpi-estadisticas-por-faena');

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
            const response = await axios.get('/api/kpi-totales-acumulados');

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
                    subtext: `Toneladas extraídas en ${periodoFormateado}`
                };
            }

            // Actualizar Camionadas
            const indexCamionadas = kpisActualizados.findIndex(k => k.title === "Camionadas");
            if (indexCamionadas !== -1 && valoresEntrada.camionadas) {
                const camionadas = parseFloat(valoresEntrada.camionadas);
                kpisActualizados[indexCamionadas] = {
                    ...kpisActualizados[indexCamionadas],
                    value: camionadas.toLocaleString('es-CL'),
                    subtext: `Número de viajes en ${periodoFormateado}`
                };
            }

            // Actualizar Rendimiento
            const indexRendimiento = kpisActualizados.findIndex(k => k.title === "Rendimiento");
            if (indexRendimiento !== -1 && valoresEntrada.rendimiento) {
                const rendimiento = parseFloat(valoresEntrada.rendimiento);
                kpisActualizados[indexRendimiento] = {
                    ...kpisActualizados[indexRendimiento],
                    value: rendimiento.toFixed(2),
                    subtext: `Toneladas por viaje en ${periodoFormateado}`
                };
            }

            // Actualizar Costo Petróleo / Ton
            const indexCostoTon = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Ton");
            if (indexCostoTon !== -1 && valoresEntrada.petroleo_toneladas) {
                const costoTon = parseFloat(valoresEntrada.petroleo_toneladas);
                kpisActualizados[indexCostoTon] = {
                    ...kpisActualizados[indexCostoTon],
                    value: `$${costoTon.toLocaleString('es-CL')}`,
                    subtext: `Costo por tonelada en ${periodoFormateado}`
                };
            }

            // Actualizar Costo Petróleo / Hora
            const indexCostoHora = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Hora");
            if (indexCostoHora !== -1 && valoresEntrada.petroleo_horas) {
                const costoHora = parseFloat(valoresEntrada.petroleo_horas);
                kpisActualizados[indexCostoHora] = {
                    ...kpisActualizados[indexCostoHora],
                    value: `$${costoHora.toLocaleString('es-CL')}`,
                    subtext: `Costo por hora en ${periodoFormateado}`
                };
            }

            // Actualizar Costo Petróleo / Km
            const indexCostoKm = kpisActualizados.findIndex(k => k.title === "Costo Petróleo / Km");
            if (indexCostoKm !== -1 && valoresEntrada.petroleo_kilometros) {
                const costoKm = parseFloat(valoresEntrada.petroleo_kilometros);
                kpisActualizados[indexCostoKm] = {
                    ...kpisActualizados[indexCostoKm],
                    value: `$${costoKm.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    subtext: `Costo por kilómetro en ${periodoFormateado}`
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
        const kpisReseteados = [
            { title: "Producción Total", value: "0", change: "+0%", unit: "ton", subtext: `Toneladas extraídas en ${periodoFormateado}`, icon: FiTruck, isPositive: true, color: "blue" },
            { title: "Camionadas", value: "0", change: "+0", unit: "", subtext: `Número de viajes en ${periodoFormateado}`, icon: FiTruck, isPositive: true, color: "indigo" },
            { title: "Rendimiento", value: "0", change: "0%", unit: "ton/viaje", subtext: `Toneladas por viaje en ${periodoFormateado}`, icon: FiActivity, isPositive: true, color: "green" },
            { title: "Costo Petróleo / Ton", value: "$0", change: "0%", unit: "", subtext: `Costo por tonelada en ${periodoFormateado}`, icon: FiDroplet, isPositive: false, color: "red" },
            { title: "Costo Petróleo / Hora", value: "$0", change: "0%", unit: "", subtext: `Costo por hora en ${periodoFormateado}`, icon: FiDroplet, isPositive: true, color: "teal" },
            { title: "Costo Petróleo / Km", value: "$0", change: "0%", unit: "", subtext: `Costo por kilómetro en ${periodoFormateado}`, icon: FiDroplet, isPositive: false, color: "purple" },
        ];
        setKpis(kpisReseteados);
    };

    // Función para refrescar todos los datos
    const refrescarDatos = () => {
        cargarTodosDatos();
    };

    // Función para obtener el nombre completo de una faena
    const obtenerNombreFaena = (idFaena) => {
        const faena = faenas.find(f => f.id_faena.toString() === idFaena.toString());
        return faena ? faena.ubicacion : 'Desconocida';
    };

    // Función para manejar el cambio de mes anterior
    const irMesAnterior = () => {
        let nuevoMes = mesSeleccionado - 1;
        let nuevoAno = anoSeleccionado;

        if (nuevoMes < 1) {
            nuevoMes = 12;
            nuevoAno -= 1;
        }

        setMesSeleccionado(nuevoMes);
        setAnoSeleccionado(nuevoAno);
    };

    // Función para manejar el cambio de mes siguiente
    const irMesSiguiente = () => {
        const fechaActual = new Date();
        const anoActual = fechaActual.getFullYear();
        const mesActual = fechaActual.getMonth() + 1;

        // Evitar ir a meses futuros más allá del mes actual
        if (anoSeleccionado === anoActual && mesSeleccionado >= mesActual) {
            return;
        }

        let nuevoMes = mesSeleccionado + 1;
        let nuevoAno = anoSeleccionado;

        if (nuevoMes > 12) {
            nuevoMes = 1;
            nuevoAno += 1;
        }

        // Verificar que no estamos yendo más allá del mes actual
        if (nuevoAno > anoActual || (nuevoAno === anoActual && nuevoMes > mesActual)) {
            return;
        }

        setMesSeleccionado(nuevoMes);
        setAnoSeleccionado(nuevoAno);
    };

    // Función para exportar datos a Excel/CSV
    const exportarDatos = () => {
        // Esta función podría implementarse para exportar los datos a Excel o CSV
        alert('Funcionalidad de exportación en desarrollo');
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
            {/* Encabezado con título y botón de actualización */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaChartBar className="mr-2 text-blue-600" />
                    Dashboard de Indicadores KPI
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        Última actualización: {ultimaActualizacion.toLocaleString()}
                    </span>
                    <button
                        onClick={refrescarDatos}
                        className="flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        disabled={cargando}
                    >
                        <FiRefreshCw className={`mr-1 ${cargando ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                    <button
                        onClick={exportarDatos}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                    >
                        <FiDownload className="mr-1" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Panel de Filtros mejorado con selección de año/mes */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center">
                        <FaFilter className="mr-2 text-blue-500" />
                        Filtros
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Filtro de Faena - 4 columnas */}
                    <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Faena:
                        </label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={faenaSeleccionada}
                            onChange={(e) => setFaenaSeleccionada(e.target.value)}
                        >
                            <option value="todas">Todas las faenas</option>
                            {faenas.map(faena => (
                                <option key={faena.id_faena} value={faena.id_faena}>
                                    {faena.ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de Periodo (Año y Mes) - 8 columnas */}
                    <div className="md:col-span-8">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Periodo:
                        </label>
                        <div className="flex items-center">
                            <button
                                onClick={irMesAnterior}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-l-md hover:bg-gray-200 transition-colors border border-gray-300"
                            >
                                &laquo; Anterior
                            </button>

                            <div className="flex-1 flex">
                                <select
                                    className="w-1/2 p-2 border-t border-b border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={mesSeleccionado}
                                    onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                                >
                                    {meses.map(mes => (
                                        <option key={mes.numero} value={mes.numero}>
                                            {mes.nombre}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    className="w-1/2 p-2 border-t border-b border-r border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={anoSeleccionado}
                                    onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
                                >
                                    {años.map(año => (
                                        <option key={año} value={año}>
                                            {año}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={irMesSiguiente}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-r-md hover:bg-gray-200 transition-colors border border-gray-300"
                                disabled={
                                    anoSeleccionado === new Date().getFullYear() &&
                                    mesSeleccionado >= new Date().getMonth() + 1
                                }
                            >
                                Siguiente &raquo;
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-500">
                        <FiCalendar className="mr-2 text-blue-500" />
                        <span>
                            {faenaSeleccionada !== 'todas'
                                ? `Mostrando datos para: ${obtenerNombreFaena(faenaSeleccionada)} - ${periodoFormateado}`
                                : `Mostrando datos para todas las faenas - ${periodoFormateado}`}
                        </span>
                    </div>
                </div>
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
                            {historialKpi.map((registro, index) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KpiDashboard;