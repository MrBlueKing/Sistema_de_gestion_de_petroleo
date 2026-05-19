import React, { useState, useMemo } from 'react';
import { FiTool, FiSearch, FiChevronDown, FiChevronRight, FiAlertTriangle, FiClock, FiCheckCircle } from 'react-icons/fi';
import { getFaenaColors } from '../../../context/faenaColor';

const GRUPOS = [
    {
        key: 'critico',
        label: 'Crítico',
        icon: <FiAlertTriangle size={14} />,
        headerBg: 'bg-red-600',
        rowBg: 'bg-red-50 hover:bg-red-100',
        borderLeft: 'border-l-4 border-red-500',
        badge: 'bg-red-100 text-red-700',
        barColor: 'bg-red-500',
        textColor: 'text-red-700',
        desc: 'Mantenimiento vencido o inmediato',
    },
    {
        key: 'advertencia',
        label: 'Advertencia',
        icon: <FiClock size={14} />,
        headerBg: 'bg-yellow-500',
        rowBg: 'bg-yellow-50 hover:bg-yellow-100',
        borderLeft: 'border-l-4 border-yellow-400',
        badge: 'bg-yellow-100 text-yellow-700',
        barColor: 'bg-yellow-400',
        textColor: 'text-yellow-700',
        desc: 'Próximo a requerir mantención',
    },
    {
        key: 'en_mantenimiento',
        label: 'En mantención',
        icon: <FiTool size={14} />,
        headerBg: 'bg-blue-600',
        rowBg: 'bg-blue-50 hover:bg-blue-100',
        borderLeft: 'border-l-4 border-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        barColor: 'bg-blue-500',
        textColor: 'text-blue-700',
        desc: 'Actualmente en taller',
    },
    {
        key: 'normal',
        label: 'Normal',
        icon: <FiCheckCircle size={14} />,
        headerBg: 'bg-green-600',
        rowBg: 'bg-white hover:bg-green-50',
        borderLeft: 'border-l-4 border-green-400',
        badge: 'bg-green-100 text-green-700',
        barColor: 'bg-green-500',
        textColor: 'text-green-700',
        desc: 'Operando con normalidad',
    },
];

const COLUMNAS = [
    { key: 'equipo', label: 'Equipo' },
    { key: 'patente', label: 'Patente' },
    { key: 'faenas', label: 'Faena' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'medicion_actual', label: 'Lectura actual' },
    { key: 'horas_hasta_proximo', label: 'H/km restantes' },
    { key: 'porcentaje_uso', label: '% Uso' },
    { key: 'ultimo_mantenimiento', label: 'Última mantención' },
    { key: 'fecha_estimada_mantenimiento', label: 'Fecha est. próxima' },
];

const MiniBar = ({ pct, colorClass }) => (
    <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <span className="text-xs font-semibold tabular-nums">{pct.toFixed(0)}%</span>
    </div>
);

const GrupoSeccion = ({ grupo, maquinas, onRegistrar, defaultOpen }) => {
    const [open, setOpen] = useState(defaultOpen);
    if (maquinas.length === 0) return null;
    const unidad = (m) => m.tipo_medicion === 'Horometro' ? 'h' : 'km';

    return (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Header del grupo */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-2.5 ${grupo.headerBg} text-white font-semibold text-sm`}
            >
                <span className="flex items-center gap-2">
                    {grupo.icon}
                    {grupo.label}
                    <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {maquinas.length}
                    </span>
                    <span className="text-white/75 font-normal text-xs hidden sm:inline">— {grupo.desc}</span>
                </span>
                {open ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
            </button>

            {/* Tabla */}
            {open && (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {COLUMNAS.map(col => (
                                    <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {maquinas.map(m => (
                                <tr key={m.id_maquina} className={`${grupo.rowBg} ${grupo.borderLeft} transition-colors`}>
                                    <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap max-w-[180px] truncate" title={m.equipo}>
                                        {m.equipo}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{m.patente ?? '—'}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {(m.faenas ?? []).length > 0
                                                ? m.faenas.map(nombre => {
                                                    const c = getFaenaColors(nombre);
                                                    return (
                                                        <span key={nombre} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>
                                                            {c.emoji} {nombre}
                                                        </span>
                                                    );
                                                })
                                                : <span className="text-gray-400">—</span>
                                            }
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap max-w-[130px] truncate" title={m.categoria}>
                                        {m.categoria}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap tabular-nums">
                                        {m.medicion_actual != null
                                            ? `${m.medicion_actual.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unidad(m)}`
                                            : '—'}
                                    </td>
                                    <td className={`px-3 py-2.5 whitespace-nowrap font-semibold tabular-nums ${grupo.textColor}`}>
                                        {m.horas_hasta_proximo > 0
                                            ? `${m.horas_hasta_proximo.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unidad(m)}`
                                            : <span className="text-red-600 font-bold">Vencida</span>}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <MiniBar pct={m.porcentaje_uso ?? 0} colorClass={grupo.barColor} />
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                                        {m.ultimo_mantenimiento?.fecha ?? <span className="text-gray-400">Sin registro</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                                        {m.fecha_estimada_mantenimiento
                                            ? new Date(m.fecha_estimada_mantenimiento).toLocaleDateString('es-CL')
                                            : <span className="text-gray-400">Sin datos</span>}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <button
                                            onClick={() => onRegistrar(m)}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                                        >
                                            <FiTool size={11} /> Registrar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const SemaforoMaquinas = ({ maquinas = [], onRegistrar }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroMedicion, setFiltroMedicion] = useState('todas');

    const categorias = useMemo(() => {
        const set = new Set(maquinas.map(m => m.categoria).filter(Boolean));
        return [...set].sort();
    }, [maquinas]);

    const filtradas = useMemo(() => {
        return maquinas.filter(m => {
            if (busqueda.trim()) {
                const q = busqueda.toLowerCase();
                if (!m.equipo?.toLowerCase().includes(q) &&
                    !m.patente?.toLowerCase().includes(q) &&
                    !m.categoria?.toLowerCase().includes(q)) return false;
            }
            if (filtroCategoria !== 'todas' && m.categoria !== filtroCategoria) return false;
            if (filtroMedicion !== 'todas' && m.tipo_medicion !== filtroMedicion) return false;
            return true;
        });
    }, [maquinas, busqueda, filtroCategoria, filtroMedicion]);

    const hayFiltrosActivos = busqueda.trim() || filtroCategoria !== 'todas' || filtroMedicion !== 'todas';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroCategoria('todas');
        setFiltroMedicion('todas');
    };

    const porGrupo = useMemo(() =>
        GRUPOS.reduce((acc, g) => {
            acc[g.key] = filtradas.filter(m => m.estado === g.key);
            return acc;
        }, {}),
        [filtradas]
    );

    const total = maquinas.length;
    const criticos = porGrupo['critico']?.length ?? 0;
    const advertencia = porGrupo['advertencia']?.length ?? 0;

    return (
        <div className="space-y-3">
            {/* Resumen rápido */}
            <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-gray-500">Total: <strong className="text-gray-800">{total}</strong> equipos</span>
                {criticos > 0 && <span className="text-red-600 font-semibold">🔴 {criticos} críticos</span>}
                {advertencia > 0 && <span className="text-yellow-600 font-semibold">🟡 {advertencia} en advertencia</span>}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Nombre */}
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o patente..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
                    />
                </div>

                {/* Categoría */}
                <select
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                {/* Tipo de medición */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                    {[
                        { value: 'todas', label: 'Todos' },
                        { value: 'Horometro', label: 'Horómetro' },
                        { value: 'Kilometraje', label: 'Kilometraje' },
                    ].map(op => (
                        <button
                            key={op.value}
                            onClick={() => setFiltroMedicion(op.value)}
                            className={`px-3 py-2 font-medium transition-colors ${
                                filtroMedicion === op.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>

                {/* Limpiar filtros */}
                {hayFiltrosActivos && (
                    <button
                        onClick={limpiarFiltros}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Secciones por grupo */}
            <div className="space-y-3">
                {GRUPOS.map(grupo => (
                    <GrupoSeccion
                        key={grupo.key}
                        grupo={grupo}
                        maquinas={porGrupo[grupo.key] ?? []}
                        onRegistrar={onRegistrar}
                        defaultOpen={grupo.key === 'critico' || grupo.key === 'advertencia'}
                    />
                ))}
            </div>

            {filtradas.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <FiSearch size={36} className="mx-auto mb-3 opacity-30" />
                    <p>No se encontraron equipos con "<strong>{busqueda}</strong>"</p>
                </div>
            )}
        </div>
    );
};

export default SemaforoMaquinas;
