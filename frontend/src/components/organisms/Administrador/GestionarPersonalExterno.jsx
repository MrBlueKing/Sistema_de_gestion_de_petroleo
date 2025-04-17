import React, { useState } from "react";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";

const RegistrarSolicitante = () => {
  const [solicitanteSeleccionado, setSolicitanteSeleccionado] = useState("");
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("");
  const [error, setError] = useState("");

  const solicitantes = [
    { id: 1, nombre: "María González", rut: "12.345.678-9" },
    { id: 2, nombre: "Carlos Rodríguez", rut: "23.456.789-0" },
    { id: 3, nombre: "Alejandra Soto", rut: "34.567.890-1" },
  ];

  const faenas = ["Catemu", "Cabildo", "Til Til"];
  const opcionesSolicitantes = solicitantes.map(
    (sol) => `${sol.rut} - ${sol.nombre}`
  );

  const handleGuardar = () => {
    if (!solicitanteSeleccionado || !faenaSeleccionada) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    console.log("Solicitante registrado:", {
      solicitante: solicitanteSeleccionado,
      faena: faenaSeleccionada,
    });
    setSolicitanteSeleccionado("");
    setFaenaSeleccionada("");
  };

  const handleReset = () => {
    setSolicitanteSeleccionado("");
    setFaenaSeleccionada("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Encabezado naranja */}
        <div className="bg-orange-400 px-6 py-4">
          <h2 className="text-white text-xl font-bold">
            Registrar Solicitante
          </h2>
          <p className="text-orange-50 text-sm">
            Asignación de solicitantes a faenas
          </p>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6 sm:p-8 min-h-[500px] flex flex-col justify-between">
          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Solicitante
              </label>
              <SearchableDropdown
                options={opcionesSolicitantes}
                selected={solicitanteSeleccionado}
                onSelect={(value) => setSolicitanteSeleccionado(value)}
                placeholder="Seleccione RUT y nombre del solicitante"
              />
              <p className="mt-2 text-xs text-gray-500">
                Seleccione un solicitante de la lista
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faena
              </label>
              <SearchableDropdown
                options={faenas}
                selected={faenaSeleccionada}
                onSelect={(value) => setFaenaSeleccionada(value)}
                placeholder="Seleccione la faena"
              />
              <p className="mt-2 text-xs text-gray-500">
                Seleccione la faena correspondiente
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-auto">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
            >
              Cancelar
            </button>
            <Button
              text="Registrar Solicitante"
              color="orange"
              onClick={handleGuardar}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegistrarSolicitante;
