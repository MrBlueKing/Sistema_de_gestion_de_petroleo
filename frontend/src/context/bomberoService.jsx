import axios from "../lib/axios";

// Cache global para evitar requests duplicados
const cache = new Map();
const pendingRequests = new Map();

// Configuración de cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos
const MAX_CACHE_SIZE = 50; // Máximo número de entradas en cache

// Utility para limpiar cache antiguo
const cleanOldCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  
  // Si el cache sigue siendo muy grande, eliminar las entradas más antiguas
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => cache.delete(key));
  }
};

// Utility para crear claves de cache
const createCacheKey = (endpoint, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${endpoint}?${sortedParams}`;
};

// Servicio para las operaciones del formulario de Bombero
const bomberoService = {
  
  /**
   * Método principal optimizado para obtener personal por tipo y faena
   * Incluye cache, deduplicación de requests y manejo de errores robusto
   */
  getPersonalOptimizadoPorTipoYFaena: async (tipoSolicitante, idFaena) => {
    try {
      if (!tipoSolicitante || !idFaena) {
        throw new Error('Tipo de solicitante y ID de faena son requeridos');
      }

      // Crear clave única para cache y deduplicación
      const cacheKey = createCacheKey('/api/solicitantes-por-faena', {
        tipo_solicitante: tipoSolicitante,
        id_faena: idFaena
      });

      // Limpiar cache antiguo
      cleanOldCache();

      // Verificar si tenemos datos en cache
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        console.log(`📦 Cache hit para ${tipoSolicitante} faena ${idFaena}:`, cachedData.data.length, 'registros');
        return cachedData.data;
      }

      // Verificar si ya hay un request pendiente para estos mismos parámetros
      if (pendingRequests.has(cacheKey)) {
        console.log(`⏳ Request en progreso para ${tipoSolicitante} faena ${idFaena}, esperando...`);
        return await pendingRequests.get(cacheKey);
      }

      console.log(`🚀 Nuevo request para ${tipoSolicitante} faena ${idFaena} (OPTIMIZADO)`);

      // Crear la promesa del request
      const requestPromise = (async () => {
        try {
          const response = await axios.get('/api/solicitantes-por-faena', {
            params: {
              tipo_solicitante: tipoSolicitante,
              id_faena: idFaena
            },
            timeout: 10000 // 10 segundos timeout
          });

          if (response.data.success) {
            const personal = response.data.data || [];
            
            // Guardar en cache con timestamp
            cache.set(cacheKey, {
              data: personal,
              timestamp: Date.now()
            });
            
            console.log(`✅ Personal ${tipoSolicitante} obtenido (optimizado):`, personal.length, 'registros');
            return personal;
          } else {
            throw new Error(response.data.message || 'Error al obtener personal');
          }
        } finally {
          // Remover de requests pendientes al completarse
          pendingRequests.delete(cacheKey);
        }
      })();

      // Guardar en requests pendientes
      pendingRequests.set(cacheKey, requestPromise);

      return await requestPromise;

    } catch (error) {
      console.error(`❌ Error al obtener personal ${tipoSolicitante} para faena ${idFaena}:`, error);
      
      // Limpiar request pendiente en caso de error
      const cacheKey = createCacheKey('/api/solicitantes-por-faena', {
        tipo_solicitante: tipoSolicitante,
        id_faena: idFaena
      });
      pendingRequests.delete(cacheKey);
      
      // Intentar fallback al método tradicional solo si no es error de red
      if (error.code !== 'NETWORK_ERROR' && error.code !== 'ECONNABORTED') {
        console.log('📦 Intentando fallback al método tradicional...');
        try {
          const todoElPersonal = await bomberoService.getPersonalPorTipo(tipoSolicitante);
          return bomberoService.filtrarPersonalPorFaena(todoElPersonal, idFaena);
        } catch (fallbackError) {
          console.error('❌ Fallback también falló:', fallbackError);
        }
      }
      
      throw error;
    }
  },

  /**
   * Método optimizado con búsqueda en tiempo real y debounce
   */
  buscarPersonalOptimizado: async (tipoSolicitante, idFaena, termino = '', pagina = 1, porPagina = 15) => {
    try {
      if (!tipoSolicitante || !idFaena) {
        throw new Error('Tipo de solicitante y ID de faena son requeridos');
      }

      const cacheKey = createCacheKey('/api/solicitantes-optimizado/buscar', {
        tipo_solicitante: tipoSolicitante,
        id_faena: idFaena,
        search: termino,
        page: pagina,
        per_page: porPagina
      });

      // Verificar cache (con TTL más corto para búsquedas)
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Cache más corto para búsquedas (1 minuto)
        if (cacheAge < 60000) {
          console.log(`📦 Cache hit para búsqueda: "${termino}"`);
          return cachedData.data;
        } else {
          cache.delete(cacheKey);
        }
      }

      // Verificar requests pendientes
      if (pendingRequests.has(cacheKey)) {
        console.log(`⏳ Búsqueda en progreso para "${termino}", esperando...`);
        return await pendingRequests.get(cacheKey);
      }

      console.log(`🔍 Nueva búsqueda: "${termino}" en personal ${tipoSolicitante} de faena ${idFaena}`);

      const requestPromise = (async () => {
        try {
          const response = await axios.get('/api/solicitantes-optimizado/buscar', {
            params: {
              tipo_solicitante: tipoSolicitante,
              id_faena: idFaena,
              search: termino,
              page: pagina,
              per_page: porPagina
            },
            timeout: 8000
          });

          if (response.data.success) {
            const resultado = {
              data: response.data.data || [],
              pagination: response.data.pagination || {},
              total: response.data.pagination?.total || 0
            };
            
            // Guardar en cache
            cache.set(cacheKey, {
              data: resultado,
              timestamp: Date.now()
            });
            
            console.log(`✅ Búsqueda completada: ${resultado.total} resultado(s)`);
            return resultado;
          } else {
            throw new Error(response.data.message || 'Error en la búsqueda');
          }
        } finally {
          pendingRequests.delete(cacheKey);
        }
      })();

      pendingRequests.set(cacheKey, requestPromise);
      return await requestPromise;

    } catch (error) {
      console.error('❌ Error en búsqueda optimizada:', error);
      
      // Limpiar request pendiente
      const cacheKey = createCacheKey('/api/solicitantes-optimizado/buscar', {
        tipo_solicitante: tipoSolicitante,
        id_faena: idFaena,
        search: termino,
        page: pagina,
        per_page: porPagina
      });
      pendingRequests.delete(cacheKey);
      
      throw error;
    }
  },

  /**
   * Limpiar cache manualmente
   */
  clearCache: () => {
    console.log('🧹 Limpiando cache del bomberoService');
    cache.clear();
    pendingRequests.clear();
  },

  /**
   * Limpiar cache específico
   */
  clearCacheFor: (tipoSolicitante, idFaena) => {
    const cacheKey = createCacheKey('/api/solicitantes-por-faena', {
      tipo_solicitante: tipoSolicitante,
      id_faena: idFaena
    });
    
    cache.delete(cacheKey);
    pendingRequests.delete(cacheKey);
    console.log(`🧹 Cache limpiado para ${tipoSolicitante} faena ${idFaena}`);
  },

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats: () => {
    const now = Date.now();
    const stats = {
      totalEntries: cache.size,
      pendingRequests: pendingRequests.size,
      cacheEntries: []
    };

    for (const [key, value] of cache.entries()) {
      const age = now - value.timestamp;
      stats.cacheEntries.push({
        key,
        age: Math.round(age / 1000), // en segundos
        dataSize: Array.isArray(value.data) ? value.data.length : 'N/A'
      });
    }

    return stats;
  },

  /**
   * Precargar datos para mejorar UX
   */
  preloadPersonalData: async (tiposSolicitante, idFaena) => {
    console.log('🚀 Precargando datos de personal...');
    
    const preloadPromises = tiposSolicitante.map(async (tipo) => {
      try {
        await bomberoService.getPersonalOptimizadoPorTipoYFaena(tipo, idFaena);
        console.log(`✅ Precarga completada para ${tipo}`);
      } catch (error) {
        console.warn(`⚠️ Error en precarga para ${tipo}:`, error.message);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('✅ Precarga de datos completada');
  },

  // ============================================
  // MÉTODOS TRADICIONALES (MANTENIDOS PARA COMPATIBILIDAD)
  // ============================================

  getPersonalInterno: async () => {
    try {
      console.log('⚠️  ADVERTENCIA: Usando método no optimizado getPersonalInterno');
      
      const cacheKey = createCacheKey('/api/personal-internos');
      
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        console.log('📦 Cache hit para personal interno');
        return cachedData.data;
      }

      const response = await axios.get("/api/personal-internos");

      if (response.data && response.data.success && Array.isArray(response.data.personal_interno)) {
        const data = response.data.personal_interno;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else {
        console.error("Formato de respuesta no esperado:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener personal interno:", error);
      return [];
    }
  },

  getPersonalExterno: async () => {
    try {
      console.log('⚠️  ADVERTENCIA: Usando método no optimizado getPersonalExterno');
      
      const cacheKey = createCacheKey('/api/personal-externos');
      
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        console.log('📦 Cache hit para personal externo');
        return cachedData.data;
      }

      const response = await axios.get("/api/personal-externos");
      
      if (response.data && response.data.success && Array.isArray(response.data.personal_externo)) {
        const data = response.data.personal_externo;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else {
        console.error("Formato de respuesta no esperado:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener personal externo:", error);
      return [];
    }
  },

  getPersonalPorTipo: async (tipo) => {
    if (tipo === "interno") {
      return bomberoService.getPersonalInterno();
    } else if (tipo === "externo") {
      return bomberoService.getPersonalExterno();
    } else {
      console.error(`Tipo de personal inválido: ${tipo}`);
      return [];
    }
  },

  filtrarPersonalPorFaena: (personal, idFaena) => {
    if (!idFaena || !Array.isArray(personal)) return [];

    return personal.filter(item => {
      if (item.faenas && Array.isArray(item.faenas)) {
        return item.faenas.some(faena => faena.id_faena === idFaena);
      }
      
      const personalData = item.personal_interno || item.personal_externo;
      
      if (personalData && personalData.id_faena !== undefined) {
        return personalData.id_faena === idFaena;
      }
      
      return false;
    });
  },

  // Resto de métodos sin cambios...
  getFaenaById: async (idFaena) => {
    try {
      const cacheKey = createCacheKey('/api/faenas');
      let faenas;

      if (cache.has(cacheKey)) {
        faenas = cache.get(cacheKey).data;
      } else {
        const response = await axios.get("/api/faenas");
        console.log('🏭 Respuesta de faenas (getFaenaById):', response.data);
        
        // Manejar diferentes estructuras de respuesta
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          faenas = response.data.data;
        } else if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
          faenas = response.data.data;
        } else if (Array.isArray(response.data)) {
          faenas = response.data;
        } else {
          console.error("Formato de respuesta no esperado para faenas:", response.data);
          return null;
        }
        
        cache.set(cacheKey, { data: faenas, timestamp: Date.now() });
      }

      const faena = faenas.find(f => f.id_faena === idFaena);
      return faena || null;
    } catch (error) {
      console.error(`Error al obtener faena con ID ${idFaena}:`, error);
      return null;
    }
  },

  getAllFaenas: async () => {
    try {
      const cacheKey = createCacheKey('/api/faenas');
      
      if (cache.has(cacheKey)) {
        console.log('📦 Cache hit para faenas');
        return cache.get(cacheKey).data;
      }

      const response = await axios.get("/api/faenas");
      console.log('🏭 Respuesta de faenas:', response.data);

      // Manejar diferentes estructuras de respuesta
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const data = response.data.data;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        const data = response.data.data;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else if (Array.isArray(response.data)) {
        // Fallback si la respuesta es directamente un array
        const data = response.data;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else {
        console.error("Formato de respuesta no esperado para faenas:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener todas las faenas:", error);
      return [];
    }
  },

  getCategoriasMaquinaria: async () => {
    try {
      const cacheKey = createCacheKey('/api/categorias');
      
      if (cache.has(cacheKey)) {
        console.log('📦 Cache hit para categorías');
        return cache.get(cacheKey).data;
      }

      const response = await axios.get("/api/categorias");
      console.log('🔧 Respuesta de categorías:', response.data);

      // CORRECCIÓN: Manejar la estructura de respuesta correcta de tu API
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        const data = response.data.data;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log('✅ Categorías cargadas correctamente:', data.length);
        return data;
      } else if (response.data && response.data.success && Array.isArray(response.data.categorias)) {
        // Fallback para estructura alternativa
        const data = response.data.categorias;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log('✅ Categorías cargadas (estructura alternativa):', data.length);
        return data;
      } else {
        console.error("Formato de respuesta no esperado para categorías:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener categorías de maquinaria:", error);
      return [];
    }
  },

  registrarConsumo: async (datosConsumo) => {
    try {
      const response = await axios.post("/api/consumos", datosConsumo);
      
      // Limpiar cache relacionado después de un consumo exitoso
      console.log('🧹 Limpiando cache después de registrar consumo');
      bomberoService.clearCache();
      
      return response.data;
    } catch (error) {
      console.error("Error al registrar consumo:", error);
      throw error;
    }
  },

  getBomberoInfo: async (bomberoBadgeId) => {
    try {
      const cacheKey = createCacheKey(`/api/user/${bomberoBadgeId}`);
      
      if (cache.has(cacheKey)) {
        console.log('📦 Cache hit para info bombero');
        return cache.get(cacheKey).data;
      }

      const response = await axios.get(`/api/user/${bomberoBadgeId}`);
      
      if (response.data) {
        cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener información del bombero:", error);
      return null;
    }
  },

  // ============================================
  // MÉTODOS DE UTILIDAD Y DEBUGGING
  // ============================================

  /**
   * Método de debugging para inspeccionar respuestas de API
   */
  debugApiResponse: async (endpoint, params = {}) => {
    try {
      console.log(`🔍 Debug API: ${endpoint}`, params);
      const response = await axios.get(endpoint, { params });
      console.log(`📋 Respuesta completa de ${endpoint}:`, {
        status: response.status,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'N/A',
        isArray: Array.isArray(response.data),
        dataStructure: response.data ? JSON.stringify(response.data, null, 2) : 'N/A'
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Error debugging ${endpoint}:`, error);
      return null;
    }
  },

  /**
   * Verificar disponibilidad de endpoints optimizados
   */
  verificarDisponibilidadOptimizada: async () => {
    try {
      const response = await axios.get('/api/solicitantes-por-faena', {
        params: { tipo_solicitante: 'interno', id_faena: 1 },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Endpoints optimizados no disponibles, usando fallback');
      return false;
    }
  },

  /**
   * Método para migración gradual a endpoints optimizados
   */
  obtenerPersonalConMigracionGradual: async (tipoSolicitante, idFaena) => {
    try {
      const optimizadoDisponible = await bomberoService.verificarDisponibilidadOptimizada();
      
      if (optimizadoDisponible) {
        console.log('🚀 Usando endpoints optimizados');
        return await bomberoService.getPersonalOptimizadoPorTipoYFaena(tipoSolicitante, idFaena);
      } else {
        console.log('📦 Usando método tradicional (endpoints optimizados no disponibles)');
        const todoElPersonal = await bomberoService.getPersonalPorTipo(tipoSolicitante);
        return bomberoService.filtrarPersonalPorFaena(todoElPersonal, idFaena);
      }
    } catch (error) {
      console.error('Error en migración gradual:', error);
      throw error;
    }
  },

  /**
   * Método para comparar rendimiento entre métodos tradicional y optimizado
   */
  compararRendimiento: async (tipoSolicitante, idFaena) => {
    const resultados = {};
    
    try {
      // Limpiar cache para comparación justa
      bomberoService.clearCache();

      // Medir método tradicional
      console.time('Método tradicional');
      const personalTradicional = await bomberoService.obtenerPersonalConMigracionGradual(tipoSolicitante, idFaena);
      console.timeEnd('Método tradicional');
      resultados.tradicional = {
        cantidad: personalTradicional.length,
        metodo: 'tradicional'
      };

      // Limpiar cache nuevamente
      bomberoService.clearCache();

      // Medir método optimizado
      console.time('Método optimizado');
      const personalOptimizado = await bomberoService.getPersonalOptimizadoPorTipoYFaena(tipoSolicitante, idFaena);
      console.timeEnd('Método optimizado');
      resultados.optimizado = {
        cantidad: personalOptimizado.length,
        metodo: 'optimizado'
      };

      console.table(resultados);
      return resultados;
    } catch (error) {
      console.error('Error en comparación de rendimiento:', error);
      return resultados;
    }
  }
};

// Auto-limpieza del cache cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    console.log('🧹 Auto-limpieza del cache programada');
    cleanOldCache();
  }, 10 * 60 * 1000);
}

export default bomberoService;