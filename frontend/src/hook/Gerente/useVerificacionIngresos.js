// src/hooks/useVerificacionIngresos.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../lib/axios';

const useVerificacionIngresos = () => {
  // Estados para datos
  const [ingresos, setIngresos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [faenas, setFaenas] = useState([]);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    faenaSeleccionada: 'todas',
    numeroGuia: ''
  });
  
  // Estados para paginación
  const [paginacion, setPaginacion] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    from: 0,
    to: 0
  });
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState(null);

  // Cargar faenas disponibles al montar el componente
  useEffect(() => {
    cargarFaenas();
  }, []);

  // Cargar ingresos cuando cambien filtros o página
  useEffect(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      cargarIngresos();
    }
  }, [filtros, paginacion.currentPage]);

  // Cargar resumen cuando cambien los filtros (no la página)
  useEffect(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      cargarResumen();
    }
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.faenaSeleccionada]);

  /**
   * Cargar faenas disponibles
   */
  const cargarFaenas = useCallback(async () => {
    try {
      const response = await axios.get('/api/faenas');
      const faenasData = response.data.data || response.data;

      if (Array.isArray(faenasData)) {
        const faenasFormateadas = faenasData.map(faena => ({
          value: faena.id_faena.toString(),
          label: faena.ubicacion || faena.nombre || `Faena ${faena.id_faena}`
        }));
        setFaenas(faenasFormateadas);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setFaenas([]);
      }
    } catch (error) {
      console.error('Error al cargar faenas:', error);
      setFaenas([]);
      setError('Error al cargar las faenas disponibles');
    }
  }, []);

  /**
   * Cargar ingresos con paginación
   */
  const cargarIngresos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: paginacion.currentPage,
        per_page: paginacion.perPage,
        fecha_desde: filtros.fechaDesde,
        fecha_hasta: filtros.fechaHasta,
        id_faena: filtros.faenaSeleccionada,
        ...(filtros.numeroGuia && { numero_guia: filtros.numeroGuia })
      };

      console.log('🔍 Cargando ingresos con parámetros:', params);

      const response = await axios.get('/api/verificacion-ingresos', { params });
      
      if (response.data.success) {
        const ingresosData = response.data.data || [];
        const paginacionData = response.data.pagination || {};
        
        setIngresos(Array.isArray(ingresosData) ? ingresosData : []);
        setPaginacion(prev => ({
          ...prev,
          total: paginacionData.total || 0,
          totalPages: paginacionData.total_pages || 0,
          hasNextPage: paginacionData.has_next_page || false,
          hasPrevPage: paginacionData.has_prev_page || false,
          from: paginacionData.from || 0,
          to: paginacionData.to || 0
        }));

        console.log('✅ Ingresos cargados:', ingresosData.length, 'Paginación:', paginacionData);
      } else {
        throw new Error(response.data.message || 'Error al cargar ingresos');
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      setIngresos([]);
      setError(
        error.response?.status === 404 
          ? 'La ruta de verificación de ingresos no existe aún'
          : 'Error al cargar los ingresos. Por favor intente de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacion.currentPage, paginacion.perPage]);

  /**
   * Cargar resumen
   */
  const cargarResumen = useCallback(async () => {
    setLoadingResumen(true);
    
    try {
      const params = {
        fecha_desde: filtros.fechaDesde,
        fecha_hasta: filtros.fechaHasta,
        id_faena: filtros.faenaSeleccionada
      };

      const response = await axios.get('/api/verificacion-ingresos/resumen', { params });
      setResumen(response.data.data || response.data || null);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      setResumen(null);
    } finally {
      setLoadingResumen(false);
    }
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.faenaSeleccionada]);

  /**
   * Cambiar página
   */
  const cambiarPagina = useCallback((nuevaPagina) => {
    setPaginacion(prev => ({
      ...prev,
      currentPage: nuevaPagina
    }));
  }, []);

  /**
   * Cambiar filtros
   */
  const cambiarFiltros = useCallback((nuevosFiltros) => {
    setFiltros(prev => ({
      ...prev,
      ...nuevosFiltros
    }));
    
    // Resetear a la primera página cuando cambien los filtros
    setPaginacion(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, []);

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = useCallback(() => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      faenaSeleccionada: 'todas',
      numeroGuia: ''
    });
    setPaginacion(prev => ({
      ...prev,
      currentPage: 1
    }));
    setIngresos([]);
    setResumen(null);
  }, []);

  /**
   * Recargar datos
   */
  const recargarDatos = useCallback(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      cargarIngresos();
      cargarResumen();
    }
  }, [cargarIngresos, cargarResumen, filtros]);

  // Funciones auxiliares memoizadas
  const utilidades = useMemo(() => ({
    getErrorClass: (error) => {
      if (Math.abs(error) < 0.01) return 'text-green-600';
      if (Math.abs(error) <= 10) return 'text-yellow-600';
      return 'text-red-600';
    },
    
    getErrorIcon: (error) => {
      return Math.abs(error) < 0.01 ? 'FiCheckCircle' : 'FiAlertCircle';
    },
    
    formatNumber: (num) => {
      return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    },

    formatFaenaName: (faenaData) => {
      if (typeof faenaData === 'object' && faenaData !== null) {
        return faenaData.nombre || faenaData.ubicacion || `Faena ${faenaData.id}`;
      }
      return faenaData || 'Sin faena';
    }
  }), []);

  // Estadísticas derivadas
  const estadisticas = useMemo(() => {
    if (!ingresos.length) {
      return {
        totalVisible: 0,
        conErrores: 0,
        sinErrores: 0,
        porcentajePrecision: 100
      };
    }

    const conErrores = ingresos.filter(ingreso => 
      Math.abs(ingreso.error_final) > 0.01 || 
      Math.abs(ingreso.error_inicial_total) > 0.01
    ).length;

    return {
      totalVisible: ingresos.length,
      conErrores,
      sinErrores: ingresos.length - conErrores,
      porcentajePrecision: ingresos.length > 0 ? 
        Math.round(((ingresos.length - conErrores) / ingresos.length) * 100) : 100
    };
  }, [ingresos]);

  return {
    // Datos
    ingresos,
    resumen,
    faenas,
    
    // Estados
    filtros,
    paginacion,
    loading,
    loadingResumen,
    error,
    
    // Acciones
    cambiarPagina,
    cambiarFiltros,
    limpiarFiltros,
    recargarDatos,
    
    // Utilidades
    utilidades,
    estadisticas,
    
    // Flags computados
    hayDatos: ingresos.length > 0,
    mostrandoResultados: !loading && (ingresos.length > 0 || error),
    filtrosActivos: filtros.fechaDesde && filtros.fechaHasta
  };
};

export default useVerificacionIngresos;