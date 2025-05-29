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

// Componente para mostrar errores de acceso
const AccessDeniedMessage = ({ message, canRetry = false, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
      <div className="text-red-500 text-6xl mb-4">🚫</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      
      <div className="space-y-3">
        {canRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Reintentar
          </button>
        )}
        <button
          onClick={() => window.location.href = '/login'}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  </div>
);

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

        // Debug info (solo desarrollo)
        if (showDebug && process.env.NODE_ENV === 'development') {
          setDebugInfo(getSessionDebugInfo());
        }

        // 1. Verificar si la sesión es válida
        if (!isSessionValid()) {
          clearSession();
          setAuthError({
            type: 'session_invalid',
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            canRetry: false
          });
          return;
        }

        // 2. Obtener datos del usuario
        const user = getAuthUser();
        if (!user) {
          setAuthError({
            type: 'user_data_missing',
            message: 'No se pudieron obtener los datos de usuario.',
            canRetry: true
          });
          return;
        }

        // 3. Verificar roles si se especifican
        const rolesToCheck = requiredRoles || (requiredRole ? [requiredRole] : null);
        if (rolesToCheck && rolesToCheck.length > 0) {
          if (!hasRole(rolesToCheck)) {
            setAuthError({
              type: 'insufficient_role',
              message: `Esta página requiere uno de los siguientes roles: ${rolesToCheck.join(', ')}. Tu rol actual es: ${user.rol}`,
              canRetry: false
            });
            return;
          }
        }

        // 4. Verificar acceso a faena específica si se requiere
        if (requiredFaena && !canAccessFaena(requiredFaena)) {
          setAuthError({
            type: 'faena_access_denied',
            message: `No tienes permisos para acceder a esta faena. Contacta al administrador si necesitas acceso.`,
            canRetry: false
          });
          return;
        }

        // Si llegamos aquí, todo está bien
        setAuthError(null);

      } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        setAuthError({
          type: 'verification_error',
          message: 'Ocurrió un error al verificar tus permisos. Intenta nuevamente.',
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
        message={authError.message}
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
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-xs">
        <div className="font-bold mb-2">🔒 Auth Debug</div>
        <div className="space-y-1">
          <div>Status: <span className="text-green-400">{debugInfo.status}</span></div>
          <div>Role: <span className="text-blue-400">{debugInfo.role}</span></div>
          <div>User ID: <span className="text-yellow-400">{debugInfo.userId}</span></div>
          <div>Valid: <span className={debugInfo.isValid ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.isValid ? 'Yes' : 'No'}
          </span></div>
          <div>Near Expiry: <span className={debugInfo.isNearExpiry ? 'text-orange-400' : 'text-green-400'}>
            {debugInfo.isNearExpiry ? 'Yes' : 'No'}
          </span></div>
          <div>Time Left: <span className="text-gray-300">{debugInfo.timeRemaining}</span></div>
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
      clearSession();
      window.location.href = '/login';
    }
  };
};

// Componente para mostrar contenido basado en roles
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700 text-sm">
            No tienes permisos para ver este contenido.
          </p>
        </div>
      );
    }
    return fallback;
  }

  return children;
};

export default PrivateRoutes;