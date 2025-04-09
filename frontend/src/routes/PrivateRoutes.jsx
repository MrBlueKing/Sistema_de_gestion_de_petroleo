import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("authToken"); // Verifica si el usuario está autenticado

  // Si no está autenticado, redirige a /login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si está autenticado, renderiza el contenido de la ruta
  return children;
};

export default PrivateRoute;
