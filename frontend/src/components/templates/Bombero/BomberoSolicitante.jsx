// src/components/templates/Solicitante.jsx
import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/List"; // Corregido: antes decía UserList
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import { FaArrowRight, FaHome } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";

const Solicitante = ({ onNext }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const totalPages = 4;

  const usuarios = [
    { id: 1, nombre: "Nombre 1" },
    { id: 2, nombre: "Nombre 2" },
    { id: 3, nombre: "Nombre 3" },
    { id: 4, nombre: "Nombre 4" },
  ];

  const filteredUsers = usuarios.filter((user) =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1 w-full p-4 text-center">
        <div className="bg-gray-200 py-6 px-4 rounded-3xl flex flex-col items-center space-y-6">
          <div className="w-full rounded-4xl">
            <StepHeader />
          </div>
          <h2 className="text-gray-700 font-medium">Solicitado Por</h2>

          <div className="bg-orange-500 w-full rounded-[40px] py-6 px-4 space-y-4">
            <TabProgressBar activeTab="solicitante" />
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            <div className="bg-white rounded-3xl p-4">
              <List
                items={filteredUsers}
                onItemSelect={() => {
                  onNext(); // Ejecuta la función al seleccionar
                }}
              />
            </div>
          </div>

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
            <Button
              onClick={onNext}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowRight className="text-black w-6 h-6" />}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Solicitante;
