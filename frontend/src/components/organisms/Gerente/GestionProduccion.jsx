import React, { useState, useEffect } from 'react';
import axios from '../../../lib/axios';
import {
  FiCalendar,
  FiRefreshCw,
  FiTruck,
  FiTarget,
  FiTrendingUp,
  FiBarChart2,
  FiFilter,
  FiMapPin,
  FiChevronDown,
  FiX,
  FiDownload,
  FiAlertCircle,
  FiMenu
} from 'react-icons/fi';
import Header from "../../organisms/Gerente/Header";
import UniversalHeader from '../Todos/UniversalHeader';

const ProduccionDiaria = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer por defecto
    fechaFin: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer por defecto
    faenasSeleccionadas: []
  });
  
  // Estados para datos
  const [faenasDisponibles, setFaenasDisponibles] = useState([]);
  const [datosProduccion, setDatosProduccion] = useState({
    produccion_por_fecha: {},
    resumen_periodo: null
  });
  
  // Estado para vista actual
  const [fechaVistaActual, setFechaVistaActual] = useState('');
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [vistaActual, setVistaActual] = useState('agregado'); // 'agregado' o 'por_fecha'

  // Cargar faenas disponibles al montar el componente
  useEffect(() => {
    cargarFaenasDisponibles();
    cargarDatosIniciales();
  }, []);

  // Función para obtener datos agregados de todas las fechas
  const obtenerDatosAgregados = () => {
    if (!datosProduccion.produccion_por_fecha || Object.keys(datosProduccion.produccion_por_fecha).length === 0) {
      return {
        padrones: [],
        totales_planta: [],
        total_general: { tonelaje: 0, ley_promedio: 0, viajes: 0, padrones_activos: 0 }
      };
    }

    // Agregar todos los padrones de todas las fechas
    const padronesAgregados = {};
    const plantasAgregadas = {};
    let totalGeneral = { tonelaje: 0, viajes: 0, ley_suma: 0, ley_count: 0 };

    // Procesar cada fecha
    Object.values(datosProduccion.produccion_por_fecha).forEach(fechaData => {
      if (fechaData.padrones) {
        fechaData.padrones.forEach(padron => {
          const key = `${padron.faena}-${padron.padron}-${padron.planta}`;
          
          if (!padronesAgregados[key]) {
            padronesAgregados[key] = {
              faena: padron.faena,
              capacidad: padron.capacidad,
              padron: padron.padron,
              planta: padron.planta,
              tonelaje: 0,
              viajes: 0,
              ley_suma: 0,
              ley_count: 0,
              ley_ponderada: 0
            };
          }

          // Agregar valores
          padronesAgregados[key].tonelaje += parseFloat(padron.tonelaje) || 0;
          padronesAgregados[key].viajes += parseInt(padron.viajes) || 0;
          
          if (padron.ley_ponderada && padron.ley_ponderada > 0) {
            padronesAgregados[key].ley_suma += parseFloat(padron.ley_ponderada);
            padronesAgregados[key].ley_count += 1;
          }
        });
      }

      // Agregar totales por planta
      if (fechaData.totales_planta) {
        fechaData.totales_planta.forEach(planta => {
          if (!plantasAgregadas[planta.planta]) {
            plantasAgregadas[planta.planta] = {
              planta: planta.planta,
              tonelaje: 0,
              viajes: 0,
              ley_suma: 0,
              ley_count: 0
            };
          }

          plantasAgregadas[planta.planta].tonelaje += parseFloat(planta.tonelaje) || 0;
          plantasAgregadas[planta.planta].viajes += parseInt(planta.viajes) || 0;
          
          if (planta.ley_promedio && planta.ley_promedio > 0) {
            plantasAgregadas[planta.planta].ley_suma += parseFloat(planta.ley_promedio);
            plantasAgregadas[planta.planta].ley_count += 1;
          }
        });
      }

      // Agregar total general
      if (fechaData.total_general) {
        totalGeneral.tonelaje += parseFloat(fechaData.total_general.tonelaje) || 0;
        totalGeneral.viajes += parseInt(fechaData.total_general.viajes) || 0;
        
        if (fechaData.total_general.ley_promedio && fechaData.total_general.ley_promedio > 0) {
          totalGeneral.ley_suma += parseFloat(fechaData.total_general.ley_promedio);
          totalGeneral.ley_count += 1;
        }
      }
    });

    // Calcular promedios de ley para padrones
    Object.values(padronesAgregados).forEach(padron => {
      padron.ley_ponderada = padron.ley_count > 0 ? padron.ley_suma / padron.ley_count : 0;
      delete padron.ley_suma;
      delete padron.ley_count;
    });

    // Calcular promedios de ley para plantas
    const totalesPlantaFinal = Object.values(plantasAgregadas).map(planta => ({
      planta: planta.planta,
      tonelaje: planta.tonelaje,
      viajes: planta.viajes,
      ley_promedio: planta.ley_count > 0 ? planta.ley_suma / planta.ley_count : 0
    }));

    // Calcular promedio de ley general
    const leyPromedioGeneral = totalGeneral.ley_count > 0 ? totalGeneral.ley_suma / totalGeneral.ley_count : 0;

    return {
      padrones: Object.values(padronesAgregados).sort((a, b) => a.faena.localeCompare(b.faena) || a.planta.localeCompare(b.planta)),
      totales_planta: totalesPlantaFinal.sort((a, b) => a.planta.localeCompare(b.planta)),
      total_general: {
        tonelaje: totalGeneral.tonelaje,
        ley_promedio: leyPromedioGeneral,
        viajes: totalGeneral.viajes,
        padrones_activos: Object.keys(padronesAgregados).length
      }
    };
  };

  const cargarFaenasDisponibles = async () => {
    try {
      const response = await axios.get('/api/produccion/faenasProd');
      if (response.data.success) {
        setFaenasDisponibles(response.data.data);
      } else {
        setError('No se pudieron cargar las faenas');
      }
    } catch (error) {
      console.error('Error al cargar faenas:', error);
      setError('Error de conexión al cargar faenas');
    }
  };

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      setError(null);
      await aplicarFiltros();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const params = {
        fecha_inicio: filtros.fechaInicio,
        fecha_fin: filtros.fechaFin
      };

      // Solo agregar faenas si hay alguna seleccionada
      if (filtros.faenasSeleccionadas.length > 0) {
        params.faenas = filtros.faenasSeleccionadas;
      }

      console.log('Aplicando filtros:', params); // Debug

      const response = await axios.get('/api/produccion/filtrada', { params });
      
      console.log('Respuesta del servidor:', response.data); // Debug
      
      if (response.data.success) {
        setDatosProduccion(response.data.data);
        
        // Configurar fechas disponibles y vista actual
        const fechas = Object.keys(response.data.data.produccion_por_fecha).sort((a, b) => new Date(b) - new Date(a));
        setFechasDisponibles(fechas);
        setFechaVistaActual(fechas[0] || '');
        
        console.log('Fechas disponibles:', fechas); // Debug
        console.log('Total registros:', response.data.data.total_registros); // Debug
        
        if (fechas.length === 0) {
          setError('No se encontraron datos para los filtros seleccionados');
        }
      } else {
        setError(response.data.message || 'Error al obtener los datos');
        setDatosProduccion({
          produccion_por_fecha: {},
          resumen_periodo: null
        });
        setFechasDisponibles([]);
        setFechaVistaActual('');
      }
    } catch (error) {
      console.error('Error al aplicar filtros:', error);
      setError(`Error de conexión: ${error.response?.data?.message || error.message}`);
      setDatosProduccion({
        produccion_por_fecha: {},
        resumen_periodo: null
      });
      setFechasDisponibles([]);
      setFechaVistaActual('');
    } finally {
      setRefreshing(false);
    }
  };

  // Aplicar filtros automáticamente cuando cambien
  useEffect(() => {
    if (faenasDisponibles.length > 0) { // Solo aplicar si ya se cargaron las faenas
      aplicarFiltros();
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.faenasSeleccionadas]);

  // Manejadores de eventos
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleFaenaToggle = (idFaena) => {
    setFiltros(prev => ({
      ...prev,
      faenasSeleccionadas: prev.faenasSeleccionadas.includes(idFaena)
        ? prev.faenasSeleccionadas.filter(id => id !== idFaena)
        : [...prev.faenasSeleccionadas, idFaena]
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      fechaFin: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      faenasSeleccionadas: []
    });
  };

  const establecerRangoRapido = (dias) => {
    const fin = new Date();
    fin.setDate(fin.getDate() - 1); // Terminar en ayer
    const inicio = new Date(fin);
    inicio.setDate(inicio.getDate() - (dias - 1));
    
    setFiltros(prev => ({
      ...prev,
      fechaInicio: inicio.toISOString().split('T')[0],
      fechaFin: fin.toISOString().split('T')[0]
    }));
  };

  // Formateo y utilidades
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('es-CL', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha + 'T12:00:00');
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFechaCorta = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha + 'T12:00:00');
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener datos de la fecha actual seleccionada
  const datosActuales = datosProduccion.produccion_por_fecha[fechaVistaActual] || {
    padrones: [],
    totales_planta: [],
    total_general: { tonelaje: 0, ley_promedio: 0, viajes: 0, padrones_activos: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de producción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="block lg:hidden">
          <UniversalHeader type="gerente" />
        </div>
        <div className="hidden lg:block">
          <UniversalHeader type="gerente" />
        </div>

        {/* Header con controles */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Producción por Faenas</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Vista detallada con filtros avanzados</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiFilter className="w-4 h-4" />
                <span>Filtros</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={aplicarFiltros}
                disabled={refreshing}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 border space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro de fecha inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={filtros.fechaInicio}
                      onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Filtro de fecha fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={filtros.fechaFin}
                      onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Botones de rangos rápidos */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rangos Rápidos</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => establecerRangoRapido(1)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex-1 sm:flex-none"
                    >
                      Ayer
                    </button>
                    <button
                      onClick={() => establecerRangoRapido(7)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex-1 sm:flex-none"
                    >
                      7 días
                    </button>
                    <button
                      onClick={() => establecerRangoRapido(30)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 flex-1 sm:flex-none"
                    >
                      30 días
                    </button>
                  </div>
                </div>

                {/* Botón limpiar filtros */}
                <div className="flex items-end">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>

              {/* Filtro de faenas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faenas</label>
                <div className="flex flex-wrap gap-2">
                  {faenasDisponibles.map((faena) => (
                    <button
                      key={faena.id_faena}
                      onClick={() => handleFaenaToggle(faena.id_faena)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                        filtros.faenasSeleccionadas.includes(faena.id_faena)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiMapPin className="w-4 h-4" />
                      <span className="text-sm">{faena.ubicacion}</span>
                    </button>
                  ))}
                </div>
                {filtros.faenasSeleccionadas.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">Todas las faenas seleccionadas por defecto</p>
                )}
              </div>

              {/* Botón aplicar filtros */}
              <div className="flex justify-center pt-4 border-t">
                <button
                  onClick={aplicarFiltros}
                  disabled={refreshing}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Aplicando...' : 'Aplicar Filtros'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mostrar estado de los datos */}
        {!error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <span className="text-blue-700">
                  📊 Período: {formatFechaCorta(filtros.fechaInicio)} - {formatFechaCorta(filtros.fechaFin)}
                </span>
                {filtros.faenasSeleccionadas.length > 0 && (
                  <span className="text-blue-700">
                    📍 Faenas: {filtros.faenasSeleccionadas.length} seleccionadas
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <span className="text-blue-600">
                  {fechasDisponibles.length} fecha{fechasDisponibles.length !== 1 ? 's' : ''} con datos
                </span>
                <span className="text-blue-600">
                  Vista: {vistaActual === 'agregado' ? 'Agregada' : 'Individual'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Selector de vista */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Vista de Datos</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setVistaActual('agregado')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex-1 sm:flex-none ${
                    vistaActual === 'agregado' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Vista Agregada
                </button>
                <button
                  onClick={() => setVistaActual('por_fecha')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex-1 sm:flex-none ${
                    vistaActual === 'por_fecha' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Por Fecha
                </button>
              </div>
              
              {vistaActual === 'por_fecha' && fechasDisponibles.length > 1 && (
                <select
                  value={fechaVistaActual}
                  onChange={(e) => setFechaVistaActual(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fechasDisponibles.map(fecha => (
                    <option key={fecha} value={fecha}>
                      {formatFechaCorta(fecha)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Resumen del período (cuando hay múltiples fechas y vista agregada) */}
        {datosProduccion.resumen_periodo && fechasDisponibles.length > 1 && vistaActual === 'agregado' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">
                Resumen del Período ({formatFechaCorta(filtros.fechaInicio)} - {formatFechaCorta(filtros.fechaFin)})
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{formatNumber(datosProduccion.resumen_periodo.tonelaje_total)}</div>
                <div className="text-xs sm:text-sm text-blue-600">Toneladas Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-700">{formatNumber(datosProduccion.resumen_periodo.ley_promedio_periodo)}%</div>
                <div className="text-xs sm:text-sm text-green-600">Ley Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-700">{datosProduccion.resumen_periodo.viajes_total}</div>
                <div className="text-xs sm:text-sm text-purple-600">Viajes Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-700">{datosProduccion.resumen_periodo.dias_con_produccion}</div>
                <div className="text-xs sm:text-sm text-orange-600">Días Activos</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-red-700">{datosProduccion.resumen_periodo.padrones_distintos}</div>
                <div className="text-xs sm:text-sm text-red-600">Padrones</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-700">{datosProduccion.resumen_periodo.faenas_activas}</div>
                <div className="text-xs sm:text-sm text-gray-600">Faenas</div>
              </div>
            </div>
          </div>
        )}

        {/* Layout principal - Mobile first con sidebar toggle */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0">
          
          {/* Botón para mostrar métricas en móvil */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border"
            >
              <FiMenu className="w-4 h-4" />
              <span>{showSidebar ? 'Ocultar Métricas' : 'Ver Métricas'}</span>
            </button>
          </div>

          {/* Panel lateral con métricas - Responsive */}
          <div className={`lg:order-2 space-y-4 lg:space-y-6 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
            
            {/* Resumen rápido */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiBarChart2 className="w-4 h-4 mr-2" />
                {vistaActual === 'agregado' ? 'Resumen del Período' : 'Resumen de la Fecha'}
              </h3>
              <div className="space-y-2 text-sm">
                {(() => {
                  const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Toneladas:</span>
                        <span className="font-medium">{formatNumber(datos.total_general.tonelaje)} t</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Viajes:</span>
                        <span className="font-medium">{datos.total_general.viajes || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ley Promedio:</span>
                        <span className="font-medium">{formatNumber(datos.total_general.ley_promedio)}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Padrones Activos:</span>
                        <span className="font-medium">{datos.padrones?.filter(p => p.tonelaje > 0).length || 0}</span>
                      </div>
                      {vistaActual === 'agregado' && datosProduccion.resumen_periodo && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Días Productivos:</span>
                          <span className="font-medium">{datosProduccion.resumen_periodo.dias_con_produccion}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Distribución por planta */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-yellow-50 px-4 py-3 border-b">
                <h3 className="text-sm font-medium text-gray-700 text-center">
                  Distribución por Planta
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {(() => {
                    const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                    return datos.totales_planta && datos.totales_planta.length > 0 ? (
                      datos.totales_planta.map((planta, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900 text-sm">{planta.planta}</span>
                            <span className="text-xs text-gray-500">{planta.viajes} viajes</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Toneladas:</span>
                              <span className="font-medium">{formatNumber(planta.tonelaje)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ley promedio:</span>
                              <span className="font-medium">{formatNumber(planta.ley_promedio)}%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4 text-sm">
                        No hay datos de plantas disponibles
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Distribución por faena */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-green-50 px-4 py-3 border-b">
                <h3 className="text-sm font-medium text-gray-700 text-center flex items-center justify-center">
                  <FiMapPin className="w-4 h-4 mr-2" />
                  Faenas Activas
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {(() => {
                    // Agrupar por faena según la vista actual
                    const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                    const faenasAgrupadas = {};
                    
                    if (datos.padrones) {
                      datos.padrones.forEach(padron => {
                        if (!faenasAgrupadas[padron.faena]) {
                          faenasAgrupadas[padron.faena] = {
                            tonelaje: 0,
                            viajes: 0,
                            padrones: 0
                          };
                        }
                        faenasAgrupadas[padron.faena].tonelaje += parseFloat(padron.tonelaje) || 0;
                        faenasAgrupadas[padron.faena].viajes += parseInt(padron.viajes) || 0;
                        faenasAgrupadas[padron.faena].padrones += 1;
                      });
                    }

                    return Object.keys(faenasAgrupadas).length > 0 ? (
                      Object.entries(faenasAgrupadas).map(([faena, datos]) => (
                        <div key={faena} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{faena || 'Sin faena'}</div>
                            <div className="text-xs text-gray-500">{datos.padrones} padrón{datos.padrones !== 1 ? 'es' : ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 text-sm">{formatNumber(datos.tonelaje)} t</div>
                            <div className="text-xs text-gray-500">{datos.viajes} viajes</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4 text-sm">
                        {vistaActual === 'agregado' ? 'No hay faenas activas en el período' : 'No hay faenas activas en esta fecha'}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Estado de conexión */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiTarget className="w-4 h-4 mr-2" />
                Estado del Sistema
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Faenas disponibles:</span>
                  <span className="font-medium">{faenasDisponibles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado conexión:</span>
                  <span className={`font-medium ${error ? 'text-red-600' : 'text-green-600'}`}>
                    {error ? 'Error' : 'Conectado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vista actual:</span>
                  <span className="font-medium">{vistaActual === 'agregado' ? 'Agregada' : 'Por fecha'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última consulta:</span>
                  <span className="font-medium text-xs">{new Date().toLocaleTimeString('es-ES')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla principal de producción */}
          <div className="lg:col-span-2 lg:order-1 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {vistaActual === 'agregado' ? 
                  `Producción Agregada (${formatFechaCorta(filtros.fechaInicio)} - ${formatFechaCorta(filtros.fechaFin)})` :
                  `Producción ${formatFecha(fechaVistaActual)}`
                }
              </h3>
            </div>
            
            {/* Tabla responsive con scroll horizontal */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                      Faena
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r hidden sm:table-cell">
                      Capacidad
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                      Padrón
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r hidden md:table-cell">
                      Planta
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                      Tonelaje
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-r hidden sm:table-cell">
                      Ley %
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Viajes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Obtener datos según la vista seleccionada
                    const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                    
                    return datos.padrones && datos.padrones.length > 0 ? (
                      datos.padrones.map((padron, index) => (
                        <tr key={`${padron.faena}-${padron.padron}-${index}`} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r">
                            <div className="flex items-center">
                              <FiMapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">{padron.faena || '-'}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r hidden sm:table-cell">
                            {padron.capacidad || '-'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r font-medium">
                            <div className="max-w-[100px] sm:max-w-none truncate" title={padron.padron}>
                              {padron.padron || '-'}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r hidden md:table-cell">
                            {padron.planta || '-'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right border-r font-medium">
                            {formatNumber(padron.tonelaje)}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right border-r hidden sm:table-cell">
                            {padron.ley_ponderada ? formatNumber(padron.ley_ponderada) + '%' : '-'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right">
                            {padron.viajes || 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">
                          {error ? 'Error al cargar datos' : 'No hay registros de producción para los filtros seleccionados'}
                        </td>
                      </tr>
                    );
                  })()}
                  
                  {/* Separador */}
                  {(() => {
                    const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                    return datos.padrones && datos.padrones.length > 0 && (
                      <tr>
                        <td colSpan="7" className="py-2"></td>
                      </tr>
                    );
                  })()}

                  {/* Totales por planta */}
                  {(() => {
                    const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                    return datos.totales_planta && datos.totales_planta.map((total, index) => (
                      <tr key={`total-${index}`} className="bg-gray-50 font-medium">
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r"></td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r hidden sm:table-cell"></td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r font-bold">
                          TOTAL {total.planta}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r hidden md:table-cell"></td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right border-r font-bold">
                          {formatNumber(total.tonelaje)}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right border-r font-bold hidden sm:table-cell">
                          {formatNumber(total.ley_promedio)}%
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right font-bold">
                          {total.viajes}
                        </td>
                      </tr>
                    ));
                  })()}

                  {/* Total general */}
                  {(() => {
                    const datos = vistaActual === 'agregado' ? obtenerDatosAgregados() : datosActuales;
                    return datos.total_general && datos.total_general.tonelaje > 0 && (
                      <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r"></td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r hidden sm:table-cell"></td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r font-bold">
                          Total General
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r hidden md:table-cell"></td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right border-r font-bold">
                          {formatNumber(datos.total_general.tonelaje)}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right border-r font-bold hidden sm:table-cell">
                          {formatNumber(datos.total_general.ley_promedio)}%
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right font-bold">
                          {datos.total_general.viajes}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="bg-gray-50 rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
              <span>Última actualización: {new Date().toLocaleTimeString('es-ES')}</span>
              {vistaActual === 'agregado' && datosProduccion.resumen_periodo && (
                <span className="hidden sm:inline">
                  Promedio diario: {formatNumber((datosProduccion.resumen_periodo.tonelaje_total || 0) / Math.max(1, datosProduccion.resumen_periodo.dias_con_produccion || 1))} t/día
                </span>
              )}
              <span>Vista: {vistaActual === 'agregado' ? 'Datos agregados' : 'Fecha individual'}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <button 
                onClick={() => window.print()}
                className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-white text-xs"
              >
                <FiDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProduccionDiaria;