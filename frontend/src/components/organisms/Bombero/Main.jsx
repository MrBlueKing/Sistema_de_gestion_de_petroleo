import React from "react";
import { FaGasPump, FaArrowCircleDown } from "react-icons/fa";
import Button from "../../atoms/Button/Button";

const Main = () => {
  return (
    <div className="bg-gray-200 py-4 md:py-6 px-3 md:px-4 rounded-2xl md:rounded-3xl flex flex-col items-center space-y-4 md:space-y-6 max-w-4xl mx-auto w-full text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
        Sistema de Gestión de Combustible
      </h2>

      <div className="space-y-6 w-full">
        <Button
          to="/BomberoRecepcion"
          className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-md w-full shadow-md transition-colors duration-200 space-y-4 mb-6"
          icon={<FaArrowCircleDown className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
          text="Recepción de Combustible"
        />

            <Button
          to="/BomberoNavigation"
          className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-md w-full shadow-md transition-colors duration-200 space-y-4"
          icon={<FaGasPump className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
          text="Carga de Combustible"
        />       
      
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Sistema de Gestión de Combustible v1.0
      </p>
    </div>
  );
};

export default Main;
