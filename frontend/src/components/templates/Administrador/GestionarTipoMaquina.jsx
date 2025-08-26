import React from "react";
import GestionarTipoMaquina from "../../organisms/Administrador/GestionarTipoMaquina";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const MenuPrincipalBombero = () => {
  return (
    <div >
      <UniversalHeader type="admin" />
      <GestionarTipoMaquina />
    </div>
  );
};

export default MenuPrincipalBombero;