import { useState, useEffect } from "react";
import BarrilesTrabajoChart from "../../molecules/HorasTrabajoChart";
import SimpleKpiCalculator from "../../molecules/KpiSimpleCalculator";
import axios from '../../../lib/axios';
import Header from "../../organisms/Gerente/Header";

import {
    FiDroplet, FiTruck, FiActivity, FiX, FiLoader,
    FiAlertCircle, FiCheckCircle, FiRefreshCw
} from "react-icons/fi";
import { FaCalculator } from "react-icons/fa";

const MainGerente = ({ children }) => {
    // Estados esenciales
    const periodoSeleccionado = "mensual";
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    
    // Estado simplificado para mostrar datos
    const [datosDisponibles, setDatosDisponibles] = useState(false);
    
    // Estado para controlar la carga inicial - evita ciclos infinitos
    const [cargaIniciada, setCargaIniciada] = useState(false);
    
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
            
            // Mostrar gráfico
            setDatosDisponibles(true);
            
            // Ocultar calculadora
            setMostrarCalculadora(false);
        } catch (err) {
            console.error('Error al procesar KPIs calculados:', err);
            setError('Error al procesar los resultados calculados');
        }
    };

    // Función para verificar datos existentes
    useEffect(() => {
        if (!cargaIniciada) {
            setCargaIniciada(true);
            verificarDatosExistentes();
        }
    }, [cargaIniciada]);
    
    // Función para verificar si hay datos existentes
    const verificarDatosExistentes = async () => {
        setCargando(true);
        try {
            // Intentamos obtener datos del endpoint principal
            const response = await axios.get('/api/kpi-totales-acumulados');
            if (response.data?.success && response.data.data?.total_registros > 0) {
                setDatosDisponibles(true);
            } else {
                setDatosDisponibles(false);
            }
        } catch (err) {
            console.error('Error al verificar datos existentes:', err);
            setDatosDisponibles(false);
        } finally {
            setCargando(false);
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
        verificarDatosExistentes();
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

                {/* Panel principal de mantenimiento */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Panel de Control de Mantenimiento</h2>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                                Actualizado: {ultimaActualizacion.toLocaleString()}
                            </span>
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
                    
                    {/* Selector de faena simplificado */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seleccionar Faena:
                        </label>
                        <select
                            className="w-full sm:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

                    {/* Calculadora de KPIs (visible solo cuando se solicita) */}
                    {mostrarCalculadora ? (
                        <SimpleKpiCalculator
                            onCalculate={handleCalculatedKpis}
                            periodo={periodoSeleccionado}
                            faena={faenaSeleccionada}
                            setFaena={setFaenaSeleccionada}
                        />
                    ) : (
                        <>
                            {/* Panel de visualización o entrada de datos */}
                            {datosDisponibles ? (
                                // Si hay datos disponibles, mostrar el gráfico
                                <div className="mt-4">
                                    <BarrilesTrabajoChart faenaSeleccionada={faenaSeleccionada} />
                                </div>
                            ) : (
                                // Si no hay datos, mostrar mensaje y botón para ingresar datos
                                <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200 mt-4">
                                    <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">No hay datos disponibles</h3>
                                    <p className="text-gray-600 max-w-md mx-auto mb-4">
                                        No se encontraron datos para mostrar. Por favor ingrese datos manualmente usando la calculadora de KPIs.
                                    </p>
                                    <button
                                        onClick={() => setMostrarCalculadora(true)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                        <FaCalculator className="mr-2" />
                                        Ingresar Datos
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sección para contenido hijo (si existe) */}
                {children && (
                    <section>{children}</section>
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
                        <span>Panel de Mantenimiento</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;