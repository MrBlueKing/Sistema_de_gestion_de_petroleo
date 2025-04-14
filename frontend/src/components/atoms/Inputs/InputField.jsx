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
  isTextarea = false,
  className = '',
  options = [],  // Opciones del desplegable
}) => {
  const isPassword = type === 'password';
  const baseClass = `w-full ${icon ? 'pl-10' : 'pl-3'} ${isPassword ? 'pr-10' : 'pr-3'} py-2 border border-gray-300 rounded-md`;

  return (
    <div className="relative mb-4">
      {/* Icono a la izquierda si se pasa */}
      {icon && <InputIcon icon={icon} position="left-3 top-3" />}

      {/* Si es un textarea */}
      {isTextarea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseClass} resize-none min-h-[20px] ${className}`}
        />
      ) : options.length > 0 ? (  // Si hay opciones, mostramos un select
        <select
          value={value}
          onChange={onChange}
          className={`${baseClass} ${className}`}
        >
          <option value="">Seleccione una opción</option> 
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          className={`${baseClass} ${className}`}
          placeholder={placeholder}
        />
      )}

      {/* Botón para mostrar/ocultar la contraseña */}
      {isPassword && setShowPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-gray-600"
        >
          {showPassword ? <FaEye /> : < FaRegEyeSlash/>}
        </button>
      )}
    </div>
  );
};

export default InputField;
