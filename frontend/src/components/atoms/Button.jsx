import React from "react";
import { Link } from "react-router-dom";  // Importa Link de react-router-dom

const Button = ({ onClick, className, text, to }) => {
  if (to) {
    return (
      <Link to={to}>  {/* Enlace para rutas internas */}
        <button
          className={`bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-300 cursor-pointer ${className}`}
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
