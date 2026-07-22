import axios from "../lib/axios";

const registroInsumoService = {
  baseURL: '/api/registros-insumo',

  handleError: (error, context = '') => {
    console.error(`Error en ${context}:`, error);

    let message = 'Error desconocido';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.message || `Error del servidor (${statusCode})`;
    } else if (error.request) {
      message = 'No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.';
    } else if (error.message) {
      message = error.message;
    }

    return {
      status: 'error',
      message,
      statusCode,
      data: []
    };
  },

  listar: async (filtros = {}) => {
    try {
      const response = await axios.get(registroInsumoService.baseURL, { params: filtros });
      return response.data;
    } catch (error) {
      return registroInsumoService.handleError(error, 'listar');
    }
  },

  crear: async (datos) => {
    try {
      const response = await axios.post(registroInsumoService.baseURL, datos);
      return response.data;
    } catch (error) {
      return registroInsumoService.handleError(error, 'crear');
    }
  },

  actualizar: async (id, datos) => {
    try {
      const response = await axios.put(`${registroInsumoService.baseURL}/${id}`, datos);
      return response.data;
    } catch (error) {
      return registroInsumoService.handleError(error, 'actualizar');
    }
  },

  eliminar: async (id) => {
    try {
      const response = await axios.delete(`${registroInsumoService.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      return registroInsumoService.handleError(error, 'eliminar');
    }
  },
};

export default registroInsumoService;
