import { useState, useEffect } from "react";
import axios from '../../../lib/axios';

import {
    FiDroplet, FiLoader, FiX, FiCheckCircle,
    FiRefreshCw, FiCalendar
} from "react-icons/fi";

const MainGerente = ({ children }) => {
    // Estados básicos necesarios
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const [datosConsumo, setDatosConsumo] = useState(null);
    const [datosDisponibles, setDatosDisponibles] = useState(false);

    // Inicializar fechaDesde al primer día del mes actual
    const [fechaDesde, setFechaDesde] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );

    // Inicializar fechaHasta al día actual
    const [fechaHasta, setFechaHasta] = useState(
        new Date().toISOString().split('T')[0]
    );

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

    // Cargar datos cuando cambie la faena o las fechas
    useEffect(() => {
        cargarDatosConsumo();
    }, [faenaSeleccionada, fechaDesde, fechaHasta]);

    // Función para refrescar datos manualmente
    const refrescarDatos = () => {
        cargarDatosConsumo();
    };

    // Obtener nombre de faena
    const getNombreFaena = (id) => {
        switch (id) {
            case '1': return 'Cabildo';
            case '2': return 'Catemu';
            case '3': return 'Chincolco';
            case '4': return 'Tiltil';
            default: return id;
        }
    };

    // Función auxiliar para obtener el nombre del mes actual
    const obtenerNombreMes = () => {
        const fechaActual = new Date();
        return fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' });
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

                {/* Sección para el reporte de consumo de máquinas */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FiDroplet className="mr-2 text-blue-500" />
                            Consumo de Petróleo
                        </h2>
                        
                        <div className="flex items-center">
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

                    {/* Información del período y faena */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 text-sm text-gray-500">
                        <div className="flex items-center mb-3 md:mb-0">
                            <FiCalendar className="mr-2 text-blue-500" />
                            Mostrando datos para: <span className="font-medium text-gray-700 ml-1">
                                {obtenerNombreMes()}
                            </span>
                            {faenaSeleccionada !== 'todas' && (
                                <span className="ml-2"> | Faena: <span className="font-medium text-gray-700 ml-1">
                                    {getNombreFaena(faenaSeleccionada)}
                                </span></span>
                            )}
                        </div>

                        <div className="text-xs text-gray-500">
                            Última actualización: {ultimaActualizacion.toLocaleString()}
                        </div>
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

                    {datosConsumo && datosConsumo.resumen_financiero && (
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

                    {datosConsumo && datosConsumo.consumo_por_maquina && (
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
                    )}

                    {datosConsumo && datosConsumo.consumo_por_faena && datosConsumo.ingresos_por_faena && (
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