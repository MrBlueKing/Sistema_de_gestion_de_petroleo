import React from "react";

const StepHeader = ({ text = "Cargar Combustible", icon = "⛽" }) => {
  return (
    <div className="w-full">
      <div className="w-full flex items-center justify-center gap-1 sm:gap-2 md:gap-3 text-white px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl shadow-md bg-gradient-to-r from-orange-600 to-amber-500">
        <span className="text-base sm:text-lg md:text-2xl">{icon}</span>
        <span className="text-xs sm:text-sm md:text-lg font-semibold text-center truncate max-w-[80%]">
          {text}
        </span>
      </div>
    </div>
  );
};  

export default StepHeader;
