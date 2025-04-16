// src/components/templates/Maquinaria.jsx
import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/List";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1 w-full p-4 text-center">
        <div className="bg-gray-200 py-6 px-4 rounded-3xl flex flex-col items-center space-y-6">
          <div className="w-full rounded-4xl">
            <StepHeader />
          </div>
          <h2 className="text-gray-700 font-medium">Tipo de Máquina</h2>

          <div className="bg-orange-500 w-full rounded-[40px] py-6 px-4 space-y-4">
            <TabProgressBar activeTab="maquinaria" />

            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Buscar"
            />

            <div className="bg-white rounded-3xl p-4">
              <List
                items={filteredMachines}
                onItemSelect={(maquina) => {
                  setSeleccion(maquina.nombre);
                  onNext(maquina.nombre); // <--- Esto ejecuta el paso a Patente
                }}
              />

            </div>
          </div>

          <div className="flex justify-between items-center w-full px-4 py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-6 h-6" />}
            />
            <PageControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <Button
              onClick={() => {
                if (seleccion) onNext(seleccion);
              }}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowRight className="text-black w-6 h-6" />}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Maquinaria;


