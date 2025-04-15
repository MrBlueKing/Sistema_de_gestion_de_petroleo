import React, { useState } from "react";
import Button from "../../atoms/Button/Button";
import { FaHome } from "react-icons/fa";
import FormRecepcion from "../../organisms/Bombero/FormRecepcion";

const Main = () => {
  const [formData, setFormData] = useState({
    fechaHora: "",
    numeroGuia: "",
    litrosRecibidos: "",
    reciboConforme: "",
    observacion: ""
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log("Datos de recepción enviados:", formData);
    // Aquí podrías hacer una llamada a la API
  };

  return (
    <main className="flex-1 w-full p-4 text-center">
      <div className="bg-gray-200 py-6 px-4 rounded-3xl flex flex-col items-center space-y-6">
        <div className="bg-orange-500 w-full rounded-[40px] py-8 px-4 space-y-4">
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

          <Button
            text="Registrar Recepción"
            color="orange"
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-full shadow w-32 flex items-center justify-center"
          />
        </div>
      </div>
    </main>
  );
};

export default Main;
