import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authCentralizadoService from '../../../services/authCentralizado';
import { UserContext } from '../../../context/userContext';

/**
 * Componente que maneja la autenticación desde el sistema centralizado
 * Se activa automáticamente cuando detecta parámetros en la URL
 */
const LoginCentralizado = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useContext(UserContext);

  useEffect(() => {
    handleCentralLogin();
  }, []);

  const handleCentralLogin = async () => {
    try {
      // Verificar si hay parámetros de autenticación en la URL
      const params = authCentralizadoService.checkUrlParams();

      if (!params) {
        // No hay parámetros, redirigir al login normal
        console.log('ℹ️ No se detectaron parámetros de autenticación centralizada');
        navigate('/login');
        return;
      }

      const { token, moduloId, rol } = params; // 🆕 Extraer también el rol

      // Intentar autenticar CON EL ROL ESPECÍFICO
      const result = await authCentralizadoService.loginWithToken(token, moduloId, rol);

      if (result.success) {
        // Limpiar URL
        authCentralizadoService.cleanUrl();

        // 🆕 IMPORTANTE: Refrescar el contexto de usuario ANTES de redirigir
        // Esto asegura que los datos del usuario estén disponibles cuando se monte el header
        console.log('🔄 Refrescando contexto de usuario antes de redirigir...');
        await refreshUser();

        // Pequeño delay para asegurar que el contexto se actualice
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirigir según rol
        redirectByRole(result.user.rol);
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error en autenticación centralizada:', err);
      setError('Error inesperado al autenticar. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  const redirectByRole = (rol) => {
    console.log('🚀 Redirigiendo según rol:', rol);

    switch (rol?.toLowerCase()) {
      case 'admin':
      case 'administrador':
        navigate('/administrador');
        break;
      case 'admin_operador':
        navigate('/AdministradorOPeradorVehiculo');  // ✅ Ruta correcta para admin_operador
        break;
      case 'gerente':
        navigate('/Gerente');
        break;
      case 'bombero':
      case 'asistente_bombero':
        navigate('/bombero');
        break;
      case 'operador_vehiculo':
      case 'operadorvehiculo':
        navigate('/OperadorVehiculo');
        break;
      case 'planificador':
        navigate('/TallerMecanico');
        break;
      case 'toneladas':
        navigate('/distpach');
        break;
      case 'jefe_mina':
      case 'jefemina':
        navigate('/Operaciones');
        break;
      default:
        console.warn('⚠️ Rol desconocido:', rol);
        navigate('/');
        break;
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    handleCentralLogin();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Autenticando...
          </h2>
          <p className="text-gray-600">
            Verificando tus credenciales con el sistema centralizado
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error de Autenticación
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Intentar Nuevamente
            </button>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Ir al Login Normal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LoginCentralizado;
