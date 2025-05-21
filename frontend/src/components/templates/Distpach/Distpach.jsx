import React from "react";
import Header from "../../organisms/Distpach/Header";
import Main from "../../organisms/Distpach/MainIngresoDatos";

const MenuPrincipalBombero = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <Main />
        </div>
    );
};

export default MenuPrincipalBombero;
