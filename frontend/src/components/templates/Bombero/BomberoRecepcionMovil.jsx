// Componente de página completa (equivalente a BomberoRecepcion.jsx)
import React from "react";
import Header from "../../organisms/Bombero/Header";
import StepHeader from "../../molecules/StepHeader";
import FormRecepcionMovil from "../../organisms/Bombero/FormRecepcionMovil"; // Tu componente del formulario
import { FaTruck } from "react-icons/fa";

const BomberoRecepcionMovil = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-4">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader
              text="Recepción a Estanque Móvil"
              icon={<FaTruck className="w-5 h-5 sm:w-6 sm:h-6" />}
            />
          </div>
          <FormRecepcionMovil />
        </div>
      </main>
    </div>
  );
};

export default BomberoRecepcionMovil;