// AdminCargasView.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  FaGasPump, FaSearch, FaTimes, FaFilter, FaChevronDown,
  FaSync, FaEdit, FaCheck, FaClock, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaEye, FaCheckCircle, FaDollarSign
} from 'react-icons/fa';
import useConsumos from '../../../hook/AdminVehiculos/useConsumos'; // Ajusta la ruta según tu estructura
import axios from '../../../lib/axios'; // Ajusta la ruta según tu estructura
import DetalleCargaModal from '../../molecules/DetalleCargaModal';
import SuccessNotificationRendir from '../../molecules/SuccessNotificationRendir';
import PageControl from '../../molecules/PageControl';
import { useAuth } from '../../../routes/PrivateRoutes';

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

// Componente principal
const AdminCargasView = () => {
  // Estados locales para modales y acciones
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [cargaSeleccionada, setCargaSeleccionada] = useState(null);
  const [procesandoCambioEstado, setProcesandoCambioEstado] = useState(null);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // ✅ AGREGAR: Estado específico para errores de rendición
  const [errorRendicion, setErrorRendicion] = useState(null);
  // 🔐 AGREGAR: Hook para obtener información del usuario
  const { user } = useAuth();

  // 🔐 AGREGAR: Función para verificar si puede rendir
  const canRender = () => {
    const userRole = user?.rol;
    console.log("Rol:", userRole);
    // Solo admin_operador puede rendir, gerente NO puede
    return userRole === 'admin_operador';
  };

  // Hook personalizado para cargas
  const {
    cargas,
    loading,
    error,
    estadisticas,
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
    filtroOperador,
    setFiltroOperador,
    filtroMaquina,
    setFiltroMaquina,
    filtroPatente,
    setFiltroPatente,
    filtroNumeroBoleta,
    setFiltroNumeroBoleta,
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

  // ✅ DEBUGGING: Agregar logs cada vez que cambien las estadísticas
  useEffect(() => {
    console.log('🔍 DEBUG - Estadísticas cambiaron:', estadisticas);
    console.log('🔍 DEBUG - Metadatos cambiaron:', metadatos);
    console.log('🔍 DEBUG - Loading:', loading);
    console.log('🔍 DEBUG - Hay filtros activos:', hayFiltrosActivos);
  }, [estadisticas, metadatos, loading, hayFiltrosActivos]);


  // ✅ AGREGAR: Los nuevos filtros al debugging
  useEffect(() => {
    console.log('🔍 DEBUG - Filtros cambiaron:', {
      searchTerm,
      filtroEstado,
      filtroFaena,
      filtroTipoCombustible,
      filtroFechaInicio,
      filtroFechaFin,
      // ✅ AGREGAR ESTOS:
      filtroOperador,
      filtroMaquina,
      filtroPatente,
      filtroNumeroBoleta
    });
  }, [searchTerm, filtroEstado, filtroFaena, filtroTipoCombustible, filtroFechaInicio, filtroFechaFin, filtroOperador, filtroMaquina, filtroPatente, filtroNumeroBoleta]);

  // 2. Agregar estados para notificaciones (después de los estados existentes):
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"
  });
  const [loadingCargas, setLoadingCargas] = useState({});

  // Funciones de manejo de modal
  const handleVerDetalle = (cargaId) => {
    setSelectedCargaId(cargaId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargaId(null);
  };

  const handleActionComplete = () => {
    fetchCargasExternas();
  };

  // Función para cerrar la notificación
  const closeNotification = () => {
    setNotification({ visible: false, title: "", message: "" });
  };

  // 3. Reemplazar la función handleRendir existente con esta:
  const handleRendir = async (cargaId) => {
    console.log("🚀 Iniciando rendición de carga:", cargaId);
    setLoadingCargas(prev => ({ ...prev, [cargaId]: true }));

    try {
      setErrorRendicion(null); // ✅ Usar el setter local correcto

      const response = await axios.post(`/api/adminOperador/cargas/${cargaId}/rendir`);
      console.log("📡 Respuesta del servidor:", response.data);

      if (response.data.status === "success") {
        // Tu lógica de éxito...
        actualizarCarga(cargaId, {
          estado: "Rendido",
          fecha_rendicion: new Date().toISOString(),
        });

        refrescarDatos();

        setNotification({
          visible: true,
          title: "🎉 Carga Rendida",
          message: "La carga ha sido marcada como rendida exitosamente"
        });
      }
    } catch (error) {
      console.error("❌ Error al rendir carga:", error);
      setErrorRendicion(error.message); // ✅ Usar el setter local correcto

      setNotification({
        visible: true,
        title: "❌ Error",
        message: error.message || "Error al rendir la carga"
      });
    } finally {
      setLoadingCargas(prev => ({ ...prev, [cargaId]: false }));
    }
  };

  // Función para ver detalles
  const verDetalles = useCallback((carga) => {
    setCargaSeleccionada(carga);
  }, []);

  // ✅ FUNCIÓN para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // ✅ FUNCIÓN para formatear números grandes
  const formatNumber = (number) => {
    return new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
        {/* ✅ AGREGAR: Indicador de carga para las estadísticas */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
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
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${mostrarFiltros || hayFiltrosActivos
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

                {/* ✅ AGREGAR: Filtro por operador */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operador (Nombre/RUT)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez, 12345678-9"
                    value={filtroOperador}
                    onChange={(e) => setFiltroOperador(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* ✅ AGREGAR: Filtro por máquina */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máquina (Nombre/Patente)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: FORD 76, LPPY-76"
                    value={filtroMaquina}
                    onChange={(e) => setFiltroMaquina(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* ✅ AGREGAR: Filtro por patente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patente</label>
                  <input
                    type="text"
                    placeholder="Ej: LPPY-76"
                    value={filtroPatente}
                    onChange={(e) => setFiltroPatente(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* ✅ AGREGAR: Filtro por número de boleta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número Boleta</label>
                  <input
                    type="text"
                    placeholder="Ej: 35167856"
                    value={filtroNumeroBoleta}
                    onChange={(e) => setFiltroNumeroBoleta(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ TARJETAS DE ESTADÍSTICAS CORREGIDAS */}
        {(metadatos || estadisticas) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">

            {/* Total Cargas - Ya funciona bien */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cargas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metadatos?.total_con_filtros || estadisticas?.total || 0}
                  </p>
                  {hayFiltrosActivos && (
                    <p className="text-xs text-gray-500 mt-1">
                      de {metadatos?.total_sin_filtros || 0} total
                    </p>
                  )}
                  {/* ✅ DEBUG: Mostrar fuente del dato */}
                </div>
                <FaGasPump className="text-blue-600 text-xl" />
              </div>
            </div>

            {/* ✅ Por Rendir - CORREGIDA */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Por Rendir</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {estadisticas?.porRendir || 0}
                  </p>
                  {(estadisticas?.total > 0) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(((estadisticas?.porRendir || 0) / estadisticas.total) * 100)}% del total
                    </p>
                  )}
                </div>
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>

            {/* ✅ Rendidas - CORREGIDA */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rendidas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {estadisticas?.rendidos || 0}
                  </p>
                  {(estadisticas?.total > 0) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(((estadisticas?.rendidos || 0) / estadisticas.total) * 100)}% del total
                    </p>
                  )}
                </div>
                <FaCheck className="text-green-600 text-xl" />
              </div>
            </div>



            {/* ✅ NUEVA: Total Litros */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Litros</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(estadisticas?.totalLitros || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">litros</p>
                </div>
                <FaGasPump className="text-blue-600 text-xl" />
              </div>
            </div>

            {/* ✅ NUEVA: Costo Total */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(estadisticas?.totalCosto || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CLP</p>
                </div>
                <FaDollarSign className="text-green-600 text-xl" />
              </div>
            </div>

            {/* Filtros Activos - Opcional */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filtros Activos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metadatos?.filtros_activos || 0}
                  </p>
                </div>
                <FaFilter className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        )}

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
                      {/* Columna 1: Boleta/Operador */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Boleta / Operador
                      </th>

                      {/* Columna 2: Máquina-Patente-Ubicación */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Máquina / Ubicación
                      </th>

                      {/* Columna 3: Litros/Precio */}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consumo
                      </th>
                      {/* Columna 3: Litros/Precio */}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo
                      </th>

                      {/* Columna 4: Estado */}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>

                      {/* Columna 5: Fecha */}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>

                      {/* Columna 6: Acciones */}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cargas.map((carga) => (
                      <tr key={carga.id} className="hover:bg-gray-50">
                        {/* Columna 1: Boleta / Operador */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.numero_boleta}
                            </div>
                            <div className="text-sm text-gray-500">
                              {carga.operador?.nombre_completo}
                            </div>
                            {carga.operador?.rut && (
                              <div className="text-xs text-gray-400">
                                RUT: {carga.operador?.rut}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Columna 2: Máquina-Patente-Ubicación */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.maquina?.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {carga.maquina?.patente} • {carga.ubicacion}
                            </div>
                          </div>
                        </td>

                        {/* Columna 3: Litros/Precio */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.litros_formateados}
                            </div>
                          </div>
                        </td>

                        {/* Columna 3: Litros/Precio */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.costo_formateado}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <EstadoBadge estado={carga.estado} estadoBadge={carga.estado_badge} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {carga.fecha_creacion}
                        </td>
                        {/* Acciones */}
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleVerDetalle(carga.id)}
                              className="inline-flex items-center px-3 py-1 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors cursor-pointer"
                              title="Ver historial y detalles completos"
                            >
                              <FaEye className="w-3 h-3 mr-1" />
                              Ver
                            </button>

                            {carga.estado === "Por Rendir" && canRender() && (
                              <>
                                <button
                                  onClick={() => handleRendir(carga.id)} // ✅ AGREGAR: Conectar handl eRendir con el ID de la carga
                                  className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer"
                                  title="Marcar carga como rendida" // ✅ OPCIONAL: Agregar tooltip descriptivo
                                  disabled={loading} // ✅ OPCIONAL: Deshabilitar si está cargando
                                >
                                  {loading ? (
                                    <>
                                      <div className="animate-spin w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full mr-1"></div>
                                      Procesando...
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle className="w-3 h-3 mr-1" />
                                      Rendir
                                    </>
                                  )}
                                </button>
                              </>
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
                        {carga.estado === 'Por Rendir' && canRender() && (
                          <button
                            onClick={() => handleRendir(carga.id, 'Rendido')}
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
                <PageControl
                  currentPage={paginaActual}
                  totalPages={infoPaginacion.totalPaginas}
                  onPageChange={irAPagina}
                  colorScheme="orange"
                />
              </div>
            </>
          )}
        </div>
      </div>
      {/* Modal de detalle */}
      {isModalOpen && (
        <DetalleCargaModal
          cargaId={selectedCargaId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onActionComplete={handleActionComplete}
          canRender={canRender()} // 🔐 NUEVA PROP: Pasar permisos al modal
        />
      )}
      {/* Componente de notificación de éxito (igual que en MainAdminOperador) */}
      <SuccessNotificationRendir
        isVisible={notification.visible}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
      />
    </div>
  );
};

export default AdminCargasView;