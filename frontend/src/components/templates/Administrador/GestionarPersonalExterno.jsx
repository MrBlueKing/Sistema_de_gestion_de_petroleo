import React from "react";
import GestionarPersonalExterno from "../../organisms/Administrador/GestionarPersonalExterno";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const GestionarPersonalExternoTemplate = () => {
  return (
    <div>
      <UniversalHeader type="admin" />
      <GestionarPersonalExterno />
    </div>
  );
};

export default GestionarPersonalExternoTemplate;
