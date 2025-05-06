// src/services/ApiService.js
import axios from '../lib/axios';

// Servicio para consumo de diésel (mantenemos el original)
const consumoService = {
  // Obtiene consumo por maquinaria
  getTopEquipos: async (faena = 'todas') => {
    try {
      const response = await axios.get(`/api/informes-kpi?tipo=consumo_equipos&faena=${faena}`);
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        console.warn('La respuesta de la API no contiene datos en el formato esperado');
        return [];
      }
    } catch (error) {
      console.error('Error al obtener consumo por equipos:', error);
      throw error;
    }
  },

  // Obtiene consumo por faena
  getConsumoFaenas: async () => {
    try {
      const response = await axios.get('/api/informes-kpi?tipo=consumo_faenas');
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        console.warn('La respuesta de la API no contiene datos en el formato esperado');
        return [];
      }
    } catch (error) {
      console.error('Error al obtener consumo por faenas:', error);
      throw error;
    }
  },

  // Obtiene tendencia mensual de consumo
  getConsumoMensual: async (faena = 'todas') => {
    try {
      const response = await axios.get(`/api/informes-kpi?tipo=consumo_mensual&faena=${faena}`);
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        console.warn('La respuesta de la API no contiene datos en el formato esperado');
        return [];
      }
    } catch (error) {
      console.error('Error al obtener consumo mensual:', error);
      throw error;
    }
  },

  // Obtiene KPI principales
  getKpisConsumo: async (faena = 'todas') => {
    try {
      const response = await axios.get(`/api/informes-kpi?tipo=kpis_consumo&faena=${faena}`);
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        console.warn('La respuesta de la API no contiene datos en el formato esperado');
        return null;
      }
    } catch (error) {
      console.error('Error al obtener KPIs de consumo:', error);
      throw error;
    }
  },
};

// Servicio para gerencia - VERSIÓN ACTUALIZADA
const gerenteService = {
  // Obtiene KPIs para dashboard gerencial
  getKpisGerente: async (periodo = 'mensual', faena = 'todas') => {
    try {
      // Obtener los KPIs históricos desde el backend
      const response = await axios.get(`/api/informes-kpi/dashboard?periodo=${periodo}&faena=${faena}`);
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      }
      
      // Si no hay datos del backend, intentamos obtener valores de entrada directamente
      const valEntradaUrl = `/api/kpi-valores-entrada?periodo=${periodo}&faena=${faena}`;
      const valEntrada = await axios.get(valEntradaUrl);

      if (!valEntrada.data || (Array.isArray(valEntrada.data) && valEntrada.data.length === 0)) {
        return {
          status: 'warning',
          message: 'No hay datos disponibles para los criterios seleccionados',
          data: [] 
        };
      }

      // Tomamos el valor más reciente (asumiendo que están ordenados)
      const ultimoValor = Array.isArray(valEntrada.data) 
        ? valEntrada.data[0] 
        : valEntrada.data;

      // Calculamos KPIs basados en estos valores
      return gerenteService.calcularKpisLocales(ultimoValor, periodo, faena);
    } catch (error) {
      console.error('Error al obtener KPIs gerenciales:', error);
      
      return {
        status: 'error',
        message: 'No fue posible obtener los KPIs. Intente nuevamente.',
        data: []
      };
    }
  },

  // Calcula KPIs en el frontend con el último valor de entrada disponible (método de respaldo)
  calcularKpisLocales: (valoresEntrada, periodo, faena) => {
    try {
      if (!valoresEntrada) {
        return {
          status: 'warning',
          message: 'No hay datos para calcular',
          data: []
        };
      }

      // Calculamos KPIs básicos con los valores recibidos
      const costoTotal = valoresEntrada.combustible_consumido * valoresEntrada.precio_combustible;
      
      const kpisCalculados = {
        consumo_total: valoresEntrada.combustible_consumido,
        toneladas: valoresEntrada.toneladas_extraidas,
        concentracion: valoresEntrada.ley_mineral,
        camionadas: valoresEntrada.numero_viajes,
        costoTotal: costoTotal,
        costoTonelada: valoresEntrada.toneladas_extraidas > 0 
          ? costoTotal / valoresEntrada.toneladas_extraidas 
          : 0,
        costoHora: valoresEntrada.horas_trabajadas > 0 
          ? costoTotal / valoresEntrada.horas_trabajadas 
          : 0,
        costoKm: valoresEntrada.kilometros_recorridos > 0 
          ? costoTotal / valoresEntrada.kilometros_recorridos 
          : 0,
        rendimiento: valoresEntrada.rendimiento_base,
        periodo: periodo,
        faena: faena,
      };

      return {
        status: 'success',
        data: kpisCalculados
      };
    } catch (error) {
      console.error('Error al calcular KPIs locales:', error);
      return {
        status: 'error',
        message: 'Error en cálculo de KPIs',
        data: []
      };
    }
  },

  // Calcula KPIs con los valores ingresados por el usuario en la calculadora
  calcularKpis: async (datos) => {
    try {
      // Enviar al backend para cálculo y almacenamiento
      const response = await axios.post('/api/calcular-kpis', datos);
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      }
      
      throw new Error('Respuesta del servidor no válida');
    } catch (backendError) {
      console.error('Error al guardar KPIs en el backend:', backendError);
      
      // Si falla la llamada al endpoint de guardado, intentamos el endpoint de solo cálculo
      try {
        console.info('Intentando calcular sin guardar...');
        const calcResponse = await axios.post('/api/calcular-kpis-sin-guardar', datos);
        if (calcResponse.data && calcResponse.data.status === 'success') {
          return {
            ...calcResponse.data,
            message: 'KPIs calculados (sin guardar en base de datos)'
          };
        }
      } catch (calcError) {
        console.warn('También falló el cálculo sin guardar:', calcError);
      }
      
      // Si todo falla, calculamos en el frontend como último recurso
      console.info('Calculando KPIs localmente...');
      const { valores_entrada } = datos;
      
      if (!valores_entrada) {
        throw new Error('No se proporcionaron valores de entrada');
      }
      
      // Calculamos el costo total del combustible
      const costoTotal = valores_entrada.litros_petroleo * valores_entrada.costo_litro;
      
      // Calculamos los KPIs básicos
      const kpisCalculados = {
        toneladas: valores_entrada.toneladas,
        concentracion: valores_entrada.concentracion,
        camionadas: valores_entrada.camionadas,
        costoTotal: costoTotal,
        costoTonelada: valores_entrada.toneladas > 0 ? costoTotal / valores_entrada.toneladas : 0,
        costoHora: valores_entrada.horas > 0 ? costoTotal / valores_entrada.horas : 0,
        costoKm: valores_entrada.kilometros > 0 ? costoTotal / valores_entrada.kilometros : 0,
      };
      
      return {
        status: 'success',
        message: 'KPIs calculados localmente (no guardados en base de datos)',
        data: kpisCalculados,
        cambios: {
          produccion: '+0%',
          camionadas: '+0%'
        }
      };
    }
  },
  
  // Verificar permiso de actualización
  verificarPermisoActualizacion: async () => {
    try {
      const response = await axios.get('/api/kpi-valores-entrada/verificar-permiso');
      return response.data;
    } catch (error) {
      console.error('Error al verificar permisos de actualización:', error);
      // Si falla, permitimos la actualización por defecto
      return {
        puedeActualizar: true,
        ultimaActualizacion: null,
        tiempoRestante: 0
      };
    }
  },
  
  // Obtener historial de actualizaciones
  obtenerHistorialActualizaciones: async (params = {}) => {
    try {
      const response = await axios.get('/api/kpi-valores-entrada/historial', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de actualizaciones:', error);
      return {
        status: 'error',
        message: 'No se pudo obtener el historial',
        data: []
      };
    }
  },
  
  // Generar informes
  generarInforme: async (params = {}) => {
    try {
      const response = await axios.get('/api/informes-kpi/generar', {
        params,
        responseType: 'blob'
      });
      
      // Crear un objeto URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crear un elemento <a> para descargar
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre del archivo basado en parámetros
      const extension = params.formato === 'excel' ? 'xlsx' : 'pdf';
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Informe_${params.tipo || 'kpi'}_${params.periodo || 'mensual'}_${fechaActual}.${extension}`;
      
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return {
        status: 'success',
        message: 'Informe generado correctamente'
      };
    } catch (error) {
      console.error('Error al generar informe:', error);
      return {
        status: 'error',
        message: 'No fue posible generar el informe solicitado'
      };
    }
  },
  
  // Obtener datos históricos para gráficos
  getHistoricoKpi: async (codigoKpi, periodo = 'mensual', faena = 'todas', limite = 12) => {
    try {
      const response = await axios.get('/api/kpi-historico', {
        params: {
          codigo_kpi: codigoKpi,
          periodo,
          faena,
          limite
        }
      });
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error al obtener histórico para KPI ${codigoKpi}:`, error);
      return [];
    }
  }
};

export { consumoService, gerenteService };  