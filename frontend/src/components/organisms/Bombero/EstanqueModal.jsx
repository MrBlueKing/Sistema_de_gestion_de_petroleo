import React, { useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import { FaTimes, FaCalculator, FaExclamationTriangle } from "react-icons/fa";

// Función de utilidad para formatear números a 2 decimales
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0.00";
  }
  return parseFloat(num).toFixed(2);
};

const EstanquesModal = ({
  isOpen,
  onClose,
  estanques,
  alturasEstanques,
  handleAlturaChange,
  calcularLitrosPetroleo,
  modalAlert,
  capacidadDisponible
}) => {
  // Estado para almacenar los resultados del cálculo
  const [resultados, setResultados] = useState({
    volInicial: 0,
    volFinal: 0,
    discrepanciaIni: 0,
    discrepanciaCam: 0,
    calculoRealizado: false
  });

  // Estado local para mostrar errores de validación
  const [errorValidacion, setErrorValidacion] = useState("");

  // Limpiar resultados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setResultados({
        volInicial: 0,
        volFinal: 0,
        discrepanciaIni: 0,
        discrepanciaCam: 0,
        calculoRealizado: false
      });
      setErrorValidacion("");
    }
  }, [isOpen]);

  // Función para ejecutar el cálculo
  const ejecutarCalculo = async () => {
    // Validar que todas las alturas sean números válidos antes de ejecutar el cálculo
    let hayErrores = false;
    let mensajeError = "";

    // Verificar que todas las alturas tengan valores válidos
    Object.keys(alturasEstanques).forEach(idEstanque => {
      const alturas = alturasEstanques[idEstanque];
      const estanqueActual = estanques.find(e => e.id_estanque == idEstanque);
      
      // Verificar altura inicial
      if (!alturas.inicial || alturas.inicial === "") {
        hayErrores = true;
        mensajeError = `Falta altura inicial para el estanque ${
          estanqueActual?.nombre || idEstanque
        }`;
        return;
      } else if (isNaN(parseFloat(alturas.inicial)) || parseFloat(alturas.inicial) < 0) {
        hayErrores = true;
        mensajeError = `Altura inicial inválida para el estanque ${
          estanqueActual?.nombre || idEstanque
        }`;
        return;
      }
      
      // Verificar altura final
      if (!alturas.final || alturas.final === "") {
        hayErrores = true;
        mensajeError = `Falta altura final para el estanque ${
          estanqueActual?.nombre || idEstanque
        }`;
        return;
      } else if (isNaN(parseFloat(alturas.final)) || parseFloat(alturas.final) < 0) {
        hayErrores = true;
        mensajeError = `Altura final inválida para el estanque ${
          estanqueActual?.nombre || idEstanque
        }`;
        return;
      }
      
      // Verificar si la altura está dentro del rango válido (si existe una altura nominal)
      if (estanqueActual && estanqueActual.altura_nominal) {
        // Según el backend, si altura_medida/altura_nominal * capacidad > capacidad, hay un error
        const alturaInicial = parseFloat(alturas.inicial);
        const alturaFinal = parseFloat(alturas.final);
        
        if (alturaInicial > estanqueActual.altura_nominal) {
          hayErrores = true;
          mensajeError = `Altura inicial (${alturaInicial}) excede la altura nominal (${estanqueActual.altura_nominal}cm) para el estanque ${estanqueActual.nombre}`;
          return;
        }
        
        if (alturaFinal > estanqueActual.altura_nominal) {
          hayErrores = true;
          mensajeError = `Altura final (${alturaFinal}) excede la altura nominal (${estanqueActual.altura_nominal}cm) para el estanque ${estanqueActual.nombre}`;
          return;
        }
      }
      
      // Verificar que la altura final sea mayor que la inicial (para ingresos)
      if (parseFloat(alturas.final) < parseFloat(alturas.inicial)) {
        hayErrores = true;
        mensajeError = `Para registrar un ingreso, la altura final (${alturas.final}) debe ser mayor que la altura inicial (${alturas.inicial}) en el estanque ${estanqueActual?.nombre || idEstanque}`;
        return;
      }
    });

    if (hayErrores) {
      console.error("Error en las alturas:", mensajeError);
      setErrorValidacion(mensajeError);
      return;
    }

    // Limpiar error de validación si todo está bien
    setErrorValidacion("");

    // Ejecutar el cálculo con las alturas validadas
    const resultadoCalculo = await calcularLitrosPetroleo();
    
    if (resultadoCalculo) {
      setResultados({
        ...resultadoCalculo,
        calculoRealizado: true
      });
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-700">
            Ingreso de Alturas de Estanques
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Capacidad disponible */}
        {capacidadDisponible !== undefined && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm font-medium text-blue-800">
              Capacidad disponible: <span className="font-bold">{formatNumber(capacidadDisponible)} litros</span>
            </p>
          </div>
        )}

        {/* Alertas del modal */}
        {modalAlert.show && (
          <div
            className={`mx-6 my-4 p-3 rounded-lg flex items-center ${
              modalAlert.type === "success"
                ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
            }`}
          >
            {modalAlert.type === "error" && (
              <FaExclamationTriangle className="mr-2" />
            )}
            {modalAlert.message}
          </div>
        )}
        
        {/* Error de validación local */}
        {errorValidacion && (
          <div className="mx-6 my-4 p-3 rounded-lg flex items-center bg-red-100 text-red-800 border-l-4 border-red-500">
            <FaExclamationTriangle className="mr-2" />
            {errorValidacion}
          </div>
        )}

        <div className="p-6">
          {estanques.length === 0 ? (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-700">No hay estanques registrados para esta faena.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Ingrese las alturas iniciales y finales para cada estanque. Las alturas deben ser ingresadas en centímetros (cm).
                </p>
                <p className="text-xs text-amber-600 mb-1">
                  Nota: Use punto (.) como separador decimal, no coma (,). Ejemplo: 10.5
                </p>
                <p className="text-xs text-amber-600">
                  Importante: Para ingresos de petróleo, las alturas finales deben ser mayores que las iniciales.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {estanques.map((estanque) => (
                                      <div
                    key={estanque.id_estanque}
                    className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                  >
                    <h3 className="font-medium text-gray-700 mb-3">
                      {estanque.nombre} - Capacidad: {formatNumber(estanque.capacidad)} litros
                      {estanque.altura_nominal && <span className="ml-2 text-sm text-blue-600">(Altura nominal: {estanque.altura_nominal} cm)</span>}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">
                          Altura Inicial (cm)
                        </label>
                        <InputField
                          type="number"
                          placeholder="Altura inicial"
                          value={alturasEstanques[estanque.id_estanque]?.inicial || ""}
                          onChange={(e) =>
                            handleAlturaChange(estanque.id_estanque, {
                              inicial: e.target.value.replace(/,/g, '.'),
                              final: alturasEstanques[estanque.id_estanque]?.final || ""
                            })
                          }
                          min="0"
                          step="0.01"
                          className="bg-white rounded-md text-gray-800 border-gray-300"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">
                          Altura Final (cm)
                        </label>
                        <InputField
                          type="number"
                          placeholder="Altura final"
                          value={alturasEstanques[estanque.id_estanque]?.final || ""}
                          onChange={(e) =>
                            handleAlturaChange(estanque.id_estanque, {
                              inicial: alturasEstanques[estanque.id_estanque]?.inicial || "",
                              final: e.target.value.replace(/,/g, '.')
                            })
                          }
                          min="0"
                          step="0.01"
                          className="bg-white rounded-md text-gray-800 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para calcular */}
              <div className="flex justify-center mb-6">
                <Button
                  text="Calcular Diferencia"
                  color="orange"
                  icon={<FaCalculator className="mr-2 text-white" />}
                  onClick={ejecutarCalculo}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md shadow-sm"
                />
              </div>

              {/* Mostrar resultados si se ha realizado el cálculo */}
              {resultados.calculoRealizado && (
                <div className="bg-gray-100 rounded-lg p-4 shadow-inner">
                  <h3 className="font-medium text-gray-700 border-b pb-2 mb-3">
                    Resultados del Cálculo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-600">Volumen Inicial:</p>
                      <p className="font-bold text-gray-800">{formatNumber(resultados.volInicial)} litros</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-600">Volumen Final:</p>
                      <p className="font-bold text-gray-800">{formatNumber(resultados.volFinal)} litros</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-600">Litros Ingresados (según cálculo):</p>
                      <p className="font-bold text-gray-800">{formatNumber(resultados.volFinal - resultados.volInicial)} litros</p>
                    </div>
                    <div className={`bg-white p-3 rounded-md shadow-sm ${
                      Math.abs(resultados.discrepanciaCam) > 50 ? "border-l-4 border-red-500" : "border-l-4 border-green-500"
                    }`}>
                      <p className="text-sm text-gray-600">Diferencia con guía:</p>
                      <p className={`font-bold ${
                        Math.abs(resultados.discrepanciaCam) > 50 ? "text-red-600" : "text-green-600"
                      }`}>
                        {formatNumber(Math.abs(resultados.discrepanciaCam))} litros {resultados.discrepanciaCam > 0 ? "de más" : "de menos"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end">
          <Button
            text="Cancelar"
            color="gray"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md mr-2"
          />
          <Button
            text="Confirmar y Cerrar"
            color="orange"
            onClick={onClose}
            className={`bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md ${
              !resultados.calculoRealizado ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!resultados.calculoRealizado}
          />
        </div>
      </div>
    </div>
  );
};

export default EstanquesModal;