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
  className = "",
}) => {
  const isPassword = type === "password";
  const isDateTime = type === "datetime-local";

  // Se asegura que todos los campos tengan el mismo ancho, usando "w-full"
  const baseClass = `w-full ${icon || isDateTime ? "pl-10" : "pl-3"} ${
    isPassword || isDateTime ? "pr-12" : "pr-3"
  } py-2 border border-gray-300 rounded-md`;

  // Función para renderizar el DatePicker con el ícono dentro del input
  const renderDatePicker = () => (
    <div className="relative mb-4 w-full">
      <DatePicker
        selected={value ? new Date(value) : null}
        onChange={(date) =>
          onChange({ target: { value: date.toISOString() } })
        }
        showTimeSelect
        timeIntervals={15}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy HH:mm"
        locale="es"
        placeholderText={placeholder}
        className={`${baseClass} ${className} w-full`} // Asegura que tenga el 100% de ancho
      />
      {/* Icono de calendario, se posiciona dentro del campo de fecha */}
      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
    </div>
  );

  return (
    <div className="relative mb-4 w-full">
      {/* Si es un input estándar y tiene icono, se usa InputIcon */}
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
      ) : isDateTime ? (
        renderDatePicker()
      ) : (
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseClass} ${className} w-full`} // Asegura que tenga el 100% de ancho
        />
      )}

      {isPassword && setShowPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
        >
          {showPassword ? <FaRegEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
  );
};

export default InputField;
