import React from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const Button = ({
  onClick,
  className = "",
  color = "white", // ← blanco por defecto
  textColor = "", // Nuevo prop para controlar específicamente el color del texto
  text,
  to,
  rounded = "lg",
  icon,
  iconClassName = "w-5 h-5 text-black", // Icono con color negro por defecto
  active = false,
  type = "button",
  disabled = false,
  loading = false,
}) => {
  const isLink = Boolean(to);

  // Determinar color de texto e icono
  // Si se proporciona textColor, úsalo; si no, usa la lógica basada en el color de fondo
  const textColorClass = textColor 
    ? `text-${textColor}` 
    : (color === "white" ? "text-white" : "text-white"); // Modificado: para botones de colores, texto blanco por defecto

  const baseClasses = clsx(
    "inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium transition duration-200 ease-in-out",
    `rounded-${rounded}`,
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    {
      "bg-gray-400 text-white cursor-not-allowed": disabled || loading,
      "bg-blue-800 text-white": active && !disabled,
      [`bg-${color}-500 hover:bg-${
        color === "orange" ? "orange-700" : `${color}-600`
      }`]: !active && !disabled && !loading,
    },
    className
  );

  const content = (
    <>
      {loading ? (
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
      ) : (
        <>
          {icon && (
            <span
              className={`flex items-center justify-center ${iconClassName}`}
            >
              {React.cloneElement(icon, {
                className: clsx(
                  "w-full h-full",
                  textColorClass,
                  icon.props.className
                ),
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