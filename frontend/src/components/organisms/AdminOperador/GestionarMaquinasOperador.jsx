import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSave,
  FaTimes,
  FaTruck,
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
  FaList,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import axios from "../../../lib/axios";
import ModalConfirmacionEliminar from "../../molecules/ModalConfirmacionEliminar"; // Ajusta la ruta según tu estructura

// Importar el layout base y sus componentes
import AdminLayoutBase, {
  MetricsSection,
  MetricCard,
  AdditionalSection,
} from "./AdminLayoutBase";

// Importar componente de paginación
import PageControl from "../../molecules/PageControl";

// Configuración de paginación
const ITEMS_PER_PAGE = 10;

const GestionarMaquinasOperador = () => {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [maquinaEditando, setMaquinaEditando] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [maquinaDetalle, setMaquinaDetalle] = useState(null);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] =
    useState(false);
  const [maquinaAEliminar, setMaquinaAEliminar] = useState(null);

  // 🆕 Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // 🆕 Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para el formulario (SIMPLIFICADO - Solo máquinas internas)
  const [formData, setFormData] = useState({
    nombre_maquina: "",
    patente: "",
    id_categoria: "",
  });

  // Estados para datos de la API
  const [categorias, setCategorias] = useState([]);
  const [maquinasRegistradas, setMaquinasRegistradas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_maquinas: 0,
    maquinas_internas: 0,
    maquinas_externas: 0,
    maquinas_operativas: 0,
  });

  // 🆕 Agregar esto TEMPORALMENTE en la función de filtrado:
  const maquinasFiltradas = maquinasRegistradas.filter((maquina) => {
    const matchSearch =
      !searchTerm ||
      maquina.nombre_maquina
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      maquina.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maquina.categoria?.nombre_categoria
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchCategoria =
      filtroCategoria === "todas" || maquina.categoria === filtroCategoria;

    const matchTipo =
      filtroTipo === "todos" ||
      maquina.tipo_maquina?.toLowerCase() === filtroTipo.toLowerCase();

    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "operativo" && maquina.estado === "operativo") ||
      (filtroEstado === "no_operativo" && maquina.estado !== "operativo");

    return matchSearch && matchCategoria && matchTipo && matchEstado;
  });

  // 🆕 Paginación de máquinas
  const totalMaquinas = maquinasFiltradas.length;
  const totalPaginasCalculadas = Math.ceil(totalMaquinas / ITEMS_PER_PAGE);
  const maquinasPaginadas = maquinasFiltradas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 🔍 Agregar TEMPORALMENTE en fetchDatos, después de setMaquinasRegistradas:
  useEffect(() => {
    if (maquinasRegistradas.length > 0) {
      console.log("🔍 DEBUG - Estructura COMPLETA de la primera máquina:");
      console.log(JSON.stringify(maquinasRegistradas[0], null, 2));

      console.log("🔍 DEBUG - Todas las propiedades de la máquina:");
      console.log(Object.keys(maquinasRegistradas[0]));
    }
  }, [maquinasRegistradas]);

  // 🆕 Actualizar total de páginas cuando cambien los filtros
  useEffect(() => {
    setTotalPages(totalPaginasCalculadas);
    if (currentPage > totalPaginasCalculadas && totalPaginasCalculadas > 0) {
      setCurrentPage(1);
    }
  }, [totalPaginasCalculadas, currentPage]);

  // 🆕 Función para cambiar de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDatos();
  }, []);

  // 🔄 Cargar datos iniciales
  const fetchDatos = async () => {
    try {
      setLoading(true);
      console.log("🔄 Cargando datos iniciales...");

      const datosResponse = await axios.get(
        "/api/adminOperador/maquinas/datos"
      );
      if (datosResponse.data.status === "success") {
        const { data } = datosResponse.data;
        console.log("📋 Estructura de datos recibidos:", data);

        setCategorias(data.categorias || []);
        setMaquinasRegistradas(data.maquinas || []);

        // Calcular estadísticas
        const maquinas = data.maquinas || [];
        setEstadisticas({
          total_maquinas: maquinas.length,
          maquinas_internas: maquinas.filter(
            (m) => m.tipo_maquina === "Interno"
          ).length,
          maquinas_externas: maquinas.filter(
            (m) => m.tipo_maquina === "Externo"
          ).length,
          maquinas_operativas: maquinas.filter((m) => m.estado === "operativo")
            .length,
        });
      }
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      setMessage({
        type: "error",
        text: "Error al cargar datos iniciales",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validar formulario
  const validarFormulario = () => {
    const errores = [];

    if (!formData.nombre_maquina.trim()) {
      errores.push("El nombre de la máquina es obligatorio");
    }

    if (!formData.patente.trim()) {
      errores.push("La patente es obligatoria");
    }

    if (!formData.id_categoria) {
      errores.push("Debe seleccionar una categoría");
    }

    if (errores.length > 0) {
      setMessage({
        type: "error",
        text: errores.join(", "),
      });
      return false;
    }

    return true;
  };

  // Limpiar datos del formulario
  const resetFormData = () => {
    setFormData({
      nombre_maquina: "",
      patente: "",
      id_categoria: "",
    });
  };

  // 🆕 Registrar nueva máquina
  const handleRegistrarMaquina = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      console.log("🆕 Registrando máquina:", formData);

      const endpoint = "/api/adminOperador/maquinas";
      const payload = {
        nombre_maquina: formData.nombre_maquina,
        tipo_maquina: "Interno", // ✅ SIEMPRE INTERNO
        patente: formData.patente,
        id_categoria: parseInt(formData.id_categoria),
        // ✅ VALORES AUTOMÁTICOS (no vienen del formulario)
        estado: "operativo",
        chc_maquina: null,
        id_faena: 6, // Faena por defecto
      };

      console.log("📤 Payload enviado:", payload);

      const response = await axios.post(endpoint, payload);

      if (response.data.status === "success") {
        setMessage({
          type: "success",
          text: response.data.message || "Máquina registrada exitosamente",
        });

        resetFormData();
        setMostrarFormulario(false);
        await fetchDatos();
      } else {
        throw new Error(response.data.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error al registrar máquina:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Error al registrar máquina",
      });
    } finally {
      setLoading(false);
    }
  };

  // 👁️ Ver detalle de máquina
  const handleVerDetalle = async (maquina) => {
    try {
      setLoading(true);
      console.log("👁️ Cargando detalle de máquina:", maquina.id_maquina);

      // Obtener información completa de la máquina
      const response = await axios.get(
        `/api/adminOperador/maquinas/${maquina.id_maquina}`
      );

      if (response.data.status === "success") {
        setMaquinaDetalle({
          ...response.data.data,
          // Agregar datos calculados
          dias_desde_registro: Math.floor(
            (new Date() - new Date(maquina.created_at)) / (1000 * 60 * 60 * 24)
          ),
          tiene_asignaciones: false, // Podrías consultar si tiene asignaciones activas
          ultimo_consumo: null, // Podrías consultar último registro de consumo
          total_consumos: 0, // Podrías consultar total de consumos
        });
        setMostrarDetalle(true);
      }
    } catch (error) {
      console.error("❌ Error al cargar detalle:", error);
      setMessage({
        type: "error",
        text: "Error al cargar los detalles de la máquina",
      });
    } finally {
      setLoading(false);
    }
  };

const handleEditarMaquina = (maquina) => {
  console.log('✏️ Editando máquina:', maquina);
  setMaquinaEditando(maquina);
  setModoEdicion(true);
  
  // 🔧 Buscar la categoría por nombre para obtener su ID
  const categoriaActual = categorias.find(cat => 
    cat.nombre_categoria === maquina.categoria
  );
  
  console.log('🔍 Categoría encontrada:', categoriaActual);
  
  setFormData({
    nombre_maquina: maquina.nombre_maquina || '',
    patente: maquina.patente || '',
    id_categoria: categoriaActual?.id_categoria?.toString() || ''
  });
  setMostrarFormulario(true);
};

  const handleActualizarMaquina = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      console.log(
        "💾 Actualizando máquina:",
        maquinaEditando.id_maquina,
        formData
      );

      const payload = {
        nombre_maquina: formData.nombre_maquina,
        patente: formData.patente,
        id_categoria: parseInt(formData.id_categoria),
      };

      const response = await axios.put(
        `/api/adminOperador/maquinas/${maquinaEditando.id_maquina}`,
        payload
      );

      if (response.data.status === "success") {
        setMessage({
          type: "success",
          text: response.data.message || "Máquina actualizada exitosamente",
        });

        resetFormData();
        setMostrarFormulario(false);
        setModoEdicion(false);
        setMaquinaEditando(null);
        await fetchDatos();
      } else {
        throw new Error(response.data.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error al actualizar máquina:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Error al actualizar máquina",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarMaquina = async () => {
    if (!maquinaAEliminar) return;

    try {
      setLoading(true);
      console.log("🗑️ Eliminando máquina:", maquinaAEliminar.id_maquina);

      const response = await axios.delete(
        `/api/adminOperador/maquinas/${maquinaAEliminar.id_maquina}`
      );

      if (response.data.status === "success") {
        setMessage({
          type: "success",
          text: response.data.message || "Máquina eliminada exitosamente",
        });

        // Cerrar modal y limpiar estado
        setMostrarConfirmacionEliminar(false);
        setMaquinaAEliminar(null);

        // Recargar datos
        await fetchDatos();
      } else {
        throw new Error(response.data.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error al eliminar máquina:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Error al eliminar máquina",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (maquina) => {
    setMaquinaAEliminar(maquina);
    setMostrarConfirmacionEliminar(true);
  };

  const cancelarEliminar = () => {
    setMostrarConfirmacionEliminar(false);
    setMaquinaAEliminar(null);
  };

  const cancelarFormulario = () => {
    resetFormData();
    setMostrarFormulario(false);
    setModoEdicion(false);
    setMaquinaEditando(null);
  };

  const getBadgeEstado = (estado) => {
    return estado === "operativo" ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <FaCheck className="w-3 h-3 mr-1" />
        Operativa
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <FaExclamationTriangle className="w-3 h-3 mr-1" />
        No Operativa
      </span>
    );
  };

  const getBadgeTipo = (tipo) => {
    return tipo === "Interno" ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FaBuilding className="w-3 h-3 mr-1" />
        Interna
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <FaIndustry className="w-3 h-3 mr-1" />
        Externa
      </span>
    );
  };

  return (
    <AdminLayoutBase
      title="Gestionar Máquinas"
      subtitle="Administración de máquinas y equipos"
      loading={loading}
      message={message}
      onClearMessage={() => setMessage(null)}
    >
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
          icon={FaTruck}
          color="green"
        />
        <MetricCard
          title="Máquinas Externas"
          value={estadisticas.maquinas_externas}
          icon={FaTruck}
          color="purple"
        />
        <MetricCard
          title="Operativas"
          value={estadisticas.maquinas_operativas}
          icon={FaTruck}
          color="orange"
        />
      </MetricsSection>

      {/* 🆕 Sección de filtros y búsqueda */}
      {!mostrarFormulario && !mostrarDetalle && (
        <AdditionalSection
          title="🔍 Filtros y Búsqueda"
          icon={<FaList className="w-5 h-5" />}
          collapsible={true}
          defaultCollapsed={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Búsqueda general */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Máquinas
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre, patente, categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.nombre_categoria}
                  >
                    {categoria.nombre_categoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="todos">Todos los tipos</option>
                <option value="interno">Solo Internas</option>
                <option value="externo">Solo Externas</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                <option value="operativo">Solo operativas</option>
                <option value="no_operativo">No operativas</option>
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros y contador de resultados */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando <strong>{maquinasFiltradas.length}</strong> de{" "}
              <strong>{maquinasRegistradas.length}</strong> máquinas
              {(searchTerm ||
                filtroCategoria !== "todas" ||
                filtroTipo !== "todos" ||
                filtroEstado !== "todos") && (
                <span className="text-orange-600 ml-2">(filtrado)</span>
              )}
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFiltroCategoria("todas");
                setFiltroTipo("todos");
                setFiltroEstado("todos");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FaTimes />
              Limpiar Filtros
            </button>
          </div>
        </AdditionalSection>
      )}

      {/* Botón para mostrar formulario */}
      {!mostrarFormulario && !mostrarDetalle && (
        <AdditionalSection
          title="Acciones"
          icon={<FaPlus className="w-5 h-5" />}
        >
          <button
            onClick={() => setMostrarFormulario(true)}
            className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            <FaPlus />
            Nueva Máquina
          </button>
        </AdditionalSection>
      )}

      {/* 📝 Formulario de máquina */}
      {mostrarFormulario && (
        <AdditionalSection
          title={modoEdicion ? "✏️ Editar Máquina" : "🆕 Nueva Máquina"}
          icon={
            modoEdicion ? (
              <FaEdit className="w-5 h-5" />
            ) : (
              <FaPlus className="w-5 h-5" />
            )
          }
        >
          <form
            onSubmit={
              modoEdicion ? handleActualizarMaquina : handleRegistrarMaquina
            }
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la máquina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Máquina <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_maquina"
                  value={formData.nombre_maquina}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Excavadora CAT 320"
                  required
                />
              </div>

              {/* Patente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: ABC-123 o ABCD12"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_categoria"
                  value={formData.id_categoria}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id_categoria}
                      value={categoria.id_categoria}
                    >
                      {categoria.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones del formulario */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelarFormulario}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                <FaTimes />
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  modoEdicion
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : modoEdicion ? (
                  <FaEdit />
                ) : (
                  <FaSave />
                )}
                {loading
                  ? modoEdicion
                    ? "Actualizando..."
                    : "Registrando..."
                  : modoEdicion
                  ? "Actualizar Máquina"
                  : "Registrar Máquina"}
              </button>
            </div>
          </form>
        </AdditionalSection>
      )}

      {/* Lista de máquinas */}
      {!mostrarFormulario && !mostrarDetalle && (
        <AdditionalSection
          title="Máquinas Registradas"
          icon={<FaTruck className="w-5 h-5" />}
        >
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Máquinas Registradas
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({maquinasFiltradas.length} de {maquinasRegistradas.length})
                </span>
              </h3>
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
                  {maquinasPaginadas.length > 0 ? (
                    maquinasPaginadas.map((maquina, index) => (
                      <tr
                        key={maquina.id_maquina || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <FaTruck className="h-5 w-5 text-orange-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {maquina.nombre_maquina}
                              </div>
                              <div className="text-sm text-gray-500">
                                Patente: {maquina.patente}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {getBadgeTipo(maquina.tipo_maquina)}
                            {getBadgeEstado(maquina.estado)}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maquina.categoria || "Sin categoría"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditarMaquina(maquina)}
                              className="text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 p-2 rounded-lg transition-colors"
                              title="Editar máquina"
                              disabled={loading}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <FaTruck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          No hay máquinas
                        </h3>
                        <p className="text-sm text-gray-500">
                          {searchTerm ||
                          filtroCategoria !== "todas" ||
                          filtroTipo !== "todos" ||
                          filtroEstado !== "todos"
                            ? "No se encontraron máquinas que coincidan con los filtros aplicados"
                            : "Comience registrando una máquina"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 🆕 Controles de paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <PageControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    colorScheme="orange"
                  />
                </div>
              )}
            </div>
          </div>
        </AdditionalSection>
      )}

      {/* Modal de detalle de máquina */}
      {mostrarDetalle && maquinaDetalle && (
        <AdditionalSection
          title="📋 Detalle de Máquina"
          icon={<FaEye className="w-5 h-5" />}
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {maquinaDetalle.nombre_maquina}
              </h2>
              <button
                onClick={() => setMostrarDetalle(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Información básica */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaTruck className="mr-2 text-orange-600" />
                  Información Básica
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Nombre:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.nombre_maquina}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Patente:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.patente}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Tipo:
                    </span>
                    <div className="mt-1">
                      {getBadgeTipo(maquinaDetalle.tipo_maquina)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Estado:
                    </span>
                    <div className="mt-1">
                      {getBadgeEstado(maquinaDetalle.estado)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Categoría y clasificación */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaWrench className="mr-2 text-blue-600" />
                  Clasificación
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Categoría:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.categoria || "Sin categoría"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      ID Máquina:
                    </span>
                    <p className="text-sm text-gray-900">
                      #{maquinaDetalle.id_maquina}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      CHC:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.chc_maquina || "No asignado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de registro */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaGasPump className="mr-2 text-green-600" />
                  Información de Registro
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Registrada hace:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.dias_desde_registro || 0} días
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Faena:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.faena?.ubicacion || "Faena principal"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Total consumos:
                    </span>
                    <p className="text-sm text-gray-900">
                      {maquinaDetalle.total_consumos || 0} registros
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción en el detalle */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setMostrarDetalle(false);
                  handleEditarMaquina(maquinaDetalle);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
              >
                <FaEdit />
                Editar
              </button>
              <button
                onClick={() => setMostrarDetalle(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FaTimes />
                Cerrar
              </button>
            </div>
          </div>
        </AdditionalSection>
      )}

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
