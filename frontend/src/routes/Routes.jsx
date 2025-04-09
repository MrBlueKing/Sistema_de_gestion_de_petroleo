import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import MenuPrincipalBomberoPage from "../pages/MenuPrincipalBomberoPage";

const AppRoutes  = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menuprincipalbombero" element={<MenuPrincipalBomberoPage />} />
    </Routes>
  );
};

export default AppRoutes ;
