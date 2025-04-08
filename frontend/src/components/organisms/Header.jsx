import React from "react";
import Icon from "../atoms/Icon"; // Ruta del componente Icon
import icono from "../../assets/icono.png"; // Ruta del icono

const Header = ({ showIcon = true }) => {
  return (
    <header className="w-full text-white py-4 px-6">
      {/* Usamos flex para alinear a la derecha */}
      <div className="flex justify-end items-center">
        {/* Mostrar el icono solo si showIcon es true */}
        {showIcon && <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />}
      </div>
    </header>
  );
};

export default Header;
