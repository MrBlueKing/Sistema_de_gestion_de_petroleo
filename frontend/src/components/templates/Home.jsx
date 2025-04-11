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
        backgroundColor: "#f0f0f0",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <Header />
      <Main />
      <Footer />
    </div>
  );
};

export default Home;
