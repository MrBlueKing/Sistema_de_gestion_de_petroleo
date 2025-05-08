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
      } else if (response.data && Array.isArray(response.data)) {
        // Alternativa: la API podría estar devolviendo el array directamente
        //console.log("ApiService: Direct array received from API:", response.data);
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

  // Calcula KPIs con los valores ingresados por el usuario en la calculadora
  calcularKpis: async (datos) => {
    try {
      // Intentamos enviar al backend primero
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
};

export { consumoService, gerenteService };
