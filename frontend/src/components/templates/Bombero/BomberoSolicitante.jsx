// src/components/pages/SolicitantePage.jsx
import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import UserList from "../../molecules/UserList";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import {FaHome } from "react-icons/fa";

const Solicitante = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  
  // Datos de ejemplo para los usuarios
  const usuarios = [
    { id: 1, nombre: "Nombre 1" },
    { id: 2, nombre: "Nombre 2" },
    { id: 3, nombre: "Nombre 3" },
    { id: 4, nombre: "Nombre 4" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      
      <main className="flex-1 w-full p-4 text-center">
        <div className="bg-gray-200 py-6 px-4 rounded-3xl flex flex-col items-center space-y-6">
          <h2 className="text-gray-700 font-medium">Solicitado Por</h2>
          
          {/* Tarjeta naranja */}
          <div className="bg-orange-500 w-full rounded-[40px] py-6 px-4 space-y-4">
            {/* Barra de búsqueda */}
            <TabProgressBar />
            <SearchBar />
            
            {/* Lista de usuarios */}
            <div className="bg-white rounded-3xl p-4">
              <UserList usuarios={usuarios} />
            </div>
          </div>
          
          {/* Controles de paginación y botón de inicio */}
          <div className="flex justify-between items-center w-full px-4 py-2">
            
          <Button
            to="/Bombero"
            className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
            icon={<FaHome className="text-black w-6 h-6" />}
          />
            <PageControl 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Solicitante;
