import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    FaTruck, 
    FaTimes, 
    FaChevronDown, 
    FaSearch, 
    FaSpinner,
    FaCheck,
    FaCheckSquare,
    FaSquare
} from 'react-icons/fa';

const FiltroMaquinasMobileFriendly = ({
    equipoFilter = [], // ✅ AHORA ES ARRAY
    handleEquipoFilterChange,
    maquinasDisponibles = [],
    loading = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedMaquinas, setSelectedMaquinas] = useState(equipoFilter || []);
    const [tempSelectedMaquinas, setTempSelectedMaquinas] = useState(equipoFilter || []);
    
    // 🆕 Flag para controlar la sincronización automática
    const [isUpdatingFromParent, setIsUpdatingFromParent] = useState(false);
    
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // 🔄 Sincronizar con prop externa - SOLO si viene de afuera
    useEffect(() => {
        const newSelected = Array.isArray(equipoFilter) ? equipoFilter : (equipoFilter ? [equipoFilter] : []);
        
        // 🛡️ Solo sincronizar si la prop realmente cambió desde el exterior
        // y no como resultado de nuestros propios cambios
        const currentTempString = JSON.stringify([...tempSelectedMaquinas].sort());
        const newSelectedString = JSON.stringify([...newSelected].sort());
        
        if (currentTempString !== newSelectedString && !isUpdatingFromParent) {
            setSelectedMaquinas(newSelected);
            setTempSelectedMaquinas(newSelected);
        }
    }, [equipoFilter]); // ❌ NO incluir tempSelectedMaquinas en dependencias

    // 🚀 DEBOUNCE MEJORADO: Notificar cambios sin afectar estado local
    const debouncedNotifyChange = useCallback((newSelection) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        // 🛡️ Marcar que estamos actualizando desde el componente
        setIsUpdatingFromParent(true);
        
        debounceRef.current = setTimeout(() => {
            handleEquipoFilterChange(newSelection);
            // 🕒 Dar tiempo para que la prop se actualice antes de permitir sincronización
            setTimeout(() => {
                setIsUpdatingFromParent(false);
            }, 100);
        }, 300); // 🚀 Reducido a 300ms para mejor UX
    }, [handleEquipoFilterChange]);

    // 🧹 Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // 🔍 Filtrar máquinas en tiempo real
    const maquinasFiltradas = useMemo(() => {
        if (!searchTerm.trim()) return maquinasDisponibles;
        
        const term = searchTerm.toLowerCase();
        return maquinasDisponibles.filter(maquina => {
            const maquinaLower = maquina.toLowerCase();
            return maquinaLower.includes(term) || 
                   maquinaLower.split(' ').some(word => word.startsWith(term));
        });
    }, [maquinasDisponibles, searchTerm]);

    // 📊 Estadísticas de selección
    const stats = useMemo(() => ({
        total: maquinasDisponibles.length,
        filtered: maquinasFiltradas.length,
        selected: tempSelectedMaquinas.length,
        allSelected: tempSelectedMaquinas.length === maquinasDisponibles.length && maquinasDisponibles.length > 0,
        someSelected: tempSelectedMaquinas.length > 0 && tempSelectedMaquinas.length < maquinasDisponibles.length
    }), [maquinasDisponibles.length, maquinasFiltradas.length, tempSelectedMaquinas.length]);

    // 🔒 Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                handleClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // 🎯 Funciones de manejo
    const handleOpen = () => {
        setIsOpen(true);
        setIsFocused(true);
        setSearchTerm('');
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsFocused(false);
        setSearchTerm('');
    };

    // ✅ FUNCIÓN CLAVE MEJORADA: Toggle de máquina (agregar/quitar)
    const handleToggleMaquina = (maquina) => {
        const newSelected = tempSelectedMaquinas.includes(maquina)
            ? tempSelectedMaquinas.filter(m => m !== maquina)  // ❌ Quitar
            : [...tempSelectedMaquinas, maquina];              // ➕ Agregar
        
        // 🎯 Actualizar estado local inmediatamente (sin esperar debounce)
        setTempSelectedMaquinas(newSelected);
        setSelectedMaquinas(newSelected); // 🆕 También actualizar selectedMaquinas
        
        // 🚀 Notificar cambio con debounce (no afecta estado local)
        debouncedNotifyChange(newSelected);
    };

    // 🔄 Seleccionar todas las máquinas - SIN DEBOUNCE
    const handleSelectAll = () => {
        const newSelected = stats.allSelected ? [] : [...maquinasDisponibles];
        
        setTempSelectedMaquinas(newSelected);
        setSelectedMaquinas(newSelected);
        
        // 🆕 Aplicar inmediatamente para acciones masivas
        setIsUpdatingFromParent(true);
        handleEquipoFilterChange(newSelected);
        setTimeout(() => {
            setIsUpdatingFromParent(false);
        }, 100);
    };

    // 🧹 Limpiar todas las selecciones - SIN DEBOUNCE
    const handleClearAll = () => {
        setTempSelectedMaquinas([]);
        setSelectedMaquinas([]);
        
        // 🆕 Aplicar inmediatamente para acciones masivas
        setIsUpdatingFromParent(true);
        handleEquipoFilterChange([]);
        setTimeout(() => {
            setIsUpdatingFromParent(false);
        }, 100);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
        if (!isOpen) {
            handleOpen();
        }
    };

    // 🎨 Texto del input
    const getDisplayText = () => {
        if (isFocused || isOpen) {
            return searchTerm;
        }
        return '';
    };

    const getPlaceholder = () => {
        if (isFocused || isOpen) {
            return 'Buscar máquinas...';
        }
        
        if (tempSelectedMaquinas.length === 0) {
            return 'Todas las máquinas';
        } else if (tempSelectedMaquinas.length === 1) {
            return tempSelectedMaquinas[0];
        } else {
            return `${tempSelectedMaquinas.length} máquinas seleccionadas`;
        }
    };

    // 🎨 Componente Checkbox personalizado - ✅ SOLO VISUAL
    const CustomCheckbox = ({ checked, indeterminate = false, className = "" }) => (
        <div
            className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                ${checked 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : indeterminate
                        ? 'bg-blue-100 border-blue-300 text-blue-600'
                        : 'bg-white border-gray-300'
                }
                ${className}
            `}
        >
            {checked ? (
                <FaCheck className="text-xs" />
            ) : indeterminate ? (
                <div className="w-2 h-0.5 bg-blue-600 rounded"></div>
            ) : null}
        </div>
    );

    // 🔄 Loading state
    if (loading) {
        return (
            <div className={`mb-4 bg-gray-50 rounded-lg p-4 ${className}`}>
                <div className="flex items-center gap-3">
                    <FaSpinner className="text-gray-400 animate-spin" />
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`mb-4 relative ${className}`} ref={containerRef}>
            {/* 🏷️ Label con estadísticas */}
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <FaTruck className="text-blue-600" />
                Filtrar Máquinas
                <span className="text-xs text-gray-500 ml-auto">
                    {tempSelectedMaquinas.length > 0 
                        ? `${tempSelectedMaquinas.length}/${maquinasDisponibles.length} seleccionadas`
                        : `${maquinasDisponibles.length} disponibles`
                    }
                </span>
            </label>

            {/* 🎯 Input Principal */}
            <div className="relative">
                <div className={`
                    relative overflow-hidden rounded-lg border-2 bg-white transition-all duration-200
                    ${isOpen 
                        ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' 
                        : tempSelectedMaquinas.length > 0 
                            ? 'border-green-300 bg-green-50/50' 
                            : 'border-gray-300 hover:border-blue-300'
                    }
                `}>
                    {/* Icono izquierdo */}
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        {isOpen ? (
                            <FaSearch className="text-blue-500 text-sm" />
                        ) : (
                            <FaTruck className={`text-sm ${tempSelectedMaquinas.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                        )}
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={getDisplayText()}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        placeholder={getPlaceholder()}
                        className={`
                            w-full pl-10 pr-12 py-3 bg-transparent border-none outline-none
                            text-sm sm:text-base transition-all duration-200
                            ${tempSelectedMaquinas.length > 0 && !isOpen ? 'text-green-800 font-medium' : 'text-gray-900'}
                            ${(isFocused || isOpen) ? 'placeholder-gray-500' : 'placeholder-gray-600'}
                        `}
                        autoComplete="off"
                    />

                    {/* Iconos derecha */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        {tempSelectedMaquinas.length > 0 && !isOpen && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearAll();
                                }}
                                className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Limpiar todas las selecciones"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                        
                        <FaChevronDown className={`
                            text-gray-400 transition-all duration-200 text-sm
                            ${isOpen ? 'rotate-180 text-blue-500' : ''}
                        `} />
                    </div>

                    {/* Efecto de foco */}
                    {isOpen && (
                        <div className="absolute inset-0 bg-blue-50/30 pointer-events-none" />
                    )}
                </div>
            </div>

            {/* 🎯 Dropdown Expandible - NO SE CIERRA AL SELECCIONAR */}
            <div className={`
                overflow-hidden bg-white rounded-lg shadow-xl border border-gray-200 z-50
                transform transition-all duration-200 origin-top
                ${isOpen 
                    ? 'opacity-100 scale-y-100 max-h-96 mt-1' 
                    : 'opacity-0 scale-y-95 max-h-0 border-0 mt-0'
                }
            `}>
                <div className="max-h-72 overflow-y-auto py-2">
                    {/* 🎮 Header con controles */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors"
                        >
                            <CustomCheckbox
                                checked={stats.allSelected}
                                indeterminate={stats.someSelected}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {stats.allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                            </span>
                        </button>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{tempSelectedMaquinas.length} seleccionadas</span>
                        </div>
                    </div>

                    {/* 📋 Lista de máquinas */}
                    {maquinasFiltradas.length === 0 && searchTerm ? (
                        <div className="px-4 py-6 text-center text-gray-500">
                            <div className="text-2xl mb-2">🔍</div>
                            <p className="text-sm">No se encontraron máquinas</p>
                            <p className="text-xs text-gray-400 mt-1">
                                con "{searchTerm}"
                            </p>
                        </div>
                    ) : (
                        maquinasFiltradas.map((maquina, index) => {
                            const isSelected = tempSelectedMaquinas.includes(maquina);
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleToggleMaquina(maquina)}
                                    className={`
                                        w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                                        ${isSelected 
                                            ? 'bg-blue-50 text-blue-700' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                    title={maquina}
                                >
                                    <CustomCheckbox
                                        checked={isSelected}
                                    />
                                    
                                    <div className={`
                                        p-1.5 rounded-full
                                        ${isSelected ? 'bg-blue-200' : 'bg-gray-100'}
                                    `}>
                                        🚛
                                    </div>
                                    
                                    <span className="flex-1 truncate font-medium">{maquina}</span>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* 🔽 Footer con información */}
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                        <span>
                            {searchTerm 
                                ? `${maquinasFiltradas.length} encontradas` 
                                : `${maquinasDisponibles.length} máquinas total`
                            }
                        </span>
                        <div className="flex items-center gap-3">
                            {tempSelectedMaquinas.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-red-600 hover:text-red-700 font-medium"
                                >
                                    Limpiar todo
                                </button>
                            )}
                            <span className="text-gray-500">ESC para cerrar</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🏷️ Resumen de selecciones (cuando está cerrado) */}
            {tempSelectedMaquinas.length > 0 && !isOpen && (
                <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                        {tempSelectedMaquinas.slice(0, 2).map((maquina, index) => (
                            <span 
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                            >
                                🚛 {maquina.length > 15 ? maquina.substring(0, 15) + '...' : maquina}
                                <button
                                    type="button"
                                    onClick={() => handleToggleMaquina(maquina)}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                >
                                    <FaTimes className="text-xs" />
                                </button>
                            </span>
                        ))}
                        {tempSelectedMaquinas.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                +{tempSelectedMaquinas.length - 2} más
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiltroMaquinasMobileFriendly;