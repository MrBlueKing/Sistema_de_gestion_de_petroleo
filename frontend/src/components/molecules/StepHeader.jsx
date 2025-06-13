import React from "react";

const StepHeader = ({
  text = "Cargar Combustible",
  icon = "⛽",
  subtitle = "",
}) => {
  return (
    <div className="w-full">
      <div className="w-full flex flex-col items-center justify-center text-white px-4 py-3 rounded-xl shadow-md bg-gradient-to-r from-orange-600 to-amber-500 text-center">
        <span className="text-2xl md:text-3xl">{icon}</span>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold mt-1">
          {text}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg mt-1 text-white/90 italic">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StepHeader;
