import React, { useState } from 'react';
import {
    FaTimes,
    FaExclamationTriangle,
    FaStop,
    FaTruck,
    FaUser,
    FaCalendarAlt,
    FaInfoCircle,
    FaCheckCircle
} from 'react-icons/fa';

const FinalizarAsignacionModal = ({
    isOpen,
    onClose,
    onConfirm,
    asignacion,
    loading = false
}) => {
    const [motivo, setMotivo] = useState('');
    const [motivoRequerido, setMotivoRequerido] = useState(false);

    // Lista de motivos predefinidos
    const motivosPredefinidos = [
        'Fin de turno',
        'Cambio de operador',
        'Mantenimiento programado',
        'Reparación de máquina',
        'Finalización de proyecto',
        'Solicitud del operador',
        'Decisión administrativa',
        'Otro motivo'
    ];

    const handleConfirmar = () => {
        if (motivoRequerido && !motivo.trim()) {
            return;
        }

        const motivoFinal = motivo.trim() || 'Finalizada por administrador';
        onConfirm(asignacion.id, motivoFinal);
        handleClose();
    };

    const handleClose = () => {
        setMotivo('');
        setMotivoRequerido(false);
        onClose();
    };

    const seleccionarMotivoPredefinido = (motivoPredefinido) => {
        if (motivoPredefinido === 'Otro motivo') {
            setMotivo('');
            setMotivoRequerido(true);
        } else {
            setMotivo(motivoPredefinido);
            setMotivoRequerido(false);
        }
    };

    // CAMBIO 1: Verificar que isOpen sea true y asignacion exista
    if (!isOpen || !asignacion) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* CAMBIO 2: Overlay con fondo semitransparente correcto */}
                <div
                    className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm transition-opacity"
                    onClick={handleClose}
                />
                {/* CAMBIO 3: Asegurar que el modal esté por encima del overlay */}
                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-red-900">
                                        Finalizar Asignación
                                    </h3>
                                    <p className="text-sm text-red-700">
                                        Esta acción liberará la máquina y el operador
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                disabled={loading}
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                        {/* Información de la asignación */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <FaInfoCircle className="w-4 h-4 mr-2 text-gray-600" />
                                Detalles de la Asignación
                            </h4>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <FaTruck className="w-4 h-4 text-blue-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {asignacion.maquina?.nombre || asignacion.nombre_maquina || 'Nombre no disponible'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {asignacion.maquina?.patente || asignacion.patente || 'Patente no disponible'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <FaUser className="w-4 h-4 text-green-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {asignacion.operador?.nombre_completo ||
                                                `${asignacion.nombre || ''} ${asignacion.apellido || ''}`.trim() ||
                                                'Nombre no disponible'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {asignacion.operador?.rut || asignacion.rut || 'RUT no disponible'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <FaCalendarAlt className="w-4 h-4 text-purple-600 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Iniciada: {asignacion.fechaAsignacion || asignacion.fecha_asignacion || 'Fecha no disponible'}
                                        </p>
                                        {asignacion.diasActiva && (
                                            <p className="text-xs text-gray-500">
                                                {asignacion.diasActiva} días activa
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selección de motivo */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-900 mb-3">
                                Motivo de finalización
                            </label>

                            {/* Motivos predefinidos */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {motivosPredefinidos.map((motivoPredefinido, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => seleccionarMotivoPredefinido(motivoPredefinido)}
                                        disabled={loading}
                                        className={`px-3 py-2 text-sm rounded-md border transition-colors text-left ${motivo === motivoPredefinido
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {motivoPredefinido}
                                    </button>
                                ))}
                            </div>

                            {/* Campo de texto para motivo personalizado */}
                            {(motivoRequerido || motivo === 'Otro motivo' ||
                                !motivosPredefinidos.includes(motivo)) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Especifique el motivo:
                                        </label>
                                        <textarea
                                            value={motivo === 'Otro motivo' ? '' : motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                            placeholder="Ingrese el motivo de finalización..."
                                            disabled={loading}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                                            rows="3"
                                        />
                                        {motivoRequerido && !motivo.trim() && (
                                            <p className="text-red-600 text-xs mt-1">
                                                * El motivo es requerido
                                            </p>
                                        )}
                                    </div>
                                )}
                        </div>

                        {/* Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex">
                                <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">
                                        ¡Atención!
                                    </h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Al finalizar esta asignación, tanto la máquina como el operador
                                        quedarán disponibles para nuevas asignaciones.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmar}
                            disabled={loading || (motivoRequerido && !motivo.trim())}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Finalizando...
                                </>
                            ) : (
                                <>
                                    <FaStop className="w-4 h-4 mr-2" />
                                    Finalizar Asignación
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinalizarAsignacionModal;