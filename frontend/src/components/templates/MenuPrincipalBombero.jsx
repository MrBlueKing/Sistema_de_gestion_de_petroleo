import React from "react";
import HeaderMenuPrincipalBombero from "../organisms/HeaderMenuPrincipalBombero";
import Main from "../organisms/Bombero/Main";

const MenuPrincipalBombero = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <HeaderMenuPrincipalBombero />
      <Main />
    </div>


      
    


  );
};

export default MenuPrincipalBombero;