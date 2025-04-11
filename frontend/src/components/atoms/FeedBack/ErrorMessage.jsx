// Descripcion: este componente se encarga de mostrar un mensaje de error en la pantalla
import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-center text-red-600 bg-red-100 border border-red-300 p-2 rounded-md mb-4 text-sm">
      <FaExclamationCircle className="mr-2" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;
