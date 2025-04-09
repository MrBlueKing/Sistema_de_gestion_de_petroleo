import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
<<<<<<< HEAD

=======
import MenuPrincipalBomberoPage from "../pages/MenuPrincipalBomberoPage";
>>>>>>> 30546930f3f3f0cea2143fcf3af13173d9e56138

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
