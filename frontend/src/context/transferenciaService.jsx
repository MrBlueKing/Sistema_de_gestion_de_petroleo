// services/transferenciaService.js
import axios from '../lib/axios';

class TransferenciaService {
  /**
 * Registrar transferencia de estanque fijo a móvil
 * @param {Object} transferenciaData - Datos de la transferencia
 * @returns {Promise} Response de la API
 */
async registrarFijoAMovil(transferenciaData) {
  try {
    console.log('📤 Enviando transferencia fijo→móvil:', transferenciaData);
    
    // 🆕 VALIDACIÓN Y CONVERSIÓN DE NUMERALES
    const numeralInicial = parseFloat(transferenciaData.numeral_inicial);
    const numeralFinal = parseFloat(transferenciaData.numeral_final);
    
    console.log('🔍 Debug numerales en servicio:', {
      original_inicial: transferenciaData.numeral_inicial,
      original_final: transferenciaData.numeral_final,
      convertido_inicial: numeralInicial,
      convertido_final: numeralFinal,
      isValid_inicial: !isNaN(numeralInicial),
      isValid_final: !isNaN(numeralFinal)
    });
    
    // Preparar datos para el backend siguiendo la estructura del controlador
    const payload = {
      id_usuario: transferenciaData.userInfo?.id,
      id_estanque_fijo: transferenciaData.modo_multiple_origen 
        ? transferenciaData.estanques_origen[0] // Por ahora tomar el primero, después expandir para múltiple
        : transferenciaData.estanque_origen,
      id_estanque_movil: transferenciaData.estanque_destino,
      id_faena: transferenciaData.id_faena,
      
      // 🆕 NUMERALES CONVERTIDOS A NÚMEROS
      numeral_inicial: numeralInicial,
      numeral_final: numeralFinal,
      
      // 🆕 MARCAR COMO TRANSFERENCIA SIMPLE PARA QUE SE GUARDE EN DETALLES
      es_transferencia_multiple: false, // Aunque sea simple, queremos que se guarde en detalles
      litros_desde_este_estanque: transferenciaData.litros_calculados,
      
      // Observaciones
      observaciones: transferenciaData.observaciones || null
    };

    console.log('📋 Payload preparado (transferencia simple):', payload);

    // Validar que los numerales sean válidos antes del envío
    if (isNaN(numeralInicial) || isNaN(numeralFinal)) {
      throw new Error('Los numerales deben ser números válidos');
    }

    if (numeralFinal <= numeralInicial) {
      throw new Error('El numeral final debe ser mayor que el inicial');
    }

    // 🎯 USAR LA RUTA QUE YA TIENES CONFIGURADA
    const response = await axios.post('/api/trasvasijes/fijo-a-movil', payload);
    
    console.log('✅ Transferencia simple registrada exitosamente:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error registrando transferencia simple:', error);
    
    // Formatear error para el frontend
    let errorMessage = 'Error de conexión con el servidor';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      if (typeof error.response.data.errors === 'object') {
        const errores = Object.values(error.response.data.errors).flat();
        errorMessage = errores.join(', ');
      } else {
        errorMessage = error.response.data.errors;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}
async registrarMultipleFijoAMovil(transferenciaData) {
  try {
    console.log('📤 Enviando transferencia múltiple fijo→móvil:', transferenciaData);
    
    // 🆕 VALIDACIÓN DE NUMERALES PARA MÚLTIPLES
    const numeralInicialBase = parseFloat(transferenciaData.numeral_inicial);
    const numeralFinalBase = parseFloat(transferenciaData.numeral_final);
    const litrosTotales = parseFloat(transferenciaData.litros_calculados);
    
    if (isNaN(numeralInicialBase) || isNaN(numeralFinalBase)) {
      throw new Error('Los numerales deben ser números válidos');
    }
    
    // 🆕 NUEVA ESTRATEGIA: Usar el endpoint existente correctamente
    const transferencias = [];
    let trasvasijePrincipalId = null;
    
    // Ordenar estanques por cantidad de litros (mayor a menor) para el proceso
    const estanquesOrdenados = Object.entries(transferenciaData.distribucion_litros)
      .filter(([id, litros]) => litros > 0)
      .sort(([,a], [,b]) => b - a);
    
    console.log('📋 Estanques a procesar (ordenados por litros):', estanquesOrdenados.map(([id, litros]) => `Estanque ${id}: ${litros}L`));
    
    for (let i = 0; i < estanquesOrdenados.length; i++) {
      const [idEstanque, litros] = estanquesOrdenados[i];
      const esPrimero = i === 0;
      
      // 🔥 CORRECCIÓN FINAL: Numerales que pasen la validación del backend
      let numeralInicial, numeralFinal;
      
      if (esPrimero) {
        // ✅ PRINCIPAL: Usar numerales totales (backend creará tabla principal + detalle)
        numeralInicial = numeralInicialBase;  // Ej: 0
        numeralFinal = numeralFinalBase;      // Ej: 20
      } else {
        // ✅ DETALLES: Usar numerales que pasen validación pero serán ignorados
        // El backend usará litros_desde_este_estanque en lugar de estos numerales
        numeralInicial = 0;
        numeralFinal = parseFloat(litros); // Para pasar validación: 0 → litros del estanque
      }
      
      const payload = {
        id_usuario: transferenciaData.userInfo?.id,
        id_estanque_fijo: parseInt(idEstanque),
        id_estanque_movil: transferenciaData.estanque_destino,
        id_faena: transferenciaData.id_faena,
        
        // 📊 NUMERALES (solo importan para el primero)
        numeral_inicial: numeralInicial,
        numeral_final: numeralFinal,
        
        // 🔥 CAMPOS CLAVE PARA TRANSFERENCIAS MÚLTIPLES
        es_transferencia_multiple: true,
        litros_desde_este_estanque: parseFloat(litros), // 🎯 ESTE ES EL CAMPO CLAVE
        
        // 🔗 REFERENCIA AL PRINCIPAL (solo para detalles)
        ...(trasvasijePrincipalId ? {
          id_trasvasije_principal: trasvasijePrincipalId
        } : {}),
        
        observaciones: esPrimero 
          ? `${transferenciaData.observaciones || ''} (Transferencia múltiple: ${litros}L de ${litrosTotales}L total desde ${estanquesOrdenados.length} estanques - Principal)`.trim()
          : `${transferenciaData.observaciones || ''} (Transferencia múltiple: ${litros}L de ${litrosTotales}L total - Detalle ${i})`.trim()
      };
      
      console.log(`📋 Payload para estanque ${idEstanque} (${esPrimero ? 'PRINCIPAL' : 'DETALLE ' + i}):`, {
        id_estanque_fijo: payload.id_estanque_fijo,
        numeral_inicial: payload.numeral_inicial,
        numeral_final: payload.numeral_final,
        litros_desde_este_estanque: payload.litros_desde_este_estanque,
        es_transferencia_multiple: payload.es_transferencia_multiple,
        id_trasvasije_principal: payload.id_trasvasije_principal || 'N/A (es el principal)',
        tipo: esPrimero ? 'PRINCIPAL' : 'DETALLE'
      });
      
      // 🔥 LLAMAR AL ENDPOINT EXISTENTE
      const response = await axios.post('/api/trasvasijes/fijo-a-movil', payload);
      
      // 🎯 GUARDAR ID DEL PRINCIPAL para los siguientes detalles
      if (esPrimero) {
        trasvasijePrincipalId = response.data.data.trasvasije.id_trasvasije;
        console.log('🎯 Trasvasije principal creado con ID:', trasvasijePrincipalId);
      }
      
      transferencias.push({
        estanque_id: idEstanque,
        litros: parseFloat(litros),
        tipo: esPrimero ? 'principal' : 'detalle',
        trasvasije_id: response.data.data.trasvasije?.id_trasvasije,
        detalle_id: response.data.data.detalle?.id_detalle,
        response: response.data
      });
      
      console.log(`✅ Procesado estanque ${idEstanque}: ${litros}L (${esPrimero ? 'Principal' : 'Detalle ' + i})`);
    }
    
    console.log('✅ Transferencia múltiple completada:', {
      trasvasije_principal_id: trasvasijePrincipalId,
      total_transferencias: transferencias.length,
      total_litros_esperados: litrosTotales,
      total_litros_distribuidos: estanquesOrdenados.reduce((sum, [,litros]) => sum + parseFloat(litros), 0)
    });
    
    return {
      success: true,
      message: 'Transferencia múltiple registrada exitosamente',
      data: {
        // 📊 DATOS PRINCIPALES
        trasvasije_principal_id: trasvasijePrincipalId,
        transferencias_procesadas: transferencias.length,
        
        // 📋 DETALLE DE CADA TRANSFERENCIA
        transferencias: transferencias,
        
        // 🎯 DATOS PARA EL UI (compatibilidad con versión anterior)
        trasvasije: transferencias[0]?.response?.data?.trasvasije, // Principal para compatibilidad
        estanques: transferencias[0]?.response?.data?.estanques,   // Datos de estanques
        
        // 🔍 INFORMACIÓN ADICIONAL
        resumen: {
          litros_totales: litrosTotales,
          estanques_origen: estanquesOrdenados.length,
          distribucion_procesada: Object.fromEntries(estanquesOrdenados),
          verificacion_litros: {
            esperados: litrosTotales,
            distribuidos: estanquesOrdenados.reduce((sum, [,litros]) => sum + parseFloat(litros), 0),
            coinciden: Math.abs(litrosTotales - estanquesOrdenados.reduce((sum, [,litros]) => sum + parseFloat(litros), 0)) < 0.01
          }
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error registrando transferencia múltiple:', error);
    
    let errorMessage = 'Error en transferencia múltiple';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      if (typeof error.response.data.errors === 'object') {
        const errores = Object.values(error.response.data.errors).flat();
        errorMessage = errores.join(', ');
      } else {
        errorMessage = error.response.data.errors;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}



  /**
   * Obtener historial de transferencias
   * @param {Object} filtros - Filtros para el historial
   * @returns {Promise} Lista de transferencias
   */
  async obtenerHistorial(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.id_faena) params.append('id_faena', filtros.id_faena);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      if (filtros.id_estanque) params.append('id_estanque', filtros.id_estanque);
      
      // 🎯 USAR LA RUTA QUE YA TIENES CONFIGURADA
      const response = await axios.get(`/api/trasvasijes?${params}`);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw new Error('Error al cargar historial de transferencias');
    }
  }

  /**
   * Obtener detalles de una transferencia específica
   * @param {string} tipo - Tipo de transferencia ('fijo-a-movil' o 'movil-a-fijo')
   * @param {number} id - ID de la transferencia
   * @returns {Promise} Detalles de la transferencia
   */
  async obtenerDetalle(tipo, id) {
    try {
      // 🎯 USAR LA RUTA QUE YA TIENES CONFIGURADA
      const response = await axios.get(`/api/trasvasijes/${tipo}/${id}`);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo detalle:', error);
      throw new Error('Error al cargar detalle de transferencia');
    }
  }

  /**
   * Obtener datos para formulario (estanques, etc.)
   * @returns {Promise} Datos del formulario
   */
  async obtenerDatosFormulario() {
    try {
      // 🎯 USAR LA RUTA QUE YA TIENES CONFIGURADA
      const response = await axios.get('/api/trasvasijes/datos-formulario');
      return response.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo datos formulario:', error);
      throw new Error('Error al cargar datos del formulario');
    }
  }

  /**
   * Obtener estadísticas de transferencias
   * @param {Object} filtros - Filtros para estadísticas
   * @returns {Promise} Estadísticas
   */
  async obtenerEstadisticas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.id_faena) params.append('id_faena', filtros.id_faena);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      
      // 🎯 USAR LA RUTA QUE YA TIENES CONFIGURADA
      const response = await axios.get(`/api/trasvasijes/estadisticas?${params}`);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error('Error al cargar estadísticas');
    }
  }

  /**
   * Validar transferencia antes de enviar
   * @param {Object} data - Datos a validar
   * @returns {Object} Resultado de validación
   */
  validarTransferencia(data) {
    const errores = [];
    
    console.log('🔍 Validando transferencia:', data);
    
    // Validaciones básicas
    if (!data.userInfo?.id) {
      errores.push('Usuario no identificado');
    }
    
    if (!data.estanque_destino) {
      errores.push('Debe seleccionar un estanque de destino');
    }
    
    if (!data.modo_multiple_origen && !data.estanque_origen) {
      errores.push('Debe seleccionar un estanque de origen');
    }
    
    if (data.modo_multiple_origen && (!data.distribucion_litros || Object.keys(data.distribucion_litros).length === 0)) {
      errores.push('Debe configurar la distribución de litros');
    }
    
    // 🆕 VALIDACIÓN MEJORADA DE NUMERALES
    const numeralInicial = parseFloat(data.numeral_inicial);
    const numeralFinal = parseFloat(data.numeral_final);
    
    if (!data.numeral_inicial || data.numeral_inicial.toString().trim() === '' || isNaN(numeralInicial)) {
      errores.push('Debe ingresar un numeral inicial válido');
    }
    
    if (!data.numeral_final || data.numeral_final.toString().trim() === '' || isNaN(numeralFinal)) {
      errores.push('Debe ingresar un numeral final válido');
    }
    
    if (!isNaN(numeralInicial) && !isNaN(numeralFinal) && numeralFinal <= numeralInicial) {
      errores.push('El numeral final debe ser mayor que el inicial');
    }
    
    if (!data.id_faena) {
      errores.push('Faena no identificada');
    }
    
    console.log('🔍 Resultado validación:', { valido: errores.length === 0, errores });
    
    return {
      valido: errores.length === 0,
      errores
    };
  }
}

export default new TransferenciaService();