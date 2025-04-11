import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "./PrivateRoutes"; 
import AdministradorPage from "../pages/AdministradorPage";
import AdministradorUserRegister from "../components/templates/Administrador/AdministradorUserRegister";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta protegida para Administrador */}
      <Route 
        path="/administrador" 
        element={
          <PrivateRoute requiredRole="admin"> {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <AdministradorPage />
          </PrivateRoute>
        } 
      /> <Route path="registroUsuario" element={<AdministradorUserRegister />} />
    </Routes>
  );
};

export default AppRoutes;
