import React, { useState, useEffect } from "react";
import { FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaClock, FaTachometerAlt, FaGasPump, FaInfoCircle } from "react-icons/fa";
import { GiGasPump } from "react-icons/gi";
import SelectorEstanques from "../../molecules/SelectorEstanque";

const ConsumoForm = ({
  formData,
  handleChange,
  handleSubmit,
  isSaving = false,
  isSaved = false,
  hasError = false,
  errorMessage = "",
  tipoMedicion = "Kilometraje",
  idFaena,
  estanqueSeleccionado,
  onEstanqueSelect,
  preloadedEstanques
}) => {
  const showHorometro = tipoMedicion === "Horometro";
  const showKilometraje = tipoMedicion === "Kilometraje";
  
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

  // Asegurarse de que idFaena sea un valor numérico
  const faenaIdForSelector = idFaena !== undefined && idFaena !== null ? Number(idFaena) : null;
  
  // Verificar si tenemos estanque suficiente para el consumo
  const tieneStockSuficiente = estanqueSeleccionado && 
    estanqueSeleccionado.stock_actual >= parseFloat(formData.litros || 0);
  
  // Verificar si el formulario está completo para habilitar el botón
  const formularioCompleto = estanqueSeleccionado && 
    formData.numeralInicial && 
    formData.numeralFinal && 
    !hasNumeralError &&
    (showHorometro ? formData.horometro : true) &&
    (showKilometraje ? formData.kilometraje : true) &&
    parseFloat(formData.litros) > 0 &&
    tieneStockSuficiente;
  
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

      {/* PASO 1: Selector de Estanques */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="mb-3">
          <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
            <FaGasPump className="text-blue-600 mr-2" />
            Paso 1: Seleccione el estanque a utilizar
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Elija el estanque del cual extraerá el combustible antes de registrar los datos de consumo
          </p>
        </div>
        
        {faenaIdForSelector ? (
          <SelectorEstanques 
            idFaena={faenaIdForSelector}
            onEstanqueSelect={onEstanqueSelect}
            estanqueSeleccionado={estanqueSeleccionado}
            litrosRequeridos={parseFloat(formData.litros) || 0}
            disabled={isSaving}
            preloadedEstanques={preloadedEstanques}
          />
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
            <div className="flex items-start">
              <FaInfoCircle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm">
                No se ha podido determinar la faena para cargar los estanques disponibles. 
                Por favor, contacte al administrador del sistema.
              </span>
            </div>
          </div>
        )}

        {/* Información del estanque seleccionado */}
        {estanqueSeleccionado && (
          <div className="mt-3 bg-white rounded-lg p-3 border border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Estanque seleccionado: {estanqueSeleccionado.nombre}
                </p>
                <p className="text-xs text-gray-600">
                  Stock disponible: {estanqueSeleccionado.stock_actual.toLocaleString()} litros
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Seleccionado
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PASO 2: Datos de consumo */}
      {estanqueSeleccionado && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="mb-3">
            <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
              <GiGasPump className="text-gray-600 mr-2" />
              Paso 2: Registre los datos de consumo
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Ingrese los datos que muestra la bomba después del suministro de combustible
            </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
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
            
            {/* Litros - Calculado automáticamente */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                Litros Consumidos
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.litros}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">L</span>
                </div>
              </div>
              <p className="text-left text-xs text-gray-500 mt-1">
                Calculado automáticamente: Numeral Final - Numeral Inicial
              </p>
              
              {/* Validación de stock suficiente */}
              {formData.litros && estanqueSeleccionado && (
                <div className="mt-2">
                  {tieneStockSuficiente ? (
                    <div className="flex items-center text-green-600 text-xs">
                      <FaCheckCircle className="mr-1" />
                      Stock suficiente en el estanque seleccionado
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 text-xs">
                      <FaExclamationTriangle className="mr-1" />
                      Stock insuficiente. Disponible: {estanqueSeleccionado.stock_actual.toLocaleString()} L
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Observaciones */}
          <div className="mt-4">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observacion}
              onChange={(e) => handleChange("observacion", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Observaciones adicionales (opcional)"
              rows="3"
            ></textarea>
          </div>
        </div>
      )}
      
      {/* Botón de guardar */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSaving || isSaved || !formularioCompleto}
          className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center transition-colors ${
            isSaved 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-orange-500 hover:bg-orange-600 text-white"
          } ${(isSaving || isSaved || !formularioCompleto) ? "opacity-80 cursor-not-allowed" : ""}`}
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
          ) : !estanqueSeleccionado ? (
            <>
              <FaGasPump className="mr-2" />
              <span>Seleccione un estanque primero</span>
            </>
          ) : !tieneStockSuficiente && formData.litros ? (
            <>
              <FaExclamationTriangle className="mr-2" />
              <span>Stock insuficiente</span>
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              <span>Guardar Consumo</span>
            </>
          )}
        </button>
        
        {/* Ayuda adicional */}
        {!estanqueSeleccionado && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Debe seleccionar un estanque antes de registrar los datos de consumo
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsumoForm;