import React, { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaCalculator,
  FaInfoCircle,
  FaRuler,
  FaCheck,
  FaGasPump,
  FaExclamationTriangle,
  FaArrowRight,
  FaQuestionCircle,
  FaWater,
  FaChartLine,
  FaClipboardCheck,
  FaOilCan,
} from "react-icons/fa";

// Componentes auxiliares
const InputNivel = ({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  unidad = "cm",
}) => (
  <div className="mb-3">
    <label className="text-sm font-medium text-gray-700 block mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border ${
          disabled ? "bg-gray-100" : "bg-white"
        } rounded-lg p-3 pr-14 text-base md:text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm ${
          !disabled && "group-hover:border-orange-300"
        } appearance-none`}
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-sm mr-1 font-medium">{unidad}</span>
        <FaRuler className="text-gray-400" />
      </div>
      <div className="absolute inset-0 border-2 border-transparent rounded-lg pointer-events-none transition-all group-hover:border-orange-200"></div>
    </div>
  </div>
);

// Componente de notificación/alerta optimizado
const InfoBox = ({ type, message }) => (
  <div
    className={`p-4 rounded-lg mb-4 flex items-start ${
      type === "info"
        ? "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
        : type === "error"
        ? "bg-red-50 text-red-800 border-l-4 border-red-500"
        : "bg-green-50 text-green-800 border-l-4 border-green-500"
    }`}
  >
    <div className="flex-shrink-0 mr-3 mt-0.5">
      {type === "info" ? (
        <FaInfoCircle className="text-blue-600" size={20} />
      ) : type === "error" ? (
        <FaExclamationTriangle className="text-red-600" size={20} />
      ) : (
        <FaCheck className="text-green-600" size={20} />
      )}
    </div>
    <div className="text-sm md:text-base">{message}</div>
  </div>
);

// Componente de tarjeta de estadísticas con diseño responsive
const StatCard = ({
  icon,
  title,
  value,
  colorClass,
  iconBgClass,
  unit = "litros",
}) => (
  <div
    className={`bg-white rounded-lg p-4 border shadow-sm hover:shadow transition-shadow ${colorClass}`}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${iconBgClass}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-xs sm:text-sm text-gray-600 font-medium">{title}</p>
        <p className="font-bold text-base sm:text-lg text-gray-800 mt-0.5 flex items-baseline">
          {value}
          <span className="text-xs text-gray-500 ml-1 font-medium">{unit}</span>
        </p>
      </div>
    </div>
  </div>
);

// Indicador de progreso optimizado para mobile
const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="relative flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrentStep = index === currentStep;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded-full transition-colors ${
                    isActive ? "bg-orange-500" : "bg-gray-300"
                  }`}
                />
              )}
              <div className="relative">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  } ${isCurrentStep ? "ring-4 ring-orange-100" : ""}`}
                >
                  {isActive ? (
                    index < currentStep ? (
                      <FaCheck className="w-3 h-3" />
                    ) : (
                      index + 1
                    )
                  ) : (
                    index + 1
                  )}
                </div>
                <div
                  className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium ${
                    isActive ? "text-orange-800" : "text-gray-500"
                  }`}
                >
                  {/* Nombres de pasos abreviados para mobile */}
                  <span className="hidden sm:inline">{step}</span>
                  <span className="inline sm:hidden">{step.split(" ")[0]}</span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const EstanquesModal = ({
  isOpen,
  onClose,
  estanques = [],
  alturasEstanques = {},
  handleAlturaChange,
  calcularLitrosPetroleo,
  modalAlert = { show: false, message: "", type: "" },
  capacidadDisponible = 0,
  litrosRecibidos = 0,
}) => {
  const [loading, setLoading] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const errorRef = useRef(null);
  const modalRef = useRef(null);

  // Estado para controlar el paso actual (niveles iniciales o finales)
  const [paso, setPaso] = useState("inicial"); // 'inicial' o 'final'

  // Estado para controlar la visualización de la ayuda
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // Detectar si el dispositivo es móvil basado en el ancho de pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setResultadoCalculo(null);
      setPaso("inicial");
      setMostrarAyuda(false);

      // Scroll al inicio cuando se abre el modal (para móviles)
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // Desplazamiento automático al error cuando aparece
  useEffect(() => {
    if (
      modalAlert &&
      modalAlert.show &&
      modalAlert.type === "error" &&
      errorRef.current
    ) {
      if (isMobile) {
        // En móvil, centrar el error en la pantalla
        errorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [modalAlert, isMobile]);

  // Verificar si se han ingresado todos los niveles iniciales
  const nivelesInicialesCompletos = () => {
    if (!Array.isArray(estanques) || estanques.length === 0) return false;

    return estanques.every((estanque) => {
      const alturas = alturasEstanques[estanque.id_estanque] || {};
      return alturas.inicial && alturas.inicial !== "";
    });
  };

  // Verificar si se han ingresado todos los niveles finales
  const nivelesFinalesCompletos = () => {
    if (!Array.isArray(estanques) || estanques.length === 0) return false;

    return estanques.every((estanque) => {
      const alturas = alturasEstanques[estanque.id_estanque] || {};
      return alturas.final && alturas.final !== "";
    });
  };

  // Simplemente avanzar al paso de niveles finales
  const avanzarANivelesFinales = () => {
    if (nivelesInicialesCompletos()) {
      setPaso("final");

      // Scroll al inicio en dispositivos móviles
      if (isMobile && modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    } else {
      // Mostrar mensaje de error (debería reflejarse en modalAlert)
      console.log(
        "Debe completar todos los niveles iniciales antes de continuar"
      );
    }
  };

  // Manejar el cálculo de diferencia
  const handleCalcular = async () => {
    // Verificar que todos los niveles finales estén completos
    if (!nivelesFinalesCompletos()) {
      console.log("Debe completar todos los niveles finales antes de calcular");
      return;
    }

    setLoading(true);
    try {
      // Usar la función calcularLitrosPetroleo del componente padre
      // Esta función ya hace todo el procesamiento necesario
      const resultado = await calcularLitrosPetroleo();

      // Si tenemos un resultado válido, lo guardamos
      if (resultado) {
        setResultadoCalculo(resultado);

        // Scroll al inicio en dispositivos móviles para mostrar el resultado
        if (isMobile && modalRef.current) {
          setTimeout(() => {
            modalRef.current.scrollTop = 0;
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error al calcular los litros de petróleo:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(parseFloat(num))) {
      return "0,00";
    }
    return parseFloat(num).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular el stock total del sistema (este es el valor que viene del sistema, NO se debe reemplazar)
  const stockTotalSistema = Array.isArray(estanques)
    ? estanques.reduce((total, estanque) => {
        const stockActual =
          estanque.stock_actual !== undefined && estanque.stock_actual !== null
            ? parseFloat(estanque.stock_actual)
            : 0;

        return total + stockActual;
      }, 0)
    : 0;

  // Calcular el porcentaje de capacidad utilizada
  const getCapacidadPorcentaje = (estanque) => {
    if (!estanque || !estanque.capacidad) return 0;
    const stock = estanque.stock_actual || 0;
    return Math.min(100, Math.round((stock / estanque.capacidad) * 100));
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-60 backdrop-blur-sm flex items-start md:items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full md:max-w-5xl max-h-[100vh] md:max-h-[90vh] flex flex-col animate-fadeInScale overflow-hidden"
        style={{ height: isMobile ? "100vh" : "auto" }}
      >
        {/* Encabezado del modal */}
        <div className="bg-orange-600 px-6 py-4 md:px-8 md:py-5 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white text-lg md:text-xl font-semibold tracking-tight">
                {paso === "inicial"
                  ? "Registro de Niveles Iniciales"
                  : "Registro de Niveles Finales"}
              </h2>
              <p className="text-orange-100 text-xs md:text-sm mt-1 max-w-2xl">
                {paso === "inicial"
                  ? "Ingrese las mediciones de altura de combustible antes de la recepción"
                  : "Ingrese las mediciones de altura después de la recepción"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white opacity-80 hover:opacity-100 focus:outline-none p-2 hover:bg-orange-700 rounded-lg transition-all"
              aria-label="Cerrar"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="overflow-y-auto flex-grow bg-gray-50 p-4 md:p-8">
          {/* Alertas */}
          {modalAlert && modalAlert.show && (
            <div ref={errorRef}>
              <InfoBox type={modalAlert.type} message={modalAlert.message} />
            </div>
          )}

          {/* Indicador de progreso */}
          <div className="mb-8 md:mb-12 mt-2 md:mt-4">
            <ProgressIndicator
              steps={["Niveles Iniciales", "Niveles Finales", "Resultados"]}
              currentStep={paso === "inicial" ? 0 : resultadoCalculo ? 2 : 1}
            />
          </div>

          {/* Información de stock en el sistema - 3 tarjetas premium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
            {/* Stock total del sistema */}
            <StatCard
              icon={
                <FaGasPump
                  className="text-orange-600"
                  size={isMobile ? 16 : 20}
                />
              }
              title="Stock Sistema"
              value={formatNumber(stockTotalSistema)}
              colorClass="border-orange-100"
              iconBgClass="bg-orange-100"
            />

            {/* Litros recibidos según guía */}
            <StatCard
              icon={
                <FaOilCan
                  className="text-amber-600"
                  size={isMobile ? 16 : 20}
                />
              }
              title="Litros Guía"
              value={formatNumber(litrosRecibidos)}
              colorClass="border-amber-100"
              iconBgClass="bg-amber-100"
            />
          </div>

          {/* Resultado del cálculo completo */}
          {resultadoCalculo && (
            <div className="mb-6 md:mb-8 bg-white rounded-lg border border-green-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 md:px-5 py-3 border-b border-green-200">
                <h3 className="text-green-800 font-medium flex items-center text-sm md:text-base">
                  <FaCheck className="mr-2 text-green-600" />
                  Cálculo Completado
                </h3>
              </div>

              <div className="p-4 md:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      <span className="text-xs md:text-sm font-medium text-gray-700">
                        Volumen Inicial
                      </span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-800">
                      {formatNumber(resultadoCalculo.volInicial)}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        L
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-xs md:text-sm font-medium text-gray-700">
                        Litros Según Guía
                      </span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-800">
                      {formatNumber(litrosRecibidos)}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        L
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs md:text-sm font-medium text-gray-700">
                        Volumen Final
                      </span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-800">
                      {formatNumber(resultadoCalculo.volFinal)}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        L
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    Math.abs(
                      resultadoCalculo.volFinal -
                        (resultadoCalculo.volInicial + litrosRecibidos)
                    ) > 50
                      ? "bg-red-50 border border-red-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <h4 className="font-medium text-gray-800 mb-3 text-sm md:text-base">
                    Resultado de la Comparación
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                          Volumen inicial:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatNumber(resultadoCalculo.volInicial)} L
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                          Volumen final:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatNumber(resultadoCalculo.volFinal)} L
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                          Litros según guía:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatNumber(litrosRecibidos)} L
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium text-sm">
                          Volumen esperado:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatNumber(
                            resultadoCalculo.volInicial + litrosRecibidos
                          )}{" "}
                          L
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                      <div
                        className={`p-2 rounded-full mt-0.5 mr-3 flex-shrink-0 ${
                          Math.abs(
                            resultadoCalculo.volFinal -
                              (resultadoCalculo.volInicial + litrosRecibidos)
                          ) > 50
                            ? "bg-red-100"
                            : "bg-green-100"
                        }`}
                      >
                        {Math.abs(
                          resultadoCalculo.volFinal -
                            (resultadoCalculo.volInicial + litrosRecibidos)
                        ) > 50 ? (
                          <FaExclamationTriangle
                            className={`text-red-500 ${
                              isMobile ? "text-xs" : "text-sm"
                            }`}
                          />
                        ) : (
                          <FaCheck
                            className={`text-green-500 ${
                              isMobile ? "text-xs" : "text-sm"
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 text-sm mb-1">
                          Diferencia:{" "}
                          {formatNumber(
                            Math.abs(
                              resultadoCalculo.volFinal -
                                (resultadoCalculo.volInicial + litrosRecibidos)
                            )
                          )}{" "}
                          L (
                          {resultadoCalculo.volFinal >
                          resultadoCalculo.volInicial + litrosRecibidos
                            ? "Excedente"
                            : "Faltante"}
                          )
                        </div>
                        <p
                          className={`text-xs ${
                            Math.abs(
                              resultadoCalculo.volFinal -
                                (resultadoCalculo.volInicial + litrosRecibidos)
                            ) > 50
                              ? "text-red-700"
                              : "text-green-700"
                          }`}
                        >
                          {Math.abs(
                            resultadoCalculo.volFinal -
                              (resultadoCalculo.volInicial + litrosRecibidos)
                          ) > 50
                            ? "Se detectó una diferencia significativa. Verificar las mediciones."
                            : "La diferencia está dentro del rango aceptable."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ayuda sobre cómo medir niveles (ícono desplegable) */}
          <div className="mb-4 md:mb-6">
            <button
              onClick={() => setMostrarAyuda(!mostrarAyuda)}
              className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium focus:outline-none transition-colors bg-orange-50 px-3 py-2 md:px-4 md:py-2 rounded-lg w-full md:w-auto justify-center md:justify-start"
            >
              <FaQuestionCircle className="mr-2" />
              <span>Instrucciones para medir</span>
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md text-xs font-medium">
                {mostrarAyuda ? "Ocultar" : "Ver"}
              </span>
            </button>

            {mostrarAyuda && (
              <div className="mt-3 bg-white border border-orange-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                  <h4 className="font-medium text-orange-800 flex items-center text-sm">
                    <FaInfoCircle className="text-orange-600 mr-2" />
                    Cómo medir el nivel de combustible correctamente
                  </h4>
                </div>
                <div className="p-4">
                  <div className="flex">
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium text-gray-800">
                        Siga estos pasos para asegurar una medición precisa:
                      </p>
                      <ol className="list-decimal pl-5 space-y-1.5">
                        <li>
                          Localice la varilla calibrada asignada al estanque.
                        </li>
                        <li>
                          Asegúrese de que la varilla esté completamente seca.
                        </li>
                        <li>
                          Inserte la varilla verticalmente hasta tocar el fondo.
                        </li>
                        <li>
                          Retire la varilla y observe la marca del combustible.
                        </li>
                        <li>
                          Mida la distancia en centímetros desde el fondo.
                        </li>
                      </ol>
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                        <div className="flex">
                          <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                          <p>
                            Es crucial realizar esta medición con precisión. Una
                            diferencia de pocos milímetros puede representar
                            cientos de litros en estanques grandes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Título del paso actual */}
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-6">
            {paso === "inicial"
              ? "Ingrese las alturas iniciales de cada estanque"
              : "Ingrese las alturas finales después de la recepción"}
          </h3>

          {/* Estanques para el paso actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.isArray(estanques) &&
              estanques.map((estanque) => {
                // Simplemente obtenemos las alturas, sin calcular nada
                const alturas = alturasEstanques[estanque.id_estanque] || {};
                const capacidadPorcentaje = getCapacidadPorcentaje(estanque);

                return (
                  <div
                    key={estanque.id_estanque}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-orange-200"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-4 border-b relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800 text-base md:text-lg">
                            {estanque.nombre}
                          </h3>
                          <div className="text-xs text-gray-500 mt-0.5">
                            ID: {estanque.id_estanque}
                          </div>
                        </div>
                        <div className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700">
                          {formatNumber(estanque.capacidad)} L
                        </div>
                      </div>

                      <div className="mt-2 md:mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Stock Actual</span>
                          <span className="font-medium">
                            {formatNumber(estanque.stock_actual || 0)} L (
                            {capacidadPorcentaje}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              capacidadPorcentaje > 75
                                ? "bg-green-500"
                                : capacidadPorcentaje > 30
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${capacidadPorcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <InputNivel
                        label={
                          paso === "inicial" ? "Altura Inicial" : "Altura Final"
                        }
                        value={
                          paso === "inicial"
                            ? alturas.inicial || ""
                            : alturas.final || ""
                        }
                        onChange={(e) => {
                          if (paso === "inicial") {
                            handleAlturaChange(estanque.id_estanque, {
                              inicial: e.target.value,
                              final: alturas.final || "",
                            });
                          } else {
                            handleAlturaChange(estanque.id_estanque, {
                              inicial: alturas.inicial || "",
                              final: e.target.value,
                            });
                          }
                        }}
                        placeholder="Ingrese altura"
                        disabled={loading}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="border-t border-gray-200 px-6 py-4 md:px-8 md:py-5 flex justify-between items-center bg-white sticky bottom-0 z-10 shadow-lg">
          {paso === "inicial" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-medium text-sm shadow-sm"
              >
                Cancelar
              </button>

              <button
                onClick={avanzarANivelesFinales}
                disabled={!nivelesInicialesCompletos() || loading}
                className={`flex items-center px-5 py-2.5 rounded-lg text-white font-medium text-sm shadow-sm transition-all ${
                  !nivelesInicialesCompletos() || loading
                    ? "bg-orange-400 cursor-not-allowed opacity-70"
                    : "bg-orange-600 hover:bg-orange-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setPaso("inicial")}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-medium text-sm shadow-sm"
              >
                <span className="flex items-center">
                  <FaArrowRight className="mr-2 transform rotate-180" />
                  <span className="hidden sm:inline">
                    Volver a Niveles Iniciales
                  </span>
                  <span className="sm:hidden">Volver</span>
                </span>
              </button>

              <button
                onClick={handleCalcular}
                disabled={!nivelesFinalesCompletos() || loading}
                className={`flex items-center px-5 py-2.5 rounded-lg text-white font-medium text-sm shadow-sm ${
                  loading || !nivelesFinalesCompletos()
                    ? "bg-orange-400 cursor-not-allowed opacity-70"
                    : "bg-orange-600 hover:bg-orange-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    <FaCalculator className="mr-2" />
                    <span className="hidden sm:inline">
                      Calcular Diferencia
                    </span>
                    <span className="sm:hidden">Calcular</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstanquesModal;
