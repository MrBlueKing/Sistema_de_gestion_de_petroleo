import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import MenuPrincipalBomberoPage from "../pages/BomberoPage";
import GerentePage from "../pages/GerentePage";
import PrivateRoute from "./PrivateRoutes"; 
import RecepcionPetroleoPage from "../pages/RecepcionPetroleoPage";
import AdministradorPage from "../pages/AdministradorPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recepcion" element={<RecepcionPetroleoPage />} />

      {/* Ruta protegida para bombero */}
      <Route 
        path="/menuprincipalbombero" 
        element={
          <PrivateRoute requiredRole="bombero">
            <MenuPrincipalBomberoPage />
          </PrivateRoute>
        } 
      />

      {/* Ruta protegida para gerente */}
      <Route 
        path="/menuprincipalgerente" 
        element={
          <PrivateRoute requiredRole="gerente">
            <GerentePage />
          </PrivateRoute>
        } 
      />

      {/* Ruta protegida para administrador */}
      <Route 
        path="/menuprincipaladministrador" 
        element={
          <PrivateRoute requiredRole="admin">
            <AdministradorPage />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
