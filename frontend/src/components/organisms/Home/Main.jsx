import React, { useEffect, useState } from "react";
import Button from "../../atoms/Button/Button";
import { useNavigate } from "react-router-dom";

const Main = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Función para verificar si el token ha expirado
  const checkTokenExpiration = () => {
    const tokenTimestamp = localStorage.getItem("tokenTimestamp");
    const currentTimestamp = Date.now();
    const tokenExpirationTime = parseInt(tokenTimestamp) + 86400000; // 24 horas

    if (tokenTimestamp && currentTimestamp > tokenExpirationTime) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenTimestamp");
      setIsLoggedIn(false);
      setUserRole(null);
      return false;
    }
    return true;
  };

  // Verificar estado de autenticación
  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem("authToken"));
    const token = sessionData?.token;
    
    if (token && checkTokenExpiration()) {
      setIsLoggedIn(true);
      setUserRole(sessionData?.role);
    }
  }, []);

  const handleButtonClick = () => {
    const sessionData = JSON.parse(localStorage.getItem("authToken"));
    const token = sessionData?.token;
    const role = sessionData?.role;

    if (token && checkTokenExpiration()) {
      // Redirigir según rol
      const roleRoutes = {
        bombero: "/bombero",
        gerente: "/gerente", 
        admin: "/administrador",
        toneladas: "/IngresoToneladas",
        planificador: "/Mantenimiento"
      };

      const targetRoute = roleRoutes[role];
      navigate(targetRoute || "/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <main className="flex-1 w-full px-4 flex items-center justify-center">
      <div className="text-center max-w-lg">
        {/* Contenedor principal simple */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          
          {/* Título */}
          <h1 className="text-3xl font-bold text-white mb-4">
            {isLoggedIn ? 'Bienvenido de nuevo' : 'Sistema Petróleo'}
          </h1>
          
          {/* Descripción */}
          <p className="text-gray-200 mb-8 leading-relaxed">
            {isLoggedIn 
              ? 'Accede a tu panel de trabajo'
              : 'Plataforma para el registro y control del ingreso y consumo de petróleo'
            }
          </p>

          {/* Botón */}
          <Button
            text={isLoggedIn ? 'Acceder al Panel' : 'Iniciar Sesión'}
            onClick={handleButtonClick}
            color="orange"
            className="text-white font-semibold px-8 py-3"
            rounded="lg"
          />
        </div>
      </div>
    </main>
  );
};

export default Main;