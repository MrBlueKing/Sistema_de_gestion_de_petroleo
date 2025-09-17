// utils/session.js

// Configuración
const SESSION_KEY = 'authToken';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutos de buffer antes de expirar

/**
 * Almacena los datos de sesión
 * @param {Object} params - Parámetros de sesión
 * @param {string} params.token - Token de acceso
 * @param {Object} params.user - Datos básicos del usuario
 * @param {string} params.expiresAt - Fecha de expiración del token (ISO string)
 */
export const storeSession = ({ token, user, expiresAt }) => {
  try {
    // Calcular expiración: usar la del servidor o 24h por defecto
    let expiration;
    if (expiresAt) {
      expiration = new Date(expiresAt).getTime();
    } else {
      expiration = Date.now() + 24 * 60 * 60 * 1000; // 24h por defecto
    }

    const sessionData = {
      token,
      expiration,
      role: user.rol || "desconocido",
      userId: user.id,
      userName: user.nombre,
      userLastName: user.apellido,  
      userRut: user.rut,
      faenaId: user.id_faena,
      storedAt: Date.now(), // Para debugging
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    
    // También guardamos en sessionStorage como respaldo
    sessionStorage.setItem(SESSION_KEY + '_backup', JSON.stringify({
      token,
      expiration,
      role: user.rol
    }));

    console.log('✅ Sesión almacenada correctamente', {
      userId: user.id,
      role: user.rol,
      expiresAt: new Date(expiration).toLocaleString()
    });

  } catch (error) {
    console.error('❌ Error al almacenar sesión:', error);
    throw new Error('No se pudo guardar la sesión');
  }
};

/**
 * Obtiene el token de autenticación
 * @returns {string|null} Token o null si no existe/expiró
 */
export const getAuthToken = () => {
  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!sessionData) return null;

    // Verificar expiración con buffer
    if (sessionData.expiration && Date.now() > (sessionData.expiration - TOKEN_EXPIRY_BUFFER)) {
      console.warn('⚠️ Token expirado, limpiando sesión');
      clearSession();
      return null;
    }

    return sessionData.token;
  } catch (error) {
    console.error('❌ Error al obtener token:', error);
    clearSession(); // Limpiar datos corruptos
    return null;
  }
};

/**
 * Obtiene el rol del usuario autenticado
 * @returns {string|null} Rol del usuario o null
 */
export const getAuthRole = () => {
  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    return sessionData?.role || null;
  } catch (error) {
    console.error('❌ Error al obtener rol:', error);
    return null;
  }
};

/**
 * Obtiene los datos básicos del usuario
 * @returns {Object|null} Datos del usuario o null
 */
export const getAuthUser = () => {
  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!sessionData) return null;

    return {
      id: sessionData.userId,
      nombre: sessionData.userName,
      apellido: sessionData.userLastName, 
      rut: sessionData.userRut,
      rol: sessionData.role,
      id_faena: sessionData.faenaId,
    };
  } catch (error) {
    console.error('❌ Error al obtener datos de usuario:', error);
    return null;
  }
};

/**
 * Verifica si la sesión es válida
 * @param {boolean} checkExpiry - Si debe verificar expiración (default: true)
 * @returns {boolean} True si la sesión es válida
 */
export const isSessionValid = (checkExpiry = true) => {
  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!sessionData?.token) return false;

    if (checkExpiry && sessionData.expiration) {
      const isExpired = Date.now() > (sessionData.expiration - TOKEN_EXPIRY_BUFFER);
      if (isExpired) {
        console.warn('⚠️ Sesión expirada');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error al verificar sesión:', error);
    return false;
  }
};

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string|Array} requiredRoles - Rol(es) requerido(s)
 * @returns {boolean} True si el usuario tiene el rol
 */
export const hasRole = (requiredRoles) => {
  const userRole = getAuthRole();
  if (!userRole) return false;

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }

  return userRole === requiredRoles;
};

/**
 * Verifica si el usuario puede acceder a una faena específica
 * @param {number} faenaId - ID de la faena
 * @returns {boolean} True si puede acceder
 */
export const canAccessFaena = (faenaId) => {
  const user = getAuthUser();
  if (!user) return false;

  // Admin y gerente pueden acceder a todas las faenas
  if (['admin', 'gerente'].includes(user.rol)) {
    return true;
  }

  // Otros roles solo pueden acceder a su faena asignada
  return user.id_faena === faenaId;
};

/**
 * Obtiene el tiempo restante de la sesión en milisegundos
 * @returns {number} Milisegundos hasta expiración o 0 si ya expiró
 */
export const getSessionTimeRemaining = () => {
  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!sessionData?.expiration) return 0;

    const remaining = sessionData.expiration - Date.now();
    return Math.max(0, remaining);
  } catch (error) {
    return 0;
  }
};

/**
 * Verifica si la sesión está próxima a expirar
 * @param {number} warningMinutes - Minutos antes de expirar para mostrar advertencia (default: 10)
 * @returns {boolean} True si está próxima a expirar
 */
export const isSessionNearExpiry = (warningMinutes = 10) => {
  const remaining = getSessionTimeRemaining();
  const warningTime = warningMinutes * 60 * 1000;
  return remaining > 0 && remaining <= warningTime;
};

/**
 * Limpia completamente la sesión
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY + '_backup');
    
    // Limpiar otros datos relacionados si existen
    const keysToRemove = [
      'user_preferences',
      'cached_faenas',
      'last_route'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🧹 Sesión limpiada correctamente');
  } catch (error) {
    console.error('❌ Error al limpiar sesión:', error);
  }
};

/**
 * Actualiza el token manteniendo otros datos de sesión
 * @param {string} newToken - Nuevo token
 * @param {string} expiresAt - Nueva fecha de expiración
 */
export const updateToken = (newToken, expiresAt) => {
  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!sessionData) {
      throw new Error('No hay sesión activa para actualizar');
    }

    sessionData.token = newToken;
    sessionData.expiration = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 24 * 60 * 60 * 1000;
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log('🔄 Token actualizado correctamente');
  } catch (error) {
    console.error('❌ Error al actualizar token:', error);
    throw error;
  }
};

/**
 * Monitorea la expiración de la sesión y ejecuta callbacks
 * @param {Function} onNearExpiry - Callback cuando está próxima a expirar
 * @param {Function} onExpiry - Callback cuando expira
 * @param {number} checkInterval - Intervalo de verificación en ms (default: 60000)
 */
export const monitorSession = (onNearExpiry, onExpiry, checkInterval = 60000) => {
  let nearExpiryWarningShown = false;

  const checkSession = () => {
    if (!isSessionValid()) {
      if (onExpiry) onExpiry();
      clearInterval(intervalId);
      return;
    }

    if (isSessionNearExpiry() && !nearExpiryWarningShown) {
      nearExpiryWarningShown = true;
      if (onNearExpiry) onNearExpiry();
    }

    // Reset warning if session was refreshed
    if (!isSessionNearExpiry()) {
      nearExpiryWarningShown = false;
    }
  };

  const intervalId = setInterval(checkSession, checkInterval);
  
  // Verificación inicial
  checkSession();

  // Retornar función para detener el monitoreo
  return () => clearInterval(intervalId);
};

/**
 * Hook personalizado para debugging (solo desarrollo)
 */
export const getSessionDebugInfo = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  try {
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!sessionData) return { status: 'No session' };

    return {
      status: 'Active',
      token: sessionData.token ? `${sessionData.token.substring(0, 10)}...` : 'None',
      role: sessionData.role,
      userId: sessionData.userId,
      expiresAt: new Date(sessionData.expiration).toLocaleString(),
      timeRemaining: Math.floor(getSessionTimeRemaining() / 1000 / 60) + ' minutes',
      isValid: isSessionValid(),
      isNearExpiry: isSessionNearExpiry(),
    };
  } catch (error) {
    return { status: 'Error', error: error.message };
  }
};