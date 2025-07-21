import React from "react";
import Main from "../../organisms/Bombero/Main";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const MenuPrincipalBombero = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-2">
      <UniversalHeader type="bombero" />
      <Main />
    </div>
  );
};

export default MenuPrincipalBombero;
