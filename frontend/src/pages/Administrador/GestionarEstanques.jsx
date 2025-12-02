import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaTint,
  FaGasPump,
  FaTruck,
  FaSearch
} from "react-icons/fa";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import axios from "../../lib/axios";

const GestionarEstanques = () => {
  const [estanques, setEstanques] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filtroFaena, setFiltroFaena] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    tipo_estanque: 'fijo',
    capacidad: '',
    altura_nominal: '',
    id_faena: '',
    activo: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [estanquesRes, faenasRes] = await Promise.all([
        axios.get('/api/admin/estanques'),
        axios.get('/api/faenas')
      ]);

      if (estanquesRes.data.success) {
        setEstanques(estanquesRes.data.data);
      }

      if (faenasRes.data.success) {
        setFaenas(faenasRes.data.data);
      } else {
        setFaenas(faenasRes.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editando) {
        const response = await axios.put(
          `/api/admin/estanques/${formData.id_estanque}`,
          formData
        );

        if (response.data.success) {
          alert('Estanque actualizado exitosamente');
          cargarDatos();
          cerrarModal();
        }
      } else {
        const response = await axios.post('/api/admin/estanques', formData);

        if (response.data.success) {
          alert('Estanque creado exitosamente');
          cargarDatos();
          cerrarModal();
        }
      }
    } catch (error) {
      console.error('Error al guardar estanque:', error);
      alert(error.response?.data?.message || 'Error al guardar el estanque');
    }
  };

  const handleEditar = (estanque) => {
    setFormData({
      id_estanque: estanque.id_estanque,
      nombre: estanque.nombre,
      tipo_estanque: estanque.tipo_estanque,
      capacidad: estanque.capacidad,
      altura_nominal: estanque.altura_nominal,
      id_faena: estanque.id_faena,
      activo: estanque.activo
    });
    setEditando(true);
    setShowModal(true);
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de desactivar el estanque "${nombre}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/estanques/${id}`);
      if (response.data.success) {
        alert('Estanque desactivado exitosamente');
        cargarDatos();
      }
    } catch (error) {
      console.error('Error al desactivar estanque:', error);
      alert(error.response?.data?.message || 'Error al desactivar el estanque');
    }
  };

  const handleToggleActivo = async (id, nombre, activoActual) => {
    if (!activoActual) {
      // Activar estanque
      try {
        const response = await axios.patch(`/api/admin/estanques/${id}/activate`);
        if (response.data.success) {
          alert('Estanque activado exitosamente');
          cargarDatos();
        }
      } catch (error) {
        console.error('Error al activar estanque:', error);
        alert('Error al activar el estanque');
      }
    } else {
      // Desactivar estanque
      handleEliminar(id, nombre);
    }
  };

  const abrirModalNuevo = () => {
    setFormData({
      nombre: '',
      tipo_estanque: 'fijo',
      capacidad: '',
      altura_nominal: '',
      id_faena: '',
      activo: true
    });
    setEditando(false);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(false);
    setFormData({
      nombre: '',
      tipo_estanque: 'fijo',
      capacidad: '',
      altura_nominal: '',
      id_faena: '',
      activo: true
    });
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'fijo':
        return <FaGasPump className="text-blue-500" />;
      case 'movil':
        return <FaTruck className="text-green-500" />;
      case 'fijo_automatico':
        return <FaTint className="text-purple-500" />;
      default:
        return <FaGasPump />;
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'fijo':
        return 'Fijo';
      case 'movil':
        return 'Móvil';
      case 'fijo_automatico':
        return 'Fijo Automático';
      default:
        return tipo;
    }
  };

  // Filtrado de estanques
  const estanquesFiltrados = estanques.filter(est => {
    const cumpleFaena = !filtroFaena || est.id_faena === parseInt(filtroFaena);
    const cumpleTipo = !filtroTipo || est.tipo_estanque === filtroTipo;
    const cumpleBusqueda = !busqueda ||
      est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      est.nombre_faena.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleFaena && cumpleTipo && cumpleBusqueda;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UniversalHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Gestión de Estanques
              </h1>
              <p className="text-gray-600 mt-1">
                Administra los estanques de todas las faenas
              </p>
            </div>
            <button
              onClick={abrirModalNuevo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Nuevo Estanque
            </button>
          </div>

          {/* Filtros */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por nombre
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar estanque..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Faena
              </label>
              <select
                value={filtroFaena}
                onChange={(e) => setFiltroFaena(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las faenas</option>
                {faenas.map(faena => (
                  <option key={faena.id_faena} value={faena.id_faena}>
                    {faena.nombre_faena}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="fijo">Fijo</option>
                <option value="movil">Móvil</option>
                <option value="fijo_automatico">Fijo Automático</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Estanques</div>
            <div className="text-2xl font-bold text-gray-800">{estanques.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Activos</div>
            <div className="text-2xl font-bold text-green-600">
              {estanques.filter(e => e.activo).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Inactivos</div>
            <div className="text-2xl font-bold text-red-600">
              {estanques.filter(e => !e.activo).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Resultados</div>
            <div className="text-2xl font-bold text-blue-600">
              {estanquesFiltrados.length}
            </div>
          </div>
        </div>

        {/* Tabla de Estanques */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estanque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estanquesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No se encontraron estanques
                    </td>
                  </tr>
                ) : (
                  estanquesFiltrados.map((estanque) => (
                    <tr key={estanque.id_estanque} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {estanque.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          Altura: {estanque.altura_nominal}m
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(estanque.tipo_estanque)}
                          <span className="text-sm">
                            {getTipoLabel(estanque.tipo_estanque)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estanque.nombre_faena}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estanque.capacidad.toLocaleString('es-CL')} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {estanque.stock_actual.toLocaleString('es-CL')} L
                        </div>
                        <div className="text-xs text-gray-500">
                          {estanque.porcentaje_llenado}% lleno
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            estanque.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {estanque.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditar(estanque)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActivo(
                                estanque.id_estanque,
                                estanque.nombre,
                                estanque.activo
                              )
                            }
                            className={
                              estanque.activo
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }
                            title={estanque.activo ? 'Desactivar' : 'Activar'}
                          >
                            {estanque.activo ? (
                              <FaToggleOff size={18} />
                            ) : (
                              <FaToggleOn size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editando ? 'Editar Estanque' : 'Nuevo Estanque'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Estanque *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Estanque Principal 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Estanque *
                  </label>
                  <select
                    value={formData.tipo_estanque}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_estanque: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fijo">Fijo</option>
                    <option value="movil">Móvil</option>
                    <option value="fijo_automatico">Fijo Automático</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidad (Litros) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.capacidad}
                      onChange={(e) =>
                        setFormData({ ...formData, capacidad: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Altura Nominal (m) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.altura_nominal}
                      onChange={(e) =>
                        setFormData({ ...formData, altura_nominal: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="3.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faena *
                  </label>
                  <select
                    value={formData.id_faena}
                    onChange={(e) =>
                      setFormData({ ...formData, id_faena: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione una faena</option>
                    {faenas.map((faena) => (
                      <option key={faena.id_faena} value={faena.id_faena}>
                        {faena.nombre_faena}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activo" className="text-sm text-gray-700">
                    Estanque activo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {editando ? 'Actualizar' : 'Crear'} Estanque
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarEstanques;
