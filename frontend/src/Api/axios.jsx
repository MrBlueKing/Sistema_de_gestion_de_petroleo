import axios from 'axios';

// Configura Axios para trabajar con cookies y CORS
axios.defaults.baseURL = 'http://localhost:8000';  // URL de tu backend Laravel
axios.defaults.withCredentials = true; // Importante para enviar las cookies de sesión

// Opcional: Si usas CSRF, asegúrate de obtener primero el token
export const getCsrfToken = async () => {
  await axios.get('/sanctum/csrf-cookie');
};
