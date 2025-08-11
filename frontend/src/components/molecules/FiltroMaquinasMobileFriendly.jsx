import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaTruck, FaTimes, FaChevronDown, FaSearch } from 'react-icons/fa';

const FiltroMaquinasMobileFriendly = ({
    equipoFilter,
    handleEquipoFilterChange,
    maquinasDisponibles = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // 🔍 Filtrar máquinas por búsqueda
    const maquinasFiltradas = useMemo(() => {
        if (!searchTerm.trim()) return maquinasDisponibles;
        
        return maquinasDisponibles.filter(maquina =>
            maquina.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [maquinasDisponibles, searchTerm]);

    // 🔒 Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 🎨 Nombre corto para móvil
    const getMaquinaDisplay = (maquina) => {
        if (maquina.length > 25) {
            return maquina.substring(0, 22) + '...';
        }
        return maquina;
    };

    const handleSelect = (maquina) => {
        handleEquipoFilterChange(maquina);
        setIsOpen(false);
        setSearchTerm(''); // Limpiar búsqueda al seleccionar
    };

    const handleClear = () => {
        handleEquipoFilterChange('');
        setIsOpen(false);
        setSearchTerm(''); // Limpiar búsqueda al limpiar
    };

    return (
        <div className="mb-4 bg-gray-50 rounded-lg p-4" ref={dropdownRef}>
            {/* Header */}
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                <FaTruck className="text-blue-600" />
                Filtrar por Nombre de Equipo
                <span className="text-xs text-gray-500 ml-auto">
                    ({maquinasDisponibles.length} disponibles)
                </span>
            </label>

            {/* Botón principal */}
            <div className="relative z-10">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 rounded-lg shadow-sm text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                >   
                    <span className={`block truncate text-sm sm:text-base pr-8 ${
                        equipoFilter ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                        {equipoFilter ? getMaquinaDisplay(equipoFilter) : 'Seleccionar máquina...'}
                    </span>

                    <FaChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`} />
                </button>

                {/* Botón limpiar (separado) */}
                {equipoFilter && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 z-10"
                        title="Limpiar selección"
                    >
                        <FaTimes className="w-3 h-3" />
                    </button>
                )}

                {/* Dropdown con buscador */}
                {isOpen && (
                    <div className="relarive z-[50] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden">
                        
                        {/* Barra de búsqueda */}
                        <div className="p-3 border-b border-gray-200 bg-white z-[10000]">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar máquina..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lista de opciones con scroll simple */}
                        <div className="overflow-y-auto max-h-60">
                            {/* Opción "Todas las máquinas" */}
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                                    !equipoFilter ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span>🌐</span>
                                    <span>Todas las máquinas</span>
                                </span>
                            </button>

                            <div className="border-t border-gray-100"></div>

                            {/* Máquinas filtradas */}
                            {maquinasFiltradas.length === 0 ? (
                                <div className="px-4 py-6 text-center text-gray-500">
                                    <div className="text-2xl mb-2">🔍</div>
                                    <p className="text-sm">No se encontraron máquinas</p>
                                    <p className="text-xs mt-1 text-gray-400">Intenta con otro término</p>
                                </div>
                            ) : (
                                maquinasFiltradas.map((maquina, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(maquina)}
                                        className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                                            equipoFilter === maquina ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-900'
                                        }`}
                                        title={maquina}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>🚛</span>
                                            <span className="truncate">{maquina}</span>
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer con contador */}
                        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-600 flex justify-between items-center">
                            <span>
                                {searchTerm 
                                    ? `${maquinasFiltradas.length} encontradas de ${maquinasDisponibles.length}`
                                    : `${maquinasDisponibles.length} máquinas disponibles`
                                }
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-100"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Máquina seleccionada (solo móvil) */}
            {equipoFilter && (
                <div className="mt-3 p-3 bg-orange-100 rounded-lg border border-orange-200 block sm:hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-orange-600 text-sm font-medium">Seleccionada:</span>
                            <span className="text-orange-800 font-medium text-sm truncate" title={equipoFilter}>
                                {equipoFilter}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="ml-2 p-1 rounded-full bg-orange-200 text-orange-600 hover:bg-orange-300 flex-shrink-0"
                            title="Quitar filtro"
                        >
                            <FaTimes className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiltroMaquinasMobileFriendly;