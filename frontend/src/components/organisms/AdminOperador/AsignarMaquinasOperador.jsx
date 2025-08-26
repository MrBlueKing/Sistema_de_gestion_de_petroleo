// 🚀 ASIGNAR MÁQUINAS CON DRAG & DROP - IMPLEMENTACIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import {
  FaUserPlus,
  FaUsers,
  FaTruck,
  FaPlus,
  FaCheck,
  FaTimes,
  FaGripVertical,
  FaExclamationTriangle,
  FaHistory,
  FaTrash,
  FaEdit,
  FaSpinner,
  FaStop
} from 'react-icons/fa';
import axios from '../../../lib/axios';
import FinalizarAsignacionModal from '../../molecules/FinalizarAsignacionModal';

// Importar el layout base y sus componentes
import AdminLayoutBase, {
  MetricsSection,
  MetricCard,
  AdditionalSection
} from './AdminLayoutBase';

// 🎯 COMPONENTE DRAGGABLE ITEM
const DraggableItem = ({ item, type, children, onDragStart, onDragEnd }) => {
  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(item, type, e);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  );
};

const AsignarMaquinasOperador = () => {
  // Estados principales
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedType, setDraggedType] = useState(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [tempAssignment, setTempAssignment] = useState({ maquina: null, operador: null });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Estados para datos reales
  const [maquinasDisponibles, setMaquinasDisponibles] = useState([]);
  const [operadoresDisponibles, setOperadoresDisponibles] = useState([]);
  const [asignacionesActivas, setAsignacionesActivas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    usuarios_disponibles: 0,
    maquinas_disponibles: 0,
    asignaciones_activas: 0,
    total_usuarios: 0,
    total_maquinas: 0,
    porcentaje_asignacion: { usuarios: 0, maquinas: 0 }
  });

  // ⭐ NUEVOS ESTADOS PARA EL MODAL DE FINALIZAR
  const [modalFinalizarOpen, setModalFinalizarOpen] = useState(false);
  const [asignacionAFinalizar, setAsignacionAFinalizar] = useState(null);

  // 🔄 Cargar datos desde la API
  const fetchDatos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Obteniendo datos de asignaciones...');

      const response = await axios.get('/api/adminOperador/asignaciones/datos');

      if (response.data.status === 'success') {
        const { data } = response.data;

        console.log('✅ Datos obtenidos:', data);

        setMaquinasDisponibles(data.maquinas_disponibles || []);
        setOperadoresDisponibles(data.usuarios_disponibles || []);
        setAsignacionesActivas(data.asignaciones_activas || []);
        setEstadisticas(data.estadisticas || estadisticas);

        setMessage({
          type: 'success',
          text: `Datos cargados: ${data.maquinas_disponibles?.length || 0} máquinas, ${data.usuarios_disponibles?.length || 0} operadores disponibles`
        });
      } else {
        console.error('❌ Error en respuesta:', response.data);
        setMessage({
          type: 'error',
          text: response.data.message || 'Error al cargar datos'
        });
      }
    } catch (error) {
      console.error('❌ Error al obtener datos:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error de conexión al cargar datos'
      });
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NUEVA FUNCIÓN: Abrir modal para finalizar asignación
  const handleAbrirModalFinalizar = (asignacion) => {
    console.log('🔚 Preparando finalización de asignación:', asignacion);
    setAsignacionAFinalizar(asignacion);
    setModalFinalizarOpen(true);
  };

  // ⭐ NUEVA FUNCIÓN: Cerrar modal
  const handleCerrarModalFinalizar = () => {
    setModalFinalizarOpen(false);
    setAsignacionAFinalizar(null);
  };

  // ⭐ FUNCIÓN ACTUALIZADA: Finalizar asignación (ahora recibe los parámetros del modal)
  const handleFinalizarAsignacion = async (asignacionId, motivoFinalizacion = '') => {
    try {
      setLoading(true);
      console.log('🔚 Finalizando asignación:', asignacionId);

      const response = await axios.post(`/api/adminOperador/asignaciones/${asignacionId}/finalizar`, {
        motivo_finalizacion: motivoFinalizacion || 'Finalizada por administrador',
        fecha_finalizacion: new Date().toISOString()
      });

      if (response.data.status === 'success') {
        console.log('✅ Asignación finalizada:', response.data.data);

        setMessage({
          type: 'success',
          text: `Asignación finalizada exitosamente. ${response.data.data.maquina_liberada} y ${response.data.data.operador_liberado} están ahora disponibles.`
        });

        // Recargar datos
        await fetchDatos();

        // Auto-limpiar mensaje
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Error al finalizar asignación'
        });
      }
    } catch (error) {
      console.error('❌ Error al finalizar asignación:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error de conexión al finalizar asignación'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FUNCIÓN CREAR ASIGNACIÓN
  const handleCrearAsignacion = async () => {
    if (!tempAssignment.maquina || !tempAssignment.operador) {
      setMessage({
        type: 'error',
        text: 'Debe seleccionar una máquina y un operador'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🆕 Creando asignación:', tempAssignment);

      const response = await axios.post('/api/adminOperador/asignaciones', {
        id_maquina: tempAssignment.maquina.id,
        id_operador: tempAssignment.operador.id,
        fecha_asignacion: new Date().toISOString().split('T')[0],
        observaciones: `Asignación creada mediante drag & drop el ${new Date().toLocaleDateString()}`
      });

      if (response.data.status === 'success') {
        console.log('✅ Asignación creada:', response.data.data);

        setMessage({
          type: 'success',
          text: `¡Asignación creada exitosamente! ${tempAssignment.maquina.nombre} → ${tempAssignment.operador.nombre_completo}`
        });

        // Limpiar formulario temporal
        setTempAssignment({ maquina: null, operador: null });

        // Recargar datos
        await fetchDatos();

        // Auto-limpiar mensaje después de 5 segundos
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Error al crear asignación'
        });
      }
    } catch (error) {
      console.error('❌ Error al crear asignación:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error de conexión al crear asignación'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🧹 FUNCIÓN LIMPIAR ASIGNACIÓN TEMPORAL
  const handleLimpiarAsignacion = () => {
    setTempAssignment({ maquina: null, operador: null });
    setMessage({
      type: 'info',
      text: 'Formulario de asignación limpiado'
    });

    // Auto-limpiar mensaje
    setTimeout(() => setMessage(null), 2000);
  };

  // 🎯 MANEJADORES DE DRAG & DROP
  const handleDragStart = (item, type, e) => {
    console.log('🎯 Drag iniciado:', { item: item.nombre || item.nombre_maquina || item.nombre_completo, type });
    setDraggedItem(item);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    console.log('🎯 Drag finalizado');
    setDraggedItem(null);
    setDraggedType(null);
    setDropZoneActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropZoneActive(true);
  };

  const handleDragLeave = (e) => {
    // Solo desactivar si realmente salimos del drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropZoneActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDropZoneActive(false);

    if (!draggedItem || !draggedType) {
      console.log('❌ No hay item arrastrado');
      return;
    }

    console.log('📦 Drop realizado:', { item: draggedItem, type: draggedType });

    if (draggedType === 'maquina') {
      setTempAssignment(prev => ({
        ...prev,
        maquina: draggedItem
      }));
      setMessage({
        type: 'info',
        text: `Máquina "${draggedItem.nombre}" agregada. Ahora arrastra un operador.`
      });
    } else if (draggedType === 'operador') {
      setTempAssignment(prev => ({
        ...prev,
        operador: draggedItem
      }));
      setMessage({
        type: 'info',
        text: `Operador "${draggedItem.nombre_completo}" agregado. ${tempAssignment.maquina ? 'Ya puedes crear la asignación.' : 'Ahora arrastra una máquina.'}`
      });
    }

    // Limpiar después del drop
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDatos();
  }, []);

  return (
    <AdminLayoutBase
      title="Asignar Máquinas a Operadores"
      subtitle="Gestiona las asignaciones de máquinas mediante drag & drop"
      showBackButton={true}
      loading={loading}
    >
      {/* Mostrar mensajes */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
          <div className="flex items-center">
            {message.type === 'success' && <FaCheck className="w-4 h-4 mr-2" />}
            {message.type === 'error' && <FaTimes className="w-4 h-4 mr-2" />}
            {message.type === 'info' && <FaExclamationTriangle className="w-4 h-4 mr-2" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Métricas */}
      <MetricsSection>
        <MetricCard
          title="Operadores Disponibles"
          value={estadisticas.usuarios_disponibles}
          icon={FaUsers}
          color="bg-green-500"
          subtitle={`${estadisticas.total_usuarios} total`}
        />
        <MetricCard
          title="Máquinas Disponibles"
          value={estadisticas.maquinas_disponibles}
          icon={FaTruck}
          color="bg-blue-500"
          subtitle={`${estadisticas.total_maquinas} total`}
        />
        <MetricCard
          title="Asignaciones Activas"
          value={estadisticas.asignaciones_activas}
          icon={FaUserPlus}
          color="bg-purple-500"
          subtitle={`${estadisticas.porcentaje_asignacion.usuarios}% usuarios asignados`}
        />
        <MetricCard
          title="Utilización Máquinas"
          value={`${estadisticas.porcentaje_asignacion.maquinas}%`}
          icon={FaHistory}
          color="bg-orange-500"
          subtitle="Porcentaje de máquinas en uso"
        />
      </MetricsSection>

      {/* Panel principal con drag & drop */}
      <div className="grid grid-cols-1 lg:grid-cols-9 gap-6 mb-8">
        {/* Panel izquierdo - Máquinas */}
        <div className="lg:col-span-3">
          <AdditionalSection title="Máquinas Disponibles" className="h-fit">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {maquinasDisponibles.map(maquina => (
                <DraggableItem
                  key={maquina.id}
                  item={maquina}
                  type="maquina"
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center hover:bg-blue-100 transition-colors cursor-grab active:cursor-grabbing">
                    <FaGripVertical className="text-gray-400 mr-3" />
                    <FaTruck className="text-blue-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{maquina.nombre}</p>
                      <p className="text-xs text-gray-600">{maquina.patente}</p>
                      <p className="text-xs text-blue-600">{maquina.categoria?.nombre || 'Sin categoría'}</p>
                    </div>
                  </div>
                </DraggableItem>
              ))}
              {maquinasDisponibles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaTruck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay máquinas disponibles</p>
                </div>
              )}
            </div>
          </AdditionalSection>
        </div>

        {/* Panel central - Zona de asignación */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6">
            <div
              className={`min-h-96 flex flex-col items-center justify-center text-center transition-all relative
                ${dropZoneActive ?
                  'bg-blue-50 border-blue-300'
                  : tempAssignment.maquina && tempAssignment.operador ?
                    'bg-green-50 border-green-300'
                    : ''
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Indicador visual cuando se está arrastrando */}
              {dropZoneActive && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center">
                  <div className="text-blue-600 font-semibold text-lg animate-pulse">
                    ⬇️ Suelta aquí
                  </div>
                </div>
              )}

              {!tempAssignment.maquina && !tempAssignment.operador ? (
                <div className="space-y-4">
                  <div className="text-6xl text-gray-300">🎯</div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      Arrastra aquí para asignar
                    </h4>
                    <p className="text-sm text-gray-600 mt-2">
                      Arrastra una máquina y un operador a esta zona para crear una asignación
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 w-full">
                  <h4 className="text-lg font-medium text-gray-900">
                    Creando Asignación
                  </h4>

                  {/* Máquina seleccionada */}
                  <div className={`p-4 rounded-lg border-2 ${tempAssignment.maquina ?
                    'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 border-dashed'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaTruck className="text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Máquina</p>
                          {tempAssignment.maquina ? (
                            <div>
                              <p className="text-sm text-gray-700">{tempAssignment.maquina.nombre}</p>
                              <p className="text-xs text-gray-500">{tempAssignment.maquina.patente}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Arrastra una máquina aquí</p>
                          )}
                        </div>
                      </div>
                      {tempAssignment.maquina && (
                        <button
                          onClick={() => setTempAssignment(prev => ({ ...prev, maquina: null }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Operador seleccionado */}
                  <div className={`p-4 rounded-lg border-2 ${tempAssignment.operador ?
                    'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 border-dashed'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaUsers className="text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Operador</p>
                          {tempAssignment.operador ? (
                            <div>
                              <p className="text-sm text-gray-700">{tempAssignment.operador.nombre_completo}</p>
                              <p className="text-xs text-gray-500">{tempAssignment.operador.rut}</p>
                              <p className="text-xs text-blue-500">{tempAssignment.operador.faena?.ubicacion}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Arrastra un operador aquí</p>
                          )}
                        </div>
                      </div>
                      {tempAssignment.operador && (
                        <button
                          onClick={() => setTempAssignment(prev => ({ ...prev, operador: null }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCrearAsignacion}
                      disabled={!tempAssignment.maquina || !tempAssignment.operador || loading}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <FaCheck className="w-4 h-4 mr-2" />
                          Crear Asignación
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleLimpiarAsignacion}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaTimes className="w-4 h-4 mr-2 inline" />
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho - Operadores */}
        <div className="lg:col-span-3">
          <AdditionalSection title="Operadores Disponibles" className="h-fit">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {operadoresDisponibles.map(operador => (
                <DraggableItem
                  key={operador.id}
                  item={operador}
                  type="operador"
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center hover:bg-green-100 transition-colors cursor-grab active:cursor-grabbing">
                    <FaGripVertical className="text-gray-400 mr-3" />
                    <FaUsers className="text-green-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{operador.nombre_completo}</p>
                      <p className="text-xs text-gray-600">{operador.rut}</p>
                      <p className="text-xs text-green-600">{operador.faena?.ubicacion || 'Sin faena'}</p>
                    </div>
                  </div>
                </DraggableItem>
              ))}
              {operadoresDisponibles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay operadores disponibles</p>
                </div>
              )}
            </div>
          </AdditionalSection>
        </div>
      </div>

      {/* Lista de asignaciones activas */}
      <AdditionalSection title="Asignaciones Activas" className="mb-8">
        <div className="space-y-4">
          {asignacionesActivas.length > 0 ? (
            asignacionesActivas.map(asignacion => (
              <div key={asignacion.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Máquina */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaTruck className="text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Máquina</span>
                      </div>
                      <p className="text-sm text-gray-700">{asignacion.maquina.nombre}</p>
                      <p className="text-xs text-gray-500">{asignacion.maquina.patente}</p>
                    </div>

                    {/* Operador */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaUsers className="text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Operador</span>
                      </div>
                      <p className="text-sm text-gray-700">{asignacion.operador.nombre_completo}</p>
                      <p className="text-xs text-gray-500">{asignacion.operador.rut}</p>
                    </div>

                    {/* Fechas */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaHistory className="text-purple-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Fechas</span>
                      </div>
                      <p className="text-sm text-gray-700">Inicio: {asignacion.fechaAsignacion}</p>
                      <p className="text-xs text-gray-500">{asignacion.diasActiva} días activa</p>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-900">Ubicación</span>
                      </div>
                      <p className="text-sm text-gray-700">{asignacion.ubicacion}</p>
                      <p className="text-xs text-green-600">Estado: {asignacion.estado}</p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="ml-4">
                    <button
                      onClick={() => handleAbrirModalFinalizar(asignacion)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FaStop className="w-4 h-4 mr-2" />
                          Finalizar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Observaciones */}
                {asignacion.observaciones && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Observaciones:</strong> {asignacion.observaciones}
                    </p>
                  </div>
                )}

              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaUserPlus className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asignaciones activas</h3>
              <p className="text-sm">Las asignaciones que crees aparecerán aquí</p>
            </div>
          )}

        </div>
      </AdditionalSection>

      {/* Instrucciones */}
      <AdditionalSection
        title="Cómo usar el Drag & Drop"
        className="mt-8"
        collapsible={true}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="text-center">
            <div className="text-3xl mb-2">👆</div>
            <h4 className="font-medium text-gray-900 mb-1">1. Selecciona</h4>
            <p>Haz clic y arrastra una máquina desde el panel izquierdo</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-medium text-gray-900 mb-1">2. Suelta</h4>
            <p>Suelta en la zona central y luego arrastra un operador</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <h4 className="font-medium text-gray-900 mb-1">3. Confirma</h4>
            <p>Haz clic en "Crear Asignación" para completar el proceso</p>
          </div>
        </div>
      </AdditionalSection>
      <FinalizarAsignacionModal
        isOpen={modalFinalizarOpen}
        onClose={handleCerrarModalFinalizar}
        onConfirm={handleFinalizarAsignacion}
        asignacion={asignacionAFinalizar}
        loading={loading}
      />
    </AdminLayoutBase>
  );
};

export default AsignarMaquinasOperador;