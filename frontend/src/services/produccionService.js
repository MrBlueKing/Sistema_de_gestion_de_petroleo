/**
 * Servicio para consumir API del Sistema de Producción
 * Backend: localhost:8002
 */

import axios from 'axios';
import { getAuthToken } from '../utils/session';

const PRODUCCION_API_URL = 'http://localhost:8002/api';

// Crear instancia de axios para producción
const produccionAxios = axios.create({
  baseURL: PRODUCCION_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar token
produccionAxios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
produccionAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error API Producción:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Servicios de Producción para Dashboard Gerencial
 */
const produccionService = {
  // ========================================
  // RESUMEN GERENCIAL
  // ========================================
  getResumenGerencial: async (params = {}) => {
    const response = await produccionAxios.get('/gerencial/resumen', { params });
    return response.data;
  },

  getFaenas: async () => {
    const response = await produccionAxios.get('/gerencial/faenas');
    return response.data;
  },

  // ========================================
  // DUMPADAS
  // ========================================
  getDumpadas: async (params = {}) => {
    const response = await produccionAxios.get('/dispatch/dumpadas', { params });
    return response.data;
  },

  // ========================================
  // MEZCLAS
  // ========================================
  getMezclas: async (params = {}) => {
    const response = await produccionAxios.get('/dispatch/mezclas', { params });
    return response.data;
  },

  // ========================================
  // LOTES
  // ========================================
  getLotes: async (params = {}) => {
    const response = await produccionAxios.get('/gerencial/lotes', { params });
    return response.data;
  },

  getPlantas: async () => {
    const response = await produccionAxios.get('/gerencial/plantas');
    return response.data;
  },

  getEmpresas: async () => {
    const response = await produccionAxios.get('/gerencial/empresas');
    return response.data;
  },

  // ========================================
  // ACOPIOS
  // ========================================
  getAcopios: async (params = {}) => {
    const response = await produccionAxios.get('/dispatch/acopios', { params });
    return response.data;
  },

  // ========================================
  // REPORTE PRODUCCIÓN (empresa × planta)
  // ========================================
  getReporteProduccion: async (params = {}) => {
    const response = await produccionAxios.get('/gerencial/reporte-produccion', { params });
    return response.data;
  },

  // ========================================
  // RECONSTRUCCIÓN DE LOTE
  // ========================================
  getLote: async (id) => {
    const response = await produccionAxios.get(`/gerencial/lotes/${id}`);
    return response.data;
  },

  getReconstruccionLote: async (id) => {
    const response = await produccionAxios.get(`/gerencial/lotes/${id}/reconstruccion`);
    return response.data;
  },

  // ========================================
  // ANÁLISIS (scatter + pareto)
  // ========================================
  getAnalisisLotes: async (params = {}) => {
    const response = await produccionAxios.get('/gerencial/analisis-lotes', { params });
    return response.data;
  },

  // ========================================
  // CAMIONADAS (DESPACHOS)
  // ========================================
  getCamionadas: async (params = {}) => {
    const response = await produccionAxios.get('/dispatch/camionadas', { params });
    return response.data;
  },

  // ========================================
  // LABORATORIO
  // ========================================
  getEstadisticasLab: async () => {
    const response = await produccionAxios.get('/laboratorio/estadisticas');
    return response.data;
  },
};

export default produccionService;
