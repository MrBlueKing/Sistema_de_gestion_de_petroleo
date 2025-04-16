// BomberoNavigation.jsx
// Componente que maneja la navegación entre los distintos pasos del formulario de Bombero

import React, { useState } from "react";
import Solicitante from "../../components/templates/Bombero/BomberoSolicitante";
import Maquinaria from "../../components/templates/Bombero/BomberoMaquinaria";
import Patente from "../../components/templates/Bombero/BomberoPatente";
import Consumo from "../../components/templates/Bombero/BomberoConsumo";

const BomberoNavigation = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Estados para almacenar los datos ingresados en cada paso
  const [solicitante, setSolicitante] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState("");

  // Maneja el paso siguiente y guarda el dato según el paso actual
  const handleNext = (value) => {
    if (currentStep === 1) {
      setSolicitante(value);
    } else if (currentStep === 2) {
      setCategoriaSeleccionada(value);
    } else if (currentStep === 3) {
      setPatenteSeleccionada(value);
    }
    setCurrentStep((prev) => prev + 1);
  };

  // Maneja el paso anterior
  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Renderiza el paso correspondiente
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Solicitante onNext={handleNext} />;
      case 2:
        return (
          <Maquinaria
            onNext={handleNext}
            onPrevious={handlePrevious}
            solicitante={solicitante}
          />
        );
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
            patenteSeleccionada={patenteSeleccionada}
            solicitante={solicitante}
          />
        );
      default:
        return <Solicitante onNext={handleNext} />;
    }
  };

  return <>{renderStep()}</>;
};

export default BomberoNavigation;
