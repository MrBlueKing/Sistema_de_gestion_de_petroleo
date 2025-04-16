import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/List";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import { FaArrowLeft } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";

const Maquinaria = ({ onNext, onPrevious }) => {
  const [currentPage, setCurrentPage] = useState(2);
  const [searchTerm, setSearchTerm] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const totalPages = 4;

  const maquinas = [
    { id: 1, nombre: "Dumper" },
    { id: 2, nombre: "Cargador Frontal" },
    { id: 3, nombre: "Camioneta" },
    { id: 4, nombre: "Camión" },
    { id: 5, nombre: "Compresor" }
  ];

  const filteredMachines = maquinas.filter((machine) =>
    machine.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMaquinaSelect = (maquina) => {
    setSeleccion(maquina.nombre);
    onNext(maquina.nombre);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-4 md:py-6 px-3 md:px-4 rounded-2xl md:rounded-3xl flex flex-col items-center space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader />
          </div>
          <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg">Tipo de Máquina</h2>

          <div className="bg-orange-500 w-full rounded-3xl md:rounded-[40px] py-4 md:py-6 px-3 md:px-4 space-y-3 md:space-y-4">
            <TabProgressBar activeTab="maquinaria" />

            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Buscar"
            />

            <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4">
              <List
                items={filteredMachines}
                onItemSelect={handleMaquinaSelect}
              />
            </div>
          </div>
          {/* Controles inferiores */}
          <div className="flex items-center w-full px-2 md:px-4 py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
            />
            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            <div className="w-18 sm:w-10">{/* Espacio para alinear */}</div>
          </div>

          {seleccion && (
            <Button
              onClick={() => onNext(seleccion)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors duration-200 mt-2"
            >
              Continuar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Maquinaria;
