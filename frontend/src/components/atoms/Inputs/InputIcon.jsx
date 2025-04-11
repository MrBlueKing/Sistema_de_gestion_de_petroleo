// Descripción: Componente de icono de los input reutilizable en React
import React from 'react';

const InputIcon = ({ icon, position = 'left-3 top-3' }) => {
  return (
    <div className={`absolute ${position} text-gray-500`}>
      {icon}
    </div>
  );
};

export default InputIcon;
