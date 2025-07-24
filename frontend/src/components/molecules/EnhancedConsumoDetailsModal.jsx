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
  FiLoader
} from "react-icons/fi";
import axios from '../../lib/axios';

// Importar el componente de tendencias que acabamos de crear
import EquipmentTrendChart from './EquipmentTrendChart';

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
  const [activeTab, setActiveTab] = useState('list'); // 'list' o 'trend'
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch de datos cuando se abre el modal o cambian los filtros
  useEffect(() => {
    if (isOpen && categoria) {
      fetchConsumosDeCategoria(1);
    }
  }, [isOpen, categoria, fechaDesde, fechaHasta, faenaSeleccionada, refreshKey]);

  // Función para obtener consumos de la categoría
  const fetchConsumosDeCategoria = async (page = 1) => {
    if (!categoria || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Construir parámetros de la consulta
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      // Agregar faena
      if (faenaSeleccionada && faenaSeleccionada !== 'todas') {
        params.append('faena', faenaSeleccionada);
      } else {
        params.append('faena', '1'); // Faena por defecto temporal
      }

      // Agregar filtros de fecha
      if (fechaDesde) {
        params.append('dateFrom', fechaDesde);
      }
      if (fechaHasta) {
        params.append('dateTo', fechaHasta);
      }

      // Agregar ID de categoría
      params.append('id_categoria', categoria.id.toString());
      
      console.log("🔍 Buscando consumos para categoría:", categoria.nombre, "ID:", categoria.id);

      // Llamar a la API
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
        
        console.log("✅ Consumos de categoría cargados:", {
          categoria: categoria.nombre,
          total_consumos: consumosData.length,
          total_items: response.data.pagination?.total
        });
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

  // Función para exportar datos (placeholder)
  const handleExport = () => {
    // Implementar exportación de datos
    console.log('Exportando datos de consumos...');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            {/* Botón de refrescar */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refrescar datos"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Botón de exportar */}
            <button
              onClick={handleExport}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar datos"
            >
              <FiDownload className="w-5 h-5" />
            </button>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="border-b border-gray-200">
          <nav className="px-6 flex space-x-8">
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
              {consumos.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {new Set(consumos.map(c => c.nombre_maquina)).size} equipos
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Contenido del Modal */}
        <div className="flex-1 overflow-hidden">
          {/* Pestaña de Lista de Consumos */}
          {activeTab === 'list' && (
            <div className="h-full flex flex-col">
              {/* Estadísticas rápidas */}
              {stats && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            {stats.equipos_unicos || new Set(consumos.map(c => c.id_equipo)).size}
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
                            {stats.promedio_diario?.toLocaleString('es-CL') || '0'} L
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
              <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <FiLoader className="w-5 h-5 animate-spin" />
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
                        {consumos.map((consumo, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(consumo.fecha_consumo).toLocaleString('es-CL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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
                                  {consumo.nombre_solicitante || 'Sin nombre'}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {consumo.rut_solicitante || 'Sin RUT'}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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
            <div className="h-full overflow-auto p-6">
              <EquipmentTrendChart
                consumosData={consumos}
                categoria={categoria}
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                isVisible={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedConsumoDetailsModal;