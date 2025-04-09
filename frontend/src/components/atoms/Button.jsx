import React from "react";
import { Link } from "react-router-dom";  // Importa Link de react-router-dom

const Button = ({
  onClick,
  className,
  color = "white",
  text,
  to,
  rounded = "lg",
  icon,
  iconClassName = "w-6 h-6"  // Clase predeterminada para el ícono
}) => {
  // Condicional para aplicar el color de fondo
  const backgroundColor = color === "transparent" ? "bg-transparent" : `bg-${color}-500`;

  const buttonContent = (
    <>
      {icon && <span className={`mr-2 ${iconClassName}`}>{icon}</span>}  {/* El ícono ocupa todo el espacio disponible */}
      {text}
    </>
  );

  if (to) {
    return (
      <Link to={to}>  {/* Enlace para rutas internas */}
        <button
          className={`${backgroundColor} text-white px-6 py-2 rounded-${rounded} hover:bg-orange-600 transition duration-300 cursor-pointer ${className}`}
          onClick={onClick}
        >
          {buttonContent}
        </button>
      </Link>
    );
  }

  return (
    <button
      className={`${backgroundColor} text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-300 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {buttonContent}
    </button>
  );
};

export default Button;
