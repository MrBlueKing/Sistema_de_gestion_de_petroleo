import axios from "../lib/axios";

const mecanicoService = {
  baseURL: '/api/mecanicos',

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
      const response = await axios.get(mecanicoService.baseURL, { params: filtros });
      return response.data;
    } catch (error) {
      return mecanicoService.handleError(error, 'listar');
    }
  },

  crear: async (datos) => {
    try {
      const response = await axios.post(mecanicoService.baseURL, datos);
      return response.data;
    } catch (error) {
      return mecanicoService.handleError(error, 'crear');
    }
  },

  actualizar: async (id, datos) => {
    try {
      const response = await axios.put(`${mecanicoService.baseURL}/${id}`, datos);
      return response.data;
    } catch (error) {
      return mecanicoService.handleError(error, 'actualizar');
    }
  },
};

export default mecanicoService;
