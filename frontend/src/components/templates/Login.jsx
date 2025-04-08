import React from "react";
import fondo from "../../assets/fondo.png";
import Header from "../organisms/Header";
import Footer from "../organisms/Footer"; 
import LoginScreen from "../organisms/LoginScreen";

const Login = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{ 
        backgroundImage: `url(${fondo})`,
        backgroundColor: "#f0f0f0",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <Header />
      <LoginScreen />
      <Footer />
    </div>
  );
};

export default Login;
