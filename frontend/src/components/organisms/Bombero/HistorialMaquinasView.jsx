import React, { useState, useEffect, useContext } from "react";
import {
    FaGasPump,
    FaSpinner,
    FaExclamationTriangle,
    FaHome,
    FaCalendarAlt,
    FaTruck,
    FaUser,
    FaChartLine,
    FaSearch,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaMapMarkerAlt,
    FaIndustry,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import axios from "../../../lib/axios";
import { UserContext } from "../../../context/userContext";
import Header from "../Bombero/Header";

// Importar componente desde pdf/components
import PDFGenerator from '../../../pdf/components/PDFGenerator';

// Configuración de paginación
const ITEMS_PER_PAGE = 10;

// 🎨 CONFIGURACIÓN DE COLORES POR FAENA - SOLO TILTIL Y CABILDO
const FAENA_COLORS = {
    'Cabildo': {
        id: 1,
        primary: 'from-green-700 to-green-800',      // Verde Oliva
        light: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-800',
        icon: '🌿',
        gradient: 'bg-gradient-to-r from-green-600 to-green-700'
    },
    'Tiltil': {
        id: 4,
        primary: 'from-red-700 to-red-800',          // Rojo Arcilla
        light: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800',
        icon: '🏔️',
        gradient: 'bg-gradient-to-r from-red-600 to-red-700'
    }
};

// 🎯 FUNCIÓN PARA OBTENER COLORES DE FAENA
const getFaenaColors = (faenaNombre) => {
    return FAENA_COLORS[faenaNombre] || {
        primary: 'from-gray-600 to-gray-700',
        light: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        badge: 'bg-gray-100 text-gray-800',
        icon: '📍',
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600'
    };
};

// Componente de paginación
const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    itemsPerPage = ITEMS_PER_PAGE
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
                Mostrando <span className="font-medium">{startItem}</span> a{" "}
                <span className="font-medium">{endItem}</span> de{" "}
                <span className="font-medium">{totalItems}</span> resultados
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                        }`}
                >
                    <FaChevronLeft className="w-3 h-3" />
                </button>

                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={page === '...'}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                            ? "bg-blue-600 text-white"
                            : page === '...'
                                ? "text-gray-400 cursor-default"
                                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                            }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                        }`}
                >
                    <FaChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

// 🔧 DATEFILTER MODIFICADO - CON SELECTOR DE FAENAS INTEGRADO
const DateFilter = ({
    onFilterChange,
    initialDateFrom = "",
    initialDateTo = "",
    initialEquipoFilter = "",
    showQuickFilters = true,
    className = "",
    // 🆕 Props para faenas
    selectedFaenas = [],
    onFaenaToggle,
    stats = {}
}) => {
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [equipoFilter, setEquipoFilter] = useState(initialEquipoFilter);
    
    // 🆕 Estado para controlar expansión del selector de faenas
    const [faenasExpanded, setFaenasExpanded] = useState(true);

    const getQuickDates = () => {
        const today = new Date();
        const formatDate = (date) => date.toISOString().split("T")[0];

        return {
            today: formatDate(today),
            yesterday: formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
            weekStart: formatDate(
                new Date(today.setDate(today.getDate() - today.getDay()))
            ),
            monthStart: formatDate(
                new Date(today.getFullYear(), today.getMonth(), 1)
            ),
            lastMonth: formatDate(
                new Date(today.getFullYear(), today.getMonth() - 1, 1)
            ),
            lastMonthEnd: formatDate(
                new Date(today.getFullYear(), today.getMonth(), 0)
            ),
        };
    };

    const quickDates = getQuickDates();

    const notifyChange = (newDateFrom, newDateTo, newEquipoFilter) => {
        if (onFilterChange) {
            onFilterChange({
                dateFrom: newDateFrom,
                dateTo: newDateTo,
                equipoFilter: newEquipoFilter
            });
        }
    };

    const handleDateFromChange = (value) => {
        setDateFrom(value);
        notifyChange(value, dateTo, equipoFilter);
    };

    const handleDateToChange = (value) => {
        setDateTo(value);
        notifyChange(dateFrom, value, equipoFilter);
    };

    const handleEquipoFilterChange = (value) => {
        setEquipoFilter(value);
        notifyChange(dateFrom, dateTo, value);
    };

    const applyQuickFilter = (period) => {
        let newDateFrom = "";
        let newDateTo = "";

        switch (period) {
            case "today":
                newDateFrom = quickDates.today;
                newDateTo = quickDates.today;
                break;
            case "yesterday":
                newDateFrom = quickDates.yesterday;
                newDateTo = quickDates.yesterday;
                break;
            case "week":
                newDateFrom = quickDates.weekStart;
                newDateTo = quickDates.today;
                break;
            case "month":
                newDateFrom = quickDates.monthStart;
                newDateTo = quickDates.today;
                break;
            case "lastMonth":
                newDateFrom = quickDates.lastMonth;
                newDateTo = quickDates.lastMonthEnd;
                break;
            default:
                break;
        }

        setDateFrom(newDateFrom);
        setDateTo(newDateTo);
        notifyChange(newDateFrom, newDateTo, equipoFilter);
    };

    const clearFilters = () => {
        setDateFrom("");
        setDateTo("");
        setEquipoFilter("");
        notifyChange("", "", "");
    };

    // 🔧 FUNCIÓN ARREGLADA para manejo de faenas
    const handleToggleAllFaenas = () => {
        const totalFaenas = Object.keys(FAENA_COLORS).length;
        const todasSeleccionadas = selectedFaenas.length === totalFaenas;
        
        console.log('🔍 Toggle All Faenas:', {
            selectedFaenas: selectedFaenas.length,
            totalFaenas,
            todasSeleccionadas
        });
        
        if (todasSeleccionadas) {
            // Si todas están seleccionadas, deseleccionar todas
            selectedFaenas.forEach(faena => {
                onFaenaToggle(faena, false);
            });
        } else {
            // Si no todas están seleccionadas, seleccionar todas
            Object.keys(FAENA_COLORS).forEach(faena => {
                if (!selectedFaenas.includes(faena)) {
                    onFaenaToggle(faena, true);
                }
            });
        }
    };

    const hasActiveFilters = dateFrom || dateTo || equipoFilter;
    const totalFaenas = Object.keys(FAENA_COLORS).length;
    const todasSeleccionadas = selectedFaenas.length === totalFaenas;

    return (
        <div
            className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8 ${className}`}
        >
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 sm:p-3 rounded-xl shadow-lg">
                    <FaCalendarAlt className="text-white text-base sm:text-lg" />
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                        🔍 Filtros de Búsqueda
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm">
                        Filtra por fecha, equipo y faenas
                    </p>
                </div>
            </div>

            {/* Filtro por nombre de equipo */}
            <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <FaTruck className="text-blue-600" />
                    Filtrar por Nombre de Equipo
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={equipoFilter}
                        onChange={(e) => handleEquipoFilterChange(e.target.value)}
                        placeholder="Ejemplo: Excavadora, Camión, patente, etc..."
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    {equipoFilter && (
                        <button
                            onClick={() => handleEquipoFilterChange("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Fecha Desde
                    </label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => handleDateFromChange(e.target.value)}
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Fecha Hasta
                    </label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => handleDateToChange(e.target.value)}
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
                    />
                </div>
            </div>

            {showQuickFilters && (
                <div className="mb-4 sm:mb-6">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 block">
                        🚀 Filtros Rápidos de Fecha
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => applyQuickFilter("today")}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => applyQuickFilter("yesterday")}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
                        >
                            Ayer
                        </button>
                        <button
                            onClick={() => applyQuickFilter("week")}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
                        >
                            Esta Semana
                        </button>
                        <button
                            onClick={() => applyQuickFilter("month")}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
                        >
                            Este Mes
                        </button>
                        <button
                            onClick={() => applyQuickFilter("lastMonth")}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm font-medium"
                        >
                            Mes Anterior
                        </button>
                    </div>
                </div>
            )}

            {/* 🆕 SELECTOR DE FAENAS INTEGRADO - DESPUÉS DE FILTROS RÁPIDOS */}
            <div className="mb-4 sm:mb-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    
                    {/* Header del selector de faenas */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg shadow-sm">
                            <FaIndustry className="text-white text-sm" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-gray-800">
                                🏭 Selector de Faenas
                            </h4>
                            <p className="text-gray-600 text-xs">
                                {selectedFaenas.length}/2 faenas seleccionadas
                            </p>
                        </div>
                        
                        {/* Botones de control */}
                        <div className="flex items-center gap-2">
                            {/* Botón expandir/colapsar solo en móvil */}
                            <button
                                onClick={() => setFaenasExpanded(!faenasExpanded)}
                                className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs"
                            >
                                {faenasExpanded ? '▲' : '▼'}
                            </button>
                        </div>
                    </div>

                    {/* Grid de faenas - colapsable en móvil */}
                    <div className={`${faenasExpanded ? 'block' : 'hidden'} sm:block`}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {Object.entries(FAENA_COLORS).map(([faenaNombre, colors]) => {
                                const isSelected = selectedFaenas.includes(faenaNombre);
                                const faenaStats = stats.faenas?.[faenaNombre] || { consumos: 0, litros: 0 };
                                
                                return (
                                    <button
                                        key={faenaNombre}
                                        onClick={() => onFaenaToggle(faenaNombre, !isSelected)}
                                        className={`relative overflow-hidden p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 transform active:scale-95 ${
                                            isSelected 
                                                ? `${colors.border} ${colors.light} shadow-md scale-105` 
                                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    >
                                        {/* Indicador de selección */}
                                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-300 ${
                                            isSelected ? 'bg-green-500 shadow-lg' : 'bg-gray-300'
                                        }`} />
                                        
                                        {/* Contenido */}
                                        <div className="text-left">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-xs sm:text-lg">{colors.icon}</span>
                                                <h5 className={`font-bold text-xs sm:text-sm truncate ${isSelected ? colors.text : 'text-gray-600'}`}>
                                                    {faenaNombre}
                                                </h5>
                                            </div>
                                            
                                            {/* Stats mini para móvil */}
                                            <div className="sm:hidden">
                                                <div className={`text-xs ${isSelected ? colors.text : 'text-gray-500'}`}>
                                                    {faenaStats.consumos}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Barra decorativa */}
                                        {isSelected && (
                                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${colors.primary} opacity-60`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Resumen de faenas seleccionadas */}
                        <div className="mt-3 pt-3 border-t border-purple-200">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-600">
                                <span className="font-medium">Activas:</span>
                                {selectedFaenas.length === 0 ? (
                                    <span className="text-red-600 font-medium">Ninguna</span>
                                ) : (
                                    selectedFaenas.map(faena => {
                                        const colors = getFaenaColors(faena);
                                        return (
                                            <span key={faena} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                                                <span className="text-xs">{colors.icon}</span>
                                                <span className="hidden sm:inline">{faena}</span>
                                            </span>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-xs sm:text-sm"
                >
                    <FaTimes />
                    Limpiar Filtros
                </button>
            </div>

            {/* Resumen de filtros activos */}
            {(hasActiveFilters || selectedFaenas.length > 0) && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2 text-blue-700 text-xs sm:text-sm">
                        <span className="font-medium">Filtros activos:</span>
                        
                        {/* Filtros de fecha */}
                        {dateFrom && (
                            <span className="bg-blue-100 px-2 py-1 rounded">
                                Desde: <strong>{new Date(dateFrom).toLocaleDateString("es-CL")}</strong>
                            </span>
                        )}
                        {dateTo && (
                            <span className="bg-blue-100 px-2 py-1 rounded">
                                Hasta: <strong>{new Date(dateTo).toLocaleDateString("es-CL")}</strong>
                            </span>
                        )}
                        
                        {/* Filtro de equipo */}
                        {equipoFilter && (
                            <span className="bg-blue-100 px-2 py-1 rounded">
                                Equipo: <strong>{equipoFilter}</strong>
                            </span>
                        )}
                        
                        {/* Faenas seleccionadas */}
                        {selectedFaenas.length > 0 && selectedFaenas.length < totalFaenas && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                Faenas: <strong>{selectedFaenas.length}/2</strong>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente Button
const Button = ({
    to,
    color,
    icon,
    text,
    className = "",
    size = "normal",
    disabled = false,
    onClick,
}) => {
    const baseClasses =
        "relative overflow-hidden flex items-center justify-center gap-2 sm:gap-3 rounded-xl font-semibold transition-all duration-300 transform group";

    const sizeClasses = {
        small: "px-3 sm:px-4 py-2 text-xs sm:text-sm",
        normal: "px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base",
        large: "px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg",
    };

    const colorClasses = {
        orange:
            "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl hover:shadow-orange-200/50 hover:scale-105",
        blue: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-200/50 hover:scale-105",
        green:
            "bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl hover:shadow-green-200/50 hover:scale-105",
        gray: "bg-gray-500 text-white cursor-not-allowed opacity-50",
    };

    const handleClick = (e) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        if (onClick) {
            e.preventDefault();
            onClick();
        } else if (to) {
            window.location.href = to;
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`${baseClasses} ${sizeClasses[size]} ${disabled ? colorClasses.gray : colorClasses[color]
                } ${className}`}
            disabled={disabled}
        >
            {!disabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}

            {icon && (
                <span
                    className={`text-lg sm:text-xl transition-transform duration-300 z-10 ${!disabled ? "group-hover:rotate-6" : ""
                        }`}
                >
                    {icon}
                </span>
            )}
            <span
                className={`font-medium z-10 transition-all duration-300 ${!disabled ? "group-hover:tracking-wide" : ""
                    }`}
            >
                {text}
            </span>
        </button>
    );
};

// Componente LoadingSpinner
const LoadingSpinner = ({ message = "Cargando..." }) => (
    <div className="flex justify-center items-center py-12 sm:py-16">
        <div className="relative">
            <FaSpinner className="animate-spin text-gray-400 text-3xl sm:text-4xl" />
            <div className="absolute inset-0 animate-ping">
                <FaSpinner className="text-blue-400 text-3xl sm:text-4xl opacity-20" />
            </div>
        </div>
        <span className="ml-3 sm:ml-4 text-gray-600 font-medium text-base sm:text-lg">{message}</span>
    </div>
);

// 🆕 COMPONENTE DE TARJETA MÓVIL OPTIMIZADA Y COMPACTA
const ConsumoCard = ({ consumo, formatearFecha, formatNumber }) => {
    const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
    const faenaColors = getFaenaColors(consumo.faena);

    return (
        <div className={`relative bg-white border-l-4 ${faenaColors.border} rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 ${faenaColors.light}`}>

            {/* 🎨 HEADER COMPACTO - Badge de faena + Litros */}
            <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${faenaColors.badge}`}>
                    <span className="text-xs">{faenaColors.icon}</span>
                    {consumo.faena}
                </span>
                <div className="text-right">
                    <div className="font-bold text-lg text-orange-600">
                        {formatNumber(consumo.litros_consumidos)} L
                    </div>
                </div>
            </div>

            {/* 📅 FECHA Y HORA EN UNA LÍNEA */}
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                <FaCalendarAlt className="text-blue-500 flex-shrink-0" />
                <span className="font-medium">{fecha}</span>
                <span className="text-gray-400">•</span>
                <span>{hora}</span>
            </div>

            {/* 🚛 EQUIPO PRINCIPAL */}
            <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                    <FaTruck className="text-green-600 text-xs flex-shrink-0" />
                    <span className="font-bold text-sm text-gray-800 truncate">
                        {consumo.nombre_maquina || "N/A"}
                    </span>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                    {consumo.patente || "Sin patente"}
                </div>
            </div>

            {/* 📊 INFORMACIÓN COMPACTA EN GRID 2x2 */}
            <div className="grid grid-cols-2 gap-2 text-xs">

                {/* Solicitante */}
                <div className="flex items-start gap-1">
                    <FaUser className="text-purple-600 text-xs mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 truncate text-xs">
                            {consumo.solicitante_nombre || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                            {consumo.id_dotacion || "Sin RUT"}
                        </div>
                    </div>
                </div>

                {/* Estanque */}
                <div className="flex items-start gap-1">
                    <FaGasPump className="text-blue-600 text-xs mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 truncate text-xs">
                            {consumo.estanque || "N/A"}
                        </div>
                        {consumo.cantidad_estanques > 1 && (
                            <div className="text-xs text-purple-600 font-semibold">
                                {consumo.cantidad_estanques} estanques
                            </div>
                        )}
                    </div>
                </div>

                {/* Medición */}
                {consumo.medicion && (
                    <div className="flex items-center gap-1 col-span-2">
                        <FaChartLine className="text-indigo-600 text-xs flex-shrink-0" />
                        <span className="font-medium text-gray-800 text-xs">
                            {formatNumber(consumo.medicion)} {consumo.tipo_medicion === "Kilometraje" ? "km" : "hrs"}
                        </span>
                    </div>
                )}

                {/* Costo (si está disponible) */}
                {consumo.costo_total && (
                    <div className="flex items-center gap-1 col-span-2">
                        <span className="text-xs text-gray-500">💰</span>
                        <span className="text-xs text-gray-600 font-medium">
                            ${formatNumber(consumo.costo_total)}
                        </span>
                    </div>
                )}
            </div>

            {/* 🎨 BARRA DECORATIVA INFERIOR */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${faenaColors.primary} opacity-60 rounded-b-lg`} />
        </div>
    );
};

const HistorialMaquinasView = () => {
    const { user, loading } = useContext(UserContext);

    const [consumos, setConsumos] = useState([]);
    const [loadingConsumos, setLoadingConsumos] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        dateFrom: "",
        dateTo: "",
        equipoFilter: ""
    });

    // 🆕 NUEVO: Estado para faenas seleccionadas - SOLO TILTIL Y CABILDO
    const [selectedFaenas, setSelectedFaenas] = useState(['Cabildo', 'Tiltil']);

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Estados para estadísticas
    const [stats, setStats] = useState({
        total_consumos: 0,
        total_litros: 0,
        promedio_consumo: 0,
        costo_total: 0,
        equipo_mas_usado: "N/A",
        consumos_simples: 0,
        consumos_multiples: 0,
        porcentaje_multiples: 0,
        faenas: {} // 🆕 Estadísticas por faena
    });

    // 🆕 FUNCIÓN MODIFICADA para obtener consumos de múltiples faenas
    const fetchConsumos = async (filterParams = {}, page = 1, faenasSeleccionadas = selectedFaenas) => {
        if (faenasSeleccionadas.length === 0) {
            setConsumos([]);
            setStats({
                total_consumos: 0,
                total_litros: 0,
                promedio_consumo: 0,
                costo_total: 0,
                equipo_mas_usado: "N/A",
                consumos_simples: 0,
                consumos_multiples: 0,
                porcentaje_multiples: 0,
                faenas: {}
            });
            setTotalItems(0);
            return;
        }

        setLoadingConsumos(true);
        setError(null);

        try {
            const token = JSON.parse(localStorage.getItem("authToken"))?.token;

            if (!token) {
                throw new Error("No se encontró token de autenticación");
            }

            // 🆕 CONVERTIR nombres de faenas a IDs
            const faenaIds = faenasSeleccionadas.map(faenaNombre => {
                const faenaConfig = getFaenaColors(faenaNombre);
                return faenaConfig.id;
            }).join(',');

            // 🆕 CONSTRUCCIÓN de parámetros para múltiples faenas
            const params = new URLSearchParams({
                faenas: faenaIds, // 🔥 USAR PARÁMETRO "faenas" en lugar de "faena"
                page: page.toString(),
                per_page: ITEMS_PER_PAGE.toString(),
            });

            // Agregar filtros
            if (filterParams.dateFrom) {
                params.append('dateFrom', filterParams.dateFrom);
            }

            if (filterParams.dateTo) {
                params.append('dateTo', filterParams.dateTo);
            }

            if (filterParams.equipoFilter) {
                params.append('equipoFilter', filterParams.equipoFilter);
            }

            console.log("🔍 Obteniendo consumos para faenas:", faenaIds, "página:", page, "con filtros:", filterParams);

            const response = await axios.get(`/api/consumosFecha?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("📊 Consumos recibidos:", response.data);

            if (response.data.success) {
                const consumosData = response.data.data || [];
                setConsumos(consumosData);

                // Estadísticas básicas de la API
                if (response.data.stats) {
                    const statsBase = response.data.stats;

                    // 🆕 CALCULAR estadísticas por faena
                    const faenaStats = {};
                    faenasSeleccionadas.forEach(faenaNombre => {
                        const consumosFaena = consumosData.filter(c => c.faena === faenaNombre);
                        faenaStats[faenaNombre] = {
                            consumos: consumosFaena.length,
                            litros: consumosFaena.reduce((sum, c) => sum + parseFloat(c.litros_consumidos || 0), 0)
                        };
                    });

                    setStats({
                        ...statsBase,
                        faenas: faenaStats
                    });
                }

                const total = response.data.pagination?.total || response.data.stats?.total_consumos || 0;
                setTotalItems(total);

            } else {
                throw new Error(response.data.message || 'Error en la respuesta del servidor');
            }

        } catch (error) {
            console.error("❌ Error al cargar consumos:", error);

            let errorMessage = "Error al cargar consumos";
            if (error.response?.status === 401) {
                errorMessage = "Sesión expirada. Por favor, inicie sesión nuevamente.";
            } else if (error.response?.status === 403) {
                errorMessage = "No tiene permisos para acceder a esta información.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
        } finally {
            setLoadingConsumos(false);
        }
    };

    // 🆕 MANEJAR selección/deselección de faenas
    const handleFaenaToggle = (faenaNombre, isSelected) => {
        let newSelectedFaenas;

        if (isSelected) {
            newSelectedFaenas = [...selectedFaenas, faenaNombre];
        } else {
            newSelectedFaenas = selectedFaenas.filter(f => f !== faenaNombre);
        }

        setSelectedFaenas(newSelectedFaenas);
        setCurrentPage(1); // Resetear a la primera página
        fetchConsumos(filters, 1, newSelectedFaenas);
    };

    // Manejar cambios en filtros
    const handleFilterChange = (newFilters) => {
        console.log("🔧 Aplicando filtros:", newFilters);
        setFilters(newFilters);
        setCurrentPage(1);
        fetchConsumos(newFilters, 1, selectedFaenas);
    };

    // Manejar cambio de página
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchConsumos(filters, page, selectedFaenas);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // useEffect para cargar datos cuando el usuario esté disponible
    useEffect(() => {
        if (!loading && user) {
            console.log("👤 Usuario disponible, cargando consumos para todas las faenas...", user);
            fetchConsumos();
        }
    }, [user, loading]);

    // Función para formatear fecha
    const formatearFecha = (fechaString) => {
        const fecha = new Date(fechaString);
        const fechaFormateada = fecha.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        const horaFormateada = fecha.toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
        });
        return { fecha: fechaFormateada, hora: horaFormateada };
    };

    // Función para formatear números
    const formatNumber = (num) => {
        return parseFloat(num || 0).toLocaleString("es-CL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Cálculo de páginas totales
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

    // Loading state del usuario
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md mx-4">
                    <LoadingSpinner message="Obteniendo información del usuario..." />
                </div>
            </div>
        );
    }

    // Error state si no hay usuario
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-4 border-2 border-red-200">
                    <div className="text-red-500 text-5xl sm:text-6xl mb-4">
                        <FaExclamationTriangle className="mx-auto animate-bounce" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                        Error de Autenticación
                    </h2>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">
                        No se pudo cargar la información del usuario.
                    </p>
                    <Button
                        color="orange"
                        text="🔐 Ir a Login"
                        onClick={() => (window.location.href = "/login")}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 py-4 sm:py-6 px-3 sm:px-4">
            <div className="max-w-7xl mx-auto">
                <Header />
                
                {/* 🔧 DATEFILTER CON SELECTOR DE FAENAS INTEGRADO */}
                <DateFilter
                    onFilterChange={handleFilterChange}
                    initialDateFrom={filters.dateFrom}
                    initialDateTo={filters.dateTo}
                    initialEquipoFilter={filters.equipoFilter}
                    // 🆕 Props para faenas
                    selectedFaenas={selectedFaenas}
                    onFaenaToggle={handleFaenaToggle}
                    stats={stats}
                />
                
                {/* 🆕 TARJETAS DE ESTADÍSTICAS OPTIMIZADAS PARA MÓVIL */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-blue-100 text-xs sm:text-sm truncate">Consumos</p>
                                <p className="text-lg sm:text-2xl font-bold truncate">{stats.total_consumos.toLocaleString()}</p>
                            </div>
                            <FaGasPump className="text-xl sm:text-3xl text-blue-200 flex-shrink-0 ml-2" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-green-100 text-xs sm:text-sm truncate">Litros</p>
                                <p className="text-lg sm:text-2xl font-bold truncate">{formatNumber(stats.total_litros)} L</p>
                            </div>
                            <FaChartLine className="text-xl sm:text-3xl text-green-200 flex-shrink-0 ml-2" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-purple-100 text-xs sm:text-sm truncate">Promedio</p>
                                <p className="text-lg sm:text-2xl font-bold truncate">{formatNumber(stats.promedio_consumo)} L</p>
                            </div>
                            <FaTruck className="text-xl sm:text-3xl text-purple-200 flex-shrink-0 ml-2" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-orange-100 text-xs sm:text-sm truncate">Faenas</p>
                                <p className="text-lg sm:text-2xl font-bold">{selectedFaenas.length}/2</p>
                            </div>
                            <FaIndustry className="text-xl sm:text-3xl text-orange-200 flex-shrink-0 ml-2" />
                        </div>
                    </div>
                </div>

                {/* Contenedor de Consumos OPTIMIZADO PARA MÓVIL */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-3 sm:p-8 mb-4 sm:mb-8 overflow-hidden">

                    {/* 📱 HEADER COMPACTO ARREGLADO */}
                    <div className="flex items-start justify-between mb-4 sm:mb-8 gap-3">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg flex-shrink-0">
                                <FaGasPump className="text-white text-lg sm:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1 truncate">
                                    Consumos Globales
                                </h3>
                                <p className="text-gray-600 font-medium text-xs sm:text-base leading-tight">
                                    {totalItems} registros
                                    {(filters.dateFrom || filters.dateTo || filters.equipoFilter) &&
                                        " filtrados"}
                                </p>

                                {/* 📱 FAENAS SELECCIONADAS MEJORADAS - SOLO 2 FAENAS */}
                                <div className="flex flex-wrap gap-1 mt-2 sm:mt-3 max-w-full">
                                    {selectedFaenas.length === 0 ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                            ⚠️ Sin faenas seleccionadas
                                        </span>
                                    ) : (
                                        // 🔧 MOSTRAR TODAS LAS FAENAS SELECCIONADAS (máximo 2)
                                        selectedFaenas.map(faena => {
                                            const colors = getFaenaColors(faena);
                                            return (
                                                <span key={faena} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.badge} whitespace-nowrap`}>
                                                    <span className="text-xs">{colors.icon}</span>
                                                    <span>{faena}</span>
                                                </span>
                                            );
                                        })
                                    )}
                                </div>

                                {/* 📱 INFO ADICIONAL SOLO EN DESKTOP */}
                                {stats.consumos_multiples > 0 && (
                                    <div className="hidden sm:flex items-center gap-4 mt-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                            Simples: {stats.consumos_simples}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                            Múltiples: {stats.consumos_multiples}
                                        </span>
                                        <span className="text-gray-400">
                                            ({stats.porcentaje_multiples}% múltiples)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 📱 BOTONES COMPACTOS */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            <PDFGenerator
                                consumos={consumos}
                                stats={stats}
                                filters={filters}
                                totalItems={totalItems}
                                currentPage={currentPage}
                                user={user}
                                size="small"
                                disabled={loadingConsumos}
                            />
                            <Button
                                color="blue"
                                text="🔄"
                                onClick={() => fetchConsumos(filters, currentPage, selectedFaenas)}
                                disabled={loadingConsumos}
                                size="small"
                                className="sm:hidden px-2"
                            />
                        </div>
                    </div>

                    {loadingConsumos ? (
                        <LoadingSpinner message="Cargando consumos..." />
                    ) : error ? (
                        <div className="text-center py-12 sm:py-16">
                            <div className="text-red-500 text-3xl sm:text-4xl mb-4">
                                <FaExclamationTriangle className="mx-auto" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                                Error al cargar datos
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
                            <Button
                                color="blue"
                                text="🔄 Reintentar"
                                onClick={() => fetchConsumos(filters, currentPage, selectedFaenas)}
                            />
                        </div>
                    ) : selectedFaenas.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                            <div className="text-gray-400 text-4xl mb-3">🏭</div>
                            <div className="text-gray-500 text-base sm:text-lg font-medium">
                                No hay faenas seleccionadas
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                Selecciona al menos una faena para ver los consumos
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Vista móvil - Cards */}
                            <div className="block lg:hidden">
                                <div className="space-y-4">
                                    {consumos.length > 0 ? (
                                        consumos.map((consumo, index) => (
                                            <ConsumoCard
                                                key={consumo.id_consumo || index}
                                                consumo={consumo}
                                                formatearFecha={formatearFecha}
                                                formatNumber={formatNumber}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 text-4xl mb-3">📭</div>
                                            <div className="text-gray-500 text-base sm:text-lg font-medium">
                                                📭 No hay consumos para mostrar
                                            </div>
                                            <p className="text-gray-400 text-sm mt-2">
                                                {filters.dateFrom || filters.dateTo || filters.equipoFilter
                                                    ? "Intenta ajustar los filtros de búsqueda"
                                                    : "No se han registrado consumos aún"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Vista escritorio - Tabla ARREGLADA */}
                            <div className="hidden lg:block">
                                <div className="overflow-hidden rounded-2xl shadow-inner">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-full">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                <tr>
                                                    <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                                                        📅 Fecha/Hora
                                                    </th>
                                                    <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                                                        🚛 Equipo
                                                    </th>
                                                    <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                                                        ⛽ Litros
                                                    </th>
                                                    <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                                                        👤 Solicitante
                                                    </th>
                                                    <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                                                        🛢️ Estanque
                                                    </th>
                                                    <th className="text-left py-4 sm:py-5 px-4 sm:px-6 font-bold text-gray-700 text-sm sm:text-base whitespace-nowrap">
                                                        📊 Medición
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {consumos.length > 0 ? (
                                                    consumos.map((consumo, index) => {
                                                        const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
                                                        const faenaColors = getFaenaColors(consumo.faena);

                                                        return (
                                                            <tr
                                                                key={consumo.id_consumo || index}
                                                                // 🔧 HOVER ARREGLADO: Sin scale que cause scroll horizontal
                                                                className={`relative ${faenaColors.light} border-l-4 ${faenaColors.border} hover:shadow-lg hover:bg-opacity-80 transition-all duration-200 group`}
                                                                style={{
                                                                    // 🔧 PREVENIR OVERFLOW HORIZONTAL
                                                                    minWidth: '100%',
                                                                    maxWidth: '100%'
                                                                }}
                                                            >
                                                                {/* 🎨 INDICADOR DE FAENA EN LA ESQUINA SUPERIOR DERECHA */}
                                                                <td className="relative py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                                                    {/* Badge de faena flotante - POSICIÓN ARREGLADA */}
                                                                    <div className="absolute top-1 right-1 z-10">
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${faenaColors.badge} shadow-md transform group-hover:scale-105 transition-transform duration-200`}>
                                                                            <span className="text-xs">{faenaColors.icon}</span>
                                                                            {consumo.faena}
                                                                        </span>
                                                                    </div>

                                                                    {/* Contenido de fecha */}
                                                                    <div className="font-bold text-gray-800 pt-4">
                                                                        {fecha}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 font-medium">
                                                                        {hora}
                                                                    </div>
                                                                </td>

                                                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm font-semibold text-gray-800">
                                                                    <div className="font-bold">
                                                                        {consumo.nombre_maquina || "N/A"}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        Patente: {consumo.patente || "N/A"}
                                                                    </div>
                                                                </td>

                                                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                                                    <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                                                        {formatNumber(consumo.litros_consumidos)} L
                                                                    </span>
                                                                    {consumo.costo_total && (
                                                                        <div className="text-xs text-gray-600">
                                                                            ${formatNumber(consumo.costo_total)}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm">
                                                                    <div className="font-semibold text-gray-800">
                                                                        {consumo.solicitante_nombre || "N/A"}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        RUT: {consumo.id_dotacion || "N/A"}
                                                                    </div>
                                                                    {consumo.solicitante_tipo && (
                                                                        <div className="text-xs text-blue-700 font-medium">
                                                                            {consumo.solicitante_tipo}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-gray-700 font-medium">
                                                                    {consumo.estanque || "N/A"}
                                                                    {consumo.cantidad_estanques > 1 && (
                                                                        <div className="text-xs text-purple-700 font-semibold">
                                                                            ({consumo.cantidad_estanques} estanques)
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                <td className="py-4 sm:py-5 px-4 sm:px-6 text-sm text-gray-700">
                                                                    {consumo.medicion ? (
                                                                        <span className="font-medium">
                                                                            {formatNumber(consumo.medicion)}
                                                                            <span className="text-xs ml-1">
                                                                                {consumo.tipo_medicion === "Kilometraje" ? "km" : "hrs"}
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-500">N/A</span>
                                                                    )}
                                                                </td>

                                                                {/* 🎨 BARRA DECORATIVA INFERIOR - MEJORADA */}
                                                                <td className="absolute bottom-0 left-0 right-0 h-1 pointer-events-none">
                                                                    <div className={`h-full bg-gradient-to-r ${faenaColors.primary} opacity-60 group-hover:opacity-80 transition-opacity duration-200`}></div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="py-12 text-center">
                                                            <div className="text-gray-500 text-lg font-medium">
                                                                📭 No hay consumos para mostrar
                                                            </div>
                                                            <p className="text-gray-400 text-sm mt-2">
                                                                {filters.dateFrom || filters.dateTo || filters.equipoFilter
                                                                    ? "Intenta ajustar los filtros de búsqueda"
                                                                    : "No se han registrado consumos aún"}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Componente de paginación inferior */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                onPageChange={handlePageChange}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 sm:mt-12 py-6 sm:py-8 border-t border-gray-200/50">
                    <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
                        Sistema de Gestión de Combustible - Faenas Cabildo y Tiltil v2.1
                    </p>
                    <div className="flex justify-center flex-wrap gap-2 mt-2">
                        {Object.entries(FAENA_COLORS).map(([faena, colors]) => (
                            <span key={faena} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colors.badge}`}>
                                <span>{colors.icon}</span>
                                {faena}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistorialMaquinasView;