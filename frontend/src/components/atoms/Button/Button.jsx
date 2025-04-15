import React from "react";
import { Link } from "react-router-dom";

// Botón de la aplicación
const Button = ({
  onClick,
  className = "",
  color = "white",       // blanco por defecto
  text,
  to,
  rounded = "lg",
  icon,
  iconClassName = "w-6 h-6",
  active = false,
  type = "button",       // para permitir submit
  disabled = false       // para desactivar el botón
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    px-6 py-2 text-white font-medium transition duration-300 
    rounded-${rounded} focus:outline-none
  `;

  const bgColor =
    disabled
      ? "bg-gray-400 cursor-not-allowed"
      : active
      ? "bg-blue-800"
      : `bg-${color}-500 hover:bg-${color}-600`;

  const buttonContent = (
    <>
      {icon && <span className={iconClassName}>{icon}</span>}
      {text}
    </>
  );

  const finalClass = `${baseClasses} ${bgColor} ${className}`.trim();

  if (to) {
    return (
      <Link to={to}>
        <button
          className={finalClass}
          onClick={onClick}
          type={type}
          disabled={disabled}
        >
          {buttonContent}
        </button>
      </Link>
    );
  }

  return (
    <button
      className={finalClass}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {buttonContent}
    </button>
  );
};

export default Button;
