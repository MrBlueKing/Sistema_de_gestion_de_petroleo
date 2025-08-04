import { useState, useMemo, useCallback } from "react";

/**
 * Hook personalizado para manejar filtros y ordenamiento de tablas
 * Diseñado para trabajar con TableColumnFilter
 */
export const useTableFilters = (data = [], configuracionColumnas = {}) => {
  const [filtros, setFiltros] = useState({});
  const [ordenamiento, setOrdenamiento] = useState({
    columna: null,
    direccion: null // "asc", "desc", null
  });

  // Manejar cambio de filtro en una columna
  const manejarCambioFiltro = useCallback((columna, valor) => {
    setFiltros(prev => {
      const nuevosFiltros = { ...prev };
      
      if (!valor || valor.toString().trim() === "") {
        delete nuevosFiltros[columna];
      } else {
        nuevosFiltros[columna] = valor;
      }
      
      return nuevosFiltros;
    });
  }, []);

  // Manejar cambio de ordenamiento
  const manejarCambioOrdenamiento = useCallback((columna, direccion) => {
    setOrdenamiento({
      columna: direccion ? columna : null,
      direccion
    });
  }, []);

  // Limpiar todos los filtros
  const limpiarFiltros = useCallback(() => {
    setFiltros({});
  }, []);

  // Limpiar ordenamiento
  const limpiarOrdenamiento = useCallback(() => {
    setOrdenamiento({ columna: null, direccion: null });
  }, []);

  // Limpiar todo
  const limpiarTodo = useCallback(() => {
    setFiltros({});
    setOrdenamiento({ columna: null, direccion: null });
  }, []);

  // Función para aplicar filtros a los datos
  const aplicarFiltros = useCallback((datos) => {
    return datos.filter(item => {
      return Object.entries(filtros).every(([columna, valorFiltro]) => {
        const config = configuracionColumnas[columna];
        const valorItem = config?.accessor ? config.accessor(item) : item[columna];
        
        if (valorItem == null) return false;
        
        const valorItemStr = valorItem.toString().toLowerCase();
        const valorFiltroStr = valorFiltro.toString().toLowerCase();
        
        // Diferentes tipos de filtrado según configuración
        switch (config?.tipoFiltro) {
          case "exact":
            return valorItemStr === valorFiltroStr;
            
          case "startsWith":
            return valorItemStr.startsWith(valorFiltroStr);
            
          case "number":
            const numeroItem = parseFloat(valorItem);
            const numeroFiltro = parseFloat(valorFiltro);
            return !isNaN(numeroItem) && !isNaN(numeroFiltro) && numeroItem === numeroFiltro;
            
          case "range":
            // Para rangos, esperamos formato "min-max" o ">=min" o "<=max"
            if (valorFiltroStr.includes("-")) {
              const [min, max] = valorFiltroStr.split("-").map(v => parseFloat(v.trim()));
              const numero = parseFloat(valorItem);
              return numero >= min && numero <= max;
            }
            return valorItemStr.includes(valorFiltroStr);
            
          case "select":
            return valorFiltroStr === "" || valorItemStr === valorFiltroStr;
            
          default: // "contains"
            return valorItemStr.includes(valorFiltroStr);
        }
      });
    });
  }, [filtros, configuracionColumnas]);

  // Función para aplicar ordenamiento
  const aplicarOrdenamiento = useCallback((datos) => {
    if (!ordenamiento.columna || !ordenamiento.direccion) {
      return datos;
    }

    return [...datos].sort((a, b) => {
      const config = configuracionColumnas[ordenamiento.columna];
      const valorA = config?.accessor ? config.accessor(a) : a[ordenamiento.columna];
      const valorB = config?.accessor ? config.accessor(b) : b[ordenamiento.columna];

      // Manejar valores null/undefined
      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      let resultado = 0;

      // Diferentes tipos de ordenamiento según configuración
      switch (config?.tipoOrdenamiento) {
        case "number":
          const numA = parseFloat(valorA);
          const numB = parseFloat(valorB);
          resultado = numA - numB;
          break;
          
        case "date":
          const fechaA = new Date(valorA);
          const fechaB = new Date(valorB);
          resultado = fechaA.getTime() - fechaB.getTime();
          break;
          
        default: // "string"
          resultado = valorA.toString().localeCompare(valorB.toString(), 'es', { 
            numeric: true, 
            sensitivity: 'base' 
          });
          break;
      }

      return ordenamiento.direccion === "desc" ? -resultado : resultado;
    });
  }, [ordenamiento, configuracionColumnas]);

  // Datos procesados (filtrados y ordenados)
  const datosProcesados = useMemo(() => {
    let resultado = aplicarFiltros(data);
    resultado = aplicarOrdenamiento(resultado);
    return resultado;
  }, [data, aplicarFiltros, aplicarOrdenamiento]);

  // Estadísticas útiles
  const estadisticas = useMemo(() => ({
    totalOriginal: data.length,
    totalFiltrado: datosProcesados.length,
    filtrosActivos: Object.keys(filtros).length,
    tieneOrdenamiento: !!ordenamiento.columna,
    filtrosAplicados: filtros
  }), [data.length, datosProcesados.length, filtros, ordenamiento.columna]);

  // Generar opciones para filtros tipo select
  const generarOpcionesSelect = useCallback((columna) => {
    const config = configuracionColumnas[columna];
    const valoresUnicos = new Set();
    
    data.forEach(item => {
      const valor = config?.accessor ? config.accessor(item) : item[columna];
      if (valor != null) {
        valoresUnicos.add(valor);
      }
    });
    
    return Array.from(valoresUnicos)
      .sort()
      .map(valor => ({
        value: valor,
        label: config?.formatear ? config.formatear(valor) : valor.toString()
      }));
  }, [data, configuracionColumnas]);

  return {
    // Estado
    filtros,
    ordenamiento,
    datosProcesados,
    estadisticas,
    
    // Acciones
    manejarCambioFiltro,
    manejarCambioOrdenamiento,
    limpiarFiltros,
    limpiarOrdenamiento,
    limpiarTodo,
    
    // Utilidades
    generarOpcionesSelect,
    
    // Para usar con TableColumnFilter
    obtenerPropsColumna: (columna) => ({
      valorFiltro: filtros[columna] || "",
      onFiltroChange: manejarCambioFiltro,
      onOrdenamientoChange: manejarCambioOrdenamiento,
      estadoOrdenamiento: ordenamiento.columna === columna ? ordenamiento.direccion : null,
      conteoTotal: data.length,
      conteoFiltrado: datosProcesados.length
    })
  };
};

export default useTableFilters;