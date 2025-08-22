import React, { useState, useEffect } from "react";
import {
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUsers,
  FaExclamationTriangle,
  FaEye,
  FaSearch,
  FaGasPump,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaListAlt, // 🆕 NUEVO ICONO para el botón
} from "react-icons/fa";
import {
  FiFileText,
  FiTrendingUp,
  FiXCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import axios from "../../../lib/axios"; // Asegúrate de que la ruta sea correcta
import DetalleCargaModal from "../../molecules/DetalleCargaModal"; // Ajusta la ruta según tu estructura
import { useNavigate } from "react-router-dom"; // 🆕 NUEVO: Para navegación

// 🎨 COLORES POR FAENA - Agregando estilo Copec para faena 6
const FAENA_COLORS = {
  1: {
    // Cabildo
    name: "Cabildo",
    bg: "bg-green-50/30",
    border: "border-l-green-400",
    badge: "bg-green-100 text-green-800",
    icon: "text-green-600",
    emoji: "🌿",
  },
  4: {
    // Tiltil
    name: "Tiltil",
    bg: "bg-red-50/30",
    border: "border-l-red-400",
    badge: "bg-red-100 text-red-800",
    icon: "text-red-600",
    emoji: "🏔️",
  },
  6: {
    // Cargas Externas - Estilo Copec
    name: "Cargas Externas",
    bg: "bg-blue-50/40",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800",
    icon: "text-blue-600",
    copecBlue: "text-[#0066cc]",
    copecBg: "bg-gradient-to-r from-blue-50 to-blue-100/50",
    copecBorder: "border-l-[#0066cc]",
    copecBadge: "bg-[#0066cc]/10 text-[#0066cc]",
  },
};

// 🛠️ Función para obtener colores de faena por ID
const getFaenaColorsById = (faenaId) => {
  const faenaInfo = FAENA_COLORS[faenaId];

  if (faenaInfo) {
    return faenaInfo;
  }

  // Color por defecto para faenas desconocidas
  return {
    name: "Faena Desconocida",
    bg: "bg-gray-50/25",
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-800",
    icon: "text-gray-600",
    emoji: "🏢",
  };
};

// 🏢 Componente del logo/icono estilo Copec (evitando copyright)
const CopecStyleIcon = ({ className = "w-6 h-6" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Círculo azul de fondo */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#skyGradient)"
        stroke="#0066cc"
        strokeWidth="2"
      />

      {/* Definir gradiente de cielo */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#0066cc" />
        </linearGradient>
      </defs>

      {/* Nubes blancas */}
      <g fill="white" opacity="0.9">
        {/* Nube izquierda */}
        <ellipse cx="30" cy="35" rx="12" ry="6" />
        <ellipse cx="25" cy="32" rx="8" ry="4" />
        <ellipse cx="35" cy="32" rx="8" ry="4" />

        {/* Nube centro */}
        <ellipse cx="55" cy="25" rx="10" ry="5" />
        <ellipse cx="50" cy="22" rx="6" ry="3" />
        <ellipse cx="60" cy="22" rx="6" ry="3" />

        {/* Nube derecha */}
        <ellipse cx="75" cy="40" rx="11" ry="5.5" />
        <ellipse cx="70" cy="37" rx="7" ry="3.5" />
        <ellipse cx="80" cy="37" rx="7" ry="3.5" />

        {/* Nube inferior */}
        <ellipse cx="40" cy="65" rx="9" ry="4" />
        <ellipse cx="35" cy="62" rx="5" ry="2.5" />
        <ellipse cx="45" cy="62" rx="5" ry="2.5" />
      </g>
    </svg>
  </div>
);

// 🎨 Componente de tarjeta móvil para cargas externas
const CargaExternaCard = ({
  carga,
  formatDate,
  formatCurrency,
  getEstadoBadge,
}) => {
  const colores = getFaenaColorsById(carga.id_faena);
  const esCargaExterna = carga.id_faena === 6;

  return (
    <div
      className={`
      ${esCargaExterna ? colores.copecBg : colores.bg} 
      ${esCargaExterna ? colores.copecBorder : colores.border} 
      border-l-4 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200
    `}
    >
      {/* Header con fecha y costo */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {esCargaExterna ? (
            <CopecStyleIcon className="w-5 h-5" />
          ) : (
            <FaCalendarAlt className={`${colores.icon} text-sm`} />
          )}
          <div>
            <div className="font-bold text-gray-800 text-sm">
              {carga.numero_boleta}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(carga.created_at)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Costo</div>
          <div
            className={`font-bold text-base ${
              esCargaExterna ? colores.copecBlue : colores.icon
            }`}
          >
            {formatCurrency(carga.costo)}
          </div>
        </div>
      </div>

      {/* Información en grid compacto */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaUser
              className={`${
                esCargaExterna ? colores.copecBlue : colores.icon
              } text-xs`}
            />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Operador
            </span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {carga.user?.nombre_completo || "N/A"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaTruck
              className={`${
                esCargaExterna ? colores.copecBlue : colores.icon
              } text-xs`}
            />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Vehículo
            </span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {carga.maquina?.nombre_maquina || "N/A"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs">{colores.emoji}</span>
            <span className="text-xs font-medium text-gray-600 uppercase">
              Tipo
            </span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {esCargaExterna ? "Carga Externa" : colores.name}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <FaGasPump
              className={`${
                esCargaExterna ? colores.copecBlue : colores.icon
              } text-xs`}
            />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Litros
            </span>
          </div>
          <div className="font-medium text-gray-800 text-xs">
            {carga.litros} L
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        {getEstadoBadge(carga.estado, esCargaExterna)}
      </div>
    </div>
  );
};

const MainAdminOperador = () => {
  const navigate = useNavigate(); // 🆕 NUEVO: Hook para navegación
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🆕 FUNCIÓN: Abrir modal de detalles
  const handleVerDetalle = (cargaId) => {
    setSelectedCargaId(cargaId);
    setIsModalOpen(true);
  };

  // 🆕 FUNCIÓN: Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargaId(null);
  };

  // 🆕 FUNCIÓN: Refrescar datos después de una acción
  const handleActionComplete = () => {
    // Refrescar la lista de cargas
    fetchCargasExternas();
  };

  // 🆕 NUEVA FUNCIÓN: Navegar a ConsumosView
  const handleIrAConsumosView = () => {
    navigate('/consumos-view-AdminOperador'); // Ajusta la ruta según tu configuración de rutas
  };

  // Extraer la función fetchCargasExternas para poder reutilizarla
  const fetchCargasExternas = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ ADAPTADO: Usar tus rutas actuales
      const response = await axios.get("/api/adminOperador/cargas");

      console.log("📊 Datos recibidos de la API:", response.data);

      if (response.data.status === "success") {
        // ✅ Los datos ya vienen formateados desde el backend
        setCargas(response.data.data);

        // También podemos usar las estadísticas que vienen desde el backend
        if (response.data.estadisticas) {
          console.log(
            "📈 Estadísticas desde backend:",
            response.data.estadisticas
          );
        }
      } else {
        throw new Error(response.data.message || "Error al cargar datos");
      }
    } catch (error) {
      console.error("❌ Error al cargar cargas externas:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar datos"
      );

      // Fallback a datos de ejemplo si hay error
      setCargas([
        {
          id: 1,
          numero_boleta: "BOL-001",
          user: { nombre: "Juan", apellido: "Pérez" },
          maquina: { nombre_maquina: "Excavadora CAT", patente: "AA-BB-12" },
          litros: 150.5,
          costo: 225750,
          estado: "pendiente",
          created_at: "2025-01-15T10:30:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 NUEVO: Cargar datos reales desde la API
  useEffect(() => {
    fetchCargasExternas();
  }, []);

  // Estadísticas calculadas
  const stats = {
    total: cargas.length,
    pendientes: cargas.filter((c) => c.estado === "pendiente").length,
    aprobadas: cargas.filter((c) => c.estado === "aprobado").length,
    rechazadas: cargas.filter((c) => c.estado === "rechazado").length,
    totalLitros: cargas.reduce((sum, c) => sum + c.litros, 0),
    totalCosto: cargas.reduce((sum, c) => sum + c.costo, 0),
  };

  // Filtrar cargas por búsqueda
  const cargasFiltradas = cargas.filter(
    (carga) =>
      carga.numero_boleta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${carga.user.nombre} ${carga.user.apellido}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      carga.maquina.nombre_maquina
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (carga.ubicacion &&
        carga.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado, esCargaExterna = false) => {
    const variants = {
      pendiente: esCargaExterna
        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : "bg-yellow-100 text-yellow-800 border-yellow-200",
      aprobado: esCargaExterna
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-green-100 text-green-800 border-green-200",
      rechazado: esCargaExterna
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-red-100 text-red-800 border-red-200",
    };

    const icons = {
      pendiente: <FaClock className="w-4 h-4" />,
      aprobado: <FaCheckCircle className="w-4 h-4" />,
      rechazado: <FiXCircle className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variants[estado]}`}
      >
        {icons[estado]}
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  // 🆕 NUEVA FUNCIÓN: Manejar acciones de aprobación/rechazo
  const handleAccion = async (cargaId, accion, motivo = null) => {
    try {
      console.log(`🔄 ${accion} carga ID: ${cargaId}`);

      let endpoint = "";
      let data = {};

      if (accion === "aprobado") {
        // ✅ ADAPTADO: Usar tus rutas actuales
        endpoint = `/api/adminOperador/cargas/${cargaId}/aprobar`;
      } else if (accion === "rechazado") {
        // ✅ ADAPTADO: Usar tus rutas actuales
        endpoint = `/api/adminOperador/cargas/${cargaId}/rechazar`;
        data = { motivo_rechazo: motivo || "Sin motivo especificado" };
      }

      // ✅ ADAPTADO: Usar POST en lugar de PUT (según tus rutas)
      const response = await axios.post(endpoint, data);

      if (response.data.status === "success") {
        // Actualizar el estado local
        setCargas((prev) =>
          prev.map((carga) =>
            carga.id === cargaId
              ? {
                  ...carga,
                  estado: accion,
                  fecha_aprobacion: new Date().toISOString(),
                }
              : carga
          )
        );

        // Mostrar mensaje de éxito (opcional)
        console.log(
          `✅ Carga ${
            accion === "aprobado" ? "aprobada" : "rechazada"
          } correctamente`
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(`❌ Error al ${accion} carga:`, error);
      setError(
        `Error al ${accion === "aprobado" ? "aprobar" : "rechazar"} la carga: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // 🆕 FUNCIÓN: Manejar rechazo con motivo
  const handleRechazar = (cargaId) => {
    const motivo = prompt("Ingrese el motivo del rechazo:");
    if (motivo && motivo.trim()) {
      handleAccion(cargaId, "rechazado", motivo.trim());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Cargando datos de cargas externas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm  ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                
                <p className="mt-1 text-sm text-gray-600">
                  Gestión y supervisión de cargas externas de combustible
                </p>
                {error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                    ⚠️ {error}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* 🆕 NUEVO BOTÓN: Ir a Vista de Consumos */}
                <button
                  onClick={handleIrAConsumosView}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                >
                  <FaListAlt className="w-4 h-4 mr-2" />
                  Vista de Consumos
                </button>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Última actualización</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleTimeString("es-CL")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm  ">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Cargas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Total de Cargas
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.total}
                </p>
              </div>
              <FaTruck className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pendientes
                </h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pendientes}
                </p>
              </div>
              <FaClock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          {/* Aprobadas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Aprobadas
                </h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.aprobadas}
                </p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Rechazadas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Rechazadas
                </h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.rechazadas}
                </p>
              </div>
              <FaTimesCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Consumo Total
              </h3>
              <FiTrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Litros totales</span>
                <span className="text-xl font-bold text-blue-600">
                  {stats.totalLitros.toLocaleString()} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo total</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.totalCosto)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Estado de Revisión
              </h3>
              <FiAlertTriangle className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {stats.pendientes > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-yellow-800">
                    Cargas pendientes de revisión
                  </span>
                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                    {stats.pendientes}
                  </span>
                </div>
              )}
              {stats.pendientes === 0 && (
                <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                  <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Todas las cargas revisadas
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Cargas Recientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 mb-4 sm:mb-0">
                <CopecStyleIcon className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cargas Externas Recientes
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cargas realizadas en estaciones de servicio
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por boleta, operador o máquina..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Vista móvil */}
          <div className="block lg:hidden p-4">
            <div className="space-y-4">
              {cargasFiltradas.length > 0 ? (
                cargasFiltradas.map((carga) => (
                  <CargaExternaCard
                    key={carga.id}
                    carga={carga}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    getEstadoBadge={getEstadoBadge}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay cargas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "No se encontraron cargas con ese criterio de búsqueda."
                      : "Aún no hay cargas registradas."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vista escritorio */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maquinaria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Litros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargasFiltradas.map((carga) => {
                  const colores = getFaenaColorsById(carga.id_faena);
                  const esCargaExterna = carga.id_faena === 6;

                  return (
                    <tr
                      key={carga.id}
                      className={`
                        ${esCargaExterna ? colores.copecBg : colores.bg} 
                        ${
                          esCargaExterna ? colores.copecBorder : colores.border
                        } 
                        border-l-4 hover:bg-gray-50 transition-colors duration-200
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {esCargaExterna}
                          {carga.numero_boleta}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {carga.user.nombre} {carga.user.apellido}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {carga.maquina.nombre_maquina}
                          </div>
                          <div className="text-gray-500">
                            {carga.maquina.patente}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            esCargaExterna ? colores.copecBadge : colores.badge
                          }`}
                        >
                          {carga.litros} L
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`font-semibold ${
                            esCargaExterna ? colores.copecBlue : colores.icon
                          }`}
                        >
                          {formatCurrency(carga.costo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {carga.id_faena === 6 && (
                            <CopecStyleIcon className="w-5 h-5" />
                          )}
                          {carga.ubicacion || "No especificada"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(carga.estado, esCargaExterna)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(carga.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            onClick={() => handleVerDetalle(carga.id)}
                          >
                            <FaEye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>

                          {carga.estado === "pendiente" && (
                            <>
                              <button
                                className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-300 rounded"
                                onClick={() =>
                                  handleAccion(carga.id, "aprobado")
                                }
                              >
                                Aprobar
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 text-xs px-2 py-1 border border-red-300 rounded"
                                onClick={() => handleRechazar(carga.id)}
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {cargasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay cargas
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "No se encontraron cargas con ese criterio de búsqueda."
                  : "Aún no hay cargas registradas."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      <DetalleCargaModal
        cargaId={selectedCargaId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
};

export default MainAdminOperador;