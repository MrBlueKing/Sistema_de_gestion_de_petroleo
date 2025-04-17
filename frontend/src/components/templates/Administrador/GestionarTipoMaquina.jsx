import React from "react";
import GestionarTipoMaquina from "../../organisms/Administrador/GestionarTipoMaquina";
import Header from "../../organisms/Bombero/Header";

const MenuPrincipalBombero = () => {
  return (
    <div >
       <Header title="Opciones" />
      <GestionarTipoMaquina />
    </div>
  );
};

export default MenuPrincipalBombero;