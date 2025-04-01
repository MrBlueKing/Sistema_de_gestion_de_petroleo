import React from "react";

const Icon = ({ src, alt, size = "w-6 h-6" }) => {
  return <img src={src} alt={alt} className={`inline-block ${size}`} />;
};

export default Icon;
