import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiGrid, FiBell, FiCalendar, FiTool, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../../routes/PrivateRoutes';
import axios from '../../../lib/axios';
import { FAENA_COLORS, getFaenaColors } from '../../../context/faenaColor';
import SemaforoMaquinas from './SemaforoMaquinas';
import AlertasMantenimiento from './AlertasMantenimiento';
import GanttMantenimiento from './GanttMantenimiento';
import FormRegistrarMantencion from './FormRegistrarMantencion';
import ConfiguracionMantenimiento from './ConfiguracionMantenimiento';

const VISTAS = [
    { id: 'semaforo',      label: 'Semáforo',      icon: <FiGrid size={15} /> },
    { id: 'alertas',       label: 'Alertas',        icon: <FiBell size={15} />, badge: true },
    { id: 'cronograma',    label: 'Cronograma',     icon: <FiCalendar size={15} /> },
    { id: 'configuracion', label: 'Configuración',  icon: <FiSettings size={15} /> },
];

const TODAS_FAENAS = Object.values(FAENA_COLORS).map(f => f.name);

const PanelMantenimiento = () => {
    const { user } = useAuth();
    const [vista, setVista] = useState('semaforo');
    const [faenasSeleccionadas, setFaenasSeleccionadas] = useState(TODAS_FAENAS);
    const [maquinas, setMaquinas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [maquinaARegistrar, setMaquinaARegistrar] = useState(null);
    const [toast, setToast] = useState(null);

    const toggleFaena = (nombre) => {
        setFaenasSeleccionadas(prev =>
            prev.includes(nombre)
                ? prev.length > 1 ? prev.filter(f => f !== nombre) : prev
                : [...prev, nombre]
        );
    };

    // Convertir nombres a IDs para el backend
    const faenaIdsSeleccionados = faenasSeleccionadas
        .map(nombre => Object.values(FAENA_COLORS).find(f => f.name === nombre)?.id)
        .filter(Boolean);

    const todasActivas = faenasSeleccionadas.length === TODAS_FAENAS.length;

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = todasActivas
                ? {}
                : { faenas: faenaIdsSeleccionados.join(',') };

            const res = await axios.get('/api/mantenimiento', { params });
            if (res.data?.status === 'success') {
                setMaquinas(res.data.data ?? []);
            } else {
                setError('No se pudieron cargar los datos de mantenimiento.');
            }
        } catch (err) {
            setError(err.response?.data?.message ?? 'Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    }, [faenasSeleccionadas]);

    useEffect(() => {
        if (vista !== 'configuracion') cargarDatos();
    }, [cargarDatos, vista]);

    const mostrarToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleRegistrarExito = (msg) => {
        mostrarToast(msg);
        setMaquinaARegistrar(null);
        cargarDatos();
    };

    const alertasCount = maquinas.filter(m => m.estado === 'critico' || m.estado === 'advertencia').length;

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FiTool className="text-blue-600" size={22} />
                    <h2 className="text-xl font-bold text-gray-800">Panel de Mantenimiento</h2>
                </div>
                {vista !== 'configuracion' && (
                    <button
                        onClick={cargarDatos}
                        disabled={loading}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                )}
            </div>

            {/* Selector de faenas */}
            {vista !== 'configuracion' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
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

                    {!todasActivas && (
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
            )}

            {/* Sub-navegación */}
            <div className="flex gap-1 border-b border-gray-200">
                {VISTAS.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setVista(v.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${
                            vista === v.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {v.icon}
                        {v.label}
                        {v.badge && alertasCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs rounded-full px-1 font-bold">
                                {alertasCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            {vista === 'configuracion' ? (
                <ConfiguracionMantenimiento />
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                    <p>Cargando datos de mantenimiento...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 font-medium mb-3">{error}</p>
                    <button onClick={cargarDatos} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                        Reintentar
                    </button>
                </div>
            ) : (
                <>
                    {vista === 'semaforo' && <SemaforoMaquinas maquinas={maquinas} onRegistrar={setMaquinaARegistrar} />}
                    {vista === 'alertas' && <AlertasMantenimiento maquinas={maquinas} onRegistrar={setMaquinaARegistrar} />}
                    {vista === 'cronograma' && <GanttMantenimiento maquinas={maquinas} />}
                </>
            )}

            {maquinaARegistrar && (
                <FormRegistrarMantencion
                    maquina={maquinaARegistrar}
                    userId={user?.id}
                    onClose={() => setMaquinaARegistrar(null)}
                    onSuccess={handleRegistrarExito}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold">
                    ✓ {toast}
                </div>
            )}
        </div>
    );
};

export default PanelMantenimiento;
