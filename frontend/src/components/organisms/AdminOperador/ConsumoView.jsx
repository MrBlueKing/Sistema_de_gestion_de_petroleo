import React, { useState, useEffect, useMemo, useCallback } from "react";
import useConsumos from "../../../hook/AdminVehiculos/useConsumos";
import UniversalTableFilter from "../../molecules/UniversalTableFilter";
import FiltrosComponent from "../../molecules/FiltrosComponent";
import DetalleCargaModal from "../../molecules/DetalleCargaModal";
import {
  FaCheck,
  FaClock,
  FaSearch,
  FaCalendarAlt,
  FaTimes,
  FaEye,
  FaTimesCircle,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

// Configuración de estados
const estadosConfig = {
  pendiente: {
    texto: "Pendiente",
    icono: FaClock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconColor: "text-yellow-600",
  },
  aprobado: {
    texto: "Aprobado",
    icono: FaCheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    iconColor: "text-green-600",
  },
  rechazado: {
    texto: "Rechazado",
    icono: FaTimesCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    iconColor: "text-red-600",
  },
};

// 🎨 COLORES POR FAENA
const FAENA_COLORS = {
  1: {
    name: "Cabildo",
    bg: "bg-green-50/30",
    border: "border-l-green-400",
    badge: "bg-green-100 text-green-800",
    icon: "text-green-600",
    emoji: "🌿",
  },
  4: {
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

// 🆕 Fallback de ubicaciones por defecto
const faenasPorDefecto = [
  {
    value: "todas",
    label: "📍 Todas las ubicaciones",
    ubicacionesOriginales: [],
    representativo: "Todas las ubicaciones",
    faenaId: null
  },
  {
    value: "copec san felipe",
    label: "📍 Copec San Felipe",
    ubicacionesOriginales: ["Copec San Felipe", "copec san felipe", "COPEC SAN FELIPE"],
    representativo: "Copec San Felipe",
    faenaId: 5
  },
  {
    value: "copec la ligua",
    label: "📍 Copec La Ligua",
    ubicacionesOriginales: ["Copec La Ligua", "copec la ligua", "COPEC LA LIGUA"],
    representativo: "Copec La Ligua",
    faenaId: 5
  },
  {
    value: "copec cabildo",
    label: "📍 Copec Cabildo",
    ubicacionesOriginales: ["Copec Cabildo", "copec cabildo", "COPEC CABILDO"],
    representativo: "Copec Cabildo",
    faenaId: 5
  }
];

const ConsumosViewOptimized = () => {
  // 🚀 Hook useConsumos - SIN filtros de fecha iniciales
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
    filtroFaena: filtroFaenaHook,
    setFiltroFaena: setFiltroFaenaHook,
    ordenColumna,
    direccionOrden,
    manejarCambioOrdenamiento: manejarCambioOrdenamientoHook,
    paginaActual,
    infoPaginacion,
    irAPagina,
    refrescarDatos,
    limpiarFiltros: limpiarFiltrosHook,
    actualizarCarga,
    exportarDatos,
    hayFiltrosActivos,
    totalFiltrado,
  } = useConsumos({
    endpoint: "/api/adminOperador/cargas",
    paginacionInicial: 25,
    ordenamientoInicial: { columna: "created_at", direccion: "desc" },
  });

  // ⭐ NUEVOS ESTADOS PARA EL MODAL DE DETALLE
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🆕 Estado para ubicaciones disponibles
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState([]);


  // Funciones para manejar el modal de detalle
  const handleVerDetalle = (cargaId) => {
    console.log('🔍 Abriendo detalle para carga ID:', cargaId);
    setSelectedCargaId(cargaId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargaId(null);
  };

  const handleActionComplete = () => {
    // Actualizar los datos después de una acción en el modal
    refrescarDatos();
    // Si hay callback del componente padre, ejecutarlo
    if (onCargaUpdate) {
      onCargaUpdate();
    }
  };

  // 🆕 Estados para FiltrosComponent
  const [filtrosFecha, setFiltrosFecha] = useState({
    fechaDesde: "",
    fechaHasta: "",
    faenaSeleccionada: "todas",
  });

  // 🆕 Estados para filtros avanzados de tabla - CORREGIDO
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    numero_boleta: "",
    usuario: "",
    maquina: "",
    patente: "",
    ubicacion: "",
    estado: "",
  });

  // 🆕 Estados para filtros de fecha CON HORAS
  const [filtrosFechaPersonalizados, setFiltrosFechaPersonalizados] = useState({
    fechaDesde: "",
    fechaHasta: "",
    horaDesde: "00",
    horaHasta: "23",
  });

  // 🆕 FUNCIÓN PARA MANEJAR FILTROS AVANZADOS - CORREGIDO
  const manejarCambioFiltroAvanzado = useCallback((columna, valor) => {
    console.log("🔧 Filtro avanzado:", { columna, valor });
    setFiltrosAvanzados((prev) => ({
      ...prev,
      [columna]: valor,
    }));
  }, []);

  // 🧠 Función inteligente para normalizar y agrupar ubicaciones
  const normalizarUbicaciones = useCallback((ubicaciones) => {
    console.log('🧠 Normalizando ubicaciones:', ubicaciones);

    // Paso 1: Normalizar cada ubicación
    const ubicacionesNormalizadas = ubicaciones.map(ubicacion => {
      const original = ubicacion;

      // Limpiar espacios y normalizar
      let limpia = ubicacion
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/[0-9]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      console.log(`🔄 "${original}" → "${limpia}"`);

      return {
        original,
        normalizada: limpia,
        palabras: limpia.split(' ').filter(p => p.length > 2)
      };
    });

    // Paso 2: Agrupar por similitud
    const grupos = new Map();

    ubicacionesNormalizadas.forEach(({ original, normalizada, palabras }) => {
      let grupoEncontrado = null;

      // Buscar si ya existe un grupo similar
      for (let [clave, grupo] of grupos) {
        // Criterio 1: Coincidencia exacta normalizada
        if (clave === normalizada) {
          grupoEncontrado = grupo;
          break;
        }

        // Criterio 2: Coincidencia de palabras principales
        const palabrasGrupo = grupo.palabrasRepresentativas;
        const coincidencias = palabras.filter(p => palabrasGrupo.includes(p));

        // Si coinciden más del 60% de las palabras principales
        if (palabras.length > 0 && coincidencias.length / palabras.length > 0.6) {
          grupoEncontrado = grupo;
          break;
        }
      }

      if (grupoEncontrado) {
        // Agregar al grupo existente
        grupoEncontrado.ubicaciones.push(original);
        grupoEncontrado.conteo++;

        // Actualizar el representativo si es más común o más limpio
        if (original.length < grupoEncontrado.representativo.length ||
          grupoEncontrado.conteo === 1) {
          grupoEncontrado.representativo = original;
        }
      } else {
        // Crear nuevo grupo
        grupos.set(normalizada, {
          representativo: original,
          ubicaciones: [original],
          conteo: 1,
          palabrasRepresentativas: palabras,
          normalizada
        });
      }
    });

    // Paso 3: Crear opciones agrupadas
    const opcionesAgrupadas = Array.from(grupos.values())
      .sort((a, b) => a.representativo.localeCompare(b.representativo))
      .map(grupo => {
        const etiqueta = grupo.conteo > 1
          ? `📍 ${grupo.representativo} (${grupo.conteo} variantes)`
          : `📍 ${grupo.representativo}`;

        return {
          value: grupo.normalizada,
          label: etiqueta,
          ubicacionesOriginales: grupo.ubicaciones,
          representativo: grupo.representativo,
          faenaId: 5
        };
      });

    console.log('✅ Ubicaciones agrupadas con originales:', opcionesAgrupadas);
    return opcionesAgrupadas;
  }, []);

  // 🔧 Actualizar la función de extracción para usar normalización
  const extraerUbicaciones = useCallback((cargas) => {
    const ubicacionesUnicas = new Set();

    cargas.forEach(carga => {
      if (carga.ubicacion) {
        ubicacionesUnicas.add(carga.ubicacion);
      }
    });

    // Convertir a array y normalizar
    const ubicacionesArray = Array.from(ubicacionesUnicas);
    const ubicacionesAgrupadas = normalizarUbicaciones(ubicacionesArray);

    console.log('🗺️ Ubicaciones extraídas y agrupadas:', ubicacionesAgrupadas);
    return ubicacionesAgrupadas;
  }, [normalizarUbicaciones]);

  // 🔄 Actualizar ubicaciones cuando cambien las cargas
  useEffect(() => {
    if (cargas.length > 0) {
      const ubicacionesExtraidas = extraerUbicaciones(cargas);
      setUbicacionesDisponibles(ubicacionesExtraidas);
      console.log('✅ Ubicaciones disponibles actualizadas:', ubicacionesExtraidas);
    } else {
      setUbicacionesDisponibles([]);
    }
  }, [cargas, extraerUbicaciones]);

  // 🔧 Función de ordenamiento mejorada
  const manejarCambioOrdenamiento = useCallback((columna, direccionEspecifica = null) => {
    console.log('🔧 Click en ordenamiento:', {
      columna,
      direccionEspecifica,
      columnaActual: ordenColumna,
      direccionActual: direccionOrden
    });

    if (ordenColumna === columna) {
      // 🔄 MISMA COLUMNA: Alternar SIEMPRE
      const nuevaDireccion = direccionOrden === "asc" ? "desc" : "asc";
      console.log('🔄 Alternando dirección:', direccionOrden, '→', nuevaDireccion);
      manejarCambioOrdenamientoHook(columna);
    } else {
      // 🆕 NUEVA COLUMNA: Usar la función del hook
      console.log('🆕 Nueva columna:', columna);
      manejarCambioOrdenamientoHook(columna);
    }
  }, [ordenColumna, direccionOrden, manejarCambioOrdenamientoHook]);

  // 🆕 Función para manejar cambios en FiltrosComponent
  const handleFiltrosChange = useCallback((nuevosFiltros) => {
    console.log('🔧 Cambio en filtros recibidos:', nuevosFiltros);

    setFiltrosFecha(prev => ({
      ...prev,
      ...nuevosFiltros
    }));

    // Sincronizar con el hook useConsumos
    if (nuevosFiltros.faenaSeleccionada !== undefined) {
      setFiltroFaenaHook("todas");
    }
  }, [setFiltroFaenaHook]);

  // 🔄 Sincronizar estado inicial
  useEffect(() => {
    if (ubicacionesDisponibles.length > 0 && filtrosFecha.faenaSeleccionada === "todas") {
      setFiltroFaenaHook("todas");
    }
  }, [ubicacionesDisponibles, filtrosFecha.faenaSeleccionada, setFiltroFaenaHook]);

  // 🆕 Función para manejar filtros de fecha personalizados CON HORAS
  const manejarCambioFiltroFechaPersonalizado = useCallback((campo, valor) => {
    console.log("📅 Filtro fecha personalizado:", { campo, valor });
    setFiltrosFechaPersonalizados(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // 🔧 Aplicar filtros de fecha Y ubicación a los datos del hook
  const datosConFiltrosFecha = useMemo(() => {
    let resultado = [...cargas];

    // Aplicar filtro de fecha personalizada
    if (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta) {
      resultado = resultado.filter(carga => {
        const fechaCarga = new Date(carga.created_at);

        const fechaDesde = filtrosFecha.fechaDesde ? new Date(filtrosFecha.fechaDesde + 'T00:00:00') : null;
        const fechaHasta = filtrosFecha.fechaHasta ? new Date(filtrosFecha.fechaHasta + 'T23:59:59') : null;

        if (fechaDesde && fechaCarga < fechaDesde) return false;
        if (fechaHasta && fechaCarga > fechaHasta) return false;

        return true;
      });
    }

    // Aplicar filtro de ubicación
    if (filtrosFecha.faenaSeleccionada && filtrosFecha.faenaSeleccionada !== "todas") {
      resultado = resultado.filter(carga => {
        if (!carga.ubicacion) return false;

        const opcionSeleccionada = ubicacionesDisponibles.find(
          opcion => opcion.value === filtrosFecha.faenaSeleccionada
        );

        if (opcionSeleccionada?.ubicacionesOriginales) {
          return opcionSeleccionada.ubicacionesOriginales.includes(carga.ubicacion);
        } else {
          const ubicacionNormalizada = carga.ubicacion
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .replace(/[0-9]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          return ubicacionNormalizada === filtrosFecha.faenaSeleccionada;
        }
      });
    }

    return resultado;
  }, [cargas, filtrosFecha.fechaDesde, filtrosFecha.fechaHasta, filtrosFecha.faenaSeleccionada, ubicacionesDisponibles]);

  // 🔧 GENERAR OPCIONES PARA LOS FILTROS DE COLUMNAS
  const opcionesFiltros = useMemo(() => {
    const datos = datosConFiltrosFecha;

    return {
      numeroBoletas: [...new Set(datos.map(c => c.numero_boleta).filter(Boolean))].sort(),
      usuarios: [...new Set(datos.map(c => `${c.user?.nombre || ''} ${c.user?.apellido || ''}`.trim()).filter(Boolean))].sort(),
      maquinas: [...new Set(datos.map(c => c.maquina?.nombre_maquina).filter(Boolean))].sort(),
      patentes: [...new Set(datos.map(c => c.maquina?.patente).filter(Boolean))].sort(),
      ubicaciones: [...new Set(datos.map(c => c.ubicacion).filter(Boolean))].sort(),
      estados: [...new Set(datos.map(c => c.estado).filter(Boolean))].sort()
    };
  }, [datosConFiltrosFecha]);

  // 🔧 Aplicar filtros avanzados de tabla
  const datosFiltrados = useMemo(() => {
    let resultado = [...datosConFiltrosFecha];

    // Filtro por número de boleta (múltiple)
    if (filtrosAvanzados.numero_boleta) {
      const boletasSeleccionadas = filtrosAvanzados.numero_boleta.split(',').map(b => b.trim()).filter(Boolean);
      if (boletasSeleccionadas.length > 0) {
        resultado = resultado.filter(carga =>
          carga.numero_boleta?.toLowerCase().includes(filtrosAvanzados.numero_boleta.toLowerCase())
        );
      }
    }

    // Filtro por usuario (múltiple)
    if (filtrosAvanzados.usuario) {
      const usuariosSeleccionados = filtrosAvanzados.usuario.split(',').map(u => u.trim()).filter(Boolean);
      if (usuariosSeleccionados.length > 0) {
        resultado = resultado.filter(carga => {
          const nombreCompleto = `${carga.user?.nombre || ''} ${carga.user?.apellido || ''}`.trim();
          return nombreCompleto.toLowerCase().includes(filtrosAvanzados.usuario.toLowerCase());
        });
      }
    }

    // Filtro por máquina (múltiple)
    if (filtrosAvanzados.maquina) {
      const maquinasSeleccionadas = filtrosAvanzados.maquina.split(',').map(m => m.trim()).filter(Boolean);
      if (maquinasSeleccionadas.length > 0) {
        resultado = resultado.filter(carga =>
          carga.maquina?.nombre_maquina?.toLowerCase().includes(filtrosAvanzados.maquina.toLowerCase())
        );

      }
    }

    // Filtro por patente (múltiple)
    if (filtrosAvanzados.patente) {
      const patentesSeleccionadas = filtrosAvanzados.patente.split(',').map(p => p.trim()).filter(Boolean);
      if (patentesSeleccionadas.length > 0) {
        resultado = resultado.filter(carga =>
          carga.maquina?.patente?.toLowerCase().includes(filtrosAvanzados.patente.toLowerCase())
        );
      }
    }

    // Filtro por ubicación (múltiple)
    if (filtrosAvanzados.ubicacion) {
      const ubicacionesSeleccionadas = filtrosAvanzados.ubicacion.split(',').map(u => u.trim()).filter(Boolean);
      if (ubicacionesSeleccionadas.length > 0) {
        resultado = resultado.filter(carga =>
          carga.ubicacion?.toLowerCase().includes(filtrosAvanzados.ubicacion.toLowerCase())
        );
      }
    }

    // Filtro por estado
    if (filtrosAvanzados.estado) {
      resultado = resultado.filter(carga =>
        carga.estado === filtrosAvanzados.estado
      );
    }

    return resultado;
  }, [datosConFiltrosFecha, filtrosAvanzados]);

  // 🧹 Función para limpiar todos los filtros
  const limpiarTodosLosFiltros = useCallback(() => {
    // Limpiar filtros del hook
    limpiarFiltrosHook();

    // Limpiar filtros de fecha
    setFiltrosFecha({
      fechaDesde: "",
      fechaHasta: "",
      faenaSeleccionada: "todas",
    });

    // Limpiar filtros de fecha personalizados
    setFiltrosFechaPersonalizados({
      fechaDesde: "",
      fechaHasta: "",
      horaDesde: "00",
      horaHasta: "23",
    });

    // Limpiar filtros avanzados
    setFiltrosAvanzados({
      numero_boleta: "",
      usuario: "",
      maquina: "",
      patente: "",
      ubicacion: "",
      estado: "",
    });
  }, [limpiarFiltrosHook]);

  // Determinar si hay filtros activos
  const hayFiltrosActivosTotal = useMemo(() => {
    return hayFiltrosActivos ||
      filtrosFecha.fechaDesde ||
      filtrosFecha.fechaHasta ||
      filtrosFecha.faenaSeleccionada !== "todas" ||
      filtrosFechaPersonalizados.fechaDesde ||
      filtrosFechaPersonalizados.fechaHasta ||
      Object.values(filtrosAvanzados).some(valor => valor !== "");
  }, [hayFiltrosActivos, filtrosFecha, filtrosFechaPersonalizados, filtrosAvanzados]);

  // Wrapper para el ordenamiento
  const manejarOrdenamientoWrapper = useCallback((columna, direccion) => {
    manejarCambioOrdenamiento(columna, direccion);
  }, [manejarCambioOrdenamiento]);

  return (
    <div className="space-y-6 p-6">
      {/* 🆕 TÍTULO Y ESTADÍSTICAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Consumos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra y supervisa todos los consumos de combustible
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex gap-4 mt-4 sm:mt-0">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{totalFiltrado}</div>
            <div className="text-xs text-gray-500">Registros</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              ${estadisticas.totalCosto?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-500">Costo Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {estadisticas.totalLitros?.toLocaleString() || 0}L
            </div>
            <div className="text-xs text-gray-500">Litros Total</div>
          </div>
        </div>
      </div>

      {/* 🆕 FILTROS COMPONENT - MODO UBICACIONES */}
      <FiltrosComponent
        fechaDesde={filtrosFecha.fechaDesde}
        fechaHasta={filtrosFecha.fechaHasta}
        faenaSeleccionada={filtrosFecha.faenaSeleccionada}
        faenas={ubicacionesDisponibles.length > 0 ? ubicacionesDisponibles : faenasPorDefecto}
        modo="ubicaciones"
        mostrarFaenas={true}
        incluirHoras={false}
        mostrarTitulo={false}
        cargando={loading}
        onChange={handleFiltrosChange}
        className="mb-6"
      />

      {/* 🔧 Separador */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* 🆕 NUEVA SECCIÓN: Filtros Avanzados por Columna */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FaSearch className="text-blue-500" />
          🔍 Filtros Avanzados por Columna
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

          {/* Filtro Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtrosAvanzados.estado}
              onChange={(e) =>
                manejarCambioFiltroAvanzado("estado", e.target.value)
              }
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>
      </div>



      {/* 🔍 BARRA DE FILTROS ACTIVOS */}
      {hayFiltrosActivosTotal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
              <FaSearch className="w-3 h-3" />
              Filtros activos:
            </span>

            {/* Filtros básicos del hook */}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Búsqueda: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}

            {filtroEstado !== "todos" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Estado: {filtroEstado}
                <button
                  onClick={() => setFiltroEstado("todos")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}

            {/* Filtros de ubicación */}
            {filtrosFecha.faenaSeleccionada !== "todas" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Ubicación: {ubicacionesDisponibles.find(u => u.value === filtrosFecha.faenaSeleccionada)?.representativo || filtrosFecha.faenaSeleccionada}
                <button
                  onClick={() => setFiltrosFecha(prev => ({ ...prev, faenaSeleccionada: "todas" }))}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}

            {/* Filtros de fecha personalizados */}
            {filtrosFechaPersonalizados.fechaDesde && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Desde: {filtrosFechaPersonalizados.fechaDesde} {filtrosFechaPersonalizados.horaDesde}:00
                <button
                  onClick={() => {
                    manejarCambioFiltroFechaPersonalizado("fechaDesde", "");
                    manejarCambioFiltroFechaPersonalizado("horaDesde", "00");
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}

            {filtrosFechaPersonalizados.fechaHasta && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Hasta: {filtrosFechaPersonalizados.fechaHasta} {filtrosFechaPersonalizados.horaHasta}:59
                <button
                  onClick={() => {
                    manejarCambioFiltroFechaPersonalizado("fechaHasta", "");
                    manejarCambioFiltroFechaPersonalizado("horaHasta", "23");
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}

            {/* Filtros avanzados simples */}
            {Object.entries(filtrosAvanzados).map(([key, value]) =>
              value && (
                <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                  {key === 'numero_boleta' ? 'Boleta' :
                    key === 'usuario' ? 'Usuario' :
                      key === 'maquina' ? 'Máquina' :
                        key === 'patente' ? 'Patente' :
                          key === 'ubicacion' ? 'Ubicación' :
                            key === 'estado' ? 'Estado' : key}: {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                  <button
                    onClick={() => manejarCambioFiltroAvanzado(key, "")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )
            )}

            {/* Botón limpiar todos */}
            <button
              onClick={limpiarTodosLosFiltros}
              className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}

      {/* Estado de carga y errores */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mr-3"></div>
            Cargando consumos...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error al cargar los datos</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={refrescarDatos}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA DE DATOS */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          {/* 📊 Información de tabla y filtros */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-700">
                  Mostrando <strong>{datosFiltrados.length}</strong> de <strong>{cargas.length}</strong> registros
                  {hayFiltrosActivosTotal && (
                    <span className="text-blue-600 ml-2">
                      ({Object.values(filtrosAvanzados).filter(v => v).length +
                        (filtrosFecha.fechaDesde || filtrosFecha.fechaHasta || filtrosFecha.faenaSeleccionada !== "todas" ? 1 : 0) +
                        (filtrosFechaPersonalizados.fechaDesde || filtrosFechaPersonalizados.fechaHasta ? 1 : 0) +
                        (searchTerm ? 1 : 0) +
                        (filtroEstado !== "todos" ? 1 : 0)} filtros activos)
                    </span>
                  )}
                </span>
              </div>

              {/* Información de ordenamiento */}
              {ordenColumna && (
                <span className="text-sm text-gray-600">
                  Ordenando por: <strong>
                    {ordenColumna === "created_at" ? "Fecha" :
                      ordenColumna === "numero_boleta" ? "N° Boleta" :
                        ordenColumna === "usuario" ? "Usuario" :
                          ordenColumna === "maquina" ? "Máquina" :
                            ordenColumna === "litros" ? "Litros" :
                              ordenColumna === "costo" ? "Costo" :
                                ordenColumna === "estado" ? "Estado" :
                                  ordenColumna}
                  </strong> {direccionOrden === "desc" ? "↓" : "↑"}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* FECHA */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Fecha"
                      columna="created_at"
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  {/* N° BOLETA - CON FILTRO AVANZADO */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="N° Boleta"
                      columna="numero_boleta"
                      tipo="select"
                      esMultiple={true}
                      opciones={opcionesFiltros.numeroBoletas}
                      valorFiltro={filtrosAvanzados.numero_boleta}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                      mostrarBusqueda={true}
                      placeholder="Buscar boleta..."
                      anchoMinimo="200px"
                    />
                  </th>

                  {/* USUARIO - CON FILTRO AVANZADO */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Usuario"
                      columna="usuario"
                      tipo="select"
                      esMultiple={true}
                      opciones={opcionesFiltros.usuarios}
                      valorFiltro={filtrosAvanzados.usuario}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                      mostrarBusqueda={true}
                      placeholder="Buscar usuario..."
                      anchoMinimo="250px"
                    />
                  </th>

                  {/* MÁQUINA - CON FILTRO AVANZADO */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Máquina / Ubicación"
                      columna="maquina"
                      tipo="select"
                      esMultiple={true}
                      opciones={opcionesFiltros.maquinas}
                      valorFiltro={filtrosAvanzados.maquina}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                      mostrarBusqueda={true}
                      placeholder="Buscar máquina..."
                      anchoMinimo="280px"
                    />
                  </th>

                  {/* LITROS - SOLO ORDENAMIENTO */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Litros"
                      columna="litros"
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  {/* COSTO - SOLO ORDENAMIENTO */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Costo"
                      columna="costo"
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  {/* ESTADO - CON FILTRO AVANZADO */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <UniversalTableFilter
                      titulo="Estado"
                      columna="estado"
                      tipo="select"
                      opciones={opcionesFiltros.estados}
                      valorFiltro={filtrosAvanzados.estado}
                      onFiltroChange={manejarCambioFiltroAvanzado}
                      onOrdenamientoChange={manejarOrdenamientoWrapper}
                      ordenColumna={ordenColumna}
                      direccionOrden={direccionOrden}
                    />
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datosFiltrados.map(carga => {
                  const configEstado = estadosConfig[carga.estado] || estadosConfig.pendiente;
                  const IconoEstado = configEstado.icono;

                  // 🎨 Obtener colores de faena
                  const coloresFaena = getFaenaColorsById(carga.id_faena);
                  const esCargaExterna = carga.id_faena === 5;

                  return (
                    <tr
                      key={carga.id}
                      className={`hover:bg-gray-50 transition-colors ${esCargaExterna ? coloresFaena.copecBg : coloresFaena.bg} ${esCargaExterna ? coloresFaena.copecBorder : coloresFaena.border} border-l-4`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(carga.created_at).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {carga.numero_boleta}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {`${carga.user?.nombre || ''} ${carga.user?.apellido || ''}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{carga.maquina?.nombre_maquina}</div>
                          <div className="text-xs text-gray-500">{carga.maquina?.patente}</div>
                          {/* Mostrar ubicación real con estilo de faena */}
                          <div className={`text-xs font-medium flex items-center gap-1 ${esCargaExterna ? coloresFaena.copecBlue : coloresFaena.icon}`}>
                            <span>{coloresFaena.emoji}</span>
                            {carga.ubicacion || "Sin ubicación"}
                          </div>
                          {/* Mostrar nombre de faena con estilo */}
                          <div className="text-xs text-gray-400">
                            📍 {carga.faena?.ubicacion || coloresFaena.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${esCargaExterna ? coloresFaena.copecBadge : coloresFaena.badge}`}>
                          {Number(carga.litros).toLocaleString()}
                        </span>
                        <span className="text-gray-500 ml-1">L</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className={`font-semibold ${esCargaExterna ? coloresFaena.copecBlue : coloresFaena.icon}`}>
                          ${Number(carga.costo).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${configEstado.color}`}>
                          <IconoEstado className={`w-3 h-3 mr-1 ${configEstado.iconColor}`} />
                          {configEstado.texto}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleVerDetalle(carga.id)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          title="Ver historial y detalles completos"
                        >
                          <FaEye className="w-3 h-3 mr-1" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📱 Información de paginación mejorada */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <div className="flex items-center space-x-4">
                  <span>
                    <strong>{Math.min(datosFiltrados.length, infoPaginacion.fin)}</strong> de <strong>{datosFiltrados.length}</strong> registros filtrados
                  </span>
                  {datosFiltrados.length !== infoPaginacion.totalRegistros && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600">
                        <strong>{infoPaginacion.totalRegistros}</strong> registros totales
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    <strong>{datosFiltrados.filter((c) => c.estado === "pendiente").length}</strong> pendientes
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{datosFiltrados.filter((c) => c.estado === "aprobado").length}</strong> aprobados
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => irAPagina(paginaActual - 1)}
                  disabled={!infoPaginacion.hayAnterior}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm">
                  Página <strong>{paginaActual}</strong> de <strong>{infoPaginacion.totalPaginas}</strong>
                </span>
                <button
                  onClick={() => irAPagina(paginaActual + 1)}
                  disabled={!infoPaginacion.haySiguiente}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {!loading && !error && datosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
            <p className="text-sm text-gray-500">
              {hayFiltrosActivosTotal
                ? "Prueba ajustando los filtros o limpiándolos para ver más resultados"
                : "No hay consumos registrados en el sistema"
              }
            </p>
            {hayFiltrosActivosTotal && (
              <button
                onClick={limpiarTodosLosFiltros}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
      {/* Modal de detalle de carga */}
      <DetalleCargaModal
        cargaId={selectedCargaId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
};

export default ConsumosViewOptimized; 