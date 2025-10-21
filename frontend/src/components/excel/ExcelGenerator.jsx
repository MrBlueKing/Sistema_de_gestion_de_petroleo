// 📁 frontend/src/components/ExcelGenerator.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaFileExcel, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaTimes, FaDownload } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import axios from '../../lib/axios';
import { FAENA_COLORS } from '../../context/faenaColor'; // ✅ IMPORTAR desde el archivo correcto

const ExcelGenerator = ({
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
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalData, setModalData] = useState({});

  const showSuccessModal = (totalRecords, fileName) => {
    setModalType('success');
    setModalData({
      title: '🎉 Excel Generado con Éxito',
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
    } else if (errorType === 'noFaenas') {
      setModalData({
        title: '⚠️ Sin Faenas',
        message: 'No se pudieron determinar las faenas seleccionadas.',
        action: 'Cerrar',
        icon: <FaExclamationTriangle className="text-yellow-500 text-4xl" />
      });
    } else {
      setModalData({
        title: '❌ Error al Generar Excel',
        message: 'No se pudo generar el archivo Excel. Por favor, intenta nuevamente.',
        action: 'Intentar de Nuevo',
        icon: <FaExclamationTriangle className="text-red-500 text-4xl" />
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalData.action === 'Recargar Página') {
      window.location.reload();
    }
  };

  // 🆕 FUNCIÓN CORREGIDA - Obtener TODOS los consumos (con paginación)
  const getAllConsumos = async () => {
    const token = JSON.parse(localStorage.getItem("authToken"))?.token;
    if (!token) throw new Error("Sin token");

    console.log("🔍 Excel: Filters recibidos:", filters);
    console.log("🔍 Excel: User:", user);
    console.log("🔍 Excel: Total items esperados:", totalItems);

    // 🔑 PASO 1: Construir parámetros base
    const construirParams = (pagina, perPage = 100) => {
      const params = new URLSearchParams({
        page: pagina.toString(),
        per_page: perPage.toString(),
      });

      // 🆕 LÓGICA PARA HistorialMaquinasView
      if (filters?.selectedFaenas && Array.isArray(filters.selectedFaenas)) {
        console.log("🎯 Excel: Procesando faenas de HistorialMaquinasView:", filters.selectedFaenas);

        const faenaIds = filters.selectedFaenas
          .map((faenaNombre) => {
            const faenaEntry = Object.entries(FAENA_COLORS).find(
              ([id, colors]) => {
                return colors.name?.toLowerCase() === faenaNombre.toLowerCase();
              }
            );

            if (faenaEntry) {
              console.log(`✅ Excel: Faena "${faenaNombre}" encontrada con ID: ${faenaEntry[1].id}`);
              return faenaEntry[1].id;
            } else {
              console.warn(`⚠️ Excel: Faena "${faenaNombre}" NO encontrada`);
              return null;
            }
          })
          .filter(Boolean);

        console.log("🔍 Excel: IDs de faenas encontrados:", faenaIds);

        if (faenaIds.length > 0) {
          const faenaIdsString = faenaIds.join(",");
          params.append("faenas", faenaIdsString);
          console.log("✅ Excel: Usando faenas:", faenaIdsString);
        } else {
          console.error("❌ Excel: No se encontraron IDs válidos");
          throw new Error("No se pudieron determinar las faenas seleccionadas");
        }
      }
      // 🔧 LÓGICA PARA otros casos
      else if (filters?.faenaSeleccionada === "todas") {
        const todasLasFaenas = filters.faenas || [];

        if (todasLasFaenas.length > 0) {
          const idsTodasFaenas = todasLasFaenas.map((f) => f.value).join(",");
          params.append("faenas", idsTodasFaenas);
          console.log("✅ Excel: Usando todas las faenas:", idsTodasFaenas);
        } else {
          if (!user?.id_faena) {
            throw new Error("Usuario sin faena asignada");
          }
          params.append("faena", user.id_faena);
          console.log("✅ Excel: Usando faena del usuario:", user.id_faena);
        }
      } else if (filters?.faenaSeleccionada && filters.faenaSeleccionada !== "todas") {
        params.append("faena", filters.faenaSeleccionada);
        console.log("✅ Excel: Usando faena específica:", filters.faenaSeleccionada);
      } else {
        if (!user?.id_faena) {
          throw new Error("Usuario sin faena asignada");
        }
        params.append("faena", user.id_faena);
        console.log("✅ Excel: Usando faena del usuario por defecto:", user.id_faena);
      }

      // Agregar otros filtros
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.equipoFilter) {
        if (Array.isArray(filters.equipoFilter)) {
          filters.equipoFilter.forEach(maquina => {
            params.append('equipoFilter[]', maquina);
          });
        } else {
          params.append('equipoFilter', filters.equipoFilter);
        }
      }

      return params;
    };

    // 🔑 PASO 2: Obtener el total de páginas con una primera llamada
    console.log("📡 Excel: Obteniendo información de paginación...");
    const primeraParams = construirParams(1, 100);
    
    const primeraResponse = await axios.get(`/api/consumosFecha?${primeraParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!primeraResponse.data.success) throw new Error("Error API");

    const totalRegistros = primeraResponse.data.pagination?.total || primeraResponse.data.stats?.total_consumos || 0;
    const registrosPorPagina = 100;
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

    console.log(`📊 Excel: Total registros: ${totalRegistros}, Total páginas: ${totalPaginas}`);

    // 🔑 PASO 3: Recolectar TODOS los consumos página por página
    const todosLosConsumos = [...primeraResponse.data.data]; // Ya tenemos la página 1

    if (totalPaginas > 1) {
      console.log(`📥 Excel: Descargando ${totalPaginas - 1} páginas adicionales...`);
      
      for (let pagina = 2; pagina <= totalPaginas; pagina++) {
        console.log(`📡 Excel: Descargando página ${pagina}/${totalPaginas}...`);
        
        const params = construirParams(pagina, registrosPorPagina);
        const response = await axios.get(`/api/consumosFecha?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          todosLosConsumos.push(...response.data.data);
          console.log(`✅ Excel: Página ${pagina} descargada (${response.data.data.length} registros)`);
        }

        // Pequeña pausa para no saturar el servidor
        if (pagina < totalPaginas) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    console.log(`✅ Excel: Total descargado: ${todosLosConsumos.length} registros`);

    return {
      consumos: todosLosConsumos,
      stats: primeraResponse.data.stats || stats,
      totalReal: todosLosConsumos.length,
    };
  };

  const handleClick = async () => {
    if (totalItems === 0 || generating || disabled) return;

    setGenerating(true);

    try {
      console.log('🚀 Excel: Iniciando descarga de datos...');
      
      // Mostrar modal de progreso
      setModalType('loading');
      setModalData({
        title: '⏳ Descargando Datos...',
        message: 'Por favor espera mientras descargamos todos los registros...',
        icon: <FaSpinner className="text-blue-500 text-4xl animate-spin" />
      });
      setShowModal(true);

      const allData = await getAllConsumos();
      const todosLosConsumos = allData.consumos;

      console.log(`✅ Excel: Datos descargados: ${todosLosConsumos.length} registros`);

      if (todosLosConsumos.length === 0) {
        setShowModal(false);
        showErrorModal('general');
        return;
      }

      // Actualizar mensaje: generando Excel
      setModalData({
        title: '📊 Generando Excel...',
        message: `Procesando ${todosLosConsumos.length} registros...`,
        icon: <FaSpinner className="text-green-500 text-4xl animate-spin" />
      });

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Gestión de Petróleo';
      workbook.created = new Date();

      // HOJA 1: DATOS
      const worksheet = workbook.addWorksheet('Consumos');

      worksheet.columns = [
        { header: '📅 Fecha', key: 'fecha', width: 12 },
        { header: '🏭 Faena', key: 'faena', width: 15 },
        { header: '🚜 Equipo', key: 'equipo', width: 20 },
        { header: '🚗 Patente', key: 'patente', width: 12 },
        { header: '👤 Solicitante', key: 'solicitante', width: 22 },
        { header: '💼 Tipo Personal', key: 'tipo_personal', width: 15 },
        { header: '⛽ Litros', key: 'litros', width: 10 },
        { header: '📊 Medición', key: 'medicion', width: 12 },
        { header: '🛢️ Estanque', key: 'estanque', width: 18 },
        { header: '🔧 Tipo Consumo', key: 'tipo_consumo', width: 12 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF15803D' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 35;

      worksheet.autoFilter = { from: 'A1', to: 'J1' };

      let totalLitros = 0;
      const faenasUnicas = new Set();
      const equiposUnicos = new Set();

      todosLosConsumos.forEach((consumo, index) => {
        const row = worksheet.addRow({
          fecha: consumo.fecha_consumo || consumo.fecha || '',
          faena: consumo.faena || consumo.nombre_faena || 'N/A',
          equipo: consumo.nombre_maquina || consumo.equipo || 'N/A',
          patente: consumo.patente || 'N/A',
          solicitante: consumo.solicitante_nombre || consumo.operador || 'N/A',
          tipo_personal: consumo.tipo_personal || 'N/A',
          litros: parseFloat(consumo.litros_consumidos || 0),
          medicion: parseFloat(consumo.medicion || 0),
          estanque: consumo.nombre_estanque || consumo.estanque || 'N/A',
          tipo_consumo: consumo.tipo_consumo || 'simple'
        });

        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        totalLitros += parseFloat(consumo.litros_consumidos || 0);
        faenasUnicas.add(consumo.faena || consumo.nombre_faena || 'N/A');
        equiposUnicos.add(consumo.nombre_maquina || consumo.equipo || 'N/A');
      });

      const filaTotal = worksheet.addRow({
        fecha: '', faena: '', equipo: '', patente: '',
        solicitante: '🎯 TOTAL',
        tipo_personal: '',
        litros: totalLitros,
        medicion: '', estanque: '', tipo_consumo: ''
      });

      filaTotal.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      filaTotal.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' }
      };

      worksheet.getColumn('litros').numFmt = '#,##0.00';
      worksheet.getColumn('medicion').numFmt = '#,##0.000';

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });

      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

      // HOJA 2: RESUMEN
      const resumenSheet = workbook.addWorksheet('📊 Resumen');
      
      resumenSheet.columns = [
        { header: 'Métrica', key: 'metrica', width: 35 },
        { header: 'Valor', key: 'valor', width: 30 }
      ];

      const resumenHeader = resumenSheet.getRow(1);
      resumenHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      resumenHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF15803D' }
      };
      resumenHeader.alignment = { vertical: 'middle', horizontal: 'center' };

      const filtrosAplicados = [];
      if (filters.dateFrom) filtrosAplicados.push(`Desde: ${filters.dateFrom}`);
      if (filters.dateTo) filtrosAplicados.push(`Hasta: ${filters.dateTo}`);
      if (filters.equipoFilter) filtrosAplicados.push(`Equipo: ${filters.equipoFilter}`);
      if (filters.selectedFaenas?.length > 0) {
        filtrosAplicados.push(`Faenas: ${filters.selectedFaenas.join(', ')}`);
      }

      const datosResumen = [
        { metrica: '📅 Fecha de Exportación', valor: new Date().toLocaleString('es-CL') },
        { metrica: '🔍 Filtros Aplicados', valor: filtrosAplicados.length > 0 ? 'Sí' : 'No' },
        { metrica: '', valor: '' },
        { metrica: '📦 Total de Consumos', valor: todosLosConsumos.length.toString() },
        { metrica: '⛽ Total de Litros', valor: `${totalLitros.toLocaleString('es-CL', { minimumFractionDigits: 2 })} L` },
        { metrica: '🏭 Faenas Únicas', valor: faenasUnicas.size.toString() },
        { metrica: '🚜 Equipos Únicos', valor: equiposUnicos.size.toString() },
        { metrica: '📊 Promedio por Consumo', valor: `${(totalLitros / todosLosConsumos.length).toFixed(2)} L` }
      ];

      if (filtrosAplicados.length > 0) {
        datosResumen.push({ metrica: '', valor: '' });
        datosResumen.push({ metrica: '🔍 FILTROS APLICADOS', valor: '' });
        filtrosAplicados.forEach(filtro => {
          datosResumen.push({ metrica: `  • ${filtro}`, valor: '' });
        });
      }

      datosResumen.forEach(dato => {
        const row = resumenSheet.addRow(dato);
        
        if (dato.metrica.includes('FILTROS APLICADOS')) {
          row.font = { bold: true, size: 11 };
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
          };
        }
        
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // GENERAR Y DESCARGAR
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
      const nombreArchivo = `Reporte_Consumos_${fecha}_${hora}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      link.click();
      window.URL.revokeObjectURL(url);

      // Cerrar modal de loading y mostrar éxito
      setShowModal(false);
      setTimeout(() => {
        showSuccessModal(todosLosConsumos.length, nombreArchivo);
      }, 300);

    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      console.error('Detalles:', {
        message: error.message,
        response: error.response?.data
      });

      setShowModal(false);

      if (error.message.includes('token') || error.message.includes('Sin token')) {
        showErrorModal('auth');
      } else if (error.message.includes('faena')) {
        showErrorModal('noFaenas');
      } else {
        showErrorModal('general');
      }
    }

    setGenerating(false);
  };

  const buttonDisabled = disabled || totalItems === 0 || generating;
  const buttonClass = `
    relative overflow-hidden flex items-center justify-center gap-2 rounded-xl font-semibold 
    transition-all duration-300 transform group px-3 sm:px-4 py-2 text-xs sm:text-sm
    ${buttonDisabled
      ? "bg-gray-500 text-white cursor-not-allowed opacity-50"
      : "bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl hover:shadow-green-200/50 hover:scale-105"
    }
  `;

  return (
    <div className={className}>
      <button onClick={handleClick} disabled={buttonDisabled} className={buttonClass}>
        {!buttonDisabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
        
        <span className={`text-lg sm:text-xl transition-transform duration-300 z-10 ${!buttonDisabled ? "group-hover:rotate-6" : ""}`}>
          {generating ? <FaSpinner className="animate-spin" /> : <FaFileExcel />}
        </span>
        
        <span className={`font-medium z-10 transition-all duration-300 ${!buttonDisabled ? "group-hover:tracking-wide" : ""}`}>
          {generating ? "Generando..." : "Generar Excel"}
        </span>
      </button>

      {/* Modal */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (modalType !== 'loading' && e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className={`
            bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300
            ${showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}>
            <div className={`
              relative px-6 py-6 rounded-t-2xl
              ${modalType === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : modalType === 'loading'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-red-500 to-red-600'}
            `}>
              {modalType !== 'loading' && (
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              )}
              
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  {modalData.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{modalData.title}</h3>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-700 mb-4">{modalData.message}</p>

              {modalType === 'success' && (
                <div className="space-y-3">
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
                        {new Date().toLocaleTimeString("es-CL")}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <FaDownload className="text-lg" />
                      <span className="font-medium">Descarga Completada</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      El archivo Excel ha sido descargado automáticamente
                    </p>
                  </div>
                </div>
              )}
            </div>

            {modalType !== 'loading' && (
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={closeModal}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                    modalType === 'success'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {modalData.action || 'Cerrar'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ExcelGenerator;