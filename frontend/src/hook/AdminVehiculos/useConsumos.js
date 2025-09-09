import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../../lib/axios";

/**
 * 🚀 Hook personalizado para gestión de consumos/cargas externas
 * ✅ ACTUALIZADO: Ahora usa server-side pagination con la nueva API
 * ✅ MANTIENE: La misma interfaz para compatibilidad con el componente
 */
const useConsumos = (opciones = {}) => {
  const {
    autoFetch = true,
    endpoint = "/api/adminOperador/cargas/paginadas", // ✅ NUEVA API
    paginacionInicial = 25, // ✅ Reducido porque es server-side
    ordenamientoInicial = { columna: "created_at", direccion: "desc" },
  } = opciones;

  // 📊 Estados principales
  const [cargas, setCargas] = useState([]);
  const [cargasCompletas, setCargasCompletas] = useState([]); // Para compatibilidad
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estadisticas, setEstadisticas] = useState({});

  // 🔍 Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFaena, setFiltroFaena] = useState("todas");
  const [filtroTipoCombustible, setFiltroTipoCombustible] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");

  // ✅ AGREGAR ESTOS ESTADOS FALTANTES (después de línea ~31)
  const [filtroOperador, setFiltroOperador] = useState("");
  const [filtroMaquina, setFiltroMaquina] = useState("");
  const [filtroPatente, setFiltroPatente] = useState("");
  const [filtroNumeroBoleta, setFiltroNumeroBoleta] = useState("");

  // 📊 Estados de ordenamiento
  const [ordenColumna, setOrdenColumna] = useState(ordenamientoInicial.columna);
  const [direccionOrden, setDireccionOrden] = useState(ordenamientoInicial.direccion);

  // 📱 Estados de paginación (SERVER-SIDE)
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(paginacionInicial);
  const [infoPaginacion, setInfoPaginacion] = useState({
    totalRegistros: 0,
    totalPaginas: 0,
    desde: 0,
    hasta: 0,
    hayMasPaginas: false
  });

  // 🆕 Estados adicionales de la nueva API
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    faenas: [],
    categorias: [],
    tipos_combustible: [],
    estados: []
  });
  const [metadatos, setMetadatos] = useState({
    total_sin_filtros: 0,
    total_con_filtros: 0,
    filtros_activos: 0
  });

  // 🚀 Función principal para cargar datos (NUEVA - Server-Side)
  const fetchCargas = useCallback(async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) setLoading(true);
      setError("");

      // ✅ CONSTRUIR PARÁMETROS PARA LA NUEVA API
      const params = new URLSearchParams();

      // Paginación
      params.append('page', paginaActual.toString());
      params.append('per_page', registrosPorPagina.toString());

      // Filtros específicos adicionales
      if (filtroOperador.trim()) {
        params.append('operador', filtroOperador.trim());
      }

      if (filtroMaquina.trim()) {
        params.append('maquina', filtroMaquina.trim());
      }

      if (filtroPatente.trim()) {
        params.append('patente', filtroPatente.trim());
      }

      if (filtroNumeroBoleta.trim()) {
        params.append('numero_boleta', filtroNumeroBoleta.trim());
      }

      // Búsqueda global
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // Filtros específicos
      if (filtroEstado && filtroEstado !== "todos") {
        // Convertir formato del componente al formato de la API
        const estadoAPI = filtroEstado === "Por Rendir" ? "Por Rendir" :
          filtroEstado === "Rendido" ? "Rendido" : null;
        if (estadoAPI) params.append('estado', estadoAPI);
      }

      if (filtroFaena && filtroFaena !== "todas") {
        // Si filtroFaena es un número (ID de faena)
        const faenaId = parseInt(filtroFaena);
        if (!isNaN(faenaId)) {
          params.append('faena', faenaId.toString());
        }
      }

      if (filtroTipoCombustible.trim()) {
        params.append('tipo_combustible', filtroTipoCombustible.trim());
      }

      // Filtros de fecha
      if (filtroFechaInicio) {
        params.append('fecha_inicio', filtroFechaInicio);
      }
      if (filtroFechaFin) {
        params.append('fecha_fin', filtroFechaFin);
      }

      // Ordenamiento
      params.append('sort', ordenColumna);
      params.append('direction', direccionOrden);

      console.log('🔄 Cargando cargas con parámetros:', Object.fromEntries(params));

      // ✅ LLAMADA A LA NUEVA API
      const response = await axios.get(`${endpoint}?${params.toString()}`);

      if (response.data.success) {
        const { data, pagination, filters, meta } = response.data;

        // 🔍 AGREGAR ESTOS LOGS TEMPORALES:
        console.log('🔍 DEBUG - Respuesta completa del backend:', response.data);
        console.log('🔍 DEBUG - Primer registro raw:', data[0]);
        console.log('🔍 DEBUG - Usuario en primer registro:', data[0]?.operador);

        // Actualizar datos
        setCargas(data);
        setCargasCompletas(data); // Para compatibilidad con componente

        // Actualizar información de paginación
        setInfoPaginacion({
          totalRegistros: pagination.total,
          totalPaginas: pagination.last_page,
          desde: pagination.from,
          hasta: pagination.to,
          hayMasPaginas: pagination.has_more_pages,
          paginaActual: pagination.current_page,
          registrosPorPagina: pagination.per_page
        });

        // Actualizar opciones de filtros (solo si vienen)
        if (filters.available) {
          setOpcionesFiltros(filters.available);
        }

        // Actualizar metadatos
        setMetadatos({
          total_sin_filtros: meta.total_sin_filtros,
          total_con_filtros: meta.total_con_filtros,
          filtros_activos: meta.filtros_activos,
          tiempo_consulta: meta.tiempo_consulta
        });

        // Actualizar estadísticas (formato compatible)
        setEstadisticas({
          total: meta.total_con_filtros,
          porRendir: meta.estadisticas?.por_estado?.por_rendir || 0,
          rendidos: meta.estadisticas?.por_estado?.rendido || 0,
          totalLitros: meta.estadisticas?.totales?.litros || 0,
          totalCosto: meta.estadisticas?.totales?.costo || 0
        });

        console.log('✅ Datos cargados exitosamente:', {
          registros: data.length,
          total: pagination.total,
          pagina: pagination.current_page
        });

      } else {
        throw new Error(response.data.message || 'Error al cargar datos');
      }

    } catch (err) {
      console.error('❌ Error al cargar cargas:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar datos');
      setCargas([]);
      setCargasCompletas([]);
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    paginaActual,
    registrosPorPagina,
    searchTerm,
    filtroEstado,
    filtroFaena,
    filtroTipoCombustible,
    filtroFechaInicio,
    filtroFechaFin,
    // ✅ AGREGAR LOS NUEVOS FILTROS:
    filtroOperador,
    filtroMaquina,
    filtroPatente,
    filtroNumeroBoleta,
    ordenColumna,
    direccionOrden
  ]);

  // ✅ ACTUALIZAR DEPENDENCIAS DEL useEffect (línea ~200 aprox)
  useEffect(() => {
    if (autoFetch) {
      if (paginaActual !== 1) {
        setPaginaActual(1);
      } else {
        fetchCargas();
      }
    }
  }, [
    searchTerm,
    filtroEstado,
    filtroFaena,
    filtroTipoCombustible,
    filtroFechaInicio,
    filtroFechaFin,
    // ✅ AGREGAR LOS NUEVOS FILTROS:
    filtroOperador,
    filtroMaquina,
    filtroPatente,
    filtroNumeroBoleta,
    ordenColumna,
    direccionOrden,
    registrosPorPagina
  ]);

  // 🔄 Efecto separado para cambios de página
  useEffect(() => {
    if (autoFetch) {
      fetchCargas();
    }
  }, [paginaActual]);

  // 📊 Manejar cambio de ordenamiento
  const manejarCambioOrdenamiento = useCallback((columna, direccion = null) => {
    console.log('🔄 Cambio de ordenamiento:', { columna, direccion });

    if (direccion) {
      // Dirección específica proporcionada
      setOrdenColumna(columna);
      setDireccionOrden(direccion);
    } else {
      // Alternar dirección automáticamente
      if (ordenColumna === columna) {
        setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc");
      } else {
        setOrdenColumna(columna);
        setDireccionOrden("desc"); // Por defecto desc para nueva columna
      }
    }
  }, [ordenColumna, direccionOrden]);

  // 📱 Funciones de paginación
  const irAPagina = useCallback((numeroPagina) => {
    if (numeroPagina >= 1 && numeroPagina <= infoPaginacion.totalPaginas) {
      setPaginaActual(numeroPagina);
    }
  }, [infoPaginacion.totalPaginas]);

  const cambiarRegistrosPorPagina = useCallback((cantidad) => {
    setRegistrosPorPagina(cantidad);
    setPaginaActual(1); // Reset a primera página
  }, []);

  // 🧹 Limpiar filtros
  const limpiarFiltros = useCallback(() => {
    console.log('🧹 Limpiando filtros...');
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroFaena("todas");
    setFiltroTipoCombustible("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
    // ✅ AGREGAR LOS NUEVOS FILTROS:
    setFiltroOperador("");
    setFiltroMaquina("");
    setFiltroPatente("");
    setFiltroNumeroBoleta("");
    setOrdenColumna(ordenamientoInicial.columna);
    setDireccionOrden(ordenamientoInicial.direccion);
    setPaginaActual(1);
  }, [ordenamientoInicial]);

  // 🔄 Refrescar datos
  const refrescarDatos = useCallback(() => {
    console.log('🔄 Refrescando datos...');
    fetchCargas(true);
  }, [fetchCargas]);

  // 🔧 Actualizar carga específica (para rendición, etc.)
  const actualizarCarga = useCallback((cargaId, nuevosValores) => {
    setCargas(prev => prev.map(carga =>
      carga.id === cargaId
        ? { ...carga, ...nuevosValores }
        : carga
    ));
    setCargasCompletas(prev => prev.map(carga =>
      carga.id === cargaId
        ? { ...carga, ...nuevosValores }
        : carga
    ));
  }, []);

  // 📤 Exportar datos (placeholder - puedes implementar)
  const exportarDatos = useCallback(async (formato = 'csv') => {
    try {
      console.log('📤 Exportando datos en formato:', formato);
      // Implementar llamada a endpoint de exportación
      // const response = await axios.post(`${endpoint.replace('paginadas', 'exportar')}`, {
      //   filtros: { searchTerm, filtroEstado, filtroFaena, etc. },
      //   formato
      // });
      return { success: true, message: 'Exportación completada' };
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      return { success: false, message: 'Error en la exportación' };
    }
  }, [searchTerm, filtroEstado, filtroFaena]);

  // 🔍 Computed values para compatibilidad
  const hayFiltrosActivos = useMemo(() => {
    return metadatos.filtros_activos > 0 ||
      searchTerm.trim() !== "" ||
      filtroEstado !== "todos" ||
      filtroFaena !== "todas" ||
      filtroTipoCombustible.trim() !== "" ||
      filtroFechaInicio !== "" ||
      filtroFechaFin !== "" ||
      // ✅ AGREGAR LOS NUEVOS FILTROS:
      filtroOperador.trim() !== "" ||
      filtroMaquina.trim() !== "" ||
      filtroPatente.trim() !== "" ||
      filtroNumeroBoleta.trim() !== "";
  }, [metadatos.filtros_activos, searchTerm, filtroEstado, filtroFaena, filtroTipoCombustible, filtroFechaInicio, filtroFechaFin, filtroOperador, filtroMaquina, filtroPatente, filtroNumeroBoleta]);

  const totalFiltrado = useMemo(() => {
    return metadatos.total_con_filtros;
  }, [metadatos.total_con_filtros]);

  // 📤 Return de la interfaz del hook (manteniendo compatibilidad)
  return {
    // 📊 Datos
    cargas,
    cargasCompletas,
    estadisticas,
    opcionesFiltros,
    metadatos,

    // 🔄 Estados
    loading,
    error,

    // 🔍 Filtros y búsqueda
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado,
    filtroFaena,
    setFiltroFaena,
    filtroTipoCombustible,
    setFiltroTipoCombustible,
    filtroFechaInicio,
    setFiltroFechaInicio,
    filtroFechaFin,
    setFiltroFechaFin,
    // ✅ AGREGAR LOS NUEVOS FILTROS:
    filtroOperador,
    setFiltroOperador,
    filtroMaquina,
    setFiltroMaquina,
    filtroPatente,
    setFiltroPatente,
    filtroNumeroBoleta,
    setFiltroNumeroBoleta,

    // 📊 Ordenamiento
    ordenColumna,
    direccionOrden,
    manejarCambioOrdenamiento,

    // 📱 Paginación
    paginaActual,
    registrosPorPagina,
    infoPaginacion,
    irAPagina,
    cambiarRegistrosPorPagina,

    // 🔧 Acciones
    refrescarDatos,
    limpiarFiltros,
    actualizarCarga,
    exportarDatos,

    // 🔍 Computed
    hayFiltrosActivos,
    totalFiltrado,

    // 🆕 Nuevas funciones para server-side
    fetchCargas
  };
};

export default useConsumos;