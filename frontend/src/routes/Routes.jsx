import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "./PrivateRoutes";

import GerentePage from "../pages/Gerente/GerentePage";

import AdministradorPage from "../pages/Administrador/AdministradorPage";
import AdministradorUserRegister from "../components/templates/Administrador/AdministradorUserRegister";
import GestionarTipoMaquina from "../pages/Administrador/GestionarTipoMaquina";
import GestionarMaquinaCategoria from "../pages/Administrador/GestionarMaquinCategoriaPage";
import GestionarPersonal from "../pages/Administrador/GestionarPersonalPage";

import BomberoIngresoExterno from "../pages/Bombero/BomberoIngresoExterno";
import BomberoPage from "../pages/Bombero/BomberoPage";
import BomberoRecepcionPage from "../pages/Bombero/BomberoRecepcionPage";
import BomberoNavigation from "../pages/Bombero/BomberoNavigation";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta protegida para Gerente */}
      <Route
        path="/gerente"
        element={
          <PrivateRoute requiredRole="gerente">
            {" "}
            {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <GerentePage />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Administrador */}
      <Route
        path="/administrador"
        element={
          <PrivateRoute requiredRole="admin">
            {" "}
            {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <AdministradorPage />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Administrador */}
      <Route
        path="/inicio"
        element={
          <PrivateRoute requiredRole="admin">
            {" "}
            {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <AdministradorPage />
          </PrivateRoute>
        }
      />
      {/* Ruta protegida para Administrador */}
      <Route
        path="/registroUsuario"
        element={
          <PrivateRoute requiredRole="admin">
            {" "}
            {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <AdministradorUserRegister />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Consumo Bombero */}
      <Route
        path="/GestionarTipoMaquina"
        element={
          <PrivateRoute requiredRole="admin">
            {" "}
            {/* Aquí asumo que el rol de "Bombero" es el que se asigna en tu backend */}
            <GestionarTipoMaquina />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Categorizar Maquinas Bombero */}
      <Route
        path="/GestionarMaquinaCategoria"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarMaquinaCategoria />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Gestionar Personal Bombero */}
      <Route
        path="/GestionarPersonalInterno"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPersonal />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Bombero */}
      <Route
        path="/bombero"
        element={
          <PrivateRoute requiredRole="bombero">
            {" "}
            {/* Aquí asumo que el rol de "admin" es el que se asigna en tu backend */}
            <BomberoPage />
          </PrivateRoute>
        }
      />
      {/* Ruta protegida para Recepcion Bombero */}
      <Route
        path="/bomberoRecepcion"
        element={
          <PrivateRoute requiredRole="bombero">
            {" "}
            {/* Aquí asumo que el rol de "Bombero" es el que se asigna en tu backend */}
            <BomberoRecepcionPage />
          </PrivateRoute>
        }
      />
      {/* Ruta protegida para Consumo Bombero */}
      <Route
        path="/BomberoNavigation"
        element={
          <PrivateRoute requiredRole="bombero">
            {" "}
            {/* Aquí asumo que el rol de "Bombero" es el que se asigna en tu backend */}
            <BomberoNavigation />
          </PrivateRoute>
        }
      />

      {/* Ruta protegida para Consumo Bombero */}
      <Route
        path="/IngresoExterno"
        element={
          <PrivateRoute requiredRole="bombero">
            <BomberoIngresoExterno />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
