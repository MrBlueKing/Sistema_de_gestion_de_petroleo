import axios from "../lib/axios"; // Este archivo tendrá tu configuración de Axios

export const login = async ({ rut, password }) => {
  // Paso 1: Obtener cookie de CSRF (Laravel Sanctum)
  await axios.get("/sanctum/csrf-cookie", { withCredentials: true });

  // Paso 2: Hacer login
  const response = await axios.post(
    "/api/login",
    { rut, password },
    { withCredentials: true }
  );

  return response.data; // contiene { token, user }
};
