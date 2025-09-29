import React from 'react';
import {
  FaTimes,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";

const ModalValidacion = ({ isOpen, onClose, onContinue, validacion }) => {
  // 🔒 PREVENIR SCROLL DEL BODY CUANDO EL MODAL ESTÁ ABIERTO
  React.useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;

      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restaurar scroll cuando se cierre el modal
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !validacion) return null;

  const esError = validacion.severidad === 'error';
  const esWarning = validacion.severidad === 'warning';
  const esInfo = validacion.severidad === 'info';

  // 🔒 PREVENIR CIERRE DEL MODAL AL HACER CLICK EN OVERLAY PARA ERRORES CRÍTICOS
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !esError) {
      onClose();
    }
  };

  // 🎨 Función para obtener los colores según el tipo de validación
  const getColorClasses = () => {
    if (esError) {
      return {
        headerBar: 'bg-red-500',
        headerBg: 'bg-red-500',
        headerText: 'text-white',
        icon: 'text-red-500',
        cardBorder: 'bg-red-50 border-red-200 border-l-red-400',
        messageText: 'text-red-800',
        valueText: 'text-red-600',
        button: 'bg-red-500 hover:bg-red-600',
        cancelButton: 'border-red-300 text-red-700 hover:bg-red-50'
      };
    } else if (esWarning) {
      return {
        headerBar: 'bg-orange-500',
        headerBg: 'bg-orange-500',
        headerText: 'text-white',
        icon: 'text-orange-500',
        cardBorder: 'bg-orange-50 border-orange-200 border-l-orange-400',
        messageText: 'text-orange-800',
        valueText: 'text-orange-600',
        button: 'bg-orange-500 hover:bg-orange-600',
        cancelButton: 'border-orange-300 text-orange-700 hover:bg-orange-50'
      };
    } else {
      return {
        headerBar: 'bg-blue-500',
        headerBg: 'bg-blue-500',
        headerText: 'text-white',
        icon: 'text-blue-500',
        cardBorder: 'bg-blue-50 border-blue-200 border-l-blue-400',
        messageText: 'text-blue-800',
        valueText: 'text-blue-600',
        button: 'bg-blue-500 hover:bg-blue-600',
        cancelButton: 'border-blue-300 text-blue-700 hover:bg-blue-50'
      };
    }
  };

  const colors = getColorClasses();

  // 🎨 Función para obtener el ícono apropiado
  const getIcon = () => {
    if (esError) return <FaExclamationCircle className={`w-6 h-6 ${colors.icon}`} />;
    if (esWarning) return <FaExclamationTriangle className={`w-6 h-6 ${colors.icon}`} />;
    return <FaInfoCircle className={`w-6 h-6 ${colors.icon}`} />;
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* 📱 OVERLAY MÓVIL OPTIMIZADO */}
      <div
        className={`fixed inset-0 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'bg-transparent bg-opacity-50 backdrop-blur-sm'
            : 'bg-transparent'
        }`}
        onClick={handleOverlayClick}
        style={{ touchAction: 'none' }}
      />

      {/* 📱 CONTENEDOR MODAL CENTRADO */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        {/* 📱 MODAL SIN SCROLL INTERNO */}
        <div
          className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${
            isOpen
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-4'
          } 
          bg-white rounded-2xl shadow-2xl overflow-hidden`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          {/* 🎨 BARRA SUPERIOR */}
          <div className={`h-1 ${colors.headerBar}`} />

          {/* 📱 HEADER DEL MODAL */}
          <div className={`${colors.headerBg} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3
                id="modal-headline"
                className={`text-lg font-semibold ${colors.headerText}`}
              >
                {esError ? 'Error de Validación' : esWarning ? 'Advertencia' : 'Información'}
              </h3>
            </div>
            
            {/* 🚪 BOTÓN CERRAR - SOLO SI NO ES ERROR CRÍTICO */}
            {!esError && (
              <button
                onClick={onClose}
                className={`${colors.headerText} hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors`}
                aria-label="Cerrar modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 📱 CONTENIDO DEL MODAL */}
          <div className="p-6">
            {/* 📱 TARJETA DE VALIDACIÓN */}
            <div className={`rounded-lg p-4 border-l-4 ${colors.cardBorder}`}>
              {/* 📱 MENSAJE PRINCIPAL */}
              <div className="mb-4">
                <p className={`text-sm font-medium ${colors.messageText}`}>
                  {validacion.mensaje}
                </p>
              </div>

              {/* 📱 DETALLES NUMÉRICOS */}
              {validacion.detalles && (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {validacion.tipo === 'numeral_inicial' ? 'Numeral Ingresado' : 'Valor Ingresado'}
                        </p>
                        <p className={`text-xl font-bold ${colors.valueText}`}>
                          {validacion.detalles.valorActual?.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {validacion.tipo === 'horometro' ? 'hrs' : validacion.tipo === 'numeral_inicial' ? 'L' : 'km'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {validacion.tipo === 'numeral_inicial' ? 'Numeral Sugerido' : 'Última Medición'}
                        </p>
                        <p className="text-xl font-bold text-gray-600">
                          {(validacion.detalles.valorAnterior || validacion.detalles.valorMinimo)?.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {validacion.tipo === 'horometro' ? 'hrs' : validacion.tipo === 'numeral_inicial' ? 'L' : 'km'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 📱 DIFERENCIA CALCULADA */}
                  {validacion.detalles.diferencia !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {validacion.tipo === 'horometro' ? 'Diferencia en Horas' : 'Diferencia en Kilometraje'}
                        </p>
                        <p className={`text-lg font-bold ${colors.valueText}`}>
                          {Math.abs(validacion.detalles.diferencia).toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {validacion.tipo === 'horometro' ? 'hrs' : 'km'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 📱 SUGERENCIA ADICIONAL */}
                  {validacion.detalles.sugerencia && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">
                        💡 {validacion.detalles.sugerencia}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 📱 BOTONES DE ACCIÓN */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end">
            {/* Botón Cancelar/Cerrar */}
            {!esError && (
              <button
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto px-4 py-2 border rounded-lg font-medium text-sm transition-colors ${colors.cancelButton}`}
              >
                Cancelar
              </button>
            )}

            {/* Botón Continuar */}
            <button
              type="button"
              onClick={onContinue}
              className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors ${colors.button}`}
            >
              {esError ? 'Entendido' : 'Continuar Igual'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalValidacion;