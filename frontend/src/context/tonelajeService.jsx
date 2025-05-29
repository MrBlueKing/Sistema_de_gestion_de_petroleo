// src/services/TonelajeService.js - VERSION CORREGIDA
import axios from "../lib/axios";

const tonelajeService = {
  /**
   * Obtiene faenas disponibles
   * GET /api/faenas?fecha=2025-05-21
   */
  getFaenasDisponibles: async (fecha = null) => {
    try {
      if (!fecha) {
        fecha = tonelajeService.getFechaHoy();
      }

      console.log('🏭 Obteniendo faenas para:', fecha);

      const response = await axios.get(`/api/faenas?fecha=${fecha}`);

      if (response.data && response.data.status === 'success') {
        console.log('✅ Faenas obtenidas:', response.data.data);
        return {
          status: 'success',
          data: response.data.data,
          message: `${response.data.data.length} faenas disponibles`
        };
      } else {
        return {
          status: 'warning',
          data: [],
          message: 'No se encontraron faenas disponibles'
        };
      }
    } catch (error) {
      console.error('❌ Error al cargar faenas:', error);
      return {
        status: 'error',
        data: [],
        message: 'Error al conectar con el servidor'
      };
    }
  },

  /**
   * Obtiene TODOS los padrones de una faena (sin importar si tienen registros)
   * GET /api/faenas/{idFaena}/padrones (sin filtro de fecha)
   */
  getPadronesByFaena: async (idFaena, fecha = null) => {
  try {
    console.log(`🚛 Obteniendo padrones para faena: ${idFaena}`);
    
    // Usar la fecha actual si no se proporciona
    if (!fecha) {
      fecha = tonelajeService.getFechaHoy();
    }
    
    // CAMBIO: Usar tu ruta existente
    const response = await axios.get(`/api/faenasTon/${idFaena}/padrones?fecha=${fecha}`);
    
    if (response.data && response.data.status === 'success') {
      console.log('✅ Padrones obtenidos:', response.data.data);
      
      return {
        status: 'success',
        data: response.data.data,
        message: `${response.data.data.length} padrones obtenidos para faena ${idFaena}`,
        fecha: fecha
      };
    } else {
      return {
        status: 'warning',
        data: [],
        message: 'No se encontraron padrones para esta faena'
      };
    }
  } catch (error) {
    console.error('❌ Error al obtener padrones:', error);
    
    return {
      status: 'error',
      data: [],
      message: error.response?.data?.message || 'Error al obtener padrones'
    };
  }
},

  /**
   * Método alternativo si la ruta principal no funciona
   */
  getPadronesAlternativos: async (idFaena, fecha) => {
    try {
      console.log(`🔄 Intentando método alternativo para faena: ${idFaena}`);
      
      // Intentar obtener padrones sin fecha
      const response = await axios.get(`/api/padrones?id_faena=${idFaena}`);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ Padrones obtenidos (método alternativo):', response.data.data);
        
        // Obtener registros existentes para la fecha
        const registrosResponse = await tonelajeService.getTonelajesDelDia(fecha);
        
        // Combinar padrones con registros
        const padronesConRegistros = response.data.data.map(padron => {
          const registroExistente = registrosResponse.data?.find(
            registro => registro.id_padron === padron.id_padron
          );
          
          return {
            ...padron,
            registro_actual: registroExistente || null,
            tiene_registro: !!registroExistente,
            fecha_consulta: fecha
          };
        });
        
        return {
          status: 'success',
          data: padronesConRegistros,
          message: `${padronesConRegistros.length} padrones obtenidos (método alternativo)`,
          fecha: fecha
        };
      }
      
      return {
        status: 'error',
        data: [],
        message: 'No se pudieron obtener los padrones'
      };
    } catch (error) {
      console.error('❌ Error en método alternativo:', error);
      return {
        status: 'error',
        data: [],
        message: 'Error al obtener padrones por método alternativo'
      };
    }
  },

  /**
   * Obtiene padrones de una faena (mantener compatibilidad)
   */
  getPadronesDisponiblesByFaena: async (faenaId, fecha = null) => {
    return await tonelajeService.getPadronesByFaena(faenaId, fecha);
  },

  /**
   * Registra un nuevo tonelaje
   * POST /api/tonelajes
   */
  registrarTonelaje: async (datos) => {
    try {
      console.log('📝 Registrando tonelaje:', datos);

      // Validación básica
      if (!datos.id_padron || !datos.tonelaje || parseFloat(datos.tonelaje) <= 0) {
        return {
          status: 'error',
          message: 'Datos inválidos: se requiere padrón y tonelaje > 0'
        };
      }

      const datosLimpios = {
        id_padron: parseInt(datos.id_padron),
        fecha_produccion: datos.fecha_produccion,
        tonelaje: parseFloat(datos.tonelaje),
        viajes: parseInt(datos.viajes) || 0,
        ley: datos.ley ? parseFloat(datos.ley) : null
      };

      console.log('📤 Enviando al servidor:', datosLimpios);

      const response = await axios.post('/api/tonelajes', datosLimpios);

      if (response.data && response.data.status === 'success') {
        console.log('✅ Tonelaje registrado:', response.data.data);
        return {
          status: 'success',
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          status: 'error',
          message: response.data?.message || 'Error al procesar el registro'
        };
      }
    } catch (error) {
      console.error('❌ Error al registrar:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        return {
          status: 'error',
          message: error.response.data?.message || 'Error del servidor'
        };
      }

      return {
        status: 'error',
        message: `Error de conexión: ${error.message}`
      };
    }
  },

  /**
   * Obtiene registros del día
   * GET /api/registros?fecha=2025-05-21
   */
  getTonelajesDelDia: async (fecha = null) => {
    try {
      if (!fecha) {
        fecha = tonelajeService.getFechaHoy();
      }

      console.log('📊 Obteniendo registros del día:', fecha);

      const response = await axios.get(`/api/registros?fecha=${fecha}`);

      if (response.data && response.data.status === 'success') {
        console.log('✅ Registros obtenidos:', response.data.resumen_general);
        return {
          status: 'success',
          data: response.data.data,
          resumen: response.data.resumen_general,
          message: `Registros obtenidos para ${fecha}`
        };
      } else {
        return {
          status: 'warning',
          data: [],
          message: 'No se encontraron registros'
        };
      }
    } catch (error) {
      console.error('❌ Error al obtener registros:', error);
      return {
        status: 'error',
        data: [],
        message: 'Error al obtener registros del día'
      };
    }
  },

  // ... resto de métodos sin cambios

  /**
   * Actualiza un registro (solo permitido una vez)
   * PUT /api/tonelajes/{id}
   */
  actualizarTonelaje: async (tonelajeId, datos, motivo) => {
    try {
      console.log('🔄 Actualizando tonelaje:', tonelajeId);

      const datosActualizacion = {
        tonelaje: parseFloat(datos.tonelaje),
        ley: datos.ley ? parseFloat(datos.ley) : null,
        viajes: parseInt(datos.viajes),
        motivo: motivo
      };

      const response = await axios.put(`/api/tonelajes/${tonelajeId}`, datosActualizacion);

      if (response.data && response.data.status === 'success') {
        console.log('✅ Registro actualizado');
        return {
          status: 'success',
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          status: 'error',
          message: response.data?.message || 'Error al actualizar'
        };
      }
    } catch (error) {
      console.error('❌ Error al actualizar:', error);
      
      if (error.response && error.response.status === 403) {
        return {
          status: 'error',
          message: 'Este registro ya fue modificado anteriormente y no puede ser editado nuevamente'
        };
      }
      
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al actualizar'
      };
    }
  },

  /**
   * Verifica si un registro puede ser editado
   * GET /api/tonelajes/{id}/puede-editar
   */
  verificarPuedeEditar: async (tonelajeId) => {
    try {
      console.log('🔍 Verificando si puede editar:', tonelajeId);

      const response = await axios.get(`/api/tonelajes/${tonelajeId}/puede-editar`);

      if (response.data && response.data.status === 'success') {
        return {
          status: 'success',
          puede_editar: response.data.puede_editar,
          fue_modificado: response.data.fue_modificado,
          fecha_modificacion: response.data.fecha_modificacion,
          mensaje: response.data.mensaje
        };
      } else {
        return {
          status: 'error',
          puede_editar: false,
          mensaje: 'Error al verificar permisos'
        };
      }
    } catch (error) {
      console.error('❌ Error al verificar permisos:', error);
      return {
        status: 'error',
        puede_editar: false,
        mensaje: 'Error al verificar permisos de edición'
      };
    }
  },

  /**
   * Obtiene historial completo
   * GET /api/tonelajes/{id}/historial
   */
  getHistorialAuditoria: async (tonelajeId) => {
    try {
      console.log('📋 Obteniendo historial para:', tonelajeId);

      const response = await axios.get(`/api/tonelajes/${tonelajeId}/historial`);

      if (response.data && response.data.status === 'success') {
        return {
          status: 'success',
          data: response.data.data || [],
          registro_actual: response.data.registro_actual,
          message: 'Historial obtenido'
        };
      } else {
        return {
          status: 'warning',
          data: [],
          message: 'No hay historial disponible'
        };
      }
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      return {
        status: 'error',
        data: [],
        message: 'Error al obtener historial'
      };
    }
  },

  /**
   * Obtiene un registro específico
   * GET /api/tonelajes/{id}
   */
  getTonelaje: async (tonelajeId) => {
    try {
      console.log('📄 Obteniendo tonelaje:', tonelajeId);

      const response = await axios.get(`/api/tonelajes/${tonelajeId}`);

      if (response.data && response.data.status === 'success') {
        return {
          status: 'success',
          data: response.data.data,
          message: 'Registro obtenido'
        };
      } else {
        return {
          status: 'error',
          message: 'Registro no encontrado'
        };
      }
    } catch (error) {
      console.error('❌ Error al obtener registro:', error);
      return {
        status: 'error',
        message: 'Error al obtener registro'
      };
    }
  },

  /**
   * Elimina un registro
   * DELETE /api/tonelajes/{id}
   */
  eliminarTonelaje: async (tonelajeId) => {
    try {
      console.log('🗑️ Eliminando tonelaje:', tonelajeId);

      const response = await axios.delete(`/api/tonelajes/${tonelajeId}`);

      if (response.data && response.data.status === 'success') {
        return {
          status: 'success',
          message: response.data.message
        };
      } else {
        return {
          status: 'error',
          message: response.data?.message || 'Error al eliminar'
        };
      }
    } catch (error) {
      console.error('❌ Error al eliminar:', error);
      
      if (error.response && error.response.status === 403) {
        return {
          status: 'error',
          message: 'No se puede eliminar un registro que ya fue modificado'
        };
      }
      
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al eliminar'
      };
    }
  },

  /**
   * Utilidades de fecha
   */
  formatearFecha: (fecha) => {
    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0];
    } else if (typeof fecha === 'string') {
      try {
        const d = new Date(fecha);
        if (isNaN(d.getTime())) {
          return '';
        }
        return d.toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    }
    return '';
  },

  getFechaAyer: () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return tonelajeService.formatearFecha(ayer);
  },

  getFechaHoy: () => {
    return tonelajeService.formatearFecha(new Date());
  },

  /**
   * Calcula métricas básicas
   */
  calcularMetricas: (datos) => {
    const toneladas = parseFloat(datos.tonelaje || datos.toneladas_extraidas) || 0;
    const viajes = parseInt(datos.viajes) || 0;
    
    const rendimiento = viajes > 0 ? toneladas / viajes : 0;
    
    return {
      rendimiento: rendimiento,
      rendimiento_string: `${rendimiento.toFixed(2)} ton/viaje`,
      eficiencia: rendimiento >= 20 ? 'Buena' : rendimiento >= 10 ? 'Regular' : 'Baja'
    };
  },

  /**
   * Valida datos antes de enviar
   */
  validarDatos: (datos) => {
    const errores = [];

    if (!datos.id_padron) {
      errores.push('El padrón es obligatorio');
    }

    if (!datos.fecha_produccion) {
      errores.push('La fecha de producción es obligatoria');
    }

    if (!datos.tonelaje || parseFloat(datos.tonelaje) <= 0) {
      errores.push('El tonelaje debe ser mayor a 0');
    }

    if (datos.ley && (parseFloat(datos.ley) < 0 || parseFloat(datos.ley) > 100)) {
      errores.push('La ley debe estar entre 0 y 100');
    }

    if (datos.viajes && parseInt(datos.viajes) < 0) {
      errores.push('Los viajes no pueden ser negativos');
    }

    return {
      valido: errores.length === 0,
      errores: errores
    };
  },

  /**
   * Utilidades de estado de registro
   */
  getEstadoRegistro: (registro) => {
    if (!registro) return 'no_registrado';
    
    if (registro.fue_modificado) {
      return 'modificado';
    } else {
      return 'registrado';
    }
  },

  getTextoEstado: (estado) => {
    const estados = {
      'no_registrado': 'Sin registrar',
      'registrado': 'Registrado',
      'modificado': 'Modificado (no editable)'
    };
    
    return estados[estado] || 'Estado desconocido';
  },

  getColorEstado: (estado) => {
    const colores = {
      'no_registrado': 'gray',
      'registrado': 'green',
      'modificado': 'orange'
    };
    
    return colores[estado] || 'gray';
  }
};

export default tonelajeService;