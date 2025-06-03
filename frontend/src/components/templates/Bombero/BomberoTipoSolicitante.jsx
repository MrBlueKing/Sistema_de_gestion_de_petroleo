import React from "react";

import TabProgressBar from "../../molecules/TabProgressBar";
import Button from "../../atoms/Button/Button";
import StepHeader from "../../molecules/StepHeader";
import { FaHome } from "react-icons/fa";

const TipoSolicitante = ({ onNext }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>

          <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg">
            Tipo de Solicitante
          </h2>

          {/* Contenedor principal con altura fija para evitar saltos */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="tipoSolicitante" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 flex-grow flex flex-col justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <button
                  onClick={() => onNext("interno")}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 h-24 sm:h-28 md:h-32 hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                >
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm sm:text-base md:text-lg">Interno</span>
                </button>

                <button
                  onClick={() => onNext("externo")}
                  className="bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 h-24 sm:h-28 md:h-32 hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                >
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm sm:text-base md:text-lg">Externo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              to="/Bombero"
              icon={<FaHome size={30} />}
              color="transparent" // No importa el valor, lo sobrescribiremos
              textColor="orange-600"
              className="!bg-transparent hover:!bg-transparent !shadow-none text-xl px-8 py-4 !text-orange-600" // Sobrescribe estilos
              iconClassName="w-10 h-10" // Ícono más grande
            />
            <div className="flex-1"></div>
            <div className="w-8 sm:w-10">{/* Espacio para alinear */}</div>
          </div>

          {/* Ayuda */}
          <div className="bg-blue-50 text-blue-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
            <p className="flex items-center justify-center">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="inline-block">
                Seleccione el tipo de solicitante para continuar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TipoSolicitante;