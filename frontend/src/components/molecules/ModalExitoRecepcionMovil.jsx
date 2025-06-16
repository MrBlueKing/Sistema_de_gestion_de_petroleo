import React from 'react';
import { 
    FaCheckCircle, 
    FaTruck, 
    FaFileInvoice, 
    FaGasPump,
    FaCalendarAlt,
    FaTimes
} from 'react-icons/fa';

const ModalExitoRecepcionMovil = ({ isOpen, onConfirm, datosRecepcion }) => {
    if (!isOpen || !datosRecepcion) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('es-CL').format(number);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-scale-in">
                
                {/* Header del modal */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 relative">
                    <div className="flex items-start sm:items-center justify-between">
                        <div className="flex items-start sm:items-center space-x-3 flex-1 pr-2">
                            <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3 flex-shrink-0">
                                <FaCheckCircle className="text-xl sm:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold leading-tight">¡Compra Registrada!</h2>
                                <p className="text-green-100 text-xs sm:text-sm mt-1 leading-tight">
                                    El combustible se ha agregado exitosamente al estanque móvil
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onConfirm}
                            className="text-white hover:text-gray-200 transition-colors p-2 flex-shrink-0 -mt-1"
                        >
                            <FaTimes size={18} className="sm:text-xl" />
                        </button>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-180px)]">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        
                        {/* Resumen de la operación */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
                            <h3 className="font-semibold text-green-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                                <FaGasPump className="mr-2 flex-shrink-0" />
                                Resumen de la Compra
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Información del documento - Stack en móvil */}
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm">
                                        <div className="flex items-center mb-1 sm:mb-0">
                                            <FaFileInvoice className="text-green-600 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600 font-medium">N° Factura/Boleta:</span>
                                        </div>
                                        <span className="font-bold text-gray-800 sm:ml-2 break-all">
                                            {datosRecepcion.numeroFactura}
                                        </span>
                                    </div>
                                    
                                    {datosRecepcion.numeroGuia && (
                                        <div className="flex flex-col sm:flex-row sm:items-center text-sm">
                                            <div className="flex items-center mb-1 sm:mb-0">
                                                <FaFileInvoice className="text-green-600 mr-2 flex-shrink-0" />
                                                <span className="text-gray-600 font-medium">N° Guía:</span>
                                            </div>
                                            <span className="font-bold text-gray-800 sm:ml-2 break-all">
                                                {datosRecepcion.numeroGuia}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm">
                                        <div className="flex items-center mb-1 sm:mb-0">
                                            <FaCalendarAlt className="text-green-600 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600 font-medium">Fecha:</span>
                                        </div>
                                        <span className="font-medium text-gray-800 sm:ml-2">
                                            {new Date().toLocaleDateString('es-CL', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Información del combustible - Grid responsivo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-green-100">
                                        <div className="text-center">
                                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                                                {formatNumber(datosRecepcion.litrosComprados)} L
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600">Combustible agregado</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-3 border border-green-100">
                                        <div className="text-center">
                                            <div className="text-lg sm:text-xl font-bold text-green-600">
                                                {formatCurrency(datosRecepcion.precioTotal)}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-600 leading-tight">
                                                Total pagado<br className="sm:hidden" />
                                                <span className="hidden sm:inline"> (</span>
                                                <span className="sm:hidden">Precio: </span>
                                                {formatCurrency(datosRecepcion.precioLitro)}/L
                                                <span className="hidden sm:inline">)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Información del estanque */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
                            <h3 className="font-semibold text-blue-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                                <FaTruck className="mr-2 flex-shrink-0" />
                                Estanque Destino
                            </h3>
                            
                            {/* Grid responsivo para información del estanque */}
                            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
                                <div className="text-center bg-white rounded-lg p-3 sm:bg-transparent sm:p-0">
                                    <div className="text-base sm:text-lg font-bold text-blue-600 break-words">
                                        {datosRecepcion.estanqueNombre}
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-700">Estanque móvil</div>
                                </div>
                                
                                <div className="text-center bg-white rounded-lg p-3 sm:bg-transparent sm:p-0">
                                    <div className="text-base sm:text-lg font-bold text-blue-600">
                                        {formatNumber(datosRecepcion.stockAnterior)} L
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-700">Stock anterior</div>
                                </div>
                                
                                <div className="text-center bg-white rounded-lg p-3 sm:bg-transparent sm:p-0">
                                    <div className="text-base sm:text-lg font-bold text-green-600">
                                        {formatNumber(datosRecepcion.stockNuevo)} L
                                    </div>
                                    <div className="text-xs sm:text-sm text-green-700">Stock actual</div>
                                </div>
                            </div>
                            
                            {/* Barra de progreso del estanque */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs sm:text-sm text-blue-700 mb-2">
                                    <span>Capacidad utilizada</span>
                                    <span className="font-medium">
                                        {((datosRecepcion.stockNuevo / datosRecepcion.capacidadTotal) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2 sm:h-3">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 sm:h-3 rounded-full transition-all duration-700"
                                        style={{ 
                                            width: `${Math.min((datosRecepcion.stockNuevo / datosRecepcion.capacidadTotal) * 100, 100)}%` 
                                        }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 text-center">
                                    {formatNumber(datosRecepcion.stockNuevo)} / {formatNumber(datosRecepcion.capacidadTotal)} Litros
                                </div>
                            </div>
                        </div>

                        {/* Observaciones si las hay */}
                        {datosRecepcion.observacion && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <h4 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">Observaciones:</h4>
                                <p className="text-yellow-700 text-sm break-words">{datosRecepcion.observacion}</p>
                            </div>
                        )}

                        {/* Mensaje de confirmación */}
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                            <p className="text-gray-700 text-xs sm:text-sm">
                                ✅ La operación se ha registrado correctamente en el sistema
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer con botón - Fijo en la parte inferior */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
                    <button
                        onClick={onConfirm}
                        className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-3 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                        <FaCheckCircle className="flex-shrink-0" />
                        <span>Continuar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalExitoRecepcionMovil;