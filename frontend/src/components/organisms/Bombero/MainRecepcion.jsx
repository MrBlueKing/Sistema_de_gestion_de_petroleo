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

        <div className="flex justify-between items-center w-full px-4 py-2">
          <Button
            to="/Bombero"
            className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
            icon={<FaHome className="text-black w-6 h-6" />}
          />
        </div>
    </main>
  );
};

export default Main;
