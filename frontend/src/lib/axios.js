import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000", // o usa import.meta.env si usas .env
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// Incluir el token de sesión si está disponible
instance.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem("authToken"));
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export default instance;
