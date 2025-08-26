import React from "react";
import GestionarPermisoPersonalInterno from "../../organisms/Administrador/GestionarPermisoPersonalInterno";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const GestionarPermisoPersonalInternoTemplate = () => {
  return (
    <div>
      <UniversalHeader type="admin" />
      <GestionarPermisoPersonalInterno/>
    </div>
  );
};

export default GestionarPermisoPersonalInternoTemplate;
