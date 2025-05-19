import React, { useState, useEffect } from "react";
import { FaTimes, FaCalculator, FaInfoCircle, FaRuler, FaCheck } from "react-icons/fa";

// Componentes auxiliares
const InputAltura = ({ value, onChange, label, placeholder, disabled }) => (
  <div className="mb-2">
    <label className="text-sm text-gray-600 block">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border ${
          disabled ? "bg-gray-100" : "bg-white"
        } rounded-md p-2 pr-8 focus:border-orange-500 focus:ring focus:ring-orange-200 transition-all`}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <FaRuler className="text-gray-400" />
      </div>
    </div>
  </div>
);

const InfoBox = ({ type, message }) => (
  <div className={`p-3 rounded-lg mb-4 flex items-start ${
    type === "info" 
      ? "bg-blue-50 text-blue-800 border border-blue-200" 
      : type === "error"
      ? "bg-red-50 text-red-800 border border-red-200"
      : "bg-green-50 text-green-800 border border-green-200"
  }`}>
    <div className="flex-shrink-0 mr-2 mt-0.5">
      {type === "info" ? <FaInfoCircle /> : type === "error" ? <FaTimes /> : <FaCheck />}
    </div>
    <div>{message}</div>
  </div>
);

const EstanqueCard = ({ estanque, alturas, onChange, disabled }) => {
  // Cálculos para barra de progreso
  const porcentajeActual = alturas?.final 
    ? (parseFloat(alturas.final) / estanque.altura_nominal) * 100 
    : 0;
  
  const porcentajeFormateado = Math.min(porcentajeActual, 100).toFixed(0);
  
  const getColorBarra = (porcentaje) => {
    if (porcentaje < 30) return "bg-red-500";
    if (porcentaje < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 p-3 border-b">
        <h3 className="font-medium text-gray-800">{estanque.nombre}</h3>
        <span className="text-xs text-gray-500">
          Capacidad: {estanque.capacidad.toLocaleString()} litros
        </span>
      </div>
      
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          <InputAltura
            label="Altura Inicial (cm)"
            value={alturas?.inicial || ""}
            onChange={(e) => onChange(estanque.id_estanque, {
              inicial: e.target.value,
              final: alturas?.final || ""
            })}
            placeholder="Ingrese altura"
            disabled={disabled}
          />
          <InputAltura
            label="Altura Final (cm)"
            value={alturas?.final || ""}
            onChange={(e) => onChange(estanque.id_estanque, {
              inicial: alturas?.inicial || "",
              final: e.target.value
            })}
            placeholder="Ingrese altura"
            disabled={disabled}
          />
        </div>
        
        {alturas?.final && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Nivel estimado:</span>
              <span className="font-medium">{porcentajeFormateado}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getColorBarra(porcentajeFormateado)}`}
                style={{ width: `${porcentajeFormateado}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [loading, setLoading] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  
  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setResultadoCalculo(null);
    }
  }, [isOpen]);
  
  const handleCalcular = async () => {
    setLoading(true);
    try {
      const resultado = await calcularLitrosPetroleo();
      setResultadoCalculo(resultado);
    } finally {
      setLoading(false);
    }
  };
  
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(parseFloat(num))) {
      return "0.00";
    }
    return parseFloat(num).toFixed(2);
  };
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Encabezado del modal */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-lg font-semibold">
              Ingreso de Alturas de Estanques
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-orange-100 text-sm">
            Ingrese las alturas iniciales y finales para calcular la diferencia
          </p>
        </div>
        
        {/* Contenido del modal */}
        <div className="overflow-y-auto p-6 flex-grow">
          {/* Alertas */}
          {modalAlert.show && (
            <InfoBox
              type={modalAlert.type}
              message={modalAlert.message}
            />
          )}
          
          {/* Capacidad disponible */}
          {capacidadDisponible !== undefined && (
            <InfoBox
              type="info"
              message={
                <div>
                  <span className="font-medium">Capacidad disponible en estanques:</span>{" "}
                  <span className="font-bold">{formatNumber(capacidadDisponible)} litros</span>
                </div>
              }
            />
          )}
          
          {/* Resultado del cálculo */}
          {resultadoCalculo && (
            <InfoBox
              type="success"
              message={
                <div className="space-y-1">
                  <div className="font-medium">Cálculo realizado correctamente:</div>
                  <div className="grid grid-cols-2 gap-x-4 text-sm mt-1">
                    <div>Volumen inicial: <span className="font-medium">{formatNumber(resultadoCalculo.volInicial)} L</span></div>
                    <div>Volumen final: <span className="font-medium">{formatNumber(resultadoCalculo.volFinal)} L</span></div>
                    <div>Volumen ingresado: <span className="font-medium">{formatNumber(resultadoCalculo.volFinal - resultadoCalculo.volInicial)} L</span></div>
                    <div>Discrepancia: <span className={`font-medium ${Math.abs(resultadoCalculo.discrepanciaCam) > 50 ? "text-red-600" : "text-green-600"}`}>
                      {formatNumber(Math.abs(resultadoCalculo.discrepanciaCam))} L
                      ({resultadoCalculo.discrepanciaCam > 0 ? "de más" : "de menos"})
                    </span></div>
                  </div>
                </div>
              }
            />
          )}
          
          {/* Grid de estanques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {estanques.map((estanque) => (
              <EstanqueCard
                key={estanque.id_estanque}
                estanque={estanque}
                alturas={alturasEstanques[estanque.id_estanque]}
                onChange={handleAlturaChange}
                disabled={loading}
              />
            ))}
          </div>
          
          {/* Mensaje si no hay estanques */}
          {estanques.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No se encontraron estanques para esta faena
            </div>
          )}
        </div>
        
        {/* Pie del modal */}
        <div className="border-t px-6 py-4 flex justify-between items-center bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCalcular}
            disabled={loading}
            className={`flex items-center px-4 py-2 rounded-md text-white ${
              loading ? "bg-orange-400 cursor-wait" : "bg-orange-600 hover:bg-orange-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all`}
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Calculando...
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                Calcular Diferencia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstanquesModal;