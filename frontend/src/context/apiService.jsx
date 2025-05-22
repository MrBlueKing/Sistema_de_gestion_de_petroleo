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
    } catch (error) {
      console.error("Error al obtener consumo mensual:", error);
      throw error;
    }
  },

  // Obtiene KPI principales
  getKpisConsumo: async (faena = "todas", periodo = "mensual") => {
    try {
      const response = await axios.get(
        `/api/informes-kpi?tipo=kpis_consumo&faena=${faena}&periodo=${periodo}`
      );
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        console.warn(
          "La respuesta de la API no contiene datos en el formato esperado"
        );
        return null;
      }

    } catch (error) {
      console.error("Error al obtener KPIs de consumo:", error);
      throw error;
    }
  },

  // NUEVO: Obtiene datos de horas de trabajo y mantenimiento
  getHorasTrabajo: async (faena = "todas") => {
    try {
      //console.log("ApiService: Requesting horas_trabajo for faena:", faena);

      // VERIFICACIÓN DEL ENDPOINT: Primero comprobamos si el endpoint existe y maneja este tipo
      const response = await axios.get(
        `/api/informes-kpi?tipo=horas_trabajo&faena=${faena}`
      );
      //console.log("Response status:", response.status);
      //console.log("Response data:", response.data);

      // Verificamos que tengamos la estructura esperada (data.status === 'success' y data.data sea un array)
      if (
        response.data &&
        response.data.status === "success" &&
        Array.isArray(response.data.data)
      ) {
        //console.log("ApiService: Data received from API:", response.data.data);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Alternativa: la API podría estar devolviendo el array directamente
        return response.data;
      } else {
        console.warn(
          "La respuesta de la API no tiene el formato esperado para horas_trabajo"
        );
      }
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

  /**
   * Obtiene los datos de consumo y proyección de máquinas para una faena específica y fecha
   * @param {string|number} faena - ID de la faena o 'todas' para todas las faenas
   * @param {string} fecha - Fecha en formato YYYY-MM-DD para la que se requiere la información
   * @param {number} diasProyeccion - Número de días para proyectar (opcional, por defecto 1)
   * @returns {Promise<Object>} - Resultado de la operación con datos de consumo y proyección
   */
  getConsumoProyeccionMaquinas: async (faena = 'todas', fecha = null, diasProyeccion = 1) => {
    try {
      // Si no se proporciona fecha, usar ayer
      if (!fecha) {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        fecha = ayer.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }

      // La fecha desde y hasta es la misma para obtener datos de un día específico
      const params = {
        faena: faena,
        desde: fecha,
        hasta: fecha,
        dias_proyeccion: diasProyeccion
      };

      console.log('Solicitando proyección de consumo con los siguientes parámetros:', params);

      // Llamar al endpoint de proyección avanzada
      const response = await axios.get('/api/proyeccion-consumo', { params });

      // Validar la respuesta
      if (response.data && response.data.status === 'success' && response.data.data) {
        console.log('Datos de proyección recibidos correctamente');
        return {
          status: 'success',
          data: response.data.data
        };
      } else {
        console.warn('La respuesta de la API no contiene los datos esperados', response.data);
        return {
          status: 'warning',
          message: 'No se encontraron datos para los parámetros especificados',
          data: null
        };
      }
    } catch (error) {
      console.error('Error al obtener consumo y proyección de máquinas:', error);

      // Verificar el tipo de error para dar un mensaje más informativo
      let errorMessage = 'Error al procesar la solicitud';

      if (error.response) {
        // Error de respuesta del servidor
        errorMessage = `Error del servidor: ${error.response.status} - ${error.response.data?.message || 'No hay detalles'}`;
      } else if (error.request) {
        // Error sin respuesta (problemas de red)
        errorMessage = 'No se pudo contactar con el servidor. Verifique su conexión.';
      }

      return {
        status: 'error',
        message: errorMessage,
        data: null
      };
    }
  },

  /**
   * Obtiene el consumo de máquinas específicamente para el día anterior
   * (Método conveniente que encapsula getConsumoProyeccionMaquinas)
   * @param {string|number} faena - ID de la faena o 'todas' para todas las faenas
   * @returns {Promise<Object>} - Resultado de la operación con datos de consumo del día anterior
   */
  getConsumoMaquinasAyer: async (faena = 'todas') => {
    // Calcular la fecha de ayer
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];

    // Usar la función principal con la fecha de ayer
    return await consumoService.getConsumoProyeccionMaquinas(faena, fechaAyer, 0); // 0 días de proyección
  }
};

// Servicio para gerencia - Actualización para soportar filtrado por faena
const gerenteService = {
  // Obtiene KPIs para dashboard gerencial
  getKpisGerente: async (periodo = "mensual", faena = "todas") => {
    try {
      // Intentamos obtener los valores de entrada
      const valEntradaUrl =
        faena !== "todas"
          ? `/api/kpi-valores-entrada?periodo=${periodo}&faena=${faena}`
          : `/api/kpi-valores-entrada?periodo=${periodo}`;

      const valEntrada = await axios.get(valEntradaUrl);

      if (!valEntrada.data || valEntrada.data.length === 0) {
        console.warn("No se obtuvieron valores de entrada");
        return {
          status: "warning",
          message: "No hay datos disponibles para los criterios seleccionados",
          data: [],
        };
      }

      // Tomamos el valor más reciente (asumiendo que están ordenados)
      const ultimoValor = Array.isArray(valEntrada.data)
        ? valEntrada.data[0]
        : valEntrada.data;

      // Calculamos KPIs basados en estos valores
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

  // Calcula KPIs en el frontend con el último valor de entrada disponible
  calcularKpisLocales: (valoresEntrada, periodo, faena) => {
    try {
      if (!valoresEntrada) {
        return {
          status: "warning",
          message: "No hay datos para calcular",
          data: [],
        };
      }

      // Calculamos KPIs básicos con los valores recibidos
      const costoTotal =
        valoresEntrada.combustible_consumido *
        valoresEntrada.precio_combustible;

      const kpisCalculados = {
        consumo_total: valoresEntrada.combustible_consumido,
        toneladas: valoresEntrada.toneladas_extraidas,
        concentracion: valoresEntrada.ley_mineral,
        camionadas: valoresEntrada.numero_viajes,
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
        status: "error",
        message: "Error en cálculo de KPIs",
        data: [],
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
        const response = await axios.post("/api/calcular-kpis", datos);
        if (response.data && response.data.status === "success") {
          return response.data;
        }
      } catch (backendError) {
        console.warn(
          "No se pudo calcular en el backend, calculando localmente:",
          backendError
        );
      }

      // Si falla el backend o no tenemos la ruta implementada, calculamos en el frontend
      const { valores_entrada } = datos;

      // Verificamos que tengamos todos los valores necesarios
      if (!valores_entrada) {
        throw new Error("No se proporcionaron valores de entrada");
      }

      // Calculamos el costo total del combustible
      const costoTotal =
        valores_entrada.litros_petroleo * valores_entrada.costo_litro;

      // Calculamos los KPIs
      const kpisCalculados = {
        toneladas: valores_entrada.toneladas,
        concentracion: valores_entrada.concentracion,
        camionadas: valores_entrada.camionadas,
        costoTotal: costoTotal,
        costoTonelada:
          valores_entrada.toneladas > 0
            ? costoTotal / valores_entrada.toneladas
            : 0,
        costoHora:
          valores_entrada.horas > 0 ? costoTotal / valores_entrada.horas : 0,
        costoKm:
          valores_entrada.kilometros > 0
            ? costoTotal / valores_entrada.kilometros
            : 0,
        periodo: datos.periodo,
        faena: datos.faena,
      };

      return {
        status: "success",
        data: kpisCalculados,
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

  /**
   * Obtiene las faenas disponibles en el sistema
   * @returns {Promise<Object>} - Lista de faenas disponibles
   */
  getFaenasDisponibles: async () => {
    try {
      const response = await axios.get("/api/faenas-disponibles");
      // Asegúrate de que el status sea 'success' y data esté en el formato correcto
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        return {
          status: 'success',
          data: response.data.data,
          mesActual: response.data.mes_actual ?? null // Por si necesitas usarlo después
        };
      } else {
        console.warn("Formato inesperado de la respuesta al obtener faenas", response.data);
        return { status: 'error', data: [], message: 'Formato de respuesta no esperado' };
      }
    } catch (error) {
      console.error("Error al obtener faenas disponibles:", error);
      return { status: 'error', data: [], message: 'Error al conectar con el servidor' };
    }
  },

  /**
   * NUEVA FUNCIÓN: Obtiene un resumen agregado de consumo para una fecha específica
   * Optimizada para alimentar el componente DailyKpiCalculator
   * @param {string|number} faena - ID de la faena o 'todas' para todas las faenas
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (por defecto, usa ayer)
   * @returns {Promise<Object>} - Resumen agregado de consumo y actividad
   */
  getResumenConsumoParaFecha: async (faena = 'todas', fecha = null) => {
    try {
      // Si no se proporciona fecha, usar ayer
      if (!fecha) {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        fecha = ayer.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }

      const params = {
        faena: faena,
        fecha: fecha
      };

      console.log('Solicitando resumen de consumo para fecha con parámetros:', params);

      // Llamar al nuevo endpoint de resumen para fecha específica
      const response = await axios.get('/api/consumo-resumen-fecha', { params });

      // Validar la respuesta
      if (response.data && response.data.status === 'success' && response.data.data) {
        console.log('Resumen de consumo recibido correctamente para fecha:', fecha);
        return {
          status: 'success',
          data: response.data.data,
          fecha_consultada: response.data.fecha_consultada,
          message: response.data.message
        };
      } else {
        console.warn('La respuesta de la API no contiene los datos esperados', response.data);
        return {
          status: 'warning',
          message: 'No se encontraron datos para la fecha especificada',
          data: null
        };
      }
    } catch (error) {
      console.error('Error al obtener resumen de consumo para fecha:', error);

      // Verificar el tipo de error para dar un mensaje más informativo
      let errorMessage = 'Error al procesar la solicitud';

      if (error.response) {
        // Error de respuesta del servidor
        errorMessage = `Error del servidor: ${error.response.status} - ${error.response.data?.message || 'No hay detalles'}`;
      } else if (error.request) {
        // Error sin respuesta (problemas de red)
        errorMessage = 'No se pudo contactar con el servidor. Verifique su conexión.';
      }

      return {
        status: 'error',
        message: errorMessage,
        data: null
      };
    }
  },

  /**
   * MÉTODO ACTUALIZADO: Obtiene las proyecciones de consumo de máquinas
   * Ahora usa la nueva función de resumen para el DailyKpiCalculator
   * @param {string|number} faena - ID de la faena o 'todas' para todas las faenas
   * @param {string} fecha - Fecha opcional en formato YYYY-MM-DD (por defecto, usa ayer)
   * @returns {Promise<Object>} - Proyecciones de consumo de máquinas
   */
  getConsumoProyeccionMaquinas: async (faena = 'todas', fecha = null) => {
    try {
      // Para el DailyKpiCalculator, usar la nueva función optimizada
      const resultado = await gerenteService.getResumenConsumoParaFecha(faena, fecha);

      if (resultado.status !== 'success' || !resultado.data) {
        return resultado; // Devolver el error o advertencia original
      }

      // Los datos ya vienen en el formato correcto desde el nuevo endpoint
      return {
        status: 'success',
        data: resultado.data,
        fecha_consultada: resultado.fecha_consultada
      };
    } catch (error) {
      console.error('Error al procesar proyecciones para gerencia:', error);
      return {
        status: 'error',
        message: 'Error al obtener datos de proyección: ' + error.message,
        data: null
      };
    }
  },

  /**
   * FUNCIÓN ALTERNATIVA: Para casos que necesiten datos detallados de proyección
   * Usa el endpoint original con rangos de fechas y proyecciones completas
   * @param {string|number} faena - ID de la faena o 'todas' para todas las faenas
   * @param {string} fechaDesde - Fecha de inicio en formato YYYY-MM-DD
   * @param {string} fechaHasta - Fecha de fin en formato YYYY-MM-DD
   * @param {number} diasProyeccion - Días de proyección futura
   * @returns {Promise<Object>} - Datos completos de proyección por rango
   */
  getProyeccionCompletaPorRango: async (faena = 'todas', fechaDesde = null, fechaHasta = null, diasProyeccion = 7) => {
    try {
      // Usar el servicio original para datos completos
      return await consumoService.getConsumoProyeccionMaquinas(faena, fechaDesde, diasProyeccion);
    } catch (error) {
      console.error('Error al obtener proyección completa por rango:', error);
      return {
        status: 'error',
        message: 'Error al obtener proyección completa: ' + error.message,
        data: null
      };
    }
  }
};

export { consumoService, gerenteService };