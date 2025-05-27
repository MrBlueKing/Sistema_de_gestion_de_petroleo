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

  // Determinar el paso actual basado en el estado
  const getCurrentStep = () => {
    if (resultadoCalculo) return 2; // Paso 3: Resultados
    if (paso === "final") return 1; // Paso 2: Niveles Finales
    return 0; // Paso 1: Niveles Iniciales
  };

  // Función para manejar el cierre del modal
  const handleModalClose = (passStockSistema = false) => {
    if (passStockSistema && typeof onClose === "function") {
      // Pasar el stock del sistema al componente padre
      onClose(stockTotalSistema);
    } else if (typeof onClose === "function") {
      // Cerrar sin pasar datos
      onClose();
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  const currentStep = getCurrentStep();
  const isResultadosStep = currentStep === 2;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-transparent bg-opacity-60 backdrop-blur-sm flex items-start md:items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full md:max-w-7xl max-h-[100vh] md:max-h-[90vh] flex flex-col animate-fadeInScale overflow-hidden"
        style={{ height: isMobile ? "100vh" : "auto" }}
      >
        {/* Encabezado del modal */}
        <div className="bg-orange-600 px-6 py-4 md:px-8 md:py-5 sticky top-0 z-10 ">
          <div className="flex items-center justify-center space-x-4 md:space-x-2">
            {/* Título y descripción */}
            <div className="relative flex-1">
              <h2
                className="absolute inset-0 flex justify-center items-center text-white text md:text-xl font-semibold tracking-tight text-center"
                style={{ right: "-12rem" }} // Ajusta este valor según necesites
              >
                {isResultadosStep
                  ? "Panel de Control de Combustible"
                  : paso === "inicial"
                  ? "Registro de Niveles Iniciales"
                  : "Registro de Niveles Finales"}
              </h2>
            </div>

            {/* Indicador de progreso en el header */}
            <div className="flex items-center space-x-4">
              {/* Tooltip de ayuda */}
              {!isResultadosStep && (
                <div className="relative">
                  <button
                    onClick={() => setMostrarAyuda(!mostrarAyuda)}
                    onMouseEnter={() => setMostrarAyuda(true)}
                    className="text-white opacity-80 hover:opacity-100 focus:outline-none p-2 hover:bg-orange-700 rounded-lg transition-all"
                    aria-label="Ayuda"
                  >
                    <FaQuestionCircle size={16} />
                  </button>

                  {/* Tooltip flotante */}
                  {mostrarAyuda && (
                    <>
                      {/* Overlay transparente para cerrar el tooltip */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMostrarAyuda(false)}
                      />

                      {/* Contenido del tooltip */}
                      <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                          <h4 className="font-medium text-orange-800 flex items-center text-sm">
                            <FaInfoCircle className="text-orange-600 mr-2" />
                            Cómo medir el nivel de combustible
                          </h4>
                        </div>
                        <div className="p-4 max-h-64 overflow-y-auto">
                          <div className="text-sm text-gray-700 space-y-2">
                            <p className="font-medium text-gray-800">
                              Siga estos pasos para una medición precisa:
                            </p>
                            <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                              <li>
                                Localice la varilla calibrada del estanque
                              </li>
                              <li>Asegúrese de que esté completamente seca</li>
                              <li>
                                Inserte verticalmente hasta tocar el fondo
                              </li>
                              <li>Retire y observe la marca del combustible</li>
                              <li>
                                Mida la distancia en centímetros desde el fondo
                              </li>
                            </ol>
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                              <div className="flex">
                                <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                                <p>
                                  Una diferencia de pocos milímetros puede
                                  representar cientos de litros en estanques
                                  grandes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Indicador de progreso compacto */}
              <div className="flex items-center space-x-2">
                {["Inicial", "Final", "Detalle"].map((step, index) => {
                  const isActive = index <= currentStep;
                  const isCurrentStep = index === currentStep;

                  return (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <div
                          className={`h-0.5 w-4 rounded-full transition-colors ${
                            isActive
                              ? "bg-orange-200"
                              : "bg-orange-800 opacity-30"
                          }`}
                        />
                      )}
                      <div className="relative group">
                        <div
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                            isActive
                              ? "bg-white text-orange-600"
                              : "bg-orange-800 text-orange-300 opacity-50"
                          } ${isCurrentStep ? "ring-2 ring-orange-200" : ""}`}
                        >
                          {isActive ? (
                            index < currentStep ? (
                              <FaCheck className="w-2.5 h-2.5" />
                            ) : (
                              index + 1
                            )
                          ) : (
                            index + 1
                          )}
                        </div>
                        {/* Tooltip del paso */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none">
                          {step}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => handleModalClose(false)}
                className="text-white opacity-80 hover:opacity-100 focus:outline-none p-2 hover:bg-orange-700 rounded-lg transition-all"
                aria-label="Cerrar"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="overflow-y-auto flex-grow bg-gray-50 p-4 md:p-6">
          {/* Alertas */}
          {modalAlert && modalAlert.show && (
            <div ref={errorRef}>
              <InfoBox type={modalAlert.type} message={modalAlert.message} />
            </div>
          )}

          {/* DISEÑO COMPLETAMENTE NUEVO PARA RESULTADOS */}
          {isResultadosStep && resultadoCalculo ? (
            <div className="space-y-4">
              {/* Dashboard Principal */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Panel principal - Métricas y análisis */}
                <div className="xl:col-span-3 space-y-4">
                  {/* Fila superior - Métricas clave */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Stock Sistema */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                            Stock Sistema
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {formatNumber(stockTotalSistema)}
                          </p>
                          <p className="text-blue-200 text-xs">
                            Litros totales
                          </p>
                        </div>
                        <FaGasPump className="text-blue-200 text-2xl opacity-80" />
                      </div>
                    </div>

                    {/* Medición Inicial */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                            Inicial
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {formatNumber(resultadoCalculo.volInicial)}
                          </p>
                          <p className="text-orange-200 text-xs">
                            Antes recepción
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-orange-900 font-bold text-sm">
                            1
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Litros Guía */}
                    <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">
                            Según Guía
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {formatNumber(litrosRecibidos)}
                          </p>
                          <p className="text-amber-200 text-xs">Documentado</p>
                        </div>
                        <FaOilCan className="text-amber-200 text-2xl opacity-80" />
                      </div>
                    </div>

                    {/* Medición Final */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-xs font-medium uppercase tracking-wide">
                            Final
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {formatNumber(resultadoCalculo.volFinal)}
                          </p>
                          <p className="text-green-200 text-xs">
                            Después recepción
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                          <span className="text-green-900 font-bold text-sm">
                            2
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análisis detallado */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <FaCalculator className="mr-2 text-orange-500" />
                        Detalles del Cálculo
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Volúmenes medidos */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">
                          Volúmenes Inicial
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">
                              Volumen inicial:
                            </span>
                            <span className="font-semibold">
                              {formatNumber(resultadoCalculo.volInicial)} L
                            </span>
                          </div>

                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">
                              Litros según guía:
                            </span>
                            <span className="font-semibold">
                              {formatNumber(litrosRecibidos)} L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-blue-700 font-medium">
                              Volumen esperado:
                            </span>
                            <span className="font-bold text-blue-800">
                              {formatNumber(
                                resultadoCalculo.volInicial + litrosRecibidos
                              )}{" "}
                              L
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cálculos derivados */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">
                          Volúmenes Finales
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">
                              Volumen final:
                            </span>
                            <span className="font-semibold">
                              {formatNumber(resultadoCalculo.volFinal)} L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">
                              Litros ingresados (medido):
                            </span>
                            <span className="font-semibold">
                              {formatNumber(
                                resultadoCalculo.volFinal -
                                  resultadoCalculo.volInicial
                              )}{" "}
                              L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Diferencia:</span>
                            <span
                              className={`font-semibold flex items-center ${(() => {
                                const litrosMedidos =
                                  resultadoCalculo.volFinal -
                                  resultadoCalculo.volInicial;
                                const diferencia =
                                  litrosMedidos - litrosRecibidos;

                                if (Math.abs(diferencia) <= 0.5) {
                                  return "text-gray-600";
                                } else if (diferencia > 0) {
                                  return "text-green-600";
                                } else {
                                  return "text-red-600";
                                }
                              })()}`}
                            >
                              {(() => {
                                const litrosMedidos =
                                  resultadoCalculo.volFinal -
                                  resultadoCalculo.volInicial;
                                const diferencia =
                                  litrosMedidos - litrosRecibidos;
                                const esExcedente = diferencia > 0;

                                return (
                                  <>
                                    {Math.abs(diferencia) > 0.5 && (
                                      <span className="mr-1">
                                        {esExcedente ? "📈" : "📉"}
                                      </span>
                                    )}
                                    {formatNumber(Math.abs(diferencia))} L (
                                    {esExcedente ? "Excedente" : "Faltante"})
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Diseño original para pasos 1 y 2 */}
              {!resultadoCalculo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                  <StatCard
                    icon={
                      <FaGasPump
                        className="text-orange-600"
                        size={isMobile ? 18 : 22}
                      />
                    }
                    title="Stock Sistema"
                    value={formatNumber(stockTotalSistema)}
                    colorClass="border-orange-100"
                    iconBgClass="bg-orange-100"
                  />

                  <StatCard
                    icon={
                      <FaOilCan
                        className="text-amber-600"
                        size={isMobile ? 18 : 22}
                      />
                    }
                    title="Litros Guía"
                    value={formatNumber(litrosRecibidos)}
                    colorClass="border-amber-100"
                    iconBgClass="bg-amber-100"
                  />
                </div>
              )}

              {/* Sección de ingreso de alturas - SOLO se muestra si NO estamos en el paso de resultados */}
              {!isResultadosStep && (
                <>
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
                        const alturas =
                          alturasEstanques[estanque.id_estanque] || {};
                        const capacidadPorcentaje =
                          getCapacidadPorcentaje(estanque);

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
                                    {formatNumber(estanque.stock_actual || 0)} L
                                    ({capacidadPorcentaje}%)
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
                                  paso === "inicial"
                                    ? "Altura Inicial"
                                    : "Altura Final"
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
                </>
              )}
            </>
          )}
        </div>

        {/* Pie del modal */}
        <div className="border-t border-gray-200 px-6 py-4 md:px-8 md:py-5 flex justify-between items-center bg-white sticky bottom-0 z-10 shadow-lg">
          {isResultadosStep ? (
            // Botones para el paso de resultados
            <>
              <button
                onClick={() => {
                  setResultadoCalculo(null);
                  setPaso("final");
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-medium text-sm shadow-sm"
              >
                <span className="flex items-center">
                  <FaArrowRight className="mr-2 transform rotate-180" />
                  <span className="hidden sm:inline">Volver a Editar</span>
                  <span className="sm:hidden">Volver</span>
                </span>
              </button>
              <button
                onClick={() => handleModalClose(true)} // ← Pasar true para enviar el stock
                className="flex items-center px-5 py-2.5 rounded-lg text-white font-medium text-sm shadow-sm bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <FaCheck className="mr-2" />
                <span>Confirmar </span>
              </button>
            </>
          ) : paso === "inicial" ? (
            // Botones para el paso inicial
            <>
              <button
                onClick={() => handleModalClose(false)}
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
            // Botones para el paso final
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
