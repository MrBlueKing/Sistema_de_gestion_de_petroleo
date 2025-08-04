// components/auth/PrivateRoutes.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  isSessionValid, 
  hasRole, 
  canAccessFaena, 
  getAuthUser,
  clearSession,
  getSessionDebugInfo 
} from '../utils/session';

// Componente de loading personalizable
const AuthLoadingSpinner = ({ message = "Verificando permisos..." }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
    <p className="text-gray-600 text-sm">{message}</p>
  </div>
);

// Componente para mostrar errores de acceso - VERSIÓN PROFESIONAL
const AccessDeniedMessage = ({ errorType = 'insufficient_role', canRetry = false, onRetry }) => {
  // 🎯 MENSAJES PROFESIONALES SIN EXPONER INFORMACIÓN SENSIBLE
  const getErrorConfig = (type) => {
    switch (type) {
      case 'session_invalid':
        return {
          icon: '🔐',
          title: 'Sesión Expirada',
          message: 'Tu sesión ha expirado por motivos de seguridad.',
          subtitle: 'Por favor, inicia sesión nuevamente para continuar.',
          primaryAction: 'Iniciar Sesión',
          showRetry: false
        };

      case 'insufficient_role':
        return {
          icon: '🚫',
          title: 'Acceso Denegado',
          message: 'No tienes los permisos necesarios para acceder a esta página.',
          subtitle: 'Serás redirigido a la página principal.',
          primaryAction: 'Ir al Inicio',
          showRetry: false
        };

      case 'faena_access_denied':
        return {
          icon: '🏢',
          title: 'Acceso Restringido',
          message: 'Esta sección está restringida para tu ubicación actual.',
          subtitle: 'Serás redirigido a la página principal.',
          primaryAction: 'Ir al Inicio',
          showRetry: false
        };

      case 'user_data_missing':
        return {
          icon: '⚠️',
          title: 'Error de Autenticación',
          message: 'No se pudo verificar tu identidad.',
          subtitle: 'Intenta nuevamente o inicia sesión si el problema persiste.',
          primaryAction: 'Reintentar',
          showRetry: true
        };

      case 'verification_error':
      default:
        return {
          icon: '🔧',
          title: 'Error de Verificación',
          message: 'Ocurrió un problema al verificar tus permisos.',
          subtitle: 'Esto puede ser temporal. Intenta nuevamente en unos momentos.',
          primaryAction: 'Reintentar',
          showRetry: true
        };
    }
  };

  const config = getErrorConfig(errorType);

  const handlePrimaryAction = () => {
    if (config.showRetry && onRetry) {
      onRetry();
    } else if (errorType === 'insufficient_role' || errorType === 'faena_access_denied') {
      // 🏠 REDIRIGIR DIRECTAMENTE A LA PÁGINA INICIAL SIN RECARGAR
      window.location.replace('/');
    } else {
      // 🔐 LIMPIAR SESIÓN Y REDIRIGIR AL LOGIN
      clearSession();
      window.location.replace('/login');
    }
  };

  // 🆕 FUNCIÓN PARA EL BOTÓN SECUNDARIO DE LOGIN
  const handleLoginRedirect = () => {
    // 🔐 LIMPIAR COMPLETAMENTE LA SESIÓN ANTES DE IR AL LOGIN
    clearSession();
    window.location.replace('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-200">
        
        {/* Icono */}
        <div className="text-6xl mb-6 animate-pulse">
          {config.icon}
        </div>
        
        {/* Título principal */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {config.title}
        </h2>
        
        {/* Mensaje principal */}
        <p className="text-gray-600 mb-2 text-base leading-relaxed">
          {config.message}
        </p>
        
        {/* Subtítulo */}
        <p className="text-gray-500 mb-8 text-sm">
          {config.subtitle}
        </p>
        
        {/* Botones de acción */}
        <div className="space-y-3">
          {/* Botón principal */}
          <button
            onClick={handlePrimaryAction}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            {config.primaryAction}
          </button>
          
          {/* Botón secundario - solo si no es el mismo que el primario */}
          {!config.showRetry && errorType !== 'session_invalid' && (
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-gray-300"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
        
        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Sistema de Gestión de Combustible
          </p>
        </div>
      </div>
    </div>
  );
};

const PrivateRoutes = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = null, 
  requiredFaena = null,
  fallbackComponent = null,
  loadingComponent = null,
  showDebug = false // Solo para desarrollo
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const location = useLocation();

  // Hook para verificación de autenticación
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setIsLoading(true);
        setAuthError(null);

        // 1. Verificar si la sesión es válida
        if (!isSessionValid()) {
          clearSession();
          setAuthError({
            type: 'session_invalid',
            canRetry: false
          });
          return;
        }

        // 2. Obtener datos del usuario
        const user = getAuthUser();
        if (!user) {
          setAuthError({
            type: 'user_data_missing',
            canRetry: true
          });
          return;
        }

        // 3. Verificar roles si se especifican
        const rolesToCheck = requiredRoles || (requiredRole ? [requiredRole] : null);
        if (rolesToCheck && rolesToCheck.length > 0) {
          if (!hasRole(rolesToCheck)) {
            // 🔒 NO EXPONER INFORMACIÓN DEL ROL EN PRODUCCIÓN
            console.warn('Acceso denegado - rol insuficiente:', {
              userRole: user.rol,
              requiredRoles: rolesToCheck,
              path: location.pathname
            });
            
            setAuthError({
              type: 'insufficient_role',
              canRetry: false
            });
            return;
          }
        }

        // 4. Verificar acceso a faena específica si se requiere
        if (requiredFaena && !canAccessFaena(requiredFaena)) {
          setAuthError({
            type: 'faena_access_denied',
            canRetry: false
          });
          return;
        }

        // Si llegamos aquí, todo está bien
        setAuthError(null);

        // 🔧 DEBUG INFO - solo en desarrollo
        if (showDebug && process.env.NODE_ENV === 'development') {
          setDebugInfo(getSessionDebugInfo());
        }

      } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        setAuthError({
          type: 'verification_error',
          canRetry: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [requiredRole, requiredRoles, requiredFaena, location.pathname]);

  // Función para reintentar verificación
  const handleRetry = () => {
    setIsLoading(true);
    setAuthError(null);
    // El useEffect se ejecutará nuevamente
  };

  // Si está cargando, mostrar spinner
  if (isLoading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return <AuthLoadingSpinner message="Verificando permisos..." />;
  }

  // Si hay error de autenticación, manejar según el tipo
  if (authError) {
    // Para errores de sesión inválida, redirigir directamente
    if (authError.type === 'session_invalid') {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Para otros errores, mostrar mensaje personalizado o fallback
    if (fallbackComponent) {
      return fallbackComponent;
    }

    return (
      <AccessDeniedMessage
        errorType={authError.type}
        canRetry={authError.canRetry}
        onRetry={handleRetry}
      />
    );
  }

  // Renderizar componente de debug en desarrollo
  const DebugPanel = () => {
    if (!showDebug || process.env.NODE_ENV !== 'development' || !debugInfo) {
      return null;
    }

    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white text-xs p-3 rounded-lg max-w-xs z-50 shadow-2xl">
        <div className="font-bold mb-2 text-orange-400">🔒 Auth Debug</div>
        <div className="space-y-1 opacity-90">
          <div>Status: <span className="text-green-400">{debugInfo.status}</span></div>
          <div>Role: <span className="text-blue-400">{debugInfo.role}</span></div>
          <div>User: <span className="text-yellow-400">{debugInfo.userId}</span></div>
          <div>Valid: <span className={debugInfo.isValid ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.isValid ? '✓' : '✗'}
          </span></div>
          <div>Expires: <span className="text-gray-300">{debugInfo.timeRemaining}</span></div>
        </div>
      </div>
    );
  };

  // Si todo está bien, renderizar el componente hijo
  return (
    <>
      {children}
      <DebugPanel />
    </>
  );
};

// HOC para componentes que necesitan verificación de roles
export const withRoleCheck = (WrappedComponent, requiredRoles) => {
  return (props) => (
    <PrivateRoutes requiredRoles={requiredRoles}>
      <WrappedComponent {...props} />
    </PrivateRoutes>
  );
};

// Hook personalizado para verificar permisos dentro de componentes
export const useAuth = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      const isValid = isSessionValid();
      const user = getAuthUser();
      
      setAuthState({
        isAuthenticated: isValid,
        user: user,
        isLoading: false
      });
    };

    checkAuth();
    
    // Verificar cada minuto
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...authState,
    hasRole: (roles) => hasRole(roles),
    canAccessFaena: (faenaId) => canAccessFaena(faenaId),
    logout: () => {
      // 🔐 LIMPIEZA COMPLETA DE SESIÓN
      clearSession();
      
      // 🔄 FORZAR RECARGA PARA LIMPIAR CUALQUIER ESTADO EN MEMORIA
      window.location.replace('/login');
    },
    // 🆕 FUNCIÓN PARA IR AL INICIO SIN LIMPIAR SESIÓN
    goHome: () => {
      window.location.replace('/');
    }
  };
};

// Componente para mostrar contenido basado en roles - MEJORADO
export const RoleBasedComponent = ({ 
  allowedRoles, 
  children, 
  fallback = null,
  showUnauthorized = false 
}) => {
  const { hasRole: userHasRole } = useAuth();

  if (!userHasRole(allowedRoles)) {
    if (showUnauthorized) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700 font-medium">
                Contenido restringido
              </p>
              <p className="text-xs text-orange-600 mt-1">
                No tienes permisos para ver esta sección.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return fallback;
  }

  return children;
};

export default PrivateRoutes;