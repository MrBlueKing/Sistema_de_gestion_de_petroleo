// MainGerente.js - Versión con debug y manejo de errores robusto
import { useState, useEffect } from "react";
import SistemaMantenimiento from "../../molecules/HorasTrabajoChart";
import Header from "../../organisms/Mantencion/Header";
import axios from '../../../lib/axios';

import {
    FiDroplet, FiTruck, FiActivity, FiX, FiLoader,
    FiAlertCircle, FiCheckCircle, FiRefreshCw
} from "react-icons/fi";

const MainGerente = ({ children }) => {
    const [faenaSeleccionada, setFaenaSeleccionada] = useState("todas");
    const [mensajeExito, setMensajeExito] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [datosDisponibles, setDatosDisponibles] = useState(false);
    const [cargaIniciada, setCargaIniciada] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        if (!cargaIniciada) {
            setCargaIniciada(true);
            verificarDatosExistentes();
        }
    }, [cargaIniciada]);

    const verificarDatosExistentes = async () => {
        setCargando(true);
        setError(null);
        setDebugInfo('Iniciando verificación...');
        
        try {
            // Primero verificar si el endpoint existe
            console.log('🔍 Verificando endpoint:', `/api/mantenimiento?faena=${faenaSeleccionada}`);
            setDebugInfo(`Consultando: /api/mantenimiento?faena=${faenaSeleccionada}`);
            
            const response = await axios.get('/api/mantenimiento', {
                params: { faena: faenaSeleccionada }
            });
            
            console.log('📡 Respuesta del servidor:', response);
            setDebugInfo(`Respuesta recibida: ${response.status}`);
            
            if (response.data && response.data.status === 'success') {
                const datos = response.data.data || [];
                console.log('✅ Datos procesados:', datos);
                setDebugInfo(`Datos encontrados: ${datos.length} máquinas`);
                
                if (datos.length > 0) {
                    setDatosDisponibles(true);
                    setError(null);
                } else {
                    setDatosDisponibles(false);
                    setError('No hay máquinas registradas para mostrar');
                }
            } else {
                console.log('⚠️ Respuesta sin datos válidos:', response.data);
                setDebugInfo('Respuesta del servidor no tiene formato esperado');
                setDatosDisponibles(false);
                setError('La respuesta del servidor no tiene el formato esperado');
            }
            
        } catch (err) {
            console.error('❌ Error completo:', err);
            setDebugInfo(`Error: ${err.message}`);
            
            // Análisis detallado del error
            if (err.response) {
                // El servidor respondió con un código de error
                console.log('📡 Respuesta de error:', err.response);
                setError(`Error del servidor (${err.response.status}): ${err.response.data?.message || err.response.statusText}`);
                setDebugInfo(`Error ${err.response.status}: ${err.response.statusText}`);
            } else if (err.request) {
                // La petición se hizo pero no hubo respuesta
                console.log('📡 Sin respuesta del servidor:', err.request);
                setError('No se pudo conectar con el servidor. Verifica que la API esté funcionando.');
                setDebugInfo('Sin respuesta del servidor');
            } else {
                // Error en la configuración de la petición
                console.log('⚙️ Error de configuración:', err.message);
                if (err.message.includes('Unexpected token')) {
                    setError('El servidor está devolviendo HTML en lugar de JSON. Verifica la ruta de la API.');
                    setDebugInfo('Respuesta HTML recibida en lugar de JSON');
                } else {
                    setError(`Error de conexión: ${err.message}`);
                    setDebugInfo(`Error: ${err.message}`);
                }
            }
            
            setDatosDisponibles(false);
        } finally {
            setCargando(false);
        }
    };

    const refrescarDatos = () => {
        setUltimaActualizacion(new Date());
        verificarDatosExistentes();
    };

    const handleMantenimientoRegistrado = (mensaje) => {
        setMensajeExito(mensaje);
        setTimeout(() => setMensajeExito(null), 3000);
        refrescarDatos();
    };

    // Función para probar endpoints
    const probarEndpoints = async () => {
        setCargando(true);
        setDebugInfo('Probando endpoints disponibles...');
        
        const endpointsAPrueba = [
            '/api/mantenimiento',
            '/api/maquinas',
            '/api/categorias-maquinas',
            '/api/faenas'
        ];
        
        for (const endpoint of endpointsAPrueba) {
            try {
                console.log(`🧪 Probando ${endpoint}...`);
                const response = await axios.get(endpoint);
                console.log(`✅ ${endpoint} funciona:`, response.data);
                setDebugInfo(prev => prev + `\n✅ ${endpoint}: OK`);
            } catch (error) {
                console.log(`❌ ${endpoint} falló:`, error.message);
                setDebugInfo(prev => prev + `\n❌ ${endpoint}: ${error.message}`);
            }
        }
        
        setCargando(false);
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-6">
                {/* Panel de Debug (solo en desarrollo) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4 text-xs">
                        <h4 className="font-bold mb-2">Debug Info:</h4>
                        <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                        <button
                            onClick={probarEndpoints}
                            className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                            disabled={cargando}
                        >
                            Probar Endpoints
                        </button>
                    </div>
                )}

                {/* Mensajes de estado */}
                {cargando && (
                    <div className="text-center py-4 bg-white rounded-lg shadow-md mb-4">
                        <FiLoader className="animate-spin mx-auto h-8 w-8 text-blue-500" />
                        <p className="mt-2 text-gray-600">Cargando sistema de mantenimiento...</p>
                        <p className="text-xs text-gray-500 mt-1">{debugInfo}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md shadow-sm">
                        <div className="flex">
                            <div className="py-1"><FiX className="h-6 w-6 text-red-500 mr-4" /></div>
                            <div>
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-xs underline">Detalles técnicos</summary>
                                    <pre className="text-xs mt-1 whitespace-pre-wrap">{debugInfo}</pre>
                                </details>
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

                {/* Panel principal */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Sistema de Mantenimiento</h2>
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

                    {/* Selector de faena */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seleccionar Faena:
                        </label>
                        <select
                            className="w-full sm:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={faenaSeleccionada}
                            onChange={(e) => {
                                setFaenaSeleccionada(e.target.value);
                                setTimeout(() => verificarDatosExistentes(), 100);
                            }}
                        >
                            <option value="todas">Todas las faenas</option>
                            <option value="1">Cabildo</option>
                            <option value="2">Catemu</option>
                            <option value="3">Chincolco</option>
                            <option value="4">Tiltil</option>
                        </select>
                    </div>

                    {/* Contenido principal */}
                    {datosDisponibles ? (
                        <div className="mt-4">
                            <SistemaMantenimiento 
                                faenaSeleccionada={faenaSeleccionada}
                                onMantenimientoRegistrado={handleMantenimientoRegistrado}
                            />
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200 mt-4">
                            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                {cargando ? 'Cargando sistema...' : 'Sistema no disponible'}
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto mb-4">
                                {cargando 
                                    ? 'Verificando el estado del sistema de mantenimiento...' 
                                    : error || 'No se pudo cargar el sistema de mantenimiento.'
                                }
                            </p>
                            
                            {!cargando && (
                                <div className="space-y-2">
                                    <button
                                        onClick={refrescarDatos}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                                    >
                                        Reintentar
                                    </button>
                                    <button
                                        onClick={probarEndpoints}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Diagnosticar Problema
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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