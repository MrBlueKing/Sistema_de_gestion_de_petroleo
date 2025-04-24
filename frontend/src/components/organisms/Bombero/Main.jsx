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
          color="orange"
          icon={<FaArrowCircleDown className="text-white"/>}
          text="Recepción de Combustible"
          className="w-full mb-6 py-6"
        />

        <Button
          to="/BomberoNavigation"
          className="w-full mb-6 py-6"
          icon={<FaGasPump className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
          text="Carga de Combustible"
          color="orange"
          
        />
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Sistema de Gestión de Combustible v1.0
      </p>
    </div>
  );
};

export default Main;
