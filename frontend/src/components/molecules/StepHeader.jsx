// src/components/molecules/StepHeader.jsx
import React from "react";

const StepHeader = () => {
  return (
    <div className="w-full">
      <div className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-xl shadow-md">
        <span className="text-xl">⛽</span>
        <span className="text-base font-semibold">Cargar Combustible</span>
      </div>
    </div>
  );
};

export default StepHeader;