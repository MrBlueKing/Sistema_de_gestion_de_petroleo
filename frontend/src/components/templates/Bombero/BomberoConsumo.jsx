import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import PageControl from "../../molecules/PageControl";
import ConsumoForm from "../../organisms/Bombero/FormConsumo";
import { FaArrowLeft, FaTags, FaCarSide, FaUserAlt, FaCheck, FaListAlt } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";

const Consumo = ({ onPrevious, categoriaSeleccionada, patenteSeleccionada, solicitante, tipoSolicitante = "" }) => {
  const [currentPage, setCurrentPage] = useState(4);
  const totalPages = 4;

  const [formData, setFormData] = useState({
    horometro: "",
    numeralInicial: "",
    numeralFinal: "",
    litros: "",
    fechaHora: "",
    observacion: "",
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    console.log("Datos del consumo:", formData);
    // Aquí podrías llamar a una función para guardar o enviar los datos
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-4 md:py-6 px-3 rounded-2xl md:rounded-3xl flex flex-col items-center space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            {/* Header con título descriptivo */}
            <div className="relative rounded-xl mb-3">
              <StepHeader text="Detalles de Consumo" icon={<FaListAlt className="w-5 h-5" />} />
            </div>
            
            {/* Banner de resumen */}
            <div className="w-full bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-lg mb-4 p-2 flex items-center justify-center">
              <FaCheck className="mr-2" />
              <span className="text-sm font-medium">Información de solicitud completada</span>
            </div>
            
            {/* Tarjetas de resumen mejoradas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {/* Solicitante */}
              <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start sm:items-center gap-2 mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 mt-0.5 group-hover:bg-orange-200 transition-colors">
                    <FaUserAlt className="text-sm sm:text-base" />
                  </div>
                  <div className="flex flex-col text-xs sm:text-sm text-left">
                    <span className="text-gray-700 font-semibold">
                      Solicitante: <span className="font-medium text-gray-800">{solicitante || "No especificado"}</span>
                    </span>
                    {tipoSolicitante && (
                      <span className="text-gray-500 text-[10px] sm:text-xs flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px] uppercase">
                          {tipoSolicitante}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Categoría */}
              <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 border-l-4 border-amber-500 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start sm:items-center gap-2 mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mt-0.5 group-hover:bg-amber-200 transition-colors">
                    <FaTags className="text-sm sm:text-base" />
                  </div>
                  <div className="flex flex-col text-xs sm:text-sm text-left">
                    <span className="text-gray-700 font-semibold">
                      Categoría: <span className="font-medium text-gray-800">{categoriaSeleccionada || "No seleccionada"}</span>
                    </span>
                    <span className="text-gray-500 text-[10px] sm:text-xs">Tipo de máquina</span>
                  </div>
                </div>
              </div>

              {/* Patente */}
              <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start sm:items-center gap-2 mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 mt-0.5 group-hover:bg-orange-200 transition-colors">
                    <FaCarSide className="text-sm sm:text-base" />
                  </div>
                  <div className="flex flex-col text-xs sm:text-sm text-left">
                    <span className="text-gray-700 font-semibold">
                      Patente: <span className="font-medium text-gray-800">{patenteSeleccionada || "No seleccionada"}</span>
                    </span>
                    <span className="text-gray-500 text-[10px] sm:text-xs">Identificador del vehículo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Formulario de consumo */}
          <div className="bg-orange-500 rounded-2xl md:rounded-3xl p-3 sm:p-4 w-full">
            <h3 className="text-white text-sm sm:text-base font-medium mb-3 text-left">
              Ingrese detalles del consumo
            </h3>
            <div className="bg-white rounded-xl p-3 sm:p-4">
              <ConsumoForm
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
              />
            </div>
          </div>

          {/* Controles inferiores */}
          <div className="flex justify-between items-center w-full mt-2 px-2">
            <button 
              className="flex items-center justify-center bg-white rounded-full p-2 shadow-sm hover:bg-gray-100 transition-colors" 
              onClick={onPrevious}
            >
              <FaArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <PageControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <div className="w-9 h-9"></div> {/* Espacio para equilibrar el layout */}
          </div>

          {/* Mensaje de ayuda */}
          <div className="bg-blue-50 text-blue-800 rounded-lg border border-blue-100 px-3 py-2 text-xs sm:text-sm w-full max-w-md">
            <p className="flex items-center justify-center">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span>
                Complete todos los campos requeridos y haga clic en "Guardar" para finalizar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Consumo;