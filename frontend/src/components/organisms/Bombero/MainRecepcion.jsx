import React, { useState } from "react";
import Button from "../../atoms/Button/Button";
import { FaHome } from "react-icons/fa";
import FormRecepcion from "../../organisms/Bombero/FormRecepcion";
import StepHeader from "../../molecules/StepHeader";

const Main = () => {
  const [formData, setFormData] = useState({
    fechaHora: "",
    numeroGuia: "",
    litrosRecibidos: "",
    reciboConforme: "",
    observacion: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("Datos de recepción enviados:", formData);
    // Aquí podrías hacer una llamada a la API
  };

  return (
    <main className="flex-1 w-full p-2 sm:p-3  text-center">
      <div className="bg-orange-500 p-4 rounded-3xl w-full">
        <FormRecepcion
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </main>
  );
};

export default Main;
