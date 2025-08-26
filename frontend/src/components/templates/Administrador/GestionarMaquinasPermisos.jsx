import React from "react";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import GestionarPermisoMaquinaMain from "../../organisms/Administrador/GestionarPermisoMaquinaMain";

const GestionarPersonalExternoPersonalPage = () => {
  return (
    <div>
<UniversalHeader type="admin" />
      <GestionarPermisoMaquinaMain />
    </div>    
  );
};

export default GestionarPersonalExternoPersonalPage;