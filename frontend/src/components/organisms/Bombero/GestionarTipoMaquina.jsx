import React, { useState } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import RadioButton from "../../atoms/Button/RadioButton";

const GestionarTipoMaquina = () => {
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoMedicion, setTipoMedicion] = useState("");
  const [error, setError] = useState("");

  const handleGuardar = () => {
    if (!nombreCategoria || !tipoMedicion) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    console.log("Categoría guardada:", {
      nombreCategoria,
      tipoMedicion,
    });
    setNombreCategoria("");
    setTipoMedicion("");
  };

  const handleReset = () => {
    setNombreCategoria("");
    setTipoMedicion("");
    setError("");
  };

  return (
    <div className="w-screen h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg overflow-hidden flex flex-col">
        <div className="bg-orange-400 px-6 py-4">
          <h2 className="text-white text-xl font-bold">
            Gestionar Tipo Máquina
          </h2>
          <p className="text-orange-50 text-sm">
            Registro y clasificación de tipos de máquinas
          </p>
        </div>

        <div className="flex-grow p-6 flex flex-col justify-between">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Categoría
              </label>
              <InputField
                placeholder="Ingrese el nombre de la categoría"
                value={nombreCategoria}
                onChange={(e) => setNombreCategoria(e.target.value)}
                className="w-full border-gray-300 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Medición
              </label>
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex flex-col gap-3">
                  <RadioButton
                    label="Horómetro"
                    name="tipoMedicion"
                    value="horometro"
                    checked={tipoMedicion === "horometro"}
                    onChange={() => setTipoMedicion("horometro")}
                  />
                  <RadioButton
                    label="Kilometraje"
                    name="tipoMedicion"
                    value="kilometraje"
                    checked={tipoMedicion === "kilometraje"}
                    onChange={() => setTipoMedicion("kilometraje")}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Seleccione el tipo de medición apropiado para esta categoría de máquina
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleReset}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
              type="button"
            >
              Cancelar
            </button>
            <Button
              text="Registrar Tipo"
              color="orange"
              onClick={handleGuardar}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionarTipoMaquina;
