import React, { useState, useEffect } from 'react';
import {
  FiX, 
  FiList, 
  FiTrendingUp, 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar,
  FiTruck,
  FiDroplet,
  FiUser,
  FiDownload,
  FiRefreshCw,
  FiLoader,
  FiInfo
} from "react-icons/fi";
import axios from '../../lib/axios';

// Importar el componente de tendencias
import EquipmentTrendChart from './EquipmentTrendChart';

// Componente Modal Mejorado para mostrar detalles de consumos con pestañas
const EnhancedConsumoDetailsModal = ({ 
  isOpen, 
  onClose, 
  categoria,
  fechaDesde,
  fechaHasta,
  faenaSeleccionada 
}) => {
  // Estados para datos
  const [consumos, setConsumos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Estados para control de vista
  const [activeTab, setActiveTab] = useState('trend'); // 'list' o 'trend'
  const [refreshKey, setRefreshKey] = useState(0);

  // 🆕 ESTADO PARA CONSUMOS COMPLETOS (para tendencias)
  const [allConsumos, setAllConsumos] = useState([]);
  const [loadingAllConsumos, setLoadingAllConsumos] = useState(false);

  // 🔧 AGREGAR EL ESTADO FALTANTE:
  const [showExpandedSelector, setShowExpandedSelector] = useState(false);

  // Effect para ocultar/mostrar scroll del body cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      // 🔒 OCULTAR SCROLL de la pantalla padre
      document.body.style.overflow = 'hidden';
    } else {
      // 🔓 RESTAURAR SCROLL de la pantalla padre
      document.body.style.overflow = 'unset';
    }

    // 🧹 CLEANUP: Restaurar scroll al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch de datos cuando se abre el modal o cambian los filtros
  useEffect(() => {
    if (isOpen && categoria) {
      fetchConsumosDeCategoria(1);
    }
  }, [isOpen, categoria, fechaDesde, fechaHasta, faenaSeleccionada, refreshKey]);

  // 🆕 TAMBIÉN RECARGAR TODOS LOS DATOS (no solo página 1) PARA TENDENCIAS
  const fetchAllConsumosForTrends = async () => {
    if (!categoria || !isOpen) return [];

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const params = new URLSearchParams({
        page: '1',
        per_page: '1000',
      });

      if (faenaSeleccionada && faenaSeleccionada !== 'todas') {
        params.append('faena', faenaSeleccionada);
      } else {
        params.append('faena', '1');
      }

      if (fechaDesde) {
        params.append('dateFrom', fechaDesde);
      }
      if (fechaHasta) {
        params.append('dateTo', fechaHasta);
      }

      params.append('id_categoria', categoria.id.toString());
      
      const response = await axios.get(`/api/consumos-categoria?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const allConsumosData = response.data.data || [];
        return allConsumosData;
      } else {
        throw new Error(response.data.message || 'Error al obtener consumos para tendencias');
      }

    } catch (err) {
      console.error("❌ [TENDENCIAS] Error al cargar consumos:", err);
      return [];
    }
  };

  // 🆕 CARGAR TODOS LOS CONSUMOS cuando sea necesario para tendencias
  useEffect(() => {
    const loadAllConsumos = async () => {
      if (isOpen && categoria && activeTab === 'trend') {
        setLoadingAllConsumos(true);
        const data = await fetchAllConsumosForTrends();
        setAllConsumos(data);
        setLoadingAllConsumos(false);
      }
    };

    loadAllConsumos();
  }, [isOpen, categoria, activeTab, fechaDesde, fechaHasta, faenaSeleccionada, refreshKey]);

  // Función para obtener consumos de la categoría (para tabla paginada)
  const fetchConsumosDeCategoria = async (page = 1) => {
    if (!categoria || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (faenaSeleccionada && faenaSeleccionada !== 'todas') {
        params.append('faena', faenaSeleccionada);
      } else {
        params.append('faena', '1');
      }

      if (fechaDesde) {
        params.append('dateFrom', fechaDesde);
      }
      if (fechaHasta) {
        params.append('dateTo', fechaHasta);
      }

      params.append('id_categoria', categoria.id.toString());
      
      const response = await axios.get(`/api/consumos-categoria?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const consumosData = response.data.data || [];
        
        setConsumos(consumosData);
        setStats(response.data.stats);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / itemsPerPage));
        setCurrentPage(page);
      } else {
        throw new Error(response.data.message || 'Error al obtener consumos');
      }

    } catch (err) {
      console.error("Error al cargar consumos de categoría:", err);
      setError(err.message || "Error al cargar detalles de consumos");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchConsumosDeCategoria(newPage);
    }
  };

  // Función para refrescar datos
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Función para formatear fechas
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return {
      fecha: fecha.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
      }),
      hora: fecha.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      })
    };
  };

  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-3xl flex items-center justify-center z-50 p-2">

        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
          {/* Header del Modal */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Detalles de Consumo - {categoria?.nombre}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Período: {fechaDesde} al {fechaHasta}
                {faenaSeleccionada && faenaSeleccionada !== 'todas' && (
                  <span> • Faena: {faenaSeleccionada}</span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refrescar datos"
              >
                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pestañas de navegación */}
          <div className="border-b border-gray-200 flex-shrink-0">
            <nav className="px-4 flex space-x-8">
             

              <button
                onClick={() => setActiveTab('trend')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'trend'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiTrendingUp className="inline w-4 h-4 mr-2" />
                Tendencia por Equipo
                {(activeTab === 'trend' ? allConsumos : consumos).length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {new Set((activeTab === 'trend' ? allConsumos : consumos).map(c => c.nombre_maquina)).size} equipos
                  </span>
                )}
              </button>

               <button
                onClick={() => setActiveTab('list')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiList className="inline w-4 h-4 mr-2" />
                Lista de Consumos
                {stats && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {totalItems}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Contenido del Modal */}
          <div className="flex-1 overflow-hidden min-h-0">
            {/* Pestaña de Lista de Consumos */}
            {activeTab === 'list' && (
              <div className="h-full flex flex-col min-h-0">
                {/* Estadísticas rápidas */}
                {stats && (
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FiDroplet className="text-blue-500 w-5 h-5 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Total Litros</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {stats.total_litros?.toLocaleString('es-CL') || '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FiTruck className="text-green-500 w-5 h-5 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Equipos Únicos</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {new Set(consumos.map(c => c.nombre_maquina)).size}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FiCalendar className="text-purple-500 w-5 h-5 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Promedio Diario</p>
                            <p className="text-lg font-semibold text-gray-800">
                             {stats.promedio_consumo?.toFixed(2)} L

                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FiUser className="text-orange-500 w-5 h-5 mr-2" />
                          <div>
                            <p className="text-xs text-gray-500">Total Registros</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {totalItems}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabla de consumos */}
                <div className="flex-1 overflow-auto px-4 py-3 min-h-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        <span>Cargando consumos...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center text-red-500">
                        <p className="font-medium">Error al cargar datos</p>
                        <p className="text-sm mt-1">{error}</p>
                        <button
                          onClick={handleRefresh}
                          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FiRefreshCw className="w-4 h-4 inline mr-2" />
                          Reintentar
                        </button>
                      </div>
                    </div>
                  ) : consumos.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center text-gray-500">
                        <FiList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No se encontraron consumos</p>
                        <p className="text-sm mt-1">para los filtros seleccionados</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Equipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Solicitante
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Litros
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Observaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {consumos.map((consumo, index) => {
                            const { fecha, hora } = formatearFecha(consumo.fecha_consumo);
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium">{fecha}</div>
                                  <div className="text-gray-500">{hora}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div>
                                    <p className="font-medium">
                                      {consumo.nombre_maquina || 'Sin nombre'}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                      {consumo.patente || 'S/P'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div>
                                    <p className="font-medium">
                                      {consumo.solicitante_nombre || 'Sin nombre'}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                      {consumo.id_dotacion || 'Sin RUT'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                  {parseFloat(consumo.litros_consumidos || 0).toLocaleString('es-CL')} L
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                  {consumo.observacion || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                        {Math.min(currentPage * itemsPerPage, totalItems)} de{' '}
                        {totalItems} resultados
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="px-3 py-2 text-sm font-medium text-gray-700">
                          Página {currentPage} de {totalPages}
                        </span>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pestaña de Tendencia por Equipo */}
            {activeTab === 'trend' && (
              <div className="h-full overflow-auto p-4 min-h-0">
                {loadingAllConsumos ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                      <span>Cargando datos para tendencias...</span>
                    </div>
                  </div>
                ) : (
                  <>
                   

                    <EquipmentTrendChart
                      consumosData={allConsumos} 
                      categoria={categoria}
                      fechaDesde={fechaDesde}
                      fechaHasta={fechaHasta}
                      isVisible={true}
                      showExpandedSelector={showExpandedSelector}      // ✅ Ahora está definido
                      setShowExpandedSelector={setShowExpandedSelector} // ✅ Ahora está definido
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 MODAL EXPANDIDO PARA SELECTOR DE EQUIPOS */}
      {showExpandedSelector && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Seleccionar Equipos para Gráfico
              </h3>
              <button
                onClick={() => setShowExpandedSelector(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm text-gray-600 mb-4">
                Seleccione los equipos que desea mostrar en el gráfico de tendencias.
                Esta funcionalidad se maneja automáticamente desde el componente EquipmentTrendChart.
              </p>
              <div className="text-center text-gray-500 py-8">
                <FiInfo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>La selección de equipos se realiza directamente en el gráfico de tendencias.</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExpandedSelector(false)}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedConsumoDetailsModal;