import React from "react";
import GestionarMaquinaCategoria from "../../organisms/Bombero/GestionarMaquinaCategoria";
import Header from "../../organisms/Bombero/Header";

const GestionarTipoMaquinaTemplate = () => {
  return (
    <div>
      <Header title="Opciones" />
      <GestionarMaquinaCategoria />
    </div>
  );
};

export default GestionarTipoMaquinaTemplate;
