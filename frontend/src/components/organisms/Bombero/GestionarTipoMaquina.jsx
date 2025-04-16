import React, { useState } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import RadioButton from "../../atoms/Button/RadioButton";


const GestionarTipoMaquina = () => {
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoMedicion, setTipoMedicion] = useState("");
  const [error, setError] = useState(""); // 🆕 Estado para mensaje de error

  const handleGuardar = () => {
    if (!nombreCategoria || !tipoMedicion) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setError(""); // Limpiar error si todo está bien

    console.log("Categoría guardada:", {
      nombreCategoria,
      tipoMedicion,
    });

    setNombreCategoria("");
    setTipoMedicion("");
  };

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-2 py-2">
        <div className="w-full max-w-4xl h-full bg-white shadow-md rounded-md overflow-auto p-6">
          <div className="bg-gray-200 p-3 mb-6 text-center font-medium text-lg">
            Gestionar Tipo Maquina
          </div>

          {/* 🛑 Mostrar mensaje de error si existe */}
          {error && (
            <div className="text-red-600 text-sm font-medium mb-4 text-center">
              {error}
            </div>
          )}

          <InputField
            placeholder="Nombre Categoría"
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
          />

          <div className="border rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 mb-2">Tipo Medición</div>

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

          <Button
            text="Registrar Recepción"
            color="orange"
            onClick={handleGuardar}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-full shadow w-32 flex items-center justify-center w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default GestionarTipoMaquina;
