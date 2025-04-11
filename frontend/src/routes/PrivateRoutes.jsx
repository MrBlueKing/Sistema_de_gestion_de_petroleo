import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoutes = ({ children, requiredRole }) => {
  const sessionData = JSON.parse(localStorage.getItem('authToken')); // Obtener los datos del localStorage
  const isAuthenticated = sessionData?.token; // Verifica si está autenticado
  const userRole = sessionData?.role || 'desconocido'; // Obtener el rol del usuario desde el localStorage, fallback si no hay rol

  // Si no está autenticado o el rol no coincide, redirige al login
  if (!isAuthenticated || userRole !== requiredRole) {
    return <Navigate to="/login" />;
  }

  // Si está autenticado y tiene el rol correcto, renderiza la ruta
  return children;
};

export default PrivateRoutes;
