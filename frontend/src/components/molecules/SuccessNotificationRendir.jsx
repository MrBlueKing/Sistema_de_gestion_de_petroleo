import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';

// 🎉 Componente de Notificación de Éxito
const SuccessNotificationRendir = ({ isVisible, onClose, title = "¡Éxito!", message = "Acción completada correctamente" }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Se cierra automáticamente después de 4 segundos
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-2xl max-w-md border border-green-400">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="bg-white bg-opacity-20 rounded-full p-1">
              <FaCheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-grow">
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-xs text-green-100 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-green-200 hover:text-white transition-colors"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔄 Componente de Loading Elegante
const LoadingButton = ({ isLoading, onClick, children, className = "", disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        relative inline-flex items-center justify-center
        transition-all duration-200
        ${isLoading ? 'cursor-not-allowed opacity-75' : 'hover:scale-105'}
        ${className}
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <FaSpinner className="h-4 w-4 animate-spin text-white" />
        </div>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
};

// 📋 Componente Principal - Ejemplo de Tabla con Rendición
const ExampleTableWithSuccess = () => {
  const [cargas, setCargas] = useState([
    {
      id: 1,
      boleta: "BOL-001",
      operador: "Juan Pérez",
      litros: 150,
      estado: "Por Rendir",
      maquina: "Excavadora CAT 320",
      ubicacion: "Faena Norte",
      fecha: "2025-01-15"
    },
    {
      id: 2,
      boleta: "BOL-002",
      operador: "María González",
      litros: 200,
      estado: "Por Rendir",
      maquina: "Bulldozer D6",
      ubicacion: "Faena Sur",
      fecha: "2025-01-16"
    },
  ]);

  const [notification, setNotification] = useState({ visible: false, title: "", message: "" });
  const [loadingCargas, setLoadingCargas] = useState({});
  const [selectedCarga, setSelectedCarga] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 🎯 Función para Rendir desde la Tabla Principal
  const handleRendirFromTable = async (cargaId) => {
    setLoadingCargas(prev => ({ ...prev, [cargaId]: true }));
    
    try {
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Actualizar estado local
      setCargas(prev => 
        prev.map(carga => 
          carga.id === cargaId 
            ? { ...carga, estado: "Rendido" }
            : carga
        )
      );

      // Mostrar notificación de éxito
      setNotification({
        visible: true,
        title: "🎉 Carga Rendida",
        message: "La carga ha sido marcada como rendida exitosamente"
      });

    } catch (error) {
      console.error("Error al rendir:", error);
      setNotification({
        visible: true,
        title: "❌ Error",
        message: "Hubo un problema al rendir la carga"
      });
    } finally {
      setLoadingCargas(prev => ({ ...prev, [cargaId]: false }));
    }
  };

  // 🎯 Función para Rendir desde el Modal
  const handleRendirFromModal = async () => {
    if (!selectedCarga) return;

    setLoadingCargas(prev => ({ ...prev, [selectedCarga.id]: true }));
    
    try {
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Actualizar estado en el modal
      setSelectedCarga(prev => ({ ...prev, estado: "Rendido" }));
      
      // Actualizar estado en la tabla principal
      setCargas(prev => 
        prev.map(carga => 
          carga.id === selectedCarga.id 
            ? { ...carga, estado: "Rendido" }
            : carga
        )
      );

      // Mostrar notificación de éxito
      setNotification({
        visible: true,
        title: "🎉 Rendición Exitosa",
        message: "La carga ha sido procesada correctamente desde el detalle"
      });

    } catch (error) {
      console.error("Error al rendir:", error);
    } finally {
      setLoadingCargas(prev => ({ ...prev, [selectedCarga.id]: false }));
    }
  };

  const closeNotification = () => {
    setNotification({ visible: false, title: "", message: "" });
  };

  const openModal = (carga) => {
    setSelectedCarga(carga);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCarga(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cargas Externas Recientes
        </h1>
        <p className="text-gray-600">
          Gestión de cargas con sistema de notificaciones elegante
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boleta / Operador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Máquina / Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Litros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargas.map((carga) => (
                <tr key={carga.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {carga.boleta}
                      </div>
                      <div className="text-sm text-gray-500">
                        {carga.operador}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{carga.maquina}</div>
                      <div className="text-sm text-gray-500">{carga.ubicacion}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{carga.litros} L</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      carga.estado === "Rendido" 
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {carga.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(carga)}
                        className="text-orange-600 hover:text-orange-900 transition-colors"
                      >
                        Ver
                      </button>
                      {carga.estado === "Por Rendir" && (
                        <LoadingButton
                          isLoading={loadingCargas[carga.id]}
                          onClick={() => handleRendirFromTable(carga.id)}
                          className="text-green-600 hover:text-green-900 font-medium transition-colors"
                        >
                          Rendir
                        </LoadingButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {modalOpen && selectedCarga && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalle de Carga - {selectedCarga.boleta}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">INFORMACIÓN GENERAL</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Operador:</span>
                      <p className="font-medium">{selectedCarga.operador}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Máquina:</span>
                      <p className="font-medium">{selectedCarga.maquina}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Ubicación:</span>
                      <p className="font-medium">{selectedCarga.ubicacion}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">CONSUMO</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Litros:</span>
                      <p className="font-medium text-lg">{selectedCarga.litros} L</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Estado:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        selectedCarga.estado === "Rendido" 
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {selectedCarga.estado}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Fecha:</span>
                      <p className="font-medium">{selectedCarga.fecha}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal con Botón de Rendir */}
            {selectedCarga.estado === "Por Rendir" && (
              <div className="flex items-center justify-end p-6 border-t border-gray-200">
                <LoadingButton
                  isLoading={loadingCargas[selectedCarga.id]}
                  onClick={handleRendirFromModal}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Rendir Carga
                </LoadingButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificación de Éxito */}
      <SuccessNotification
        isVisible={notification.visible}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
      />

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SuccessNotificationRendir;