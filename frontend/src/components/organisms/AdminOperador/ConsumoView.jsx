// AdminCargasView.jsx
import React, { useState, useCallback } from 'react';
import {
  FaGasPump, FaSearch, FaTimes, FaFilter, FaChevronDown,
  FaSync, FaEdit, FaCheck, FaClock, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaEye
} from 'react-icons/fa';
import useConsumos from '../../../hook/AdminVehiculos/useConsumos'; // Ajusta la ruta según tu estructura
import axios from '../../../lib/axios'; // Ajusta la ruta según tu estructura

// Componente de Badge para estados
const EstadoBadge = ({ estado, estadoBadge }) => {
  const { label, color, icon, class: badgeClass } = estadoBadge;
  
  const iconMap = {
    clock: FaClock,
    check: FaCheck
  };
  
  const IconComponent = iconMap[icon] || FaClock;
  
  const colorClasses = {
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    danger: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[color] || colorClasses.warning}`}>
      <IconComponent className="w-3 h-3" />
      {label}
    </span>
  );
};

// Componente de Paginación
const Pagination = ({ paginaActual, infoPaginacion, irAPagina }) => {
  const { totalPaginas, desde, hasta, totalRegistros } = infoPaginacion;
  
  if (totalPaginas <= 1) return null;
  
  return (
    <div className="flex items-center justify-between flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{desde}</span> a{" "}
        <span className="font-medium">{hasta}</span> de{" "}
        <span className="font-medium">{totalRegistros}</span> cargas
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => irAPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            paginaActual === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
          }`}
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>
        
        {/* Páginas visibles */}
        {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
          const page = i + Math.max(1, paginaActual - 2);
          if (page > totalPaginas) return null;
          
          return (
            <button
              key={page}
              onClick={() => irAPagina(page)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === paginaActual
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
              }`}
            >
              {page}
            </button>
          );
        })}
        
        <button
          onClick={() => irAPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            paginaActual === totalPaginas
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
          }`}
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Componente principal
const AdminCargasView = () => {
  // Estados locales para modales y acciones
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [cargaSeleccionada, setCargaSeleccionada] = useState(null);
  const [procesandoCambioEstado, setProcesandoCambioEstado] = useState(null);

  // Hook personalizado para cargas
  const {
    cargas,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado,
    filtroFaena,
    setFiltroFaena,
    filtroTipoCombustible,
    setFiltroTipoCombustible,
    filtroFechaInicio,
    setFiltroFechaInicio,
    filtroFechaFin,
    setFiltroFechaFin,
    paginaActual,
    infoPaginacion,
    irAPagina,
    refrescarDatos,
    limpiarFiltros,
    actualizarCarga,
    hayFiltrosActivos,
    totalFiltrado,
    opcionesFiltros,
    metadatos
  } = useConsumos();

  // Función para cambiar estado de carga
  const cambiarEstadoCarga = useCallback(async (cargaId, nuevoEstado) => {
    try {
      setProcesandoCambioEstado(cargaId);
      
      // Llamada a la API para cambiar estado
      const response = await axios.post(`/api/adminOperador/cargas/${cargaId}/rendir`);
      
      if (response.data.success) {
        // Actualizar el estado local
        actualizarCarga(cargaId, {
          estado: nuevoEstado,
          estado_badge: {
            label: nuevoEstado,
            color: nuevoEstado === 'Rendido' ? 'success' : 'warning',
            icon: nuevoEstado === 'Rendido' ? 'check' : 'clock',
            class: nuevoEstado === 'Rendido' ? 'badge-success' : 'badge-warning'
          },
          fecha_aprobacion: nuevoEstado === 'Rendido' ? new Date().toISOString() : null
        });
        
        // Mostrar mensaje de éxito (opcional)
        alert(`Carga ${nuevoEstado.toLowerCase()} exitosamente`);
      } else {
        throw new Error(response.data.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la carga: ' + error.message);
    } finally {
      setProcesandoCambioEstado(null);
    }
  }, [actualizarCarga]);

  // Función para ver detalles
  const verDetalles = useCallback((carga) => {
    setCargaSeleccionada(carga);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FaGasPump className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Administración de Cargas
                </h1>
                <p className="text-gray-600">
                  Gestión y seguimiento de cargas de combustible
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={refrescarDatos}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadísticas rápidas */}
        {metadatos && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cargas</p>
                  <p className="text-2xl font-bold text-gray-900">{metadatos.total_con_filtros}</p>
                </div>
                <FaGasPump className="text-blue-600 text-xl" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Por Rendir</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {cargas.filter(c => c.estado === 'Por Rendir').length}
                  </p>
                </div>
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rendidas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {cargas.filter(c => c.estado === 'Rendido').length}
                  </p>
                </div>
                <FaCheck className="text-green-600 text-xl" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filtros Activos</p>
                  <p className="text-2xl font-bold text-blue-600">{metadatos.filtros_activos}</p>
                </div>
                <FaFilter className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Barra de filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {/* Barra superior con búsqueda y botones */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              {/* Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por boleta, operador, máquina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    mostrarFiltros || hayFiltrosActivos
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaFilter className="w-4 h-4" />
                  Filtros
                  {hayFiltrosActivos && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {metadatos.filtros_activos}
                    </span>
                  )}
                  <FaChevronDown className={`w-3 h-3 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
                </button>
                
                {hayFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                  >
                    <FaTimes className="w-4 h-4" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Panel de filtros expandible */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                {/* Filtro por estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Por Rendir">Por Rendir</option>
                    <option value="Rendido">Rendido</option>
                  </select>
                </div>

                {/* Filtro por faena */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faena
                  </label>
                  <select
                    value={filtroFaena}
                    onChange={(e) => setFiltroFaena(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todas">Todas las faenas</option>
                    {opcionesFiltros.faenas?.map((faena) => (
                      <option key={faena.id} value={faena.id}>
                        {faena.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por tipo de combustible */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Combustible
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Diesel, Gasolina"
                    value={filtroTipoCombustible}
                    onChange={(e) => setFiltroTipoCombustible(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filtro fecha inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtroFechaInicio}
                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filtro fecha fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtroFechaFin}
                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de cargas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Lista de Cargas {totalFiltrado && `(${totalFiltrado} resultados)`}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSync className="animate-spin text-blue-600 text-2xl mr-3" />
              <span className="text-gray-600">Cargando cargas...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaExclamationTriangle className="text-red-500 text-3xl mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar datos</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={refrescarDatos}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : cargas.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaGasPump className="text-gray-400 text-3xl mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No se encontraron cargas
                </h3>
                <p className="text-gray-600">
                  {hayFiltrosActivos 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay cargas registradas en el sistema'
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nº Boleta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Máquina
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faena
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Litros
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cargas.map((carga) => (
                      <tr key={carga.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {carga.numero_boleta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.operador?.nombre_completo}
                            </div>
                            <div className="text-sm text-gray-500">
                              RUT: {carga.operador?.rut}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.maquina?.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {carga.maquina?.patente}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {carga.faena?.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {carga.litros_formateados}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {carga.costo_formateado}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <EstadoBadge estado={carga.estado} estadoBadge={carga.estado_badge} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {carga.fecha_creacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => verDetalles(carga)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Ver detalles"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            
                            {carga.estado === 'Por Rendir' && (
                              <button
                                onClick={() => cambiarEstadoCarga(carga.id, 'Rendido')}
                                disabled={procesandoCambioEstado === carga.id}
                                className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                                title="Marcar como rendido"
                              >
                                {procesandoCambioEstado === carga.id ? (
                                  <FaSync className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FaCheck className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista Mobile - Cards */}
              <div className="lg:hidden">
                <div className="p-4 space-y-4">
                  {cargas.map((carga) => (
                    <div key={carga.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Boleta #{carga.numero_boleta}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {carga.fecha_creacion}
                          </p>
                        </div>
                        <EstadoBadge estado={carga.estado} estadoBadge={carga.estado_badge} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Operador:</span>
                          <p className="text-gray-900">{carga.operador?.nombre_completo}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Máquina:</span>
                          <p className="text-gray-900">{carga.maquina?.nombre}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Litros:</span>
                          <p className="text-gray-900">{carga.litros_formateados}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Costo:</span>
                          <p className="text-gray-900">{carga.costo_formateado}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => verDetalles(carga)}
                          className="text-blue-600 hover:text-blue-900 transition-colors flex items-center gap-1"
                        >
                          <FaEye className="w-4 h-4" />
                          Ver
                        </button>
                        
                        {carga.estado === 'Por Rendir' && (
                          <button
                            onClick={() => cambiarEstadoCarga(carga.id, 'Rendido')}
                            disabled={procesandoCambioEstado === carga.id}
                            className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {procesandoCambioEstado === carga.id ? (
                              <FaSync className="w-4 h-4 animate-spin" />
                            ) : (
                              <FaCheck className="w-4 h-4" />
                            )}
                            Rendir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paginación */}
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  paginaActual={paginaActual}
                  infoPaginacion={infoPaginacion}
                  irAPagina={irAPagina}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de detalles (opcional) */}
      {cargaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalles de Carga #{cargaSeleccionada.numero_boleta}
                </h3>
                <button
                  onClick={() => setCargaSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Operador</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.operador?.nombre_completo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RUT Operador</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.operador?.rut}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Máquina</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.maquina?.display}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Faena</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.faena?.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Combustible</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.tipo_combustible}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Litros</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.litros_formateados}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio por Litro</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.precio_formateado}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo Total</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.costo_formateado}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medición</label>
                    <p className="mt-1 text-sm text-gray-900">{cargaSeleccionada.medicion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <div className="mt-1">
                      <EstadoBadge estado={cargaSeleccionada.estado} estadoBadge={cargaSeleccionada.estado_badge} />
                    </div>
                  </div>
                </div>
                
                {cargaSeleccionada.observaciones && cargaSeleccionada.observaciones !== '-' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {cargaSeleccionada.observaciones}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                {cargaSeleccionada.estado === 'Por Rendir' && (
                  <button
                    onClick={() => {
                      cambiarEstadoCarga(cargaSeleccionada.id, 'Rendido');
                      setCargaSeleccionada(null);
                    }}
                    disabled={procesandoCambioEstado === cargaSeleccionada.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaCheck className="w-4 h-4" />
                    Marcar como Rendido
                  </button>
                )}
                <button
                  onClick={() => setCargaSeleccionada(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCargasView;