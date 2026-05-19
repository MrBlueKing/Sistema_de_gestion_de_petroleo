import React, { useState } from 'react';
import { FiAlertTriangle, FiClock, FiX, FiCopy, FiCheck, FiPackage } from 'react-icons/fi';
import { getFaenaColors } from '../../../context/faenaColor';

const SolicitudBodegaModal = ({ maquina, onClose }) => {
    const [copiado, setCopiado] = useState(false);
    const [notas, setNotas] = useState('');

    const texto = `SOLICITUD DE INSUMOS PARA MANTENCIÓN
=====================================
Equipo: ${maquina.equipo}
Patente: ${maquina.patente}
Categoría: ${maquina.categoria}
Faena: ${(maquina.faenas ?? []).join(', ') || 'Sin asignar'}
Estado: ${maquina.estado === 'critico' ? 'CRÍTICO - Mantención vencida' : 'PRÓXIMA mantención'}
Unidad: ${maquina.tipo_medicion === 'Horometro' ? 'Horómetro' : 'Kilometraje'}
${maquina.fecha_estimada_mantenimiento ? `Fecha estimada de mantención: ${new Date(maquina.fecha_estimada_mantenimiento).toLocaleDateString('es-CL')}` : ''}
${notas ? `\nObservaciones del planificador:\n${notas}` : ''}
=====================================
Generado el: ${new Date().toLocaleString('es-CL')}`;

    const copiar = () => {
        navigator.clipboard.writeText(texto).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-2">
                        <FiPackage className="text-indigo-600" size={20} />
                        <h2 className="font-bold text-gray-800">Pre-Solicitud a Bodega</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <FiX size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-3 text-sm space-y-1">
                        <p><span className="text-gray-500">Equipo:</span> <span className="font-semibold">{maquina.equipo}</span></p>
                        <p><span className="text-gray-500">Patente:</span> <span className="font-semibold">{maquina.patente}</span></p>
                        <p><span className="text-gray-500">Tipo mantenimiento:</span> <span className="font-semibold capitalize">
                            {maquina.estado === 'critico' ? 'Correctivo urgente' : 'Preventivo programado'}
                        </span></p>
                        {maquina.fecha_estimada_mantenimiento && (
                            <p><span className="text-gray-500">Fecha estimada:</span> <span className="font-semibold">
                                {new Date(maquina.fecha_estimada_mantenimiento).toLocaleDateString('es-CL')}
                            </span></p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas para bodega (insumos necesarios, urgencia, etc.)
                        </label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={3}
                            placeholder="Ej: Filtro de aceite ref. X, aceite 15W-40 (20L), correa de distribución..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{texto}</pre>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
                            Cerrar
                        </button>
                        <button
                            onClick={copiar}
                            className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            {copiado ? <><FiCheck size={16} /> Copiado!</> : <><FiCopy size={16} /> Copiar solicitud</>}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        Copia el texto y pégalo en el sistema de bodega o envíalo por correo.
                    </p>
                </div>
            </div>
        </div>
    );
};

const AlertasMantenimiento = ({ maquinas = [], onRegistrar }) => {
    const [maquinaBodega, setMaquinaBodega] = useState(null);

    const alertas = maquinas
        .filter(m => m.estado === 'critico' || m.estado === 'advertencia')
        .sort((a, b) => (b.porcentaje_uso ?? 0) - (a.porcentaje_uso ?? 0));

    const unidadLabel = (m) => m.tipo_medicion === 'Horometro' ? 'h' : 'km';

    if (alertas.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500">
                <FiCheck size={48} className="mx-auto mb-3 text-green-400" />
                <h3 className="text-lg font-semibold text-green-700 mb-1">Todo en orden</h3>
                <p>No hay equipos en estado crítico ni de advertencia.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <FiAlertTriangle className="text-red-500" size={20} />
                <h3 className="font-semibold text-gray-800">{alertas.length} equipos requieren atención</h3>
            </div>

            {alertas.map(maquina => {
                const esCritico = maquina.estado === 'critico';
                return (
                    <div
                        key={maquina.id_maquina}
                        className={`rounded-xl border-l-4 p-4 ${esCritico ? 'border-red-500 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${esCritico ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {esCritico ? '🔴 CRÍTICO' : '🟡 ADVERTENCIA'}
                                    </span>
                                </div>
                                <p className="font-semibold text-gray-800">{maquina.equipo}</p>
                                <p className="text-xs text-gray-500">{maquina.patente} · {maquina.categoria}</p>
                                {(maquina.faenas ?? []).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {maquina.faenas.map(nombre => {
                                            const c = getFaenaColors(nombre);
                                            return (
                                                <span key={nombre} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>
                                                    {c.emoji} {nombre}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Métricas */}
                            <div className="grid grid-cols-3 gap-3 text-xs sm:text-center">
                                <div>
                                    <p className="text-gray-500">Uso</p>
                                    <p className={`font-bold text-base ${esCritico ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {maquina.porcentaje_uso?.toFixed(0)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Lectura</p>
                                    <p className="font-bold text-gray-800">
                                        {maquina.medicion_actual?.toLocaleString('es-CL')} {unidadLabel(maquina)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Fecha est.</p>
                                    <p className="font-bold text-gray-800">
                                        {maquina.fecha_estimada_mantenimiento
                                            ? new Date(maquina.fecha_estimada_mantenimiento).toLocaleDateString('es-CL')
                                            : 'N/D'}
                                    </p>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col gap-1.5 sm:w-36">
                                <button
                                    onClick={() => onRegistrar(maquina)}
                                    className="py-1.5 px-3 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    Registrar mantención
                                </button>
                                <button
                                    onClick={() => setMaquinaBodega(maquina)}
                                    className="py-1.5 px-3 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                                >
                                    <FiPackage size={12} /> Solicitar a bodega
                                </button>
                            </div>
                        </div>

                        {/* Última mantención */}
                        {maquina.ultimo_mantenimiento && (
                            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                <FiClock size={11} className="inline mr-1" />
                                Última mantención: {maquina.ultimo_mantenimiento.fecha} · hace {maquina.ultimo_mantenimiento.dias_transcurridos} días
                            </p>
                        )}
                    </div>
                );
            })}

            {maquinaBodega && (
                <SolicitudBodegaModal maquina={maquinaBodega} onClose={() => setMaquinaBodega(null)} />
            )}
        </div>
    );
};

export default AlertasMantenimiento;
