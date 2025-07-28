import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaFilePdf, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaTimes, FaDownload } from 'react-icons/fa';
import pdfService from '../services/pdfService';
import axios from '../../lib/axios';

const PDFGenerator = ({
  consumos = [],
  stats = {},
  filters = {},
  totalItems = 0,
  currentPage = 1,
  user = null,
  className = "",
  size = "small",
  disabled = false
}) => {
  // Estados del componente
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalData, setModalData] = useState({});

  // Mostrar modal bonito
  const showSuccessModal = (totalRecords, fileName) => {
    setModalType('success');
    setModalData({
      title: '🎉 PDF Generado con Éxito',
      message: 'Tu reporte de consumos ha sido descargado correctamente',
      totalRecords,
      fileName,
      icon: <FaCheckCircle className="text-green-500 text-4xl" />
    });
    setShowModal(true);
  };

  const showErrorModal = (errorType) => {
    setModalType('error');
    if (errorType === 'auth') {
      setModalData({
        title: '🔒 Sesión Expirada',
        message: 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.',
        action: 'Recargar Página',
        icon: <FaExclamationTriangle className="text-red-500 text-4xl" />
      });
    } else {
      setModalData({
        title: '❌ Error al Generar PDF',
        message: 'No se pudo generar el archivo PDF. Por favor, intenta nuevamente.',
        action: 'Intentar de Nuevo',
        icon: <FaExclamationTriangle className="text-red-500 text-4xl" />
      });
    }
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    if (modalData.action === 'Recargar Página') {
      window.location.reload();
    }
  };

  // 🆕 FUNCIÓN MEJORADA PARA OBTENER TODOS LOS CONSUMOS CON LÓGICA DE FAENAS
  const getAllConsumos = async () => {
    const token = JSON.parse(localStorage.getItem("authToken"))?.token;
    if (!token) throw new Error('Sin token');

    const params = new URLSearchParams({
      page: 1,
      per_page: 9999,
    });

    // 🔧 LÓGICA DE FAENAS COPIADA DE ConsumosView
    if (filters?.faenaSeleccionada === 'todas') {
      // Si es "todas", necesitamos obtener todas las faenas disponibles desde el filtro
      const todasLasFaenas = filters.faenas || [];
      
      if (todasLasFaenas.length > 0) {
        const idsTodasFaenas = todasLasFaenas.map(f => f.value).join(',');
        params.append('faenas', idsTodasFaenas); // Enviar como "faenas" (plural)
        console.log("PDF: Buscando en todas las faenas:", idsTodasFaenas);
      } else {
        // Fallback: si no tenemos faenas cargadas, usar faena del usuario
        if (!user?.id_faena) {
          throw new Error('Usuario sin faena asignada');
        }
        params.append('faena', user.id_faena);
        console.log("PDF: Fallback usando faena del usuario:", user.id_faena);
      }
    } else if (filters?.faenaSeleccionada && filters.faenaSeleccionada !== 'todas') {
      // Si es una faena específica, enviar esa faena
      params.append('faena', filters.faenaSeleccionada);
      console.log("PDF: Buscando en faena específica:", filters.faenaSeleccionada);
    } else {
      // Si no hay filtro de faena, usar la faena del usuario por defecto (perfil bombero)
      if (!user?.id_faena) {
        throw new Error('Usuario sin faena asignada');
      }
      params.append('faena', user.id_faena);
      console.log("PDF: Usando faena del usuario por defecto:", user.id_faena);
    }

    // Agregar otros filtros
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.equipoFilter) params.append('equipoFilter', filters.equipoFilter);

    const response = await axios.get(`/api/consumosFecha?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.success) throw new Error('Error API');

    return {
      consumos: response.data.data || [],
      stats: response.data.stats || stats,
      totalReal: response.data.pagination?.total || 0
    };
  };

  // Generar PDF
  const handleClick = async () => {
    if (totalItems === 0 || generating || disabled) return;

    setGenerating(true);

    try {
      const allData = await getAllConsumos();
      
      const pdfData = {
        consumos: allData.consumos,
        stats: allData.stats,
        filters,
        totalItems: allData.totalReal,
        currentPage: 1,
        // 🆕 PASAR USER Y FILTERS AL PDF SERVICE
        user,
        filters
      };

      const result = await pdfService.generateConsumptionPDF(pdfData);
      showSuccessModal(allData.totalReal, result.fileName);

    } catch (error) {
      console.error('Error generando PDF:', error);
      if (error.message.includes('token') || error.message.includes('faena')) {
        showErrorModal('auth');
      } else {
        showErrorModal('general');
      }
    }

    setGenerating(false);
  };

  // Estilos del botón
  const buttonDisabled = disabled || totalItems === 0 || generating;
  const buttonClass = `
    relative overflow-hidden flex items-center justify-center gap-2 rounded-xl font-semibold 
    transition-all duration-300 transform group px-3 sm:px-4 py-2 text-xs sm:text-sm
    ${buttonDisabled
      ? "bg-gray-500 text-white cursor-not-allowed opacity-50"
      : "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl hover:shadow-orange-200/50 hover:scale-105"
    }
  `;

  return (
    <div className={className}>
      {/* Botón PDF */}
      <button onClick={handleClick} disabled={buttonDisabled} className={buttonClass}>
        {/* Efecto brillo */}
        {!buttonDisabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
        
        {/* Icono */}
        <span className={`text-lg sm:text-xl transition-transform duration-300 z-10 ${!buttonDisabled ? "group-hover:rotate-6" : ""}`}>
          {generating ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
        </span>
        
        {/* Texto */}
        <span className={`font-medium z-10 transition-all duration-300 ${!buttonDisabled ? "group-hover:tracking-wide" : ""}`}>
          {generating ? "Generando..." : "Generar PDF"}
        </span>
      </button>

      {/* Modal usando Portal */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          {/* Modal Container */}
          <div className={`
            bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300
            ${showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}>
            {/* Header del Modal */}
            <div className={`
              relative px-6 py-6 rounded-t-2xl
              ${modalType === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                : 'bg-gradient-to-r from-red-50 to-pink-50'
              }
            `}>
              {/* Botón cerrar */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-white/50"
              >
                <FaTimes className="text-lg" />
              </button>

              {/* Icono principal */}
              <div className="flex justify-center mb-4">
                {modalData.icon}
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                {modalData.title}
              </h3>

              {/* Mensaje */}
              <p className="text-gray-600 text-center leading-relaxed">
                {modalData.message}
              </p>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4">
              {modalType === 'success' && (
                <div className="space-y-3">
                  {/* Estadísticas del PDF */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">📊 Registros incluidos:</span>
                      <span className="font-bold text-green-600">
                        {modalData.totalRecords?.toLocaleString()}
                      </span>
                    </div>
                    {modalData.fileName && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">📁 Archivo:</span>
                        <span className="font-medium text-gray-800 text-xs truncate max-w-[150px]">
                          {modalData.fileName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">⏰ Generado:</span>
                      <span className="font-medium text-gray-800">
                        {new Date().toLocaleTimeString('es-CL')}
                      </span>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <FaDownload className="text-lg" />
                      <span className="font-medium">Descarga Completada</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      El archivo PDF ha sido descargado automáticamente a tu dispositivo
                    </p>
                  </div>
                </div>
              )}

              {modalType === 'error' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {modalData.action === 'Recargar Página' 
                      ? 'Haz clic en el botón para recargar la página.'
                      : 'Verifica tu conexión a internet e intenta nuevamente.'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                {modalType === 'error' && modalData.action && (
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    {modalData.action}
                  </button>
                )}
                
                <button
                  onClick={() => setShowModal(false)}
                  className={`
                    px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105
                    ${modalType === 'success'
                      ? 'flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : modalData.action 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                    }
                  `}
                >
                  {modalType === 'success' ? '¡Perfecto!' : 'Cerrar'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PDFGenerator;