import React from "react";
import GestionarMaquinaCategoria from "../../organisms/Administrador/GestionarMaquinaCategoria";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const GestionarTipoMaquinaTemplate = () => {
  return (
    <div>
      <UniversalHeader type="admin" />
      <GestionarMaquinaCategoria />
    </div>
  );
};

export default GestionarTipoMaquinaTemplate;
