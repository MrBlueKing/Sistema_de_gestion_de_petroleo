import React from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const Button = ({
  onClick,
  className = "",
  color = "orange", // ← Cambiar a orange por defecto para que se vea
  textColor = "",
  text,
  to,
  rounded = "lg",
  icon,
  iconClassName = "w-5 h-5",
  active = false,
  type = "button",
  disabled = false,
  loading = false,
}) => {
  const isLink = Boolean(to);

  // ✅ FIX: Estilos de botón más explícitos
  const getButtonStyles = () => {
    if (disabled || loading) {
      return "bg-gray-400 text-white cursor-not-allowed";
    }
    
    if (active) {
      return "bg-blue-800 text-white";
    }

    // ✅ Estilos específicos por color que SÍ funcionan
    switch (color) {
      case "orange":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      case "blue":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "green":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "red":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "gray":
        return "bg-gray-500 hover:bg-gray-600 text-white";
      default:
        return "bg-orange-500 hover:bg-orange-600 text-white"; // fallback
    }
  };

  // ✅ Determinar color de texto
  const getTextColor = () => {
    if (textColor) {
      return `text-${textColor}`;
    }
    return "text-white"; // Siempre blanco para que se vea bien
  };

  const baseClasses = clsx(
    // Estilos base
    "inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium transition duration-200 ease-in-out",
    `rounded-${rounded}`,
    "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500",
    // Estilos específicos
    getButtonStyles(),
    className
  );

  const textColorClass = getTextColor();

  const content = (
    <>
      {loading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className={textColorClass}>Cargando...</span>
        </div>
      ) : (
        <>
          {icon && (
            <span className={`flex items-center justify-center ${iconClassName}`}>
              {React.cloneElement(icon, {
                className: clsx("w-4 h-4", textColorClass, icon.props.className),
              })}
            </span>
          )}
          <span className={textColorClass}>{text}</span>
        </>
      )}
    </>
  );

  const sharedProps = {
    className: baseClasses,
    onClick,
    type,
    disabled: disabled || loading,
  };

  if (isLink) {
    return (
      <Link to={to}>
        <button {...sharedProps}>{content}</button>
      </Link>
    );
  }

  return <button {...sharedProps}>{content}</button>;
};

export default Button;