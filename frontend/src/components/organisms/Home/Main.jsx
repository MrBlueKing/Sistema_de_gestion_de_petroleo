import React from "react";
import Button from "../../atoms/Button";

const Main = () => {
    return (
      <main className="flex-1 w-full p-6 text-center">
        <div className="bg-black/20 py-2 px-4 rounded-lg">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-4 drop-shadow-lg ">
              Bienvenido al Sistema Petróleo
            </h1>
            <h2 className="text-xl text-gray-100 mb-6 max-w-md mx-auto"> 
             Plataforma para el registro y control del ingreso y consumo de petróleo.       
            </h2>    
            <Button text="Ingresar" to="/login" color={"orange"} className=" text-white font-bold text-2xl"/>
        </div>
      </main>
    );
  };

export default Main;