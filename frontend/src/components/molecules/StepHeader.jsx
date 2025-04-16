import React from "react";

const StepHeader = () => {
  return (
    <div className="w-full px-1 sm:px-2 md:px-4">
      <div className="w-full flex items-center justify-center gap-1 sm:gap-2 md:gap-3 bg-orange-500 text-white px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl shadow-md">
        <span className="text-base sm:text-lg md:text-2xl">⛽</span>
        <span className="text-xs sm:text-sm md:text-lg font-semibold text-center truncate max-w-[80%]">
          Cargar Combustible
        </span>
      </div>
    </div>
  );
};

export default StepHeader;