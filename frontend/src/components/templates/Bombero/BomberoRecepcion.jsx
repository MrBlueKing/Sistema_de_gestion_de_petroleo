import React from "react";
import Main from "../../organisms/Bombero/MainRecepcion";
import Header from "../../organisms/Bombero/Header";

const BomberoRecepcion = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      <Header />
      <Main />
    </div>
  );
};

export default BomberoRecepcion;