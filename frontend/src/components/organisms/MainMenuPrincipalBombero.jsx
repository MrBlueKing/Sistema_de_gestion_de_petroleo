// src/components/templates/MenuPrincipalBombero.jsx
import Icon from "../atoms/Icon";
import icono from "../../assets/icono.png"; // Ruta del icono
import React from "react";
import Button from "../atoms/Button";
import { FaBars } from "react-icons/fa"; // ícono de hamburguesa

const MenuPrincipalBombero = () => {

  // Define la función handleClick
  const handleClick = () => {
    console.log("¡El botón fue clickeado!");
    // Aquí puedes agregar la lógica que quieras, por ejemplo redirigir, abrir un modal, etc.
  };


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-8">

      {/* Encabezado tipo card */}
      <div className="bg-white w-[320px] px-4 py-3 rounded-xl shadow-md flex items-center justify-between mb-16">
        {/* Botón de menú hamburguesa */}

        <Button
          icon={<FaBars />}
          color="transparent"  
          iconClassName="w-full h-full text-black"  
          onClick={handleClick}
        />





        {/* Botón de bienvenida */}
        <Button text=" Bienvenido: Usuario " className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm shadow hover:bg-orange-600">

        </Button>

        {/* Logo */}
        <Icon src={icono} alt="3H COOPER" className="w-16 h-16" />
      </div>

      {/* Botones funcionales */}
      <div className="flex flex-col gap-6 w-[260px]">
        <Button text="Recepción Petróleo" className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full shadow text-sm">

        </Button>
        <Button text="Cargar Combustible" className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full shadow text-sm">

        </Button>
      </div>
    </div>
  );
};

export default MenuPrincipalBombero;

