import React from "react";
import fondo from "../../assets/fondo.png";
import Header from "../organisms/Home/Header";
import Footer from "../organisms/Home/Footer";
import Main from "../organisms/Home/Main";

const Home = () => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay simple para legibilidad */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Contenido */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-between">
        <Header />
        <Main />
        <Footer />
      </div>
    </div>
  );
};

export default Home;