import React from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import IconButton from "../../atoms/Button/IconButton";
import { FaArrowLeft, FaBars, FaHome } from "react-icons/fa";

const Main = () => {
  return (
    <main className="flex-1 w-full p-4 text-center">
      {/* Contenedor de fondo gris */}
      <div className="bg-gray-200 py-6 px-4 rounded-3xl flex flex-col items-center space-y-6">
        {/* Tarjeta naranja */}
        <div className="bg-orange-500 w-full rounded-[40px] py-8 px-4 space-y-4 ">
          <InputField placeholder="Fecha / Hora" className="bg-white" />
          <InputField placeholder="N° Guía Despacho" className="bg-white"/>
          <InputField placeholder="Cantidad Litros Recibidos" className="bg-white"/>
          <InputField placeholder="Recibo Conforme" className="bg-white"/>
          
          <InputField
  placeholder="Observación"
  isTextarea={true}
  className="bg-white rounded-[150px] px-7 py-1 min-h-[120px]"
/>

          
        </div>

        {/* Botón registrar y volver */}

        <div className="flex justify-between items-center w-full px-4 py-2">
        <Button
  to="/Bombero"
  className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
  icon={<FaHome className="text-black w-6 h-6" />}
/>


          <Button
            text="Registrar Recepción"
            color="orange"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-full shadow w-32 flex items-center justify-center"
          />
        </div>
      </div>
    </main>
  );
};

export default Main;
