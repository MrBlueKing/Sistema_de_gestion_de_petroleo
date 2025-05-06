import React, { useState } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import RadioButton from "../../atoms/Button/RadioButton";
import axios from "../../../lib/axios";

const GestionarTipoMaquina = () => {
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [tipoMedicion, setTipoMedicion] = useState("");
  const [horasMantencion, setHorasMantencion] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const mostrarError = (mensaje) => {
    setError(mensaje);
    setSuccessMessage("");
    setTimeout(() => setError(""), 5000);
  };

  const mostrarExito = (mensaje) => {
    setSuccessMessage(mensaje);
    setError("");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const formatNombreCategoria = (input) => {
    return input
      .normalize("NFD")
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const validarCampos = () => {
    const nombreFormateado = formatNombreCategoria(nombreCategoria);
    if (!nombreFormateado || !tipoMedicion || !horasMantencion) {
      mostrarError("Por favor completa todos los campos.");
      return false;
    }

    if (nombreFormateado.length < 3) {
      mostrarError("El nombre de categoría debe tener al menos 3 letras.");
      return false;
    }

    if (isNaN(horasMantencion) || parseFloat(horasMantencion) < 0) {
      mostrarError("Las horas de mantención deben ser un número positivo.");
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    const nombreFormateado = formatNombreCategoria(nombreCategoria);
    if (!validarCampos()) return;

    setLoading(true);
    try {
      const response = await axios.post("/api/categorias-maquinas", {
        nombre_categoria: nombreFormateado,
        tipo_medicion: tipoMedicion,
        horas_mantencion: parseFloat(horasMantencion)
      });

      if (response.status === 201) {
        mostrarExito("Categoría de máquina registrada exitosamente.");
        handleReset(false);
      }
    } catch (err) {
      const mensaje =
        err?.response?.data?.message ||
        "Ocurrió un error al guardar la categoría. Intenta nuevamente.";
      mostrarError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (clearMessages = true) => {
    setNombreCategoria("");
    setTipoMedicion("");
    setHorasMantencion("");
    if (clearMessages) {
      setError("");
      setSuccessMessage("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4  ">
        <div className="bg-white shadow-lg overflow-hidden max-w-4xl mx-auto w-full">
          <div className="bg-orange-400 px-6 py-4">
            <h2 className="text-white text-xl font-bold">Gestionar Tipo Máquina</h2>
            <p className="text-orange-50 text-sm">
              Registro y clasificación de tipos de máquinas
            </p>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-between">
            {error && (
              <div className="mb-6 bg-red-100 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-100 border-l-4 border-green-500 p-4 rounded text-sm text-green-700 font-medium">
                {successMessage}
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
                      value="Horometro"
                      checked={tipoMedicion === "Horometro"}
                      onChange={() => setTipoMedicion("Horometro")}
                    />
                    <RadioButton
                      label="Kilometraje"
                      name="tipoMedicion"
                      value="Kilometraje"
                      checked={tipoMedicion === "Kilometraje"}
                      onChange={() => setTipoMedicion("Kilometraje")}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 text-left">
                    Seleccione el tipo de medición apropiado para esta categoría de máquina
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas/Km de Mantención
                </label>
                <InputField
                  type="number"
                  placeholder={tipoMedicion === "Horometro" ? "Ingrese horas para mantención" : "Ingrese kilómetros para mantención"}
                  value={horasMantencion}
                  onChange={(e) => setHorasMantencion(e.target.value)}
                  className="w-full border-gray-300 focus:ring-orange-400 focus:border-orange-400"
                  min="0"
                  step="0.01"
                />
                <p className="mt-2 text-xs text-gray-500 text-left">
                  {tipoMedicion === "Horometro" 
                    ? "Indique cada cuántas horas debe realizarse el mantenimiento" 
                    : tipoMedicion === "Kilometraje" 
                      ? "Indique cada cuántos kilómetros debe realizarse el mantenimiento"
                      : "Seleccione primero un tipo de medición"}
                </p>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => handleReset(true)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
                  type="button"
                >
                  Cancelar
                </button>
                <Button
                  text={loading ? "Guardando..." : "Registrar Tipo"}
                  color="orange"
                  onClick={handleGuardar}
                  disabled={loading}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 ${loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500">
            Sistema de Gestión de Combustible • {new Date().getFullYear()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GestionarTipoMaquina;