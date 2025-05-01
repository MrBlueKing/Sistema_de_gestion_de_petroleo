import React, { useState, useContext } from "react";
import { UserContext } from "../../context/userContext"; // Import UserContext
import TipoSolicitante from "../../components/templates/Bombero/BomberoTipoSolicitante";
import Solicitante from "../../components/templates/Bombero/BomberoSolicitante";
import Maquinaria from "../../components/templates/Bombero/BomberoMaquinaria";
import Patente from "../../components/templates/Bombero/BomberoPatente";
import Consumo from "../../components/templates/Bombero/BomberoConsumo";

const BomberoNavigation = () => {
  // Get user from context
  const { user } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estados para almacenar los datos ingresados en cada paso
  const [tipoSolicitante, setTipoSolicitante] = useState("");
  const [solicitante, setSolicitante] = useState(null); // Ahora almacenamos el objeto completo
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState("");
  const [estanqueSeleccionado, setEstanqueSeleccionado] = useState({
    id_estanque: 1, // Default value, ideally you'd fetch this from an API
    nombre: "Estanque Principal",
    capacidad: 10000
  });
  
  // Maneja el paso siguiente y guarda el dato según el paso actual
  const handleNext = (value) => {
    if (currentStep === 1) {
      setTipoSolicitante(value); // Guarda el tipo de solicitante (string)
    } else if (currentStep === 2) {
      setSolicitante(value); // Guarda el objeto solicitante completo
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
            solicitante={solicitante} // Pasamos el objeto completo
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
            solicitante={solicitante} // Pasamos el objeto completo
            tipoSolicitante={tipoSolicitante}
            usuarioActual={user} // Pass the user from context
            faenaActual={user ? { id_faena: user.id_faena } : null} // Pass faena data
            estanqueSeleccionado={estanqueSeleccionado} // Pass selected tank
          />
        );
      default:
        return <TipoSolicitante onNext={handleNext} />;
    }
  };
  
  return <>{renderStep()}</>;
};

export default BomberoNavigation;