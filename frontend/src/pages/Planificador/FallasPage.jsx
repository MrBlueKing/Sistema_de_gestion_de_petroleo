import React from "react";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import FallasPanel from "../../components/organisms/Planificador/FallasPanel";

const FallasPage = () => {
  return (
    <div>
      <UniversalHeader type="planificador" />
      <FallasPanel />
    </div>
  );
};

export default FallasPage;
