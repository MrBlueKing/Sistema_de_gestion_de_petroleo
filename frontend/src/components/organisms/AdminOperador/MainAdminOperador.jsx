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
import SuccessNotification from '../../molecules/SuccessNotificationRendir';
import LoadingButton from '../../molecules/LoadingButtonRendir';

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
    bg: "bg-orange-50/40",
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800",
    icon: "text-orange-600",
    copecorange: "text-[#0066cc]",
    copecBg: "bg-gradient-to-r from-orange-50 to-orange-100/50",
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
  // 🆕 AGREGAR: Nuevo estado para estadísticas del backend
  const [estadisticasBackend, setEstadisticasBackend] = useState(null);

  // 2. Agregar estados para notificaciones (después de los estados existentes):
  const [notification, setNotification] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"
  });
  const [loadingCargas, setLoadingCargas] = useState({});

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

  // 3. Reemplazar la función handleRendir existente con esta:
  const handleRendir = async (cargaId) => {
    console.log("🚀 Iniciando rendición de carga:", cargaId);
    setLoadingCargas(prev => ({ ...prev, [cargaId]: true }));

    try {
      setError(null);

      const response = await axios.post(`/api/adminOperador/cargas/${cargaId}/rendir`);
      console.log("📡 Respuesta del servidor:", response.data);

      if (response.data.status === "success") {
        // Actualizar el estado local
        setCargas((prev) =>
          prev.map((carga) =>
            carga.id === cargaId
              ? { ...carga, estado: "Rendido", fecha_rendicion: new Date().toISOString() }
              : carga
          )
        );

        // Mostrar notificación de éxito
        setNotification({
          visible: true,
          title: "🎉 Carga Rendida",
          message: `La carga ha sido marcada como rendida exitosamente`,
          type: "success"
        });

        console.log("✅ Carga rendida exitosamente");
      } else {
        throw new Error(response.data.message || "Error al rendir la carga");
      }
    } catch (error) {
      console.error("❌ Error al rendir carga:", error);
      setNotification({
        visible: true,
        title: "❌ Error al Rendir",
        message: error.response?.data?.message || error.message || "Error al rendir la carga",
        type: "error"
      });
    } finally {
      setLoadingCargas(prev => ({ ...prev, [cargaId]: false }));
    }
  };

  // 4. Función para cerrar notificación:
  const closeNotification = () => {
    setNotification({ visible: false, title: "", message: "", type: "success" });
  };

  // 6️⃣ CAMBIAR: fetchCargasExternas para capturar estadísticas del backend
  const fetchCargasExternas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/adminOperador/cargas");

      if (response.data.status === "success") {
        // ✅ CORRECTO: Separar datos y estadísticas
        const { data: cargasData, estadisticas } = response.data;

        // Guardar las cargas normalmente
        setCargas(cargasData);

        // 🆕 NUEVO: Guardar estadísticas en un estado separado
        if (estadisticas) {
          setEstadisticasBackend(estadisticas);
        }

      } else {
        throw new Error(response.data.message || "Error al cargar datos");
      }
    } catch (error) {
      console.error("❌ Error al cargar cargas externas:", error);
      setError(error.response?.data?.message || error.message || "Error al cargar datos");

      setEstadisticasBackend(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargasExternas();
  }, []);

  // 2️⃣ CAMBIAR: Calcular estadísticas (reemplaza el stats actual)
  const stats = {
    // Usar estadísticas del backend si están disponibles, sino calcular del frontend
    total: estadisticasBackend?.total || cargas.length,
    porRendir: estadisticasBackend?.por_rendir || cargas.filter((c) => c.estado === "Por Rendir").length,
    rendidas: estadisticasBackend?.rendidas || cargas.filter((c) => c.estado === "Rendido").length,
    totalLitros: estadisticasBackend?.total_litros || cargas.reduce((sum, c) => sum + (parseFloat(c.litros) || 0), 0),
    totalCosto: estadisticasBackend?.total_costo || cargas.reduce((sum, c) => sum + (parseFloat(c.costo) || 0), 0),

    // 🆕 Estadísticas de comparación mensual del backend
    comparacionMensual: estadisticasBackend?.comparacion_mensual || null
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

  // 3️⃣ CAMBIAR: Function getEstadoBadge (reemplaza la actual)
  const getEstadoBadge = (estado, esCargaExterna = false) => {
    const variants = {
      "Por Rendir": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Rendido": "bg-green-100 text-green-800 border-green-200",

      // 🔄 Compatibilidad con estados viejos (por si acaso)
      "pendiente": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "aprobado": "bg-green-100 text-green-800 border-green-200",
      "rechazado": "bg-red-100 text-red-800 border-red-200",
    };

    const labels = {
      "Por Rendir": "Por Rendir",
      "Rendido": "Rendido",

      // Compatibilidad
      "pendiente": "Por Rendir",
      "aprobado": "Rendido",
      "rechazado": "Por Rendir",
    };

    const iconClasses = esCargaExterna ? "text-orange-600" : "text-gray-600";

    // Elegir ícono según el estado
    let IconComponent;
    if (estado === "Rendido" || estado === "aprobado") {
      IconComponent = FaCheckCircle;
    } else {
      IconComponent = FaClock;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variants[estado] || "bg-gray-100 text-gray-800 border-gray-200"
          }`}
      >
        <IconComponent className={`text-xs ${iconClasses}`} />
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
              className="text-orange-600 hover:text-orange-900 flex items-center space-x-1 text-xs cursor-pointer"
              onClick={() => handleVerDetalle(carga.id)}
            >
              <FaEye className="h-3 w-3" />
              <span>Ver</span>
            </button>
            {carga.estado === "Por Rendir" && (
              <LoadingButton
                isLoading={loadingCargas[carga.id]}
                onClick={() => handleRendir(carga.id)}
                className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer"
              >
                Rendir
              </LoadingButton>
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
              className="inline-flex items-center px-3 py-1 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors cursor-pointer"
              title="Ver historial y detalles completos"
            >
              <FaEye className="w-3 h-3 mr-1" />
              Ver
            </button>

            {carga.estado === "Por Rendir" && (
              <>
                <button
                  onClick={() => handleRendir(carga.id)} // ✅ AGREGAR: Conectar handl eRendir con el ID de la carga
                  className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors cursor-pointer"
                  title="Marcar carga como rendida" // ✅ OPCIONAL: Agregar tooltip descriptivo
                  disabled={loading} // ✅ OPCIONAL: Deshabilitar si está cargando
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full mr-1"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-3 h-3 mr-1" />
                      Rendir
                    </>
                  )}
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
      <MetricsSection>
        <MetricCard
          title="Total de Cargas"
          value={stats.total}
          icon={FaTruck}
          color="orange"
        />
        <MetricCard
          title="Por Rendir"
          value={stats.porRendir}
          icon={FaClock}
          color="yellow"
        />
        <MetricCard
          title="Rendidas"
          value={stats.rendidas}
          icon={FaCheckCircle}
          color="green"
        />

        {/* 🆕 MetricCard con datos reales de comparación mensual */}
        <MetricCard
          title="Litros este mes"
          value={stats.comparacionMensual?.mes_actual?.litros?.toLocaleString() || '0'}
          subtitle={
            stats.comparacionMensual?.diferencias ? (
              <span className={`text-sm ${stats.comparacionMensual.diferencias.tendencia_litros === 'subida'
                ? 'text-green-600'
                : stats.comparacionMensual.diferencias.tendencia_litros === 'bajada'
                  ? 'text-red-600'
                  : 'text-gray-600'
                }`}>
                {stats.comparacionMensual.diferencias.litros_porcentaje > 0 ? '+' : ''}
                {stats.comparacionMensual.diferencias.litros_porcentaje}% vs mes anterior
              </span>
            ) : 'Sin comparación'
          }
          icon={FiTrendingUp}
          color={stats.comparacionMensual?.diferencias?.tendencia_litros === 'subida' ? 'green' : 'orange'}
        />
      </MetricsSection>

      {/* Sección de estadísticas adicionales - Mobile Friendly y Mismo Tamaño */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:items-start">

        {/* Consumo Total */}
        <AdditionalSection title="Consumo Total" icon={FiTrendingUp} className="h-full">
          <div className="flex flex-col h-full">
            {/* Contenido principal */}
            <div className="space-y-3 sm:space-y-4 flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Litros totales</span>
                <span className="text-lg sm:text-xl font-bold text-orange-600">
                  {stats.totalLitros.toLocaleString()} L
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Costo total</span>
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  {formatCurrency(stats.totalCosto)}
                </span>
              </div>
            </div>

            {/* Estado de rendición - Siempre al final */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-3">
                {stats.porRendir > 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-xs sm:text-sm font-medium text-yellow-800">
                      Cargas por rendir
                    </span>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold self-start sm:self-auto">
                      {stats.porRendir}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                    <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-green-800">
                      Todas las cargas rendidas
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Spacer para igualar altura cuando no hay comparación mensual */}
            {!stats.comparacionMensual && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <FiTrendingUp className="h-8 w-8 mb-2" />
                  <span className="text-xs">Datos históricos disponibles pronto</span>
                </div>
              </div>
            )}
          </div>
        </AdditionalSection>

        {/* Comparación Mensual */}
        {stats.comparacionMensual ? (
          <AdditionalSection title="Comparación Mensual" icon={FiTrendingUp} className="h-full">
            <div className="flex flex-col h-full">
              {/* Contenido principal */}
              <div className="space-y-3 sm:space-y-4 flex-1">
                {/* Datos de los meses - Stack en mobile, grid en desktop */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">

                  {/* Este mes */}
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800 text-sm">
                      Este mes ({stats.comparacionMensual.mes_actual.periodo})
                    </div>
                    <div className="space-y-1 text-blue-700">
                      <div className="flex justify-between">
                        <span>Cargas:</span>
                        <span className="font-medium">{stats.comparacionMensual.mes_actual.total_cargas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Litros:</span>
                        <span className="font-medium">{stats.comparacionMensual.mes_actual.litros?.toLocaleString()} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Costo:</span>
                        <span className="font-medium">${stats.comparacionMensual.mes_actual.costo?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mes anterior */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-800 text-sm">
                      Mes anterior ({stats.comparacionMensual.mes_anterior.periodo})
                    </div>
                    <div className="space-y-1 text-gray-700">
                      <div className="flex justify-between">
                        <span>Cargas:</span>
                        <span className="font-medium">{stats.comparacionMensual.mes_anterior.total_cargas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Litros:</span>
                        <span className="font-medium">{stats.comparacionMensual.mes_anterior.litros?.toLocaleString()} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Costo:</span>
                        <span className="font-medium">${stats.comparacionMensual.mes_anterior.costo?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AdditionalSection>
        ) : (
          /* Placeholder cuando no hay datos de comparación */
          <AdditionalSection title="Comparación Mensual" icon={FiTrendingUp} className="h-full">
            <div className="flex flex-col items-center justify-center h-full py-8 text-gray-500">
              <FiTrendingUp className="h-12 w-12 mb-4" />
              <span className="text-sm font-medium mb-2">No hay datos suficientes para comparar</span>
              <span className="text-xs text-gray-400">Se necesitan datos de al menos 2 meses</span>
            </div>
          </AdditionalSection>
        )}
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

      {/* Notificación de Éxito/Error */}
      <SuccessNotification
        isVisible={notification.visible}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
    </AdminLayoutBase >
  );
};

export default MainAdminOperador;