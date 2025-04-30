import React, { useState } from "react";
import Header from "../../organisms/Bombero/Header";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero"; // Componente compartido
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import { FaArrowLeft } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";

const Maquinaria = ({ onNext, onPrevious }) => {
  const [currentPage, setCurrentPage] = useState(2);
  const [searchTerm, setSearchTerm] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const totalPages = 4;

  // Datos de ejemplo para maquinaria con descripciones
  const maquinas = [
    { id: 1, nombre: "Dumper", descripcion: "Vehículo de descarga" },
    { id: 2, nombre: "Cargador Frontal", descripcion: "Equipo para movimiento de tierra" },
    { id: 3, nombre: "Camioneta", descripcion: "Vehículo de transporte ligero" },
    { id: 4, nombre: "Camión", descripcion: "Vehículo de carga pesada" },
    { id: 5, nombre: "Compresor", descripcion: "Equipo para generación de aire comprimido" }
  ];

  const filteredMachines = maquinas.filter((machine) =>
    machine.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMaquinaSelect = (maquina) => {
    setSeleccion(maquina.nombre);
    onNext(maquina);
  };

  // Función para limpiar la búsqueda
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>
          
          <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg">Seleccione Tipo de Máquina</h2>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="maquinaria" />
            
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Buscar máquina"
              onClear={handleClearSearch}
            />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">
              {filteredMachines.length > 0 ? (
                <List
                  items={filteredMachines}
                  onItemSelect={handleMaquinaSelect}
                  buttonStyle={true} 
                  tipoElemento="maquinaria" // Indicamos que son máquinas para mostrar iconos adecuados
                />
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No se encontraron máquinas</p>
                    {searchTerm && (
                      <button 
                        onClick={handleClearSearch}
                        className="mt-2 text-orange-500 hover:text-orange-700 font-medium"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
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
            
            {/* Espacio para alinear el diseño */}
            <div className="w-5 h-5 md:w-6 md:h-6"></div>
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
                Seleccione una máquina para continuar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Maquinaria;