import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import MenuPrincipalBomberoPage from "../pages/MenuPrincipalBomberoPage";
import PrivateRoute from "./PrivateRoutes"; // Importa el componente PrivateRoute

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
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
