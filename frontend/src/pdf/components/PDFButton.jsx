import React from 'react';
import { FaFilePdf, FaSpinner } from 'react-icons/fa';

const PDFButton = ({ 
  onClick, 
  isGenerating = false, 
  disabled = false,
  className = "",
  size = "small"
}) => {
  const sizeClasses = {
    small: "px-3 sm:px-4 py-2 text-xs sm:text-sm",
    normal: "px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base",
    large: "px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg",
  };

  const handleClick = (e) => {
    if (disabled || isGenerating) return;
    onClick?.(e);
  };

  const isActive = !disabled && !isGenerating;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isGenerating}
      className={`
        relative overflow-hidden flex items-center justify-center gap-2 rounded-xl font-semibold 
        transition-all duration-300 transform group ${sizeClasses[size]}
        ${isActive
          ? "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl hover:shadow-orange-200/50 hover:scale-105"
          : "bg-gray-500 text-white cursor-not-allowed opacity-50"
        } ${className}
      `}
    >
      {/* Efecto de brillo */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      )}

      {/* Icono */}
      <span className={`text-lg sm:text-xl transition-transform duration-300 z-10 ${isActive ? "group-hover:rotate-6" : ""}`}>
        {isGenerating ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
      </span>

      {/* Texto */}
      <span className={`font-medium z-10 transition-all duration-300 ${isActive ? "group-hover:tracking-wide" : ""}`}>
        {isGenerating ? "Generando..." : "Generar PDF"}
      </span>
    </button>
  );
};

export default PDFButton;