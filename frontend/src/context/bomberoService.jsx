// bomberoService.js - Sistema de Cache Inteligente con Precarga Masiva

import axios from '../lib/axios';
const DEBUG = false; // o true si estás depurando

class BomberoService {
  constructor() {
    // 🚀 CACHE MULTI-NIVEL CON TIMESTAMPS
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheExpiration = 5 * 60 * 1000; // 5 minutos

    // 🚀 CACHE ESPECÍFICO PARA PRECARGA
    this.preloadCache = new Map();
    this.preloadStatus = new Map();

    // 🚀 QUEUE DE PRECARGAS PARA EVITAR DUPLICADOS
    this.preloadQueue = new Set();

    DEBUG && console.log('🎯 BomberoService inicializado con cache inteligente');
  }

  // ✅ MÉTODO PARA VERIFICAR SI EL CACHE ES VÁLIDO
  isCacheValid(key) {
    if (!this.cache.has(key) || !this.cacheTimestamps.has(key)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(key);
    return (Date.now() - timestamp) < this.cacheExpiration;
  }

  // ✅ MÉTODO PARA GUARDAR EN CACHE CON TIMESTAMP
  setCache(key, data) {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
    DEBUG && console.log(`📦 Cache guardado: ${key} (${Array.isArray(data) ? data.length : 'object'} items)`);
  }

  // ✅ MÉTODO PARA OBTENER DEL CACHE
  getCache(key) {
    if (this.isCacheValid(key)) {
      DEBUG && console.log(`🎯 Cache HIT: ${key}`);
      return this.cache.get(key);
    }

    DEBUG && console.log(`❌ Cache MISS: ${key}`);
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    return null;
  }

  // 🚀 PRECARGA INTELIGENTE DE PERSONAL
  async preloadPersonalData(tipos = ['interno', 'externo'], idFaena) {
    const preloadKey = `preload-personal-${tipos.join('-')}-${idFaena}`;

    if (this.preloadQueue.has(preloadKey)) {
      DEBUG && console.log(`⏸️ Precarga ya en progreso: ${preloadKey}`);
      return;
    }

    try {
      this.preloadQueue.add(preloadKey);
      DEBUG && console.log(`🚀 INICIANDO PRECARGA: Personal ${tipos.join(' y ')} para faena ${idFaena}`);

      const promesas = tipos.map(async (tipo) => {
        const cacheKey = `personal-${tipo}-${idFaena}`;

        if (this.isCacheValid(cacheKey)) {
          DEBUG && console.log(`✅ Personal ${tipo} ya en cache válido`);
          return;
        }

        try {
          const endpoint = tipo === 'interno'
            ? '/api/personal-interno'
            : '/api/personal-externo';

          const response = await axios.get(endpoint, {
            params: { id_faena: idFaena }
          });

          if (response.data && response.data.success) {
            let data;
            if (tipo === 'interno') {
              data = response.data.personal_interno;
            } else if (tipo === 'externo') {
              data = response.data.personal_externo;
            } else {
              data = response.data.data;
            }

            const dataArray = Array.isArray(data) ? data : [];
            this.setCache(cacheKey, dataArray);
            DEBUG && console.log(`📦 Personal ${tipo} precargado: ${dataArray.length} registros`);
          }
        } catch (error) {
          DEBUG && console.warn(`⚠️ Error precargando personal ${tipo}:`, error.message);
        }
      });

      await Promise.all(promesas);

      this.preloadStatus.set(preloadKey, { completed: true, timestamp: Date.now() });
      DEBUG && console.log(`✅ PRECARGA COMPLETADA: ${preloadKey}`);

    } catch (error) {
      DEBUG && console.error(`❌ Error en precarga ${preloadKey}:`, error);
    } finally {
      this.preloadQueue.delete(preloadKey);
    }
  }

  // 🚀 PRECARGA DE CATEGORÍAS DE MAQUINARIA
  async preloadCategoriasMaquinaria() {
    const cacheKey = 'categorias-maquinaria';
    const preloadKey = 'preload-categorias';

    if (this.preloadQueue.has(preloadKey)) {
      DEBUG && console.log(`⏸️ Precarga categorías ya en progreso`);
      return;
    }

    if (this.isCacheValid(cacheKey)) {
      DEBUG && console.log(`✅ Categorías ya en cache válido`);
      return;
    }

    try {
      this.preloadQueue.add(preloadKey);
      DEBUG && console.log(`🚀 INICIANDO PRECARGA: Categorías de maquinaria`);

      const response = await axios.get('/api/categorias');

      if (response.data && response.data.success) {
        const data = response.data.data;
        const dataArray = Array.isArray(data) ? data : [];
        this.setCache(cacheKey, dataArray);
        DEBUG && console.log(`📦 Categorías precargadas: ${dataArray.length} registros`);

        // 🆕 RETORNAR LAS CATEGORÍAS PARA USAR EN PRECARGA MASIVA
        return dataArray;
      }

      this.preloadStatus.set(preloadKey, { completed: true, timestamp: Date.now() });
      DEBUG && console.log(`✅ PRECARGA COMPLETADA: categorías`);
      return [];

    } catch (error) {
      DEBUG && console.error(`❌ Error precargando categorías:`, error);
      return [];
    } finally {
      this.preloadQueue.delete(preloadKey);
    }
  }

  // 🚀 PRECARGA DE ESTANQUES
  async preloadEstanques(idFaena) {
    const cacheKey = `estanques-${idFaena}`;
    const preloadKey = `preload-estanques-${idFaena}`;

    if (this.preloadQueue.has(preloadKey)) {
      DEBUG && console.log(`⏸️ Precarga estanques ya en progreso: ${preloadKey}`);
      return;
    }

    if (this.isCacheValid(cacheKey)) {
      DEBUG && console.log(`✅ Estanques ya en cache válido para faena ${idFaena}`);
      return;
    }

    try {
      this.preloadQueue.add(preloadKey);
      DEBUG && console.log(`🚀 INICIANDO PRECARGA: Estanques para faena ${idFaena}`);

      const response = await axios.get(`/api/estanques/${idFaena}`);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        this.setCache(cacheKey, response.data.data);
        DEBUG && console.log(`📦 Estanques precargados: ${response.data.data.length} registros`);
      }

      this.preloadStatus.set(preloadKey, { completed: true, timestamp: Date.now() });
      DEBUG && console.log(`✅ PRECARGA COMPLETADA: estanques faena ${idFaena}`);

    } catch (error) {
      DEBUG && console.error(`❌ Error precargando estanques faena ${idFaena}:`, error);
    } finally {
      this.preloadQueue.delete(preloadKey);
    }
  }

  // 🚀 PRECARGA INDIVIDUAL DE MÁQUINAS POR CATEGORÍA
  async preloadMaquinas(tipoSolicitante, categoriaId, idFaena) {
    const preloadKey = `preload-maquinas-${tipoSolicitante}-${categoriaId}-${idFaena}`;

    if (this.preloadQueue.has(preloadKey)) {
      DEBUG && console.log(`⏸️ Precarga máquinas ya en progreso: ${preloadKey}`);
      return;
    }

    try {
      this.preloadQueue.add(preloadKey);
      DEBUG && console.log(`🚀 INICIANDO PRECARGA: Máquinas ${tipoSolicitante} categoría ${categoriaId}`);

      let endpoint, params = {};

      if (tipoSolicitante === 'interno') {
        endpoint = "/api/maquinas-internas-permiso";
        params = { id_faena: idFaena };
      } else if (tipoSolicitante === 'externo') {
        endpoint = "/api/maquinas-externas";
        params = { id_faena: idFaena };
      }

      const [maquinasResponse] = await Promise.all([
        axios.get(endpoint, { params }),
        this.preloadEstanques(idFaena)
      ]);

      if (maquinasResponse.data && maquinasResponse.data.success && Array.isArray(maquinasResponse.data.data)) {
        // Filtrar por categoría
        const maquinasFiltradas = maquinasResponse.data.data.filter(maquina => {
          if (tipoSolicitante === 'interno') {
            return maquina.categoria === categoriaId.toString() ||
              maquina.id_categoria === parseInt(categoriaId);
          } else {
            return maquina.id_categoria === parseInt(categoriaId);
          }
        });

        const cacheKey = `maquinas-${tipoSolicitante}-${categoriaId}-${idFaena}`;
        this.setCache(cacheKey, maquinasFiltradas);

        DEBUG && console.log(`📦 Máquinas precargadas: ${maquinasFiltradas.length} registros`);
      }

      this.preloadStatus.set(preloadKey, { completed: true, timestamp: Date.now() });
      DEBUG && console.log(`✅ PRECARGA COMPLETADA: máquinas categoría ${categoriaId}`);

    } catch (error) {
      DEBUG && console.error(`❌ Error precargando máquinas categoría ${categoriaId}:`, error);
    } finally {
      this.preloadQueue.delete(preloadKey);
    }
  }

  // 🆕 PRECARGA MASIVA DE TODAS LAS MÁQUINAS
  async preloadTodasLasMaquinas(tipoSolicitante, idFaena) {
    const preloadKey = `preload-todas-maquinas-${tipoSolicitante}-${idFaena}`;

    if (this.preloadQueue.has(preloadKey)) {
      DEBUG && console.log(`⏸️ Precarga masiva ya en progreso: ${preloadKey}`);
      return;
    }

    try {
      this.preloadQueue.add(preloadKey);
      DEBUG && console.log(`🚀 🚀 INICIANDO PRECARGA MASIVA: Todas las máquinas ${tipoSolicitante} para faena ${idFaena}`);

      // 1. Obtener categorías primero
      const categorias = await this.getCategoriasMaquinaria();

      if (!categorias || categorias.length === 0) {
        DEBUG && console.warn('⚠️ No hay categorías disponibles para precarga masiva');
        return;
      }

      // 2. Obtener TODAS las máquinas de una vez
      let endpoint, params = {};

      if (tipoSolicitante === 'interno') {
        endpoint = "/api/maquinas-internas-permiso";
        params = { id_faena: idFaena };
      } else if (tipoSolicitante === 'externo') {
        endpoint = "/api/maquinas-externas";
        params = { id_faena: idFaena };
      }

      DEBUG && console.log(`📡 Obteniendo TODAS las máquinas ${tipoSolicitante} de una vez...`);

      const [maquinasResponse] = await Promise.all([
        axios.get(endpoint, { params }),
        this.preloadEstanques(idFaena) // Precargar estanques en paralelo
      ]);

      if (maquinasResponse.data && maquinasResponse.data.success && Array.isArray(maquinasResponse.data.data)) {
        const todasLasMaquinas = maquinasResponse.data.data;
        DEBUG && console.log(`📦 Obtenidas ${todasLasMaquinas.length} máquinas totales`);

        // 3. Separar y cachear por categoría
        let maquinasGuardadas = 0;

        categorias.forEach(categoria => {
          const categoriaId = categoria.id_categoria;

          // Filtrar máquinas por categoría
          const maquinasPorCategoria = todasLasMaquinas.filter(maquina => {
            if (tipoSolicitante === 'interno') {
              return maquina.categoria === categoriaId.toString() ||
                maquina.id_categoria === parseInt(categoriaId);
            } else {
              return maquina.id_categoria === parseInt(categoriaId);
            }
          });

          // Guardar en cache por categoría
          const cacheKey = `maquinas-${tipoSolicitante}-${categoriaId}-${idFaena}`;
          this.setCache(cacheKey, maquinasPorCategoria);
          maquinasGuardadas += maquinasPorCategoria.length;

          DEBUG && console.log(`📦 Categoría ${categoria.nombre_categoria}: ${maquinasPorCategoria.length} máquinas cacheadas`);
        });

        DEBUG && console.log(`🎉 PRECARGA MASIVA COMPLETADA: ${maquinasGuardadas} máquinas distribuidas en ${categorias.length} categorías`);
      }

      this.preloadStatus.set(preloadKey, { completed: true, timestamp: Date.now() });

    } catch (error) {
      DEBUG && console.error(`❌ Error en precarga masiva:`, error);
    } finally {
      this.preloadQueue.delete(preloadKey);
    }
  }

  // ✅ MÉTODOS EXISTENTES OPTIMIZADOS CON CACHE

  // Obtener personal optimizado por tipo y faena - MEJORADO
  async getPersonalOptimizadoPorTipoYFaena(tipo, idFaena) {
    const cacheKey = `personal-${tipo}-${idFaena}`;

    const cached = this.getCache(cacheKey);
    if (cached) {
      DEBUG && console.log(`🎯 Cache HIT: ${cached.length} registros de personal ${tipo} para faena ${idFaena}`);
      return cached;
    }

    try {
      DEBUG && console.log(`🔄 Cargando personal ${tipo} para faena ${idFaena} desde API`);

      const endpoint = tipo === 'interno' ? '/api/personal-interno' : '/api/personal-externo';

      // ✅ ASEGURAR QUE SE PASE EL PARÁMETRO id_faena
      const params = {
        id_faena: idFaena
      };

      DEBUG && console.log('📡 Haciendo petición a:', {
        endpoint,
        params,
        url_completa: `${endpoint}?id_faena=${idFaena}`
      });

      const response = await axios.get(endpoint, { params });

      DEBUG && console.log('📥 Respuesta de la API:', {
        status: response.status,
        data_keys: Object.keys(response.data || {}),
        success: response.data?.success
      });

      if (response.data && response.data.success) {
        let data;
        if (tipo === 'interno') {
          data = response.data.personal_interno;
        } else if (tipo === 'externo') {
          data = response.data.personal_externo;
        } else {
          data = response.data.data;
        }

        const dataArray = Array.isArray(data) ? data : [];

        DEBUG && console.log(`📦 Personal ${tipo} procesado:`, {
          total_registros: dataArray.length,
          faena: idFaena,
          primer_registro: dataArray[0] || 'Sin registros'
        });

        this.setCache(cacheKey, dataArray);
        return dataArray;
      }

      DEBUG && console.warn(`⚠️ Respuesta no exitosa para personal ${tipo} faena ${idFaena}:`, response.data);
      return [];

    } catch (error) {
      DEBUG && console.error(`❌ Error obteniendo personal ${tipo} faena ${idFaena}:`, {
        message: error.message,
        response_status: error.response?.status,
        response_data: error.response?.data
      });
      return [];
    }
  }

  // Obtener categorías de maquinaria
  async getCategoriasMaquinaria() {
    const cacheKey = 'categorias-maquinaria';

    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      DEBUG && console.log(`🔄 Cargando categorías desde API`);

      const response = await axios.get('/api/categorias');

      if (response.data && response.data.success) {
        const data = response.data.data;
        const dataArray = Array.isArray(data) ? data : [];
        this.setCache(cacheKey, dataArray);
        return dataArray;
      }

      return [];
    } catch (error) {
      DEBUG && console.error(`❌ Error obteniendo categorías:`, error);
      return [];
    }
  }

  // Obtener máquinas con cache inteligente
  async getMaquinas(tipoSolicitante, categoriaId, idFaena) {
    const cacheKey = `maquinas-${tipoSolicitante}-${categoriaId}-${idFaena}`;

    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      DEBUG && console.log(`🔄 Cargando máquinas ${tipoSolicitante} desde API`);

      let endpoint, params = {};

      if (tipoSolicitante === 'interno') {
        endpoint = "/api/maquinas-internas-permiso";
        params = { id_faena: idFaena };
      } else if (tipoSolicitante === 'externo') {
        endpoint = "/api/maquinas-externas";
        params = { id_faena: idFaena };
      }

      const response = await axios.get(endpoint, { params });

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const maquinasFiltradas = response.data.data.filter(maquina => {
          if (tipoSolicitante === 'interno') {
            return maquina.categoria === categoriaId.toString() ||
              maquina.id_categoria === parseInt(categoriaId);
          } else {
            return maquina.id_categoria === parseInt(categoriaId);
          }
        });

        this.setCache(cacheKey, maquinasFiltradas);
        return maquinasFiltradas;
      }

      return [];
    } catch (error) {
      DEBUG && console.error(`❌ Error obteniendo máquinas:`, error);
      return [];
    }
  }

  // 🚀 OBTENER ESTANQUES CON CACHE
  async getEstanques(idFaena, cacheOnly = false) {
    const cacheKey = `estanques-${idFaena}`;

    if (cacheOnly) {
      DEBUG && console.log(`🎯 SOLO CACHE: Obteniendo estanques para faena ${idFaena}`);
      const cached = this.getCache(cacheKey);
      if (cached) {
        DEBUG && console.log(`✅ CACHE GLOBAL: ${cached.length} estanques cacheados para faena ${idFaena}`);
        return cached;
      }
      DEBUG && console.log(`❌ Cache MISS: ${cacheKey} - No hay datos en cache`);
      return [];
    }

    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      DEBUG && console.log(`🔄 Cargando estanques faena ${idFaena} desde API`);

      const response = await axios.get(`/api/estanques/${idFaena}`);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        this.setCache(cacheKey, response.data.data);
        return response.data.data;
      }

      return [];
    } catch (error) {
      DEBUG && console.error(`❌ Error obteniendo estanques faena ${idFaena}:`, error);
      return [];
    }
  }

  // 🚀 MÉTODOS DE GESTIÓN DE CACHE Y ESTADÍSTICAS

  clearCache() {
    const totalEntries = this.cache.size;
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.preloadCache.clear();
    this.preloadStatus.clear();
    this.preloadQueue.clear();

    DEBUG && console.log(`🧹 Cache limpiado: ${totalEntries} entradas eliminadas`);
  }

  clearCacheKey(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    DEBUG && console.log(`🧹 Cache key eliminado: ${key}`);
  }

  clearExpiredCache() {
    let removedCount = 0;

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if ((Date.now() - timestamp) >= this.cacheExpiration) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      DEBUG && console.log(`🧹 Cache expirado limpiado: ${removedCount} entradas`);
    }
  }

  getCacheStats() {
    this.clearExpiredCache();

    const stats = {
      totalEntries: this.cache.size,
      preloadQueue: this.preloadQueue.size,
      preloadCompleted: this.preloadStatus.size,
      cacheKeys: Array.from(this.cache.keys()),
      preloadKeys: Array.from(this.preloadStatus.keys())
    };

    return stats;
  }

  getPreloadStatus(key) {
    return this.preloadStatus.get(key) || { completed: false };
  }

  isPreloading(key) {
    return this.preloadQueue.has(key);
  }

  // 🚀 MÉTODO DE INICIALIZACIÓN AUTOMÁTICA - MEJORADO
  async initializeForUser(userFaena) {
    if (!userFaena) {
      DEBUG && console.warn('⚠️ No se puede inicializar sin userFaena');
      return;
    }

    DEBUG && console.log(`🚀 Inicializando cache completo para faena ${userFaena}`);

    try {
      // Iniciar precargas básicas en paralelo
      await Promise.all([
        this.preloadPersonalData(['interno', 'externo'], userFaena),
        this.preloadCategoriasMaquinaria()
      ]);

      DEBUG && console.log('✅ Inicialización completa');
    } catch (error) {
      DEBUG && console.warn('⚠️ Error en inicialización:', error);
    }
  }

  // 🆕 MÉTODO PARA WARMING UP MASIVO
  async warmupMasivoMaquinas(tipoSolicitante, userFaena) {
    if (!tipoSolicitante || !userFaena) {
      DEBUG && console.warn('⚠️ No se puede hacer warmup masivo sin tipoSolicitante y userFaena');
      return;
    }

    DEBUG && console.log(`🚀 🚀 INICIANDO WARMUP MASIVO para ${tipoSolicitante} en faena ${userFaena}`);

    try {
      // Precargar TODAS las máquinas en paralelo con categorías
      await Promise.all([
        this.preloadCategoriasMaquinaria(),
        this.preloadTodasLasMaquinas(tipoSolicitante, userFaena),
        this.preloadEstanques(userFaena)
      ]);

      DEBUG && console.log('🎉 🎉 WARMUP MASIVO COMPLETADO - Usuario tendrá experiencia instantánea');
    } catch (error) {
      DEBUG && console.warn('⚠️ Error en warmup masivo:', error);
    }
  }

  // 🆕 VERIFICAR SI YA ESTÁN TODAS LAS MÁQUINAS PRECARGADAS
  todasLasMaquinasPrecargadas(tipoSolicitante, idFaena) {
    const preloadKey = `preload-todas-maquinas-${tipoSolicitante}-${idFaena}`;
    const status = this.getPreloadStatus(preloadKey);
    return status.completed;
  }
}

// Exportar instancia singleton
const bomberoService = new BomberoService();
export default bomberoService;