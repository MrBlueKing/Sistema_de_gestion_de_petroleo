import React, { useEffect } from "react";
import Button from "../../atoms/Button";
import { useNavigate } from "react-router-dom";

const Main = () => {
  const navigate = useNavigate();

  // Función para verificar si el token ha expirado
  const checkTokenExpiration = () => {
    const tokenTimestamp = localStorage.getItem("tokenTimestamp");
    const currentTimestamp = Date.now();
    const tokenExpirationTime = parseInt(tokenTimestamp) + 86400000; // 86400000 ms = 24 horas

    if (tokenTimestamp && currentTimestamp > tokenExpirationTime) {
      // Si el token ha expirado, eliminamos el token y redirigimos a login
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenTimestamp");
      navigate("/login");
    }
  };

  useEffect(() => {
    // Llamamos a la función de verificación cuando se carga el componente
    checkTokenExpiration();
  }, []);

  const handleButtonClick = () => {
    const token = localStorage.getItem("authToken");

    if (token) {
      // Si el token existe y no ha expirado, redirige al menú de bombero
      checkTokenExpiration(); // Verificar si el token ha expirado antes de navegar
      navigate("/menuprincipalbombero");
    } else {
      // Si no hay token, redirige al login
      navigate("/login");
    }
  };

  return (
    <main className="flex-1 w-full p-6 text-center">
      <div className="bg-black/20 py-2 px-4 rounded-lg">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-4 drop-shadow-lg ">
          Bienvenido al Sistema Petróleo
        </h1>
        <h2 className="text-xl text-gray-100 mb-6 max-w-md mx-auto">
          Plataforma para el registro y control del ingreso y consumo de
          petróleo.
        </h2>
        {/* Al presionar el botón, ejecuta la lógica para redirigir */}
        <Button
          text="Ingresar"
          onClick={handleButtonClick} // Agregar la función de clic
          color={"orange"}
          className="text-white font-bold text-2xl"
        />
      </div>
    </main>
  );
};

export default Main;
