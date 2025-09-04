import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingButtonRendir = ({ 
  isLoading, 
  onClick, 
  children, 
  className = "", 
  disabled = false,
  type = "button"
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        relative inline-flex items-center justify-center
        transition-all duration-200
        ${isLoading ? 'cursor-not-allowed opacity-75' : 'hover:scale-105'}
        ${className}
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <FaSpinner className="h-4 w-4 animate-spin text-current" />
        </div>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
};

export default LoadingButtonRendir;