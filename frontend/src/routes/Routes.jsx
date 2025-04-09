import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";


const AppRoutes  = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

export default AppRoutes ;
