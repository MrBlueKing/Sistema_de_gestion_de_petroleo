import React from "react";
import Main from "../../organisms/Bombero/Main";
import Header from "../../organisms/Bombero/Header";

const MenuPrincipalBombero = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-2">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 text-center">
        <div className="bg-gray-200 py-4 md:py-6 px-3 rounded-2xl md:rounded-3xl flex flex-col items-center space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <Main />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MenuPrincipalBombero;
