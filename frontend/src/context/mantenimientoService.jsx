// MantenimientoService.js - Versión robusta con manejo de errores
import axios from "../lib/axios";

const mantenimientoService = {
  // Configuración base
  baseURL: '/api/mantenimiento',
  
  /**
   * Manejo centralizado de errores
   */
  handleError: (error, context = '') => {
    console.error(`Error en ${context}:`, error);
    
    let message = 'Error desconocido';
    let statusCode = 500;
    
    if (error.response) {
      // El servidor respondió con un código de error
      statusCode = error.response.status;
      message = error.response.data?.message || `Error del servidor (${statusCode})`;
      
      if (statusCode === 404) {
        message = 'Recurso no encontrado. Verifica que la API esté correctamente configurada.';
      } else if (statusCode === 500) {
        message = 'Error interno del servidor. Revisa los logs del backend.';
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      message = 'No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.';
    } else if (error.message) {
      // Error en la configuración de la petición
      if (error.message.includes('Unexpected token')) {
        message = 'El servidor está devolviendo HTML en lugar de JSON. Verifica las rutas de la API.';
      } else {
        message = error.message;
      }
    }
    
    return {
      status: 'error',
      message,
      statusCode,
      data: []
    };
  },

  /**
   * Prueba de conectividad con la API
   */
  testConnection: async () => {
    try {
      console.log('🧪 Probando conexión con API...');
      const response = await axios.get('/api/test-mantenimiento');
      console.log('✅ Conexión exitosa:', response.data);
      return {
        status: 'success',
        message: 'Conexión con API establecida correctamente',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return mantenimientoService.handleError(error, 'test de conexión');
    }
  },

  /**
   * Obtiene el estado de mantenimiento de todas las máquinas
   */
  obtenerEstadoMaquinas: async (faena = 'todas') => {
    try {
      console.log('🔧 Obteniendo estado de máquinas para faena:', faena);

      const response = await axios.get(mantenimientoService.baseURL, {
        params: { faena },
        timeout: 10000 // 10 segundos de timeout
      });

      console.log('✅ Respuesta recibida:', response.data);
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      } else {
        console.warn('⚠️ Respuesta sin formato esperado:', response.data);
        return {
          status: 'error',
          message: 'La respuesta del servidor no tiene el formato esperado',
          data: []
        };
      }

    } catch (error) {
      return mantenimientoService.handleError(error, 'obtenerEstadoMaquinas');
    }
  },

  /**
   * Registra un nuevo mantenimiento
   */
  registrarMantenimiento: async (datosMantenimiento) => {
    try {
      console.log('📝 Registrando mantenimiento:', datosMantenimiento);

      // Validar datos antes de enviar
      const validacion = mantenimientoService.validarDatosMantenimiento(datosMantenimiento);
      if (!validacion.valido) {
        return {
          status: 'error',
          message: 'Datos de entrada no válidos',
          errors: validacion.errores
        };
      }

      const response = await axios.post(mantenimientoService.baseURL, datosMantenimiento, {
        timeout: 15000 // 15 segundos para registro
      });

      console.log('✅ Mantenimiento registrado:', response.data);
      return response.data;

    } catch (error) {
      return mantenimientoService.handleError(error, 'registrarMantenimiento');
    }
  },

  /**
   * Obtiene el historial de mantenimientos de una máquina
   */
  obtenerHistorial: async (idMaquina) => {
    try {
      console.log('📚 Obteniendo historial para máquina:', idMaquina);

      if (!idMaquina) {
        return {
          status: 'error',
          message: 'ID de máquina requerido',
          data: []
        };
      }

      const response = await axios.get(`${mantenimientoService.baseURL}/${idMaquina}/historial`, {
        timeout: 10000
      });

      console.log('✅ Historial obtenido:', response.data);
      return response.data;

    } catch (error) {
      return mantenimientoService.handleError(error, 'obtenerHistorial');
    }
  },

  /**
   * Marca una máquina como operativa después del mantenimiento
   */
  marcarOperativa: async (idMaquina) => {
    try {
      console.log('⚙️ Marcando máquina como operativa:', idMaquina);

      if (!idMaquina) {
        return {
          status: 'error',
          message: 'ID de máquina requerido'
        };
      }

      const response = await axios.put(`${mantenimientoService.baseURL}/${idMaquina}/operativa`, {}, {
        timeout: 10000
      });

      console.log('✅ Máquina marcada como operativa:', response.data);
      return response.data;

    } catch (error) {
      return mantenimientoService.handleError(error, 'marcarOperativa');
    }
  },

  /**
   * Obtiene estadísticas de mantenimiento
   */
  obtenerEstadisticas: async (faena = 'todas', periodo = 30) => {
    try {
      console.log('📊 Obteniendo estadísticas de mantenimiento:', { faena, periodo });

      const response = await axios.get(`${mantenimientoService.baseURL}/estadisticas`, {
        params: { faena, periodo },
        timeout: 10000
      });

      console.log('✅ Estadísticas obtenidas:', response.data);
      return response.data;

    } catch (error) {
      const errorResponse = mantenimientoService.handleError(error, 'obtenerEstadisticas');
      // Devolver datos por defecto en caso de error
      return {
        ...errorResponse,
        data: {
          mantenimientos_realizados: 0,
          costos_mantenimiento: 0,
          eficiencia_mantenimiento: 0
        }
      };
    }
  },

  /**
   * Validación de datos de mantenimiento
   */
  validarDatosMantenimiento: (datos) => {
    const errores = [];

    if (!datos.id_maquina) {
      errores.push('La máquina es requerida');
    }

    if (!datos.descripcion || datos.descripcion.trim().length < 10) {
      errores.push('La descripción debe tener al menos 10 caracteres');
    }

    if (datos.costo && (isNaN(datos.costo) || datos.costo < 0)) {
      errores.push('El costo debe ser un número positivo');
    }

    if (datos.proximo_mantenimiento && (isNaN(datos.proximo_mantenimiento) || datos.proximo_mantenimiento <= 0)) {
      errores.push('El próximo mantenimiento debe ser un número positivo');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  },

  /**
   * Utilidades de formato y cálculo
   */
  formatearMedicion: (valor, tipoMedicion) => {
    const unidad = tipoMedicion === 'Horometro' ? 'h' : 'km';
    return `${parseFloat(valor || 0).toFixed(1)} ${unidad}`;
  },

  obtenerColorPorcentaje: (porcentaje) => {
    if (porcentaje >= 100) return '#dc2626'; // Rojo crítico
    if (porcentaje >= 90) return '#ca8a04';  // Amarillo advertencia
    if (porcentaje >= 75) return '#2563eb';  // Azul precaución
    return '#16a34a'; // Verde normal
  },

  calcularEstado: (maquina) => {
    const porcentajeUso = maquina.porcentaje_uso || 0;
    
    if (porcentajeUso >= 100) {
      return {
        estado: 'critico',
        mensaje: 'Mantenimiento requerido inmediatamente',
        color: '#dc2626',
        prioridad: 'alta'
      };
    } else if (porcentajeUso >= 90) {
      return {
        estado: 'advertencia',
        mensaje: 'Mantenimiento próximo',
        color: '#ca8a04',
        prioridad: 'media'
      };
    } else {
      return {
        estado: 'normal',
        mensaje: 'En condiciones normales',
        color: '#16a34a',
        prioridad: 'baja'
      };
    }
  },

  /**
   * Diagnóstico completo del sistema
   */
  diagnosticarSistema: async () => {
    console.log('🔍 Iniciando diagnóstico del sistema...');
    
    const diagnostico = {
      timestamp: new Date().toISOString(),
      tests: [],
      problemas: [],
      recomendaciones: []
    };

    // Test 1: Conectividad básica
    try {
      const testConexion = await mantenimientoService.testConnection();
      diagnostico.tests.push({
        nombre: 'Conectividad API',
        resultado: testConexion.status === 'success' ? 'PASS' : 'FAIL',
        detalle: testConexion.message
      });
      
      if (testConexion.status !== 'success') {
        diagnostico.problemas.push('No se puede conectar con la API de mantenimiento');
        diagnostico.recomendaciones.push('Verificar que el servidor Laravel esté ejecutándose');
      }
    } catch (error) {
      diagnostico.tests.push({
        nombre: 'Conectividad API',
        resultado: 'ERROR',
        detalle: error.message
      });
    }

    // Test 2: Endpoint principal
    try {
      const testMaquinas = await mantenimientoService.obtenerEstadoMaquinas();
      diagnostico.tests.push({
        nombre: 'Endpoint Máquinas',
        resultado: testMaquinas.status === 'success' ? 'PASS' : 'FAIL',
        detalle: `${testMaquinas.data?.length || 0} máquinas encontradas`
      });
      
      if (testMaquinas.status !== 'success') {
        diagnostico.problemas.push('Error al obtener datos de máquinas');
        diagnostico.recomendaciones.push('Verificar MantenimientoController y base de datos');
      }
    } catch (error) {
      diagnostico.tests.push({
        nombre: 'Endpoint Máquinas',
        resultado: 'ERROR',
        detalle: error.message
      });
    }

    // Test 3: Base de datos
    try {
      const testDB = await axios.get('/api/check-databases');
      diagnostico.tests.push({
        nombre: 'Base de Datos',
        resultado: 'PASS',
        detalle: 'Conexión a BD establecida'
      });
    } catch (error) {
      diagnostico.tests.push({
        nombre: 'Base de Datos',
        resultado: 'FAIL',
        detalle: 'No se puede verificar la conexión a BD'
      });
      diagnostico.problemas.push('Problema de conexión con la base de datos');
      diagnostico.recomendaciones.push('Verificar configuración de base de datos en .env');
    }

    console.log('🔍 Diagnóstico completado:', diagnostico);
    return diagnostico;
  }
};

export default mantenimientoService;