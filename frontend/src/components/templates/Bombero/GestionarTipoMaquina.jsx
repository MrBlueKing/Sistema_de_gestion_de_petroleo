import React from "react";
import GestionarTipoMaquina from "../../organisms/Bombero/GestionarTipoMaquina";
import Header from "../../organisms/Bombero/Header";

const MenuPrincipalBombero = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      <GestionarTipoMaquina />
    </div>
  );
};

export default MenuPrincipalBombero;