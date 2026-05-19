import React, { useState, useEffect, useMemo } from 'react';
import { FiSettings, FiSearch, FiEdit2, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from '../../../lib/axios';
import { FAENA_COLORS, getFaenaColors } from '../../../context/faenaColor';

const TODAS_FAENAS = Object.values(FAENA_COLORS).map(f => f.name);

const colorFaena = (nombre) => {
    const c = getFaenaColors(nombre);
    return c.badge;
};

// ── Fila editable de categoría ──────────────────────────────────────────────
const FilaCategoria = ({ cat, onGuardado }) => {
    const [editando, setEditando] = useState(false);
    const [valor, setValor] = useState(cat.intervalo);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ok, setOk] = useState(false);

    const guardar = async () => {
        if (!valor || Number(valor) <= 0) {
            setError('El intervalo debe ser mayor a 0');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.put(`/api/categorias-maquinas/${cat.id_categoria}`, {
                nombre_categoria: cat.nombre_categoria,
                tipo_medicion: cat.tipo_medicion,
                horas_mantencion: Number(valor),
            });
            setOk(true);
            setEditando(false);
            onGuardado?.({ ...cat, intervalo: Number(valor) });
            setTimeout(() => setOk(false), 2000);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const cancelar = () => {
        setValor(cat.intervalo);
        setEditando(false);
        setError(null);
    };

    const unidad = cat.tipo_medicion === 'Horometro' ? 'h' : 'km';

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-2.5 font-medium text-gray-800">{cat.nombre_categoria}</td>
            <td className="px-4 py-2.5 text-gray-500 text-sm">
                {cat.tipo_medicion === 'Horometro' ? 'Horómetro' : 'Kilometraje'}
            </td>
            <td className="px-4 py-2.5">
                {editando ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={valor}
                            onChange={e => { setValor(e.target.value); setError(null); }}
                            className="w-24 px-2 py-1 border border-blue-400 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <span className="text-xs text-gray-400">{unidad}</span>
                    </div>
                ) : (
                    <span className="font-semibold text-gray-700">
                        {cat.intervalo.toLocaleString('es-CL')} {unidad}
                        {ok && <FiCheckCircle className="inline ml-1.5 text-green-500" size={14} />}
                    </span>
                )}
                {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
            </td>
            <td className="px-4 py-2.5">
                {editando ? (
                    <div className="flex gap-1">
                        <button
                            onClick={guardar}
                            disabled={loading}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading
                                ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                                : <FiSave size={12} />}
                            Guardar
                        </button>
                        <button
                            onClick={cancelar}
                            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded hover:bg-gray-200"
                        >
                            <FiX size={12} /> Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditando(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300"
                    >
                        <FiEdit2 size={12} /> Editar
                    </button>
                )}
            </td>
        </tr>
    );
};

// ── Componente principal ────────────────────────────────────────────────────
const ConfiguracionMantenimiento = () => {
    const [datos, setDatos] = useState({ maquinas: [], categorias: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [faenasSeleccionadas, setFaenasSeleccionadas] = useState(TODAS_FAENAS);
    const [categorias, setCategorias] = useState([]);

    const toggleFaena = (nombre) => {
        setFaenasSeleccionadas(prev =>
            prev.includes(nombre)
                ? prev.length > 1 ? prev.filter(f => f !== nombre) : prev
                : [...prev, nombre]
        );
    };

    useEffect(() => {
        const cargar = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/mantenimiento/configuracion');
                if (res.data?.status === 'success') {
                    setDatos(res.data.data);
                    setCategorias(res.data.data.categorias);
                } else {
                    setError('No se pudo cargar la configuración.');
                }
            } catch (err) {
                setError(err.response?.data?.message ?? 'Error al conectar con el servidor.');
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, []);

    const maquinasFiltradas = useMemo(() => {
        return datos.maquinas.filter(m => {
            if (filtroCategoria !== 'todas' && m.id_categoria !== Number(filtroCategoria)) return false;
            if (busqueda.trim()) {
                const q = busqueda.toLowerCase();
                if (!m.nombre_maquina?.toLowerCase().includes(q) &&
                    !m.patente?.toLowerCase().includes(q)) return false;
            }
            // Filtro por faena: mostrar si tiene AL MENOS una faena seleccionada
            if (faenasSeleccionadas.length < TODAS_FAENAS.length) {
                const tieneFaena = m.faenas?.some(f => faenasSeleccionadas.includes(f.nombre));
                if (!tieneFaena) return false;
            }
            return true;
        });
    }, [datos.maquinas, busqueda, filtroCategoria, faenasSeleccionadas]);

    const handleCategoriaActualizada = (catActualizada) => {
        setCategorias(prev =>
            prev.map(c => c.id_categoria === catActualizada.id_categoria ? catActualizada : c)
        );
        setDatos(prev => ({
            ...prev,
            maquinas: prev.maquinas.map(m =>
                m.id_categoria === catActualizada.id_categoria
                    ? { ...m, intervalo: catActualizada.intervalo }
                    : m
            ),
        }));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
            <p>Cargando configuración...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FiAlertCircle className="mx-auto mb-2 text-red-500" size={32} />
            <p className="text-red-700">{error}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ── Categorías ─────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <FiSettings className="text-blue-600" size={18} />
                    <h3 className="font-semibold text-gray-800">Intervalo de mantención por categoría</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                    El intervalo aplica a todas las máquinas de esa categoría. Cambiarlo aquí actualiza el cálculo del semáforo.
                </p>
                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo medición</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Intervalo</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorias.map(cat => (
                                <FilaCategoria
                                    key={cat.id_categoria}
                                    cat={cat}
                                    onGuardado={handleCategoriaActualizada}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Máquinas con faenas ────────────────────────── */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-gray-800">Equipos y faenas asignadas</h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {datos.maquinas.length} equipos
                    </span>
                </div>

                {/* Selector de faenas */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            🏭 Faenas — {faenasSeleccionadas.length}/{TODAS_FAENAS.length} seleccionadas
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFaenasSeleccionadas(TODAS_FAENAS)}
                                className="text-xs text-blue-600 hover:underline"
                            >Todas</button>
                            <span className="text-gray-300">|</span>
                            <button
                                onClick={() => setFaenasSeleccionadas([TODAS_FAENAS[0]])}
                                className="text-xs text-gray-500 hover:underline"
                            >Ninguna</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(FAENA_COLORS).map(faena => {
                            const activa = faenasSeleccionadas.includes(faena.name);
                            return (
                                <button
                                    key={faena.id}
                                    onClick={() => toggleFaena(faena.name)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                                        activa
                                            ? `${faena.badge} border-current`
                                            : 'bg-white text-gray-400 border-gray-200 opacity-50'
                                    }`}
                                >
                                    <span>{faena.emoji}</span>
                                    <span>{faena.name}</span>
                                </button>
                            );
                        })}
                    </div>
                    {/* Faenas activas como chips */}
                    {faenasSeleccionadas.length < TODAS_FAENAS.length && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-400">Activas:</span>
                            {faenasSeleccionadas.map(nombre => {
                                const c = getFaenaColors(nombre);
                                return (
                                    <span key={nombre} className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                                        {c.emoji} {nombre}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Filtros de texto y categoría */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar equipo o patente..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-52"
                        />
                    </div>
                    <select
                        value={filtroCategoria}
                        onChange={e => setFiltroCategoria(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="todas">Todas las categorías</option>
                        {categorias.map(c => (
                            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                        ))}
                    </select>
                    <span className="text-xs text-gray-400 self-center">
                        {maquinasFiltradas.length} de {datos.maquinas.length} equipos
                    </span>
                </div>

                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Patente</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Intervalo</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Faenas asignadas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {maquinasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                            No se encontraron equipos
                                        </td>
                                    </tr>
                                ) : maquinasFiltradas.map(m => {
                                    const unidad = m.tipo_medicion === 'Horometro' ? 'h' : 'km';
                                    return (
                                        <tr key={m.id_maquina} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px] truncate" title={m.nombre_maquina}>
                                                {m.nombre_maquina}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{m.patente ?? '—'}</td>
                                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.nombre_categoria}</td>
                                            <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-semibold">
                                                {m.intervalo?.toLocaleString('es-CL')} {unidad}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {m.faenas?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {m.faenas.map(f => (
                                                            <span
                                                                key={f.id}
                                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorFaena(f.nombre)}`}
                                                            >
                                                                {f.nombre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin faena asignada</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionMantenimiento;
