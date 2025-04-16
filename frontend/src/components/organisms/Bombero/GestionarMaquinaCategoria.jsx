import React, { useState } from "react";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";

const GestionarMaquinaCategoria = () => {
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [nombreMaquina, setNombreMaquina] = useState("");
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("");
  const [error, setError] = useState("");

  const categorias = [
    { id: 1, nombre: "Dumper" },
    { id: 2, nombre: "Compresor" },
    { id: 3, nombre: "Camión" },
  ];

  const maquinas = [
    { id: 101, nombre: "Dumper 1", categoria: "Dumper" },
    { id: 102, nombre: "Dumper 2", categoria: "Dumper" },
    { id: 201, nombre: "Compresor 1", categoria: "Compresor" },
    { id: 202, nombre: "Compresor 2", categoria: "Compresor" },
    { id: 301, nombre: "Camión 1", categoria: "Camión" },
    { id: 302, nombre: "Camión 2", categoria: "Camión" },
  ];

  const faenas = ["Catemu", "Cabildo", "Til Til"];

  const handleGuardar = () => {
    if (!nombreCategoria || !nombreMaquina || !faenaSeleccionada) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    console.log("Máquina registrada:", {
      categoria: nombreCategoria,
      maquina: nombreMaquina,
      faena: faenaSeleccionada,
    });
    setNombreCategoria("");
    setNombreMaquina("");
    setFaenaSeleccionada("");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-xl overflow-hidden flex flex-col h-full">
        <div className="bg-orange-400 px-6 py-4">
          <h2 className="text-white text-2xl font-bold">
            Categorización de Equipos
          </h2>
          <p className="text-orange-50 text-sm">
            Registro y administración de maquinaria
          </p>
        </div>

        <div className="p-6 flex-grow overflow-auto">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría de Máquina
              </label>
              <SearchableDropdown
                options={categorias.map((cat) => cat.nombre)}
                selected={nombreCategoria}
                onSelect={(value) => {
                  setNombreCategoria(value);
                  setNombreMaquina("");
                }}
                placeholder="Selecciona categoría de máquina"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Máquina
              </label>
              <SearchableDropdown
                options={
                  nombreCategoria
                    ? maquinas
                        .filter((m) => m.categoria === nombreCategoria)
                        .map((m) => m.nombre)
                    : []
                }
                selected={nombreMaquina}
                onSelect={(value) => setNombreMaquina(value)}
                placeholder={
                  nombreCategoria
                    ? "Selecciona nombre de máquina"
                    : "Primero selecciona una categoría"
                }
              />
              {nombreCategoria &&
                maquinas.filter((m) => m.categoria === nombreCategoria).length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No hay máquinas disponibles en esta categoría
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faena
              </label>
              <SearchableDropdown
                options={faenas}
                selected={faenaSeleccionada}
                onSelect={(value) => setFaenaSeleccionada(value)}
                placeholder="Selecciona faena"
              />
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-3">
            <button
              onClick={() => {
                setNombreCategoria("");
                setNombreMaquina("");
                setFaenaSeleccionada("");
                setError("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <Button
              text="Registrar Máquina"
              color="blue"
              onClick={handleGuardar}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionarMaquinaCategoria;
