import React, { useState } from "react";
import { UserContext } from "../../context/userContext";
import TipoSolicitante from "../../components/templates/Bombero/BomberoTipoSolicitante";
import Solicitante from "../../components/templates/Bombero/BomberoSolicitante";
import Maquinaria from "../../components/templates/Bombero/BomberoMaquinaria";
import Patente from "../../components/templates/Bombero/BomberoPatente";
import Consumo from "../../components/templates/Bombero/BomberoConsumo";

const BomberoNavigation = () => {
  // No necesitamos obtener user aquí, el componente Consumo lo obtendrá directamente
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estados para almacenar los datos ingresados en cada paso
  const [tipoSolicitante, setTipoSolicitante] = useState("");
  const [solicitante, setSolicitante] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState("");
  
  // Función para reiniciar todo el flujo
  const resetFlow = () => {
    setCurrentStep(1);
    setTipoSolicitante("");
    setSolicitante(null);
    setCategoriaSeleccionada("");
    setPatenteSeleccionada("");
  };
  
  // Maneja el paso siguiente y guarda el dato según el paso actual
  const handleNext = (value) => {
    if (currentStep === 1) {
      setTipoSolicitante(value);
    } else if (currentStep === 2) {
      setSolicitante(value);
      // Opcional: console.log para verificar que el id_faena viene en el objeto solicitante
      console.log("Solicitante guardado con id_faena:", value?.id_faena);
    } else if (currentStep === 3) {
      setCategoriaSeleccionada(value);
    } else if (currentStep === 4) {
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
        return <TipoSolicitante onNext={handleNext} />;
      case 2:
        return (
          <Solicitante
            onNext={handleNext}
            onPrevious={handlePrevious}
            tipoSolicitante={tipoSolicitante}
          />
        );
      case 3:
        return (
          <Maquinaria
            onNext={handleNext}
            onPrevious={handlePrevious}
            solicitante={solicitante}
            tipoSolicitante={tipoSolicitante}
          />
        );
      case 4:
        return (
          <Patente
            categoriaSeleccionada={categoriaSeleccionada}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 5:
        return (
          <Consumo
            onPrevious={handlePrevious}
            categoriaSeleccionada={categoriaSeleccionada}
            patenteSeleccionada={patenteSeleccionada}
            solicitante={solicitante}
            tipoSolicitante={tipoSolicitante}
            idFaena={solicitante?.id_faena || null}  // Pasamos explícitamente el id_faena
            resetFlow={resetFlow}
          />
        );
      default:
        return <TipoSolicitante onNext={handleNext} />;
    }
  };
  
  return <>{renderStep()}</>;
};

export default BomberoNavigation;