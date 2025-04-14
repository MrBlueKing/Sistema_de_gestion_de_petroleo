import React from "react";

const IconStep = ({ active, children }) => {
  return (
    <div className={`rounded-full h-10 w-10 flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
      {children}
    </div>
  );
};

export default IconStep;
