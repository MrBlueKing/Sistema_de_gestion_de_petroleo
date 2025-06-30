
// COMPONENTE EN ESPERA OJALA SE PUEDA UTILIZAR NOS VEMOS LUEGO SE UTILIZARIA EN CONSUMOVIEW.
import React, { useState, useContext } from 'react';
import {
  FaTimes,
  FaDownload,
  FaSpinner,
  FaFilePdf,
  FaEye,
  FaFileAlt,
  FaChartLine,
  FaTable,
  FaCog,
  FaInfo,
  FaCalendarAlt,
  FaUser,
  FaIndustry,
  FaGasPump,
  FaDollarSign,
  FaTruck,
  FaListAlt,
  FaClipboardList
} from 'react-icons/fa';
import { FiBarChart } from "react-icons/fi";

const MultiPagePDFModal = ({ 
  isOpen, 
  onClose, 
  consumosData = [],
  filters = {},
  stats = {},
  user 
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [pdfStructure, setPdfStructure] = useState({
    includePortada: true,
    includeResumen: true,
    includeGraficos: true,
    includeTablaDetalle: true,
    includeAnexos: true,
    registrosPorPagina: 20
  });

  if (!isOpen) return null;

  // Calcular estructura del PDF
  const calculatePDFStructure = () => {
    const pages = [];
    let pageNumber = 1;

    // Página 1: Portada
    if (pdfStructure.includePortada) {
      pages.push({
        number: pageNumber++,
        type: 'portada',
        title: 'Portada',
        icon: <FaFileAlt />,
        description: 'Información general del reporte'
      });
    }

    // Página 2: Resumen Ejecutivo
    if (pdfStructure.includeResumen) {
      pages.push({
        number: pageNumber++,
        type: 'resumen',
        title: 'Resumen Ejecutivo',
        icon: <FaChartLine />,
        description: 'KPIs y estadísticas principales'
      });
    }

    // Página 3: Gráficos y Análisis
    if (pdfStructure.includeGraficos) {
      pages.push({
        number: pageNumber++,
        type: 'graficos',
        title: 'Análisis Visual',
        icon: <FiBarChart />,
        description: 'Gráficos de tendencias y distribución'
      });
    }

    // Páginas 4+: Tabla de datos (dividida)
    if (pdfStructure.includeTablaDetalle) {
      const totalDataPages = Math.ceil(consumosData.length / pdfStructure.registrosPorPagina);
      for (let i = 0; i < totalDataPages; i++) {
        pages.push({
          number: pageNumber++,
          type: 'datos',
          title: `Detalle de Consumos (${i + 1}/${totalDataPages})`,
          icon: <FaTable />,
          description: `Registros ${i * pdfStructure.registrosPorPagina + 1} - ${Math.min((i + 1) * pdfStructure.registrosPorPagina, consumosData.length)}`
        });
      }
    }

    // Última página: Anexos
    if (pdfStructure.includeAnexos) {
      pages.push({
        number: pageNumber++,
        type: 'anexos',
        title: 'Anexos y Notas',
        icon: <FaClipboardList />,
        description: 'Información adicional y metodología'
      });
    }

    return pages;
  };

  const pages = calculatePDFStructure();
  const currentPageData = pages[previewPage - 1];

  // Función para generar PDF con múltiples páginas
  const handleGenerateMultiPagePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      // Dividir datos en chunks para páginas
      const chunkedData = [];
      for (let i = 0; i < consumosData.length; i += pdfStructure.registrosPorPagina) {
        chunkedData.push(consumosData.slice(i, i + pdfStructure.registrosPorPagina));
      }

      const pdfData = {
        // Configuración del PDF
        config: {
          multipage: true,
          registros_por_pagina: pdfStructure.registrosPorPagina,
          incluir_portada: pdfStructure.includePortada,
          incluir_resumen: pdfStructure.includeResumen,
          incluir_graficos: pdfStructure.includeGraficos,
          incluir_anexos: pdfStructure.includeAnexos
        },
        
        // Información del reporte
        reporte: {
          titulo: "Reporte Integral de Consumos de Combustible",
          faena: user?.nombre_faena || "Faena Principal",
          periodo: getPeriodText(),
          fecha_generacion: new Date().toISOString(),
          usuario_generador: user?.nombre || "Usuario Sistema",
          filtros_aplicados: getFiltersText()
        },
        
        // Estadísticas para resumen ejecutivo
        estadisticas: {
          total_registros: consumosData.length,
          total_litros: consumosData.reduce((sum, c) => sum + parseFloat(c.litros_consumidos || 0), 0),
          costo_estimado: consumosData.reduce((sum, c) => sum + (parseFloat(c.litros_consumidos || 0) * 850), 0),
          equipos_utilizados: [...new Set(consumosData.map(c => c.nombre_maquina))].length,
          operadores_registrados: [...new Set(consumosData.map(c => c.solicitante_nombre))].length,
          promedio_diario: calculateDailyAverage()
        },
        
        // Datos divididos en páginas
        datos_por_pagina: chunkedData.map((chunk, index) => ({
          pagina: index + 1,
          total_paginas: chunkedData.length,
          registros: chunk.map(consumo => ({
            fecha: consumo.fecha_consumo,
            maquina: consumo.nombre_maquina || "N/A",
            patente: consumo.patente || "N/A",
            operador: consumo.solicitante_nombre || "N/A",
            litros: parseFloat(consumo.litros_consumidos || 0),
            tipo_operacion: consumo.tipo_operacion || "Normal",
            estanque: consumo.nombre_estanque || "N/A",
            costo: parseFloat(consumo.litros_consumidos || 0) * 850
          }))
        })),
        
        // Datos para gráficos
        analisis: {
          consumo_por_equipo: generateEquipmentAnalysis(),
          tendencia_temporal: generateTimeAnalysis(),
          distribucion_operadores: generateOperatorAnalysis()
        }
      };

      const response = await fetch('http://127.0.0.1:8000/api/pdf/consumos-multipage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pdfData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fechaArchivo = new Date().toISOString().split('T')[0];
        const nombreArchivo = `reporte_completo_${fechaArchivo}_${pages.length}pag.pdf`;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Error al generar PDF multipágina');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el PDF. Inténtalo nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Funciones auxiliares
  const getPeriodText = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${new Date(filters.dateFrom).toLocaleDateString('es-CL')} - ${new Date(filters.dateTo).toLocaleDateString('es-CL')}`;
    }
    return "Todos los registros";
  };

  const getFiltersText = () => {
    const filtros = [];
    if (filters.equipoFilter) filtros.push(`Equipo: ${filters.equipoFilter}`);
    if (filters.solicitanteFilter) filtros.push(`Solicitante: ${filters.solicitanteFilter}`);
    return filtros.length > 0 ? filtros.join(" • ") : "Sin filtros específicos";
  };

  const calculateDailyAverage = () => {
    if (!consumosData.length) return 0;
    const dates = [...new Set(consumosData.map(c => c.fecha_consumo.split('T')[0]))];
    const totalLitros = consumosData.reduce((sum, c) => sum + parseFloat(c.litros_consumidos || 0), 0);
    return totalLitros / dates.length;
  };

  const generateEquipmentAnalysis = () => {
    const equipmentData = {};
    consumosData.forEach(c => {
      const equipo = c.nombre_maquina || "N/A";
      if (!equipmentData[equipo]) {
        equipmentData[equipo] = { consumos: 0, litros: 0 };
      }
      equipmentData[equipo].consumos++;
      equipmentData[equipo].litros += parseFloat(c.litros_consumidos || 0);
    });
    return Object.entries(equipmentData).map(([name, data]) => ({
      equipo: name,
      total_consumos: data.consumos,
      total_litros: data.litros,
      promedio: data.litros / data.consumos
    }));
  };

  const generateTimeAnalysis = () => {
    const timeData = {};
    consumosData.forEach(c => {
      const fecha = c.fecha_consumo.split('T')[0];
      if (!timeData[fecha]) {
        timeData[fecha] = { consumos: 0, litros: 0 };
      }
      timeData[fecha].consumos++;
      timeData[fecha].litros += parseFloat(c.litros_consumidos || 0);
    });
    return Object.entries(timeData).map(([fecha, data]) => ({
      fecha,
      consumos: data.consumos,
      litros: data.litros
    }));
  };

  const generateOperatorAnalysis = () => {
    const operatorData = {};
    consumosData.forEach(c => {
      const operador = c.solicitante_nombre || "N/A";
      if (!operatorData[operador]) {
        operatorData[operador] = { consumos: 0, litros: 0 };
      }
      operatorData[operador].consumos++;
      operatorData[operador].litros += parseFloat(c.litros_consumidos || 0);
    });
    return Object.entries(operatorData).map(([nombre, data]) => ({
      operador: nombre,
      total_consumos: data.consumos,
      total_litros: data.litros
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <FaFilePdf className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">PDF Multipágina Profesional</h3>
                  <p className="text-blue-100 text-sm">
                    {pages.length} páginas • {consumosData.length} registros • Vista página {previewPage}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateMultiPagePDF}
                  disabled={isGeneratingPDF || consumosData.length === 0}
                  className="bg-white hover:bg-gray-100 text-blue-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Generando {pages.length} páginas...
                    </>
                  ) : (
                    <>
                      <FaDownload />
                      Generar PDF ({pages.length} pág.)
                    </>
                  )}
                </button>
                <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg">
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar - Estructura del PDF */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-4">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaListAlt className="text-blue-600" />
                  Estructura del PDF
                </h4>

                {/* Configuración */}
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaCog className="text-gray-500" />
                    Configuración
                  </h5>
                  
                  <div className="space-y-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pdfStructure.includePortada}
                        onChange={(e) => setPdfStructure(prev => ({...prev, includePortada: e.target.checked}))}
                        className="rounded"
                      />
                      <span>Incluir portada</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pdfStructure.includeResumen}
                        onChange={(e) => setPdfStructure(prev => ({...prev, includeResumen: e.target.checked}))}
                        className="rounded"
                      />
                      <span>Resumen ejecutivo</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pdfStructure.includeGraficos}
                        onChange={(e) => setPdfStructure(prev => ({...prev, includeGraficos: e.target.checked}))}
                        className="rounded"
                      />
                      <span>Análisis visual</span>
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <span>Registros por página:</span>
                      <select
                        value={pdfStructure.registrosPorPagina}
                        onChange={(e) => setPdfStructure(prev => ({...prev, registrosPorPagina: parseInt(e.target.value)}))}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                        <option value={25}>25</option>
                        <option value={30}>30</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lista de páginas */}
                <div className="space-y-2">
                  {pages.map((page) => (
                    <button
                      key={page.number}
                      onClick={() => setPreviewPage(page.number)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        previewPage === page.number
                          ? 'bg-blue-100 border-2 border-blue-300'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${
                          previewPage === page.number ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {page.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{page.title}</div>
                          <div className="text-xs text-gray-500">{page.description}</div>
                          <div className="text-xs text-blue-600 font-medium">Página {page.number}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview del contenido */}
            <div className="flex-1 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-8">
                <PagePreview 
                  pageData={currentPageData}
                  consumosData={consumosData}
                  filters={filters}
                  user={user}
                  pdfStructure={pdfStructure}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar el preview de cada página
const PagePreview = ({ pageData, consumosData, filters, user, pdfStructure }) => {
  if (!pageData) return null;

  const renderPageContent = () => {
    switch (pageData.type) {
      case 'portada':
        return (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 rounded-lg text-center">
            <FaIndustry className="text-6xl mx-auto mb-6 opacity-80" />
            <h1 className="text-4xl font-bold mb-4">M3H</h1>
            <h2 className="text-2xl mb-8">Reporte Integral de Consumos</h2>
            <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-lg">{user?.nombre_faena || "Faena Principal"}</p>
              <p className="text-blue-200">{new Date().toLocaleDateString('es-CL')}</p>
              <p className="text-sm text-blue-300 mt-2">Generado por: {user?.nombre}</p>
            </div>
          </div>
        );

      case 'resumen':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
              Resumen Ejecutivo
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <FaGasPump className="text-2xl text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">
                  {consumosData.reduce((sum, c) => sum + parseFloat(c.litros_consumidos || 0), 0).toFixed(2)} L
                </div>
                <div className="text-sm text-blue-600">Total Combustible</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <FaDollarSign className="text-2xl text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">
                  ${(consumosData.reduce((sum, c) => sum + parseFloat(c.litros_consumidos || 0), 0) * 850).toLocaleString('es-CL')}
                </div>
                <div className="text-sm text-green-600">Costo Estimado</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <FaTruck className="text-2xl text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-800">{consumosData.length}</div>
                <div className="text-sm text-purple-600">Total Consumos</div>
              </div>
            </div>
          </div>
        );

      case 'graficos':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
              Análisis Visual
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <FiBarChart className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Gráfico de Consumo por Equipo</p>
                <p className="text-sm text-gray-500 mt-2">Se generará en el PDF final</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <FaChartLine className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tendencia Temporal</p>
                <p className="text-sm text-gray-500 mt-2">Se generará en el PDF final</p>
              </div>
            </div>
          </div>
        );

      case 'datos':
        const startIndex = (pageData.number - (pdfStructure.includePortada ? 1 : 0) - (pdfStructure.includeResumen ? 1 : 0) - (pdfStructure.includeGraficos ? 1 : 0) - 1) * pdfStructure.registrosPorPagina;
        const endIndex = startIndex + pdfStructure.registrosPorPagina;
        const pageData_consumos = consumosData.slice(startIndex, endIndex);

        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
              {pageData.title}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left border">Fecha</th>
                    <th className="p-2 text-left border">Equipo</th>
                    <th className="p-2 text-left border">Operador</th>
                    <th className="p-2 text-right border">Litros</th>
                    <th className="p-2 text-right border">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData_consumos.map((consumo, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 border text-xs">
                        {new Date(consumo.fecha_consumo).toLocaleDateString('es-CL')}
                      </td>
                      <td className="p-2 border text-xs">{consumo.nombre_maquina || "N/A"}</td>
                      <td className="p-2 border text-xs">{consumo.solicitante_nombre || "N/A"}</td>
                      <td className="p-2 border text-xs text-right">
                        {parseFloat(consumo.litros_consumidos || 0).toFixed(2)} L
                      </td>
                      <td className="p-2 border text-xs text-right">
                        ${(parseFloat(consumo.litros_consumidos || 0) * 850).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'anexos':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
              Anexos y Metodología
            </h2>
            <div className="prose max-w-none">
              <h3>Metodología de Cálculo</h3>
              <p className="text-gray-600">
                Este reporte se basa en los registros de consumo almacenados en el sistema M3H.
                El costo estimado se calcula usando un precio promedio de $850 por litro.
              </p>
              
              <h3>Filtros Aplicados</h3>
              <p className="text-gray-600">{filters ? JSON.stringify(filters, null, 2) : "Sin filtros"}</p>
              
              <h3>Notas Importantes</h3>
              <ul className="text-gray-600">
                <li>Los datos mostrados corresponden a consumos registrados hasta la fecha de generación</li>
                <li>El costo es estimativo y puede variar según precios de mercado</li>
                <li>Este documento es generado automáticamente por el sistema</li>
              </ul>
            </div>
          </div>
        );

      default:
        return <div>Tipo de página no reconocido</div>;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 min-h-[600px]">
      {renderPageContent()}
    </div>
  );
};

export default MultiPagePDFModal;