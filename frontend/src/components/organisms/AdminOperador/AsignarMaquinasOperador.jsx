// 🚀 ASIGNAR MÁQUINAS CON DRAG & DROP ESTILO ATLASSIAN
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
  FaEdit
} from 'react-icons/fa';

// Importar el layout base y sus componentes
import AdminLayoutBase, { 
  MetricsSection, 
  MetricCard,
  AdditionalSection 
} from './AdminLayoutBase';

const AsignarMaquinasOperador = () => {
  // Estados principales
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedType, setDraggedType] = useState(null); // 'maquina' o 'operador'
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [tempAssignment, setTempAssignment] = useState({ maquina: null, operador: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Datos de máquinas disponibles
  const [maquinasDisponibles, setMaquinasDisponibles] = useState([
    { 
      id: 1, 
      nombre: 'Excavadora CAT 320', 
      patente: 'AA-BB-12', 
      tipo: 'Excavadora',
      estado: 'disponible',
      ubicacion: 'Depósito Norte'
    },
    { 
      id: 2, 
      nombre: 'Camión Volvo FH', 
      patente: 'CC-DD-34', 
      tipo: 'Camión',
      estado: 'disponible',
      ubicacion: 'Depósito Sur'
    },
    { 
      id: 3, 
      nombre: 'Bulldozer CAT D6', 
      patente: 'GG-HH-78', 
      tipo: 'Bulldozer',
      estado: 'disponible',
      ubicacion: 'Depósito Este'
    },
    { 
      id: 4, 
      nombre: 'Grúa Liebherr', 
      patente: 'II-JJ-90', 
      tipo: 'Grúa',
      estado: 'disponible',
      ubicacion: 'Depósito Central'
    }
  ]);

  // Datos de operadores disponibles
  const [operadoresDisponibles, setOperadoresDisponibles] = useState([
    { 
      id: 1, 
      nombre: 'Juan Pérez', 
      rut: '12.345.678-9', 
      especialidad: 'Excavación',
      estado: 'disponible',
      experiencia: '5 años'
    },
    { 
      id: 2, 
      nombre: 'María González', 
      rut: '11.222.333-4', 
      especialidad: 'Transporte',
      estado: 'disponible',
      experiencia: '8 años'
    },
    { 
      id: 3, 
      nombre: 'Carlos Silva', 
      rut: '15.678.901-2', 
      especialidad: 'Minería',
      estado: 'disponible',
      experiencia: '3 años'
    },
    { 
      id: 4, 
      nombre: 'Ana Torres', 
      rut: '18.765.432-1', 
      especialidad: 'Construcción',
      estado: 'disponible',
      experiencia: '6 años'
    }
  ]);

  // Asignaciones activas
  const [asignacionesActivas, setAsignacionesActivas] = useState([
    {
      id: 1,
      maquina: { id: 5, nombre: 'Retroexcavadora JCB', patente: 'EE-FF-56' },
      operador: { id: 5, nombre: 'Pedro Morales', rut: '16.789.123-4' },
      fechaAsignacion: '2025-01-20',
      fechaVencimiento: '2025-02-20',
      estado: 'activa',
      ubicacion: 'Faena Norte'
    }
  ]);

  // 🔧 Agregar useEffect para debugging y limpieza
  useEffect(() => {
    console.log('🔄 Estado actualizado:', {
      draggedItem: draggedItem?.nombre || null,
      draggedType,
      dropZoneActive,
      tempAssignment: {
        maquina: tempAssignment.maquina?.nombre || null,
        operador: tempAssignment.operador?.nombre || null
      }
    });
  }, [draggedItem, draggedType, dropZoneActive, tempAssignment]);

  // 🔧 Limpiar estados en caso de errores
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Si no hay elemento siendo arrastrado, limpiar estados
      if (!draggedItem) {
        setDropZoneActive(false);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedItem]);
  const stats = {
    maquinasDisponibles: maquinasDisponibles.length,
    operadoresDisponibles: operadoresDisponibles.length,
    asignacionesActivas: asignacionesActivas.length,
    totalItems: maquinasDisponibles.length + operadoresDisponibles.length
  };

  // Funciones de Drag & Drop optimizadas (menos spam de logs)
  const handleDragStart = (e, item, type) => {
    console.log('🚀 Drag Start:', { item: item.nombre, type, id: item.id });
    
    // Verificar que tenemos la información necesaria
    if (!item || !type) {
      console.error('❌ Error en dragStart: item o type faltante', { item, type });
      return;
    }

    try {
      setDraggedItem(item);
      setDraggedType(type);
      
      e.dataTransfer.effectAllowed = 'move';
      
      // 🔧 Mejorar compatibilidad con diferentes navegadores
      e.dataTransfer.setData('text/plain', JSON.stringify({ item, type }));
      e.dataTransfer.setData('application/json', JSON.stringify({ item, type }));
      
      // Efecto visual
      e.target.style.opacity = '0.5';
      e.target.style.transform = 'scale(0.95)';
      
      console.log('✅ Drag iniciado correctamente');
    } catch (error) {
      console.error('❌ Error en handleDragStart:', error);
    }
  };

  const handleDragEnd = (e) => {
    console.log('🏁 Drag End - Limpiando estados');
    
    try {
      // Restaurar estilos
      e.target.style.opacity = '1';
      e.target.style.transform = 'scale(1)';
      
      // Limpiar estados (con delay para evitar bugs)
      setTimeout(() => {
        setDraggedItem(null);
        setDraggedType(null);
        setDropZoneActive(false);
      }, 100);
      
      console.log('✅ Drag finalizado y estados limpiados');
    } catch (error) {
      console.error('❌ Error en handleDragEnd:', error);
    }
  };

  // 🔧 Throttle para dragOver para reducir spam
  const [dragOverThrottle, setDragOverThrottle] = useState(false);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Solo log una vez cada 500ms para evitar spam
    if (!dragOverThrottle) {
      console.log('📍 Drag Over - Drop zone activa');
      setDragOverThrottle(true);
      setTimeout(() => setDragOverThrottle(false), 500);
    }
    
    e.dataTransfer.dropEffect = 'move';
    setDropZoneActive(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Entrando a drop zone');
    setDropZoneActive(true);
  };

  const handleDragLeave = (e) => {
    // Verificación más robusta para drag leave
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Si el cursor está fuera del área del drop zone
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      console.log('🚪 Saliendo del drop zone');
      setDropZoneActive(false);
    }
  };

  const handleDrop = (e) => {
    console.log('💧 DROP - Procesando elementos...');
    
    e.preventDefault();
    e.stopPropagation();
    
    setDropZoneActive(false);

    try {
      // Intentar obtener datos de múltiples fuentes
      let dropData = null;
      
      // Método 1: desde el estado (preferido)
      if (draggedItem && draggedType) {
        dropData = { item: draggedItem, type: draggedType };
        console.log('✅ Datos obtenidos desde estado React');
      }
      
      // Método 2: desde dataTransfer como fallback
      if (!dropData) {
        try {
          const jsonData = e.dataTransfer.getData('application/json');
          if (jsonData) {
            dropData = JSON.parse(jsonData);
            console.log('✅ Datos obtenidos desde dataTransfer');
          }
        } catch (parseError) {
          console.warn('⚠️ No se pudo parsear datos de dataTransfer');
        }
      }

      if (!dropData || !dropData.item || !dropData.type) {
        console.error('❌ No hay datos válidos para el drop');
        setMessage({ type: 'error', text: 'Error en el arrastre. Intenta de nuevo.' });
        return;
      }

      const { item, type } = dropData;
      
      console.log(`🎯 ÉXITO: ${type === 'maquina' ? '🚛' : '👤'} ${item.nombre} añadido a la asignación`);

      if (type === 'maquina') {
        setTempAssignment(prev => ({ ...prev, maquina: item }));
      } else if (type === 'operador') {
        setTempAssignment(prev => ({ ...prev, operador: item }));
      }

      // Limpiar estados
      setDraggedItem(null);
      setDraggedType(null);
      
      console.log('🎉 Drop completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en handleDrop:', error);
      setMessage({ type: 'error', text: 'Error al procesar el arrastre. Intenta nuevamente.' });
    }
  };

  // Función para crear asignación
  const handleCrearAsignacion = async () => {
    if (!tempAssignment.maquina || !tempAssignment.operador) {
      setMessage({ type: 'error', text: 'Necesitas una máquina Y un operador para crear la asignación' });
      return;
    }

    setLoading(true);
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const nuevaAsignacion = {
        id: Date.now(),
        maquina: tempAssignment.maquina,
        operador: tempAssignment.operador,
        fechaAsignacion: new Date().toISOString().split('T')[0],
        fechaVencimiento: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        estado: 'activa',
        ubicacion: tempAssignment.maquina.ubicacion
      };

      setAsignacionesActivas(prev => [...prev, nuevaAsignacion]);

      // Remover de disponibles
      setMaquinasDisponibles(prev => prev.filter(m => m.id !== tempAssignment.maquina.id));
      setOperadoresDisponibles(prev => prev.filter(o => o.id !== tempAssignment.operador.id));

      // Limpiar asignación temporal
      setTempAssignment({ maquina: null, operador: null });
      setMessage({ type: 'success', text: '¡Asignación creada exitosamente!' });

    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear la asignación' });
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar asignación temporal
  const handleLimpiarAsignacion = () => {
    setTempAssignment({ maquina: null, operador: null });
  };

  // Función para finalizar asignación
  const handleFinalizarAsignacion = async (asignacionId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const asignacion = asignacionesActivas.find(a => a.id === asignacionId);
      
      // Devolver a disponibles
      setMaquinasDisponibles(prev => [...prev, { 
        ...asignacion.maquina, 
        estado: 'disponible' 
      }]);
      setOperadoresDisponibles(prev => [...prev, { 
        ...asignacion.operador, 
        estado: 'disponible' 
      }]);

      // Remover de asignaciones activas
      setAsignacionesActivas(prev => prev.filter(a => a.id !== asignacionId));

      setMessage({ type: 'success', text: 'Asignación finalizada exitosamente' });

    } catch (error) {
      setMessage({ type: 'error', text: 'Error al finalizar asignación' });
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  // Componente para items arrastrables mejorado
  const DraggableItem = ({ item, type, children }) => {
    // 🔧 Agregar manejo de eventos de mouse para mejor UX
    const handleMouseDown = (e) => {
      console.log('🖱️ Mouse down en:', item.nombre);
      e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseUp = (e) => {
      e.currentTarget.style.cursor = 'grab';
    };

    return (
      <div
        draggable={true}
        onDragStart={(e) => handleDragStart(e, item, type)}
        onDragEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 select-none"
        style={{ touchAction: 'none' }} // Mejor soporte para móviles
      >
        {children}
      </div>
    );
  };

  // Componente de mensaje
  const MessageAlert = ({ message }) => {
    if (!message) return null;

    const bgColor = message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = message.type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = message.type === 'success' ? FaCheck : FaExclamationTriangle;

    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${textColor} mr-3`} />
          <p className={`${textColor} text-sm font-medium`}>{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className={`ml-auto ${textColor} hover:opacity-75`}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayoutBase
      title="Asignar Máquinas con Drag & Drop"
      icon={FaUserPlus}
      description="Arrastra y suelta para crear asignaciones de manera intuitiva"
    >
      {/* Mensaje de estado */}
      <MessageAlert message={message} />

      {/* Métricas principales */}
      <MetricsSection>
        <MetricCard
          title="Máquinas Disponibles"
          value={stats.maquinasDisponibles}
          icon={FaTruck}
          color="blue"
        />
        <MetricCard
          title="Operadores Disponibles"
          value={stats.operadoresDisponibles}
          icon={FaUsers}
          color="green"
        />
        <MetricCard
          title="Asignaciones Activas"
          value={stats.asignacionesActivas}
          icon={FaUserPlus}
          color="yellow"
        />
        <MetricCard
          title="Total Items"
          value={stats.totalItems}
          icon={FaPlus}
          color="purple"
        />
      </MetricsSection>

      {/* Zona principal de Drag & Drop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Panel izquierdo - Máquinas */}
        <div className="lg:col-span-3">
          <AdditionalSection title="Máquinas Disponibles" className="h-fit">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {maquinasDisponibles.map(maquina => (
                <DraggableItem key={maquina.id} item={maquina} type="maquina">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center hover:bg-blue-100 transition-colors">
                    <FaGripVertical className="text-gray-400 mr-3" />
                    <FaTruck className="text-blue-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{maquina.nombre}</p>
                      <p className="text-xs text-gray-600">{maquina.patente}</p>
                      <p className="text-xs text-blue-600">{maquina.tipo}</p>
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

        {/* Zona central - Drop Zone */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Zona de Asignación
            </h3>
            
            {/* Drop Zone mejorado */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 min-h-[300px] relative
                ${dropZoneActive 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : 'border-gray-300 bg-gray-50'
                }
                ${tempAssignment.maquina || tempAssignment.operador 
                  ? 'bg-green-50 border-green-300' 
                  : ''
                }
              `}
              style={{ 
                position: 'relative',
                overflow: 'hidden'
              }}
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
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    Creando Asignación
                  </h4>
                  
                  {/* Máquina seleccionada */}
                  <div className={`p-4 rounded-lg border-2 ${tempAssignment.maquina ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300 border-dashed'}`}>
                    {tempAssignment.maquina ? (
                      <div className="flex items-center">
                        <FaTruck className="text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{tempAssignment.maquina.nombre}</p>
                          <p className="text-sm text-gray-600">{tempAssignment.maquina.patente} • {tempAssignment.maquina.tipo}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center">
                        <FaTruck className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Arrastra una máquina aquí</p>
                      </div>
                    )}
                  </div>

                  {/* Operador seleccionado */}
                  <div className={`p-4 rounded-lg border-2 ${tempAssignment.operador ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300 border-dashed'}`}>
                    {tempAssignment.operador ? (
                      <div className="flex items-center">
                        <FaUsers className="text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{tempAssignment.operador.nombre}</p>
                          <p className="text-sm text-gray-600">{tempAssignment.operador.especialidad} • {tempAssignment.operador.experiencia}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center">
                        <FaUsers className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Arrastra un operador aquí</p>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={handleLimpiarAsignacion}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaTimes className="w-4 h-4 mr-2" />
                      Limpiar
                    </button>
                    <button
                      onClick={handleCrearAsignacion}
                      disabled={!tempAssignment.maquina || !tempAssignment.operador || loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <FaCheck className="w-4 h-4 mr-2" />
                          Crear Asignación
                        </>
                      )}
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
                <DraggableItem key={operador.id} item={operador} type="operador">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center hover:bg-green-100 transition-colors">
                    <FaGripVertical className="text-gray-400 mr-3" />
                    <FaUsers className="text-green-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{operador.nombre}</p>
                      <p className="text-xs text-gray-600">{operador.rut}</p>
                      <p className="text-xs text-green-600">{operador.especialidad}</p>
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
      <AdditionalSection title={`Asignaciones Activas (${asignacionesActivas.length})`}>
        {asignacionesActivas.length > 0 ? (
          <div className="space-y-4">
            {asignacionesActivas.map(asignacion => (
              <div key={asignacion.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Máquina */}
                    <div className="flex items-center">
                      <FaTruck className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{asignacion.maquina.nombre}</p>
                        <p className="text-xs text-gray-600">{asignacion.maquina.patente}</p>
                      </div>
                    </div>

                    {/* Operador */}
                    <div className="flex items-center">
                      <FaUsers className="text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{asignacion.operador.nombre}</p>
                        <p className="text-xs text-gray-600">{asignacion.operador.rut}</p>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div>
                      <p className="text-sm text-gray-900">
                        <strong>Asignado:</strong> {formatDate(asignacion.fechaAsignacion)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Vence:</strong> {formatDate(asignacion.fechaVencimiento)}
                      </p>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <p className="text-sm text-gray-900">
                        <strong>Ubicación:</strong> {asignacion.ubicacion}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {asignacion.estado}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleFinalizarAsignacion(asignacion.id)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <FaTimes className="w-3 h-3 mr-1" />
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay asignaciones activas
            </h3>
            <p className="text-gray-600">
              Usa la zona de drag & drop para crear tu primera asignación
            </p>
          </div>
        )}
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
    </AdminLayoutBase>
  );
};

export default AsignarMaquinasOperador;