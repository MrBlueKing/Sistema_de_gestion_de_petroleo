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
  FaSearch,
  FaChartLine,
  FaTimes,
  FaBan,
  FaPencilAlt,
  FaSync,
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

  // Estado para modal de movimientos
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [estanqueDetalle, setEstanqueDetalle] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [fechaMovimientos, setFechaMovimientos] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Estado para anulación
  const [showConfirmAnular, setShowConfirmAnular] = useState(false);
  const [consumoAAnular, setConsumoAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);

  // Estado para edición de movimientos
  const [showEditarMovimiento, setShowEditarMovimiento] = useState(false);
  const [movimientoAEditar, setMovimientoAEditar] = useState(null);
  const [editForm, setEditForm] = useState({ fecha: '', litros: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

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
      handleEliminar(id, nombre);
    }
  };

  // ─── Movimientos ────────────────────────────────────────────────────────────

  const abrirMovimientos = async (estanque) => {
    setEstanqueDetalle(estanque);
    setShowMovimientos(true);
    await cargarMovimientos(estanque.id_estanque, fechaMovimientos);
  };

  const cerrarMovimientos = () => {
    setShowMovimientos(false);
    setEstanqueDetalle(null);
    setMovimientos([]);
    setShowConfirmAnular(false);
    setConsumoAAnular(null);
    setMotivoAnulacion('');
  };

  const cargarMovimientos = async (idEstanque, fecha) => {
    setLoadingMovimientos(true);
    try {
      const res = await axios.get(`/api/admin/estanques/${idEstanque}/movimientos`, {
        params: { fecha }
      });
      if (res.data.success) {
        setMovimientos(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      alert('Error al cargar los movimientos');
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const handleCambioFecha = (nuevaFecha) => {
    setFechaMovimientos(nuevaFecha);
    if (estanqueDetalle) {
      cargarMovimientos(estanqueDetalle.id_estanque, nuevaFecha);
    }
  };

  // ─── Anulación ──────────────────────────────────────────────────────────────

  const pedirEliminar = (movimiento) => {
    setConsumoAAnular(movimiento);
    setShowConfirmAnular(true);
  };

  const handleEliminarConsumo = async () => {
    setAnulando(true);
    try {
      const res = await axios.delete(`/api/consumos/${consumoAAnular.id_consumo}`);

      if (res.data.success) {
        alert(res.data.message);
        setShowConfirmAnular(false);
        setConsumoAAnular(null);
        await Promise.all([
          cargarMovimientos(estanqueDetalle.id_estanque, fechaMovimientos),
          cargarDatos()
        ]);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar el consumo');
    } finally {
      setAnulando(false);
    }
  };

  // ─── Edición de movimientos ──────────────────────────────────────────────────

  const abrirEditar = (mov) => {
    // Convertir fecha a formato datetime-local (YYYY-MM-DDTHH:MM)
    const fechaLocal = mov.fecha
      ? new Date(mov.fecha).toISOString().slice(0, 16)
      : '';
    setMovimientoAEditar(mov);
    setEditForm({ fecha: fechaLocal, litros: String(mov.litros) });
    setShowEditarMovimiento(true);
  };

  const cerrarEditar = () => {
    setShowEditarMovimiento(false);
    setMovimientoAEditar(null);
    setEditForm({ fecha: '', litros: '' });
  };


  const handleGuardarEdicion = async () => {
    if (!movimientoAEditar) return;
    setGuardandoEdicion(true);

    try {
      const mov = movimientoAEditar;
      const fechaOriginal = mov.fecha
        ? new Date(mov.fecha).toISOString().slice(0, 16)
        : '';
      const fechaCambio = editForm.fecha !== fechaOriginal ? editForm.fecha : null;
      const litrosCambio = parseFloat(editForm.litros) !== parseFloat(mov.litros) ? editForm.litros : null;

      if (!fechaCambio && !litrosCambio) {
        cerrarEditar();
        return;
      }

      let res;

      if (mov.tipo_registro === 'consumo_simple') {
        const body = {};
        if (fechaCambio) body.fecha_consumo = fechaCambio;
        if (litrosCambio) body.litros_consumidos = litrosCambio;
        res = await axios.put(`/api/consumos/${mov.id_consumo}`, body);

      } else if (mov.tipo_registro === 'consumo_multiple') {
        const body = {};
        if (fechaCambio) body.fecha_consumo = fechaCambio;
        if (litrosCambio) {
          body.litros_consumidos = litrosCambio;
          body.id_consumo_estanque = mov.id_consumo_estanque;
        }
        res = await axios.put(`/api/consumos/${mov.id_consumo}`, body);

      } else if (mov.tipo_registro === 'trasvasije_movil_fijo') {
        const body = {};
        if (fechaCambio) body.fecha_trasvasije = fechaCambio;
        if (litrosCambio) body.litros_trasvasijados = litrosCambio;
        res = await axios.put(`/api/trasvasijes/movil-a-fijo/${mov.id_trasvasije}`, body);

      } else if (mov.tipo_registro === 'trasvasije_fijo_movil') {
        const body = {};
        if (fechaCambio) body.fecha_trasvasije = fechaCambio;
        if (litrosCambio) {
          body.litros_desde_estanque = litrosCambio;
          body.id_estanque_fijo = estanqueDetalle.id_estanque;
        }
        res = await axios.put(`/api/trasvasijes/fijo-a-movil/${mov.id_trasvasije}`, body);
      }

      if (res?.data?.success) {
        cerrarEditar();
        await Promise.all([
          cargarMovimientos(estanqueDetalle.id_estanque, fechaMovimientos),
          cargarDatos()
        ]);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ─── Utilidades ─────────────────────────────────────────────────────────────

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
      case 'fijo': return <FaGasPump className="text-blue-500" />;
      case 'movil': return <FaTruck className="text-green-500" />;
      case 'fijo_automatico': return <FaTint className="text-purple-500" />;
      default: return <FaGasPump />;
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'fijo': return 'Fijo';
      case 'movil': return 'Móvil';
      case 'fijo_automatico': return 'Fijo Automático';
      default: return tipo;
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Filtrado de estanques
  const estanquesFiltrados = estanques.filter(est => {
    const cumpleFaena = !filtroFaena || est.id_faena === parseInt(filtroFaena);
    const cumpleTipo = !filtroTipo || est.tipo_estanque === filtroTipo;
    const cumpleBusqueda = !busqueda ||
      est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (est.nombre_faena && est.nombre_faena.toLowerCase().includes(busqueda.toLowerCase()));

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
            <div className="flex gap-3">
              <button
                onClick={abrirModalNuevo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaPlus /> Nuevo Estanque
              </button>
            </div>
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
                    {faena.ubicacion}
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
                        <div className="flex gap-3">
                          <button
                            onClick={() => abrirMovimientos(estanque)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Ver movimientos"
                          >
                            <FaChartLine size={18} />
                          </button>
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

      {/* ─── Modal Movimientos ──────────────────────────────────────────────── */}
      {showMovimientos && estanqueDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">

            {/* Header del modal */}
            <div className="flex justify-between items-start p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {estanqueDetalle.nombre}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Stock actual: <strong>{Number(estanqueDetalle.stock_actual).toLocaleString('es-CL')} L</strong>
                  {' · '}
                  {estanqueDetalle.nombre_faena}
                </p>
              </div>
              <button
                onClick={cerrarMovimientos}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                <FaTimes />
              </button>
            </div>

            {/* Filtro de fecha */}
            <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Fecha:</label>
              <input
                type="date"
                value={fechaMovimientos}
                onChange={(e) => handleCambioFecha(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              {loadingMovimientos && (
                <span className="text-sm text-gray-400">Cargando...</span>
              )}
            </div>

            {/* Tabla de movimientos */}
            <div className="overflow-y-auto flex-1 p-6">
              {loadingMovimientos ? (
                <div className="flex justify-center py-12">
                  <div className="text-gray-400">Cargando movimientos...</div>
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No hay movimientos registrados para esta fecha
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Movimiento</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Litros</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contraparte</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observación</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {movimientos.map((mov, i) => (
                      <tr
                        key={i}
                        className={`${mov.anulado ? 'opacity-50 bg-red-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {formatFecha(mov.fecha)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                          {mov.tipo}
                          {mov.anulado ? (
                            <span className="ml-2 text-xs text-red-500 font-semibold">ANULADO</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            mov.movimiento === 'ENTRADA'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {mov.movimiento}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                          {Number(mov.litros).toLocaleString('es-CL')} L
                        </td>
                        <td className="px-4 py-3 text-gray-700">{mov.contraparte || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                          {mov.observacion || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {mov.tipo_registro && mov.tipo_registro !== 'ingreso' && !mov.anulado && (
                              <button
                                onClick={() => abrirEditar(mov)}
                                className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-medium"
                                title="Editar registro"
                              >
                                <FaPencilAlt size={12} /> Editar
                              </button>
                            )}
                            {mov.id_consumo && !mov.anulado ? (
                              <button
                                onClick={() => pedirEliminar(mov)}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium"
                                title="Eliminar consumo"
                              >
                                <FaBan size={13} /> Eliminar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totales */}
            {!loadingMovimientos && movimientos.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t flex gap-8 text-sm">
                <div>
                  <span className="text-gray-500">Total entradas: </span>
                  <strong className="text-green-600">
                    {movimientos
                      .filter(m => m.movimiento === 'ENTRADA' && !m.anulado)
                      .reduce((s, m) => s + Number(m.litros), 0)
                      .toLocaleString('es-CL')} L
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500">Total salidas: </span>
                  <strong className="text-orange-600">
                    {movimientos
                      .filter(m => m.movimiento === 'SALIDA' && !m.anulado)
                      .reduce((s, m) => s + Number(m.litros), 0)
                      .toLocaleString('es-CL')} L
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Modal Editar Movimiento ────────────────────────────────────────── */}
      {showEditarMovimiento && movimientoAEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaPencilAlt className="text-blue-500 text-xl" />
                <h3 className="text-lg font-bold text-gray-800">Editar registro</h3>
              </div>
              <button onClick={cerrarEditar} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <div><strong>Tipo:</strong> {movimientoAEditar.tipo}</div>
              <div><strong>Contraparte:</strong> {movimientoAEditar.contraparte || '-'}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  value={editForm.fecha}
                  onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {movimientoAEditar.tipo_registro !== 'ingreso' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Litros
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editForm.litros}
                    onChange={(e) => setEditForm({ ...editForm, litros: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Valor actual: {Number(movimientoAEditar.litros).toLocaleString('es-CL')} L
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardarEdicion}
                disabled={guardandoEdicion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={cerrarEditar}
                disabled={guardandoEdicion}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Confirmar Anulación ──────────────────────────────────────── */}
      {showConfirmAnular && consumoAAnular && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <FaBan className="text-red-500 text-2xl" />
              <h3 className="text-lg font-bold text-gray-800">Eliminar consumo</h3>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Vas a eliminar el consumo de{' '}
              <strong>{Number(consumoAAnular.litros).toLocaleString('es-CL')} L</strong>
              {' '}hacia <strong>{consumoAAnular.contraparte}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Los litros volverán al estanque <strong>{estanqueDetalle?.nombre}</strong>. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleEliminarConsumo}
                disabled={anulando}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {anulando ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmAnular(false);
                  setConsumoAAnular(null);
                }}
                disabled={anulando}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Crear/Editar ─────────────────────────────────────────────── */}
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
                        {faena.ubicacion}
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
