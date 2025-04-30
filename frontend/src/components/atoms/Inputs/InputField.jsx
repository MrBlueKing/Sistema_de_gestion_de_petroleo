import React from "react";
import { FaEye, FaRegEyeSlash, FaCalendarAlt } from "react-icons/fa";
import InputIcon from "./InputIcon";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("es", es);

const InputField = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  icon = null,
  showPassword = false,
  setShowPassword = null,
  isTextarea = false,
  className = '',
  options = [], // Opciones del desplegable
  min = null, // Valor mínimo para inputs numéricos
  max = null, // Valor máximo para inputs numéricos
}) => {
  const isPassword = type === "password";
  const isDateTime = type === "datetime-local";
  const isNumber = type === "number";

  const baseClass = `w-full ${icon || isDateTime ? "pl-10" : "pl-3"} ${isPassword || isDateTime ? "pr-12" : "pr-3"} py-2 border border-gray-300 rounded-md`;

  // Función para manejar cambios en campos numéricos
  const handleNumberChange = (e) => {
    const newValue = e.target.value;
    
    // Si el campo está vacío, permitir (para que puedan borrar y empezar de nuevo)
    if (newValue === "") {
      onChange(e);
      return;
    }
    
    // Convertir a número para validación
    const numValue = parseFloat(newValue);
    
    // Validar que no sea negativo si min no está especificado
    if ((min === null && numValue >= 0) || 
        (min !== null && numValue >= min)) {
      onChange(e);
    }
  };

  const renderDatePicker = () => (
    <div className="relative mb-4 w-full">
      <DatePicker
        selected={value ? new Date(value) : null}
        onChange={(date) => onChange({ target: { value: date.toISOString() } })}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy HH:mm"
        locale="es"
        placeholderText={placeholder}
        className={`${baseClass} ${className} w-full`}
      />
      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
    </div>
  );

  return (
    <div className="relative mb-4 w-full">
      {icon && !isDateTime && (
        <InputIcon icon={icon} position="left-3 top-3" />
      )}

      {isTextarea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseClass} resize-none min-h-[20px] ${className}`}
        />
      ) : options.length > 0 ? (
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
      ) : isDateTime ? (
        renderDatePicker()
      ) : (
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={isNumber ? handleNumberChange : onChange}
          placeholder={placeholder}
          className={`${baseClass} ${className} w-full`}
          min={isNumber ? (min !== null ? min : "0") : undefined}
          max={isNumber && max !== null ? max : undefined}
        />
      )}

      {isPassword && setShowPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
        >
          {showPassword ? <FaEye /> : <FaRegEyeSlash />}
        </button>
      )}
    </div>
  );
};

export default InputField;