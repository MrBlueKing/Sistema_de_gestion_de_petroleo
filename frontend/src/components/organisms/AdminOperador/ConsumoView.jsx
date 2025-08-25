import React, { useState, useMemo } from "react";
import {
  FaGasPump,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUser,
  FaTruck,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { FiFileText, FiTrendingUp, FiX } from "react-icons/fi";
import UniversalTableFilter from "../../molecules/UniversalTableFilter";
import DetalleCargaModal from "../../molecules/DetalleCargaModal";
import useConsumos from "../../../hook/AdminVehiculos/useConsumos"; // Ajusta la ruta según tu estructura

// 🎨 COLORES POR FAENA
const FAENA_COLORS = {
  1: {
    name: "Cabildo",
    bg: "bg-green-50/30",
    border: "border-l-green-400",
    badge: "bg-green-100 text-green-800",
    emoji: "🌿",
  },
  4: {
    name: "Tiltil",
    bg: "bg-red-50/30",
    border: "border-l-red-400",
    badge: "bg-red-100 text-red-800",
    emoji: "🏔️",
  },
  6: {
    name: "Cargas Externas",
    bg: "bg-blue-50/40",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800",
    emoji: "⛽",
  },
};

// 🔄 Estados de carga
const ESTADOS_CARGA = {
  pendiente: {
    label: "Pendiente",
    icon: FaClock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconColor: "text-yellow-600",
  },
  aprobado: {
    label: "Aprobado",
    icon: FaCheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    iconColor: "text-green-600",
  },
  rechazado: {
    label: "Rechazado",
    icon: FaTimesCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    iconColor: "text-red-600",
  },
};

const ConsumosViewOptimized = () => {
  // 🚀 Usar el hook personalizado CON FILTROS AVANZADOS
  const {
    cargas,
    cargasCompletas,
    estadisticas,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado,
    filtroFaena,
    setFiltroFaena,
    filtroFecha,
    setFiltroFecha,
    ordenColumna,
    direccionOrden,
    manejarCambioOrdenamiento,
    paginaActual,
    infoPaginacion,
    irAPagina,
    refrescarDatos,
    limpiarFiltros,
    actualizarCarga,
    exportarDatos,
    hayFiltrosActivos,
    totalFiltrado,
  } = useConsumos({
    endpoint: "/api/adminOperador/cargas",
    paginacionInicial: 25,
    ordenamientoInicial: { columna: "created_at", direccion: "desc" },
  });

  // 📱 Estados locales para modal
  const [cargaSeleccionada, setCargaSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  // 🆕 NUEVOS ESTADOS PARA FILTROS AVANZADOS (como en ConsumoPorMaquinaPureTable)
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    numero_boleta: "",
    usuario: "",
    maquina: "",
    patente: "",
    ubicacion: "",
  });

  // 🆕 NUEVOS ESTADOS PARA FILTROS DE FECHAS PERSONALIZADAS
  const [filtrosFecha, setFiltrosFecha] = useState({
    fechaDesde: "",
    fechaHasta: "",
    horaDesde: "00",
    horaHasta: "23",
  });

  // 🆕 FUNCIÓN PARA MANEJAR FILTROS AVANZADOS
  const manejarCambioFiltroAvanzado = (columna, valor) => {
    console.log("🔧 Filtro avanzado:", { columna, valor });
    setFiltrosAvanzados((prev) => ({
      ...prev,
      [columna]: valor,
    }));
  };

  // 🆕 FUNCIÓN PARA MANEJAR FILTROS DE FECHA
  const manejarCambioFiltroFecha = (campo, valor) => {
    console.log("📅 Filtro fecha:", { campo, valor });
    setFiltrosFecha((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // 🆕 FUNCIÓN PARA LIMPIAR FILTROS AVANZADOS
  const limpiarFiltrosAvanzados = () => {
    setFiltrosAvanzados({
      numero_boleta: "",
      usuario: "",
      maquina: "",
      patente: "",
      ubicacion: "",
    });
    setFiltrosFecha({
      fechaDesde: "",
      fechaHasta: "",
      horaDesde: "00",
      horaHasta: "23",
    });
    limpiarFiltros(); // También limpiar filtros básicos
  };

  // 🆕 GENERAR OPCIONES ÚNICAS PARA LOS FILTROS SELECT
  const opcionesFiltros = useMemo(() => {
    const usuarios = [
      ...new Set(
        cargasCompletas
          .map((c) => `${c.user?.nombre} ${c.user?.apellido}`)
          .filter(Boolean)
      ),
    ].sort();

    const maquinas = [
      ...new Set(
        cargasCompletas.map((c) => c.maquina?.nombre_maquina).filter(Boolean)
      ),
    ].sort();

    const patentes = [
      ...new Set(
        cargasCompletas.map((c) => c.maquina?.patente).filter(Boolean)
      ),
    ].sort();

    const ubicaciones = [
      ...new Set(cargasCompletas.map((c) => c.ubicacion).filter(Boolean)),
    ].sort();

    const numeroBoletas = [
      ...new Set(cargasCompletas.map((c) => c.numero_boleta).filter(Boolean)),
    ].sort();

    return { usuarios, maquinas, patentes, ubicaciones, numeroBoletas };
  }, [cargasCompletas]);

  // 🆕 FUNCIÓN PARA APLICAR FILTRO DE FECHAS PERSONALIZADAS
  const aplicarFiltroFechas = (carga) => {
    if (!filtrosFecha.fechaDesde && !filtrosFecha.fechaHasta) {
      return true; // Sin filtro de fechas
    }

    const fechaCarga = new Date(carga.created_at);
    
    // Crear fecha desde con hora
    let fechaDesdeCompleta = null;
    if (filtrosFecha.fechaDesde) {
      fechaDesdeCompleta = new Date(`${filtrosFecha.fechaDesde}T${filtrosFecha.horaDesde}:00:00`);
    }

    // Crear fecha hasta con hora
    let fechaHastaCompleta = null;
    if (filtrosFecha.fechaHasta) {
      fechaHastaCompleta = new Date(`${filtrosFecha.fechaHasta}T${filtrosFecha.horaHasta}:59:59`);
    }

    // Aplicar filtros
    if (fechaDesdeCompleta && fechaCarga < fechaDesdeCompleta) {
      return false;
    }
    if (fechaHastaCompleta && fechaCarga > fechaHastaCompleta) {
      return false;
    }

    return true;
  };

  // 🆕 APLICAR FILTROS AVANZADOS Y ORDENAMIENTO A LOS DATOS
  const datosConFiltrosAvanzados = useMemo(() => {
    let resultado = cargas.filter((carga) => {
      // Filtro por número de boleta
      const cumpleNumeroBoleta =
        !filtrosAvanzados.numero_boleta ||
        (filtrosAvanzados.numero_boleta.includes(",")
          ? filtrosAvanzados.numero_boleta
              .split(",")
              .some((nb) => nb.trim() === carga.numero_boleta)
          : carga.numero_boleta
              .toLowerCase()
              .includes(filtrosAvanzados.numero_boleta.toLowerCase()));

      // Filtro por usuario
      const cumpleUsuario =
        !filtrosAvanzados.usuario ||
        (filtrosAvanzados.usuario.includes(",")
          ? filtrosAvanzados.usuario
              .split(",")
              .some(
                (u) =>
                  u.trim() === `${carga.user?.nombre} ${carga.user?.apellido}`
              )
          : `${carga.user?.nombre} ${carga.user?.apellido}`
              .toLowerCase()
              .includes(filtrosAvanzados.usuario.toLowerCase()));

      // Filtro por máquina
      const cumpleMaquina =
        !filtrosAvanzados.maquina ||
        (filtrosAvanzados.maquina.includes(",")
          ? filtrosAvanzados.maquina
              .split(",")
              .some((m) => m.trim() === carga.maquina?.nombre_maquina)
          : carga.maquina?.nombre_maquina
              ?.toLowerCase()
              .includes(filtrosAvanzados.maquina.toLowerCase()));

      // Filtro por patente
      const cumplePatente =
        !filtrosAvanzados.patente ||
        (filtrosAvanzados.patente.includes(",")
          ? filtrosAvanzados.patente
              .split(",")
              .some((p) => p.trim() === carga.maquina?.patente)
          : carga.maquina?.patente
              ?.toLowerCase()
              .includes(filtrosAvanzados.patente.toLowerCase()));

      // Filtro por ubicación
      const cumpleUbicacion =
        !filtrosAvanzados.ubicacion ||
        (filtrosAvanzados.ubicacion.includes(",")
          ? filtrosAvanzados.ubicacion
              .split(",")
              .some((ub) => ub.trim() === carga.ubicacion)
          : carga.ubicacion
              ?.toLowerCase()
              .includes(filtrosAvanzados.ubicacion.toLowerCase()));

      // 🆕 Filtro por fechas personalizadas
      const cumpleFechas = aplicarFiltroFechas(carga);

      return (
        cumpleNumeroBoleta &&
        cumpleUsuario &&
        cumpleMaquina &&
        cumplePatente &&
        cumpleUbicacion &&
        cumpleFechas
      );
    });

    // 🔧 APLICAR ORDENAMIENTO (CORREGIDO)
    if (ordenColumna) {
      resultado.sort((a, b) => {
        let valorA, valorB;

        switch (ordenColumna) {
          case "fecha":
          case "created_at":
            valorA = new Date(a.created_at);
            valorB = new Date(b.created_at);
            break;
          case "numero_boleta":
            valorA = a.numero_boleta?.toLowerCase() || "";
            valorB = b.numero_boleta?.toLowerCase() || "";
            break;
          case "usuario":
            valorA = `${a.user?.nombre} ${a.user?.apellido}`.toLowerCase();
            valorB = `${b.user?.nombre} ${b.user?.apellido}`.toLowerCase();
            break;
          case "maquina":
            valorA = a.maquina?.nombre_maquina?.toLowerCase() || "";
            valorB = b.maquina?.nombre_maquina?.toLowerCase() || "";
            break;
          case "litros":
            valorA = Number(a.litros) || 0;
            valorB = Number(b.litros) || 0;
            break;
          case "costo":
            valorA = Number(a.costo) || 0;
            valorB = Number(b.costo) || 0;
            break;
          default:
            return 0;
        }

        if (typeof valorA === "string") {
          const resultado = valorA.localeCompare(valorB);
          return direccionOrden === "asc" ? resultado : -resultado;
        } else {
          const resultado = valorA - valorB;
          return direccionOrden === "asc" ? resultado : -resultado;
        }
      });
    }

    return resultado;
  }, [cargas, filtrosAvanzados, filtrosFecha, ordenColumna, direccionOrden]);

  // 🆕 CONTAR FILTROS ACTIVOS (ACTUALIZADO)
  const filtrosAvanzadosActivos = Object.values(filtrosAvanzados).filter(
    (f) => f !== ""
  ).length;
  const filtrosFechaActivos = Object.values(filtrosFecha).filter(
    (f) => f !== "" && f !== "00" && f !== "23"
  ).length;
  const totalFiltrosActivos = filtrosAvanzadosActivos + filtrosFechaActivos + (hayFiltrosActivos ? 1 : 0);

  // 💰 Funciones de formato
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

  const formatNumber = (number) => {
    return new Intl.NumberFormat("es-CL").format(number);
  };

  // 🎨 Funciones utilitarias
  const getFaenaColors = (faenaId) => {
    return FAENA_COLORS[faenaId] || {
      name: "Faena Desconocida",
      bg: "bg-gray-50/25",
      border: "border-l-gray-400",
      badge: "bg-gray-100 text-gray-800",
      emoji: "🏢",
    };
  };

  const getEstadoBadge = (estado) => {
    const estadoInfo = ESTADOS_CARGA[estado] || ESTADOS_CARGA.pendiente;
    const IconComponent = estadoInfo.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoInfo.color}`}
      >
        <IconComponent className={`w-3 h-3 mr-1 ${estadoInfo.iconColor}`} />
        {estadoInfo.label}
      </span>
    );
  };

  // 📱 Funciones del modal
  const abrirDetalleCarga = (carga) => {
    setCargaSeleccionada(carga);
    setModalDetalle(true);
  };

  const cerrarModal = () => {
    setModalDetalle(false);
    setCargaSeleccionada(null);
  };

  // 📤 Función para exportar con notificación
  const manejarExportacion = () => {
    const datos = exportarDatos("json");
    console.log("📊 Datos exportados:", datos);
    // Aquí puedes implementar la descarga real del archivo
    alert(`✅ ${datos.length} registros listos para exportar`);
  };

  // 📱 Componente de paginación
  const ComponentePaginacion = () => {
    if (infoPaginacion.totalPaginas <= 1) return null;

    const getPaginasVisibles = () => {
      const delta = 2;
      const left = paginaActual - delta;
      const right = paginaActual + delta + 1;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, left); i < Math.min(infoPaginacion.totalPaginas, right); i++) {
        range.push(i);
      }

      if (paginaActual - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (paginaActual + delta + 1 < infoPaginacion.totalPaginas) {
        rangeWithDots.push('...', infoPaginacion.totalPaginas);
      } else if (infoPaginacion.totalPaginas > 1) {
        rangeWithDots.push(infoPaginacion.totalPaginas);
      }

      return rangeWithDots;
    };

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => irAPagina(paginaActual - 1)}
            disabled={!infoPaginacion.hayAnterior}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </button>
          <button
            onClick={() => irAPagina(paginaActual + 1)}
            disabled={!infoPaginacion.haySiguiente}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
            <FaChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{infoPaginacion.inicio}</span> a{" "}
              <span className="font-medium">{infoPaginacion.fin}</span> de{" "}
              <span className="font-medium">{infoPaginacion.totalRegistros}</span> resultados
            </p>
          </div>
          
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={!infoPaginacion.hayAnterior}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              
              {getPaginasVisibles().map((pagina, index) => (
                <button
                  key={index}
                  onClick={() => typeof pagina === 'number' ? irAPagina(pagina) : null}
                  disabled={pagina === '...'}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pagina === paginaActual
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : pagina === '...'
                      ? 'border-gray-300 bg-white text-gray-500 cursor-default'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pagina}
                </button>
              ))}
              
              <button
                onClick={() => irAPagina(paginaActual + 1)}
                disabled={!infoPaginacion.haySiguiente}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando consumos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 📊 Header principal */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaGasPump className="text-blue-600 mr-3" />
                  Vista de Consumos
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gestión completa de cargas externas de combustible ({totalFiltrado} registros)
                </p>
                {error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                    ⚠️ {error}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={refrescarDatos}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaCalendarAlt className="w-4 h-4 mr-1" />
                  Actualizar
                </button>
                <button
                  onClick={manejarExportacion}
                  disabled={totalFiltrado === 0}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaDownload className="w-4 h-4 mr-1" />
                  Exportar ({totalFiltrado})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 📊 Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiFileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Registros
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatNumber(estadisticas.total)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaClock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pendientes
                    </dt>
                    <dd className="text-lg font-medium text-yellow-600">
                      {formatNumber(estadisticas.pendientes)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaGasPump className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Litros
                    </dt>
                    <dd className="text-lg font-medium text-blue-600">
                      {formatNumber(Math.round(estadisticas.totalLitros))} L
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiTrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Costo
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      {formatCurrency(estadisticas.totalCosto)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 Panel de filtros MEJORADO */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FaFilter className="text-gray-500 mr-2" />
                Filtros y Búsqueda
                {totalFiltrosActivos > 0 && (
                  <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {totalFiltrosActivos} filtro{totalFiltrosActivos !== 1 ? "s" : ""} activo{totalFiltrosActivos !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              {totalFiltrosActivos > 0 && (
                <button
                  onClick={limpiarFiltrosAvanzados}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Filtros básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Búsqueda general */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Búsqueda General
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar en todo..."
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Filtro Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobado">Aprobados</option>
                  <option value="rechazado">Rechazados</option>
                </select>
              </div>

              {/* Filtro Faena */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faena
                </label>
                <select
                  value={filtroFaena}
                  onChange={(e) => setFiltroFaena(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="todas">Todas las faenas</option>
                  <option value="1">🌿 Cabildo</option>
                  <option value="4">🏔️ Tiltil</option>
                  <option value="6">⛽ Cargas Externas</option>
                </select>
              </div>

              {/* Filtro Fecha (período predefinido) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período Predefinido
                </label>
                <select
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="todas">Todas las fechas</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mes</option>
                  <option value="trimestre">Último trimestre</option>
                  <option value="anio">Último año</option>
                </select>
              </div>
            </div>

            {/* 🆕 NUEVA SECCIÓN: Filtros de Fechas Personalizadas */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📅 Filtros de Fechas Personalizadas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {/* Fecha Desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={filtrosFecha.fechaDesde}
                    onChange={(e) => manejarCambioFiltroFecha("fechaDesde", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Hora Desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Desde
                  </label>
                  <select
                    value={filtrosFecha.horaDesde}
                    onChange={(e) => manejarCambioFiltroFecha("horaDesde", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha Hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={filtrosFecha.fechaHasta}
                    onChange={(e) => manejarCambioFiltroFecha("fechaHasta", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Hora Hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Hasta
                  </label>
                  <select
                    value={filtrosFecha.horaHasta}
                    onChange={(e) => manejarCambioFiltroFecha("horaHasta", e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}:59
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Información del rango de fechas activo */}
              {(filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <div className="flex items-center text-blue-800">
                    <FaCalendarAlt className="mr-2" />
                    <span className="text-sm font-medium">
                      Rango activo: 
                      {filtrosFecha.fechaDesde ? 
                        ` ${filtrosFecha.fechaDesde} ${filtrosFecha.horaDesde}:00` : 
                        " (sin límite inicial)"
                      } hasta 
                      {filtrosFecha.fechaHasta ? 
                        ` ${filtrosFecha.fechaHasta} ${filtrosFecha.horaHasta}:59` : 
                        " (sin límite final)"
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Filtros avanzados por columna */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Filtros Avanzados por Columna
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro Número de Boleta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Boleta
                  </label>
                  <input
                    type="text"
                    value={filtrosAvanzados.numero_boleta}
                    onChange={(e) =>
                      manejarCambioFiltroAvanzado("numero_boleta", e.target.value)
                    }
                    placeholder="Ej: BOL-001"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Filtro Usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={filtrosAvanzados.usuario}
                    onChange={(e) =>
                      manejarCambioFiltroAvanzado("usuario", e.target.value)
                    }
                    placeholder="Nombre del usuario"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Filtro Máquina */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máquina
                  </label>
                  <input
                    type="text"
                    value={filtrosAvanzados.maquina}
                    onChange={(e) =>
                      manejarCambioFiltroAvanzado("maquina", e.target.value)
                    }
                    placeholder="Nombre de máquina"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Filtro Patente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patente
                  </label>
                  <input
                    type="text"
                    value={filtrosAvanzados.patente}
                    onChange={(e) =>
                      manejarCambioFiltroAvanzado("patente", e.target.value)
                    }
                    placeholder="Ej: AA-BB-12"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Filtro Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={filtrosAvanzados.ubicacion}
                    onChange={(e) =>
                      manejarCambioFiltroAvanzado("ubicacion", e.target.value)
                    }
                    placeholder="Ubicación"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Barra de filtros activos */}
            {totalFiltrosActivos > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">
                    Filtros activos:
                  </span>
                  
                  {/* Filtros básicos activos */}
                  {filtroEstado !== "todos" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                      Estado: {filtroEstado}
                      <button
                        onClick={() => setFiltroEstado("todos")}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  )}

                  {filtroFaena !== "todas" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                      Faena: {filtroFaena === "1" ? "Cabildo" : filtroFaena === "4" ? "Tiltil" : "Cargas Externas"}
                      <button
                        onClick={() => setFiltroFaena("todas")}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  )}

                  {filtroFecha !== "todas" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                      Período: {filtroFecha}
                      <button
                        onClick={() => setFiltroFecha("todas")}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  )}

                  {/* Filtros avanzados activos */}
                  {Object.entries(filtrosAvanzados).map(([key, value]) => 
                    value && (
                      <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                        {key.replace('_', ' ')}: {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                        <button
                          onClick={() => manejarCambioFiltroAvanzado(key, "")}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    )
                  )}

                  {/* 🆕 Filtros de fechas activos */}
                  {filtrosFecha.fechaDesde && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                      Desde: {filtrosFecha.fechaDesde} {filtrosFecha.horaDesde}:00
                      <button
                        onClick={() => {
                          manejarCambioFiltroFecha("fechaDesde", "");
                          manejarCambioFiltroFecha("horaDesde", "00");
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  )}

                  {filtrosFecha.fechaHasta && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                      Hasta: {filtrosFecha.fechaHasta} {filtrosFecha.horaHasta}:59
                      <button
                        onClick={() => {
                          manejarCambioFiltroFecha("fechaHasta", "");
                          manejarCambioFiltroFecha("horaHasta", "23");
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 Tabla principal CON UniversalTableFilter Y DATOS CORREGIDOS */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Registros de Consumos ({formatNumber(datosConFiltrosAvanzados.length)} de {formatNumber(estadisticas.totalOriginal)})
              {ordenColumna && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Ordenado por: {
                    ordenColumna === "fecha" ? "Fecha" :
                    ordenColumna === "numero_boleta" ? "N° Boleta" :
                    ordenColumna === "usuario" ? "Usuario" :
                    ordenColumna === "maquina" ? "Máquina" :
                    ordenColumna === "litros" ? "Litros" :
                    ordenColumna === "costo" ? "Costo" :
                    ordenColumna
                  } {direccionOrden === "desc" ? "↓" : "↑"}
                </span>
              )}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* FECHA con UniversalTableFilter */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Fecha"
                      columna="fecha"
                      onOrdenamientoChange={(columna, direccion) => {
                        if (direccion) {
                          manejarCambioOrdenamiento(columna, direccion);
                        } else {
                          manejarCambioOrdenamiento(columna);
                        }
                      }}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  {/* N° BOLETA con UniversalTableFilter */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="N° Boleta"
                      columna="numero_boleta"
                      tipo="select"
                      esMultiple={true}
                      opciones={opcionesFiltros.numeroBoletas}
                      valorFiltro={filtrosAvanzados.numero_boleta}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={(columna, direccion) => {
                        if (direccion) {
                          manejarCambioOrdenamiento(columna, direccion);
                        } else {
                          manejarCambioOrdenamiento(columna);
                        }
                      }}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                      mostrarBusqueda={true}
                      placeholder="Buscar boleta..."
                      anchoMinimo="200px"
                    />
                  </th>

                  {/* USUARIO con UniversalTableFilter */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Usuario"
                      columna="usuario"
                      tipo="select"
                      esMultiple={true}
                      opciones={opcionesFiltros.usuarios}
                      valorFiltro={filtrosAvanzados.usuario}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={(columna, direccion) => {
                        if (direccion) {
                          manejarCambioOrdenamiento(columna, direccion);
                        } else {
                          manejarCambioOrdenamiento(columna);
                        }
                      }}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                      mostrarBusqueda={true}
                      placeholder="Buscar usuario..."
                      anchoMinimo="250px"
                    />
                  </th>

                  {/* MÁQUINA con UniversalTableFilter */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Máquina"
                      columna="maquina"
                      tipo="select"
                      esMultiple={true}
                      opciones={opcionesFiltros.maquinas}
                      valorFiltro={filtrosAvanzados.maquina}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={(columna, direccion) => {
                        if (direccion) {
                          manejarCambioOrdenamiento(columna, direccion);
                        } else {
                          manejarCambioOrdenamiento(columna);
                        }
                      }}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                      mostrarBusqueda={true}
                      placeholder="Buscar máquina..."
                      anchoMinimo="280px"
                    />
                  </th>

                  {/* LITROS con UniversalTableFilter */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Litros"
                      columna="litros"
                      onOrdenamientoChange={(columna, direccion) => {
                        if (direccion) {
                          manejarCambioOrdenamiento(columna, direccion);
                        } else {
                          manejarCambioOrdenamiento(columna);
                        }
                      }}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  {/* COSTO con UniversalTableFilter */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Costo"
                      columna="costo"
                      onOrdenamientoChange={(columna, direccion) => {
                        if (direccion) {
                          manejarCambioOrdenamiento(columna, direccion);
                        } else {
                          manejarCambioOrdenamiento(columna);
                        }
                      }}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  {/* ESTADO - Solo ordenamiento */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>

                  {/* ACCIONES - Sin filtros ni ordenamiento */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200 transition-all duration-300 ease-in-out">
                {/* 🔧 CAMBIO CRÍTICO: Usar datosConFiltrosAvanzados en lugar de cargas */}
                {datosConFiltrosAvanzados.map((carga, index) => {
                  const faenaColors = getFaenaColors(carga.id_faena);
                  return (
                    <tr
                      key={carga.id}
                      className={`hover:bg-gray-50 transition-colors ${faenaColors.bg} ${faenaColors.border} border-l-4`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: "fadeInUp 0.4s ease-out forwards",
                      }}
                    >
                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          {formatDate(carga.created_at)}
                        </div>
                      </td>

                      {/* N° Boleta */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {carga.numero_boleta}
                        </div>
                        <div className={`text-xs ${faenaColors.badge} px-2 py-1 rounded-full inline-block mt-1`}>
                          {faenaColors.emoji} {faenaColors.name}
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.user?.nombre} {carga.user?.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              {carga.user?.rut}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Máquina */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaTruck className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carga.maquina?.nombre_maquina}
                            </div>
                            <div className="text-sm text-gray-500">
                              {carga.maquina?.patente}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Litros */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 flex items-center justify-center">
                          <FaGasPump className="text-blue-500 mr-1" />
                          {formatNumber(carga.litros)} L
                        </div>
                      </td>

                      {/* Costo */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(carga.costo)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(carga.precio_por_litro)}/L
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(carga.estado)}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => abrirDetalleCarga(carga)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <FaEye className="w-3 h-3 mr-1" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Filas vacías para mantener altura mínima */}
                {datosConFiltrosAvanzados.length < 4 &&
                  Array.from({ length: 4 - datosConFiltrosAvanzados.length }).map(
                    (_, index) => (
                      <tr
                        key={`empty-${index}`}
                        className="h-20"
                        style={{ opacity: 0 }}
                      >
                        <td colSpan="8">&nbsp;</td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>

          {/* 📊 Mensaje si no hay datos */}
          {datosConFiltrosAvanzados.length === 0 && (
            <div className="text-center py-12">
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay consumos disponibles
              </h3>
              <p className="text-gray-500 mb-4">
                {totalFiltrosActivos > 0
                  ? "No se encontraron resultados con los filtros aplicados."
                  : "No hay registros de consumos para mostrar."}
              </p>
              {totalFiltrosActivos > 0 && (
                <button
                  onClick={limpiarFiltrosAvanzados}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar Todos los Filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* 📱 Componente de paginación ACTUALIZADO */}
        {datosConFiltrosAvanzados.length > 25 && (
          <div className="mt-8">
            <ComponentePaginacion />
          </div>
        )}

        {/* 📊 Footer con información actualizada */}
        <div className="bg-gray-50 px-6 py-4 border-t rounded-lg mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>
                  <strong>{datosConFiltrosAvanzados.length}</strong> de{" "}
                  <strong>{estadisticas.totalOriginal}</strong> registro{estadisticas.totalOriginal !== 1 ? "s" : ""} mostrado{datosConFiltrosAvanzados.length !== 1 ? "s" : ""}
                </span>
                {totalFiltrosActivos > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600">
                      <strong>{totalFiltrosActivos}</strong> filtro{totalFiltrosActivos !== 1 ? "s" : ""} activo{totalFiltrosActivos !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>
                  <strong>{datosConFiltrosAvanzados.filter((c) => c.estado === "pendiente").length}</strong> pendientes
                </span>
                <span>•</span>
                <span>
                  <strong>{datosConFiltrosAvanzados.filter((c) => c.estado === "aprobado").length}</strong> aprobados
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Actualizado: {new Date().toLocaleTimeString("es-CL")}
            </div>
          </div>
        </div>
      </div>

      {/* 📱 Modal de detalle */}
      {modalDetalle && cargaSeleccionada && (
        <DetalleCargaModal
          carga={cargaSeleccionada}
          isOpen={modalDetalle}
          onClose={cerrarModal}
          onEstadoChange={(nuevaCarga) => {
            actualizarCarga(nuevaCarga);
            cerrarModal();
          }}
        />
      )}
    </div>
  );
};

export default ConsumosViewOptimized;