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
}) => {
  const isPassword = type === 'password';
  const baseClass = `w-full ${icon ? 'pl-10' : 'pl-3'} ${isPassword ? 'pr-10' : 'pr-3'} py-2 border border-gray-300 rounded-md`;

  return (
    <div className="relative mb-4">
      {icon && <InputIcon icon={icon} position="left-3 top-3" />}

      {isTextarea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseClass} resize-none min-h-[20px] ${className}`}
        />
      ) : (
        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          className={`${baseClass} ${className}`}
          placeholder={placeholder}
        />
      )}

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
