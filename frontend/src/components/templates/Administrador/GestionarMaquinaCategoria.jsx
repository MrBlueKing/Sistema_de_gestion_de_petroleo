import React from "react";
import GestionarMaquinaCategoria from "../../organisms/Administrador/GestionarMaquinaCategoria";
import Header from "../../organisms/Administrador/Header";

const GestionarTipoMaquinaTemplate = () => {
  return (
    <div>
      <Header title="Opciones" />
      <GestionarMaquinaCategoria />
    </div>
  );
};

export default GestionarTipoMaquinaTemplate;
