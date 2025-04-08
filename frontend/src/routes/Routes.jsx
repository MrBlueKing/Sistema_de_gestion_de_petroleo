import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import Test from "../components/templates/test"; // Cambia la ruta según tu estructura de carpetas

const AppRoutes  = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

export default AppRoutes ;
