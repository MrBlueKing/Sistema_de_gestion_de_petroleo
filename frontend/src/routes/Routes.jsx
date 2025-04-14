import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "./PrivateRoutes"; 
import AdministradorPage from "../pages/AdministradorPage";
import AdministradorUserRegister from "../components/templates/Administrador/AdministradorUserRegister";
import BomberoPage from "../pages/BomberoPage";
import BomberoRecepcionPage from "../pages/BomberoRecepcionPage";
import BomberoNavigation from "../pages/BomberoNavigation";

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

      {/* Ruta protegida para Bombero */}
      <Route 
        path="/bombero" 
        element={
          <PrivateRoute requiredRole="bombero"> {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <BomberoPage />
          </PrivateRoute>
        } 
      /> 

      {/* Ruta protegida para Recepcion Bombero */}
      <Route 
        path="/bomberoRecepcion" 
        element={
          <PrivateRoute requiredRole="bombero"> {/* Aquí asumo que el rol de "Bombero" es el que se asigna en tu backend */}
            <BomberoRecepcionPage />
          </PrivateRoute>
        } 
      /> 

      {/* Ruta protegida para Consumo Bombero */}
      <Route 
        path="/BomberoNavigation" 
        element={
          <PrivateRoute requiredRole="bombero"> {/* Aquí asumo que el rol de "Bombero" es el que se asigna en tu backend */}
            <BomberoNavigation />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
