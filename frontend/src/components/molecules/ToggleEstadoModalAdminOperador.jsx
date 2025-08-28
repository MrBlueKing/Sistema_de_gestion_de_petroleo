import React from 'react';
import { FaUserCheck, FaUserSlash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ToggleEstadoModalAdminOperador = ({
    isOpen,
    onClose,
    onConfirm,
    usuario,
    accion, // 'activar' o 'desactivar'
    loading = false
}) => {
    if (!isOpen || !usuario) return null;

    const isActivating = accion === 'activar';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0 ">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            {/* Ícono */}
                            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isActivating
                                    ? 'bg-green-100'
                                    : 'bg-yellow-100'
                                }`}>
                                {isActivating ? (
                                    <FaUserCheck className="h-6 w-6 text-green-600" />
                                ) : (
                                    <FaUserSlash className="h-6 w-6 text-yellow-600" />
                                )}
                            </div>

                            {/* Contenido */}
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
                                    {isActivating ? 'Activar Usuario' : 'Desactivar Usuario'}
                                </h3>

                                {/* Información del usuario */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-sm">
                                                    {usuario.nombre?.charAt(0)}{usuario.apellido?.charAt(0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {usuario.nombre} {usuario.apellido}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {usuario.email}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                RUT: {usuario.rut}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensaje de confirmación */}
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {isActivating ? (
                                            <>
                                                ¿Está seguro de que desea <strong className="text-green-600">activar</strong> a este usuario?
                                                <br />
                                                <span className="text-xs text-gray-400 mt-1 block">
                                                    El usuario podrá acceder al sistema nuevamente.
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                ¿Está seguro de que desea <strong className="text-yellow-600">desactivar</strong> a este usuario?
                                                <br />
                                                <span className="text-xs text-gray-400 mt-1 block">
                                                    El usuario no podrá acceder al sistema hasta ser reactivado.
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>

                                {/* Advertencia adicional para desactivación */}
                                {!isActivating && (
                                    <div className="mt-3 flex items-start space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <FaExclamationTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-yellow-700 font-medium">
                                                Atención
                                            </p>
                                            <p className="text-xs text-yellow-600 mt-1">
                                                Esta acción suspenderá temporalmente el acceso del usuario al sistema.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer con botones */}
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        {/* Botón confirmar */}
                        <button
                            type="button"
                            className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${isActivating
                                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                    : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Procesando...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    {isActivating ? (
                                        <FaUserCheck className="h-4 w-4 mr-2" />
                                    ) : (
                                        <FaUserSlash className="h-4 w-4 mr-2" />
                                    )}
                                    {isActivating ? 'Activar Usuario' : 'Desactivar Usuario'}
                                </div>
                            )}
                        </button>

                        {/* Botón cancelar */}
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <FaTimes className="h-4 w-4 mr-2" />
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToggleEstadoModalAdminOperador;