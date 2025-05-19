import axios from "../lib/axios"; // Este archivo tendrá tu configuración de Axios

export const login = async ({ rut, password }) => {
  try {
    console.log("Iniciando proceso de login para RUT:", rut);
    
    // Paso 1: Probar la conexión básica al servidor
    console.log("Verificando conexión con el servidor...");
    try {
      await axios.get("/api");
      console.log("Conexión básica exitosa");
    } catch (testError) {
      console.error("Error en prueba de conexión:", testError);
      // Continuar con el intento de login de todas formas
    }
    
    // Paso 2: Intentar obtener CSRF token (solo si es necesario)
    console.log("Obteniendo CSRF token...");
    try {
      await axios.get("/sanctum/csrf-cookie");
      console.log("CSRF token obtenido correctamente");
    } catch (csrfError) {
      console.warn("No se pudo obtener CSRF token, pero intentaremos login de todas formas:", csrfError);
      // Continuar con el login incluso si falla el CSRF
    }
    
    // Paso 3: Hacer login
    console.log("Enviando credenciales...");
    const response = await axios.post("/api/login", { rut, password });
    console.log("Login exitoso:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error detallado en login:", error);
    
    // Generar mensaje de error amigable según el tipo de error
    let errorMessage = "Error al iniciar sesión. ";
    
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 422) {
        errorMessage += "Credenciales incorrectas.";
      } else {
        errorMessage += `Error del servidor: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage += "No hay respuesta del servidor. Verifica tu conexión.";
    } else {
      errorMessage += error.message;
    }
    
    throw new Error(errorMessage);
  }
};
