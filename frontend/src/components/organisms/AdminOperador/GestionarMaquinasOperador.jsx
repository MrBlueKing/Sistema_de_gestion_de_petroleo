import React, { useState, useEffect } from 'react';
import {
  FaTruck,
  FaPlus,
  FaSave,
  FaTimes,
  FaBuilding,
  FaIndustry,
  FaGasPump,
  FaWrench,
  FaEye,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaList
} from 'react-icons/fa';
import axios from '../../../lib/axios';
import ModalConfirmacionEliminar from '../../molecules/ModalConfirmacionEliminar'; // Ajusta la ruta según tu estructura

// Importar el layout base y sus componentes
import AdminLayoutBase, {
  MetricsSection,
  MetricCard,
  AdditionalSection
} from './AdminLayoutBase';

const GestionarMaquinasOperador = () => {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [maquinaEditando, setMaquinaEditando] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [maquinaDetalle, setMaquinaDetalle] = useState(null);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [maquinaAEliminar, setMaquinaAEliminar] = useState(null);

  

  // Estados para el formulario (SIMPLIFICADO - Solo máquinas internas)
  const [formData, setFormData] = useState({
    nombre_maquina: '',
    patente: '',
    id_categoria: ''
  });

  // Estados para datos de la API
  const [categorias, setCategorias] = useState([]);
  const [maquinasRegistradas, setMaquinasRegistradas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_maquinas: 0,
    maquinas_internas: 0,
    maquinas_externas: 0,
    maquinas_operativas: 0
  });

  // 🔄 Cargar datos iniciales
  const fetchDatos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos iniciales...');

      const datosResponse = await axios.get('/api/adminOperador/maquinas/datos');
      if (datosResponse.data.status === 'success') {
        const { data } = datosResponse.data;
        console.log('📋 Estructura de datos recibidos:', data);

        setCategorias(data.categorias || []);
        setMaquinasRegistradas(data.maquinas || []);

        // Calcular estadísticas
        const maquinas = data.maquinas || [];
        setEstadisticas({
          total_maquinas: maquinas.length,
          maquinas_internas: maquinas.filter(m => m.tipo_maquina === 'Interno').length,
          maquinas_externas: maquinas.filter(m => m.tipo_maquina === 'Externo').length,
          maquinas_operativas: maquinas.filter(m => m.estado === 'operativo').length
        });
      }

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar datos iniciales'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🆕 Registrar nueva máquina
  const handleRegistrarMaquina = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      console.log('🆕 Registrando máquina:', formData);

      const endpoint = '/api/adminOperador/maquinas';
      const payload = {
        nombre_maquina: formData.nombre_maquina,
        tipo_maquina: 'Interno', // ✅ SIEMPRE INTERNO
        patente: formData.patente,
        id_categoria: parseInt(formData.id_categoria),
        // ✅ VALORES AUTOMÁTICOS (no vienen del formulario)
        estado: 'operativo',
        chc_maquina: null,
        id_faena: 6 // Faena por defecto
      };

      console.log('📤 Payload enviado:', payload);

      const response = await axios.post(endpoint, payload);

      if (response.data.status === 'success') {
        setMessage({
          type: 'success',
          text: response.data.message || 'Máquina registrada exitosamente'
        });

        resetFormData();
        setMostrarFormulario(false);
        await fetchDatos();
      } else {
        throw new Error(response.data.message || 'Error desconocido');
      }

    } catch (error) {
      console.error('❌ Error al registrar máquina:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Error al registrar máquina'
      });
    } finally {
      setLoading(false);
    }
  };

  // 👁️ Ver detalle de máquina
  const handleVerDetalle = async (maquina) => {
    try {
      setLoading(true);
      console.log('👁️ Cargando detalle de máquina:', maquina.id_maquina);

      // Obtener información completa de la máquina
      const response = await axios.get(`/api/adminOperador/maquinas/${maquina.id_maquina}`);

      if (response.data.status === 'success') {
        setMaquinaDetalle({
          ...response.data.data,
          // Agregar datos calculados
          dias_desde_registro: Math.floor((new Date() - new Date(maquina.created_at)) / (1000 * 60 * 60 * 24)),
          tiene_asignaciones: false, // Podrías consultar si tiene asignaciones activas
          ultimo_consumo: null, // Podrías consultar último registro de consumo
          total_consumos: 0 // Podrías consultar total de consumos
        });
        setMostrarDetalle(true);
      }
    } catch (error) {
      console.error('❌ Error al cargar detalle:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los detalles de la máquina'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleEditarMaquina = (maquina) => {
    console.log('✏️ Editando máquina:', maquina);
    setMaquinaEditando(maquina);
    setModoEdicion(true);
    setFormData({
      nombre_maquina: maquina.nombre_maquina || '',
      patente: maquina.patente || '',
      id_categoria: maquina.id_categoria || ''
    });
    setMostrarFormulario(true);
  };

  // 💾 Actualizar máquina existente
  const handleActualizarMaquina = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Actualizando máquina:', maquinaEditando.id_maquina, formData);

      const endpoint = `/api/adminOperador/maquinas/${maquinaEditando.id_maquina}`;
      const payload = {
        nombre_maquina: formData.nombre_maquina,
        tipo_maquina: 'Interno', // ✅ SIEMPRE INTERNO
        patente: formData.patente,
        id_categoria: parseInt(formData.id_categoria)
        // ✅ NO enviamos CHC, estado ni faena en la actualización
      };

      console.log('📤 Payload actualización enviado:', payload);

      const response = await axios.put(endpoint, payload);

      if (response.data.status === 'success') {
        setMessage({
          type: 'success',
          text: response.data.message || 'Máquina actualizada exitosamente'
        });

        resetFormData();
        setMostrarFormulario(false);
        setModoEdicion(false);
        setMaquinaEditando(null);
        await fetchDatos();
      } else {
        throw new Error(response.data.message || 'Error desconocido');
      }

    } catch (error) {
      console.error('❌ Error al actualizar máquina:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Error al actualizar máquina'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Ejecutar eliminación
  const handleEliminarMaquina = async () => {
    if (!maquinaAEliminar) return;

    try {
      setLoading(true);
      console.log('🗑️ Eliminando máquina:', maquinaAEliminar.id_maquina);

      const response = await axios.delete(`/api/adminOperador/maquinas/${maquinaAEliminar.id_maquina}`);

      if (response.data.status === 'success') {
        setMessage({
          type: 'success',
          text: response.data.message || 'Máquina eliminada correctamente'
        });

        // Recargar datos
        await fetchDatos();

        // Cerrar modal
        setMostrarConfirmacionEliminar(false);
        setMaquinaAEliminar(null);
      } else {
        throw new Error(response.data.message || 'Error al eliminar máquina');
      }
    } catch (error) {
      console.error('❌ Error al eliminar máquina:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Error al eliminar máquina'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelarEliminar = () => {
    setMostrarConfirmacionEliminar(false);
    setMaquinaAEliminar(null);
  };

  // 🔄 Funciones de utilidad
  const resetFormData = () => {
    setFormData({
      nombre_maquina: '',
      patente: '',
      id_categoria: ''
    });
  };

  const cancelarEdicion = () => {
    resetFormData();
    setMostrarFormulario(false);
    setModoEdicion(false);
    setMaquinaEditando(null);
  };

  const validarFormulario = () => {
    if (!formData.nombre_maquina.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la máquina es requerido' });
      return false;
    }
    if (!formData.patente.trim()) {
      setMessage({ type: 'error', text: 'La patente es requerida' });
      return false;
    }
    if (!formData.id_categoria) {
      setMessage({ type: 'error', text: 'Debe seleccionar una categoría' });
      return false;
    }
    return true;
  };

  // 🎣 useEffect
  useEffect(() => {
    fetchDatos();
  }, []);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <AdminLayoutBase>
      {/* Mensajes */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <FaCheck className="h-5 w-5 text-green-400" />
              ) : (
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas */}
      <MetricsSection>
        <MetricCard
          title="Total Máquinas"
          value={estadisticas.total_maquinas}
          icon={FaTruck}
          color="blue"
        />
        <MetricCard
          title="Máquinas Internas"
          value={estadisticas.maquinas_internas}
          icon={FaBuilding}
          color="green"
        />
        <MetricCard
          title="Máquinas Externas"
          value={estadisticas.maquinas_externas}
          icon={FaIndustry}
          color="purple"
        />
        <MetricCard
          title="Operativas"
          value={estadisticas.maquinas_operativas}
          icon={FaWrench}
          color="yellow"
        />
      </MetricsSection>

      {/* Contenido principal */}
      <AdditionalSection>
        <div className="space-y-6">
          {/* Botones de acción */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Máquinas</h2>
            <button
              onClick={() => {
                setModoEdicion(false);
                setMaquinaEditando(null);
                resetFormData();
                setMostrarFormulario(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus /> Registrar Máquina
            </button>
          </div>

          {/* Formulario de registro/edición */}
          {mostrarFormulario && (
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {modoEdicion ? 'Editar Máquina' : 'Registrar Nueva Máquina'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {modoEdicion
                      ? `Modificando: ${maquinaEditando?.nombre_maquina || 'Máquina'}`
                      : 'Todas las máquinas se registran como internas por defecto'
                    }
                  </p>
                </div>
                <button
                  onClick={cancelarEdicion}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={modoEdicion ? handleActualizarMaquina : handleRegistrarMaquina} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de la máquina */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Máquina *
                  </label>
                  <input
                    type="text"
                    name="nombre_maquina"
                    value={formData.nombre_maquina}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Camioneta Toyota Hilux"
                    required
                  />
                </div>

                {/* Patente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patente *
                  </label>
                  <input
                    type="text"
                    name="patente"
                    value={formData.patente}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: AA-BB-12"
                    required
                  />
                </div>

                {/* Categoría */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id_categoria} value={categoria.id_categoria}>
                        {categoria.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Información automática */}
                <div className="md:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                    <FaCheck className="mr-2" />
                    Valores asignados automáticamente:
                  </h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div className="flex items-center">
                      <FaBuilding className="mr-2" />
                      <strong>Tipo:</strong> Máquina Interna
                    </div>
                    <div className="flex items-center">
                      <FaWrench className="mr-2" />
                      <strong>Estado:</strong> Operativo
                    </div>
                    <div className="flex items-center">
                      <FaGasPump className="mr-2" />
                      <strong>CHC Individual:</strong> No asignado (se usa CHC de categoría)
                    </div>
                    <div className="flex items-center">
                      <FaIndustry className="mr-2" />
                      <strong>Faena:</strong> Asignada automáticamente (ID: 6)
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="md:col-span-2 flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors ${modoEdicion
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : (modoEdicion ? <FaEdit /> : <FaSave />)}
                    {loading ?
                      (modoEdicion ? 'Actualizando...' : 'Registrando...') :
                      (modoEdicion ? 'Actualizar Máquina' : 'Registrar Máquina')
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de máquinas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Máquinas Registradas</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Máquina
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo/Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maquinasRegistradas.map((maquina) => (
                    <tr key={maquina.id_maquina} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {maquina.nombre_maquina}
                          </div>
                          <div className="text-sm text-gray-500">
                            {maquina.patente}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800`}>
                            Interna
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            {maquina.estado || 'Operativo'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {maquina.categoria || maquina.nombre_categoria || 'Sin categoría'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleEditarMaquina(maquina)}
                            className="inline-flex items-center px-3 py-1 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                            title="Editar datos de la máquina"
                          >
                            <FaEdit className="w-3 h-3 mr-1" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {maquinasRegistradas.length === 0 && (
                <div className="text-center py-8">
                  <FaTruck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay máquinas registradas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Registra la primera máquina para comenzar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdditionalSection>
      {/* 🆕 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ModalConfirmacionEliminar
        isOpen={mostrarConfirmacionEliminar}
        maquina={maquinaAEliminar}
        loading={loading}
        onConfirmar={handleEliminarMaquina}
        onCancelar={cancelarEliminar}
      />
    </AdminLayoutBase>
  );
};

export default GestionarMaquinasOperador;