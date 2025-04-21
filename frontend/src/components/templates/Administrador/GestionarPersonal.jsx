import React from "react";
import GestionarPersonal from "../../organisms/Administrador/GestionarPersonal";
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
