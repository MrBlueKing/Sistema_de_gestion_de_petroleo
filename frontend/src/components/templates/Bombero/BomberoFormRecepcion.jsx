import React from "react";
import StepHeader from "../../molecules/StepHeader";
import Main from "../../organisms/Bombero/MainRecepcion";
import FormRecepcionMovil from "../../organisms/Bombero/FormRecepcionMovil";
import FormRecepcionTrasvasije from "../../organisms/Bombero/FormRecepcionTrasvasije";
import { FaArrowCircleDown, FaExchangeAlt } from "react-icons/fa";
import { RiOilFill } from "react-icons/ri";

const BomberoFormRecepcion = ({ tipo = "recepcion" }) => {
    // Configuración para cada tipo
    const configuraciones = {
        recepcion: {
            titulo: "Recepción de Combustible",
            icono: <FaArrowCircleDown className="w-5 h-5 sm:w-6 sm:h-6" />,
            FormComponent: Main
        },
        movil: {
            titulo: "Recepción a Estanque Móvil",
            icono: <RiOilFill className="w-5 h-5 sm:w-6 sm:h-6" />,
            FormComponent: FormRecepcionMovil
        },
        trasvasije: {
            titulo: "Trasvasije de Combustible",
            icono: <FaExchangeAlt className="w-5 h-5 sm:w-6 sm:h-6" />,
            FormComponent: Main
        }
    };

    // Obtener configuración actual
    const config = configuraciones[tipo] || configuraciones.recepcion;
    const { titulo, icono, subtittle, FormComponent } = config;

    return (
        <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
            <FormComponent tipo={tipo} />
        </main>
    );
};

export default BomberoFormRecepcion;