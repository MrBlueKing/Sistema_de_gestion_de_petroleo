// src/services/ApiService.js - Versión actualizada
import axios from "../lib/axios";

const consumoService = {
  getTopEquipos: async (
    faena = "todas",
    desde = "",
    hasta = "",
    periodo = ""
  ) => {
    try {
      // Verifica las fechas y el periodo antes de la solicitud
      console.log(`Solicitando con los siguientes parámetros: 
        Faena: ${faena}, 
        Desde: ${desde}, 
        Hasta: ${hasta}, 
        Periodo: ${periodo}`);

      // Realiza la solicitud con el parámetro 'periodo' incluido
      const response = await axios.get(
        `/api/informes-kpi?tipo=consumo_equipos&faena=${faena}&periodo=${periodo}&desde=${desde}&hasta=${hasta}`
      );

      // Log de la respuesta para depuración
      console.log("Respuesta recibida:", response);

      // Verifica si la respuesta tiene datos dentro del objeto 'data'
      if (response && response.data && response.data.data) {
        console.log("Datos de respuesta:", response.data.data);
        return response.data.data; // Retorna los datos obtenidos
      }

      return null; // Si no hay datos, retorna null
    } catch (error) {
      console.error("Error al obtener consumo por equipos:", error);
      throw error; // Lanza el error para manejo en otro lugar
    }
  },

  // Obtiene consumo por faena - Actualizado para aceptar parámetro de faena
  getConsumoFaenas: async (
    faena = "todas",
    desde = "",
    hasta = "",
    periodo = ""
  ) => {
    try {
      // Puedes usar estos parámetros en el futuro si lo necesitas
      console.log(`Parámetros recibidos en getConsumoFaenas:
        Faena: ${faena}, 
        Desde: ${desde}, 
        Hasta: ${hasta}, 
        Periodo: ${periodo}`);

      const response = await axios.get(
        `/api/informes-kpi?tipo=consumo_faenas&faena=${faena}&desde=${desde}&hasta=${hasta}`
      );

      if (response.data && response.data.data) {
        let data = response.data.data;

        if (faena !== "todas") {
          data = data.filter(
            (item) =>
              item.id === parseInt(faena) || item.id_faena === parseInt(faena)
          );
        }

        return data;
      } else {
        console.warn(
          "La respuesta de la API no contiene datos en el formato esperado"
        );
        return [];
      }
      
      console.warn('La respuesta de la API no contiene datos en el formato esperado', response.data);
      return [];
    } catch (error) {
      console.error("Error al obtener consumo por faenas:", error);
      throw error;
    }
  },

  // Obtiene tendencia mensual de consumo
  getConsumoMensual: async (faena = "", periodo = "mensual") => {
    try {
      const response = await axios.get(
        `/api/informes-kpi?tipo=consumo_mensual&faena=${faena}&periodo=${periodo}`
      );
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        console.warn(
          "La respuesta de la API no contiene datos en el formato esperado"
        );
        return [];
      }
      
      console.warn('La respuesta de la API no contiene datos en el formato esperado', response.data);
      return [];
    } catch (error) {
      console.error("Error al obtener consumo mensual:", error);
      throw error;
    }
  },

  /**
   * Obtiene los KPIs principales de consumo
   * @param {string} faena - ID de faena o 'todas'
   * @param {string} periodo - Período a consultar
   * @returns {Promise<Object>} - Datos de KPIs
   */
  getKpisConsumo: async (faena = 'todas', periodo = 'mensual') => {
    try {
      const response = await axios.get(`/api/informes-kpi`, {
        params: {
          tipo: 'kpis_consumo',
          faena,
          periodo
        }
      });
      
      if (response.data?.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      console.warn('La respuesta de la API no contiene datos en el formato esperado', response.data);
      return null;
    } catch (error) {
      console.error("Error al obtener KPIs de consumo:", error);
      throw error;
    }
  },

  /**
   * Obtiene datos de horas de trabajo y mantenimiento
   * @param {string} faena - ID de faena o 'todas'
   * @returns {Promise<Array>} - Datos de horas de trabajo
   */
  getHorasTrabajo: async (faena = 'todas') => {
    try {
      const response = await axios.get(`/api/informes-kpi`, {
        params: {
          tipo: 'horas_trabajo',
          faena
        },
        timeout: 10000 // 10 segundos de timeout
      });

      // Verificar que tengamos la estructura esperada
      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Alternativa: la API podría estar devolviendo el array directamente
        return response.data;
      } else {
        console.warn(
          "La respuesta de la API no tiene el formato esperado para horas_trabajo"
        );
      }
      
      console.warn('La respuesta de la API no tiene el formato esperado para horas_trabajo', response.data);
      return [];
    } catch (error) {
      console.error("Error al obtener datos de horas de trabajo:", error);

      // Si el endpoint no existe o hay otro error, verificamos si es porque
      // el backend no admite este tipo específico
      if (error.response && error.response.status === 404) {
        console.warn(
          "El endpoint para horas_trabajo no está implementado en el backend"
        );
      } else if (error.response && error.response.status === 400) {
        console.warn("El backend no reconoce el tipo 'horas_trabajo'");
      }

      // Retornamos datos de ejemplo en formato compatible
      //console.log("ApiService: Using mock data after error:");
    }
  },
};

/**
 * Servicio para funcionalidades de gerencia y cálculo de KPIs
 */
const gerenteService = {
  /**
   * Obtiene KPIs para el dashboard gerencial
   * @param {string} periodo - Período a consultar
   * @param {string} faena - ID de faena o 'todas'
   * @returns {Promise<Object>} - Datos de KPIs gerenciales
   */
  getKpisGerente: async (periodo = 'mensual', faena = 'todas') => {
    try {
      // Construir URL para valores de entrada
      const valEntradaUrl = `/api/kpi-valores-entrada`;
      const params = { periodo };
      
      if (faena !== 'todas') {
        params.faena = faena;
      }
      
      const valEntrada = await axios.get(valEntradaUrl, { params });

      if (!valEntrada.data || 
         (Array.isArray(valEntrada.data) && valEntrada.data.length === 0)) {
        return {
          status: 'warning',
          message: 'No hay datos disponibles para los criterios seleccionados',
          data: []
        };
      }

      // Procesar resultado
      const ultimoValor = Array.isArray(valEntrada.data)
        ? valEntrada.data[0]
        : valEntrada.data;

      // Calcular KPIs basados en estos valores
      return gerenteService.calcularKpisLocales(ultimoValor, periodo, faena);
    } catch (error) {
      console.error("Error al obtener KPIs gerenciales:", error);

      // En caso de error retornamos mensaje amigable
      return {
        status: "error",
        message: "No fue posible obtener los KPIs. Intente nuevamente.",
        data: [],
      };
    }
  },
  
  /**
   * Obtiene las faenas disponibles para ingreso de datos del mes anterior
   * @returns {Promise<Object>} - Lista de faenas disponibles
   */
  getFaenasDisponibles: async () => {
    try {
      // Obtener el primer día del mes anterior
      const fechaActual = new Date();
      fechaActual.setDate(1); // Primer día del mes actual
      fechaActual.setMonth(fechaActual.getMonth() - 1); // Retroceder un mes
      
      const mesAnterior = fechaActual.toISOString().substring(0, 7); // formato YYYY-MM
      
      const response = await axios.get('/api/faenas-disponibles', {
        params: { mes: mesAnterior }
      });
      
      if (response.data?.status === 'success') {
        return {
          status: 'success',
          data: response.data.data,
          mesActual: fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' })
        };
      }
      
      console.warn('Respuesta incorrecta del servidor al obtener faenas disponibles', response.data);
      return {
        status: 'warning',
        message: response.data?.message || 'No se pudieron obtener las faenas disponibles',
        data: []
      };
    } catch (error) {
      console.error('Error al obtener faenas disponibles:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al consultar faenas disponibles',
        data: []
      };
    }
  },
  
  /**
   * Calcula los KPIs en el frontend basado en valores de entrada
   * @param {Object} valoresEntrada - Valores de entrada para cálculos
   * @param {string} periodo - Período de los datos
   * @param {string} faena - ID de faena
   * @returns {Object} - KPIs calculados
   */
  calcularKpisLocales: (valoresEntrada, periodo, faena) => {
    try {
      if (!valoresEntrada) {
        return {
          status: "warning",
          message: "No hay datos para calcular",
          data: [],
        };
      }

      // Extraer valores para cálculos
      const combustibleConsumido = parseFloat(valoresEntrada.combustible_consumido) || 0;
      const precioCombustible = parseFloat(valoresEntrada.precio_combustible) || 0;
      const toneladasExtraidas = parseFloat(valoresEntrada.toneladas_extraidas) || 0;
      const leyMineral = parseFloat(valoresEntrada.ley_mineral) || 0;
      const numeroViajes = parseFloat(valoresEntrada.numero_viajes) || 0;
      const horasTrabajadas = parseFloat(valoresEntrada.horas_trabajadas) || 0;
      const kilometrosRecorridos = parseFloat(valoresEntrada.kilometros_recorridos) || 0;
      const rendimientoBase = parseFloat(valoresEntrada.rendimiento_base) || 0;
      
      // Calcular costo total
      const costoTotal = combustibleConsumido * precioCombustible;
      
      // Calcular KPIs derivados
      const costoTonelada = toneladasExtraidas > 0 ? costoTotal / toneladasExtraidas : 0;
      const costoHora = horasTrabajadas > 0 ? costoTotal / horasTrabajadas : 0;
      const costoKm = kilometrosRecorridos > 0 ? costoTotal / kilometrosRecorridos : 0;
      
      // Calcular rendimiento si no viene en los datos
      const rendimiento = rendimientoBase > 0 ? rendimientoBase : 
                         (numeroViajes > 0 ? toneladasExtraidas / numeroViajes : 0);

      // Construir objeto de KPIs
      const kpisCalculados = {
        consumo_total: combustibleConsumido,
        toneladas: toneladasExtraidas,
        concentracion: leyMineral,
        camionadas: numeroViajes,
        costoTotal: costoTotal,
        costoTonelada:
          valoresEntrada.toneladas_extraidas > 0
            ? costoTotal / valoresEntrada.toneladas_extraidas
            : 0,
        costoHora:
          valoresEntrada.horas_trabajadas > 0
            ? costoTotal / valoresEntrada.horas_trabajadas
            : 0,
        costoKm:
          valoresEntrada.kilometros_recorridos > 0
            ? costoTotal / valoresEntrada.kilometros_recorridos
            : 0,
        rendimiento: valoresEntrada.rendimiento_base,
        periodo: periodo,
        faena: faena,
      };

      return {
        status: "success",
        data: kpisCalculados,
      };
    } catch (error) {
      console.error("Error al calcular KPIs locales:", error);
      return {
        status: 'error',
        message: 'Error en cálculo de KPIs: ' + error.message,
        data: []
      };
    }
  },

  /**
   * Calcula y registra los KPIs en el servidor
   * @param {Object} datos - Datos de entrada para cálculo y registro
   * @returns {Promise<Object>} - Resultado de la operación
   */
  calcularKpis: async (datos) => {
    try {
      console.log("Enviando datos al servidor:", datos);
      
      // Intentar enviar al endpoint del backend primero
      try {
        const response = await axios.post('/api/calcular-kpis', datos);
        if (response.data?.status === 'success') {
          return response.data;
        }
      } catch (backendError) {
        console.warn(
          "No se pudo calcular en el backend, calculando localmente:",
          backendError
        );
      }

      // Si falla el backend, calculamos en el frontend
      const { valores_entrada, faena, periodo } = datos;

      // Validación básica
      if (!valores_entrada) {
        throw new Error("No se proporcionaron valores de entrada");
      }

      // Extraer valores para cálculos
      const toneladas = parseFloat(valores_entrada.toneladas_extraidas) || 0;
      const camionadas = parseFloat(valores_entrada.camionadas) || 0;
      const petroleo_toneladas = parseFloat(valores_entrada.petroleo_toneladas) || 0;
      const petroleo_horas = parseFloat(valores_entrada.petroleo_horas) || 0;
      const petroleo_kilometros = parseFloat(valores_entrada.petroleo_kilometros) || 0;
      const horas_trabajadas = parseFloat(valores_entrada.horas_trabajadas) || 0;
      const rendimiento = parseFloat(valores_entrada.rendimiento) || 0;

      // Calcular KPIs básicos
      const kpisCalculados = {
        toneladas: toneladas,
        camionadas: camionadas,
        horas_trabajadas: horas_trabajadas,
        costoTonelada: petroleo_toneladas,
        costoHora: petroleo_horas,
        costoKm: petroleo_kilometros,
        periodo: periodo,
        faena: faena
      };

      // Calcular valores adicionales si es posible
      if (petroleo_toneladas > 0 && toneladas > 0) {
        kpisCalculados.costoTotal = petroleo_toneladas * toneladas;
      }

      // Asignar rendimiento
      if (rendimiento > 0) {
        kpisCalculados.rendimiento = rendimiento;
      } else if (toneladas > 0 && camionadas > 0) {
        kpisCalculados.rendimiento = toneladas / camionadas;
      }

      return {
        status: 'success',
        message: 'KPIs calculados correctamente (procesamiento local)',
        data: kpisCalculados
      };
    } catch (error) {
      console.error("Error al calcular KPIs:", error);
      return {
        status: "error",
        message: "Error en cálculo de KPIs: " + error.message,
        data: null,
      };
    }
  },
};

export { consumoService, gerenteService };