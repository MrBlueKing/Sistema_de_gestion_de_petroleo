import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FaTruck,
    FaWrench,
    FaIndustry,
    FaUsers,
    FaExclamationCircle,
    FaSpinner,
    FaCheckCircle,
    FaTimesCircle,
    FaSearch,
    FaTimes,
    FaEye,
    FaEyeSlash,
    FaExchangeAlt,
    FaEdit,
    FaClock
} from 'react-icons/fa';
import permisosMaquinasService from '../../../context/PermisosMaquinas';

// ✅ COMPONENTE OPTIMIZADO - MOVIDO FUERA Y MEMOIZADO
const ZonaMaquinas = React.memo(({
    id,
    titulo,
    descripcion,
    maquinas,
    color = "blue",
    icon: IconComponent = FaIndustry,
    busquedaLocal,
    onBusquedaChange,
    busquedaGlobal,
    faenasColapsadas,
    onToggleColapse,
    isMobile,
    onTransferirMaquina,
    filtrarMaquinas,
    getIconoMaquina
}) => {
    console.log(`🔍 ZonaMaquinas ${id} re-renderizando. Maquinas count: ${maquinas.length}`);

    let maquinasFiltradas = filtrarMaquinas(maquinas, busquedaLocal);

    // Filtrar también por búsqueda global si existe
    if (busquedaGlobal) {
        maquinasFiltradas = filtrarMaquinas(maquinasFiltradas, busquedaGlobal);
    }

    const estaColapsada = faenasColapsadas[id];

    // ✅ COMPONENTE MaquinaCard MEMOIZADO
    const MaquinaCard = React.memo(({ maquina }) => (
        <div className="p-3 mb-2 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
                {getIconoMaquina(maquina.tipo_maquina)}

                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                        {maquina.nombre_maquina}
                    </p>
                    <p className="text-sm text-gray-500">
                        {maquina.patente} • {maquina.tipo_maquina}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${maquina.estado === 'Activa'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                    `}>
                        {maquina.estado}
                    </span>

                    <button
                        onClick={() => onTransferirMaquina(maquina)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Transferir máquina"
                    >
                        <FaExchangeAlt className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    ));

    return (
        <div className="bg-gray-50 rounded-xl p-4 transition-all duration-200">
            {/* Header de la zona */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <IconComponent className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{titulo}</h3>
                    <p className="text-sm text-gray-600">{descripcion}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium bg-${color}-100 text-${color}-800 rounded-full`}>
                        {maquinasFiltradas.length}/{maquinas.length}
                    </span>
                    {isMobile && (
                        <button
                            onClick={() => onToggleColapse(id)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                        >
                            {estaColapsada ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Buscador para cada zona */}
            {maquinas.length > 5 && (!isMobile || !estaColapsada) && (
                <div className="mb-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={busquedaLocal}
                            onChange={(e) => onBusquedaChange(id, e.target.value)}
                            placeholder="Buscar máquina..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="off"
                            spellCheck="false"
                        />
                        {busquedaLocal && (
                            <button
                                type="button"
                                onClick={() => onBusquedaChange(id, '')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Lista de máquinas */}
            {(!isMobile || !estaColapsada) && (
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 rounded-lg bg-white border">
                    {maquinasFiltradas.length === 0 ? (
                        <div className="text-center py-8">
                            <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin máquinas</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {busquedaLocal || busquedaGlobal ? 'No se encontraron máquinas con ese filtro' : 'No hay máquinas en esta zona'}
                            </p>
                        </div>
                    ) : (
                        maquinasFiltradas.map(maquina => (
                            <MaquinaCard key={maquina.id_maquina} maquina={maquina} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

const GestionarMaquinasPermisos = () => {
    const [faenas, setFaenas] = useState([]);
    const [maquinasSinPermisos, setMaquinasSinPermisos] = useState([]);
    const [todasLasMaquinas, setTodasLasMaquinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Estados para modal de transferencia
    const [modalAbierto, setModalAbierto] = useState(false);
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
    const [faenaDestino, setFaenaDestino] = useState('');
    const [transfiriendo, setTransfiriendo] = useState(false);

    // Estados para búsqueda
    const [busquedaFaenas, setBusquedaFaenas] = useState({});
    const [busquedaGlobal, setBusquedaGlobal] = useState('');

    // Estados para colapsar faenas
    const [faenasColapsadas, setFaenasColapsadas] = useState({});

    // Detectar mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        cargarDatos();
    }, []);

    // ✅ FUNCIÓN PARA DEBUG
    useEffect(() => {
        console.log('🔄 busquedaFaenas cambió:', busquedaFaenas);
    }, [busquedaFaenas]);

    const cargarDatos = async () => {
        console.log('🔄 cargarDatos ejecutándose - esto causará re-render');
        try {
            setLoading(true);
            setError(null);

            const [maquinasResponse, faenasResponse] = await Promise.all([
                permisosMaquinasService.obtenerMaquinasConPermisos(),
                permisosMaquinasService.obtenerFaenas()
            ]);

            if (maquinasResponse.success && faenasResponse.success) {
                setTodasLasMaquinas(maquinasResponse.data);
                organizarDatos(maquinasResponse.data, faenasResponse.data);
            } else {
                throw new Error('Error en la respuesta del servidor');
            }

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos del servidor');
        } finally {
            setLoading(false);
        }
    };

    const organizarDatos = (maquinasConPermisos, todasLasFaenas) => {
        console.log('🔄 organizarDatos ejecutándose - esto causará re-render');
        const faenasConMaquinas = todasLasFaenas.map(faena => {
            const maquinasDeFaena = maquinasConPermisos.filter(maquina =>
                maquina.faenas_con_permiso.some(f => f.id_faena === faena.id_faena)
            );

            return {
                ...faena,
                maquinas: maquinasDeFaena,
                maquinas_count: maquinasDeFaena.length
            };
        });

        const sinPermisos = maquinasConPermisos.filter(maquina =>
            maquina.faenas_con_permiso.length === 0
        );

        setFaenas(faenasConMaquinas);
        setMaquinasSinPermisos(sinPermisos);
    };

    const refrescarDatos = async () => {
        console.log('🔄 refrescarDatos ejecutándose');
        setRefreshing(true);
        try {
            await cargarDatos();
            setSuccess('Datos actualizados correctamente');
            setTimeout(() => setSuccess(null), 2000);
        } catch (error) {
            setError('Error al refrescar los datos');
            setTimeout(() => setError(null), 3000);
        } finally {
            setRefreshing(false);
        }
    };

    const abrirModalTransferencia = useCallback((maquina) => {
        setMaquinaSeleccionada(maquina);
        setFaenaDestino('');
        setModalAbierto(true);
    }, []);

    const cerrarModal = useCallback(() => {
        setModalAbierto(false);
        setMaquinaSeleccionada(null);
        setFaenaDestino('');
    }, []);

    const confirmarTransferencia = async () => {
        console.log('🔄 confirmarTransferencia ejecutándose');
        if (!maquinaSeleccionada || faenaDestino === '') return;

        setTransfiriendo(true);
        setError(null);

        try {
            // Determinar faena origen
            let faenaOrigen = 'sin-permisos';
            if (maquinaSeleccionada.faenas_con_permiso.length > 0) {
                faenaOrigen = maquinaSeleccionada.faenas_con_permiso[0].id_faena.toString();
            }

            // Llamar al servicio
            await permisosMaquinasService.transferirMaquina(
                maquinaSeleccionada.id_maquina,
                faenaOrigen,
                faenaDestino
            );

            setSuccess(`✅ ${maquinaSeleccionada.nombre_maquina} transferida exitosamente`);
            cerrarModal();

            // Recargar datos para reflejar cambios
            await cargarDatos();

            setTimeout(() => setSuccess(null), 3000);

        } catch (error) {
            console.error('❌ Error en transferencia:', error);
            setError(`Error al transferir ${maquinaSeleccionada.nombre_maquina}: ${error.message}`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setTransfiriendo(false);
        }
    };

    // ✅ FUNCIONES OPTIMIZADAS CON useCallback
    const handleBusquedaChange = useCallback((id, value) => {
        console.log(`⌨️  Escribiendo en ${id}:`, value);
        setBusquedaFaenas(prev => ({
            ...prev,
            [id]: value
        }));
    }, []);

    const handleToggleColapse = useCallback((idFaena) => {
        setFaenasColapsadas(prev => ({
            ...prev,
            [idFaena]: !prev[idFaena]
        }));
    }, []);

    // ✅ FUNCIONES UTILITARIAS MEMOIZADAS
    const getIconoMaquina = useCallback((tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'camión':
                return <FaTruck className="w-4 h-4 text-blue-600" />;
            case 'excavadora':
                return <FaIndustry className="w-4 h-4 text-green-600" />;
            case 'bulldozer':
                return <FaIndustry className="w-4 h-4 text-yellow-600" />;
            default:
                return <FaWrench className="w-4 h-4 text-gray-600" />;
        }
    }, []);

    const filtrarMaquinas = useCallback((maquinas, busqueda) => {
        if (!busqueda) return maquinas;
        return maquinas.filter(maquina =>
            maquina.nombre_maquina.toLowerCase().includes(busqueda.toLowerCase()) ||
            maquina.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
            maquina.tipo_maquina.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, []);

    // Modal de transferencia (componente interno optimizado)
    const ModalTransferencia = useCallback(() => {
        if (!modalAbierto) return null;

        const opcionesFaenas = faenas.map(faena => ({
            value: faena.id_faena.toString(),
            label: faena.ubicacion
        }));

        // Agregar opción "Sin Permisos"
        opcionesFaenas.push({
            value: 'sin-permisos',
            label: 'Sin Permisos'
        });

        return (
            <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white/80 backdrop-blur-md rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-white/30">



                    <h3 className="text-lg font-semibold mb-4">
                        Transferir {maquinaSeleccionada?.nombre_maquina}
                    </h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Faena de destino
                        </label>
                        <select
                            value={faenaDestino}
                            onChange={(e) => setFaenaDestino(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccionar faena...</option>
                            {opcionesFaenas.map(opcion => (
                                <option key={opcion.value} value={opcion.value}>
                                    {opcion.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={cerrarModal}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={transfiriendo}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmarTransferencia}
                            disabled={!faenaDestino || transfiriendo}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {transfiriendo && <FaSpinner className="animate-spin" />}
                            {transfiriendo ? 'Transfiriendo...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [modalAbierto, maquinaSeleccionada, faenaDestino, transfiriendo, faenas, cerrarModal, confirmarTransferencia]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando máquinas y permisos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestionar Permisos de Máquinas</h1>
                    <p className="text-gray-600 mt-1">
                        Total: {todasLasMaquinas.length} máquinas distribuidas en {faenas.length} faenas
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={refrescarDatos}
                        disabled={refreshing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {refreshing ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Buscador global */}
            <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={busquedaGlobal}
                    onChange={(e) => setBusquedaGlobal(e.target.value)}
                    placeholder="Buscar en todas las máquinas..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {busquedaGlobal && (
                    <button
                        onClick={() => setBusquedaGlobal('')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Mensajes de estado */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" />
                        <span className="text-green-800">{success}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FaTimesCircle className="text-red-600" />
                        <span className="text-red-800">{error}</span>
                    </div>
                </div>
            )}

            {/* Grid de zonas */}
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
                {/* Faenas */}
                {faenas.map(faena => (
                    <ZonaMaquinas
                        key={faena.id_faena}
                        id={faena.id_faena.toString()}
                        titulo={faena.ubicacion}
                        descripcion={faena.detalle}
                        maquinas={faena.maquinas}
                        color="blue"
                        icon={FaIndustry}
                        busquedaLocal={busquedaFaenas[faena.id_faena.toString()] || ''}
                        onBusquedaChange={handleBusquedaChange}
                        busquedaGlobal={busquedaGlobal}
                        faenasColapsadas={faenasColapsadas}
                        onToggleColapse={handleToggleColapse}
                        isMobile={isMobile}
                        onTransferirMaquina={abrirModalTransferencia}
                        filtrarMaquinas={filtrarMaquinas}
                        getIconoMaquina={getIconoMaquina}
                    />
                ))}

                {/* Máquinas sin permisos */}
                <ZonaMaquinas
                    key="sin-permisos"
                    id="sin-permisos"
                    titulo="Sin Permisos"
                    descripcion="Máquinas no asignadas"
                    maquinas={maquinasSinPermisos}
                    color="gray"
                    icon={FaExclamationCircle}
                    busquedaLocal={busquedaFaenas['sin-permisos'] || ''}
                    onBusquedaChange={handleBusquedaChange}
                    busquedaGlobal={busquedaGlobal}
                    faenasColapsadas={faenasColapsadas}
                    onToggleColapse={handleToggleColapse}
                    isMobile={isMobile}
                    onTransferirMaquina={abrirModalTransferencia}
                    filtrarMaquinas={filtrarMaquinas}
                    getIconoMaquina={getIconoMaquina}
                />
            </div>

            {/* Modal de transferencia */}
            <ModalTransferencia />

            {/* Instrucciones */}
            <div className="mt-8 p-4 md:p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <FaExclamationCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Cómo usar:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Haz clic en el botón <FaExchangeAlt className="inline w-3 h-3 mx-1" /> junto a cualquier máquina</li>
                            <li>• Selecciona la faena de destino en el modal que aparece</li>
                            <li>• Confirma la transferencia - los cambios se guardan inmediatamente</li>
                            <li>• Usa los buscadores individuales o el global para encontrar máquinas</li>
                            <li>• En mobile: usa el ícono de ojo para colapsar/expandir faenas</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestionarMaquinasPermisos;