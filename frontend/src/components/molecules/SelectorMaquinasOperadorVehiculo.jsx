// components/molecules/OperadorVehiculo/SelectorMaquinas.jsx
import React, { useState } from 'react';
import { FaTruck, FaSearch, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useMaquinasDisponibles } from '../../hook/OperadorVehiculo/useMaquinasDisponibles';

const SelectorMaquinasOperadorVehiculo = ({
    maquinaSeleccionada,
    onSeleccionarMaquina,
    error,
    disabled = false,
    placeholder = "Selecciona una máquina...",
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

    // 🔍 FILTRAR MÁQUINAS SEGÚN TEXTO
    const maquinasFiltradas = React.useMemo(() => {
        if (!filtroTexto.trim()) return maquinasDisponibles;

        const texto = filtroTexto.toLowerCase();
        return maquinasDisponibles.filter(maquina =>
            maquina.nombre_maquina.toLowerCase().includes(texto) ||
            maquina.patente.toLowerCase().includes(texto) ||
            maquina.categoria.nombre.toLowerCase().includes(texto)
        );
    }, [maquinasDisponibles, filtroTexto]);

    // 📋 MANEJAR SELECCIÓN DE MÁQUINA
    const handleSeleccionar = (maquina) => {
        onSeleccionarMaquina(maquina);
        setIsOpen(false);
        setFiltroTexto('');
    };

    // 🔄 REFRESCAR LISTA
    const handleRefrescar = async () => {
        await refrescarMaquinas();
    };

    // 🚫 LIMPIAR SELECCIÓN
    const handleLimpiar = () => {
        onSeleccionarMaquina(null);
        setIsOpen(false);
        setFiltroTexto('');
    };

    // 🎯 OBTENER INFORMACIÓN DE LA MÁQUINA SELECCIONADA
    const maquinaActual = maquinaSeleccionada ? obtenerMaquinaPorId(maquinaSeleccionada) : null;

    // 🎨 CLASES CSS
    const containerClasses = `relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    const buttonClasses = `
    w-full px-4 py-3 text-left bg-white border rounded-lg shadow-sm
    flex items-center justify-between transition-colors duration-200
    ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'}
    ${isOpen ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : ''}
  `;

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Máquina a cargar {required && <span className="text-red-500">*</span>}
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-gray-600">Cargando máquinas disponibles...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (errorMaquinas) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Máquina a cargar {required && <span className="text-red-500">*</span>}
                </label>
                <div className="w-full px-4 py-3 bg-red-50 border border-red-300 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-red-600">⚠️ {errorMaquinas}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRefrescar}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            {/* LABEL */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Máquina a cargar {required && <span className="text-red-500">*</span>}
            </label>

            {/* BOTÓN PRINCIPAL */}
            <button
                type="button"
                className={buttonClasses}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FaTruck className={`flex-shrink-0 ${maquinaActual ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                        {maquinaActual ? (
                            <div>
                                <div className="font-medium text-gray-900 truncate">
                                    {maquinaActual.nombre_maquina}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                    {maquinaActual.patente} • {maquinaActual.categoria.nombre}
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500">{placeholder}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    {maquinaActual && (
                        <span
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLimpiar();
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                            <FaTimes className="w-3 h-3" />
                        </span>
                    )}
                    <FaChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* DROPDOWN */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                    {/* HEADER CON BÚSQUEDA */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Máquinas disponibles ({totalMaquinas})
                            </span>
                            <button
                                type="button"
                                onClick={handleRefrescar}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                🔄 Actualizar
                            </button>
                        </div>

                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, patente o categoría..."
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* LISTA DE MÁQUINAS */}
                    <div className="max-h-64 overflow-y-auto">
                        {maquinasFiltradas.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                {filtroTexto ? 'No se encontraron máquinas con ese criterio' : 'No hay máquinas disponibles'}
                            </div>
                        ) : (
                            maquinasPorCategoria.map(categoria => {
                                const maquinasCategoria = categoria.maquinas.filter(maquina =>
                                    maquinasFiltradas.some(f => f.id_maquina === maquina.id_maquina)
                                );

                                if (maquinasCategoria.length === 0) return null;

                                return (
                                    <div key={categoria.id_categoria}>
                                        {/* HEADER DE CATEGORÍA */}
                                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                {categoria.nombre_categoria} ({maquinasCategoria.length})
                                            </span>
                                        </div>

                                        {/* MÁQUINAS DE LA CATEGORÍA */}
                                        {maquinasCategoria.map(maquina => (
                                            <button
                                                key={maquina.id_maquina}
                                                type="button"
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                onClick={() => handleSeleccionar(maquina)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <FaTruck className="text-blue-500 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-gray-900 truncate">
                                                            {maquina.nombre_maquina}
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate">
                                                            Patente: {maquina.patente}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}

            {/* INFORMACIÓN ADICIONAL */}
            {!error && totalMaquinas > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                    💡 Hay {totalMaquinas} máquinas disponibles para carga externa
                </p>
            )}
        </div>
    );
};

export default SelectorMaquinasOperadorVehiculo;