import React from "react";
import Main from "../../organisms/Bombero/Main";
import Header from "../../organisms/Bombero/Header";

const MenuPrincipalBombero = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-2">
      <Header />

      <Main />
    </div>
  );
};

export default MenuPrincipalBombero;
