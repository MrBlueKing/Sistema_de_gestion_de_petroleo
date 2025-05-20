import React, { useState, useEffect } from "react";
import { FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaClock, FaTachometerAlt, FaGasPump, FaInfoCircle } from "react-icons/fa";
import { GiGasPump } from "react-icons/gi";
import SelectorEstanques from "../../molecules/SelectorEstanque"; // Importamos el componente compartido

const ConsumoForm = ({
  formData,
  handleChange,
  handleSubmit,
  isSaving = false,
  isSaved = false,
  hasError = false,
  errorMessage = "",
  tipoMedicion = "Kilometraje",
  // Nuevos props para el selector de estanques
  idFaena,
  estanqueSeleccionado,
  onEstanqueSelect
}) => {
  const showHorometro = tipoMedicion === "Horometro";
  const showKilometraje = tipoMedicion === "Kilometraje";
  
  // Estado para controlar si mostramos el selector de estanques
  const [mostrarSelectorEstanques, setMostrarSelectorEstanques] = useState(false);
  
  // Formatea la fecha para mostrarla en formato legible
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determina si hay un error en el numeral final
  const hasNumeralError = parseFloat(formData.numeralFinal) <= parseFloat(formData.numeralInicial) 
                          && formData.numeralFinal 
                          && formData.numeralInicial;

  // Mostrar selector de estanques una vez que se hayan ingresado litros válidos
  useEffect(() => {
    if (formData.litros && parseFloat(formData.litros) > 0) {
      setMostrarSelectorEstanques(true);
    } else {
      setMostrarSelectorEstanques(false);
    }
  }, [formData.litros]);
  
  return (
    <div className="space-y-4">
      {/* Mensajes de estado */}
      {hasError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded flex items-start">
          <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}
      
      {isSaved && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 rounded flex items-start">
          <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">Consumo guardado correctamente</span>
        </div>
      )}
      
      {/* Cabecera de tipo de medición con icono dinámico */}
      <div className="bg-orange-50 rounded-lg p-2 mb-2 flex items-center">
        {tipoMedicion === "Horometro" ? (
          <FaClock className="text-orange-500 mr-2" size={18} />
        ) : (
          <GiGasPump className="text-orange-500 mr-2" size={18} />
        )}
        <span className="text-sm font-medium text-gray-700">
          Tipo de medición: <span className="font-bold text-orange-800">{tipoMedicion}</span>
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Fecha como campo de solo lectura */}
        <div className="col-span-1">
          <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
            Fecha y Hora de Registro
          </label>
          <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-left text-sm text-gray-700 font-medium">
            {formatDate(formData.fechaHora)}
          </div>
        </div>
        
        {/* Campo de medición específico según tipo */}
        {showHorometro && (
          <div className="col-span-1">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              <span className="flex items-center">
                <FaClock className="text-gray-500 mr-1" size={14} />
                Horómetro Actual <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.horometro}
              onChange={(e) => handleChange("horometro", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ej: 1234"
            />
          </div>
        )}
        
        {showKilometraje && (
          <div className="col-span-1">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              <span className="flex items-center">
                <FaTachometerAlt className="text-gray-500 mr-1" size={14} />
                Kilometraje Actual <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.kilometraje}
              onChange={(e) => handleChange("kilometraje", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ej: 1234"
            />
          </div>
        )}
        
        {/* Numeral Inicial */}
        <div className="col-span-1">
          <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
            Numeral Inicial <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.numeralInicial}
            onChange={(e) => handleChange("numeralInicial", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: 100.5"
          />
        </div>
        
        {/* Numeral Final */}
        <div className="col-span-1">
          <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
            Numeral Final <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.numeralFinal}
            onChange={(e) => handleChange("numeralFinal", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              hasNumeralError ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Ej: 150.5"
          />
          {hasNumeralError && (
            <p className="text-left text-xs text-red-500 mt-1">
              El numeral final debe ser mayor que el inicial
            </p>
          )}
        </div>
        
        {/* Litros */}
        <div className="col-span-1">
          <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
            Litros <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.litros}
            onChange={(e) => handleChange("litros", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
            placeholder="Ej: 50"
            readOnly
          />
          <p className="text-left text-xs text-gray-500 mt-1">
            Calculado automáticamente (Numeral Final - Numeral Inicial)
          </p>
        </div>
      </div>
      
      {/* Selector de Estanques - Solo aparece cuando se han ingresado litros válidos */}
      {mostrarSelectorEstanques && (
        <div className="mt-6">
          <div className="border-t border-gray-200 pt-4 mb-3">
            <h3 className="text-left text-gray-700 font-medium text-sm sm:text-base flex items-center">
              <FaGasPump className="text-orange-500 mr-2" />
              {estanqueSeleccionado
                ? "Estanque seleccionado para este consumo"
                : "Seleccione el estanque para descontar el combustible"}
            </h3>
          </div>
          
          <SelectorEstanques 
            idFaena={idFaena} 
            onEstanqueSelect={onEstanqueSelect}
            estanqueSeleccionado={estanqueSeleccionado}
            litrosRequeridos={parseFloat(formData.litros) || 0}
            disabled={isSaving}
          />

          {/* Nota sobre el estanque seleccionado */}
          {estanqueSeleccionado && (
            <div className="mt-3 text-left">
              <p className="text-sm text-gray-600">
                Estanque seleccionado: <span className="font-medium text-gray-800">{estanqueSeleccionado.nombre}</span>
                {estanqueSeleccionado.stock_actual < parseFloat(formData.litros) && (
                  <span className="text-red-600 ml-2">
                    (Stock insuficiente: {estanqueSeleccionado.stock_actual.toLocaleString()} litros)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Observaciones */}
      <div>
        <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
          Observaciones
        </label>
        <textarea
          value={formData.observacion}
          onChange={(e) => handleChange("observacion", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Observaciones adicionales (opcional)"
          rows="3"
        ></textarea>
      </div>
      
      {/* Botón de guardar */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSaving || isSaved || hasNumeralError || !estanqueSeleccionado || (estanqueSeleccionado && estanqueSeleccionado.stock_actual < parseFloat(formData.litros))}
          className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center transition-colors ${
            isSaved 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-orange-500 hover:bg-orange-600 text-white"
          } ${(isSaving || isSaved || hasNumeralError || !estanqueSeleccionado || (estanqueSeleccionado && estanqueSeleccionado.stock_actual < parseFloat(formData.litros))) ? "opacity-80 cursor-not-allowed" : ""}`}
        >
          {isSaving ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              <span>Guardando...</span>
            </>
          ) : isSaved ? (
            <>
              <FaCheckCircle className="mr-2" />
              <span>Guardado</span>
            </>
          ) : !estanqueSeleccionado && formData.litros ? (
            <>
              <FaGasPump className="mr-2" />
              <span>Seleccione un estanque</span>
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              <span>Guardar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConsumoForm;