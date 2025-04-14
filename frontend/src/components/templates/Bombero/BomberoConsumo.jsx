import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import StepHeader from "../../molecules/StepHeader";
import PageControl from "../../molecules/PageControl";
import ConsumoForm from "../../organisms/Bombero/FormConsumo";

import Button from "../../atoms/Button/Button";
import InputField from "../../atoms/Inputs/InputField";
import { FaArrowLeft } from "react-icons/fa";

const Consumo = ({ onPrevious, categoriaSeleccionada, patenteSeleccionada }) => {
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
        <StepHeader />

        <div className="mt-4 bg-gray-200 rounded-xl p-4">
          <h2 className="text-center text-gray-700 font-medium mb-4">Consumo</h2>

          <p className="text-center text-sm text-gray-500 mb-1">
            Categoría seleccionada: <strong>{categoriaSeleccionada}</strong>
          </p>
          <p className="text-center text-sm text-gray-500 mb-4">
            Patente seleccionada: <strong>{patenteSeleccionada}</strong>
          </p>

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
