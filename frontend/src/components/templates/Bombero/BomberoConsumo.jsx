import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import PageControl from "../../molecules/PageControl";
import ConsumoForm from "../../organisms/Bombero/FormConsumo";
import { FaArrowLeft, FaTags, FaCarSide, FaStar, FaUserAlt } from "react-icons/fa";

const Consumo = ({ onPrevious, categoriaSeleccionada, patenteSeleccionada, solicitante }) => {
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1 p-4">
        <div className="mt-4 bg-gray-200 rounded-xl p-4">
          <div className="mb-3">
            {/* Header con efecto Glass */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 p-3 mb-3 shadow-lg">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl" />
              <div className="relative z-10 text-center">
                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-2">
                  <span className="text-xl">⛽</span>
                  <span className="text-base font-semibold">Cargar Combustible</span>
                </span>
                <h2 className="text-1xl font-extrabold text-white drop-shadow-sm mb-1">
                  Formulario de Consumo
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 sm:px-4">
              {/* Solicitante */}
              <div className="bg-white rounded-lg shadow p-2 sm:p-3 border-l-4 border-orange-500 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start sm:items-center gap-2 mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 mt-0.5">
                    <FaUserAlt className="text-sm sm:text-base" />
                  </div>
                  <div className="flex flex-col text-xs sm:text-sm">
                    <span className="text-gray-700 font-semibold">
                      Solicitante: <span className="font-medium text-gray-800">{solicitante || "No especificado"}</span>
                    </span>
                    <span className="text-gray-500 text-[10px] sm:text-xs">Encargado de la solicitud</span>
                  </div>
                </div>
              </div>

              {/* Categoría */}
              <div className="bg-white rounded-lg shadow p-2 sm:p-3 border-l-4 border-amber-500 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start sm:items-center gap-2 mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mt-0.5">
                    <FaTags className="text-sm sm:text-base" />
                  </div>
                  <div className="flex flex-col text-xs sm:text-sm">
                    <span className="text-gray-700 font-semibold">
                      Categoría: <span className="font-medium text-gray-800">{categoriaSeleccionada || "No seleccionada"}</span>
                    </span>
                    <span className="text-gray-500 text-[10px] sm:text-xs">Tipo de máquina</span>
                  </div>
                </div>
              </div>

              {/* Patente */}
              <div className="bg-white rounded-lg shadow p-2 sm:p-3 border-l-4 border-orange-500 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start sm:items-center gap-2 mb-1 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 mt-0.5">
                    <FaCarSide className="text-sm sm:text-base" />
                  </div>
                  <div className="flex flex-col text-xs sm:text-sm">
                    <span className="text-gray-700 font-semibold">
                      Patente: <span className="font-medium text-gray-800">{patenteSeleccionada || "No seleccionada"}</span>
                    </span>
                    <span className="text-gray-500 text-[10px] sm:text-xs">Identificador del vehículo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-orange-500 rounded-3xl p-4 space-y-4">
            <div className="flex flex-col space-y-3">
              <ConsumoForm
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
              />
            </div>
          </div>

          <div className="flex justify-between items-center w-full mt-4 px-2">
            <button className="text-black" onClick={onPrevious}>
              <FaArrowLeft className="w-6 h-6" />
            </button>
            <PageControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Consumo; 