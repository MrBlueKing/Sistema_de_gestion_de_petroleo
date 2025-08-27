// src/components/molecules/SuccessModal.jsx
import React, { useEffect } from 'react';
import { 
    FaCheckCircle, 
    FaTimes, 
    FaUser, 
    FaIdCard, 
    FaEnvelope, 
    FaBuilding,
    FaUserPlus,
    FaEdit
} from 'react-icons/fa';

const SuccessModalAdminOperador = ({ 
    isVisible, 
    onClose, 
    userData, 
    type = 'create', // 'create' o 'update'
    autoCloseTime = 5000 
}) => {
    // Auto cerrar el modal después de X tiempo
    useEffect(() => {
        if (isVisible && autoCloseTime > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseTime);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoCloseTime, onClose]);

    if (!isVisible) return null;

    const isUpdate = type === 'update';
    const title = isUpdate ? 'Usuario Actualizado' : 'Usuario Creado';
    const subtitle = isUpdate 
        ? 'La información del usuario ha sido actualizada correctamente'
        : 'El nuevo usuario ha sido creado exitosamente';
    const icon = isUpdate ? FaEdit : FaUserPlus;
    const IconComponent = icon;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay */}
                <div
                    className="fixed inset-0 bg-transparent bg-opacity-50 transition-opacity"
                    onClick={onClose}
                />
                
                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-bounce-in">
                    {/* Header con animación de éxito */}
                    <div className="bg-gradient-to-r from-green-400 to-green-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <FaCheckCircle className="w-8 h-8 text-white animate-pulse" />
                                        <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-white">
                                        {title}
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        {subtitle}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-green-100 transition-colors p-1 rounded-full hover:bg-white/10"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="bg-white px-6 py-4">
                        {/* Icono central */}
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 rounded-full p-4">
                                <IconComponent className="w-12 h-12 text-green-600" />
                            </div>
                        </div>

                        {/* Información del usuario */}
                        {userData && (
                            <div className="space-y-4">
                                <div className="text-center pb-4 border-b border-gray-200">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                        {userData.nombre_completo || `${userData.nombre} ${userData.apellido}`}
                                    </h4>
                                    <p className="text-gray-500 text-sm">Operador de Vehículo</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* RUT */}
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <FaIdCard className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">RUT</p>
                                            <p className="text-sm text-gray-600">{userData.rut}</p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    {userData.email && (
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <FaEnvelope className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Email</p>
                                                <p className="text-sm text-gray-600">{userData.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Faena */}
                                    {userData.faena && (
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <FaBuilding className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Faena</p>
                                                <p className="text-sm text-gray-600">{userData.faena}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Estado */}
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <FaUser className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Estado</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                userData.activo 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {userData.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensaje adicional */}
                                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-800">
                                        <FaCheckCircle className="inline w-4 h-4 mr-2" />
                                        {isUpdate 
                                            ? 'Los cambios se han guardado correctamente y están disponibles inmediatamente.'
                                            : 'El usuario ya puede acceder al sistema con sus credenciales.'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Este mensaje se cerrará automáticamente en unos segundos
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuccessModalAdminOperador;