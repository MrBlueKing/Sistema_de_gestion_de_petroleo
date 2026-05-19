import React, { useState } from 'react';
import { FiTool, FiX, FiSave, FiAlertCircle, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import axios from '../../../lib/axios';

const TIPOS = [
    { value: 'preventivo', label: 'Preventiva', desc: 'Mantención programada según intervalo', color: 'blue' },
    { value: 'correctivo', label: 'Correctiva', desc: 'Reparación por falla o avería', color: 'red' },
    { value: 'mayor', label: 'Mayor / Overhaul', desc: 'Revisión mayor o reconstrucción', color: 'purple' },
];

const FormRegistrarMantencion = ({ maquina, userId, onClose, onSuccess }) => {
    const unidad = maquina?.tipo_medicion === 'Horometro' ? 'h' : 'km';
    const medicionAuto = maquina?.medicion_actual ?? 0;

    const [form, setForm] = useState({
        tipo_mantenimiento: 'preventivo',
        descripcion: '',
        observaciones: '',
        medicion_manual: '',
        proximo_mantenimiento: maquina?.intervalo_mantenimiento ?? '',
        usar_medicion_manual: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.descripcion || !form.descripcion.trim()) {
            setError('La descripción es obligatoria.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const payload = {
                id_maquina: maquina.id_maquina,
                tipo_mantenimiento: form.tipo_mantenimiento,
                descripcion: form.descripcion.trim(),
                observaciones: form.observaciones.trim() || null,
                realizado_por: userId,
                proximo_mantenimiento: form.proximo_mantenimiento ? Number(form.proximo_mantenimiento) : null,
            };
            if (form.usar_medicion_manual && form.medicion_manual) {
                payload.medicion_manual = Number(form.medicion_manual);
            }
            await axios.post('/api/mantenimiento', payload);
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.('Mantención registrada correctamente');
                onClose?.();
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Error al registrar la mantención.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-2">
                        <FiTool className="text-blue-600" size={20} />
                        <div>
                            <h2 className="font-bold text-gray-800">Registrar Mantención</h2>
                            <p className="text-xs text-gray-500">{maquina?.equipo} · {maquina?.patente}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Info máquina */}
                    <div className="bg-blue-50 rounded-lg p-3 text-sm grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-gray-500 text-xs">Categoría</p>
                            <p className="font-semibold text-gray-800">{maquina?.categoria}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Lectura del sistema</p>
                            <p className="font-semibold text-gray-800">
                                {medicionAuto?.toLocaleString('es-CL', { minimumFractionDigits: 1 })} {unidad}
                            </p>
                        </div>
                        {maquina?.ultimo_mantenimiento && (
                            <div className="col-span-2">
                                <p className="text-gray-500 text-xs">Última mantención</p>
                                <p className="font-semibold text-gray-800">{maquina.ultimo_mantenimiento.fecha}</p>
                            </div>
                        )}
                    </div>

                    {/* Corrección de lectura (opcional) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.usar_medicion_manual}
                                onChange={e => handleChange('usar_medicion_manual', e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <FiEdit2 size={14} className="text-gray-400" />
                            Corregir lectura manualmente (si el horómetro del sistema tiene un error)
                        </label>
                        {form.usar_medicion_manual && (
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.medicion_manual}
                                onChange={e => handleChange('medicion_manual', e.target.value)}
                                placeholder={`Lectura real en ${unidad}...`}
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    </div>

                    {/* Tipo de mantención */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de mantención *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TIPOS.map(tipo => (
                                <button
                                    key={tipo.value}
                                    type="button"
                                    onClick={() => handleChange('tipo_mantenimiento', tipo.value)}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${
                                        form.tipo_mantenimiento === tipo.value
                                            ? `border-${tipo.color}-500 bg-${tipo.color}-50`
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <p className="text-xs font-semibold text-gray-800">{tipo.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{tipo.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ¿Qué se realizó? *
                        </label>
                        <textarea
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            rows={3}
                            required
                            placeholder="Ej: Cambio de aceite, filtros de aire y aceite, revisión de frenos..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">{form.descripcion.length} caracteres</p>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones adicionales</label>
                        <textarea
                            value={form.observaciones}
                            onChange={e => handleChange('observaciones', e.target.value)}
                            rows={2}
                            placeholder="Notas adicionales, repuestos usados, condiciones especiales..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Próximo intervalo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Intervalo para próxima mantención ({unidad})
                            <span className="text-gray-400 font-normal ml-1">(por defecto: {maquina?.intervalo_mantenimiento} {unidad})</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            value={form.proximo_mantenimiento}
                            onChange={e => handleChange('proximo_mantenimiento', e.target.value)}
                            placeholder={`${maquina?.intervalo_mantenimiento} ${unidad}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Error / Success */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                            <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                            <FiCheckCircle size={16} />
                            <span>Mantención registrada correctamente</span>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Guardando...</>
                            ) : (
                                <><FiSave size={16} /> Registrar</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormRegistrarMantencion;
