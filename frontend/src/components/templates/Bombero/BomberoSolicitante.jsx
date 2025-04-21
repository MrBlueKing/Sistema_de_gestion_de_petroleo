import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/List";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import StepHeader from "../../molecules/StepHeader";
import { FaHome } from "react-icons/fa";


const StepSolicitante = ({ onNext }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const usersPerPage = 2;
  const totalPages = Math.ceil(4 / usersPerPage);

  const usuarios = [
    { id: 1, nombre: "Nombre 1" },
    { id: 2, nombre: "Nombre 2" },
    { id: 3, nombre: "Nombre 3" },
    { id: 4, nombre: "Nombre 4" },
  ];

  const filteredUsers = usuarios.filter((user) =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text= "Cargar Combustible"/>
          </div>

          <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg">
            Solicitado Por
          </h2>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4">
            <TabProgressBar activeTab="solicitante" />
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Buscar usuario"
            />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4">
              <List
                items={paginatedUsers}
                onItemSelect={(user) => onNext(user.nombre)}
              />
            </div>
          </div>

          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
          <Button
            to="/Bombero"
            className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
            icon={<FaHome className="text-black w-6 h-6" />}
          />
            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            <div className="w-8 sm:w-10">{/* Espacio para alinear */}</div>
          </div>

          {/* Ayuda */}
          <div className="bg-blue-50 text-blue-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
            <p className="flex items-center justify-center">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="inline-block">
                Seleccione un usuario para continuar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StepSolicitante;
