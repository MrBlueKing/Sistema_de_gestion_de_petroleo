// 🚀 GESTIONAR MÁQUINAS OPERADOR COMPLETO CON LAYOUT BASE COMÚN
import React, { useState, useEffect } from 'react';
import {
  FaCog,
  FaTruck,
  FaWrench,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaGasPump,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaEye,
  FaEdit,
  FaPlus,
  FaHistory,
  FaTools,
  FaClipboardList,
  FaBatteryHalf,
  FaThermometerHalf,
  FaTachometerAlt,
  FaClock 
} from 'react-icons/fa';
import { 
  FiActivity, 
  FiAlertTriangle, 
  FiTrendingUp, 
  FiClock,
  FiSettings
} from 'react-icons/fi';

// Importar el layout base y sus componentes
import AdminLayoutBase, { 
  MetricsSection, 
  MetricCard, 
  TableSection, 
  SearchInput,
  ResponsiveTable,
  AdditionalSection 
} from './AdminLayoutBase';

const GestionarMaquinasOperador = () => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaquina, setSelectedMaquina] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroMantenimiento, setFiltroMantenimiento] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  // Datos de ejemplo - después reemplazar con datos reales desde API
  const [maquinas, setMaquinas] = useState([
    {
      id: 1,
      nombre: 'Excavadora CAT 320',
      patente: 'AA-BB-12',
      tipo: 'Excavadora',
      marca: 'Caterpillar',
      modelo: '320D',
      año: 2022,
      estado: 'operativa',
      ubicacion: 'Faena Norte',
      operadorAsignado: 'Juan Pérez',
      horasOperacion: 1245,
      horasMantenimiento: 50,
      proximoMantenimiento: '2025-02-15',
      ultimoMantenimiento: '2025-01-15',
      nivelCombustible: 85,
      temperatura: 90,
      presionAceite: 'Normal',
      kilometraje: 12450,
      consumoPromedio: 15.5,
      estadoMantenimiento: 'al_dia',
      alertas: [],
      fechaCreacion: '2025-01-10T08:00:00Z'
    },
    {
      id: 2,
      nombre: 'Camión Volvo FH',
      patente: 'CC-DD-34',
      tipo: 'Camión',
      marca: 'Volvo',
      modelo: 'FH16',
      año: 2023,
      estado: 'operativa',
      ubicacion: 'Faena Sur',
      operadorAsignado: 'María González',
      horasOperacion: 890,
      horasMantenimiento: 30,
      proximoMantenimiento: '2025-02-10',
      ultimoMantenimiento: '2025-01-10',
      nivelCombustible: 65,
      temperatura: 85,
      presionAceite: 'Normal',
      kilometraje: 8900,
      consumoPromedio: 12.8,
      estadoMantenimiento: 'proximo',
      alertas: ['Mantenimiento próximo en 5 días'],
      fechaCreacion: '2025-01-08T10:30:00Z'
    },
    {
      id: 3,
      nombre: 'Retroexcavadora JCB',
      patente: 'EE-FF-56',
      tipo: 'Retroexcavadora',
      marca: 'JCB',
      modelo: '3CX',
      año: 2021,
      estado: 'mantenimiento',
      ubicacion: 'Taller Central',
      operadorAsignado: null,
      horasOperacion: 1890,
      horasMantenimiento: 120,
      proximoMantenimiento: '2025-01-25',
      ultimoMantenimiento: '2025-01-20',
      nivelCombustible: 20,
      temperatura: 70,
      presionAceite: 'Bajo',
      kilometraje: 18900,
      consumoPromedio: 14.2,
      estadoMantenimiento: 'en_curso',
      alertas: ['En mantenimiento preventivo', 'Presión de aceite baja'],
      fechaCreacion: '2025-01-05T14:15:00Z'
    },
    {
      id: 4,
      nombre: 'Bulldozer CAT D6',
      patente: 'GG-HH-78',
      tipo: 'Bulldozer',
      marca: 'Caterpillar',
      modelo: 'D6T',
      año: 2020,
      estado: 'operativa',
      ubicacion: 'Faena Este',
      operadorAsignado: 'Carlos Silva',
      horasOperacion: 2340,
      horasMantenimiento: 180,
      proximoMantenimiento: '2025-03-01',
      ultimoMantenimiento: '2025-01-01',
      nivelCombustible: 45,
      temperatura: 95,
      presionAceite: 'Normal',
      kilometraje: 23400,
      consumoPromedio: 18.7,
      estadoMantenimiento: 'vencido',
      alertas: ['Mantenimiento vencido hace 3 días', 'Temperatura alta'],
      fechaCreacion: '2025-01-01T09:00:00Z'
    },
    {
      id: 5,
      nombre: 'Grúa Liebherr',
      patente: 'II-JJ-90',
      tipo: 'Grúa',
      marca: 'Liebherr',
      modelo: 'LTM 1030',
      año: 2022,
      estado: 'fuera_servicio',
      ubicacion: 'Depósito',
      operadorAsignado: null,
      horasOperacion: 567,
      horasMantenimiento: 45,
      proximoMantenimiento: '2025-02-20',
      ultimoMantenimiento: '2025-01-18',
      nivelCombustible: 10,
      temperatura: 60,
      presionAceite: 'Crítico',
      kilometraje: 5670,
      consumoPromedio: 22.1,
      estadoMantenimiento: 'urgente',
      alertas: ['Fuera de servicio por falla mecánica', 'Presión aceite crítica', 'Requiere inspección'],
      fechaCreacion: '2025-01-03T11:45:00Z'
    }
  ]);

  // Calcular estadísticas
  const stats = {
    totalMaquinas: maquinas.length,
    operativas: maquinas.filter(m => m.estado === 'operativa').length,
    enMantenimiento: maquinas.filter(m => m.estado === 'mantenimiento').length,
    fueraServicio: maquinas.filter(m => m.estado === 'fuera_servicio').length,
    alertasActivas: maquinas.reduce((sum, m) => sum + m.alertas.length, 0),
    mantenimientoVencido: maquinas.filter(m => m.estadoMantenimiento === 'vencido').length,
    promedioHoras: Math.round(maquinas.reduce((sum, m) => sum + m.horasOperacion, 0) / maquinas.length),
    consumoPromedio: (maquinas.reduce((sum, m) => sum + m.consumoPromedio, 0) / maquinas.length).toFixed(1)
  };

  // Aplicar filtros
  const maquinasFiltradas = maquinas.filter(maquina => {
    const matchSearch = 
      maquina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.operadorAsignado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filtroEstado === 'todas' || maquina.estado === filtroEstado;
    const matchMantenimiento = filtroMantenimiento === 'todos' || maquina.estadoMantenimiento === filtroMantenimiento;

    return matchSearch && matchEstado && matchMantenimiento;
  });

  // Funciones de manejo
  const handleVerDetalle = (maquina) => {
    setSelectedMaquina(maquina);
    setModalDetalle(true);
  };

  const handleCambiarEstado = async (maquinaId, nuevoEstado) => {
    setLoading(true);
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMaquinas(prev => prev.map(m => 
        m.id === maquinaId ? { ...m, estado: nuevoEstado } : m
      ));

      setMessage({ type: 'success', text: `Estado de máquina actualizado a: ${nuevoEstado}` });
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar estado de máquina' });
    } finally {
      setLoading(false);
    }
  };

  const handleProgramarMantenimiento = async (maquinaId, fecha) => {
    setLoading(true);
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMaquinas(prev => prev.map(m => 
        m.id === maquinaId ? { 
          ...m, 
          proximoMantenimiento: fecha,
          estadoMantenimiento: 'programado'
        } : m
      ));

      setMessage({ type: 'success', text: 'Mantenimiento programado exitosamente' });
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al programar mantenimiento' });
    } finally {
      setLoading(false);
    }
  };

  // Funciones de formateo
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      operativa: 'bg-green-100 text-green-800 border-green-200',
      mantenimiento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      fuera_servicio: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      operativa: 'Operativa',
      mantenimiento: 'Mantenimiento',
      fuera_servicio: 'Fuera de Servicio'
    };

    const icons = {
      operativa: FaCheckCircle,
      mantenimiento: FaWrench,
      fuera_servicio: FaTimesCircle
    };

    const Icon = icons[estado];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[estado]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {labels[estado]}
      </span>
    );
  };

  const getMantenimientoBadge = (estadoMantenimiento) => {
    const variants = {
      al_dia: 'bg-green-100 text-green-800',
      proximo: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
      en_curso: 'bg-blue-100 text-blue-800',
      urgente: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      al_dia: 'Al día',
      proximo: 'Próximo',
      vencido: 'Vencido',
      en_curso: 'En curso',
      urgente: 'Urgente'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[estadoMantenimiento]}`}>
        {labels[estadoMantenimiento]}
      </span>
    );
  };

  // Headers para tabla
  const tableHeaders = [
    "Máquina / Operador",
    "Estado / Ubicación", 
    "Mantenimiento",
    "Métricas",
    "Acciones"
  ];

  // Función para renderizar filas de la tabla
  const renderMaquinaRow = (maquina, index, isMobile = false) => {
    const tieneAlertas = maquina.alertas.length > 0;

    if (isMobile) {
      // Vista móvil como card
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{maquina.nombre}</p>
              <p className="text-sm text-gray-600">{maquina.patente} • {maquina.tipo}</p>
              <p className="text-xs text-gray-500">{maquina.operadorAsignado || 'Sin operador'}</p>
            </div>
            {getEstadoBadge(maquina.estado)}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Ubicación:</p>
              <p className="font-medium">{maquina.ubicacion}</p>
            </div>
            <div>
              <p className="text-gray-500">Horas:</p>
              <p className="font-medium">{maquina.horasOperacion.toLocaleString()}</p>
            </div>
          </div>

          {tieneAlertas && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800 font-medium">⚠️ {maquina.alertas.length} alerta(s)</p>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {getMantenimientoBadge(maquina.estadoMantenimiento)}
            </div>
            <button
              onClick={() => handleVerDetalle(maquina)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaEye className="w-3 h-3 mr-1" />
              Ver
            </button>
          </div>
        </div>
      );
    }

    // Vista desktop
    return (
      <tr key={maquina.id} className={`hover:bg-gray-50 ${tieneAlertas ? 'bg-red-50' : ''}`}>
        {/* Máquina / Operador */}
        <td className="px-4 py-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">{maquina.nombre}</p>
            <p className="text-xs text-gray-600">{maquina.patente} • {maquina.tipo}</p>
            <p className="text-xs text-gray-500">{maquina.operadorAsignado || 'Sin operador'}</p>
          </div>
        </td>
        
        {/* Estado / Ubicación */}
        <td className="px-4 py-4 text-sm">
          <div className="space-y-1">
            {getEstadoBadge(maquina.estado)}
            <p className="text-xs text-gray-600 flex items-center">
              <FaMapMarkerAlt className="w-3 h-3 mr-1" />
              {maquina.ubicacion}
            </p>
          </div>
        </td>
        
        {/* Mantenimiento */}
        <td className="px-4 py-4 text-sm">
          <div className="space-y-1">
            {getMantenimientoBadge(maquina.estadoMantenimiento)}
            <p className="text-xs text-gray-600">
              Próximo: {formatDate(maquina.proximoMantenimiento)}
            </p>
          </div>
        </td>
        
        {/* Métricas */}
        <td className="px-4 py-4 text-sm">
          <div className="space-y-1">
            <p className="flex items-center text-xs">
              <FaClock className="w-3 h-3 mr-1 text-blue-500" />
              {maquina.horasOperacion.toLocaleString()}h
            </p>
            <p className="flex items-center text-xs">
              <FaGasPump className="w-3 h-3 mr-1 text-green-500" />
              {maquina.consumoPromedio} L/h
            </p>
            {tieneAlertas && (
              <p className="flex items-center text-xs text-red-600">
                <FaExclamationTriangle className="w-3 h-3 mr-1" />
                {maquina.alertas.length} alerta(s)
              </p>
            )}
          </div>
        </td>
        
        {/* Acciones */}
        <td className="px-4 py-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleVerDetalle(maquina)}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaEye className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleProgramarMantenimiento(maquina.id, '2025-03-01')}
              disabled={loading}
              className="inline-flex items-center px-2 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <FaWrench className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Componente de mensaje
  const MessageAlert = ({ message }) => {
    if (!message) return null;

    const bgColor = message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = message.type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = message.type === 'success' ? FaCheckCircle : FaExclamationTriangle;

    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${textColor} mr-3`} />
          <p className={`${textColor} text-sm font-medium`}>{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className={`ml-auto ${textColor} hover:opacity-75`}
          >
            <FaTimesCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Modal de detalle
  const ModalDetalle = ({ maquina, isOpen, onClose }) => {
    if (!isOpen || !maquina) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalle de Máquina: {maquina.nombre}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Información Básica</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Patente:</strong> {maquina.patente}</p>
                  <p><strong>Tipo:</strong> {maquina.tipo}</p>
                  <p><strong>Marca:</strong> {maquina.marca}</p>
                  <p><strong>Modelo:</strong> {maquina.modelo}</p>
                  <p><strong>Año:</strong> {maquina.año}</p>
                  <p><strong>Ubicación:</strong> {maquina.ubicacion}</p>
                  <p><strong>Operador:</strong> {maquina.operadorAsignado || 'Sin asignar'}</p>
                </div>
              </div>

              {/* Métricas operacionales */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Métricas Operacionales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-blue-600">Horas de Operación</p>
                    <p className="text-lg font-bold text-blue-800">{maquina.horasOperacion.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-green-600">Combustible</p>
                    <p className="text-lg font-bold text-green-800">{maquina.nivelCombustible}%</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-orange-600">Temperatura</p>
                    <p className="text-lg font-bold text-orange-800">{maquina.temperatura}°C</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-purple-600">Consumo Promedio</p>
                    <p className="text-lg font-bold text-purple-800">{maquina.consumoPromedio} L/h</p>
                  </div>
                </div>
              </div>

              {/* Estado y mantenimiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Estado y Mantenimiento</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estado actual:</span>
                    {getEstadoBadge(maquina.estado)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mantenimiento:</span>
                    {getMantenimientoBadge(maquina.estadoMantenimiento)}
                  </div>
                  <p className="text-sm"><strong>Último mantenimiento:</strong> {formatDate(maquina.ultimoMantenimiento)}</p>
                  <p className="text-sm"><strong>Próximo mantenimiento:</strong> {formatDate(maquina.proximoMantenimiento)}</p>
                </div>
              </div>

              {/* Alertas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Alertas Activas</h4>
                {maquina.alertas.length > 0 ? (
                  <div className="space-y-2">
                    {maquina.alertas.map((alerta, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-sm text-red-800 flex items-center">
                          <FaExclamationTriangle className="w-4 h-4 mr-2" />
                          {alerta}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay alertas activas</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button
              onClick={() => handleProgramarMantenimiento(maquina.id, '2025-03-01')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Programar Mantenimiento
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayoutBase
      title="Gestionar Máquinas"
      icon={FaCog}
      description="Control y monitoreo del estado operacional de la flota de máquinas"
    >
      {/* Mensaje de estado */}
      <MessageAlert message={message} />

      {/* Sección de métricas principales */}
      <MetricsSection>
        <MetricCard
          title="Total Máquinas"
          value={stats.totalMaquinas}
          icon={FaTruck}
          color="blue"
        />
        <MetricCard
          title="Operativas"
          value={stats.operativas}
          icon={FaCheckCircle}
          color="green"
          subtitle={`${Math.round(stats.operativas/stats.totalMaquinas*100)}% del total`}
        />
        <MetricCard
          title="En Mantenimiento"
          value={stats.enMantenimiento}
          icon={FaWrench}
          color="yellow"
        />
        <MetricCard
          title="Alertas Activas"
          value={stats.alertasActivas}
          icon={FaExclamationTriangle}
          color="red"
        />
      </MetricsSection>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <AdditionalSection title="Estado de Mantenimiento" className="h-fit">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-red-50 rounded">
              <span className="text-sm text-red-800">Mantenimiento vencido</span>
              <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                {stats.mantenimientoVencido}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              <p>• Revisa las máquinas con mantenimiento vencido</p>
              <p>• Programa mantenimientos preventivos</p>
            </div>
          </div>
        </AdditionalSection>

        <AdditionalSection title="Métricas Operacionales" className="h-fit">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Promedio horas</span>
              <span className="text-lg font-bold text-blue-600">{stats.promedioHoras.toLocaleString()}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Consumo promedio</span>
              <span className="text-lg font-bold text-green-600">{stats.consumoPromedio} L/h</span>
            </div>
          </div>
        </AdditionalSection>

        <AdditionalSection title="Acciones Rápidas" className="h-fit">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <FaClipboardList className="w-4 h-4 mr-2" />
              Reporte de Estado
            </button>
            <button className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              <FaCalendarAlt className="w-4 h-4 mr-2" />
              Programar Mantenimiento
            </button>
            <button className="w-full flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors">
              <FaHistory className="w-4 h-4 mr-2" />
              Historial de Máquinas
            </button>
          </div>
        </AdditionalSection>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Máquina
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todas">Todas las máquinas</option>
              <option value="operativa">Operativas</option>
              <option value="mantenimiento">En mantenimiento</option>
              <option value="fuera_servicio">Fuera de servicio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Mantenimiento
            </label>
            <select
              value={filtroMantenimiento}
              onChange={(e) => setFiltroMantenimiento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="al_dia">Al día</option>
              <option value="proximo">Próximo</option>
              <option value="vencido">Vencido</option>
              <option value="en_curso">En curso</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar máquina, patente, operador..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Tabla de máquinas */}
      <TableSection
        title={`Máquinas Registradas (${maquinasFiltradas.length} de ${stats.totalMaquinas})`}
        headerActions={
          <div className="flex space-x-2">
            <button className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              <FaPlus className="w-4 h-4 mr-1" />
              Agregar Máquina
            </button>
            <button className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <FaClipboardList className="w-4 h-4 mr-1" />
              Exportar
            </button>
          </div>
        }
      >
        <ResponsiveTable
          headers={tableHeaders}
          data={maquinasFiltradas}
          renderRow={renderMaquinaRow}
          loading={loading}
          emptyMessage={
            searchTerm || filtroEstado !== 'todas' || filtroMantenimiento !== 'todos'
              ? "No se encontraron máquinas con los filtros aplicados."
              : "No hay máquinas registradas."
          }
        />
      </TableSection>

      {/* Resumen de alertas */}
      {stats.alertasActivas > 0 && (
        <AdditionalSection 
          title={`Alertas Activas (${stats.alertasActivas})`}
          className="mt-8"
        >
          <div className="space-y-3">
            {maquinas
              .filter(m => m.alertas.length > 0)
              .map(maquina => (
                <div key={maquina.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900">{maquina.nombre} ({maquina.patente})</p>
                      <div className="space-y-1 mt-1">
                        {maquina.alertas.map((alerta, index) => (
                          <p key={index} className="text-sm text-red-700 flex items-center">
                            <FaExclamationTriangle className="w-3 h-3 mr-2" />
                            {alerta}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerDetalle(maquina)}
                      className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      <FaEye className="w-3 h-3 mr-1" />
                      Ver Detalle
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </AdditionalSection>
      )}

      {/* Modal de detalle */}
      <ModalDetalle
        maquina={selectedMaquina}
        isOpen={modalDetalle}
        onClose={() => {
          setModalDetalle(false);
          setSelectedMaquina(null);
        }}
      />
    </AdminLayoutBase>
  );
};

export default GestionarMaquinasOperador;