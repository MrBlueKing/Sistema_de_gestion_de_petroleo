import React from "react";
import StepHeader from "../../molecules/StepHeader";
import Main from "../../organisms/Bombero/MainRecepcion";
import FormRecepcionMovil from "../../organisms/Bombero/FormRecepcionMovil";
import { FaArrowCircleDown, FaExchangeAlt } from "react-icons/fa";
import { RiOilFill } from "react-icons/ri";

const BomberoTemplate = ({ 
  tipo = "recepcion", 
  titulo, 
  icono, 
  FormComponent 
}) => {
  // Configuraciones por defecto para cada tipo
  const configuraciones = {
    recepcion: {
      titulo: "Recepción de Combustible",
      icono: <FaArrowCircleDown className="w-5 h-5 sm:w-6 sm:h-6" />,
      FormComponent: Main
    },
    trasvasije: {
      titulo: "Trasvasije de Combustible", 
      icono: <FaExchangeAlt className="w-5 h-5 sm:w-6 sm:h-6" />,
      FormComponent: Main
    },
    movil: {
      titulo: "Recepción a Estanque Móvil",
      icono: <RiOilFill className="w-5 h-5 sm:w-6 sm:h-6" />,
      FormComponent: FormRecepcionMovil
    }
  };

  // Usar configuración específica o valores por props
  const config = configuraciones[tipo] || configuraciones.recepcion;
  const tituloFinal = titulo || config.titulo;
  const iconoFinal = icono || config.icono;
  const ComponenteFormulario = FormComponent || config.FormComponent;

  // Validación adicional
  if (!ComponenteFormulario) {
    console.warn(`No se encontró formulario para el tipo: ${tipo}`);
    return <div>Error: Tipo de formulario no válido</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-4">

      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader
              text={tituloFinal}
              icon={iconoFinal}
            />
          </div>
          <ComponenteFormulario tipo={tipo} />
        </div>
      </main>
    </div>
  );
};

export default BomberoTemplate;