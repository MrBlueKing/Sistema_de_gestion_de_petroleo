import React from 'react';
import { FaLock, FaEye, FaRegEyeSlash } from 'react-icons/fa';

const PasswordField = ({ value, onChange, showPassword, setShowPassword }) => {
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="w-full border p-2 rounded"
        placeholder="Contraseña"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-2"
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
  );
};


export default PasswordField;
