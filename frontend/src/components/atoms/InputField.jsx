// atoms/InputField.js
import React from 'react';
import InputIcon from './InputIcon';

const InputField = ({ icon, type, placeholder, onChange }) => {
  return (
    <div className="relative mb-4">
      <InputIcon icon={icon} position="left-3 top-3" />
      <input
        type={type}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
};

export default InputField;
