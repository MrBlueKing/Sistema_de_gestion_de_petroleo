// Main.jsx - Componente simplificado
import React from "react";
import FormRecepcion from "../../organisms/Bombero/FormRecepcion";

const Main = () => {
  return (
    <main className="flex-1 w-full p-2 sm:p-3 text-center">
      <div className="bg-orange-500 p-4 rounded-3xl w-full">
        <FormRecepcion />
      </div>
    </main>
  );
};

export default Main;