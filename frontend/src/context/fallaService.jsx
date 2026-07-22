import axios from "../lib/axios";

const fallaService = {
  baseURL: '/api/fallas',

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
      const response = await axios.get(fallaService.baseURL, { params: filtros });
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'listar');
    }
  },

  obtener: async (id) => {
    try {
      const response = await axios.get(`${fallaService.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'obtener');
    }
  },

  crear: async (datos) => {
    try {
      const response = await axios.post(fallaService.baseURL, datos);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'crear');
    }
  },

  actualizar: async (id, datos) => {
    try {
      const response = await axios.put(`${fallaService.baseURL}/${id}`, datos);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'actualizar');
    }
  },

  eliminar: async (id) => {
    try {
      const response = await axios.delete(`${fallaService.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'eliminar');
    }
  },

  cerrar: async (id, observacionesFinales) => {
    try {
      const response = await axios.put(`${fallaService.baseURL}/${id}/cerrar`, {
        observaciones_finales: observacionesFinales,
      });
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'cerrar');
    }
  },

  agregarActividad: async (idFalla, actividad) => {
    try {
      const response = await axios.post(`${fallaService.baseURL}/${idFalla}/actividades`, actividad);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'agregarActividad');
    }
  },

  actualizarActividad: async (idFalla, idActividad, datos) => {
    try {
      const response = await axios.put(`${fallaService.baseURL}/${idFalla}/actividades/${idActividad}`, datos);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'actualizarActividad');
    }
  },

  eliminarActividad: async (idFalla, idActividad) => {
    try {
      const response = await axios.delete(`${fallaService.baseURL}/${idFalla}/actividades/${idActividad}`);
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'eliminarActividad');
    }
  },

  listarMaquinas: async () => {
    try {
      const response = await axios.get('/api/maquinas');
      return response.data;
    } catch (error) {
      return fallaService.handleError(error, 'listarMaquinas');
    }
  },
};

export default fallaService;
