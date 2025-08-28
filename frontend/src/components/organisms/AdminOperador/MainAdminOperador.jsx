// 🚀 MAINADMINOPERADOR OPTIMIZADO - VERSIÓN UNIFICADA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../lib/axios';
import {
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaListAlt,
  FaGasPump,
  FaEye,
  FaUser,
  FaCalendarAlt,
  FaSearch,
} from 'react-icons/fa';
import { FiAlertTriangle, FiTrendingUp, FiFileText } from "react-icons/fi";

// Importar el layout base y sus componentes
import AdminLayoutBase, {
  MetricsSection,
  MetricCard,
  TableSection,
  SearchInput,
  ResponsiveTable,
  AdditionalSection
} from './AdminLayoutBase';

// Importar modal de detalle
import DetalleCargaModal from '../../molecules/DetalleCargaModal';

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
5: {
    name: "Estacion de Servicio",
    bg: "bg-blue-50/40",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800",
    icon: "text-blue-600",
    copecBlue: "text-[#0066cc]",
    copecBg: "bg-gradient-to-r from-blue-50 to-blue-100/50",
    copecBorder: "border-l-[#0066cc]",
    copecBadge: "bg-[#0066cc]/10 text-[#0066cc]",
    emoji: "⛽",
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

const MainAdminOperador = () => {
  const navigate = useNavigate();
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleIrAConsumosView = () => {
    navigate('/consumos-view-AdminOperador');
  };

  // 🆕 FUNCIÓN: Manejar acciones de aprobación/rechazo
  const handleAccion = async (cargaId, accion, motivo = null) => {
    try {
      setError(null);
      let endpoint = "";
      let data = {};

      if (accion === "aprobado") {
        endpoint = `/api/adminOperador/cargas/${cargaId}/aprobar`;
      } else if (accion === "rechazado") {
        endpoint = `/api/adminOperador/cargas/${cargaId}/rechazar`;
        data = { motivo_rechazo: motivo || "Sin motivo especificado" };
      }

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

        console.log(
          `✅ Carga ${accion === "aprobado" ? "aprobada" : "rechazada"
          } correctamente`
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(`❌ Error al ${accion} carga:`, error);
      setError(
        `Error al ${accion === "aprobado" ? "aprobar" : "rechazar"} la carga: ${error.response?.data?.message || error.message
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

  // Función para obtener datos
  const fetchCargasExternas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/adminOperador/cargas");

      if (response.data.status === "success") {
        setCargas(response.data.data);
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
          user: { nombre: "Juan", apellido: "Pérez", nombre_completo: "Juan Pérez" },
          maquina: { nombre_maquina: "Excavadora CAT", patente: "AA-BB-12" },
          litros: 150.5,
          costo: 225750,
          estado: "pendiente",
          ubicacion: "Faena Norte",
          id_faena: 1,
          created_at: "2025-01-15T10:30:00Z",
        },
        {
          id: 2,
          numero_boleta: "BOL-002",
          user: { nombre: "María", apellido: "González", nombre_completo: "María González" },
          maquina: { nombre_maquina: "Camión Volvo", patente: "CC-DD-34" },
          litros: 200.0,
          costo: 300000,
          estado: "aprobado",
          ubicacion: "Faena Sur",
          id_faena: 4,
          created_at: "2025-01-15T11:00:00Z",
        },
        {
          id: 3,
          numero_boleta: "BOL-003",
          user: { nombre: "Carlos", apellido: "Silva", nombre_completo: "Carlos Silva" },
          maquina: { nombre_maquina: "Camión Cisterna", patente: "EE-FF-56" },
          litros: 120.0,
          costo: 180000,
          estado: "rechazado",
          ubicacion: "Estación Copec Maipú",
          id_faena: 5,
          created_at: "2025-01-15T12:30:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargasExternas();
  }, []);

  // Calcular estadísticas
  const stats = {
    total: cargas.length,
    pendientes: cargas.filter((c) => c.estado === "pendiente").length,
    aprobadas: cargas.filter((c) => c.estado === "aprobado").length,
    rechazadas: cargas.filter((c) => c.estado === "rechazado").length,
    totalLitros: cargas.reduce((sum, c) => sum + (c.litros || 0), 0),
    totalCosto: cargas.reduce((sum, c) => sum + (c.costo || 0), 0),
  };

// Filtrar cargas por búsqueda
let cargasFiltradas = cargas.filter(
  (carga) =>
    carga.numero_boleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${carga.user?.nombre} ${carga.user?.apellido}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    carga.maquina?.nombre_maquina
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    carga.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
);

// Ordenar por fecha más reciente
cargasFiltradas = cargasFiltradas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

// Si no hay término de búsqueda, mostrar solo las 5 más recientes
if (!searchTerm.trim()) {
  cargasFiltradas = cargasFiltradas.slice(0, 3);
}

  // Funciones de formateo
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
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      aprobado: "bg-green-100 text-green-800 border-green-200",
      rechazado: "bg-red-100 text-red-800 border-red-200",
    };

    const labels = {
      pendiente: "Pendiente",
      aprobado: "Aprobado",
      rechazado: "Rechazado",
    };

    const iconClasses = esCargaExterna ? "text-[#0066cc]" : "";

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[estado] || variants.pendiente} ${iconClasses}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  // 🎨 Componente de tarjeta móvil para cargas externas (actualizada)
  const CargaExternaCard = ({ carga }) => {
    const colores = getFaenaColorsById(carga.id_faena);
    const esCargaExterna = carga.id_faena === 5;

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
              className={`font-bold text-base ${esCargaExterna ? colores.copecorange : colores.icon
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
                className={`${esCargaExterna ? colores.copecorange : colores.icon
                  } text-xs`}
              />
              <span className="text-xs font-medium text-gray-600 uppercase">
                Operador
              </span>
            </div>
            <div className="font-medium text-gray-800 text-xs">
              {carga.user?.nombre_completo || `${carga.user?.nombre} ${carga.user?.apellido}` || "N/A"}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <FaTruck
                className={`${esCargaExterna ? colores.copecorange : colores.icon
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
                className={`${esCargaExterna ? colores.copecorange : colores.icon
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

        {/* Estado y acciones */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          {getEstadoBadge(carga.estado, esCargaExterna)}

          <div className="flex items-center space-x-2">
            <button
              className="text-orange-600 hover:text-orange-900 flex items-center space-x-1 text-xs"
              onClick={() => handleVerDetalle(carga.id)}
            >
              <FaEye className="h-3 w-3" />
              <span>Ver</span>
            </button>

            {carga.estado === "pendiente" && (
              <>
                <button
                  className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-300 rounded"
                  onClick={() => handleAccion(carga.id, "aprobado")}
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
        </div>
      </div>
    );
  };

  // Headers para la tabla (reducidos para evitar overflow)
  const tableHeaders = [
    "Boleta / Operador",
    "Máquina / Ubicación",
    "Consumo",
    "Estado",
    "Fecha",
    "Acciones"
  ];

  // Función para renderizar filas de la tabla
  const renderTableRow = (carga, index, isMobile = false) => {
    const colores = getFaenaColorsById(carga.id_faena);
    const esCargaExterna = carga.id_faena === 5;

    if (isMobile) {
      // Vista móvil como card
      return (
        <div className="p-4 border border-gray-200 rounded-lg">
          <CargaExternaCard carga={carga} />
        </div>
      );
    }

    // Vista desktop (optimizada para evitar overflow)
    return (
      <tr
        key={carga.id}
        className={`
          ${esCargaExterna ? colores.copecBg : colores.bg} 
          ${esCargaExterna ? colores.copecBorder : colores.border} 
          border-l-4 hover:bg-gray-50 transition-colors duration-200
        `}
      >
        {/* Boleta / Operador */}
        <td className="px-4 py-4 text-sm">
          <div className="flex items-center gap-2">
            {esCargaExterna && <CopecStyleIcon className="w-4 h-4" />}
            <div>
              <p className="font-medium text-gray-900">{carga.numero_boleta}</p>
              <p className="text-xs text-gray-500">
                {carga.user?.nombre_completo || `${carga.user?.nombre} ${carga.user?.apellido}`}
              </p>
            </div>
          </div>
        </td>

        {/* Máquina / Ubicación */}
        <td className="px-4 py-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">{carga.maquina?.nombre_maquina}</p>
            <p className="text-xs text-gray-500">{carga.maquina?.patente} • {carga.ubicacion}</p>
          </div>
        </td>

        {/* Consumo (Litros + Costo) */}
        <td className="px-4 py-4 text-sm">
          <div className="flex items-center">
            <FaGasPump className="w-3 h-3 text-orange-600 mr-1" />
            <div>
              <p className="font-medium text-gray-900">{carga.litros} L</p>
              <p className={`text-xs font-semibold ${esCargaExterna ? colores.copecorange : 'text-green-600'}`}>
                {formatCurrency(carga.costo)}
              </p>
            </div>
          </div>
        </td>

        {/* Estado */}
        <td className="px-4 py-4">
          {getEstadoBadge(carga.estado, esCargaExterna)}
        </td>

        {/* Fecha */}
        <td className="px-4 py-4 text-xs text-gray-500">
          {formatDate(carga.created_at)}
        </td>

        {/* Acciones */}
        <td className="px-4 py-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVerDetalle(carga.id)}
              className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Ver historial y detalles completos"
            >
              <FaEye className="w-3 h-3 mr-1" />
              Ver
            </button>

            {carga.estado === "pendiente" && (
              <>
                <button
                  className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Aprobar
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Componente para acciones del header
  const headerActions = (
    <>
      <div className="text-right">
        <p className="text-sm text-gray-500">Última actualización</p>
        <p className="text-sm font-medium text-gray-900">
          {new Date().toLocaleTimeString("es-CL")}
        </p>
      </div>
    </>
  );

  // Mostrar loading si está cargando
  if (loading) {
    return (
      <AdminLayoutBase
        title="Panel de Administración"
        icon={FaTruck}
        description="Gestión y supervisión de cargas externas de combustible"
      >
        <div className="min-h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos de cargas externas...</p>
          </div>
        </div>
      </AdminLayoutBase>
    );
  }

  return (
    <AdminLayoutBase
      title="Panel de Administración"
      icon={FaTruck}
      description="Gestión y supervisión de cargas externas de combustible"
      headerActions={headerActions}
      error={error}
    >
      {/* Sección de métricas principales */}
      <MetricsSection>
        <MetricCard
          title="Total de Cargas"
          value={stats.total}
          icon={FaTruck}
          color="orange"
        />
        <MetricCard
          title="Pendientes"
          value={stats.pendientes}
          icon={FaClock}
          color="yellow"
        />
        <MetricCard
          title="Aprobadas"
          value={stats.aprobadas}
          icon={FaCheckCircle}
          color="green"
        />
        <MetricCard
          title="Rechazadas"
          value={stats.rechazadas}
          icon={FaTimesCircle}
          color="red"
        />
      </MetricsSection>

      {/* Sección de estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AdditionalSection title="Consumo Total" icon={FiTrendingUp} className="h-fit">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Litros totales</span>
              <span className="text-xl font-bold text-orange-600">
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
        </AdditionalSection>

        <AdditionalSection title="Estado de Revisión" icon={FiAlertTriangle} className="h-fit">
          <div className="space-y-3">
            {stats.pendientes > 0 ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">
                  Cargas pendientes de revisión
                </span>
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                  {stats.pendientes}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Todas las cargas revisadas
                </span>
              </div>
            )}
          </div>
        </AdditionalSection>
      </div>

      {/* Tabla de cargas recientes con icono de Copec */}
      <TableSection
        title={
          <div className="flex items-center gap-3">
            <CopecStyleIcon className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cargas Externas Recientes ({cargasFiltradas.length})
              </h3>
              <p className="text-sm text-gray-600">
                Cargas realizadas en estaciones de servicio
              </p>
            </div>
          </div>
        }
        searchComponent={
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por boleta, operador, máquina o ubicación..."
            className="w-full sm:w-80"
          />
        }
      >
        <ResponsiveTable
          headers={tableHeaders}
          data={cargasFiltradas}
          renderRow={renderTableRow}
          loading={loading}
          emptyMessage={
            searchTerm
              ? "No se encontraron cargas con ese criterio de búsqueda."
              : "Aún no hay cargas registradas."
          }
        />
      </TableSection>

      {/* Modal de detalle */}
      {isModalOpen && (
        <DetalleCargaModal
          cargaId={selectedCargaId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onActionComplete={handleActionComplete}
        />
      )}
    </AdminLayoutBase>
  );
};

export default MainAdminOperador;