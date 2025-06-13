import React, { useState } from "react";
import FormRecepcion from "../../organisms/Bombero/FormRecepcion";
import FormRecepcionTrasvasije from "../../organisms/Bombero/FormRecepcionTrasvasije";

const Main = ({ tipo = "recepcion" }) => {
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
    console.log(`Datos de ${tipo} enviados:`, formData);
    // Aquí podrías hacer una llamada a la API específica según el tipo
  };

  // Determinar qué formulario renderizar
  const renderForm = () => {
    switch (tipo) {
      case "trasvasije":
        return (
          <FormRecepcionTrasvasije
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        );
      case "recepcion":
      default:
        return (
          <FormRecepcion
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        );
    }
  };

  return (
    <main className="flex-1 w-full p-2 sm:p-3 text-center">
      <div className="bg-orange-500 p-4 rounded-3xl w-full">
        {renderForm()}
      </div>
    </main>
  );
};

export default Main;