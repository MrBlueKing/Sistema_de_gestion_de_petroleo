import React from "react";
import Button from "../../atoms/Button";

const Main = () => {
    return (
      <main className="flex-1 w-full p-6 text-center">
        <div className="bg-black/20 py-2 px-4 rounded-lg">   
      
            <Button text="Datos Ingreso" to="/recepcion" color={"orange"} className=" text-white font-bold text-2xl"/>
            <Button text="Datos Ingreso.2" to="/" color={"orange"} className=" text-white font-bold text-2xl"/>
      
        </div>
      </main>
    );
  };

export default Main;