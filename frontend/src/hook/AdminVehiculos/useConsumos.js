import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../../lib/axios";

/**
 * 🚀 Hook personalizado para gestión de consumos/cargas externas
 * Maneja toda la lógica de estado, filtrado, ordenamiento y API calls
 */
const useConsumos = (opciones = {}) => {
  const {
    autoFetch = true,
    endpoint = "/api/adminOperador/cargas",
    paginacionInicial = 50,
    ordenamientoInicial = { columna: "created_at", direccion: "desc" },
  } = opciones;

  // 📊 Estados principales
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estadisticas, setEstadisticas] = useState({});

  // 🔍 Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFaena, setFiltroFaena] = useState("todas");
  const [filtroFecha, setFiltroFecha] = useState("todas");

  // 📊 Estados de ordenamiento
  const [ordenColumna, setOrdenColumna] = useState(ordenamientoInicial.columna);
  const [direccionOrden, setDireccionOrden] = useState(ordenamientoInicial.direccion);

  // 📱 Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(paginacionInicial);

  // 🚀 Función principal para cargar datos
  const fetchCargas = useCallback(async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) setLoading(true);
      setError("");

      console.log("📊 Cargando cargas desde:", endpoint);
      const response = await axios.get(endpoint);

      if (response.data.status === "success") {
        const cargasData = response.data.data || [];
        setCargas(cargasData);
        setEstadisticas(response.data.estadisticas || {});
        
        console.log("✅ Cargas cargadas exitosamente:", {
          total: cargasData.length,
          endpoint,
          estadisticas: response.data.estadisticas
        });
      } else {
        throw new Error(response.data.message || "Error al cargar datos");
      }
    } catch (error) {
      console.error("❌ Error al cargar cargas:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error al cargar datos";
      setError(errorMessage);
      
      // 🔄 Fallback con datos de ejemplo en caso de error (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.warn("🔄 Cargando datos de ejemplo como fallback");
        setCargas([
          {
            id: 1,
            numero_boleta: "BOL-001",
            user: { nombre: "Juan", apellido: "Pérez", rut: "12345678-9" },
            maquina: { nombre_maquina: "Excavadora CAT", patente: "AA-BB-12" },
            litros: 150.5,
            costo: 225750,
            precio_por_litro: 1500,
            estado: "pendiente",
            id_faena: 6,
            created_at: new Date().toISOString(),
            observaciones: "Carga de ejemplo"
          }
        ]);
      }
    } finally {
      if (mostrarLoading) setLoading(false);
    }
  }, [endpoint]);

  // 🔄 Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchCargas();
    }
  }, [autoFetch, fetchCargas]);

  // 🎛️ Función para obtener fecha límite según filtro
  const obtenerFechaLimite = useCallback((tipoFiltro) => {
    const hoy = new Date();
    switch (tipoFiltro) {
      case "hoy":
        return new Date(hoy.setHours(0, 0, 0, 0));
      case "semana":
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return hace7Dias;
      case "mes":
        const haceUnMes = new Date();
        haceUnMes.setMonth(haceUnMes.getMonth() - 1);
        return haceUnMes;
      case "trimestre":
        const haceTresMeses = new Date();
        haceTresMeses.setMonth(haceTresMeses.getMonth() - 3);
        return haceTresMeses;
      case "anio":
        const haceUnAnio = new Date();
        haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);
        return haceUnAnio;
      default:
        return null;
    }
  }, []);

// ✅ OPCIÓN 3: Función súper explícita y debuggeable
const manejarCambioOrdenamiento = useCallback((columna, direccionEspecifica = null) => {
  console.log('🔧 Click en ordenamiento:', { 
    columna, 
    direccionEspecifica, 
    columnaActual: ordenColumna, 
    direccionActual: direccionOrden 
  });
  
  if (ordenColumna === columna) {
    // 🔄 MISMA COLUMNA: Alternar SIEMPRE (ignorar direccionEspecifica)
    const nuevaDireccion = direccionOrden === "asc" ? "desc" : "asc";
    console.log('🔄 Alternando dirección:', direccionOrden, '→', nuevaDireccion);
    setDireccionOrden(nuevaDireccion);
  } else {
    // 🆕 NUEVA COLUMNA: Empezar con una dirección por defecto
    console.log('🆕 Nueva columna, empezando con DESC');
    setOrdenColumna(columna);
    setDireccionOrden("desc"); // Siempre empezar con descendente
  }
  
  setPaginaActual(1);
}, [ordenColumna, direccionOrden]);


  // 🔍 Datos procesados con filtros y ordenamiento
  const cargasProcesadas = useMemo(() => {
    let resultado = [...cargas];

    // 🔍 Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const termino = searchTerm.toLowerCase().trim();
      resultado = resultado.filter((carga) => {
        const textosBusqueda = [
          carga.numero_boleta,
          `${carga.user?.nombre} ${carga.user?.apellido}`,
          carga.user?.rut,
          carga.maquina?.nombre_maquina,
          carga.maquina?.patente,
          carga.ubicacion,
          carga.observaciones
        ].filter(Boolean).join(" ").toLowerCase();
        
        return textosBusqueda.includes(termino);
      });
    }

    // 🎛️ Aplicar filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((carga) => carga.estado === filtroEstado);
    }

    // 🏢 Aplicar filtro por faena
    if (filtroFaena !== "todas") {
      resultado = resultado.filter(
        (carga) => carga.id_faena === parseInt(filtroFaena)
      );
    }

    // 📅 Aplicar filtro por fecha
    if (filtroFecha !== "todas") {
      const fechaLimite = obtenerFechaLimite(filtroFecha);
      if (fechaLimite) {
        resultado = resultado.filter(
          (carga) => new Date(carga.created_at) >= fechaLimite
        );
      }
    }

    // 📊 Aplicar ordenamiento
    resultado.sort((a, b) => {
      let valorA, valorB;

      // Manejar diferentes tipos de columnas
      switch (ordenColumna) {
        case "usuario":
          valorA = `${a.user?.nombre} ${a.user?.apellido}`.toLowerCase();
          valorB = `${b.user?.nombre} ${b.user?.apellido}`.toLowerCase();
          break;
        case "maquina":
          valorA = a.maquina?.nombre_maquina?.toLowerCase() || "";
          valorB = b.maquina?.nombre_maquina?.toLowerCase() || "";
          break;
        case "fecha":
        case "created_at":
          valorA = new Date(a.created_at);
          valorB = new Date(b.created_at);
          break;
        case "litros":
        case "costo":
        case "precio_por_litro":
          valorA = Number(a[ordenColumna]) || 0;
          valorB = Number(b[ordenColumna]) || 0;
          break;
        default:
          valorA = a[ordenColumna];
          valorB = b[ordenColumna];
          break;
      }

      // Convertir strings a números si es posible
      if (typeof valorA === "string" && !isNaN(Number(valorA))) {
        valorA = Number(valorA);
        valorB = Number(valorB);
      }

      // Manejar valores null/undefined
      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return direccionOrden === "asc" ? -1 : 1;
      if (valorB == null) return direccionOrden === "asc" ? 1 : -1;

      // Comparación final
      if (valorA < valorB) return direccionOrden === "asc" ? -1 : 1;
      if (valorA > valorB) return direccionOrden === "asc" ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [
    cargas,
    searchTerm,
    filtroEstado,
    filtroFaena,
    filtroFecha,
    ordenColumna,
    direccionOrden,
    obtenerFechaLimite
  ]);

  // 📊 Estadísticas calculadas de datos filtrados
  const estadisticasCalculadas = useMemo(() => {
    const datos = cargasProcesadas;
    
    return {
      total: datos.length,
      totalOriginal: cargas.length,
      pendientes: datos.filter((c) => c.estado === "pendiente").length,
      aprobadas: datos.filter((c) => c.estado === "aprobado").length,
      rechazadas: datos.filter((c) => c.estado === "rechazado").length,
      totalLitros: datos.reduce((sum, c) => sum + (Number(c.litros) || 0), 0),
      totalCosto: datos.reduce((sum, c) => sum + (Number(c.costo) || 0), 0),
      promedioLitrosPorCarga: datos.length > 0 
        ? datos.reduce((sum, c) => sum + (Number(c.litros) || 0), 0) / datos.length 
        : 0,
      promedioCostoPorLitro: datos.length > 0 && datos.reduce((sum, c) => sum + (Number(c.litros) || 0), 0) > 0
        ? datos.reduce((sum, c) => sum + (Number(c.costo) || 0), 0) / datos.reduce((sum, c) => sum + (Number(c.litros) || 0), 0)
        : 0,
    };
  }, [cargasProcesadas, cargas.length]);

  // 📱 Datos paginados
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return cargasProcesadas.slice(inicio, fin);
  }, [cargasProcesadas, paginaActual, registrosPorPagina]);

  // 📊 Información de paginación
  const infoPaginacion = useMemo(() => {
    const totalRegistros = cargasProcesadas.length;
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    
    return {
      totalRegistros,
      totalPaginas,
      paginaActual,
      registrosPorPagina,
      inicio: (paginaActual - 1) * registrosPorPagina + 1,
      fin: Math.min(paginaActual * registrosPorPagina, totalRegistros),
      hayAnterior: paginaActual > 1,
      haySiguiente: paginaActual < totalPaginas,
    };
  }, [cargasProcesadas.length, registrosPorPagina, paginaActual]);

  // 🧹 Función para limpiar todos los filtros
  const limpiarFiltros = useCallback(() => {
    setSearchTerm("");
    setFiltroEstado("todos");
    setFiltroFaena("todas");
    setFiltroFecha("todas");
    setPaginaActual(1);
  }, []);

  // 🔄 Función para refrescar datos
  const refrescarDatos = useCallback(() => {
    fetchCargas(false); // Sin mostrar loading completo
  }, [fetchCargas]);

  // 📊 Función para actualizar una carga específica en la lista
  const actualizarCarga = useCallback((cargaActualizada) => {
    setCargas(prevCargas =>
      prevCargas.map(carga =>
        carga.id === cargaActualizada.id ? { ...carga, ...cargaActualizada } : carga
      )
    );
  }, []);

  // 📤 Función para exportar datos (retorna los datos procesados)
  const exportarDatos = useCallback((formato = "json") => {
    const datosExportacion = cargasProcesadas.map(carga => ({
      fecha: new Date(carga.created_at).toLocaleDateString("es-CL"),
      numero_boleta: carga.numero_boleta,
      usuario: `${carga.user?.nombre} ${carga.user?.apellido}`,
      rut: carga.user?.rut,
      maquina: carga.maquina?.nombre_maquina,
      patente: carga.maquina?.patente,
      litros: carga.litros,
      costo: carga.costo,
      precio_por_litro: carga.precio_por_litro,
      estado: carga.estado,
      observaciones: carga.observaciones,
    }));

    console.log(`📤 Exportando ${datosExportacion.length} registros en formato ${formato}`);
    return datosExportacion;
  }, [cargasProcesadas]);

  // 🎯 Función para ir a una página específica
  const irAPagina = useCallback((numeroPagina) => {
    const paginaValida = Math.max(1, Math.min(numeroPagina, infoPaginacion.totalPaginas));
    setPaginaActual(paginaValida);
  }, [infoPaginacion.totalPaginas]);

  // 📊 Retorno del hook con todas las funcionalidades
  return {
    // Datos
    cargas: datosPaginados,
    cargasCompletas: cargasProcesadas,
    cargasOriginales: cargas,
    estadisticas: estadisticasCalculadas,
    estadisticasOriginales: estadisticas,

    // Estados de carga
    loading,
    error,

    // Filtros y búsqueda
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado,
    filtroFaena,
    setFiltroFaena,
    filtroFecha,
    setFiltroFecha,

    // Ordenamiento
    ordenColumna,
    direccionOrden,
    manejarCambioOrdenamiento,

    // Paginación
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    infoPaginacion,
    irAPagina,

    // Funciones utilitarias
    fetchCargas,
    refrescarDatos,
    limpiarFiltros,
    actualizarCarga,
    exportarDatos,

    // Estados calculados
    hayFiltrosActivos: searchTerm || filtroEstado !== "todos" || filtroFaena !== "todas" || filtroFecha !== "todas",
    totalFiltrado: cargasProcesadas.length,
    totalOriginal: cargas.length,
  };
};

export default useConsumos;