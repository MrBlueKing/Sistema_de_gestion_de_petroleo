import React, { useState } from "react";
import Solicitante from "../components/templates/Bombero/BomberoSolicitante";
import Maquinaria from "../components/templates/Bombero/BomberoMaquinaria";
import Patente from "../components/templates/Bombero/BomberoPatente";
import Consumo from "../components/templates/Bombero/BomberoConsumo";

const BomberoNavigation = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState(""); // Nuevo estado

  const handleNext = (value) => {
    if (currentStep === 2) {
      setCategoriaSeleccionada(value);
    }
    if (currentStep === 3) {
      setPatenteSeleccionada(value); // Guardamos la patente
    }
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Solicitante onNext={handleNext} />;
      case 2:
        return <Maquinaria onNext={handleNext} onPrevious={handlePrevious} />;
      case 3:
        return (
          <Patente
            categoriaSeleccionada={categoriaSeleccionada}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <Consumo
            onPrevious={handlePrevious}
            categoriaSeleccionada={categoriaSeleccionada}
            patenteSeleccionada={patenteSeleccionada} // Pasamos la patente
          />
        );
      default:
        return <Solicitante onNext={handleNext} />;
    }
  };

  return <>{renderStep()}</>;
};




export default BomberoNavigation;
