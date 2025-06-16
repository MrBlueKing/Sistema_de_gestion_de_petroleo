import React, { useState, useEffect } from 'react';
import {
  FaCheckCircle,
  FaTruck,
  FaOilCan,
  FaBuilding,
  FaGasPump,
  FaArrowRight,
  FaSync,
  FaClock,
  FaChartLine,
  FaExclamationTriangle,
  FaHome,
  FaPlus
} from 'react-icons/fa';

// Función de utilidad para formatear números
const formatNumberWithSeparators = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0,00";
  }
  return parseFloat(num).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Componente de progreso circular
const CircularProgress = ({ percentage, size = 60, strokeWidth = 4, color = "#10b981" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

// Componente de animación de éxito
const SuccessAnimation = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="relative">
      <div className={`transform transition-all duration-500 ${animate ? 'scale-100 rotate-0' : 'scale-0 rotate-45'}`}>
        <div className="bg-green-100 p-4 rounded-full">
          <FaCheckCircle className="text-4xl text-green-600" />
        </div>
      </div>
      
      {/* Ondas de expansión */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`bg-green-400 rounded-full opacity-20 ${animate ? 'animate-ping' : ''}`} 
             style={{ width: '100px', height: '100px' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`bg-green-300 rounded-full opacity-10 ${animate ? 'animate-ping' : ''}`}
             style={{ width: '120px', height: '120px', animationDelay: '0.5s' }} />
      </div>
    </div>
  );
};

// COMPONENTE MODAL PROFESIONAL DE ÉXITO
const ModalExitoTrasvasijeProfesional = ({ 
  isOpen, 
  onConfirm, 
  onNewTransfer, 
  onGoHome, 
  datosTrasvasije 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    litrosTransferidos,
    estanqueMovil,
    estanquesFijos,
    diferenciaMedicion,
    verificado,
    numeroTrasvasije,
    fechaTrasvasije
  } = datosTrasvasije || {};

  // Calcular precisión del trasvasije
  const calcularPrecision = () => {
    if (!diferenciaMedicion || !litrosTransferidos) return 100;
    const porcentajeError = Math.abs(diferenciaMedicion / litrosTransferidos) * 100;
    return Math.max(0, 100 - porcentajeError);
  };

  // Determinar estado del trasvasije
  const obtenerEstadoTrasvasije = () => {
    const precision = calcularPrecision();
    if (precision >= 98) return { estado: 'excelente', color: 'green', icono: FaCheckCircle };
    if (precision >= 95) return { estado: 'bueno', color: 'blue', icono: FaChartLine };
    if (precision >= 90) return { estado: 'aceptable', color: 'yellow', icono: FaExclamationTriangle };
    return { estado: 'revisar', color: 'red', icono: FaExclamationTriangle };
  };

  // Manejar confirmación con procesamiento
  const handleConfirmWithProcessing = async (action) => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular procesamiento
      
      switch (action) {
        case 'continue':
          onConfirm?.();
          break;
        case 'new':
          onNewTransfer?.();
          break;
        case 'home':
          onGoHome?.();
          break;
        default:
          onConfirm?.();
      }
    } catch (error) {
      console.error('Error en procesamiento:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-close countdown (opcional)
  useEffect(() => {
    if (isOpen && countdown === null) {
      // Opcional: auto-cerrar después de 30 segundos
      // setCountdown(30);
    }
  }, [isOpen, countdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleConfirmWithProcessing('continue');
    }
  }, [countdown]);

  if (!isOpen) return null;

  const estadoTrasvasije = obtenerEstadoTrasvasije();
  const precision = calcularPrecision();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fadeInScale">
        
        {/* Header con animación de éxito */}
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 px-8 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SuccessAnimation />
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  ¡Trasvasije Completado!
                </h2>
                <p className="text-green-100 text-sm flex items-center">
                  <FaClock className="mr-2" />
                  {new Date().toLocaleString('es-CL')}
                </p>
              </div>
            </div>
            
            {/* Indicador de precisión */}
            <div className="text-center">
              <CircularProgress 
                percentage={precision} 
                size={70}
                color="#ffffff"
              />
              <p className="text-xs text-green-100 mt-1">Precisión</p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-grow overflow-y-auto p-6">
          
          {/* Resumen del trasvasije */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Estanque Origen */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 transform hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 p-3 rounded-xl mr-3 shadow-lg">
                  <FaTruck className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800">Estanque Origen</h3>
                  <p className="text-blue-600 text-sm">Móvil</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 text-sm font-medium">Nombre:</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {estanqueMovil}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 text-sm font-medium">Transferido:</span>
                  <span className="font-bold text-blue-900">
                    {formatNumberWithSeparators(litrosTransferidos)} L
                  </span>
                </div>
              </div>
            </div>

            {/* Proceso de Transferencia */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 p-3 rounded-xl mr-3 shadow-lg">
                  <FaOilCan className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-800">Transferencia</h3>
                  <p className="text-purple-600 text-sm">Detalles del proceso</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 text-sm font-medium">Volumen:</span>
                  <span className="font-bold text-purple-900">
                    {formatNumberWithSeparators(litrosTransferidos)} L
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 text-sm font-medium">Diferencia:</span>
                  <span className={`font-bold text-sm ${
                    Math.abs(diferenciaMedicion) <= 2 ? 'text-green-600' : 
                    Math.abs(diferenciaMedicion) <= 5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {diferenciaMedicion > 0 ? '+' : ''}{formatNumberWithSeparators(diferenciaMedicion)} L
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 text-sm font-medium">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    estadoTrasvasije.estado === 'excelente' ? 'bg-green-100 text-green-800' :
                    estadoTrasvasije.estado === 'bueno' ? 'bg-blue-100 text-blue-800' :
                    estadoTrasvasije.estado === 'aceptable' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {estadoTrasvasije.estado.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Estanque Destino */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200 transform hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 p-3 rounded-xl mr-3 shadow-lg">
                  <FaBuilding className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800">Estanque Destino</h3>
                  <p className="text-green-600 text-sm">Fijo</p>
                </div>
              </div>
              <div className="space-y-2">
                {estanquesFijos?.map((estanque, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-green-700 text-sm font-medium">{estanque.nombre}:</span>
                    <span className="font-bold text-green-900 text-sm">
                      {formatNumberWithSeparators(estanque.litros)} L
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detalles expandibles */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors rounded-xl"
            >
              <div className="flex items-center">
                <FaGasPump className="mr-3 text-gray-600" />
                <span className="font-semibold text-gray-800">Detalles Técnicos del Trasvasije</span>
              </div>
              <div className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
                <FaArrowRight className="text-gray-400" />
              </div>
            </button>
            
            {showDetails && (
              <div className="px-6 pb-4 space-y-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Información del Proceso</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Número de trasvasije:</span>
                        <span className="font-medium">{numeroTrasvasije || 'Auto-generado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha y hora:</span>
                        <span className="font-medium">{fechaTrasvasije || new Date().toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verificación:</span>
                        <span className={`font-medium ${verificado ? 'text-green-600' : 'text-amber-600'}`}>
                          {verificado ? '✓ Verificado' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Análisis de Precisión</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precisión general:</span>
                        <span className="font-bold text-green-600">{precision.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margen de error:</span>
                        <span className="font-medium">{((Math.abs(diferenciaMedicion) / litrosTransferidos) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Evaluación:</span>
                        <span className={`font-medium ${
                          estadoTrasvasije.estado === 'excelente' ? 'text-green-600' :
                          estadoTrasvasije.estado === 'bueno' ? 'text-blue-600' :
                          estadoTrasvasije.estado === 'aceptable' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {estadoTrasvasije.estado === 'excelente' ? 'Excelente precisión' :
                           estadoTrasvasije.estado === 'bueno' ? 'Buena precisión' :
                           estadoTrasvasije.estado === 'aceptable' ? 'Precisión aceptable' :
                           'Requiere revisión'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de estado */}
          <div className={`rounded-xl p-4 mb-6 ${
            estadoTrasvasije.estado === 'excelente' ? 'bg-green-100 border border-green-300' :
            estadoTrasvasije.estado === 'bueno' ? 'bg-blue-100 border border-blue-300' :
            estadoTrasvasije.estado === 'aceptable' ? 'bg-yellow-100 border border-yellow-300' :
            'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center">
              <estadoTrasvasije.icono className={`mr-3 text-lg ${
                estadoTrasvasije.estado === 'excelente' ? 'text-green-600' :
                estadoTrasvasije.estado === 'bueno' ? 'text-blue-600' :
                estadoTrasvasije.estado === 'aceptable' ? 'text-yellow-600' :
                'text-red-600'
              }`} />
              <div>
                <p className={`font-semibold ${
                  estadoTrasvasije.estado === 'excelente' ? 'text-green-800' :
                  estadoTrasvasije.estado === 'bueno' ? 'text-blue-800' :
                  estadoTrasvasije.estado === 'aceptable' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {estadoTrasvasije.estado === 'excelente' ? '¡Trasvasije ejecutado con excelente precisión!' :
                   estadoTrasvasije.estado === 'bueno' ? 'Trasvasije completado con buena precisión' :
                   estadoTrasvasije.estado === 'aceptable' ? 'Trasvasije completado - Precisión dentro del rango aceptable' :
                   'Trasvasije completado - Se recomienda revisar las mediciones'}
                </p>
                <p className={`text-sm ${
                  estadoTrasvasije.estado === 'excelente' ? 'text-green-700' :
                  estadoTrasvasije.estado === 'bueno' ? 'text-blue-700' :
                  estadoTrasvasije.estado === 'aceptable' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  Los datos han sido registrados correctamente en el sistema.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones de acción */}
        <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
          {isProcessing ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-3">
                <FaSync className="animate-spin text-blue-500 text-lg" />
                <span className="text-gray-700 font-medium">Procesando solicitud...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              
              {/* Botón secundario - Ir al inicio */}
              <button
                onClick={() => handleConfirmWithProcessing('home')}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all shadow-sm order-3 sm:order-1"
              >
                <FaHome className="mr-2" />
                Ir al Inicio
              </button>

              {/* Botón principal - Nuevo trasvasije */}
              <button
                onClick={() => handleConfirmWithProcessing('new')}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-sm order-2"
              >
                <FaPlus className="mr-2" />
                Nuevo Trasvasije
              </button>

              {/* Botón de continuación */}
              <button
                onClick={() => handleConfirmWithProcessing('continue')}
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all shadow-md order-1 sm:order-3"
              >
                <span>Continuar</span>
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          )}

          {countdown !== null && (
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                Se cerrará automáticamente en {countdown} segundos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalExitoTrasvasijeProfesional;