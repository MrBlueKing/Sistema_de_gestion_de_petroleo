export const storeSession = ({ token, user }) => {
  const expiration = Date.now() + 24 * 60 * 60 * 1000; // 24h
  
  // Solo guardamos el token, la expiración y el rol (que es menos sensible)
  const sessionData = {
    token,
    expiration,
    role: user.rol || "desconocido",
  };
  
  // No guardamos los datos completos del usuario por seguridad
  localStorage.setItem("authToken", JSON.stringify(sessionData));
};

// También podríamos agregar estas funciones de utilidad:

export const getAuthToken = () => {
  const sessionData = JSON.parse(localStorage.getItem("authToken"));
  if (!sessionData) return null;
  
  // Verificar si el token ha expirado
  if (sessionData.expiration && Date.now() > sessionData.expiration) {
    // Token expirado, limpiamos el localStorage
    localStorage.removeItem("authToken");
    return null;
  }
  
  return sessionData.token;
};

export const getAuthRole = () => {
  const sessionData = JSON.parse(localStorage.getItem("authToken"));
  return sessionData?.role || null;
};

export const isSessionValid = () => {
  return getAuthToken() !== null;
};

export const clearSession = () => {
  localStorage.removeItem("authToken");
};