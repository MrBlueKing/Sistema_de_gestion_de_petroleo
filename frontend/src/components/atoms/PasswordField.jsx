// atoms/PasswordField.js
import React from 'react';
import { FaLock, FaEye, FaRegEyeSlash } from 'react-icons/fa';

const PasswordField = ({ showPassword, setShowPassword }) => {
  return (
    <div className="relative mb-6">
      <div className="absolute left-3 top-3 text-gray-500">
        <FaLock size={18} />
      </div>
      <input
        type={showPassword ? "text" : "password"}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
        placeholder="Contraseña"
      />
      <button
        className="absolute right-3 top-3 text-gray-500"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <FaRegEyeSlash size={18} /> : <FaEye size={18} />}
      </button>
    </div>
  );
};

export default PasswordField;
