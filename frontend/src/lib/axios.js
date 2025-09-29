// lib/axios.js
import axios from "axios";
import { clearSession, getAuthToken, isSessionValid } from "../utils/session";

const instance = axios.create({
  //  baseURL: "https://api.m3h.cl/", produccion
  //  baseURL: "http://localhost:8000/", // local prueba en red local 
  baseURL: "https://api.m3h.cl/", //local solo pc
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
});

// Interceptor para requests - agregar token automáticamente
instance.interceptors.request.use(
  (config) => {
    // Verificar si la sesión es válida antes de hacer la petición
    if (isSessionValid()) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Si la sesión no es válida, limpiar el localStorage
      clearSession();
      
      // Solo redirigir si no estamos en rutas públicas
      const publicRoutes = ['/login', '/register', '/test-mantenimiento'];
      const isPublicRoute = publicRoutes.some(route => 
        config.url?.includes(route)
      );
      
      if (!isPublicRoute && window.location.pathname !== '/login') {
        console.warn('Sesión expirada, redirigiendo al login');
        window.location.href = '/login';
        return Promise.reject({
          message: 'Sesión expirada',
          isAuthError: true
        });
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejar errores de autenticación
instance.interceptors.response.use(
  (response) => {
    // Log de respuestas exitosas en desarrollo
    //if (process.env.NODE_ENV === 'development') {
      //console.log('✅ API Response:', {
        //url: response.config.url,
        //method: response.config.method?.toUpperCase(),
        //status: response.status,
        //data: response.data
      //});
    //}
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detallado del error
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors,
    });

    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Limpiar sesión local
      clearSession();
      
      // Si no es un intento de login, redirigir
      if (!originalRequest.url?.includes('/login')) {
        console.warn('Token inválido o expirado, redirigiendo al login');
        
        // Mostrar notificación al usuario si hay un sistema de notificaciones
        if (window.showNotification) {
          window.showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'warning');
        }
        
        // Redirigir después de un pequeño delay para que se vea la notificación
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      
      return Promise.reject({
        ...error,
        isAuthError: true,
        userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      });
    }

    // Manejar errores de autorización (403)
    if (error.response?.status === 403) {
      const errorMessage = error.response.data?.message || 'No tienes permisos para realizar esta acción';
      
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      }
      
      return Promise.reject({
        ...error,
        isPermissionError: true,
        userMessage: errorMessage
      });
    }

    // Manejar errores de rate limiting (429)
    if (error.response?.status === 429) {
      const errorMessage = error.response.data?.message || 'Demasiadas peticiones. Intenta más tarde.';
      
      if (window.showNotification) {
        window.showNotification(errorMessage, 'warning');
      }
      
      return Promise.reject({
        ...error,
        isRateLimitError: true,
        userMessage: errorMessage
      });
    }

    // Manejar errores de validación (422)
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors || {};
      const errorMessage = error.response.data?.message || 'Datos de entrada inválidos';
      
      return Promise.reject({
        ...error,
        isValidationError: true,
        userMessage: errorMessage,
        validationErrors: errors
      });
    }

    // Manejar errores de servidor (500)
    if (error.response?.status >= 500) {
      const errorMessage = 'Error interno del servidor. Intenta más tarde.';
      
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      }
      
      return Promise.reject({
        ...error,
        isServerError: true,
        userMessage: errorMessage
      });
    }

    // Manejar errores de red (sin respuesta del servidor)
    if (!error.response) {
      const errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      }
      
      return Promise.reject({
        ...error,
        isNetworkError: true,
        userMessage: errorMessage
      });
    }

    // Para otros errores, devolver el error original con mensaje amigable
    return Promise.reject({
      ...error,
      userMessage: error.response?.data?.message || 'Ocurrió un error inesperado'
    });
  }
);

// Función helper para hacer peticiones con manejo de errores mejorado
export const apiRequest = async (config) => {
  try {
    const response = await instance(config);
    return response.data;
  } catch (error) {
    // Si el error tiene un mensaje amigable para el usuario, usarlo
    if (error.userMessage) {
      throw new Error(error.userMessage);
    }
    
    // Fallback a mensaje genérico
    throw new Error('Ocurrió un error al procesar la petición');
  }
};

// Funciones helper para diferentes tipos de peticiones
export const get = (url, config = {}) => apiRequest({ method: 'GET', url, ...config });
export const post = (url, data, config = {}) => apiRequest({ method: 'POST', url, data, ...config });
export const put = (url, data, config = {}) => apiRequest({ method: 'PUT', url, data, ...config });
export const patch = (url, data, config = {}) => apiRequest({ method: 'PATCH', url, data, ...config });
export const del = (url, config = {}) => apiRequest({ method: 'DELETE', url, ...config });

export default instance;