// src/context/PermisosMaquinas.js
import axios from '../lib/axios';

class PermisosMaquinasService {
  /**
   * Obtener todas las máquinas con sus permisos (LEFT JOIN)
   */
  obtenerMaquinasConPermisos = async () => {
    try {      
      const response = await axios.get('/api/maquinas-permisos');
    
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total_maquinas
        };
      } else {
        throw new Error(response.data?.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error obteniendo máquinas:', error);
      throw this.handleError(error, 'obtener máquinas con permisos');
    }
  };

  /**
   * Obtener todas las faenas disponibles
   */
  obtenerFaenas = async () => {
    try {      
      const response = await axios.get('/api/maquinas-permisos/faenas');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total_faenas
        };
      } else {
        throw new Error(response.data?.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error obteniendo faenas:', error);
      throw this.handleError(error, 'obtener faenas');
    }
  };

  /**
   * Transferir máquina entre faenas (para drag & drop)
   */
  transferirMaquina = async (idMaquina, faenaOrigen, faenaDestino) => {
    try {
      const payload = {
        id_maquina: idMaquina,
        faena_origen: faenaOrigen === 'sin-permisos' ? null : parseInt(faenaOrigen),
        faena_destino: faenaDestino === 'sin-permisos' ? null : parseInt(faenaDestino)
      };

      const response = await axios.post('/api/maquinas-permisos/transferir', payload);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message,
          accion: response.data.accion
        };
      } else {
        throw new Error(response.data?.message || 'Error en la transferencia');
      }
    } catch (error) {
      console.error('❌ Error en transferencia:', error);
      throw this.handleError(error, 'transferir máquina');
    }
  };

  /**
   * Transferir múltiples máquinas (batch)
   */
  transferirMaquinasBatch = async (transferencias) => {
    try {
      const response = await axios.post('/api/maquinas-permisos/transferir-batch', {
        transferencias: transferencias
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message,
          transferencias_exitosas: response.data.transferencias_exitosas || 0,
          errores: response.data.errores || []
        };
      } else {
        throw new Error(response.data?.message || 'Error en las transferencias');
      }
    } catch (error) {
      console.error('❌ Error en transferencias batch:', error);
      throw this.handleError(error, 'transferir máquinas batch');
    }
  };

  /**
   * Actualizar todos los permisos de una máquina (para selector múltiple)
   */
  actualizarPermisos = async (idMaquina, faenasSeleccionadas) => {
    try {
      const payload = {
        id_maquina: idMaquina,
        faenas: faenasSeleccionadas.map(f => parseInt(f))
      };

      const response = await axios.put('/api/maquinas-permisos/actualizar', payload);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message,
          total_permisos: response.data.total_permisos
        };
      } else {
        throw new Error(response.data?.message || 'Error actualizando permisos');
      }
    } catch (error) {
      console.error('❌ Error actualizando permisos:', error);
      throw this.handleError(error, 'actualizar permisos');
    }
  };

  /**
   * Obtener estadísticas generales
   */
  obtenerEstadisticas = async () => {
    try {
      const response = await axios.get('/api/maquinas-permisos/estadisticas');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data?.message || 'Error obteniendo estadísticas');
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw this.handleError(error, 'obtener estadísticas');
    }
  };

  /**
   * Manejo centralizado de errores (similar a tus otros servicios)
   */
  handleError = (error, context = '') => {
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
      } else if (statusCode === 422) {
        message = 'Datos de entrada inválidos. Verifica los parámetros enviados.';
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
    
    const customError = new Error(message);
    customError.statusCode = statusCode;
    customError.originalError = error;
    
    return customError;
  };
}

// Exportar instancia única
const permisosMaquinasService = new PermisosMaquinasService();
export default permisosMaquinasService;