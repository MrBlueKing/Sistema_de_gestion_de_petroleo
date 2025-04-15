import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import StepHeader from "../../molecules/StepHeader";
import TabProgressBar from "../../molecules/TabProgressBar";
import SearchBar from "../../molecules/SearchBar";
import List from "../../molecules/List";
import Button from "../../atoms/Button/Button";
import PageControl from "../../molecules/PageControl";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const Patente = ({ categoriaSeleccionada, onNext, onPrevious }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(3);
  const [seleccion, setSeleccion] = useState(null);
  const totalPages = 4;

  const patentesPorCategoria = {
    Dumper: ["Dumper1", "Dumper2", "Dumper3"],
    "Cargador Frontal": ["CF1", "CF2"],
    Camioneta: ["RYSK-12", "RYSK-16"],
    Camión: ["CMN1", "CMN2"],
    Compresor: ["COMP1", "COMP2"]
  };

  const patentes = patentesPorCategoria[categoriaSeleccionada] || [];

  const filteredPatentes = patentes.filter((p) =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPatente = (patente) => {
    console.log("Patente seleccionada:", patente);
    setSeleccion(patente);
    onNext(patente); // Ir directamente a Consumo pasando la patente seleccionada
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-1 w-full p-4 text-center">
        <div className="bg-gray-200 py-6 px-4 rounded-3xl flex flex-col items-center space-y-6">
          <div className="w-full rounded-4xl">
            <StepHeader />
          </div>
          <h2 className="text-gray-700 font-medium">Selecciona una Patente</h2>

          <div className="bg-orange-500 w-full rounded-[40px] py-6 px-4 space-y-4">
            <TabProgressBar activeTab="patente" />

            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Buscar patente"
            />

            <div className="bg-white rounded-3xl p-4">
              <List
                items={filteredPatentes.map((patente) => ({
                  nombre: patente
                }))}
                onItemSelect={(item) => handleSelectPatente(item.nombre)}
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
                if (seleccion) {
                  onNext(seleccion);
                }
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

export default Patente;
