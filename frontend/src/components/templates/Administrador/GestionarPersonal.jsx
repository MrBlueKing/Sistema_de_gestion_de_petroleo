import React from "react";
import GestionarPersonal from "../../organisms/Administrador/GestionarPersonalExterno";
import Header from "../../organisms/Administrador/Header";

const GestionarPersonalTemplate = () => {
  return (
    <div>
      <Header/>
      <GestionarPersonal />
    </div>
  );
};

export default GestionarPersonalTemplate;
