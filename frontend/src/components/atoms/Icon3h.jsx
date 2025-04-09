import React from "react";

const Icon = ({ 
  src, 
  alt, 
  size = "w-6 h-6", 
  className = "", 
  onClick = null 
}) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`inline-block ${size} ${className}`} 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  );
};

export default Icon;