import React from "react";
import { Link } from "react-router-dom";  // Importa Link de react-router-dom

const Button = ({ onClick, className, color="white", text, to, rounded = "lg" }) => {
  if (to) {
    return (
      <Link to={to}>  {/* Enlace para rutas internas */}
        <button
          className={`bg-${color}-500 text-whiteq px-6 py-2 rounded-${rounded} hover:bg-orange-600 transition duration-300 cursor-pointer ${className}`}
          onClick={onClick}
        >
          {text}
        </button>
      </Link>
    );
  }

  return (
    <button
      className={`bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-300 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
