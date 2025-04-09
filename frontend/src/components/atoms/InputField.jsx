// atoms/InputField.js
import React from 'react';
import { FaEye, FaRegEyeSlash } from 'react-icons/fa';
import InputIcon from './InputIcon';

const InputField = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  icon = null,
  showPassword = false,
  setShowPassword = null,
}) => {
  const isPassword = type === 'password';

  return (
    <div className="relative mb-4">
      {/* Icono a la izquierda si se pasa uno */}
      {icon && <InputIcon icon={icon} position="left-3 top-3" />}

      <input
        type={isPassword && showPassword ? 'text' : type}
        value={value}
        onChange={onChange}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} ${isPassword ? 'pr-10' : 'pr-3'} py-2 border border-gray-300 rounded-md`}
        placeholder={placeholder}
      />

      {/* Botón para mostrar/ocultar contraseña */}
      {isPassword && setShowPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-gray-600"
        >
          {showPassword ? <FaRegEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default InputField;
