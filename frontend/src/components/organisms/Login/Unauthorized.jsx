import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, getAuthUser } from '../utils/session';

const Unauthorized = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const user = getAuthUser();

  const handleGoBack = () => {
    // Redirigir según el rol del usuario
    switch (userRole) {
      case 'admin':
        navigate('/administrador');
        break;
      case 'bombero':
        navigate('/bombero');
        break;
      case 'gerente':
        navigate('/gerente');
        break;
      case 'toneladas':
        navigate('/IngresoToneladas');
        break;
      case 'planificador':
        navigate('/Mantenimiento');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <div className="bg-gray-100 p-3 rounded-lg mb-6">
            <p className="text-sm text-gray-700">
              <strong>Usuario:</strong> {user?.nombre} {user?.apellido}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Rol:</strong> {userRole}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Ir a mi dashboard
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;