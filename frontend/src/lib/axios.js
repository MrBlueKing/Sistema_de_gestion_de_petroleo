// lib/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest" // Importante para Laravel
  },
  withCredentials: true
});

// Interceptor para token
instance.interceptors.request.use((config) => {
  const sessionData = JSON.parse(localStorage.getItem("authToken"));
  if (sessionData?.token) {
    config.headers.Authorization = `Bearer ${sessionData.token}`;
  }
  return config;
});

// Interceptor para manejar errores
instance.interceptors.response.use(
  response => response,
  error => {
    // Log detallado del error para ayudar en depuración
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error("Respuesta del servidor con error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error("No se recibió respuesta:", error.request);
    } else {
      // Ocurrió un error al configurar la petición
      console.error("Error de configuración:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default instance;