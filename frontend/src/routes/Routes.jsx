import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import MenuPrincipalBomberoPage from "../pages/MenuPrincipalBomberoPage";
import PrivateRoute from "./PrivateRoutes"; // Importa el componente PrivateRoute
import RecepcionPetroleoPage from "../pages/RecepcionPetroleoPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recepcion" element={<RecepcionPetroleoPage />} />

      {/* Ruta protegida con PrivateRoute */}
      <Route 
        path="/menuprincipalbombero" 
        element={
          <PrivateRoute>
            <MenuPrincipalBomberoPage />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
