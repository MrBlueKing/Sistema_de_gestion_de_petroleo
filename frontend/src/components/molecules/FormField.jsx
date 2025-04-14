import React from 'react';
import Label from '../atoms/Typography/Label';
import InputField from '../atoms/Inputs/InputField';

const FormField = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  showPassword,
  setShowPassword,
  isTextarea,
  options = [],  // Opciones del desplegable
}) => {
  return (
    <div className="mb-4">
      {/* Etiqueta del campo */}
      <Label label={label} />
      {/* Campo de entrada */}
      <InputField
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        icon={icon}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isTextarea={isTextarea}
        options={options}  // Pasar las opciones del select aquí
      />
    </div>
  );
};

export default FormField;
