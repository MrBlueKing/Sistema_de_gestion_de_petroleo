import React, { useState, useEffect } from 'react';
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

    const cargarDatos = async () => {
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

    const abrirModalTransferencia = (maquina) => {
        setMaquinaSeleccionada(maquina);
        setFaenaDestino('');
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setMaquinaSeleccionada(null);
        setFaenaDestino('');
    };

    const confirmarTransferencia = async () => {
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

    const getIconoMaquina = (tipo) => {
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
    };

    const filtrarMaquinas = (maquinas, busqueda) => {
        if (!busqueda) return maquinas;
        return maquinas.filter(maquina =>
            maquina.nombre_maquina.toLowerCase().includes(busqueda.toLowerCase()) ||
            maquina.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
            maquina.tipo_maquina.toLowerCase().includes(busqueda.toLowerCase())
        );
    };

    const toggleFaenaColapsada = (idFaena) => {
        setFaenasColapsadas(prev => ({
            ...prev,
            [idFaena]: !prev[idFaena]
        }));
    };

    // Componente MaquinaCard simple con botón de transferir
    const MaquinaCard = ({ maquina }) => (
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
                        onClick={() => abrirModalTransferencia(maquina)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Transferir máquina"
                    >
                        <FaExchangeAlt className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );

    // Componente Zona de máquinas
    const ZonaMaquinas = ({ id, titulo, descripcion, maquinas, color = "blue", icon: IconComponent = FaIndustry }) => {
        const busqueda = busquedaFaenas[id] || '';
        console.log("Datos de BUSQUEDA:", busqueda, "-", busquedaFaenas[id], "-", id);
        let maquinasFiltradas = filtrarMaquinas(maquinas, busqueda);

        // Filtrar también por búsqueda global si existe
        if (busquedaGlobal) {
            maquinasFiltradas = filtrarMaquinas(maquinasFiltradas, busquedaGlobal);
        }

        const estaColapsada = faenasColapsadas[id];

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
                                onClick={() => toggleFaenaColapsada(id)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                            >
                                {estaColapsada ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Buscador para cada zona */}
                {/* Aquí el tamaño de la variable maquinas si es mayor a 5 y la variable isMobile o estaColapsada es false entonces muestra el contenido */}
                {maquinas.length > 5 && (!isMobile || !estaColapsada) && (
                    // div que tiene un margin boton de 3px
                    <div className="mb-3">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                key={`search-${id}`} // Key única para evitar re-creación
                                type="text"
                                value={busqueda}
                                onChange={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setBusquedaFaenas(prev => ({
                                        ...prev,
                                        [id]: e.target.value
                                    }));
                                }}
                                onFocus={(e) => e.target.select()} // Selecciona todo al hacer focus
                                placeholder="Buscar máquina..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="off"
                                spellCheck="false"
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setBusquedaFaenas(prev => ({ ...prev, [id]: '' }));
                                    }}
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
                            <div className="flex items-center justify-center h-32 text-gray-400">
                                <div className="text-center">
                                    <IconComponent className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium mb-1">
                                        {busqueda || busquedaGlobal ? 'No se encontraron máquinas' : 'Sin máquinas asignadas'}
                                    </p>
                                    <p className="text-xs">
                                        {busqueda || busquedaGlobal ? 'Intenta con otro término' : 'Usa el botón de transferir para asignar máquinas'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {maquinasFiltradas.map((maquina) => (
                                    <MaquinaCard
                                        key={maquina.id_maquina}
                                        maquina={maquina}
                                    />
                                ))}

                                {(busqueda || busquedaGlobal) && maquinasFiltradas.length !== maquinas.length && (
                                    <div className="pt-2 border-t border-gray-200 text-center">
                                        <p className="text-xs text-gray-500">
                                            Mostrando {maquinasFiltradas.length} de {maquinas.length} máquinas
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Modal de transferencia
    const ModalTransferencia = () => {
        if (!modalAbierto || !maquinaSeleccionada) return null;

        const faenaActual = maquinaSeleccionada.faenas_con_permiso.length > 0
            ? maquinaSeleccionada.faenas_con_permiso[0].ubicacion
            : 'Sin permisos';

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Transferir Máquina
                    </h3>

                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {getIconoMaquina(maquinaSeleccionada.tipo_maquina)}
                            <div>
                                <p className="font-medium text-gray-900">
                                    {maquinaSeleccionada.nombre_maquina}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {maquinaSeleccionada.patente} • {maquinaSeleccionada.tipo_maquina}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Actualmente en: <span className="font-medium">{faenaActual}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transferir a:
                        </label>
                        <select
                            value={faenaDestino}
                            onChange={(e) => setFaenaDestino(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccionar destino...</option>
                            <option value="sin-permisos">🚫 Sin permisos</option>
                            {faenas.map(faena => (
                                <option key={faena.id_faena} value={faena.id_faena.toString()}>
                                    🏭 {faena.ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={cerrarModal}
                            disabled={transfiriendo}
                            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmarTransferencia}
                            disabled={!faenaDestino || transfiriendo}
                            className={`
                flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2
                ${!faenaDestino || transfiriendo
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }
              `}
                        >
                            {transfiriendo ? (
                                <>
                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                    Transfiriendo...
                                </>
                            ) : (
                                <>
                                    <FaExchangeAlt className="w-4 h-4" />
                                    Transferir
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const totalMaquinas = todasLasMaquinas.length;
    const conPermisos = todasLasMaquinas.filter(m => m.faenas_con_permiso.length > 0).length;

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mb-4 mx-auto" />
                        <p className="text-gray-600 font-medium">Cargando máquinas y faenas...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            Gestión de Máquinas
                        </h1>
                        <p className="text-gray-600 text-sm md:text-base">
                            Usa el botón <FaExchangeAlt className="inline w-3 h-3 mx-1" /> junto a cada máquina para transferirla
                        </p>
                    </div>

                    <button
                        onClick={refrescarDatos}
                        disabled={refreshing || loading}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${refreshing || loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }
            `}
                    >
                        <FaSpinner className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Actualizando...' : 'Refrescar'}
                    </button>
                </div>
            </div>

            {/* Alertas */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <FaTimesCircle className="text-red-600 w-5 h-5 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <FaCheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
                    <p className="text-green-700 text-sm">{success}</p>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Faenas</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{faenas.length}</p>
                        </div>
                        <FaIndustry className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Con Permisos</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{conPermisos}</p>
                        </div>
                        <FaTruck className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Sin Permisos</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{maquinasSinPermisos.length}</p>
                        </div>
                        <FaExclamationCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Total</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalMaquinas}</p>
                        </div>
                        <FaUsers className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Buscador global */}
            {totalMaquinas > 10 && (
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            key="search-global" // Key única
                            type="text"
                            value={busquedaGlobal}
                            onChange={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setBusquedaGlobal(e.target.value);
                            }}
                            onFocus={(e) => e.target.select()}
                            placeholder="Buscar máquina en todas las faenas..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="off"
                            spellCheck="false"
                        />
                        {busquedaGlobal && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setBusquedaGlobal('');
                                }}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Grid de faenas */}
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
                    />
                ))}

                {/* Máquinas sin permisos */}
                <ZonaMaquinas
                    id="sin-permisos"
                    titulo="Sin Permisos"
                    descripcion="Máquinas no asignadas"
                    maquinas={maquinasSinPermisos}
                    color="gray"
                    icon={FaExclamationCircle}
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