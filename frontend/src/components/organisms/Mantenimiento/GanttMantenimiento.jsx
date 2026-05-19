import React, { useMemo } from 'react';
import { FiCalendar, FiInfo } from 'react-icons/fi';

const DIAS_VISTA = 90;

const colorPorEstado = {
    critico: '#ef4444',
    advertencia: '#f59e0b',
    normal: '#22c55e',
    en_mantenimiento: '#3b82f6',
};

const GanttMantenimiento = ({ maquinas = [] }) => {
    const hoy = useMemo(() => new Date(), []);
    const fin = useMemo(() => {
        const d = new Date(hoy);
        d.setDate(d.getDate() + DIAS_VISTA);
        return d;
    }, [hoy]);

    const totalMs = fin - hoy;

    const maquinasConFecha = useMemo(() =>
        maquinas
            .filter(m => m.fecha_estimada_mantenimiento)
            .map(m => ({
                ...m,
                fechaDate: new Date(m.fecha_estimada_mantenimiento),
            }))
            .sort((a, b) => a.fechaDate - b.fechaDate),
        [maquinas]
    );

    const sinFecha = maquinas.filter(m => !m.fecha_estimada_mantenimiento);

    const posicion = (fecha) => {
        const diff = fecha - hoy;
        if (diff < 0) return 0;
        if (diff > totalMs) return 100;
        return (diff / totalMs) * 100;
    };

    const marcasMeses = useMemo(() => {
        const marcas = [];
        const cursor = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        cursor.setMonth(cursor.getMonth() + 1);
        while (cursor <= fin) {
            const pct = posicion(cursor);
            if (pct > 0 && pct < 100) {
                marcas.push({ fecha: new Date(cursor), pct });
            }
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return marcas;
    }, [hoy, fin]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FiCalendar className="text-blue-600" size={20} />
                    <h3 className="font-semibold text-gray-800">Cronograma de mantenciones — próximos {DIAS_VISTA} días</h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    {[
                        { color: colorPorEstado.critico, label: 'Crítico' },
                        { color: colorPorEstado.advertencia, label: 'Advertencia' },
                        { color: colorPorEstado.normal, label: 'Normal' },
                    ].map(({ color, label }) => (
                        <span key={label} className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {maquinasConFecha.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                    <FiInfo size={36} className="mx-auto mb-3 opacity-30" />
                    <p>No hay fechas estimadas disponibles.</p>
                    <p className="text-xs mt-1">Las fechas se calculan automáticamente cuando hay registros de consumo suficientes.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Eje de fechas */}
                    <div className="relative h-8 bg-gray-50 border-b border-gray-200 ml-40">
                        <div className="absolute left-0 top-0 h-full w-full">
                            {/* Hoy */}
                            <div className="absolute top-0 h-full flex flex-col items-center" style={{ left: '0%' }}>
                                <div className="h-full w-px bg-blue-500" />
                            </div>
                            <span className="absolute text-xs text-blue-600 font-semibold top-1" style={{ left: '1%' }}>Hoy</span>

                            {/* Marcas de meses */}
                            {marcasMeses.map(({ fecha, pct }) => (
                                <div key={pct} className="absolute top-0 h-full" style={{ left: `${pct}%` }}>
                                    <div className="h-full w-px bg-gray-300" />
                                    <span className="absolute text-xs text-gray-500 top-1 -translate-x-1/2 whitespace-nowrap">
                                        {fecha.toLocaleDateString('es-CL', { month: 'short' })}
                                    </span>
                                </div>
                            ))}

                            {/* Fin */}
                            <span className="absolute text-xs text-gray-400 top-1 right-1">
                                +{DIAS_VISTA}d
                            </span>
                        </div>
                    </div>

                    {/* Filas de máquinas */}
                    <div className="divide-y divide-gray-100">
                        {maquinasConFecha.map(maquina => {
                            const pct = posicion(maquina.fechaDate);
                            const color = colorPorEstado[maquina.estado] ?? colorPorEstado.normal;
                            const esPasada = maquina.fechaDate < hoy;

                            return (
                                <div key={maquina.id_maquina} className="flex items-center h-10 hover:bg-gray-50">
                                    {/* Nombre */}
                                    <div className="w-40 shrink-0 px-3 text-xs font-medium text-gray-700 truncate border-r border-gray-200 h-full flex items-center">
                                        {maquina.equipo}
                                    </div>
                                    {/* Barra */}
                                    <div className="flex-1 relative h-full">
                                        {/* Línea de hoy */}
                                        <div className="absolute top-0 h-full w-px bg-blue-200" style={{ left: '0%' }} />

                                        {/* Marcas de meses */}
                                        {marcasMeses.map(({ pct: mp }) => (
                                            <div key={mp} className="absolute top-0 h-full w-px bg-gray-100" style={{ left: `${mp}%` }} />
                                        ))}

                                        {/* Marcador de mantención */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group cursor-default"
                                            style={{ left: `${pct}%` }}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full shadow-sm border-2 border-white"
                                                style={{ backgroundColor: color }}
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                                                {maquina.equipo} · {maquina.fechaDate.toLocaleDateString('es-CL')}
                                                {esPasada && <span className="ml-1 text-red-300">(vencida)</span>}
                                            </div>
                                        </div>

                                        {/* Etiqueta de fecha */}
                                        <span
                                            className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-500 whitespace-nowrap"
                                            style={{ left: `${Math.min(pct + 1, 85)}%` }}
                                        >
                                            {maquina.fechaDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                            {esPasada && <span className="text-red-500 ml-0.5">!</span>}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Máquinas sin fecha estimada */}
            {sinFecha.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FiInfo size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600 font-medium">
                            {sinFecha.length} equipo(s) sin fecha estimada (datos de consumo insuficientes)
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sinFecha.map(m => (
                            <span key={m.id_maquina} className="text-xs bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded-full">
                                {m.equipo}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GanttMantenimiento;
