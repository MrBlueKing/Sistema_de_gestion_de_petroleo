// components/molecules/OperadorVehiculo/SelectorMaquinas.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaTruck, FaSearch, FaTimes, FaChevronDown, FaSync } from 'react-icons/fa';
import { useMaquinasDisponibles } from '../../hook/OperadorVehiculo/useMaquinasDisponibles';

const SelectorMaquinasOperadorVehiculo = ({
    maquinaSeleccionada,
    onSeleccionarMaquina,
    error,
    disabled = false,
    placeholder = "Busca y selecciona una máquina para cargar combustible",
    required = true
}) => {
    const {
        loading,
        error: errorMaquinas,
        maquinasDisponibles,
        maquinasPorCategoria,
        obtenerMaquinaPorId,
        refrescarMaquinas,
        totalMaquinas
    } = useMaquinasDisponibles();

    const [isOpen, setIsOpen] = useState(false);
    const [filtroTexto, setFiltroTexto] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    const searchInputRef = useRef(null);
    const containerRef = useRef(null);

    // 📱 DETECTAR SI ES MOBILE
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // 🚫 PREVENIR SCROLL DE FONDO EN MOBILE
    useEffect(() => {
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen, isMobile]);

    // 🎯 AUTO-FOCUS EN BÚSQUEDA AL ABRIR
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current.focus();
            }, 100);
        }
    }, [isOpen]);

    // 📋 CERRAR AL HACER CLICK FUERA (solo desktop)
    useEffect(() => {
        if (!isMobile) {
            const handleClickOutside = (event) => {
                if (containerRef.current && !containerRef.current.contains(event.target)) {
                    setIsOpen(false);
                    setFiltroTexto('');
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }
        }
    }, [isOpen, isMobile]);

    // ⌨️ MANEJO DE TECLAS
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setFiltroTexto('');
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    // 🔍 FILTRAR MÁQUINAS SEGÚN TEXTO
    const maquinasFiltradas = React.useMemo(() => {
        if (!filtroTexto.trim()) return maquinasDisponibles;

        const texto = filtroTexto.toLowerCase();
        return maquinasDisponibles.filter(maquina => {
            const nombre = maquina?.nombre_maquina?.toLowerCase() || "";
            const patente = maquina?.patente?.toLowerCase() || "";
            const categoria = maquina?.categoria?.nombre?.toLowerCase() || "";
            return nombre.includes(texto) || patente.includes(texto) || categoria.includes(texto);
        });
    }, [maquinasDisponibles, filtroTexto]);

    // 📋 MANEJAR APERTURA DEL SELECTOR
    const handleToggle = () => {
        if (disabled) return;

        if (!isOpen) {
            setFiltroTexto('');
        }
        setIsOpen(!isOpen);
    };

    // 📋 MANEJAR SELECCIÓN DE MÁQUINA
    const handleSeleccionar = (maquina) => {
        onSeleccionarMaquina(maquina);
        setIsOpen(false);
        setFiltroTexto('');
    };

    // 🔄 REFRESCAR LISTA
    const handleRefrescar = async (e) => {
        e.stopPropagation();
        await refrescarMaquinas();
    };

    // 🚫 LIMPIAR SELECCIÓN
    const handleLimpiar = (e) => {
        e.stopPropagation();
        onSeleccionarMaquina(null);
        setIsOpen(false);
        setFiltroTexto('');
    };

    // 🚫 CERRAR MODAL
    const handleClose = () => {
        setIsOpen(false);
        setFiltroTexto('');
    };

    // 🎯 OBTENER INFORMACIÓN DE LA MÁQUINA SELECCIONADA
    const maquinaActual = maquinaSeleccionada ? obtenerMaquinaPorId(maquinaSeleccionada) : null;

    return (
        <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
            {/* BOTÓN PRINCIPAL */}
            <div
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    w-full px-4 py-3 md:py-3 text-left bg-white border rounded-lg shadow-sm
                    flex items-center justify-between transition-all duration-200
                    ${error ? 'border-red-300 ring-2 ring-red-200' : 'border-gray-300 hover:border-gray-400'}
                    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'}
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : ''}
                    min-h-[56px] md:min-h-[48px]
                `}
            >
                <div
                    className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    onClick={disabled ? undefined : handleToggle}
                >
                    <FaTruck className={`${maquinaActual ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0 w-5 h-5`} />
                    <div className="min-w-0 flex-1">
                        {maquinaActual ? (
                            <div>
                                <div className="font-medium text-gray-900 truncate text-sm md:text-base">
                                    {maquinaActual.nombre_maquina}
                                </div>
                                <div className="text-xs md:text-sm text-gray-500 truncate">
                                    {maquinaActual.patente} • {maquinaActual.categoria?.nombre}
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-sm md:text-base">{placeholder}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* BOTÓN LIMPIAR */}
                    {maquinaActual && !disabled && (
                        <button
                            type="button"
                            onClick={handleLimpiar}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-150"
                        >
                            <FaTimes className="w-3 h-3" />
                        </button>
                    )}

                    {/* INDICADOR LOADING */}
                    {loading ? (
                        <FaSync className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                        <FaChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 
                                ${isOpen ? 'rotate-180' : ''}`}
                        />
                    )}
                </div>
            </div>

            {/* DROPDOWN DESKTOP / MODAL MOBILE */}
            {isOpen && !disabled && (
                <>
                    {/* OVERLAY PARA MOBILE - PANTALLA COMPLETA */}
                    {isMobile && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                    )}

                    <div className={
                        isMobile
                            ? `fixed inset-0 bg-white z-50 flex flex-col` // Pantalla completa en mobile
                            : `absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg 
                               shadow-xl max-h-96 transform transition-all duration-200 
                               origin-top scale-100 opacity-100 flex flex-col`
                    }>
                        {/* HEADER */}
                        <div className={`${isMobile ? 'p-4' : 'p-3'} border-b border-gray-200 bg-white ${isMobile ? 'pt-safe-area-inset-top pt-6' : ''} flex-shrink-0`}>
                            {/* TÍTULO Y BOTONES */}
                            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-3'}`}>
                                <div className="flex flex-col">
                                    <span className={`font-semibold text-gray-800 ${isMobile ? 'text-lg' : 'text-sm'}`}>
                                        {isMobile ? 'Seleccionar Máquina' : 'Máquinas disponibles'}
                                    </span>
                                    {isMobile && (
                                        <span className="text-sm text-gray-500">
                                            Elige la máquina que vas a cargar con combustible
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={handleRefrescar}
                                        disabled={loading}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Actualizar lista"
                                    >
                                        <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* ESTADÍSTICAS */}
                            {isMobile && (
                                <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <FaTruck className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-blue-800">
                                                {totalMaquinas} máquinas disponibles
                                            </span>
                                            <div className="text-xs text-blue-600">
                                                Listas para carga externa
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CONTADOR PARA DESKTOP */}
                            {!isMobile && (
                                <div className="flex items-center text-xs text-gray-600 mb-3">
                                    <FaTruck className="w-3 h-3 mr-1" />
                                    {totalMaquinas} disponibles para carga externa
                                </div>
                            )}

                            {/* CAMPO DE BÚSQUEDA */}
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar por nombre, patente o categoría..."
                                    value={filtroTexto}
                                    onChange={(e) => setFiltroTexto(e.target.value)}
                                    className={`w-full pl-10 pr-10 border border-gray-300 rounded-lg 
                                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                             text-sm bg-white placeholder-gray-500 transition-all duration-200
                                             ${isMobile ? 'py-3' : 'py-2'}`}
                                    style={isMobile ? { fontSize: '16px' } : {}} // Previene zoom en iOS
                                />
                                {filtroTexto && (
                                    <button
                                        type="button"
                                        onClick={() => setFiltroTexto('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all"
                                    >
                                        <FaTimes className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* RESULTADOS DE BÚSQUEDA */}
                            {filtroTexto && (
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-gray-600">
                                        {maquinasFiltradas.length > 0
                                            ? `Se encontraron ${maquinasFiltradas.length} resultados`
                                            : 'No se encontraron resultados'
                                        }
                                    </span>
                                    {filtroTexto && maquinasFiltradas.length === 0 && (
                                        <button
                                            onClick={() => setFiltroTexto('')}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Limpiar filtro
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* LISTA DE MÁQUINAS */}
                        <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-safe-area-inset-bottom' : 'max-h-64'}`}>
                            {loading ? (
                                <div className="p-8 text-center">
                                    <FaSync className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-600">Cargando máquinas...</p>
                                    <p className="text-xs text-gray-500 mt-1">Un momento por favor</p>
                                </div>
                            ) : errorMaquinas ? (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaTimes className="w-6 h-6 text-red-600" />
                                    </div>
                                    <p className="text-sm font-medium text-red-600 mb-2">Error al cargar máquinas</p>
                                    <button
                                        onClick={handleRefrescar}
                                        className="px-4 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Intentar nuevamente
                                    </button>
                                </div>
                            ) : maquinasFiltradas.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaTruck className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">
                                        {filtroTexto ? 'No se encontraron máquinas' : 'No hay máquinas disponibles'}
                                    </p>
                                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                        {filtroTexto
                                            ? 'Intenta modificar tu búsqueda o verifica la ortografía'
                                            : 'Actualmente no hay máquinas registradas para carga externa'
                                        }
                                    </p>
                                    {filtroTexto && (
                                        <button
                                            onClick={() => setFiltroTexto('')}
                                            className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Ver todas las máquinas
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {maquinasPorCategoria.map(categoria => {
                                        const maquinasCategoria = categoria.maquinas.filter(maquina =>
                                            maquinasFiltradas.some(f => f.id_maquina === maquina.id_maquina)
                                        );

                                        if (maquinasCategoria.length === 0) return null;

                                        return (
                                            <div key={categoria.id_categoria}>
                                                {/* HEADER DE CATEGORÍA */}
                                                <div className={`px-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 ${isMobile ? 'py-3' : 'py-2'}`}>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`font-bold text-gray-700 uppercase tracking-wider ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                            {categoria.nombre_categoria}
                                                        </span>
                                                        <span className={`px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                            {maquinasCategoria.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* MÁQUINAS DE LA CATEGORÍA */}
                                                {maquinasCategoria.map(maquina => (
                                                    <button
                                                        key={maquina.id_maquina}
                                                        type="button"
                                                        className={`
                                                            w-full px-4 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 
                                                            transition-all duration-150 active:bg-blue-100 
                                                            ${isMobile ? 'py-4 min-h-[64px]' : 'py-3 min-h-[56px]'}
                                                            ${maquinaSeleccionada === maquina.id_maquina ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                                                        `}
                                                        onClick={() => handleSeleccionar(maquina)}
                                                    >
                                                        <div className={`flex items-center ${isMobile ? 'space-x-4' : 'space-x-3'}`}>
                                                            <div className={`rounded-lg flex items-center justify-center flex-shrink-0 
                                                                ${isMobile ? 'w-10 h-10' : 'w-8 h-8'}
                                                                ${maquinaSeleccionada === maquina.id_maquina ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                                <FaTruck className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${maquinaSeleccionada === maquina.id_maquina ? 'text-blue-600' : 'text-gray-500'}`} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className={`font-medium text-gray-900 truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
                                                                    {maquina.nombre_maquina}
                                                                </div>
                                                                <div className={`text-gray-500 truncate ${isMobile ? 'text-sm mt-1' : 'text-xs'}`}>
                                                                    Patente: <span className="font-medium">{maquina.patente}</span>
                                                                </div>
                                                            </div>
                                                            {maquinaSeleccionada === maquina.id_maquina && (
                                                                <div className={`flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center
                                                                    ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`}>
                                                                    <FaTimes className={`text-white rotate-45 ${isMobile ? 'w-3 h-3' : 'w-2 h-2'}`} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* FOOTER PARA MOBILE */}
                        {isMobile && maquinasFiltradas.length > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-white pb-safe-area-inset-bottom flex-shrink-0">
                                <button
                                    onClick={handleClose}
                                    className="w-full py-4 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors text-base"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* MENSAJE DE ERROR */}
            {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span>
                        {error}
                    </p>
                </div>
            )}

            {/* INFORMACIÓN ADICIONAL */}
            {!error && totalMaquinas > 0 && !isOpen && (
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1 p-2 bg-blue-50 rounded border border-blue-200">
                    <span>💡</span>
                    Tienes {totalMaquinas} máquinas disponibles para seleccionar
                </p>
            )}
        </div>
    );
};

export default SelectorMaquinasOperadorVehiculo;